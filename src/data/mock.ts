// ============================================
// C 端 Mock 数据（演示/联调用）
//  - 类型对齐 src/types（即后台 /api/c/* 契约）
//  - 内存态 mockDB：提交复习后任务状态/统计/批次进度实时更新，形成完整闭环
// ============================================
import type {
  StudentInfo,
  TaskItem,
  TaskGroup,
  QuizQuestion,
  SubmitPayload,
  ProfileData,
  PeriodStat
} from '@/types'

// 当前登录学员（对齐后台 Student 实体）
export const mockStudent: StudentInfo = {
  id: 'stu-001',
  name: '朵朵',
  studentCode: 'MB2026-0128'
};

export const mockPassword = '123456';

// ---------- 词库 ----------
const baseWords = [
  { id: 'w-1', spelling: 'well', meaning: 'adv. 很好地', phonetic: '/wel/' },
  { id: 'w-2', spelling: 'elephant', meaning: 'n. 大象', phonetic: '/ˈelɪfənt/' },
  { id: 'w-3', spelling: 'wonderful', meaning: 'adj. 精彩的', phonetic: '/ˈwʌndəfl/' },
  { id: 'w-4', spelling: 'diver', meaning: 'n. 潜水者', phonetic: '/ˈdaɪvər/' },
  { id: 'w-5', spelling: 'madam', meaning: 'n. 女士', phonetic: '/ˈmædəm/' },
  { id: 'w-6', spelling: 'type', meaning: 'n. 类型；v. 打字', phonetic: '/taɪp/' },
  { id: 'w-7', spelling: 'evening', meaning: 'n. 晚上', phonetic: '/ˈiːvnɪŋ/' },
  { id: 'w-8', spelling: 'top', meaning: 'n. 顶端', phonetic: '/tɒp/' },
  { id: 'w-9', spelling: 'point', meaning: 'v. 指向；n. 点', phonetic: '/pɔɪnt/' },
  { id: 'w-10', spelling: 'brave', meaning: 'adj. 勇敢的', phonetic: '/breɪv/' }
];

const wordMap = new Map(baseWords.map((w) => [w.id, w]));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- 内存态 mockDB ----------
interface AggStat {
  words: number
  days: number
  sec: number
  accSum: number
  count: number
}

interface MockDB {
  student: StudentInfo
  tasks: TaskItem[]
  stats: { today: AggStat; week: AggStat; month: AggStat }
  batches: { name: string; classDate: string; doneCount: number; totalCount: number }[]
}

const seedTasks: TaskItem[] = [
  {
    planId: 'plan-3',
    batchName: '阶段词汇 Unit 3',
    classDate: '2026-10-08',
    dueDate: '2026-10-10',
    dueDays: 3,
    reviewIndex: 3,
    totalIndex: 10,
    status: 'done',
    wordCount: 12,
    doneCount: 12,
    accuracy: 92,
    finishTime: '昨天 20:31',
    wrongWords: [
      { id: 'w-2', spelling: 'elephant', phonetic: '/ˈelɪfənt/', meaning: 'n. 大象' },
      { id: 'w-3', spelling: 'wonderful', phonetic: '/ˈwʌndəfl/', meaning: 'adj. 精彩的' }
    ]
  },
  {
    planId: 'plan-4',
    batchName: '阶段词汇 Unit 4',
    classDate: '2026-10-09',
    dueDate: '2026-10-10',
    dueDays: 1,
    reviewIndex: 1,
    totalIndex: 10,
    status: 'todo',
    wordCount: 10,
    doneCount: 0,
    accuracy: 0,
    finishTime: '',
    wrongWords: []
  },
  {
    planId: 'plan-2',
    batchName: '阶段词汇 Unit 2',
    classDate: '2026-09-20',
    dueDate: '2026-10-09',
    dueDays: 9,
    reviewIndex: 9,
    totalIndex: 10,
    status: 'done',
    wordCount: 10,
    doneCount: 10,
    accuracy: 100,
    finishTime: '10-09 19:02',
    wrongWords: []
  },
  {
    planId: 'plan-1',
    batchName: '阶段词汇 Unit 1',
    classDate: '2026-09-11',
    dueDate: '2026-10-09',
    dueDays: 14,
    reviewIndex: 8,
    totalIndex: 10,
    status: 'todo',
    wordCount: 8,
    doneCount: 0,
    accuracy: 0,
    finishTime: '',
    wrongWords: []
  }
];

const db: MockDB = {
  student: mockStudent,
  tasks: seedTasks.map((t) => ({ ...t, wrongWords: [...t.wrongWords] })),
  stats: {
    today: { words: 12, days: 1, sec: 252, accSum: 92, count: 1 },
    week: { words: 58, days: 5, sec: 1328, accSum: 455, count: 5 },
    month: { words: 226, days: 21, sec: 6480, accSum: 1890, count: 21 }
  },
  batches: [
    { name: '阶段词汇 Unit 1', classDate: '2026-09-11', doneCount: 8, totalCount: 10 },
    { name: '阶段词汇 Unit 2', classDate: '2026-09-20', doneCount: 6, totalCount: 10 },
    { name: '阶段词汇 Unit 3', classDate: '2026-10-08', doneCount: 3, totalCount: 10 },
    { name: '阶段词汇 Unit 4', classDate: '2026-10-09', doneCount: 0, totalCount: 10 }
  ]
};

