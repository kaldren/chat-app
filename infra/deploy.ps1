# 1. Deploy infra up to ACR and managed identity (skip container app)
Write-Host "Deploying infra (ACR, managed identity, etc)..."
az deployment sub create `
    --name infra-step1 `
    --location eastus `
    --template-file main.bicep `
    --parameters main.parameters.json `
    --parameters deployContainerApp=false  # <-- Use a parameter or comment out the module in Bicep

if ($LASTEXITCODE -ne 0) {
    Write-Error "Infra deployment failed"
    exit 1
}

# 2. Build and push Docker image
$acrName = "crdemoeus82625"  # e.g. myregistry
$apiImage = "$acrName.azurecr.io/api:latest"
$apiPath = "..\src\api"  # adjust path as needed

Write-Host "Building Docker image..."
docker build -t $apiImage $apiPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

Write-Host "Logging in to ACR..."
az acr login --name $acrName
if ($LASTEXITCODE -ne 0) {
    Write-Error "ACR login failed"
    exit 1
}

Write-Host "Pushing Docker image to ACR..."
docker push $apiImage
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed"
    exit 1
}

# 3. Deploy the rest (including container app)
Write-Host "Deploying container app and remaining resources..."
az deployment sub create `
    --name infra-step2 `
    --location eastus `
    --template-file main.bicep `
    --parameters main.parameters.json `
    --parameters deployContainerApp=true  # <-- Or uncomment the module in Bicep

if ($LASTEXITCODE -ne 0) {
    Write-Error "Final deployment failed"
    exit 1
}

Write-Host "Deployment complete!"