import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Article } from './Article';
import { Moment } from './Moment';
import { Work } from './Work';

@Entity('comments')
export class Comment extends BaseEntity {

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 50, nullable: true })
  guestName: string;

  @Column({ length: 100, nullable: true })
  guestEmail: string;

  @Column({ length: 255, nullable: true })
  guestWebsite: string;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'enum', enum: ['article', 'moment', 'work'] })
  targetType: 'article' | 'moment' | 'work';

  @Column()
  targetId: string;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  // 关联关系
  @ManyToOne(() => User, 'comments', { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  authorId: string;

  @ManyToOne(() => Article, 'comments', { nullable: true })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @Column({ nullable: true })
  articleId: string;

  @ManyToOne(() => Moment, 'comments', { nullable: true })
  @JoinColumn({ name: 'momentId' })
  moment: Moment;

  @Column({ nullable: true })
  momentId: string;

  @ManyToOne(() => Work, 'comments', { nullable: true })
  @JoinColumn({ name: 'workId' })
  work: Work;

  @ManyToOne(() => Comment, 'replies', { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @Column({ nullable: true })
  parentId: string;

  @OneToMany(() => Comment, 'parent')
  replies: Comment[];
}