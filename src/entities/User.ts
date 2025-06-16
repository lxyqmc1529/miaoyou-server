import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Article } from './Article';
import { Comment } from './Comment';
import { Moment } from './Moment';
import { Work } from './Work';

@Entity('users')
export class User extends BaseEntity {

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 50, nullable: true })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
  role: 'admin' | 'user';

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // 关联关系
  @OneToMany(() => Article, 'author')
  articles: Article[];

  @OneToMany(() => Comment, 'author')
  comments: Comment[];

  @OneToMany(() => Moment, 'author')
  moments: Moment[];

  @OneToMany(() => Work, 'author')
  works: Work[];
}