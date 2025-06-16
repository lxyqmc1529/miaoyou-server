import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WinstonLogger, appLogger } from './utils/winston-logger';
import { LoggerExceptionFilter } from './filters/logger-exception.filter';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger('NestApplication'),
  });

  // 启用CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API前缀
  app.setGlobalPrefix('api');

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('MiaoYou API')
    .setDescription('MiaoYou个人网站API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 全局异常过滤器
  app.useGlobalFilters(new LoggerExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  appLogger.info(`Application is running on: http://localhost:${port}`);
  appLogger.info(`Swagger docs available at: http://localhost:${port}/api/docs`);
  appLogger.info('Application bootstrap completed successfully');
}

bootstrap();