import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, totalSeconds, answers } = body;
    // 学员身份优先取请求体 studentId（C 端登录态），缺失时回退 middleware 注入的 x-user-id
    const studentId = body.studentId || request.headers.get('x-user-id');
    // answers 格式: [{ wordId, isCorrect, isRetried }]
    // 正确率口径（PRD 10.2 / C 端弹窗一致）= 首次答对数 ÷ 总题数
    // 每个词恰好产生一条首次作答记录（isRetried=false），重做记录不参与分母
    const firstAttempts = answers.filter((a: any) => !a.isRetried);
    const firstCorrect = firstAttempts.filter((a: any) => a.isCorrect).length;
    const accuracy =
      firstAttempts.length > 0
        ? Math.round((firstCorrect / firstAttempts.length) * 100)
        : 0;

    await prisma.$transaction(async (tx) => {
      // 0. 检查 Plan 是否存在且未提交
      const plan = await tx.reviewPlan.findUnique({ where: { id: planId } });
      if (!plan) throw new Error('Plan not found');
      if (plan.status === 'DONE') throw new Error('Plan already submitted');

      // 1. 创建 Session
      const session = await tx.reviewSession.create({
        data: {
          planId,
          studentId,
          totalSeconds,
          accuracy
        }
      });

      // 2. 插入答题明细 (SQLite 不支持 createMany，改用 Promise.all)
      await Promise.all(
        answers.map((a: any) => 
          tx.reviewAnswer.create({
            data: {
              sessionId: session.id,
              wordId: a.wordId,
              isCorrect: a.isCorrect,
              isRetried: a.isRetried || false
            }
          })
        )
      );

      // 3. 更新 Plan 状态为 DONE
      await tx.reviewPlan.update({
        where: { id: planId },
        data: { status: 'DONE' }
      });
    });

    return NextResponse.json({ success: true, message: '提交成功' });
  } catch (error: any) {
    console.error('[c/submit] error:', error);
    return NextResponse.json({ error: '成绩提交失败', debug: error.message }, { status: 500 });
  }
}
