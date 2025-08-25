param containerAppEnvName string

resource containerAppEnv 'Microsoft.App/managedEnvironments@2025-02-02-preview' = {
  name: containerAppEnvName
  location: resourceGroup().location
  properties: {
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    environment: 'demo'
  }
}
