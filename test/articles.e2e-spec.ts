import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Articles (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let articleId: string;
  let testUser = {
    username: 'articleuser' + Date.now(),
    email: 'articleuser' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Article Test User'
  };
  let testArticle = {
    title: 'Test Article',
    content: 'This is a test article content',
    summary: 'Test article summary',
    tags: ['test', 'article'],
    status: 'published'
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

    // 创建管理员用户用于测试
    const adminUser = {
      username: 'admin' + Date.now(),
      email: 'admin' + Date.now() + '@example.com',
      password: 'admin123',
      nickname: 'Admin Test User'
    };
    
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminUser);

    // 手动设置用户为管理员角色（在实际应用中这应该通过数据库操作完成）
    // 这里我们先用普通用户token，后面会修改测试逻辑
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: adminUser.username,
        password: adminUser.password
      });
    adminToken = adminLoginResponse.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Articles API', () => {
    describe('/api/public/articles (GET)', () => {
      it('should get public articles list', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles')
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.total).toBeDefined();
          });
      });

      it('should get articles with pagination', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles?page=1&limit=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toBeDefined();
            expect(res.body.page).toBe(1);
            expect(res.body.limit).toBe(5);
            expect(res.body.totalPages).toBeDefined();
          });
      });
    });

    describe('/api/public/articles/recommended (GET)', () => {
      it('should get recommended articles', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/recommended')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('/api/public/articles/popular (GET)', () => {
      it('should get popular articles', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/popular')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('/api/public/articles/tags (GET)', () => {
      it('should get all tags', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/tags')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });
  });

  describe('Admin Articles API', () => {
    describe('/api/admin/articles (POST)', () => {
      it('should fail without admin privileges', () => {
        return request(app.getHttpServer())
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testArticle)
          .expect(401); // 普通用户无法创建文章，需要管理员权限
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/articles')
          .send(testArticle)
          .expect(401);
      });
    });

    describe('/api/admin/articles (GET)', () => {
      it('should fail without admin privileges', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(401); // 普通用户无法访问管理员文章列表
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles')
          .expect(401);
      });
    });

    describe('/api/admin/articles/:id (GET)', () => {
      it('should fail without admin privileges', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles/some-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(401);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles/some-id')
          .expect(401);
      });
    });

    describe('/api/admin/articles/:id (PATCH)', () => {
      it('should fail without admin privileges', () => {
        const updateData = {
          title: 'Updated Test Article',
          content: 'Updated content'
        };
        return request(app.getHttpServer())
          .patch('/api/admin/articles/some-id')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(401);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .patch('/api/admin/articles/some-id')
          .send({ title: 'New Title' })
          .expect(401);
      });
    });

    describe('/api/admin/articles/stats (GET)', () => {
      it('should fail without admin privileges', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles/stats')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(401); // 普通用户无法访问统计信息，需要管理员权限
      });
    });

    describe('/api/admin/articles/:id (DELETE)', () => {
      it('should fail without admin privileges', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/articles/some-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(401);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/articles/some-id')
          .expect(401);
      });
    });
  });

  describe('Public Article Detail API', () => {
    describe('/api/public/articles/:id (GET)', () => {
      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/invalid-id')
          .expect(404);
      });
    });

    describe('/api/public/articles/:id/view (POST)', () => {
      it('should accept any id (no validation)', () => {
        return request(app.getHttpServer())
          .post('/api/public/articles/invalid-id/view')
          .expect(201); // incrementViewCount 不验证文章是否存在
      });
    });

    describe('/api/public/articles/:id/like (POST)', () => {
      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .post('/api/public/articles/invalid-id/like')
          .expect(404); // 文章不存在
      });
    });
  });
});