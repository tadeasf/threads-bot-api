import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as localtunnel from 'localtunnel';
import axios from 'axios';

@Injectable()
export class TunnelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TunnelService.name);
  private tunnel: any;
  private tunnelPassword: string;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly BACKUP_SUBDOMAINS = [
    'threads-bot-api-1',
    'threads-bot-api-2',
    'threads-bot-api-3'
  ];

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    if (this.configService.get('environment.isDevelopment')) {
      await this.initTunnel();
    }
  }

  async onModuleDestroy() {
    await this.closeTunnel();
  }

  private async initTunnel() {
    try {
      const subdomain = this.configService.get('environment.tunnelSubdomain');
      await this.startTunnel(subdomain);
    } catch (error) {
      this.logger.error(`Failed to start tunnel: ${error.message}`);
      await this.tryFallbackTunnels();
    }
  }

  private async startTunnel(subdomain: string) {
    this.tunnel = await localtunnel({ 
      port: 3000, 
      subdomain,
      allow_invalid_cert: true
    });

    this.tunnel.on('error', async (err) => {
      this.logger.error(`Tunnel error: ${err.message}`);
      await this.handleTunnelError(err);
    });

    this.tunnel.on('close', async () => {
      this.logger.warn('Tunnel closed unexpectedly');
      await this.handleTunnelClose();
    });

    await this.fetchAndStoreTunnelPassword();
    await this.notifyTunnelReady();
  }

  private async fetchAndStoreTunnelPassword() {
    try {
      const response = await axios.get('https://loca.lt/mytunnelpassword');
      this.tunnelPassword = response.data.trim();
      this.logger.log(`🔑 Tunnel Password: ${this.tunnelPassword}`);
      
      // Emit event with tunnel info
      this.eventEmitter.emit('tunnel.ready', {
        url: this.tunnel.url,
        password: this.tunnelPassword
      });
    } catch (error) {
      this.logger.error(`Failed to fetch tunnel password: ${error.message}`);
    }
  }

  private async tryFallbackTunnels() {
    for (const fallbackSubdomain of this.BACKUP_SUBDOMAINS) {
      try {
        this.logger.log(`Trying fallback subdomain: ${fallbackSubdomain}`);
        await this.startTunnel(fallbackSubdomain);
        
        // Update redirect URI in config
        process.env.THREADS_REDIRECT_URI = `https://${fallbackSubdomain}.loca.lt/threads/callback`;
        return;
      } catch (error) {
        this.logger.error(`Fallback tunnel failed: ${error.message}`);
      }
    }
    throw new Error('All tunnel attempts failed');
  }

  private async handleTunnelError(error: Error) {
    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      this.logger.log(`Retrying tunnel connection (${this.retryCount}/${this.MAX_RETRIES})`);
      await this.closeTunnel();
      await this.initTunnel();
    } else {
      this.logger.error('Max tunnel retries reached');
      this.eventEmitter.emit('tunnel.failed');
    }
  }

  private async handleTunnelClose() {
    await this.handleTunnelError(new Error('Tunnel closed unexpectedly'));
  }

  private async closeTunnel() {
    if (this.tunnel) {
      await this.tunnel.close();
    }
  }

  getTunnelInfo() {
    if (!this.tunnel) return null;
    return {
      url: this.tunnel.url,
      password: this.tunnelPassword
    };
  }

  async getAuthenticatedAxios() {
    const tunnelInfo = this.getTunnelInfo();
    return axios.create({
      headers: {
        'bypass-tunnel-reminder': '1',
        'User-Agent': 'ThreadsBotAPI/1.0'
      },
      baseURL: tunnelInfo?.url
    });
  }

  async restartTunnel() {
    this.logger.log('Restarting tunnel...');
    await this.closeTunnel();
    this.retryCount = 0; // Reset retry count
    await this.initTunnel();
  }

  private async notifyTunnelReady() {
    const tunnelInfo = this.getTunnelInfo();
    if (tunnelInfo) {
      this.logger.log(`Tunnel ready at: ${tunnelInfo.url}`);
      this.eventEmitter.emit('tunnel.ready', tunnelInfo);
    }
  }
} 