// Carrega o .env antes de qualquer outro import: JWT_SECRET, limites de throttling
// etc. são lidos na hora em que os módulos são avaliados.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Headers de segurança HTTP (proteção contra clickjacking, XSS, MIME sniffing, etc.)
  app.use(helmet());

  // Habilita CORS para o front-end Next.js
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validação automática dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remove campos não declarados no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com campos extras
      transform: true,            // Converte tipos automaticamente
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 NexSupport API rodando em: http://localhost:${port}/api`);
}

bootstrap();
