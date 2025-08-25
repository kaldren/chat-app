targetScope = 'subscription'

param rgName string
param rgLocation string
param containerAppEnvName string
param containerAppName string
param containerAppImage string
param suffix string = uniqueString(rgName)

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: rgName
  location: rgLocation
  tags: {}
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
    containerAppName: containerAppName
    containerAppImage: containerAppImage
    containerAppEnvName: containerAppEnvName
  }
  scope: resourceGroup(rg.name)
  dependsOn: [
    containerAppEnv
  ]
}

output containerAppFqdn string = containerApp.outputs.containerAppFqdn
