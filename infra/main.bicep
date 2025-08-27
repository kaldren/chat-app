targetScope = 'subscription'

param rgName string
param rgLocation string
param containerAppEnvName string
param apiAppName string
param apiAppImage string
param containerRegistryName string
param aiFoundryName string
param aiProjectName string
param chatAgentModel string
param suffix string = substring(uniqueString(rgName), 0, 4)
param deployContainerApp bool = false

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: rgName
  location: rgLocation
  tags: {}
}

module containerRegistry './container-registry.bicep' = {
  name: 'containerRegistryDeploy${suffix}'
  params: {
    containerRegistryName: containerRegistryName
  }
  scope: resourceGroup(rg.name)
}

module managedIdentity './managed-identity-acr.bicep' = {
  name: 'managedIdentityDeploy-${suffix}'
  params: {
    containerRegistryName: containerRegistryName
  }
  scope: resourceGroup(rg.name)
}

module aifoundry './aifoundry.bicep' = {
  name: 'aiFoundryDeploy-${suffix}'
  params: {
    aiFoundryName: aiFoundryName
    aiProjectName: aiProjectName
    chatAgentModel: chatAgentModel
  }
  scope: resourceGroup(rg.name)
  dependsOn: [
    managedIdentity
  ]
}

module containerAppEnv './container-app-env.bicep' = {
  name: 'containerAppEnv${suffix}'
  params: {
    containerAppEnvName: containerAppEnvName
  }
  scope: resourceGroup(rg.name)
}

module containerApp './container-app.bicep' = if (deployContainerApp) {
  name: 'containerAppDeploy-${suffix}'
  params: {
    apiAppName: apiAppName
    apiAppImage: apiAppImage
    containerAppEnvName: containerAppEnvName
    containerRegistryName: containerRegistryName
  }
  scope: resourceGroup(rg.name)
  dependsOn: [
    containerAppEnv
    containerRegistry
    managedIdentity
  ]
}

// Only print this if containerApp is deployed: 
output containerAppFqdn string = (deployContainerApp ? containerApp.outputs.apiAppFqdn : '')
