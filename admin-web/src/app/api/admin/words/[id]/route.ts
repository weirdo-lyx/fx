import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: wordId } = await params;
    const { spelling, phonetic, meaning } = await request.json();

    const word = await prisma.word.update({
      where: { id: wordId },
      data: { spelling, phonetic, meaning }
    });

    // 记录日志 (可选，防止溯源丢失)
    await prisma.wordAuditLog.create({
      data: {
        wordId,
        operator: 'Teacher',
        actionType: 'EDIT',
        afterState: JSON.stringify({ spelling, phonetic, meaning })
      }
    });

    return NextResponse.json({ success: true, data: word });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update word' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: wordId } = await params;
    
    // 软删除
    const word = await prisma.word.update({
      where: { id: wordId },
      data: { status: 'DELETED' }
    });

    await prisma.wordAuditLog.create({
      data: {
        wordId,
        operator: 'Teacher',
        actionType: 'DELETE'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete word' }, { status: 500 });
  }
}
