param apiAppName string
param apiAppImage string
param aiFoundryName string
param aiFoundryProjectName string
param aiFoundryChatAgentName string
param containerAppEnvName string
param containerRegistryName string

resource apiApp 'Microsoft.App/containerApps@2025-02-02-preview' = {
  name: apiAppName
  location: resourceGroup().location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'Auto'
      }
      registries: [
        {
          server: '${containerRegistry.name}.azurecr.io'
          identity: managedIdentity.id
        }
      ]
    }
    
    environmentId: containerAppEnv.id
    template: {
      containers: [
        {
          name: apiAppName
          image: apiAppImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'AI_FOUNDRY_ENDPOINT'
              value: 'https://${aiFoundryName}.services.ai.azure.com/api/projects/${aiFoundryProjectName}'
            }
            {
              name: 'AGENT_NAME'
              value: aiFoundryChatAgentName
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// Print the FQDN of the API app
output apiAppFqdn string = apiApp.properties.configuration.ingress.fqdn

// Reference resource containerAppEnv so I can reference containerAppEnv.id
resource containerAppEnv 'Microsoft.App/managedEnvironments@2025-02-02-preview' existing = {
  name: containerAppEnvName
}

// Reference Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-05-01-preview' existing = {
  name: containerRegistryName
}

// Reference Managed Identity
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2025-01-31-preview' existing = {
  name: 'acrManagedIdentity'
}
