import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateStr } from '@/lib/c-format';

// 本地时区当天 00:00:00
function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// 本地时区当天 23:59:59.999
function dayEnd(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// 时长文案：'0s' / '45s' / '4m12s' / '22m08s' / '1h05m'
function fmtDuration(sec: number): string {
  if (!sec || sec <= 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

// 学员维度统计（FR-S-01）：按天 / 自然周
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dim = searchParams.get('dim') === 'week' ? 'week' : 'day';
    const dateStr = searchParams.get('date') || '';

    // 基准日期：非法或缺失时取今天
    const base = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? (() => {
          const [y, m, d] = dateStr.split('-').map(Number);
          return new Date(y, m - 1, d);
        })()
      : new Date();

    // 统计周期：按天 = 当日；按自然周 = 周一 00:00 ~ 周日 23:59（周一为周首日）
    let from: Date;
    let to: Date;
    let periodDays: number;
    if (dim === 'day') {
      from = dayStart(base);
      to = dayEnd(base);
      periodDays = 1;
    } else {
      const dow = base.getDay(); // 0 = 周日
      const monday = new Date(base);
      monday.setDate(base.getDate() + (dow === 0 ? -6 : 1 - dow));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      from = dayStart(monday);
      to = dayEnd(sunday);
      periodDays = 7;
    }

    // 过期学员不再出现在学员复习统计中
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' }
    });
    const stats = [];

    for (const student of students) {
      const sessions = await prisma.reviewSession.findMany({
        where: { studentId: student.id, createdAt: { gte: from, lte: to } },
        include: { answers: true }
      });

      // 总复习天数：周期内有答题记录的天数（按天去重）
      const daysCount = new Set(sessions.map((s) => toDateStr(s.createdAt))).size;

      // 复习天数占比 = 总复习天数 ÷ 周期总天数（按天 = 1 / 按自然周 = 7）
      const ratio = Math.round((daysCount / periodDays) * 100);

      // 平均正确率：Σ(词条首次答对) ÷ Σ(词条首次作答)，按题统计、重做不计
      const firstAnswers = sessions.flatMap((s) => s.answers.filter((a) => !a.isRetried));
      const acc =
        firstAnswers.length > 0
          ? Math.round(
              (firstAnswers.filter((a) => a.isCorrect).length / firstAnswers.length) * 100
            )
          : 0;

      // 总复习时长：Σ(单次复习 total_seconds)
      const totalSeconds = sessions.reduce((sum, s) => sum + s.totalSeconds, 0);

      // 总复习单词数：按单词去重（跨所有复习次）
      const words = new Set(sessions.flatMap((s) => s.answers.map((a) => a.wordId))).size;

      // 总复习词条数：各次复习的词条数之和（同一次复习内同词只算一个；跨次复习分别计）
      const entries = sessions.reduce(
        (sum, s) => sum + new Set(s.answers.map((a) => a.wordId)).size,
        0
      );

      // 平均用时：每个词条的平均复习时间（秒）= 总时长 ÷ 词条数
      const avgSeconds = entries > 0 ? totalSeconds / entries : 0;

      stats.push({
        id: student.id,
        name: student.name,
        days: daysCount,
        ratio,
        acc,
        avg: entries > 0 ? `${avgSeconds.toFixed(1)}s` : '—', // 展示用：'19.2s'
        total: fmtDuration(totalSeconds), // 展示用：'4m12s'
        words,
        entries,
        // 排序用原始数值（避免按字符串排序）
        avgSeconds: entries > 0 ? Number(avgSeconds.toFixed(1)) : null,
        totalSeconds
      });
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('[admin/stats] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get stats' }, { status: 500 });
  }
}
