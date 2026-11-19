import { Module } from '@nestjs/common';
import { HealthController } from './http/health.controller';

/** Composition root: each bounded context module is registered here. */
@Module({
  controllers: [HealthController],
})
export class AppModule {}
