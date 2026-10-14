'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('teacher');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.message || '账号或密码错误');
      }
    } catch (err) {
      setError('网络请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #FFF9F2, #F4EFE6)'
    }}>
      <div className="modal" style={{ width: '380px', padding: '34px 30px', boxShadow: '0 8px 32px rgba(38,38,31,.12)', background: '#fff', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '6px' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22v-9" stroke="#7BC896" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 13C12 8.5 8.8 6 4.5 6c0 4.5 3.2 7 7.5 7z" fill="#7BC896"/>
            <path d="M12 11c0-4.5 3.2-7 7.5-7 0 4.5-3.2 7-7.5 7z" fill="#FF8F1F"/>
          </svg>
          <b style={{ fontSize: '19px' }}>木芽英语</b>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text2)', marginBottom: '20px' }}>
          老师工作台 · 登录
        </div>
        
        <div className="frow">
          <label>账号</label>
          <input value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
        </div>
        
        <div className="frow">
          <label>密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
        </div>
        
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div className="hint" style={{ marginLeft: '86px', marginBottom: '20px' }}>
          演示默认账号：teacher / 123456（连续 5 次失败锁定 15 分钟）。
        </div>
        
        <div className="mbtns" style={{ marginTop: '0' }}>
          <button 
            className="btn btn-p" 
            style={{ width: '100%' }} 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '登 录 中...' : '登 录'}
          </button>
        </div>
      </div>
    </div>
  );
}
