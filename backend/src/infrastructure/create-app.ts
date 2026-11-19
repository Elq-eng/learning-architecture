import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

export const createApp = (): Promise<NestFastifyApplication> =>
  NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { logger: false });
