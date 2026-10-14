import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 设置学员在读状态：ACTIVE(在读) / EXPIRED(过期)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const { status } = await request.json();

    if (status !== 'ACTIVE' && status !== 'EXPIRED') {
      return NextResponse.json({ success: false, error: '状态值无效' }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { status }
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error('[admin/students/status] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}
