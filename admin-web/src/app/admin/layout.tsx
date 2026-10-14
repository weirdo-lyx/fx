'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// 根据原型定义的导航菜单
const NAV_ITEMS = [
  { path: '/admin/dashboard', label: '学员复习统计', title: '学员复习统计', sub: '按天 / 自然周统计每个学员的复习数据' },
  { path: '/admin/students', label: '学员列表', title: '学员列表', sub: '学员姓名 + 操作，点「查看」进入学员详情页' },
  { path: '/admin/words', label: '词条搜索', title: '词条搜索', sub: '搜索、行内编辑、批量编辑、软删除' },
  { path: '/admin/upload', label: '批次上传', title: '批次上传', sub: '图片上传 → 识别 → 人工校对 → 确认入库' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // 查找当前路由对应的菜单信息，用于渲染顶部标题
  const currentNav = NAV_ITEMS.find(item => pathname.startsWith(item.path)) || NAV_ITEMS[0];

  return (
    <div className="frame">
      {/* 侧边导航 */}
      <aside className="side">
        <div className="brand">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect width="30" height="30" rx="8" fill="#FFFFFF" opacity="0"/>
            <path d="M12 22v-9" stroke="#7BC896" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 13C12 8.5 8.8 6 4.5 6c0 4.5 3.2 7 7.5 7z" fill="#7BC896"/>
            <path d="M12 11c0-4.5 3.2-7 7.5-7 0 4.5-3.2 7-7.5 7z" fill="#FF8F1F"/>
          </svg>
          <div><b>木芽英语</b><span>老师工作台</span></div>
        </div>
        
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`navitem ${pathname.startsWith(item.path) ? 'on' : ''}`}
          >
            <span className="dot"></span>
            {item.label}
          </Link>
        ))}
        
        <div className="foot">
          木芽英语后台 · v1.0<br/>
          Next.js + Prisma
        </div>
      </aside>

      {/* 主区 */}
      <div className="main">
        {/* 顶部栏 */}
        <div className="topbar">
          <div>
            <div className="crumbs" id="crumbs">
              {/* 面包屑预留位置 */}
            </div>
            <div className="pt">{currentNav?.title}</div>
            <div className="sub">{currentNav?.sub}</div>
          </div>
          <div className="spacer"></div>
          <div className="avatar">王老师</div>
        </div>

        {/* 页面内容区 */}
        <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
