import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 数组乱序辅助函数
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 打散题目，且保证同一个词的两题不相邻
function shuffleAvoidAdjacent<T extends { id: string }>(items: T[]): T[] {
  const arr = shuffle(items);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].id === arr[i - 1].id) {
      const j = arr.findIndex((x, k) => k > i && x.id !== arr[i - 1].id);
      if (j > -1) [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}

// 构建单题（干扰项从 pool 中抽取）
function buildOne(word: any, type: 'typeA' | 'typeB', pool: any[]) {
  // 抽取 3 个干扰项
  const distract = pool.filter((w) => w.id !== word.id);
  const shuffledPool = shuffle(distract);
  const wrongOptions = shuffledPool.slice(0, 3);

  const options = shuffle([word, ...wrongOptions]).map((w) => ({
    id: w.id,
    spelling: w.spelling,
    meaning: w.meaning,
    phonetic: w.phonetic,
    isCorrect: w.id === word.id
  }));

  return {
    id: word.id,
    type,
    word: {
      id: word.id,
      spelling: word.spelling,
      meaning: word.meaning,
      phonetic: word.phonetic,
    },
    options
  };
}

// 为一批目标词构建题目：每个词复习 2 次
//  - typeA 听音选词 + typeB 看词选义 各一次
//  - 两次互相打散，避免同一个词连续出现
function buildQuestions(targetWords: any[], pool: any[]) {
  const list = targetWords.flatMap((word) => [
    buildOne(word, 'typeA', pool),
    buildOne(word, 'typeB', pool)
  ]);
  return shuffleAvoidAdjacent(list);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const wordIdsParam = searchParams.get('wordIds');

    // 重做错题模式：按指定词构建题组（干扰项从全局词库抽取）
    if (wordIdsParam) {
      const ids = wordIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'Empty wordIds' }, { status: 400 });
      }
      const words = await prisma.word.findMany({
        where: { id: { in: ids }, status: 'ACTIVE' }
      });
      const allWords = await prisma.word.findMany({ where: { status: 'ACTIVE' } });
      const questions = buildQuestions(words, allWords);
      return NextResponse.json({ success: true, data: questions });
    }

    if (!planId) return NextResponse.json({ error: 'Missing planId or wordIds' }, { status: 400 });

    // 复习计划模式：按批次词条构建题组
    const plan = await prisma.reviewPlan.findUnique({
      where: { id: planId },
      include: {
        batch: {
          include: {
            words: { where: { status: 'ACTIVE' } }
          }
        }
      }
    });

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const targetWords = plan.batch.words;

    // 干扰项不足 4 个时从全局抽取
    let allWords = targetWords;
    if (targetWords.length < 4) {
      allWords = await prisma.word.findMany({ where: { status: 'ACTIVE' } });
    }

    const questions = buildQuestions(targetWords, allWords);
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
