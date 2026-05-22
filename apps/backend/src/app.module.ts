import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomModule } from './modules/room/room.module';
import { UserModule } from './modules/user/user.module';
import { TimerModule } from './modules/timer/timer.module';

import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { RedisModule } from './common/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from './modules/gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 사용 가능
      envFilePath: '.env',
    }),
    RoomModule,
    UserModule,
    TimerModule,
    SentryModule.forRoot(),
    RedisModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
