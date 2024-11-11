import { Injectable, Logger, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePostDto } from './dto/create-post.dto';
import * as crypto from 'crypto';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);
  private readonly graphqlEndpoint = 'https://graph.threads.net/v1.0';
  private stateStore: Map<string, { timestamp: number }> = new Map();

  constructor(private configService: ConfigService) {
    this.validateConfig();
  }

  private validateConfig() {
    const requiredVars = [
      'THREADS_APP_ID',
      'THREADS_APP_SECRET',
      'THREADS_REDIRECT_URI'
    ];

    for (const varName of requiredVars) {
      const value = this.configService.get<string>(varName);
      if (!value) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
  }

  async getAuthorizationUrl(): Promise<string> {
    try {
      const appId = this.configService.get<string>('THREADS_APP_ID');
      let redirectUri = this.configService.get<string>('THREADS_REDIRECT_URI');
      
      // Ensure redirect URI includes /api prefix
      if (!redirectUri.includes('/api/')) {
        const url = new URL(redirectUri);
        url.pathname = `/api${url.pathname}`;
        redirectUri = url.toString();
      }
      
      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');
      this.stateStore.set(state, { 
        timestamp: Date.now() 
      });

      // Clean up old states
      this.cleanupStates();

      const scopes = [
        'threads_basic',
        'threads_content_publish',
        'threads_manage_insights',
        'threads_manage_replies',
        'threads_read_replies'
      ];

      return `https://www.threads.net/oauth/authorize?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes.join(','))}&` +
        `state=${state}&` +
        `response_type=code`;
    } catch (error) {
      this.logger.error(`Failed to generate auth URL: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate authorization URL');
    }
  }

  async verifyState(state: string) {
    const storedState = this.stateStore.get(state);
    if (!storedState) {
      throw new BadRequestException('Invalid state parameter');
    }

    // Check if state is not expired (30 minutes)
    if (Date.now() - storedState.timestamp > 30 * 60 * 1000) {
      this.stateStore.delete(state);
      throw new BadRequestException('State parameter expired');
    }

    // Clean up used state
    this.stateStore.delete(state);
  }

  private cleanupStates() {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    for (const [state, data] of this.stateStore.entries()) {
      if (data.timestamp < thirtyMinutesAgo) {
        this.stateStore.delete(state);
      }
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const headers = {
      ...options.headers,
      'bypass-tunnel-reminder': '1',
      'User-Agent': 'ThreadsBotAPI/1.0'
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  }

  async exchangeCodeForToken(code: string) {
    try {
      const appId = this.configService.get<string>('THREADS_APP_ID');
      const appSecret = this.configService.get<string>('THREADS_APP_SECRET');
      const redirectUri = this.configService.get<string>('THREADS_REDIRECT_URI');

      const response = await this.makeRequest(
        'https://graph.threads.net/oauth/access_token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code,
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new BadRequestException(error.error?.message || 'Failed to exchange code for token');
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        userId: data.user_id,
        expiresIn: data.expires_in,
        tokenType: data.token_type
      };
    } catch (error) {
      this.logger.error(`Failed to exchange code: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to exchange code for token');
    }
  }

  async createPost(token: string, post: CreatePostDto) {
    try {
      // Step 1: Create a media container
      const containerResponse = await fetch(
        `${this.graphqlEndpoint}/me/threads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: post.mediaUrls?.length ? 'IMAGE' : 'TEXT',
          text: post.text,
          ...(post.mediaUrls?.[0] && { image_url: post.mediaUrls[0] }),
          ...(post.altTexts?.[0] && { alt_text: post.altTexts[0] }),
          ...(post.linkAttachment && { link_attachment: post.linkAttachment })
        })
      });

      if (!containerResponse.ok) {
        throw new Error(`Failed to create media container: ${await containerResponse.text()}`);
      }

      const container = await containerResponse.json();
      this.logger.debug(`Created media container: ${container.id}`);

      // Wait for media processing (recommended by Meta)
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Step 2: Publish the container
      const publishResponse = await fetch(
        `${this.graphqlEndpoint}/me/threads_publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: container.id
        })
      });

      if (!publishResponse.ok) {
        throw new Error(`Failed to publish post: ${await publishResponse.text()}`);
      }

      const published = await publishResponse.json();
      
      // Get the permalink
      const threadResponse = await fetch(
        `${this.graphqlEndpoint}/${published.id}?fields=permalink`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const threadData = await threadResponse.json();

      return {
        id: published.id,
        permalink: threadData.permalink
      };

    } catch (error) {
      this.logger.error(`Failed to create post: ${error.message}`);
      throw error;
    }
  }

  // Optional: Add method to check container status
  private async checkContainerStatus(token: string, containerId: string) {
    const response = await fetch(
      `${this.graphqlEndpoint}/${containerId}?fields=status,error_message`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.json();
  }

  private async handleTunnelError(error: any) {
    if (error.message.includes('401')) {
      this.logger.error('Tunnel authentication required. Check logs for password.');
      throw new UnauthorizedException('Tunnel authentication required');
    }
    throw error;
  }
} 