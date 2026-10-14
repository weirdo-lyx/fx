'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { formatDuration } from '@/lib/c-format';

export default function StudentDetailPage() {
  const routeParams = useParams();
  const studentId = routeParams.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'words' | 'review' | 'wrong'>('words');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // 模拟数据状态
  const [batches, setBatches] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [wrongWords, setWrongWords] = useState<any[]>([]);
  const [reviewGroups, setReviewGroups] = useState<any[]>([]);

  useEffect(() => {
    // 获取学员基础信息
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/admin/students`);
        const json = await res.json();
        if (json.success) {
          const found = json.data.find((s: any) => s.id === studentId);
          if (found) setStudent(found);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // 拉取真实的批次数据
    const fetchBatches = async () => {
      try {
        const res = await fetch(`/api/admin/students/${studentId}/batches`);
        const json = await res.json();
        if (json.success) {
          setBatches(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    // 拉取错词数据
    const fetchWrongWords = async () => {
      try {
        const res = await fetch(`/api/admin/students/${studentId}/wrong-words`);
        const json = await res.json();
        if (json.success) {
          setWrongWords(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // 拉取学员复习情况（口径与 C 端复习列表一致）
    const fetchReviewPlans = async () => {
      try {
        const res = await fetch(`/api/admin/students/${studentId}/review-plans`);
        const json = await res.json();
        if (json.success) {
          setReviewGroups(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStudent();
    fetchBatches();
    fetchWrongWords();
    fetchReviewPlans();
  }, [studentId]);

  const generateRandomPassword = () => {
    const pwd = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPassword(pwd);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('密码至少6位');
      return;
    }
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        alert(`密码已重置为: ${newPassword}`);
        setIsResetModalOpen(false);
        setNewPassword('');
      } else {
        alert(data.message || '重置失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  return (
    <>
      {/* 基础信息卡 */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="namecell" style={{ gap: '12px' }}>
          <span className="na" style={{ width: '44px', height: '44px', fontSize: '16px' }}>
            {student?.name?.substring(0, 1) || '?'}
          </span>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 600 }}>{student?.name || '加载中...'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '3px' }}>
              账号 <span className="mono">{student?.studentCode || '-'}</span>
            </div>
          </div>
        </div>
        <div className="spacer" style={{ flex: 1 }}></div>
        <span className="chip blue">{batches.length} 个批次</span>
        <button className="btn btn-g" onClick={() => setIsResetModalOpen(true)}>重置验证码</button>
      </div>

      {/* 三 Tab 切换 */}
      <div className="seg" style={{ width: '420px', marginBottom: '14px' }}>
        <div className={activeTab === 'words' ? 'on' : ''} onClick={() => setActiveTab('words')}>词条列表</div>
        <div className={activeTab === 'review' ? 'on' : ''} onClick={() => setActiveTab('review')}>学员复习情况</div>
        <div className={activeTab === 'wrong' ? 'on' : ''} onClick={() => setActiveTab('wrong')}>易错词</div>
      </div>

      {/* Tab 1：词条列表 */}
      {activeTab === 'words' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>上课日期</th>
                <th>单词数</th>
                <th>是否已人工核验</th>
                <th>总复习次数</th>
                <th>查看单词详情</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, index) => (
                <tr key={index}>
                  <td className="mono">{batch.classDate}</td>
                  <td>{batch.wordCount}</td>
                  <td>
                    <span className={batch.isChecked ? "chip ok" : "chip warn"}>
                      {batch.isChecked ? '是' : '否'}
                    </span>
                  </td>
                  <td>{batch.reviewCount}</td>
                  <td><button className="btn btn-g" onClick={() => router.push(`/admin/batches/${batch.id}`)}>查看单词详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="hint" style={{ marginTop: '10px' }}>
            点击「查看单词详情」进入该批次<b>词条详情页</b>（单词 / 音标 / 中文意思），支持编辑、删除与「添加单词」；规则沿用 FR-B-05（编辑仅后续复习生效，删除为软删除）。顶部面包屑可逐级返回上一层级。
          </div>
        </div>
      )}

      {/* Tab 2：学员复习情况（口径与 C 端复习列表一致） */}
      {activeTab === 'review' && (
        <>
          {reviewGroups.length === 0 && (
            <div className="card">
              <div className="hint" style={{ padding: '20px', textAlign: 'center' }}>暂无复习计划</div>
            </div>
          )}
          {reviewGroups.map((g: any) => (
            <div className="dg" key={g.date}>
              <div className="dh">
                {g.date} <span className="wd">{g.weekday}{g.label ? ` · ${g.label}` : ''}</span>
              </div>
              {g.tasks.map((t: any) => (
                t.status === 'done' ? (
                  <div className="wcard" key={t.planId}>
                    <div className="wt">{t.batchName}（第 {t.dueDays} 天） <span className="chip ok">已复习</span></div>
                    <div className="wd2">上课日期：{t.classDate} · {t.doneCount} 词</div>
                    <div className="wstat">
                      <span>用时 <b>{formatDuration(t.totalSeconds)}</b></span>
                      <span>正确率 <b style={{ color: 'var(--success)' }}>{t.accuracy}%</b></span>
                      <span>完成时间 <b>{t.finishTime}</b></span>
                      {t.wrongWords.length > 0 && (
                        <span className="err">错误单词：{t.wrongWords.map((w: any) => w.spelling).join('、')}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="wcard" key={t.planId}>
                    <div className="wt">{t.batchName}（第 {t.dueDays} 天） <span className="chip gray">未复习</span></div>
                    <div className="wd2">上课日期：{t.classDate} · 待复习 {t.wordCount} 词</div>
                    {t.words.slice(0, 2).map((w: any) => (
                      <div className="wordrow" key={w.id}>
                        <span className="w">{w.spelling}</span>
                        <span className="p">{w.phonetic}</span>
                        <span className="m">{w.meaning}</span>
                        <span className="st chip gray">待复习</span>
                      </div>
                    ))}
                    {t.words.length > 2 && (
                      <div className="hint" style={{ padding: '4px 2px' }}>… 其余 {t.words.length - 2} 词省略</div>
                    )}
                  </div>
                )
              ))}
            </div>
          ))}
        </>
      )}

      {/* Tab 3：易错词 */}
      {activeTab === 'wrong' && (
        <div className="tabpanel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span>共收录 <b>{wrongWords.length}</b> 个易错词</span>
            <button className="btn btn-s" onClick={() => {
              const text = wrongWords.map(w => `${w.spelling} ${w.phonetic || ''} ${w.meaning}`).join('\n');
              navigator.clipboard.writeText(text);
              alert('已复制到剪贴板');
            }}>复制全部错词</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>单词</th>
                <th>音标</th>
                <th>释义</th>
                <th>最近答错时间</th>
              </tr>
            </thead>
            <tbody>
              {wrongWords.map((w, i) => (
                <tr key={i}>
                  <td><b>{w.spelling}</b></td>
                  <td className="mono">{w.phonetic}</td>
                  <td>{w.meaning}</td>
                  <td style={{ color: 'var(--text3)' }}>{new Date(w.lastAnsweredAt).toLocaleString()}</td>
                </tr>
              ))}
              {wrongWords.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>暂无易错词</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {isResetModalOpen && (
        <div className="mask">
          <div className="modal" style={{ width: '400px' }}>
            <h3>重置验证码</h3>
            <div className="frow">
              <label>新密码</label>
              <input 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入或生成至少6位密码" 
              />
              <button className="btn btn-s" onClick={generateRandomPassword}>随机生成</button>
            </div>
            <div className="mbtns">
              <button className="btn btn-g" onClick={() => { setIsResetModalOpen(false); setNewPassword(''); }}>取消</button>
              <button className="btn btn-p" onClick={handleResetPassword}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
