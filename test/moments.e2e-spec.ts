import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Moments (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let momentId: string;
  let testUser = {
    username: 'momentuser' + Date.now(),
    email: 'momentuser' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Moment Test User'
  };
  let testMoment = {
    content: 'This is a test moment',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    mood: 'happy',
    location: 'Test Location'
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

  describe('Public Moments API', () => {
    describe('/api/public/moments (GET)', () => {
      it('should get public moments list', () => {
        return request(app.getHttpServer())
          .get('/api/public/moments')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data.items)).toBe(true);
          });
      });

      it('should get moments with pagination', () => {
        return request(app.getHttpServer())
          .get('/api/public/moments?page=1&limit=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.pagination).toBeDefined();
          });
      });
    });

    describe('/api/public/moments/:id (GET)', () => {
      it('should handle invalid moment id', () => {
        return request(app.getHttpServer())
          .get('/api/public/moments/invalid-id')
          .expect(404);
      });
    });
  });

  describe('Admin Moments API', () => {
    describe('/api/admin/moments (POST)', () => {
      it('should create moment with valid token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/moments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testMoment)
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.content).toBe(testMoment.content);
            momentId = res.body.data.id;
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/moments')
          .send(testMoment)
          .expect(401);
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .post('/api/admin/moments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            content: '', // 空内容
            mood: 'happy'
          })
          .expect(400);
      });
    });

    describe('/api/admin/moments (GET)', () => {
      it('should get moments list for admin', () => {
        return request(app.getHttpServer())
          .get('/api/admin/moments')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/moments')
          .expect(401);
      });
    });

    describe('/api/admin/moments/:id (GET)', () => {
      it('should get moment by id', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/moments/${momentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(momentId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/admin/moments/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('/api/admin/moments/:id (PATCH)', () => {
      it('should update moment', () => {
        const updateData = {
          content: 'Updated moment content',
          mood: 'excited'
        };
        return request(app.getHttpServer())
          .patch(`/api/admin/moments/${momentId}`)
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
          .patch(`/api/admin/moments/${momentId}`)
          .send({ content: 'New Content' })
          .expect(401);
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .patch('/api/admin/moments/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'New Content' })
          .expect(404);
      });
    });

    describe('/api/admin/moments/:id (DELETE)', () => {
      it('should delete moment', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/moments/${momentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail to delete non-existent moment', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/moments/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/moments/some-id')
          .expect(401);
      });
    });
  });

  describe('Public Moment Detail API', () => {
    let publicMomentId: string;

    beforeAll(async () => {
      // 创建一个公开动态用于测试
      const response = await request(app.getHttpServer())
        .post('/api/admin/moments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testMoment,
          content: 'Public Test Moment'
        });
      publicMomentId = response.body.data.id;
    });

    describe('/api/public/moments/:id (GET)', () => {
      it('should get public moment by id', () => {
        return request(app.getHttpServer())
          .get(`/api/public/moments/${publicMomentId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(publicMomentId);
          });
      });
    });

    describe('/api/public/moments/:id/view (POST)', () => {
      it('should record moment view', () => {
        return request(app.getHttpServer())
          .post(`/api/public/moments/${publicMomentId}/view`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });

    describe('/api/public/moments/:id/like (POST)', () => {
      it('should like moment', () => {
        return request(app.getHttpServer())
          .post(`/api/public/moments/${publicMomentId}/like`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });
  });
});