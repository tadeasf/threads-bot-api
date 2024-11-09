import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TunnelService } from './tunnel.service';
import { TunnelMonitorService } from './tunnel-monitor.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot()
  ],
  providers: [TunnelService, TunnelMonitorService],
  exports: [TunnelService]
})
export class TunnelModule {} 