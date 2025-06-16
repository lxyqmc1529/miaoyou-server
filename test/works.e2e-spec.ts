import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Works (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let workId: string;
  let testUser = {
    username: 'workuser' + Date.now(),
    email: 'workuser' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Work Test User'
  };
  let testWork = {
    title: 'Test Work',
    description: 'This is a test work description',
    technologies: ['React', 'Node.js', 'TypeScript'],
    category: 'web',
    demoUrl: 'https://example.com/demo',
    githubUrl: 'https://github.com/example/repo',
    images: ['https://example.com/image1.jpg'],
    featured: false
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Works API', () => {
    describe('/api/public/works (GET)', () => {
      it('should get public works list', () => {
        return request(app.getHttpServer())
          .get('/api/public/works')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data.items)).toBe(true);
          });
      });

      it('should get works with pagination', () => {
        return request(app.getHttpServer())
          .get('/api/public/works?page=1&limit=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.pagination).toBeDefined();
          });
      });
    });

    describe('/api/public/works/featured (GET)', () => {
      it('should get featured works', () => {
        return request(app.getHttpServer())
          .get('/api/public/works/featured')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('/api/public/works/technologies (GET)', () => {
      it('should get all technologies', () => {
        return request(app.getHttpServer())
          .get('/api/public/works/technologies')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('/api/public/works/category/:category (GET)', () => {
      it('should get works by category', () => {
        return request(app.getHttpServer())
          .get('/api/public/works/category/web')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });

      it('should handle invalid category', () => {
        return request(app.getHttpServer())
          .get('/api/public/works/category/invalid-category')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });
  });

  describe('Admin Works API', () => {
    describe('/api/admin/works (POST)', () => {
      it('should create work with valid token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/works')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testWork)
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.title).toBe(testWork.title);
            workId = res.body.data.id;
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/works')
          .send(testWork)
          .expect(401);
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .post('/api/admin/works')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: '', // 空标题
            description: 'description'
          })
          .expect(400);
      });
    });

    describe('/api/admin/works (GET)', () => {
      it('should get works list for admin', () => {
        return request(app.getHttpServer())
          .get('/api/admin/works')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/works')
          .expect(401);
      });
    });

    describe('/api/admin/works/:id (GET)', () => {
      it('should get work by id', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/works/${workId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(workId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/admin/works/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('/api/admin/works/:id (PATCH)', () => {
      it('should update work', () => {
        const updateData = {
          title: 'Updated Test Work',
          description: 'Updated description',
          featured: true
        };
        return request(app.getHttpServer())
          .patch(`/api/admin/works/${workId}`)
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
          .patch(`/api/admin/works/${workId}`)
          .send({ title: 'New Title' })
          .expect(401);
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .patch('/api/admin/works/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'New Title' })
          .expect(404);
      });
    });

    describe('/api/admin/works/:id (DELETE)', () => {
      it('should delete work', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/works/${workId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail to delete non-existent work', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/works/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/works/some-id')
          .expect(401);
      });
    });
  });

  describe('Public Work Detail API', () => {
    let publicWorkId: string;

    beforeAll(async () => {
      // 创建一个公开作品用于测试
      const response = await request(app.getHttpServer())
        .post('/api/admin/works')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testWork,
          title: 'Public Test Work'
        });
      publicWorkId = response.body.data.id;
    });

    describe('/api/public/works/:id (GET)', () => {
      it('should get public work by id', () => {
        return request(app.getHttpServer())
          .get(`/api/public/works/${publicWorkId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(publicWorkId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/public/works/invalid-id')
          .expect(404);
      });
    });

    describe('/api/public/works/:id/view (POST)', () => {
      it('should record work view', () => {
        return request(app.getHttpServer())
          .post(`/api/public/works/${publicWorkId}/view`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });

    describe('/api/public/works/:id/like (POST)', () => {
      it('should like work', () => {
        return request(app.getHttpServer())
          .post(`/api/public/works/${publicWorkId}/like`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });
  });
});