param frontendAppName string
param frontendAppImage string
param containerAppEnvName string
param containerRegistryName string

resource frontendApp 'Microsoft.App/containerApps@2025-02-02-preview' = {
  name: frontendAppName
  location: resourceGroup().location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'Auto'
      }
      registries: [
        {
          server: '${containerRegistry.name}.azurecr.io'
          identity: 'system'
        }
      ]
    }
    
    environmentId: containerAppEnv.id
    template: {
      containers: [
        {
          name: frontendAppName
          image: frontendAppImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// AcrPull role on the registry for this container app identity
resource acrPullFrontend 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, frontendApp.id, 'acrpull-frontend')
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
    )
    principalId: frontendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Print the FQDN of the frontend app
output frontendAppFqdn string = frontendApp.properties.configuration.ingress.fqdn

// Reference resource containerAppEnv so I can reference containerAppEnv.id
resource containerAppEnv 'Microsoft.App/managedEnvironments@2025-02-02-preview' existing = {
  name: containerAppEnvName
}

// Reference Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-05-01-preview' existing = {
  name: containerRegistryName
}
