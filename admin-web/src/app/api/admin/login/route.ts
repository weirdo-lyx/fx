import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'muyamagicsecret');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 检查最近 15 分钟内的失败次数
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentFailures = await prisma.loginAttempt.count({
      where: {
        username,
        success: false,
        createdAt: { gte: fifteenMinsAgo }
      }
    });

    if (recentFailures >= 5) {
      return NextResponse.json({ success: false, message: '账号已锁定，请15分钟后再试' }, { status: 429 });
    }

    // 简单的原型验证 (生产环境应查Teacher表并用bcrypt比对)
    const isSuccess = username === 'teacher' && password === '123456';

    // 记录尝试
    try {
      await prisma.loginAttempt.create({
        data: { username, ip, success: isSuccess }
      });
    } catch (e) {
      console.error('Failed to log login attempt:', e);
    }

    if (!isSuccess) {
      return NextResponse.json({ success: false, message: '账号或密码错误' }, { status: 401 });
    }

    const token = await new SignJWT({ userId: username, username, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET);

    // 写入 HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/'
    });

    return NextResponse.json({ success: true, message: '登录成功', data: { token } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

