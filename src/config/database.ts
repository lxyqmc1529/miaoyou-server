import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Article } from '../entities/Article';
import { Category } from '../entities/Category';
import { Comment } from '../entities/Comment';
import { Moment } from '../entities/Moment';
import { Work } from '../entities/Work';
import { Analytics } from '../entities/Analytics';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'cgx13544425754',
  database: process.env.DB_DATABASE || 'miaoyou',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Article, Category, Comment, Moment, Work, Analytics],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};