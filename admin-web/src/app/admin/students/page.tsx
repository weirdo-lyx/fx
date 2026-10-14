'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  // 在读学员 / 过期学员
  const [tab, setTab] = useState<'ACTIVE' | 'EXPIRED'>('ACTIVE');

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      if (json.success) {
        setStudents(json.data);
      }
    } catch (err) {
      console.error('获取学员列表失败:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 设置过期 / 恢复在读
  const changeStatus = async (student: any, status: 'ACTIVE' | 'EXPIRED') => {
    const actionLabel = status === 'EXPIRED' ? '设置过期' : '恢复在读';
    if (!confirm(`确认将学员「${student.name}」${actionLabel}吗？`)) return;

    try {
      const res = await fetch(`/api/admin/students/${student.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchStudents();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const visibleStudents = students.filter((s) => (s.status || 'ACTIVE') === tab);

  return (
    <>
      {/* 在读学员 / 过期学员 */}
      <div className="seg" style={{ width: '320px', marginBottom: '14px' }}>
        <div className={tab === 'ACTIVE' ? 'on' : ''} onClick={() => setTab('ACTIVE')}>在读学员</div>
        <div className={tab === 'EXPIRED' ? 'on' : ''} onClick={() => setTab('EXPIRED')}>过期学员</div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60%' }}>学员姓名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="namecell">
                    <span className="na">{student.name[0]}</span>
                    <b>{student.name}</b>
                  </div>
                </td>
                <td>
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="btn btn-g"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    查看
                  </Link>
                  {tab === 'ACTIVE' ? (
                    <button
                      className="btn btn-s"
                      style={{ marginLeft: '8px' }}
                      onClick={() => changeStatus(student, 'EXPIRED')}
                    >
                      设置过期
                    </button>
                  ) : (
                    <button
                      className="btn btn-s"
                      style={{ marginLeft: '8px' }}
                      onClick={() => changeStatus(student, 'ACTIVE')}
                    >
                      恢复在读
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visibleStudents.length === 0 && (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                  {tab === 'ACTIVE' ? '暂无在读学员' : '暂无过期学员'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="hint" style={{ marginTop: '10px' }}>
          点击「查看」进入该学员的学员详情页（基础信息 + 词条列表 / 学员复习情况 / 易错词三 Tab）。过期学员不会再出现在「学员复习统计」中。
        </div>
      </div>
    </>
  );
}
