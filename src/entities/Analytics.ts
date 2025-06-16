import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('analytics')
@Index(['date', 'type'])
export class Analytics extends BaseEntity {

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: ['page_view', 'article_view', 'moment_view', 'work_view', 'user_visit', 'article_like', 'article_share'] })
  type: 'page_view' | 'article_view' | 'moment_view' | 'work_view' | 'user_visit' | 'article_like' | 'article_share';

  @Column({ nullable: true })
  targetId: string;

  @Column({ length: 255, nullable: true })
  targetTitle: string;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 255, nullable: true })
  userAgent: string;

  @Column({ length: 255, nullable: true })
  referer: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  device: string;

  @Column({ length: 100, nullable: true })
  browser: string;

  @Column({ length: 100, nullable: true })
  os: string;
}

@Entity('daily_stats')
export class DailyStats extends BaseEntity {

  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ type: 'int', default: 0 })
  totalViews: number;

  @Column({ type: 'int', default: 0 })
  uniqueVisitors: number;

  @Column({ type: 'int', default: 0 })
  articleViews: number;

  @Column({ type: 'int', default: 0 })
  momentViews: number;

  @Column({ type: 'int', default: 0 })
  workViews: number;

  @Column({ type: 'int', default: 0 })
  newComments: number;

  @Column({ type: 'int', default: 0 })
  newLikes: number;
}