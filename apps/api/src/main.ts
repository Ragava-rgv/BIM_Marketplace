import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Behind Railway's proxy in production — without this, req.ip is the proxy's address, not the
  // real client IP (used to dedupe anonymous listing views).
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({ origin: true, credentials: true });
  // MediaController serves files at /media/... to match StorageService.getUrl() and the Vite /media proxy —
  // exclude it from the global /api prefix.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'media/{*splat}', method: RequestMethod.ALL }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MachineBazaar API')
    .setDescription('B2B marketplace for used industrial machinery')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
