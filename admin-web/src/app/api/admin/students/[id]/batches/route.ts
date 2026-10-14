import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    
    // 查询该学员的批次，并关联单词数量和复习计划状态
    const batches = await prisma.batch.findMany({
      where: { studentId },
      orderBy: { classDate: 'desc' },
      include: {
        _count: {
          select: { words: true }
        },
        reviewPlans: {
          select: { status: true }
        }
      }
    });

    // 格式化输出数据
    const formattedBatches = batches.map(batch => {
      // 简单判断是否有已完成的复习计划
      const reviewCount = batch.reviewPlans.filter(p => p.status === 'DONE').length;
      return {
        id: batch.id,
        name: batch.name,
        classDate: batch.classDate.toISOString().split('T')[0],
        wordCount: batch._count.words,
        isChecked: true, // 真实入库的肯定已核验
        reviewCount
      };
    });

    return NextResponse.json({ success: true, data: formattedBatches });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch batches' }, { status: 500 });
  }
}
