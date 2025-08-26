targetScope = 'subscription'

param rgName string
param rgLocation string
param containerAppEnvName string
param frontendAppName string
param frontendAppImage string
param containerRegistryName string
param suffix string = uniqueString(rgName)

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: rgName
  location: rgLocation
  tags: {}
}

module containerRegistry './container-registry.bicep' = {
  name: 'containerRegistryDeploy-${suffix}'
  params: {
    containerRegistryName: containerRegistryName
  }
  scope: resourceGroup(rg.name)
}

module containerAppEnv './container-app-env.bicep' = {
  name: 'containerAppEnv-${suffix}'
  params: {
    containerAppEnvName: containerAppEnvName
  }
  scope: resourceGroup(rg.name)
}

module containerApp './container-app.bicep' = {
  name: 'containerAppDeploy-${suffix}'
  params: {
    frontendAppName: frontendAppName
    frontendAppImage: frontendAppImage
    containerAppEnvName: containerAppEnvName
    containerRegistryName: containerRegistryName
  }
  scope: resourceGroup(rg.name)
  dependsOn: [
    containerAppEnv
    containerRegistry
  ]
}

output containerAppFqdn string = containerApp.outputs.frontendAppFqdn
