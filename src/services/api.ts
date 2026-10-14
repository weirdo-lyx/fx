// ============================================
// C 端业务 API 层（唯一业务入口）
//  - USE_REMOTE=false：走本地 mock（当前阶段完整功能演示）
//  - USE_REMOTE=true ：走 admin-web HTTP /api/c/*（联调通道，header 携带 c_token）
// 联调只改 cloud.ts 的 USE_REMOTE，页面层零改动。
// ============================================
import { USE_REMOTE, request, setCToken } from './cloud'
import {
  mockLogin,
  mockGetTaskGroups,
  mockQuiz,
  buildRetryQuiz,
  mockSubmit,
  mockProfile
} from '@/data/mock'
import type {
  LoginResult,
  TaskGroup,
  QuizQuestion,
  SubmitPayload,
  ProfileData
} from '@/types'

// 登录：成功后在真实通道下保存 c_token
export function login(account: string, password: string): Promise<LoginResult> {
  if (USE_REMOTE) {
    return request<any>('/api/c/login', { method: 'POST', data: { studentCode: account, password } }).then((res) => {
      setCToken(res.token)
      return res.student as LoginResult
    })
  }
  return mockLogin(account, password)
}

// 复习列表（按到期日分组）
export function getTaskGroups(): Promise<TaskGroup[]> {
  if (USE_REMOTE) {
    // 联调预留：后台需提供 /api/c/tasks
    return request<TaskGroup[]>('/api/c/tasks')
  }
  return mockGetTaskGroups()
}

// 答题页题组
export function getQuiz(planId: string): Promise<QuizQuestion[]> {
  if (USE_REMOTE) {
    return request<QuizQuestion[]>(`/api/c/quiz?planId=${planId}`)
  }
  return Promise.resolve(mockQuiz)
}

// 重做错题题组（复用 /api/c/quiz，按 wordIds 出题）
export function getRetryQuiz(wordIds: string[]): Promise<QuizQuestion[]> {
  if (USE_REMOTE) {
    return request<QuizQuestion[]>(`/api/c/quiz?wordIds=${wordIds.join(',')}`)
  }
  return Promise.resolve(buildRetryQuiz(wordIds))
}

// 提交答题记录（对齐 /api/c/submit 请求体）
export function submitSession(payload: SubmitPayload): Promise<{ success: boolean }> {
  if (USE_REMOTE) {
    return request<{ success: boolean }>('/api/c/submit', { method: 'POST', data: payload })
  }
  return mockSubmit(payload)
}

// 我的页
export function getProfile(): Promise<ProfileData> {
  if (USE_REMOTE) {
    // 联调预留：后台需提供 /api/c/profile
    return request<ProfileData>('/api/c/profile')
  }
  return mockProfile()
}
