import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: batchId } = await params;
    
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        student: true,
        words: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch batch details' }, { status: 500 });
  }
}
