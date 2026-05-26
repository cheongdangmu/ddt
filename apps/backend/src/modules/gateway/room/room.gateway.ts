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
import { Server, Socket } from 'socket.io';

interface SocketData {
  roomId: string;
  userId: string;
  role: string;
}

type RoomSocket = Socket<
  Record<string, any>, // ClientToServer 이벤트
  Record<string, any>, // ServerToClient 이벤트
  Record<string, any>, // InterServer 이벤트
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
  constructor(private readonly jwtService: JwtService) {}
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RoomGateway.name);

  handleConnection(client: RoomSocket): void {
    const token = client.handshake.auth.token as string;
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

    client.data.roomId = roomId;
    this.logger.log(`클라이언트 연결됨: ${client.id} 방: ${roomId}`);
    client.emit('welcome', { message: 'DDT 서버에 오신 것을 환영합니다!' });
  }

  handleDisconnect(client: RoomSocket): void {
    this.logger.log(`클라이언트 연결 끊김: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: unknown): { event: string; data: string } {
    this.logger.log(`프론트에서 온 메시지: ${String(data)}`);
    return { event: 'pong', data: '백엔드에서 답장 보냄!' };
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: RoomSocket,
    @MessageBody() body: { roomId: string },
  ) {
    await client.join(body.roomId);
    client.data.roomId = body.roomId; // 이 줄 추가
    client.to(body.roomId).emit('room:user-joined', { socketId: client.id });
    return { ok: true, roomId: body.roomId };
  }
}
