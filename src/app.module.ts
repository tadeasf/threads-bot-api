import { Module } from '@nestjs/common';
import { ThreadsModule } from './threads/threads.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThreadsModule
  ],
})
export class AppModule {} 