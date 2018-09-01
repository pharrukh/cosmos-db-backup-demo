DEMO_RESOURCE_GROUP_NAME="RG_Demo"
LOCATION="westeurope"
STORAGE_ACCOUNT_NAME="demo0storage0account"
FUNCTION_APP_NAME="fn-cosmos-db-backup-demo"
COSMOSDB_ACCOUNT_NAME="cdb-account-demo"
COSMOSDB_DATABASE_NAME="cdb-db-demo"
COSMOSDB_COLLECTION_NANE="cdb-col-demo"

az group create \
    --name $DEMO_RESOURCE_GROUP_NAME \
    --location $LOCATION

az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $DEMO_RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2

az functionapp create \
    --resource-group $DEMO_RESOURCE_GROUP_NAME \
    --consumption-plan-location $LOCATION \
    --name $FUNCTION_APP_NAME \
    --storage-account $STORAGE_ACCOUNT_NAME

# Create a DocumentDB API Cosmos DB account
az cosmosdb create \
    --name $COSMOSDB_ACCOUNT_NAME \
    --kind GlobalDocumentDB \
    --resource-group $DEMO_RESOURCE_GROUP_NAME \
    --max-interval 10 \
    --max-staleness-prefix 200 

# Create a database 
az cosmosdb database create \
    --name $COSMOSDB_ACCOUNT_NAME \
    --db-name $COSMOSDB_DATABASE_NAME \
    --resource-group $DEMO_RESOURCE_GROUP_NAME

# Create a collection
az cosmosdb collection create \
    --collection-name $COSMOSDB_COLLECTION_NANE \
    --name $COSMOSDB_ACCOUNT_NAME \
    --db-name $COSMOSDB_DATABASE_NAME \
    --resource-group $DEMO_RESOURCE_GROUP_NAME

# Clean up methods
# az group delete --name $DEMO_RESOURCE_GROUP_NAME