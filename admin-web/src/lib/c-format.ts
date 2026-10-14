// ============================================
// C 端接口共用格式化工具
//  - 日期/周几/时长文案对齐 C 端页面展示（home 完成时间、mine 复习时间）
// ============================================

// Date -> 'YYYY-MM-DD'（本地时区）
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Date -> 'HH:MM'
export function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 完成时间文案：今天 -> 'HH:MM'；昨天 -> '昨天 HH:MM'；更早 -> 'MM-DD HH:MM'
export function formatFinishTime(d: Date): string {
  const now = new Date();
  const date = toDateStr(d);
  if (date === toDateStr(now)) return toTimeStr(d);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date === toDateStr(yesterday)) return `昨天 ${toTimeStr(d)}`;
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${toTimeStr(d)}`;
}

// 时长文案（秒）：'X分Y秒' / 'X小时Y分'
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}小时${m % 60}分`;
  return `${m}分${s}秒`;
}

// 'YYYY-MM-DD' -> 中文周几
export function weekdayCN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const week = new Date(y, m - 1, d).getDay();
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][week];
}

// 本地时区当天 00:00:00
export function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// 本地时区当天 23:59:59.999
export function dayEnd(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
