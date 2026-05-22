import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private logger = new Logger('RedisIoAdapter');

  constructor(
    appOrHttpServer: INestApplicationContext | object,
    private readonly redisUrl: string,
  ) {
    super(appOrHttpServer);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: this.redisUrl });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) =>
      this.logger.error('Redis Pub Client Error', err),
    );
    subClient.on('error', (err) =>
      this.logger.error('Redis Sub Client Error', err),
    );

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Redis에 소켓 어댑터가 성공적으로 연결되었습니다!');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}
