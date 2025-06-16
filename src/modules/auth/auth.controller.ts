import { Controller, Post, Body, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: {
        token: result.access_token,
        user: result.user
      },
      message: '登录成功'
    };
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      data: {
        id: result.user.id,
        token: result.access_token,
        user: result.user
      },
      message: '注册成功'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Request() req: Express.Request & { user: { userId: string } }) {
    const user = await this.authService.findUserById(req.user.userId);
    const { password, ...result } = user;
    return result;
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '刷新令牌' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async refresh(@Request() req: Express.Request & { user: { userId: string; username: string; role: string } }) {
    // 更新最后登录时间
    await this.authService.updateLastLogin(req.user.userId);
    
    // 返回新的令牌
    const payload = {
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
    };
    
    return {
      success: true,
      data: {
        token: this.authService['jwtService'].sign(payload),
      },
      message: '令牌刷新成功'
    };
  }
}
