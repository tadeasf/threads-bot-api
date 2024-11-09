# Threads Bot API

A NestJS API for automating Threads posts with OAuth2 authentication.

## Installation

```bash
bun install
```

## Configuration

1. Create a `.env` file in the root directory:

```env
# App Configuration
THREADS_APP_ID=your_app_id
THREADS_APP_SECRET=your_app_secret
THREADS_REDIRECT_URI=https://threads-bot-api.loca.lt/threads/callback
```

2. Configure Meta App Settings:
- Add domain: `https://threads-bot-api.loca.lt`
- Add to Valid OAuth Redirect URIs: `https://threads-bot-api.loca.lt/threads/callback`
- Set Match Type: `Match prefix`
- Set Prefetch: `HTML`

## Running with HTTPS (Development)

The Threads API requires HTTPS. We use Docker and localtunnel to handle this:

1. Start the services:
```bash
docker-compose up -d
```

2. Get the tunnel password:
```bash
# Check localtunnel logs for the password
docker-compose logs localtunnel | grep "Tunnel Password"
```

3. Your API will be available at:
- HTTPS: https://threads-bot-api.loca.lt
  - First-time visitors will need the tunnel password
  - Password is your public IP (shown in localtunnel logs)
- Local: http://localhost:3000

4. Share the tunnel password with your testers/users

3. Check the logs:
```bash
# All services
docker-compose logs -f

# Just API
docker-compose logs -f api

# Just localtunnel
docker-compose logs -f localtunnel
```

4. Stop the services:
```bash
docker-compose down
```

## Authentication Flow

The API implements OAuth2 authentication for Threads with CSRF protection:

1. **Get Authorization URL or Direct Redirect**
   ```bash
   # Get URL as JSON
   curl https://threads-bot-api.loca.lt/threads/auth
   
   # Direct redirect to Threads auth page
   curl -L https://threads-bot-api.loca.lt/threads/auth?redirect=true
   ```

2. **User Authorization**
   - User authorizes your app on Threads
   - Threads redirects back with auth code and state

3. **Exchange Code for Token**
   ```bash
   # Handled automatically by callback endpoint
   GET /threads/callback?code=AUTHORIZATION_CODE&state=STATE_TOKEN
   ```

4. **Using the Token**
   ```bash
   curl -X POST https://threads-bot-api.loca.lt/threads/post \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "text": "Hello from API!",
       "mediaUrls": ["https://example.com/image.jpg"]
     }'
   ```

## Development

```bash
# Run locally
bun run start:dev

# Run with Docker
docker-compose up
```

## Example Usage

1. Start auth flow (two options):
```bash
# Get auth URL
curl https://threads-bot-api.loca.lt/threads/auth

# Or redirect directly
curl -L https://threads-bot-api.loca.lt/threads/auth?redirect=true
```

2. Complete authorization on Threads

3. Automatic callback handling with:
   - CSRF verification
   - Error handling
   - Token generation

4. Create a post:
```bash
curl -X POST https://threads-bot-api.loca.lt/threads/post \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from API!",
    "mediaUrls": ["https://example.com/image.jpg"]
  }'
```

## API Documentation

- Swagger UI: http://localhost:3000/api
- Scalar Docs: http://localhost:3000/docs

## Permissions

The API requires the following Threads permissions:
- `threads_basic` - Basic profile access
- `threads_content_publish` - Ability to create posts
- `threads_manage_insights` (optional) - Access to post insights
- `threads_manage_replies` (optional) - Manage post replies
- `threads_read_replies` (optional) - Read post replies

## Security Features

- CSRF protection with state parameter
- Environment variable validation
- Automatic state cleanup (30-minute expiry)
- Comprehensive error handling
- Request validation
- Secure token handling

## Error Handling

The API handles:
- Invalid/expired state tokens
- Missing authorization codes
- Failed token exchanges
- Invalid tokens
- Missing permissions
- Rate limits
- Configuration errors

## Security Notes

- Never commit `.env` file
- Store tokens securely
- Use HTTPS in production
- Validate redirect URIs
- Implement rate limiting
- Monitor state token usage

## Monitoring

The API includes built-in monitoring with Grafana and Prometheus:

1. Access dashboards:
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

2. Available metrics:
- API health status
- Tunnel connectivity
- Request rates
- Error rates
- Token usage
- Rate limit status

3. Alerts:
- Tunnel disconnection
- High error rates
- Rate limit warnings
- Token expiration

## Detailed Deployment Guide

### 1. Initial Setup

1. **Container Registry Setup**
   ```bash
   # 1. Login to GitHub Container Registry
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   
   # 2. Configure Registry Visibility
   gh api \
     --method PUT \
     -H "Accept: application/vnd.github+json" \
     /user/packages/container/threads-bot-api/visibility \
     -f visibility='public'
   ```

