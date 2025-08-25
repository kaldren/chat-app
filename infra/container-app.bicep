param containerAppName string
param containerAppImage string
param containerAppEnvName string

resource containerApp 'Microsoft.App/containerApps@2025-02-02-preview' = {
  name: containerAppName
  location: resourceGroup().location
  properties: {
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'Auto'
      }
    }
    
    environmentId: containerAppEnv.id
    template: {
      containers: [
        {
          name: containerAppName
          image: containerAppImage
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

// Print the FQDN of the container app
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn

// Reference resource containerAppEnv so I can reference containerAppEnv.id
resource containerAppEnv 'Microsoft.App/managedEnvironments@2025-02-02-preview' existing = {
  name: containerAppEnvName
}
