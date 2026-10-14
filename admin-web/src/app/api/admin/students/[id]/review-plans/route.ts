import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  toDateStr,
  formatFinishTime,
  weekdayCN,
  dayStart,
  dayEnd
} from '@/lib/c-format';

const DAY_MS = 24 * 60 * 60 * 1000;

// 学员复习情况：口径与 C 端复习列表（/api/c/tasks）保持一致
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;

    const batches = await prisma.batch.findMany({
      where: { studentId },
      include: {
        words: { where: { status: 'ACTIVE' } },
        reviewPlans: {
          include: {
            sessions: {
              orderBy: { createdAt: 'desc' },
              include: { answers: true }
            }
          },
          orderBy: { reviewIndex: 'asc' }
        }
      },
      orderBy: { classDate: 'desc' }
    });

    const now = new Date();
    const todayEnd = dayEnd(now);
    const tasks: any[] = [];

    for (const batch of batches) {
      const totalIndex = batch.reviewPlans.length || 10;
      const wordById = new Map(batch.words.map((w) => [w.id, w]));
      const classDate = toDateStr(batch.classDate);
      const wordList = batch.words.map((w) => ({
        id: w.id,
        spelling: w.spelling,
        phonetic: w.phonetic || '',
        meaning: w.meaning
      }));

      for (const plan of batch.reviewPlans) {
        // 与 C 端一致：未完成且未到期的计划不展示
        if (plan.status !== 'DONE' && plan.dueDate.getTime() > todayEnd.getTime()) continue;

        const session = plan.sessions[0]; // 最近一次
        const done = plan.status === 'DONE';
        const dueDays = Math.round(
          (dayStart(plan.dueDate).getTime() - dayStart(batch.classDate).getTime()) / DAY_MS
        );

        let wrongWords: any[] = [];
        let doneCount = 0;
        let accuracy = 0;
        let finishTime = '';
        let totalSeconds = 0;
        if (session) {
          accuracy = Math.round(session.accuracy);
          finishTime = formatFinishTime(session.createdAt);
          totalSeconds = session.totalSeconds;
          // 按「词」统计：同一个词的多道题只计一次
          const lastByWord = new Map<string, any>();
          for (const a of session.answers) lastByWord.set(a.wordId, a);
          doneCount = lastByWord.size;
          // 错误单词：最近一次 session 中「最终仍答错」的词
          const wrongIds = [...lastByWord.values()]
            .filter((a) => !a.isCorrect)
            .map((a) => a.wordId);
          wrongWords = wrongIds
            .map((id) => wordById.get(id))
            .filter((w): w is NonNullable<typeof w> => Boolean(w))
            .map((w) => ({
              id: w.id,
              spelling: w.spelling,
              meaning: w.meaning,
              phonetic: w.phonetic || ''
            }));
        }

        tasks.push({
          planId: plan.id,
          batchName: batch.name,
          classDate,
          dueDate: toDateStr(plan.dueDate),
          dueDays,
          reviewIndex: plan.reviewIndex,
          totalIndex,
          status: done ? 'done' : 'todo',
          wordCount: batch.words.length,
          doneCount,
          accuracy,
          finishTime,
          totalSeconds,
          wrongWords,
          words: wordList
        });
      }
    }

    // 按到期日分组（倒序：最近优先），与 C 端一致
    const byDate = new Map<string, any[]>();
    for (const t of tasks) {
      if (!byDate.has(t.dueDate)) byDate.set(t.dueDate, []);
      byDate.get(t.dueDate)!.push(t);
    }
    const dates = [...byDate.keys()].sort().reverse();
    const todayStr = toDateStr(now);
    const groups = dates.map((date) => ({
      date,
      weekday: weekdayCN(date),
      label: date === todayStr ? '今天' : '',
      tasks: byDate.get(date)!
    }));

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error('[admin/review-plans] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch review plans' }, { status: 500 });
  }
}