2. **Kubernetes Setup**
   ```bash
   # 1. Create namespace
   kubectl create namespace threads-bot
   
   # 2. Create secrets
   kubectl create secret generic threads-bot-secrets \
     --from-file=.env.production \
     --namespace threads-bot
   
   # 3. Apply configurations
   kubectl apply -f k8s/ --namespace threads-bot
   ```

3. **SSL/TLS Configuration**
   ```bash
   # 1. Install cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
   
   # 2. Create ClusterIssuer
   kubectl apply -f k8s/cert-issuer.yaml
   
   # 3. Verify certificates
   kubectl get certificates -n threads-bot
   ```

### 2. Development Deployment

1. **Local Development**
   ```bash
   # 1. Start with monitoring
   docker compose -f docker-compose.yml \
                 -f docker-compose.monitor.yml \
                 up -d
   
   # 2. Watch logs
   docker compose logs -f api
   
   # 3. Access services
   open http://localhost:3000  # API
   open http://localhost:3001  # Grafana
   open http://localhost:9090  # Prometheus
   ```

2. **Preview Environments**
   ```bash
   # 1. Create preview
   ./scripts/deploy.sh --env preview --pr 123
   
   # 2. Cleanup preview
   ./scripts/cleanup-preview.sh --pr 123
   ```

### 3. Production Deployment

1. **Manual Deployment**
   ```bash
   # 1. Build and tag
   docker build -t ghcr.io/username/threads-bot-api:v1.0.0 .
   docker push ghcr.io/username/threads-bot-api:v1.0.0
   
   # 2. Deploy
   DEPLOY_ENV=production ./scripts/deploy.sh --version v1.0.0
   
   # 3. Verify
   kubectl get pods -n threads-bot
   kubectl logs -f deployment/threads-bot -n threads-bot
   ```

2. **Automated Release**
   ```bash
   # 1. Create and push tag
   git tag v1.0.0
   git push origin v1.0.0
   
   # 2. Monitor workflow
   gh workflow view release
   
   # 3. Verify deployment
   ./scripts/verify-deployment.sh v1.0.0
   ```

### 4. Rollback Procedures

1. **Automatic Rollback**
   ```bash
   # Triggered on failed health checks
   ./scripts/rollback.sh --last-stable
   ```

2. **Manual Rollback**
   ```bash
   # To specific version
   ./scripts/rollback.sh --version v0.9.0
   
   # Verify rollback
   curl https://your-domain.com/health
   ```

## Monitoring Setup

### 1. Grafana Dashboards

1. **API Overview Dashboard**
   ```json
   {
     "title": "API Overview",
     "panels": [
       {
         "title": "Request Rate",
         "type": "graph",
         "datasource": "Prometheus",
         "targets": [
           {
             "expr": "rate(http_requests_total[5m])"
           }
         ]
       },
       {
         "title": "Error Rate",
         "type": "graph",
         "targets": [
           {
             "expr": "rate(http_errors_total[5m])"
           }
         ]
       },
       {
         "title": "Response Time",
         "type": "gauge",
         "targets": [
           {
             "expr": "http_request_duration_seconds"
           }
         ]
       }
     ]
   }
   ```

2. **Tunnel Status Dashboard**
   ```json
   {
     "title": "Tunnel Status",
     "panels": [
       {
         "title": "Tunnel Uptime",
         "type": "stat",
         "targets": [
           {
             "expr": "tunnel_uptime_seconds"
           }
         ]
       },
       {
         "title": "Connection Issues",
         "type": "timeseries",
         "targets": [
           {
             "expr": "tunnel_connection_errors_total"
           }
         ]
       }
     ]
   }
   ```

### 2. Alert Rules

1. **API Alerts**
   ```yaml
   groups:
     - name: api
       rules:
         - alert: HighErrorRate
           expr: rate(http_errors_total[5m]) > 0.1
           for: 5m
           labels:
             severity: critical
         - alert: SlowResponses
           expr: http_request_duration_seconds > 2
           for: 5m
           labels:
             severity: warning
   ```

2. **Tunnel Alerts**
   ```yaml
   groups:
     - name: tunnel
       rules:
         - alert: TunnelDown
           expr: tunnel_up == 0
           for: 1m
           labels:
             severity: critical
         - alert: TunnelLatency
           expr: tunnel_latency_seconds > 1
           for: 5m
           labels:
             severity: warning
   ```

### 3. Monitoring Access

1. **Local Access**
   ```bash
   # Grafana
   open http://localhost:3001
   # Default credentials: admin/admin
   
   # Prometheus
   open http://localhost:9090
   
   # AlertManager
   open http://localhost:9093
   ```

2. **Production Access**
   ```bash
   # Port forward services
   kubectl port-forward svc/grafana 3001:3000 -n monitoring
   kubectl port-forward svc/prometheus 9090:9090 -n monitoring
   kubectl port-forward svc/alertmanager 9093:9093 -n monitoring
   ```

## CI/CD Configuration

### GitHub Actions Workflows

