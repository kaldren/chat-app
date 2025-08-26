param containerRegistryName string

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-05-01-preview' = {
  name: containerRegistryName
  location: resourceGroup().location
  properties: {
  }
  sku: {
    name: 'Basic'
  }
  tags: {
    environment: 'demo'
  }
}
