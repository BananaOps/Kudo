# Kudo Helm Chart

A Helm chart for deploying [Kudo](https://github.com/BananaOps/kudo), an open-source peer recognition platform powered by Slack.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- A Slack app with OAuth and bot token configured

## Installation

```bash
helm install kudo oci://ghcr.io/bananaops/charts/kudo \
  --set env.slack.signingSecret=<your-signing-secret> \
  --set env.slack.botToken=<your-bot-token> \
  --set env.slack.clientId=<your-client-id> \
  --set env.slack.clientSecret=<your-client-secret> \
  --set env.app.url=https://kudo.example.com \
  --set env.app.sessionSecret=<random-secret>
```

Or with a values file:

```bash
helm install kudo oci://ghcr.io/bananaops/charts/kudo -f my-values.yaml
```

## Configuration

### Core parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `bananaops/kudo` |
| `image.tag` | Image tag (defaults to chart appVersion) | `""` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### MongoDB

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mongodb.enabled` | Deploy bundled MongoDB | `true` |
| `mongodb.auth.enabled` | Enable MongoDB authentication | `false` |
| `env.mongodb.uri` | Full MongoDB URI (overrides auto-generated) | `""` |
| `env.mongodb.db` | Database name | `kudo` |

To use an external MongoDB:

```yaml
mongodb:
  enabled: false
env:
  mongodb:
    uri: "mongodb://user:pass@mongo.example.com:27017"
    db: kudo
```

### Slack

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env.slack.signingSecret` | Slack signing secret (required) | `""` |
| `env.slack.botToken` | Slack bot token (required) | `""` |
| `env.slack.clientId` | Slack OAuth client ID | `""` |
| `env.slack.clientSecret` | Slack OAuth client secret | `""` |

### Application

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env.app.url` | Public URL (used for OAuth redirect) | `http://kudo.local` |
| `env.app.workspaceId` | Default Slack workspace ID | `""` |
| `env.app.sessionSecret` | Cookie signing secret | `change-me-in-production` |
| `env.app.adminUserIds` | Comma-separated Slack user IDs for admins | `""` |

### Service & Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Kubernetes Service type | `ClusterIP` |
| `service.http.port` | HTTP port | `8080` |
| `ingress.enabled` | Enable Ingress | `false` |
| `ingress.className` | Ingress class | `traefik` |
| `gateway.enabled` | Enable HTTPRoute (Gateway API) | `false` |

**Ingress example:**

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: kudo.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: kudo-tls
      hosts:
        - kudo.example.com
env:
  app:
    url: https://kudo.example.com
```

### Resources & Autoscaling

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.cpu` | CPU limit | `250m` |
| `resources.limits.memory` | Memory limit | `128Mi` |
| `autoscaling.enabled` | Enable HPA | `false` |
| `autoscaling.minReplicas` | Min replicas | `1` |
| `autoscaling.maxReplicas` | Max replicas | `2` |

## Upgrading

```bash
helm upgrade kudo oci://ghcr.io/bananaops/charts/kudo -f my-values.yaml
```

## Uninstalling

```bash
helm uninstall kudo
```
