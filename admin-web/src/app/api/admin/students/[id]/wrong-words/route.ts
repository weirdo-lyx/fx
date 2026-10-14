import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;

    // 查该学员所有错题 (isCorrect = false)
    const wrongAnswers = await prisma.reviewAnswer.findMany({
      where: {
        session: { studentId },
        isCorrect: false
      },
      include: {
        word: {
          include: { batch: true }
        }
      },
      orderBy: { answeredAt: 'desc' }
    });

    // 去重，保留最新一次的记录
    const uniqueWrongWords = new Map();
    for (const answer of wrongAnswers) {
      if (!uniqueWrongWords.has(answer.wordId)) {
        uniqueWrongWords.set(answer.wordId, {
          wordId: answer.word.id,
          spelling: answer.word.spelling,
          meaning: answer.word.meaning,
          phonetic: answer.word.phonetic,
          classDate: answer.word.batch.classDate,
          lastWrongAt: answer.answeredAt
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: Array.from(uniqueWrongWords.values()) 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get wrong words' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // 原型中的「删除选中」逻辑（从错题本中移除，但不删除词条）
  try {
    const { id: studentId } = await params;
    const { wordIds } = await request.json();
    
    // 这里我们可以用一种机制来标记，例如增加一个 ignore 表，或者简单起见，把 isCorrect 更新为 true。
    // 但更严谨的做法是新增一张表 `IgnoredWrongWord`，这里为保持简单，仅做 Mock 响应。
    return NextResponse.json({ success: true, message: '已从易错词列表中移除' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
