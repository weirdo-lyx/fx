'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [dim, setDim] = useState<'day' | 'week'>('day');
  // 统计基准日期（按天 = 指定日期；按自然周 = 该日期所在自然周）
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // 从真实API获取数据
  const [studentsData, setStudentsData] = useState<any[]>([]);

  // 新增学员弹窗状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAccount, setNewStudentAccount] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/stats?dim=${dim}&date=${date}`);
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      
      const json = await res.json();
      if (json.success) {
        setStudentsData(json.data);
      } else {
        console.error('获取统计数据失败:', json.error);
      }
    } catch (err) {
      console.error('网络错误:', err);
    }
  };

  // 维度 / 日期变化时实时刷新
  useEffect(() => {
    fetchStats();
  }, [dim, date]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // 排序指示箭头（⇅ / ↑ / ↓）
  const arrow = (key: string) =>
    sortKey === key ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅';

  // 按当前排序列排序（'—' 视为最小值）
  const sortedData = studentsData.slice().sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey];
    const vb = b[sortKey];
    const na = va === null || va === undefined ? -1 : va;
    const nb = vb === null || vb === undefined ? -1 : vb;
    if (typeof na === 'string' && typeof nb === 'string') {
      return sortOrder === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
    }
    return sortOrder === 'asc' ? na - nb : nb - na;
  });

  const pad2 = (n: number) => String(n).padStart(2, '0');
  // 日期标签：按天 = 今天标注；按自然周 = 周一~周日区间
  const dateLabel = (() => {
    const [y, m, d] = date.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    if (dim === 'day') {
      const today = new Date();
      return cur.toDateString() === today.toDateString() ? '（今天）' : '';
    }
    const dow = cur.getDay();
    const monday = new Date(cur);
    monday.setDate(cur.getDate() + (dow === 0 ? -6 : 1 - dow));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `（${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())} ~ ${pad2(sunday.getMonth() + 1)}-${pad2(sunday.getDate())}）`;
  })();

  const getRatioChipClass = (ratio: number) => {
    if (ratio > 80) return 'chip ok';
    if (ratio >= 50) return 'chip warn';
    return 'chip bad';
  };

  const getAccChipClass = (acc: number) => {
    if (acc > 85) return 'chip ok';
    if (acc >= 60) return 'chip warn';
    return 'chip bad';
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentAccount || !newStudentPassword) {
      alert('请输入完整的学员信息');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName,
          studentCode: newStudentAccount,
          password: newStudentPassword
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        alert(`学员 ${newStudentName} 创建成功！`);
        setIsAddModalOpen(false);
        setNewStudentName('');
        setNewStudentAccount('');
        setNewStudentPassword('');
        fetchStats(); // 重新拉取
        router.push(`/admin/students/${data.data.id}`);
      } else {
        alert(data.error || data.message || '创建失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  return (
    <>
      {/* 筛选条 */}
      <div className="tf">
        <span className="lab">统计维度</span>
        <div className="seg">
          <div className={dim === 'day' ? 'on' : ''} onClick={() => setDim('day')}>按天</div>
          <div className={dim === 'week' ? 'on' : ''} onClick={() => setDim('week')}>按自然周</div>
        </div>
        <div className="datepick">
          📅
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--text2)',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <span>{dateLabel}</span>
        </div>
        <div className="spacer" style={{ flex: 1 }}></div>
        <button className="btn btn-p" onClick={() => setIsAddModalOpen(true)}>+ 新增学员</button>
      </div>

      {/* 数据表格卡片 */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>姓名 <span className="arr">{arrow('name')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('days')}>总复习天数 <span className="arr">{arrow('days')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ratio')}>复习天数占比 <span className="arr">{arrow('ratio')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('acc')}>平均正确率 <span className="arr">{arrow('acc')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('avgSeconds')}>平均用时 <span className="arr">{arrow('avgSeconds')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('totalSeconds')}>总复习时长 <span className="arr">{arrow('totalSeconds')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('words')}>总复习单词数 <span className="arr">{arrow('words')}</span></th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('entries')}>总复习词条数 <span className="arr">{arrow('entries')}</span></th>
              <th style={{ width: '90px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((s, i) => (
              <tr key={i} onClick={() => router.push(`/admin/students/${s.id}`)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="namecell">
                    <span className="na">{s.name.substring(0, 1)}</span>
                    <b>{s.name}</b>
                  </div>
                </td>
                <td className="mono">{s.days} 天</td>
                <td>
                  <span className={getRatioChipClass(s.ratio)}>{s.ratio}%</span>
                </td>
                <td>
                  {s.acc === 0 ? (
                    <span className="chip gray">—</span>
                  ) : (
                    <span className={getAccChipClass(s.acc)}>{s.acc}%</span>
                  )}
                </td>
                <td className="mono">{s.avg === '—' ? '—' : `${s.avg}/词条`}</td>
                <td className="mono">{s.total}</td>
                <td className="mono">{s.words}</td>
                <td className="mono">{s.entries}</td>
                <td><button className="btn btn-s">查看</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="hint" style={{ marginTop: '10px' }}>
          色块阈值：占比 &gt; 80% 绿 / 50~80% 黄 / &lt; 50% 红；正确率 &gt; 85% 绿 / 60~85% 黄 / &lt; 60% 红（PRD 7.5.2）。点击表头排序，点击行进入学员详情页。
        </div>
      </div>

      {/* 新增学员弹窗 */}
      {isAddModalOpen && (
        <div className="mask">
          <div className="modal" style={{ width: '420px' }}>
            <h3>新增学员</h3>
            <div className="frow">
              <label>学员姓名</label>
              <input 
                value={newStudentName} 
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="例如：李小明" 
              />
            </div>
            <div className="frow">
              <label>账号</label>
              <input 
                value={newStudentAccount} 
                onChange={(e) => setNewStudentAccount(e.target.value)}
                placeholder="例如：MB2026-XXXX" 
              />
            </div>
            <div className="frow">
              <label>密码</label>
              <input 
                value={newStudentPassword} 
                onChange={(e) => setNewStudentPassword(e.target.value)}
                placeholder="输入学员密码" 
                type="password"
              />
            </div>
            <div className="hint" style={{ marginLeft: '86px' }}>
              保存后，学员即可使用该账号密码在C端小程序登录。
            </div>
            <div className="mbtns">
              <button className="btn btn-g" onClick={() => setIsAddModalOpen(false)}>取消</button>
              <button className="btn btn-p" onClick={handleAddStudent}>保存并生成账号</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
