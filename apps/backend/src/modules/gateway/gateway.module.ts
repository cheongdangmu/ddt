import { Module } from '@nestjs/common';
import { RoomGateway } from './room/room.gateway';
import { YjsGateway } from './yjs/yjs.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [RoomGateway, YjsGateway],
  exports: [RoomGateway, YjsGateway],
})
export class GatewayModule {}
