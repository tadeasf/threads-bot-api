import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TunnelService } from './tunnel.service';
import axios from 'axios';

@Injectable()
export class TunnelMonitorService {
  private readonly logger = new Logger(TunnelMonitorService.name);
  private readonly healthCheckEndpoint = '/health';
  private failedChecks = 0;
  private readonly MAX_FAILED_CHECKS = 3;
  private isRestarting = false;

  constructor(
    private tunnelService: TunnelService,
    private eventEmitter: EventEmitter2
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on('tunnel.ready', () => {
      this.resetFailedChecks();
      this.isRestarting = false;
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async monitorTunnelHealth() {
    if (this.isRestarting) {
      this.logger.debug('Skipping health check during restart');
      return;
    }

    try {
      const tunnelInfo = this.tunnelService.getTunnelInfo();
      if (!tunnelInfo) return;

      const response = await axios.get(`${tunnelInfo.url}${this.healthCheckEndpoint}`, {
        headers: {
          'bypass-tunnel-reminder': '1',
          'User-Agent': 'ThreadsBotAPI/1.0'
        },
        timeout: 5000
      });

      if (response.status === 200) {
        this.resetFailedChecks();
        this.eventEmitter.emit('tunnel.healthy', tunnelInfo);
      } else {
        await this.handleFailedCheck('Unhealthy response');
      }
    } catch (error) {
      await this.handleFailedCheck(error.message);
    }
  }

  private async handleFailedCheck(reason: string) {
    this.failedChecks++;
    this.logger.warn(`Tunnel health check failed (${this.failedChecks}/${this.MAX_FAILED_CHECKS}): ${reason}`);

    if (this.failedChecks >= this.MAX_FAILED_CHECKS && !this.isRestarting) {
      this.isRestarting = true;
      this.eventEmitter.emit('tunnel.unhealthy');
      await this.tunnelService.restartTunnel();
    }
  }

  private resetFailedChecks() {
    if (this.failedChecks > 0) {
      this.failedChecks = 0;
      this.logger.log('Tunnel health restored');
    }
  }
} 