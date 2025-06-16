import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let userId: string;
  let testUser = {
    username: 'testuser' + Date.now(),
    email: 'testuser' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Test User'
  };
  let anotherUser = {
    username: 'anotheruser' + Date.now(),
    email: 'anotheruser' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Another User'
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
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);
    userId = registerResponse.body.data.id;

    // 登录获取token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });
    authToken = loginResponse.body.data.token;

    // 注册另一个用户
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(anotherUser);

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

  describe('Admin Users API', () => {
    describe('/api/admin/users (GET)', () => {
      it('should get users list for admin', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data.items)).toBe(true);
          });
      });

      it('should get users with pagination', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users?page=1&limit=5')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.pagination).toBeDefined();
          });
      });

      it('should search users by keyword', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users?search=${testUser.username}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.items.length).toBeGreaterThan(0);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users')
          .expect(401);
      });
    });

    describe('/api/admin/users/:id (GET)', () => {
      it('should get user by id', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(userId);
            expect(res.body.data.username).toBe(testUser.username);
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/${userId}`)
          .expect(401);
      });
    });

    describe('/api/admin/users/:id (PATCH)', () => {
      it('should update user', () => {
        const updateData = {
          nickname: 'Updated Display Name',
          bio: 'Updated bio',
          status: 'active'
        };
        return request(app.getHttpServer())
          .patch(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.nickname).toBe(updateData.nickname);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .patch(`/api/admin/users/${userId}`)
          .send({ nickname: 'New Name' })
          .expect(401);
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .patch('/api/admin/users/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ nickname: 'New Name' })
          .expect(404);
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .patch(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'invalid-email' })
          .expect(400);
      });
    });

    describe('/api/admin/users/:id/ban (POST)', () => {
      it('should ban user', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/users/${userId}/ban`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Test ban reason' })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/users/${userId}/ban`)
          .send({ reason: 'Test reason' })
          .expect(401);
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .post('/api/admin/users/invalid-id/ban')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Test reason' })
          .expect(404);
      });
    });

    describe('/api/admin/users/:id/unban (POST)', () => {
      it('should unban user', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/users/${userId}/unban`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/users/${userId}/unban`)
          .expect(401);
      });
    });

    describe('/api/admin/users/:id (DELETE)', () => {
      let userToDelete: string;

      beforeAll(async () => {
        // 创建一个用于删除的用户
        const deleteUser = {
          username: 'deleteuser' + Date.now(),
          email: 'deleteuser' + Date.now() + '@example.com',
          password: 'password123',
          nickname: 'Delete User'
        };
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(deleteUser);
        userToDelete = response.body.data.id;
      });

      it('should delete user', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/users/${userToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail to delete non-existent user', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/users/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/users/some-id')
          .expect(401);
      });
    });

    describe('/api/admin/users/stats (GET)', () => {
      it('should get user statistics', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(typeof res.body.data.totalUsers).toBe('number');
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users/stats')
          .expect(401);
      });
    });
  });

  describe('User Profile API', () => {
    describe('/api/users/profile (GET)', () => {
      it('should get current user profile', () => {
        return request(app.getHttpServer())
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.username).toBe(testUser.username);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/api/users/profile')
          .expect(401);
      });
    });

    describe('/api/users/profile (PATCH)', () => {
      it('should update user profile', () => {
        const updateData = {
          nickname: 'Updated Profile Name',
          bio: 'Updated profile bio',
          website: 'https://example.com',
          location: 'Test City'
        };
        return request(app.getHttpServer())
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.nickname).toBe(updateData.nickname);
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .patch('/api/users/profile')
          .send({ nickname: 'New Name' })
          .expect(401);
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .patch('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ email: 'invalid-email' })
          .expect(400);
      });
    });

    describe('/api/users/change-password (POST)', () => {
      it('should change password', () => {
        return request(app.getHttpServer())
          .post('/api/users/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: testUser.password,
            newPassword: 'newpassword123'
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should fail with wrong current password', () => {
        return request(app.getHttpServer())
          .post('/api/users/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123'
          })
          .expect(400);
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/users/change-password')
          .send({
            currentPassword: 'password',
            newPassword: 'newpassword'
          })
          .expect(401);
      });
    });
  });

  describe('Public User API', () => {
    describe('/api/public/users/:id (GET)', () => {
      it('should get public user profile', () => {
        return request(app.getHttpServer())
          .get(`/api/public/users/${userId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(userId);
            // 确保敏感信息不被返回
            expect(res.body.data.email).toBeUndefined();
            expect(res.body.data.password).toBeUndefined();
          });
      });

      it('should fail with invalid id', () => {
        return request(app.getHttpServer())
          .get('/api/public/users/invalid-id')
          .expect(404);
      });
    });

    describe('/api/public/users/:id/visit (POST)', () => {
      it('should record user visit', () => {
        return request(app.getHttpServer())
          .post(`/api/public/users/${userId}/visit`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });
  });
});