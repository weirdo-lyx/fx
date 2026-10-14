import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const C_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_C || 'muyamagicsecret-c'
);

export async function POST(request: Request) {
  try {
    const { studentCode, password } = await request.json();

    const student = await prisma.student.findUnique({
      where: { studentCode }
    });

    if (!student) {
      return NextResponse.json({ error: '学员账号不存在' }, { status: 404 });
    }

    // 原型阶段为了方便，如果 password 未哈希直接比对，生产应全部使用 bcrypt
    const isMatch = student.password === password || await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const token = await new SignJWT({ 
      role: 'student', 
      userId: student.id, 
      studentCode 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(C_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('c_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return NextResponse.json({ 
      success: true, 
      token,
      student: {
        id: student.id,
        name: student.name,
        studentCode: student.studentCode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
