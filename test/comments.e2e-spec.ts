import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let commentId: string;
  let articleId: string; 
  let testUser = {
    username: 'commentuser' + Date.now(),
    email: 'commentuser' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Comment Test User'
  };
  let testComment = {
    content: 'This is a test comment',
    authorName: 'Test Author',
    authorEmail: 'test@example.com'
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    // 注册测试用户
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);

    // 登录获取token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });
    authToken = loginResponse.body.data.token;

    // 尝试获取管理员token
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      adminToken = adminLoginResponse.body.data.token;
    } catch (error) {
      adminToken = authToken;
    }

    // 创建测试文章
    const articleResponse = await request(app.getHttpServer())
      .post('/api/admin/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Article for Comments',
        content: 'This is a test article for comments',
        status: 'published'
      });
    articleId = articleResponse.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Comments API', () => {
    describe('/api/public/comments/article/:articleId (GET)', () => {
      it('should get comments for article', () => {
        return request(app.getHttpServer())
          .get(`/api/public/comments/article/${articleId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });

      it('should handle invalid article id', () => {
        return request(app.getHttpServer())
          .get('/api/public/comments/article/invalid-id')
          .expect(404);
      });
    });

    describe('/api/public/comments (POST)', () => {
      it('should create comment successfully', () => {
        return request(app.getHttpServer())
          .post('/api/public/comments')
          .send({
            ...testComment,
            articleId: articleId
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.content).toBe(testComment.content);
            commentId = res.body.data.id;
          });
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .post('/api/public/comments')
          .send({
            content: '', // 空内容
            articleId: articleId
          })
          .expect(400);
      });

      it('should fail with invalid article id', () => {
        return request(app.getHttpServer())
          .post('/api/public/comments')
          .send({
            ...testComment,
            articleId: 'invalid-id'
          })
          .expect(404);
      });
    });

    describe('/api/public/comments/:id/like (POST)', () => {
      it('should like comment', () => {
        return request(app.getHttpServer())
          .post(`/api/public/comments/${commentId}/like`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should handle invalid comment id', () => {
        return request(app.getHttpServer())
          .post('/api/public/comments/invalid-id/like')
          .expect(404);
      });
    });
  });

  describe('Admin Comments API', () => {
    describe('/api/admin/comments (GET)', () => {
      it('should get comments list for admin', () => {
        return request(app.getHttpServer())
          .get('/api/admin/comments')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/comments')
          .expect(401);
      });
    });

    describe('/api/admin/comments/:id (GET)', () => {
      it('should get comment by id', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/comments/${commentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(commentId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/admin/comments/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('/api/admin/comments/:id (PATCH)', () => {
      it('should update comment', () => {
        const updateData = {
          content: 'Updated comment content',
          status: 'approved'
        };
        return request(app.getHttpServer())
          .patch(`/api/admin/comments/${commentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.content).toBe(updateData.content);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .patch(`/api/admin/comments/${commentId}`)
          .send({ content: 'New Content' })
          .expect(401);
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .patch('/api/admin/comments/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'New Content' })
          .expect(404);
      });
    });

    describe('/api/admin/comments/:id/approve (POST)', () => {
      it('should approve comment', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/comments/${commentId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/comments/${commentId}/approve`)
          .expect(401);
      });
    });

    describe('/api/admin/comments/:id/reject (POST)', () => {
      it('should reject comment', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/comments/${commentId}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });

    describe('/api/admin/comments/:id (DELETE)', () => {
      it('should delete comment', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/comments/${commentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail to delete non-existent comment', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/comments/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/comments/some-id')
          .expect(401);
      });
    });
  });
});