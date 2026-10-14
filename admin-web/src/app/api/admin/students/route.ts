import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, grade, studentCode, password } = await request.json();
    const teacherId = request.headers.get('x-user-id') || 'teacher-1';
    
    console.log('[POST /api/admin/students] payload:', { name, studentCode, teacherId });

    if (!name || !studentCode || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        name,
        grade,
        studentCode,
        password: hashedPassword,
        teacherId: teacherId,
      }
    });

    console.log('[POST /api/admin/students] created:', student.id);
    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    console.error('[POST /api/admin/students] error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Student code already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create student' }, { status: 500 });
  }
}
