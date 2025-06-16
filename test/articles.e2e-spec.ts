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

    // 尝试获取管理员token（如果有默认管理员账户）
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      adminToken = adminLoginResponse.body.data.token;
    } catch (error) {
      // 如果没有默认管理员，使用普通用户token
      adminToken = authToken;
    }
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
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data.items)).toBe(true);
          });
      });

      it('should get articles with pagination', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles?page=1&limit=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.pagination).toBeDefined();
          });
      });
    });

    describe('/api/public/articles/recommended (GET)', () => {
      it('should get recommended articles', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/recommended')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('/api/public/articles/popular (GET)', () => {
      it('should get popular articles', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/popular')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('/api/public/articles/tags (GET)', () => {
      it('should get all tags', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/tags')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });
  });

  describe('Admin Articles API', () => {
    describe('/api/admin/articles (POST)', () => {
      it('should create article with valid token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testArticle)
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.title).toBe(testArticle.title);
            articleId = res.body.data.id;
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/articles')
          .send(testArticle)
          .expect(401);
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: '', // 空标题
            content: 'content'
          })
          .expect(400);
      });
    });

    describe('/api/admin/articles (GET)', () => {
      it('should get articles list for admin', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles')
          .expect(401);
      });
    });

    describe('/api/admin/articles/:id (GET)', () => {
      it('should get article by id', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/articles/${articleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(articleId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('/api/admin/articles/:id (PATCH)', () => {
      it('should update article', () => {
        const updateData = {
          title: 'Updated Test Article',
          content: 'Updated content'
        };
        return request(app.getHttpServer())
          .patch(`/api/admin/articles/${articleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe(updateData.title);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .patch(`/api/admin/articles/${articleId}`)
          .send({ title: 'New Title' })
          .expect(401);
      });
    });

    describe('/api/admin/articles/stats (GET)', () => {
      it('should get articles statistics', () => {
        return request(app.getHttpServer())
          .get('/api/admin/articles/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
          });
      });
    });

    describe('/api/admin/articles/:id (DELETE)', () => {
      it('should delete article', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/articles/${articleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail to delete non-existent article', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/articles/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  describe('Public Article Detail API', () => {
    let publicArticleId: string;

    beforeAll(async () => {
      // 创建一个公开文章用于测试
      const response = await request(app.getHttpServer())
        .post('/api/admin/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testArticle,
          title: 'Public Test Article',
          status: 'published'
        });
      publicArticleId = response.body.data.id;
    });

    describe('/api/public/articles/:id (GET)', () => {
      it('should get public article by id', () => {
        return request(app.getHttpServer())
          .get(`/api/public/articles/${publicArticleId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(publicArticleId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/public/articles/invalid-id')
          .expect(404);
      });
    });

    describe('/api/public/articles/:id/view (POST)', () => {
      it('should record article view', () => {
        return request(app.getHttpServer())
          .post(`/api/public/articles/${publicArticleId}/view`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });

    describe('/api/public/articles/:id/like (POST)', () => {
      it('should like article', () => {
        return request(app.getHttpServer())
          .post(`/api/public/articles/${publicArticleId}/like`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });
  });
});