import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  try {
    const { newPassword } = await request.json();
    console.log('[reset-password] start', { studentId, hasPassword: !!newPassword });

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: '密码不能为空且至少6位' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('[reset-password] hashed OK');

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { password: hashedPassword }
    });
    console.log('[reset-password] update OK', updated.id);

    return NextResponse.json({ success: true, message: '密码重置成功', data: { id: updated.id } });
  } catch (error: any) {
    console.error('[reset-password] error:', error);
    return NextResponse.json({ 
      success: false, 
      message: '重置失败', 
      debug: error.message 
    }, { status: 500 });
  }
}
