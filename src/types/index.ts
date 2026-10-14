// ============================================
// C 端统一类型层
//  - 对齐 admin-web Prisma schema 与 /api/c/* 契约
//  - mock 数据与真实接口共用同一类型，联调时零类型改动
// ============================================

// 学员（对齐后台 Student 实体）
export interface StudentInfo {
  id: string
  name: string
  studentCode: string
}

export type LoginResult = StudentInfo

// ---------- 单词 ----------
export interface WordInfo {
  id: string
  spelling: string
  meaning: string
  phonetic: string
}

// ---------- 答题 ----------
export type QuizType = 'typeA' | 'typeB' // A 听音选词 / B 看词选义

export interface QuizOption extends WordInfo {
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string // wordId
  type: QuizType
  word: WordInfo
  options: QuizOption[]
}

// 提交体（对齐 /api/c/submit 请求）
export interface SubmitAnswer {
  wordId: string
  isCorrect: boolean // 最终结果（重做修正后）
  isRetried: boolean
}

export interface SubmitPayload {
  planId: string
  studentId: string
  totalSeconds: number
  answers: SubmitAnswer[]
}

// ---------- 复习列表（home） ----------
export type TaskStatus = 'todo' | 'done'

export interface TaskItem {
  planId: string
  batchName: string
  classDate: string
  dueDate: string
  dueDays: number // 距学习日天数，用于「第 N 天」标题
  reviewIndex: number // 第几次复习 1~10
  totalIndex: number // 共 10 次
  status: TaskStatus
  wordCount: number
  doneCount: number
  accuracy: number
  finishTime: string
  wrongWords: WordInfo[] // 重做后仍错的词
}

export interface TaskGroup {
  date: string
  weekday: string
  label: string
  tasks: TaskItem[]
}

// ---------- 我的（mine） ----------
export interface PeriodStat {
  wordCount: number
  dayCount: number
  duration: string
  accuracy: number
}

export interface PeriodStats {
  today: PeriodStat
  week: PeriodStat
  month: PeriodStat
}

export interface BatchProgress {
  name: string
  classDate: string
  doneCount: number
  totalCount: number
}

export interface ProfileData {
  student: StudentInfo
  slogans: string[]
  periodStats: PeriodStats
  batches: BatchProgress[]
}
