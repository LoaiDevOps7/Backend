import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';
import { resolve } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as compression from 'compression';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());
  // app.enable('trust proxy');

  // تفعيل Redis WebSocket Adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  app.useWebSocketAdapter(redisIoAdapter);

  // إعداد الحد الأقصى للطلبات باستخدام قيم من .env
  const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
  const RATE_LIMIT_WINDOW =
    parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000;

  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW,
      max: RATE_LIMIT_MAX,
      message: 'Too many requests, please try again later.',
      skip: (req) => req.method === 'OPTIONS',
      headers: true,
    }),
  );

  // السماح بعرض الملفات داخل storage
  app.useStaticAssets(
    resolve(__dirname, '..', 'src/infrastructure/storage/uploads'),
    {
      prefix: '/uploads',
    },
  );

  // إعداد CORS لدعم الواجهات المختلفة
  app.enableCors({
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean), // تجنب القيم الفارغة
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // تعيين مسار API الأساسي
  app.setGlobalPrefix('api/v1');

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);

  console.log(`🚀 Server is running on: http://localhost:${PORT}`);
}

bootstrap();
