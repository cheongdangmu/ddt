import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { RedisService } from '../../../common/redis/redis.service';
import { setupYjsWSConnection } from './yjs.utils';

interface RoomState {
  phase: string;
}

@Injectable()
export class YjsGateway implements OnModuleDestroy {
  private wss: WebSocketServer | null = null;
  private readonly logger: Logger = new Logger(YjsGateway.name);
  private clientRoomMap = new Map<WebSocket, string>();

  constructor(private readonly redis: RedisService) {}

  init(httpServer: Server) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/yjs',
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      void this.handleConnection(ws, req);
    });
  }

  private async handleConnection(
    ws: WebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    const roomId = this.getRoomId(req);
    this.logger.log(`연결 시도 - Room: ${roomId}`);

    if (!roomId) {
      ws.close();
      return;
    }

    const raw = await this.redis.instance.get(`room:state:${roomId}`);
    const state = raw ? (JSON.parse(raw) as RoomState) : null;

    if (state?.phase === 'timer') {
      ws.close();
      return;
    }

    this.clientRoomMap.set(ws, roomId);

    ws.on('close', () => {
      this.clientRoomMap.delete(ws);
    });

    setupYjsWSConnection(ws, req, { docName: roomId });
  }

  destroyRoom(roomId: string): void {
    if (!this.wss) return;

    const targets: WebSocket[] = [];
    this.wss.clients.forEach((client: WebSocket) => {
      if (this.clientRoomMap.get(client) === roomId) {
        targets.push(client);
      }
    });

    targets.forEach((client) => {
      client.close();
      this.clientRoomMap.delete(client);
    });
  }

  onModuleDestroy() {
    this.wss?.close();
    this.wss = null;
  }

  private getRoomId(req: IncomingMessage): string {
    const { searchParams } = new URL(req.url ?? '', 'http://localhost');
    return searchParams.get('roomId') ?? '';
  }
}
