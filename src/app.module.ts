import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThreadsModule } from './threads/threads.module';
import { TunnelModule } from './tunnel/tunnel.module';
import environmentConfig from './config/environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [environmentConfig],
      isGlobal: true
    }),
    ThreadsModule,
    TunnelModule
  ],
})
export class AppModule {} 