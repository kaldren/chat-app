targetScope = 'subscription'

@description('Name of the resource group to create.')
param rgName string

@description('Azure region for the resource group.')
param rgLocation string

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: rgName
  location: rgLocation
  tags: {}
}

output rgId string = rg.id
