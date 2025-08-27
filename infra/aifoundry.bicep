param aiFoundryName string
param aiProjectName string
param chatAgentModel string

resource aiFoundry 'Microsoft.CognitiveServices/accounts@2025-06-01' = {
  name: aiFoundryName
  location: resourceGroup().location
  kind: 'AIServices'
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'S0'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    customSubDomainName: aiFoundryName
    allowProjectManagement: true
    disableLocalAuth: false
  }
}

resource aiProject 'Microsoft.CognitiveServices/accounts/projects@2025-04-01-preview' = {
  name: aiProjectName
  location: resourceGroup().location
  properties: {
    displayName: 'project'
    description: 'AI Foundry Project'
  }
  identity: {
    type: 'SystemAssigned'
  }
  parent: aiFoundry
}

resource modelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-04-01-preview'= {
  parent: aiFoundry
  name: chatAgentModel
  sku : {
    capacity: 1
    name: 'GlobalStandard'
  }
  properties: {
    model:{
      name: chatAgentModel
      format: 'OpenAI'
    }
  }
}
