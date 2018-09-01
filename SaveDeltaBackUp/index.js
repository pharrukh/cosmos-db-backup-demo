const storage = require('azure-storage')
const unixTimestamp = require('unix-timestamp')
var config = require("../config")
const collectionId = config.collection.id
const databaseId = config.database.id
var documentClient = require("documentdb").DocumentClient
const uriFactory = require('documentdb').UriFactory
var client = new documentClient(config.endpoint, {
    "masterKey": config.primaryKey
})

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString()
    var tableService = storage.createTableService(config.storageAccountName, config.storageAccountKey)
    return new Promise((resolve, reject) => {
            tableService.createTableIfNotExists(config.tableName, function (error, result, response) {
                if (!error) {
                    context.log(response)
                    context.log('\n\nTABLE EXISTS')
                    resolve()
                } else {
                    reject(error)
                }
            })
        }).then(_ => {
            return new Promise((resolve, reject) => {
                tableService.retrieveEntity(config.tableName, 'SigleRecordPartitionKey', 'SingleRecordRowKey', function (error, result, response) {
                    if (!error) {
                        context.log(response)
                        context.log('\n\nMADE A QUERY TO TABLE')
                        resolve(result)
                    } else if (error.statusCode === 404) {
                        resolve()
                    } else {
                        context.log(JSON.stringify(error, null, 2))
                        reject(error)
                    }
                })
            })
        })
        .then(lastUpdateRecord => {
            context.log(`Table record ${JSON.stringify(lastUpdateRecord,null,2)}`)
            let lastUpdateDateTime
            if (!lastUpdateRecord)
                lastUpdateDateTime = new Date()
            else
                lastUpdateDateTime = new Date(lastUpdateRecord.Timestamp._)

            context.log(`Last query time was ${JSON.stringify(lastUpdateDateTime,null,2)}`)
            context.log(`Querying collection through index:\n${collectionId}`)
            let collectionUrl = uriFactory.createDocumentCollectionUri(databaseId, collectionId)
            const timestamp = Math.round(unixTimestamp.fromDate(lastUpdateDateTime))
            context.log('timestamp= ' + timestamp)
            context.log('typeof(timestamp)= ' + typeof Math.round(timestamp))

            return new Promise((resolve, reject) => {
                client.queryDocuments(
                    collectionUrl,
                    `SELECT * FROM c WHERE c._ts > ${timestamp}`
                ).toArray((err, results) => {
                    if (err) reject(err)
                    else {
                        context.log(`Retrieved ${results.length} records`)
                        resolve(results)
                    }
                })
            })
        }).then(delta => {
            context.log(`delta:` + JSON.stringify(delta, null, 2))
            if (delta.length == 0) {
                context.log('Nothing to backup.')
                return Promise.resolve()
            }

            var blobService = storage.createBlobService(config.storageAccountName, config.storageAccountKey);
            var fs = require('fs');
            return new Promise((resolve, reject) => {
                blobService.createContainerIfNotExists('backupscontainer', {
                    publicAccessLevel: 'blob'
                }, function (error, result, response) {
                    if (!error) {
                        context.log(`Is Container available? ${JSON.stringify(result.lease.state,null,2)}`)
                        resolve()
                    } else {
                        context.log(JSON.stringify(error, null, 2))
                        reject(error)
                    }
                })
            }).then(_ => {
                return new Promise((resolve, reject) => {
                    blobService.createBlockBlobFromText('backupscontainer', `${(new Date()).toISOString()}.json`, JSON.stringify(delta), function (error, result, response) {
                        if (!error) {
                            context.log(result)
                            resolve()
                        } else {
                            context.log(JSON.stringify(error, null, 2))
                            reject(error)
                        }
                    })
                })
            }).then(_ => {
                var entGen = storage.TableUtilities.entityGenerator;
                var entity = {
                    PartitionKey: entGen.String('SigleRecordPartitionKey'),
                    RowKey: entGen.String('SingleRecordRowKey'),
                };
                return new Promise((resolve, reject) => {
                    tableService.insertOrReplaceEntity(config.tableName, entity, function (error, result, response) {
                        if (!error) {
                            context.log(response)
                            resolve(result)
                        } else {
                            context.log(JSON.stringify(error, null, 2))
                            reject(error)
                        }
                    })
                })
            })
        })
}