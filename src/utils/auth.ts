import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'miaoyou-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7D';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
  userId?: string;
  userRole?: string;
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  static extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  static async verifyAdmin(request: Request): Promise<JwtPayload | null> {
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return null;
    }

    return payload;
  }

  /**
   * 验证管理员权限（新版本）
   */
  static async verifyAdminToken(request: Request): Promise<AuthResult> {
    const token = this.extractTokenFromRequest(request);
    
    if (!token) {
      return {
        success: false,
        message: '未提供认证令牌'
      };
    }

    const payload = this.verifyToken(token);
    
    if (!payload) {
      return {
        success: false,
        message: '无效的认证令牌'
      };
    }

    if (payload.role !== 'admin') {
      return {
        success: false,
        message: '权限不足，需要管理员权限'
      };
    }

    return {
      success: true,
      userId: payload.userId,
      userRole: payload.role
    };
  }

  /**
   * 验证用户认证
   */
  static async verifyAuth(request: Request): Promise<AuthResult> {
    const token = this.extractTokenFromRequest(request);
    
    if (!token) {
      return {
        success: false,
        message: '未提供认证令牌'
      };
    }

    const payload = this.verifyToken(token);
    
    if (!payload) {
      return {
        success: false,
        message: '无效的认证令牌'
      };
    }

    return {
      success: true,
      userId: payload.userId,
      userRole: payload.role
    };
  }
}

export const requireAuth = async (request: Request) => {
  const payload = await AuthUtils.verifyAdmin(request);
  if (!payload) {
    throw new Error('Unauthorized');
  }
  return payload;
};