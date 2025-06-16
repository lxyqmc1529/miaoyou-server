import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Entities
import { User } from './entities/User';
import { Article } from './entities/Article';
import { Category } from './entities/Category';
import { Comment } from './entities/Comment';
import { Moment } from './entities/Moment';
import { Work } from './entities/Work';
import { Analytics, DailyStats } from './entities/Analytics';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { MomentsModule } from './modules/moments/moments.module';
import { WorksModule } from './modules/works/works.module';


@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'cgx13544425754',
      database: process.env.DB_DATABASE || 'miaoyou',
      entities: [User, Article, Category, Comment, Moment, Work, Analytics, DailyStats],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      timezone: '+08:00',
    }),

    // JWT配置
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),

    // Passport配置
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 功能模块
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    CommentsModule,
    MomentsModule,
    WorksModule,
  ],
})
export class AppModule {}