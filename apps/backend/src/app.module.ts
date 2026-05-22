import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketGateway } from './socket.gateway'; 
import { RoomModule } from './modules/room/room.module';
import { UserModule } from './modules/user/user.module';
import { TimerModule } from './modules/timer/timer.module';

import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [
    PrismaModule, 
    RoomModule, 
    UserModule, 
    TimerModule,
    SentryModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    SocketGateway,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}