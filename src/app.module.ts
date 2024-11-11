import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThreadsModule } from './threads/threads.module';
import { TunnelModule } from './tunnel/tunnel.module';
import { AppController } from './app.controller';
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
  controllers: [AppController],
})
export class AppModule {} 