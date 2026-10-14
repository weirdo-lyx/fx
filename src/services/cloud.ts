import Taro from '@tarojs/taro'

// ============================================
// 传输层：通道适配
//  - isWeapp   ：当前是否微信小程序环境
//  - USE_REMOTE：联调开关（false = 本地 mock 完整功能演示；true = 走 admin-web 真实接口）
//  - request() ：HTTP 通道（Taro.request → admin-web /api/c/*，header 携带 c_token）
//  - callFunction()：云函数通道（兼容保留，联调不依赖）
// 页面层不感知通道差异，切换只改 USE_REMOTE。
// ============================================

export const isWeapp = process.env.TARO_ENV === 'weapp'

// 联调开关：当前阶段对接 admin-web 真实接口（USE_REMOTE=true）。
// 置回 false 可切回本地 mock 完整功能演示。
export const USE_REMOTE = true

// admin-web 地址（联调时按实际环境修改；小程序真机联调需使用 https 域名）
export const API_BASE = 'http://localhost:3000'

let cToken = Taro.getStorageSync('c_token') || ''
export function setCToken(token: string) {
  cToken = token
  // 持久化登录态：H5 刷新/小程序重启后自动恢复，无需重新登录
  if (token) {
    Taro.setStorageSync('c_token', token)
  } else {
    Taro.removeStorageSync('c_token')
  }
}

export async function request<T = any>(
  path: string,
  options?: { method?: 'GET' | 'POST'; data?: any }
): Promise<T> {
  const res = await Taro.request({
    url: `${API_BASE}${path}`,
    method: options?.method || 'GET',
    data: options?.data,
    header: {
      'content-type': 'application/json',
      // 后端 middleware 通过 c_token 鉴权：浏览器禁止脚本设置 Cookie 头，统一走 Authorization
      Authorization: cToken ? `Bearer ${cToken}` : ''
    }
  })
  const body = res.data as any
  if (res.statusCode === 401) {
    // 登录态失效：清除本地学员信息与 token，并回到登录页（传输层统一处理，页面层无感）
    Taro.removeStorageSync('student')
    Taro.removeStorageSync('c_token')
    setCToken('')
    Taro.reLaunch({ url: '/pages/login/index' })
    throw new Error('登录已过期，请重新登录')
  }
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(body?.error || `请求失败(${res.statusCode})`)
  }
  // 兼容三种返回形态：
  //  1) { success, data }        -> 返回 data（如 tasks/profile/quiz）
  //  2) { success, ... } 无 data -> 返回整个响应体（如 login 的 token/student、submit 的 success）
  //  3) 直接返回数据体（无 success 字段）
  if (body && body.success !== undefined) {
    return body.data !== undefined ? body.data : body
  }
  return body as T
}

// 云函数通道（兼容保留）
export async function callFunction<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<T> {
  const res = await Taro.cloud.callFunction({ name, data })
  const result = res.result as { code: number; message: string; data: T }
  if (result.code !== 0) {
    console.error(`[Cloud] ${name} failed:`, result.message)
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export function getDatabase() {
  if (!isWeapp) {
    return null
  }
  return Taro.cloud.database()
}