// ---------- 登录 ----------
export function mockLogin(account: string, password: string): Promise<StudentInfo> {
  return new Promise((resolve, reject) => {
    if (account.trim() === db.student.studentCode && password === mockPassword) {
      resolve({ ...db.student });
    } else {
      reject(new Error('账号或密码错误（默认 ' + db.student.studentCode + ' / ' + mockPassword + '）'));
    }
  });
}

// ---------- 复习列表（home，按到期日分组） ----------
function toGroups(tasks: TaskItem[]): TaskGroup[] {
  const byDate = new Map<string, TaskItem[]>();
  tasks.forEach((t) => {
    if (!byDate.has(t.dueDate)) byDate.set(t.dueDate, []);
    byDate.get(t.dueDate)!.push(t);
  });
  const dates = [...byDate.keys()].sort().reverse();
  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  return dates.map((date) => {
    const d = new Date(date);
    return {
      date,
      weekday: weekdayMap[d.getDay()],
      label: date === todayStr ? '今天' : '',
      tasks: byDate.get(date)!
    };
  });
}

export function mockGetTaskGroups(): Promise<TaskGroup[]> {
  return Promise.resolve(toGroups(db.tasks));
}

// ---------- 答题 ----------
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

function buildMockOne(w: (typeof baseWords)[number], type: 'typeA' | 'typeB'): QuizQuestion {
  const distracts = shuffle(baseWords.filter((o) => o.id !== w.id)).slice(0, 3);
  const options = shuffle([w, ...distracts]).map((o) => ({
    ...o,
    isCorrect: o.id === w.id
  }));
  return {
    id: w.id,
    type,
    word: { ...w },
    options
  };
}

// 每个词复习 2 次：typeA 听音选词 + typeB 看词选义，并打散（同词不相邻）
export const mockQuiz: QuizQuestion[] = shuffleAvoidAdjacent(
  baseWords.flatMap((w) => [buildMockOne(w, 'typeA'), buildMockOne(w, 'typeB')])
);

// 仅错题的重做题组
export function buildRetryQuiz(wordIds: string[]): QuizQuestion[] {
  return mockQuiz.filter((q) => wordIds.includes(q.id));
}

// ---------- 提交（完整闭环：更新任务/统计/批次进度） ----------
export function mockSubmit(payload: SubmitPayload): Promise<{ success: boolean }> {
  const task = db.tasks.find((t) => t.planId === payload.planId);
  if (!task) return Promise.reject(new Error('任务不存在'));
  if (task.status === 'done') return Promise.resolve({ success: true }); // 幂等，防重复提交

  const total = payload.answers.length;
  const correct = payload.answers.filter((a) => a.isCorrect).length;
  // 后台口径：accuracy = 最终答对数 ÷ 总题数（重做修正后）
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongWords = payload.answers
    .filter((a) => !a.isCorrect)
    .map((a) => wordMap.get(a.wordId))
    .filter(Boolean) as TaskItem['wrongWords'];

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  task.status = 'done';
  task.doneCount = total;
  task.accuracy = accuracy;
  task.finishTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  task.wrongWords = wrongWords;

  // 我的页统计聚合（与后台 admin/stats 口径一致：天数去重、平均正确率、总时长）
  (['today', 'week', 'month'] as const).forEach((k) => {
    const s = db.stats[k];
    s.words += total;
    s.days += 1;
    s.sec += payload.totalSeconds;
    s.accSum += accuracy;
    s.count += 1;
  });

  // 批次完成度 +1
  const batch = db.batches.find((b) => b.name === task.batchName);
  if (batch && batch.doneCount < batch.totalCount) batch.doneCount += 1;

  return Promise.resolve({ success: true });
}

// ---------- 我的页 ----------
export const mockSlogans = [
  '单词重在复习，今天见过的单词，明天再见一面。',
  '复习一次，记得更牢一次。',
  '忘了没关系，再复习一遍就回来了。',
  '每一次复习，都是小芽在长高。',
  '今天复习的单词，才真正属于你。'
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}小时${m % 60}分`;
  return `${m}分${s}秒`;
}

function toPeriodStat(s: AggStat): PeriodStat {
  return {
    wordCount: s.words,
    dayCount: s.days,
    duration: formatDuration(s.sec),
    accuracy: s.count > 0 ? Math.round(s.accSum / s.count) : 0
  };
}

export function mockProfile(): Promise<ProfileData> {
  return Promise.resolve({
    student: { ...db.student },
    slogans: mockSlogans,
    periodStats: {
      today: toPeriodStat(db.stats.today),
      week: toPeriodStat(db.stats.week),
      month: toPeriodStat(db.stats.month)
    },
    batches: db.batches.map((b) => ({ ...b }))
  });
}
