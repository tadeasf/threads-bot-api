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

## Running with HTTPS (Development)

The Threads API requires HTTPS. We use Docker and localtunnel to handle this in development:

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

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

