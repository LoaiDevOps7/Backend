// import { IoAdapter } from '@nestjs/platform-socket.io';
// import { createAdapter } from 'socket.io-redis';
// import { INestApplication } from '@nestjs/common';
// import Redis from 'ioredis';

// export class RedisIoAdapter extends IoAdapter {
//   private static pubClient: Redis;
//   private static subClient: Redis;

//   constructor(app: INestApplication) {
//     super(app);

//     // تحقق مما إذا كانت الاتصالات موجودة مسبقًا لتجنب إنشائها مجددًا
//     if (!RedisIoAdapter.pubClient || !RedisIoAdapter.subClient) {
//       RedisIoAdapter.pubClient = new Redis({ host: 'localhost', port: 6379 });
//       RedisIoAdapter.subClient = new Redis({ host: 'localhost', port: 6379 });

//       // معالجة الأخطاء
//       RedisIoAdapter.pubClient.on('error', (err) => {
//         console.error('Redis Pub Client Error:', err);
//       });
//       RedisIoAdapter.subClient.on('error', (err) => {
//         console.error('Redis Sub Client Error:', err);
//       });
//     }
//   }

//   createIOServer(port: number, options?: any): any {
//     const server = super.createIOServer(port, {
//       ...options,
//       adapter: createAdapter({
//         pubClient: RedisIoAdapter.pubClient,
//         subClient: RedisIoAdapter.subClient,
//       }),
//     });

//     // تمكين ضغط الرسائل في WebSocket
//     server.use((socket: any, next: any) => {
//       if (socket.conn.transport && socket.conn.transport.opts) {
//         socket.conn.transport.opts.compression = true;
//       }
//       next();
//     });

//     return server;
//   }
// }
