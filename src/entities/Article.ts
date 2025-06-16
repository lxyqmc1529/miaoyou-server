import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Category } from './Category';
import { Comment } from './Comment';

@Entity('articles')
export class Article extends BaseEntity {

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ length: 255, nullable: true })
  cover: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'boolean', default: false })
  isRecommended: boolean;

  @Column({ type: 'boolean', default: false })
  isTop: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date;

  // 关联关系
  @ManyToOne(() => User, 'articles')
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Category, 'articles', { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @OneToMany(() => Comment, 'article')
  comments: Comment[];
}