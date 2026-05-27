import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import { RoomService } from '../../room/room.service';

interface SocketData {
  roomId: string;
  userId: string;
  role: string;
}

type RoomSocket = Socket<
  DefaultEventsMap, // ClientToServer 이벤트
  DefaultEventsMap, // ServerToClient 이벤트
  DefaultEventsMap, // InterServer 이벤트
  SocketData
>;

interface JwtPayload {
  sub: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://webfull-9-10-ddt-frontend.vercel.app',
    ],
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
  ) {}
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RoomGateway.name);

  async handleConnection(client: RoomSocket): Promise<void> {
    const token =
      (client.handshake.auth.token as string) ??
      (client.handshake.query.token as string) ??
      client.handshake.headers.authorization?.replace('Bearer ', '');
    const roomId = client.handshake.query.roomId as string;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as unknown as JwtPayload;
      client.data.userId = payload.sub;
      client.data.role = payload.role;
    } catch {
      client.disconnect();
      return;
    }

    if (!roomId) {
      client.disconnect();
      return;
    }

    const roomState = await this.roomService.getRoomState(roomId);

    if (!roomState) {
      client.disconnect();
      return;
    }

    client.data.roomId = roomId;
    await client.join(roomId);
    await this.updateMemberConnection(client, true);
    this.logger.log(`클라이언트 연결됨: ${client.id} 방: ${roomId}`);

    client.emit('room:state', roomState);
  }

  async handleDisconnect(client: RoomSocket): Promise<void> {
    this.logger.log(`클라이언트 연결 끊김: ${client.id}`);

    const { roomId, userId } = client.data;

    if (!roomId || !userId) {
      return;
    }

    const onlineMembersCount =
      await this.roomService.countConnectedMembers(roomId);

    if (!onlineMembersCount) {
      this.logger.log(`${client.data.roomId}가 10초 뒤에 닫힙니다.`);

      setTimeout(() => {
        void this.handleRoomCleanup(client.data.roomId);
      }, 10000);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: unknown): { event: string; data: string } {
    this.logger.log(`프론트에서 온 메시지: ${String(data)}`);
    return { event: 'pong', data: '백엔드에서 답장 보냄!' };
  }

  private async updateMemberConnection(
    client: RoomSocket,
    connected: boolean,
  ): Promise<void> {
    const { roomId, userId } = client.data;

    await this.roomService.setConnected(roomId, userId, connected);
  }

  private async handleRoomCleanup(roomId: string): Promise<void> {
    const currentCount = await this.roomService.countConnectedMembers(roomId);
    if (currentCount === 0) {
      await this.roomService.deleteRoom(roomId);
    }
  }

  @SubscribeMessage('member:kick')
  async handleKick(
    @ConnectedSocket() client: RoomSocket,
    @MessageBody() body: { targetId: string },
  ) {
    const { roomId, userId } = client.data;

    const roomState = await this.roomService.getRoomState(roomId);

    if (!roomState) {
      return;
    }

    const isHost = roomState.members[userId]?.isHost;

    if (!isHost) {
      return;
    }

    await this.roomService.kickMember(roomId, body.targetId);

    const sockets = await this.server.in(roomId).fetchSockets();
    const targetSocket = sockets.find(
      (s) => (s.data as RoomSocket).data.userId === body.targetId,
    );

    if (targetSocket) {
      targetSocket.emit('kicked');
      targetSocket.disconnect();

      this.server.to(roomId).emit('member:kicked', { targetId: body.targetId });
    }
  }
}
