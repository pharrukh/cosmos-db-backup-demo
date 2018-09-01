# cosmos-db-backup-demo
Answer to question here: https://stackoverflow.com/questions/52111269/how-to-backup-azure-cosmos-db-with-azure-function-app

To deploy resources to Azure run `source setup_env.sh`.

`config.json` should be in the root and have the following structure:

```JSON
{
  "tableName": "lastupdatetimedemo",
  "storageAccountName": "demo0storage0account",
  "storageAccountKey": "",
  "database": {
    "id": "cdb-db-demo"
  },
  "collection": {
    "id": "cdb-col-demo"
  },
  "endpoint": "",
  "primaryKey": ""
}
```