1. **Pull Request (`pr.yml`)**
   - Triggered on PRs to main branch
   - Runs tests, lint, and type checks using Bun
   - Creates preview deployment
   - Required secrets: `DOCKER_REGISTRY`

2. **Main Branch (`main.yml`)**
   - Triggered on pushes to main
   - Builds and deploys to production
   - Runs smoke tests
   - Automatic rollback on failure
   - Required secrets:
     - `DOCKER_REGISTRY`
     - `KUBECONFIG`
     - `PRODUCTION_URL`

3. **Security Scan (`security.yml`)**
   - Daily security scans
   - Runs on main branch pushes
   - Uses Trivy and CodeQL
   - Creates issues for vulnerabilities
   - Required secrets: None
   - Required variables:
     - `DOCKER_REGISTRY`

4. **Release (`release.yml`)**
   - Triggered on version tags (`v*`)
   - Creates GitHub releases
   - Builds and tags Docker images
   - Required secrets: `DOCKER_REGISTRY`

5. **Monitoring (`monitor.yml`)**
   - Runs health checks every 5 minutes
   - Creates issues for failures
   - Required secrets: `PRODUCTION_URL`

### Required Secrets Setup

1. **GitHub Repository Secrets**
   ```bash
   # Container Registry
   DOCKER_REGISTRY=ghcr.io/your-username
   
   # Kubernetes Config (base64 encoded)
   KUBECONFIG=<base64-encoded-kubeconfig>
   
   # Production URL
   PRODUCTION_URL=https://your-domain.com
   ```

2. **How to Get Secrets**:
   - `DOCKER_REGISTRY`: 
     - Use GitHub Container Registry: `ghcr.io/username`
     - Or Docker Hub: `docker.io/username`
   
   - `KUBECONFIG`:
     ```bash
     # Encode your kubeconfig
     base64 -i ~/.kube/config
     ```
   
   - `PRODUCTION_URL`: Your production domain

### Deployment Scripts

1. **Deploy Script (`scripts/deploy.sh`)**
   ```bash
   # Development deployment
   DEPLOY_ENV=development ./scripts/deploy.sh
   
   # Production deployment
   DEPLOY_ENV=production ./scripts/deploy.sh
   ```
   
   Features:
   - Environment validation
   - Dependency checks
   - Health monitoring
   - Colored output
   - Error handling

2. **Rollback Script (`scripts/rollback.sh`)**
   ```bash
   # Rollback to specific version
   ./scripts/rollback.sh --version v1.2.3
   
   # Rollback to last stable
   ./scripts/rollback.sh --last-stable
   ```
   
   Features:
   - Version management
   - Automatic backup
   - Health verification
   - Cleanup of old backups

### Docker Configuration

1. **Development Setup**
   ```yaml
   # docker-compose.yml
   services:
     api:
       build: 
         target: development
       volumes:
         - .:/app
     tunnel:
       profiles: ["development"]
   ```

2. **Production Setup**
   ```yaml
   # docker-compose.prod.yml
   services:
     api:
       build:
         target: production
       restart: always
     monitoring:
       image: prom/prometheus
     grafana:
       image: grafana/grafana
   ```

3. **Monitoring Setup**
   ```yaml
   # docker-compose.monitor.yml
   services:
     prometheus:
       volumes:
         - ./monitoring/prometheus:/etc/prometheus
     grafana:
       volumes:
         - ./monitoring/grafana:/etc/grafana
     alertmanager:
       image: prom/alertmanager
   ```

### Environment Files

1. **Development**
   ```env
   # .env.development
   NODE_ENV=development
   TUNNEL_SUBDOMAIN=threads-bot-api
   MONITOR_ENABLED=true
   ```

2. **Production**
   ```env
   # .env.production
   NODE_ENV=production
   PRODUCTION_URL=https://your-domain.com
   MONITOR_ENABLED=true
   ALERT_WEBHOOK=https://your-webhook.com
   ```

3. **Monitoring**
   ```env
   # .env.monitor
   GRAFANA_ADMIN_PASSWORD=your_secure_password
   PROMETHEUS_RETENTION=15d
   ALERT_CHANNELS=slack,email
   ```

### Quick Start

1. **Setup Repository**
   ```bash
   # 1. Add GitHub Secrets
   gh secret set DOCKER_REGISTRY -b "ghcr.io/username"
   gh secret set KUBECONFIG -b "$(base64 -i ~/.kube/config)"
   gh secret set PRODUCTION_URL -b "https://your-domain.com"
   
   # 2. Create environments
   cp .env.example .env.development
   cp .env.example .env.production
   
   # 3. Start development
   DEPLOY_ENV=development ./scripts/deploy.sh
   ```

2. **Monitor Deployment**
   ```bash
   # View logs
   docker-compose logs -f
   
   # Check metrics
   open http://localhost:3001
   
   # View alerts
   open http://localhost:9093
   ```

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

