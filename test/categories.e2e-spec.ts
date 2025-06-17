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
    nickname: 'Category Test User'
  };
  let testCategory = {
    name: 'Test Category',
    description: 'This is a test category'
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

    // 获取管理员token
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456'
      })
      .expect(200);
    adminToken = adminLoginResponse.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Categories API', () => {
    describe('/api/public/categories (GET)', () => {
      it('should get public categories list', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/public/categories?page=1&limit=10')
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(typeof response.body.data.total).toBe('number');
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
      it('should create category with valid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testCategory)
          .expect(201);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.name).toBe(testCategory.name);
        categoryId = response.body.data.id;
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
            name: 'a'.repeat(101), // 超过最大长度
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
      it('should get categories list for admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/admin/categories?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(typeof response.body.data.total).toBe('number');
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/categories')
          .expect(401);
      });
    });

    describe('/api/admin/categories/:id (GET)', () => {
      it('should get category by id', () => {
        if (!categoryId) {
          throw new Error('categoryId is not defined. Make sure the create test runs first.');
        }
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
        if (!categoryId) {
          throw new Error('categoryId is not defined. Make sure the create test runs first.');
        }
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
        const testId = categoryId || 'test-id';
        return request(app.getHttpServer())
          .patch(`/api/admin/categories/${testId}`)
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
        if (!categoryId) {
          throw new Error('categoryId is not defined. Make sure the create test runs first.');
        }
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