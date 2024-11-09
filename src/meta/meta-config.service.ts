import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class MetaConfigService {
  private readonly logger = new Logger(MetaConfigService.name);
  private readonly META_GRAPH_API = 'https://graph.facebook.com/v18.0';

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on('tunnel.ready', async (tunnelInfo) => {
      await this.updateMetaAppConfig(tunnelInfo);
    });

    this.eventEmitter.on('tunnel.changed', async (tunnelInfo) => {
      await this.updateMetaAppConfig(tunnelInfo);
    });
  }

  async updateMetaAppConfig(tunnelInfo: { url: string }) {
    try {
      const appId = this.configService.get('THREADS_APP_ID');
      const appSecret = this.configService.get('THREADS_APP_SECRET');

      // Update app domains
      await this.updateAppDomains(appId, appSecret, tunnelInfo.url);
      
      // Update OAuth redirect URIs
      await this.updateOAuthSettings(appId, appSecret, tunnelInfo.url);

      this.logger.log('Meta app configuration updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update Meta app config: ${error.message}`);
      this.eventEmitter.emit('meta.config.failed', error);
    }
  }

  private async updateAppDomains(appId: string, appSecret: string, tunnelUrl: string) {
    const domain = new URL(tunnelUrl).hostname;
    
    await axios.post(`${this.META_GRAPH_API}/${appId}`, {
      app_domains: [domain],
      access_token: `${appId}|${appSecret}`
    });
  }

  private async updateOAuthSettings(appId: string, appSecret: string, tunnelUrl: string) {
    const redirectUri = `${tunnelUrl}/threads/callback`;
    
    await axios.post(`${this.META_GRAPH_API}/${appId}`, {
      oauth_redirect_uris: [redirectUri],
      access_token: `${appId}|${appSecret}`
    });
  }
} 