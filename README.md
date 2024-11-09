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

The API implements OAuth2 authentication for Threads. Here's how it works:

1. **Get Authorization URL**
   ```bash
   GET /threads/auth-url
   ```
   Returns a URL that users need to visit to authorize your app. The URL includes:
   - Your app ID
   - Redirect URI
   - Required scopes (threads_basic, threads_content_publish, etc.)

2. **User Authorization**
   - User visits the authorization URL
   - Logs into their Threads account
   - Grants permissions to your app
   - Threads redirects back to your `THREADS_REDIRECT_URI` with an auth code

3. **Exchange Code for Token**
   ```bash
   GET /threads/callback?code=AUTHORIZATION_CODE
   ```
   The API exchanges this code for:
   - Access token
   - User ID
   - Token expiration time

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

1. Get the auth URL:
```bash
curl http://localhost:3000/threads/auth-url
```

2. Visit the returned URL and authorize the app

3. Handle the callback (automatic)

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

## Token Management

- Access tokens are valid for 60 days
- Store tokens securely
- Implement token refresh before expiration
- Handle token revocation gracefully

## Error Handling

The API handles common authentication errors:
- Invalid tokens
- Expired tokens
- Missing permissions
- Rate limits

## Security Notes

- Never commit `.env` file
- Store tokens securely
- Use HTTPS in production
- Validate redirect URIs
- Implement rate limiting

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
