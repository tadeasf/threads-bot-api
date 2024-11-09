# Threads Bot API

A NestJS API for automating Threads posts with OAuth2 authentication.

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file in the root directory:

```env
THREADS_APP_ID=your_app_id
THREADS_APP_SECRET=your_app_secret
THREADS_REDIRECT_URI=http://localhost:3000/threads/callback
```

## Authentication Flow

The API implements OAuth2 authentication for Threads with CSRF protection. Here's how it works:

1. **Get Authorization URL or Direct Redirect**
   ```bash
   # Get URL as JSON
   GET /threads/auth
   
   # Direct redirect to Threads auth page
   GET /threads/auth?redirect=true
   ```
   Returns (or redirects to) a URL that includes:
   - Your app ID
   - Redirect URI
   - Required scopes
   - CSRF state token

2. **User Authorization**
   - User authorizes your app on Threads
   - Threads redirects back with:
     - Authorization code
     - State parameter (for CSRF verification)

3. **Exchange Code for Token**
   ```bash
   GET /threads/callback?code=AUTHORIZATION_CODE&state=STATE_TOKEN
   ```
   Returns:
   - Access token
   - User ID
   - Token expiration time
   - Token type

4. **Using the Token**
   ```bash
   POST /threads/post
   Authorization: Bearer YOUR_ACCESS_TOKEN
   
   {
     "text": "Hello from API!",
     "mediaUrls": ["https://example.com/image.jpg"],
     "altTexts": ["Image description"],
     "linkAttachment": "https://example.com"
   }
   ```

## Example Usage

1. Start auth flow (two options):
```bash
# Get auth URL
curl http://localhost:3000/threads/auth

# Or redirect directly
curl -L http://localhost:3000/threads/auth?redirect=true
```

2. Complete authorization on Threads

3. Automatic callback handling with:
   - CSRF verification
   - Error handling
   - Token generation

4. Create a post:
```bash
curl -X POST http://localhost:3000/threads/post \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from API!",
    "mediaUrls": ["https://example.com/image.jpg"]
  }'
```

## Development

```bash
# Run in development mode
bun run start:dev

# Build
bun run build

# Run in production
bun run start:prod
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

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
