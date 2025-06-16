import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let categoryId: string;
  let testUser = {
    username: 'categoryuser' + Date.now(),
    email: 'categoryuser' + Date.now() + '@example.com',
    password: 'password123',
    displayName: 'Category Test User'
  };
  let testCategory = {
    name: 'Test Category',
    description: 'This is a test category',
    color: '#FF5733'
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

  describe('Public Categories API', () => {
    describe('/api/public/categories (GET)', () => {
      it('should get public categories list', () => {
        return request(app.getHttpServer())
          .get('/api/public/categories')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('/api/public/categories/:id (GET)', () => {
      it('should handle invalid category id', () => {
        return request(app.getHttpServer())
          .get('/api/public/categories/invalid-id')
          .expect(404);
      });
    });
  });

  describe('Admin Categories API', () => {
    describe('/api/admin/categories (POST)', () => {
      it('should create category with valid token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testCategory)
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.name).toBe(testCategory.name);
            categoryId = res.body.data.id;
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/admin/categories')
          .send(testCategory)
          .expect(401);
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '', // 空名称
            description: 'description'
          })
          .expect(400);
      });

      it('should fail with duplicate name', () => {
        return request(app.getHttpServer())
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testCategory)
          .expect(409);
      });
    });

    describe('/api/admin/categories (GET)', () => {
      it('should get categories list for admin', () => {
        return request(app.getHttpServer())
          .get('/api/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/categories')
          .expect(401);
      });
    });

    describe('/api/admin/categories/:id (GET)', () => {
      it('should get category by id', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(categoryId);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/admin/categories/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('/api/admin/categories/:id (PATCH)', () => {
      it('should update category', () => {
        const updateData = {
          name: 'Updated Test Category',
          description: 'Updated description'
        };
        return request(app.getHttpServer())
          .patch(`/api/admin/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe(updateData.name);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .patch(`/api/admin/categories/${categoryId}`)
          .send({ name: 'New Name' })
          .expect(401);
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .patch('/api/admin/categories/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'New Name' })
          .expect(404);
      });
    });

    describe('/api/admin/categories/:id (DELETE)', () => {
      it('should delete category', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail to delete non-existent category', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/categories/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/categories/some-id')
          .expect(401);
      });
    });
  });
});