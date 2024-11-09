import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
  ],
  providers: [ThreadsService],
  controllers: [ThreadsController],
  exports: [ThreadsService],
})
export class ThreadsModule {} 