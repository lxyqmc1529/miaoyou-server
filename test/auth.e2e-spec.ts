import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUser = {
    username: 'testuser' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    nickname: 'Test User'
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('注册成功');
        });
    });

    it('should fail with duplicate username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'password123',
          nickname: 'New User'
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'newuser2',
          email: 'newuser2@example.com',
          password: '123',
          nickname: 'New User 2'
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.token).toBeDefined();
          expect(res.body.data.user).toBeDefined();
          expect(res.body.data.user.username).toBe(testUser.username);
          authToken = res.body.data.token;
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        })
        .expect(401);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('should get user profile with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);
      
      const token = loginResponse.body.data.token;
      
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe(testUser.username);
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('should refresh token successfully', async () => {
      // First login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);
      
      const token = loginResponse.body.data.token;
      
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.token).toBeDefined();
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(401);
    });
  });
});