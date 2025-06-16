import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Comment } from './Comment';

@Entity('works')
export class Work extends BaseEntity {

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  cover: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ length: 255, nullable: true })
  demoUrl: string;

  @Column({ length: 255, nullable: true })
  sourceUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  technologies: string[];

  @Column({ type: 'enum', enum: ['web', 'mobile', 'desktop', 'design', 'other'], default: 'web' })
  category: 'web' | 'mobile' | 'desktop' | 'design' | 'other';

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

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
  @ManyToOne(() => User, 'works')
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Comment, 'work')
  comments: Comment[];
}