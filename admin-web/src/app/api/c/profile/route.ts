import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateStr, formatDuration } from '@/lib/c-format';

const SLOGANS = [
  '单词重在复习，今天见过的单词，明天再见一面。',
  '复习一次，记得更牢一次。',
  '忘了没关系，再复习一遍就回来了。',
  '每一次复习，都是小芽在长高。',
  '今天复习的单词，才真正属于你。'
];

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const studentId = request.headers.get('x-user-id');
    if (!studentId) {
      return NextResponse.json({ error: 'Missing student' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 窗口：今日 / 近 7 天 / 近 30 天（口径与 admin/stats 一致：天数去重、平均正确率、总时长、总词数）
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 7 * DAY_MS);
    const monthStart = new Date(now.getTime() - 30 * DAY_MS);

    const sessions = await prisma.reviewSession.findMany({
      where: { studentId },
      include: { answers: true },
      orderBy: { createdAt: 'asc' }
    });

    const calc = (from: Date) => {
      const inWindow = sessions.filter((s) => s.createdAt >= from);
      const days = new Set(inWindow.map((s) => toDateStr(s.createdAt))).size;
      // 按「词」统计：同一次复习中同一个词的多道题只计一次
      const wordCount = inWindow.reduce(
        (sum, s) => sum + new Set(s.answers.map((a) => a.wordId)).size,
        0
      );
      const totalSeconds = inWindow.reduce((sum, s) => sum + s.totalSeconds, 0);
      const accuracy =
        inWindow.length > 0
          ? Math.round(inWindow.reduce((sum, s) => sum + s.accuracy, 0) / inWindow.length)
          : 0;
      return {
        wordCount,
        dayCount: days,
        duration: formatDuration(totalSeconds),
        accuracy
      };
    };

    // 批次进度：每个批次已完成（DONE）计划数 / 计划总数
    const batches = await prisma.batch.findMany({
      where: { studentId },
      include: { reviewPlans: true },
      orderBy: { classDate: 'desc' }
    });
    const batchProgress = batches.map((b) => ({
      name: b.name,
      classDate: toDateStr(b.classDate),
      doneCount: b.reviewPlans.filter((p) => p.status === 'DONE').length,
      totalCount: b.reviewPlans.length
    }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentCode: student.studentCode
        },
        slogans: SLOGANS,
        periodStats: {
          today: calc(todayStart),
          week: calc(weekStart),
          month: calc(monthStart)
        },
        batches: batchProgress
      }
    });
  } catch (error) {
    console.error('[c/profile] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
