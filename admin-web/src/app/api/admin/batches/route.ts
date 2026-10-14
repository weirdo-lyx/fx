import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, batchName, classDate, words } = body;
    // words 是校验后传入的数组: [{ spelling, phonetic, meaning, confidence }]

    // 计算未来的 10 个复习时间点 (依据艾宾浩斯改版: 1,2,3,5,7,9,12,14,17,21)
    const reviewIntervals = [1, 2, 3, 5, 7, 9, 12, 14, 17, 21];
    const baseDate = new Date(classDate);

    // 开启 Prisma 事务保证原子性
    const batch = await prisma.$transaction(async (tx) => {
      // 1. 创建批次
      const newBatch = await tx.batch.create({
        data: {
          name: batchName,
          studentId,
          classDate: baseDate,
          status: 'IMPORTED'
        }
      });

      // 2. 写入词条 (SQLite 不支持 createMany，改用 Promise.all)
      await Promise.all(
        words.map((w: any) => 
          tx.word.create({
            data: {
              batchId: newBatch.id,
              spelling: w.spelling,
              phonetic: w.phonetic,
              meaning: w.meaning,
              confidence: w.confidence,
              status: 'ACTIVE'
            }
          })
        )
      );

      // 3. 生成 10 次复习计划 (SQLite 不支持 createMany，改用 Promise.all)
      await Promise.all(
        reviewIntervals.map((interval, index) => {
          const dueDate = new Date(baseDate.getTime());
          dueDate.setDate(dueDate.getDate() + interval);
          return tx.reviewPlan.create({
            data: {
              batchId: newBatch.id,
              reviewIndex: index + 1,
              dueDate,
              status: 'PENDING'
            }
          });
        })
      );

      return newBatch;
    });

    return NextResponse.json({ success: true, data: batch });
  } catch (error: any) {
    console.error('Batch creation error:', error);
    return NextResponse.json({ success: false, error: '入库与排期生成失败', debug: error.message }, { status: 500 });
  }
}
