import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const studentId = searchParams.get('studentId') || '';

    let whereClause: any = {
      status: 'ACTIVE'
    };

    if (keyword) {
      whereClause.OR = [
        { spelling: { contains: keyword } },
        { meaning: { contains: keyword } }
      ];
    }

    if (studentId) {
      whereClause.batch = {
        studentId
      };
    }

    const words = await prisma.word.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { student: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // 限制50条防止数据过大
    });

    return NextResponse.json({ success: true, data: words });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch words' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { batchId, spelling, phonetic, meaning } = await request.json();

    if (!batchId || !spelling || !meaning) {
      return NextResponse.json({ success: false, error: '缺少必填字段：批次/单词/释义' }, { status: 400 });
    }

    const word = await prisma.word.create({
      data: {
        batchId,
        spelling,
        phonetic: phonetic || '',
        meaning,
        confidence: 100, // 人工录入，置信度满分
        status: 'ACTIVE'
      }
    });

    // 记录日志，与编辑/删除保持一致的可溯源
    await prisma.wordAuditLog.create({
      data: {
        wordId: word.id,
        operator: 'Teacher',
        actionType: 'CREATE',
        afterState: JSON.stringify({ spelling, phonetic, meaning })
      }
    });

    return NextResponse.json({ success: true, data: word });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create word' }, { status: 500 });
  }
}
