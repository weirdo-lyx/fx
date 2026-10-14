'use client';

import { useState, useRef, useEffect } from 'react';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [words, setWords] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [classDate, setClassDate] = useState('');
  
  useEffect(() => {
    const today = new Date();
    setClassDate(today.toISOString().split('T')[0]);

    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/admin/students');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setStudentList(json.data);
          setStudentId(json.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, []);

  // 弹窗状态
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [wordForm, setWordForm] = useState({ spelling: '', phonetic: '', meaning: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/ocr', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setWords(data.data);
      } else {
        alert('识别失败: ' + (data.error || '未知错误'));
      }
    } catch (err) {
      alert('网络请求失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await uploadFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    await uploadFile(e.dataTransfer.files[0]);
  };

  const openAddWord = () => {
    setEditIndex(null);
    setWordForm({ spelling: '', phonetic: '', meaning: '' });
    setIsWordModalOpen(true);
  };

  const openEditWord = (index: number) => {
    setEditIndex(index);
    setWordForm(words[index]);
    setIsWordModalOpen(true);
  };

  const saveWord = () => {
    if (editIndex !== null) {
      const newWords = [...words];
      newWords[editIndex] = { ...newWords[editIndex], ...wordForm, confidence: 100 }; // 编辑后置信度满分
      setWords(newWords);
    } else {
      setWords([...words, { ...wordForm, confidence: 100 }]);
    }
    setIsWordModalOpen(false);
  };

  const deleteWord = (index: number) => {
    const newWords = [...words];
    newWords.splice(index, 1);
    setWords(newWords);
  };

  const handleConfirmBatch = async () => {
    if (words.length === 0) {
      alert('请先上传图片并识别词条');
      return;
    }
    if (!studentId) {
      alert('请选择学员');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          batchName: `${classDate} 讲义批次`,
          classDate,
          words
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('入库成功！21天复习排期已自动生成。');
        setWords([]);
        window.location.href = `/admin/students/${studentId}`; // 入库后跳转到学员详情页
      } else {
        alert('入库失败: ' + data.error);
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  return (
    <>
      <div className="tf">
        <span className="lab">上传对象</span>
        <select 
          value={studentId} 
          onChange={(e) => setStudentId(e.target.value)}
          style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--text2)' }}
        >
          {studentList.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span className="lab" style={{ marginLeft: '12px' }}>上课日期</span>
        <div className="datepick" style={{ padding: 0, border: 'none', background: 'transparent' }}>
          <input 
            type="date" 
            value={classDate} 
            onChange={(e) => setClassDate(e.target.value)}
            style={{ 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '7px 10px', 
              fontSize: '13px', 
              fontFamily: 'inherit', 
              color: 'var(--text2)',
              outline: 'none',
              cursor: 'pointer'
            }} 
          />
        </div>
        <div className="spacer" style={{ flex: 1 }}></div>
        <button className="btn btn-g" onClick={() => {
          if (confirm('将清空当前已上传的批次内容，并跳转到批次列表吗？')) {
            window.location.href = '/admin/batches/1';
          }
        }}>待校对批次（1）</button>
      </div>

      <div className="card">
        <input 
          type="file" 
          multiple 
          accept="image/png, image/jpeg, application/pdf" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div 
          className="drop" 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ margin: '0 auto' }}>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#B9B6A8" strokeWidth="1.6"/>
            <path d="M3 15.5l4.5-4 4 3.5 3-2.5 6.5 5.5" stroke="#B9B6A8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15.5" cy="9.5" r="1.6" fill="#B9B6A8"/>
          </svg>
          <div className="dt">{isUploading ? '正在调用大模型识别提取中...' : '点击上传讲义图片 / PDF'}</div>
          <div className="ds">支持 jpg / png / pdf，可多选 · 上传后自动识别单词、音标、释义（FR-B-01）</div>
        </div>
      </div>

      {/* 校对区 */}
      <div className="card">
        <h3>识别结果 · 人工校对 
          <span className="chip warn" style={{ marginLeft: '6px' }}>{words.filter(w => w.confidence < 85).length} 个低置信词条</span>
          <button className="btn btn-g" style={{ marginLeft: '12px' }} onClick={openAddWord}>+ 手动添加单词</button>
        </h3>
        <table>
          <thead>
            <tr>
              <th>单词</th>
              <th>音标</th>
              <th>释义</th>
              <th>发音</th>
              <th>置信度</th>
              <th>校对状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {words.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>暂无数据，请先上传讲义图片</td></tr>
            ) : (
              words.map((w, i) => (
                <tr key={i} style={w.confidence < 85 ? { background: 'var(--danger-soft)' } : {}}>
                  <td><b style={w.confidence < 85 ? { color: 'var(--danger)' } : {}}>{w.spelling}</b></td>
                  <td className="mono">{w.phonetic}</td>
                  <td>{w.meaning}</td>
                  <td><button className="btn btn-s" onClick={() => {
                    // 演示发音
                    const utterance = new SpeechSynthesisUtterance(w.spelling);
                    utterance.lang = 'en-US';
                    window.speechSynthesis.speak(utterance);
                  }}>▶ 播放</button></td>
                  <td>
                    <span className={w.confidence >= 85 ? "chip ok" : "chip bad"}>{w.confidence}%</span>
                  </td>
                  <td><span className={w.confidence >= 85 ? "chip ok" : "chip warn"}>{w.confidence >= 85 ? '已校对' : '待校对'}</span></td>
                  <td>
                    <span className="opt-btn opt-edit" onClick={() => openEditWord(i)}>编辑</span>
                    <span className="opt-btn opt-del" onClick={() => deleteWord(i)}>删除</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
          <button className="btn btn-p" onClick={handleConfirmBatch}>✓ 校对完成，确认入库</button>
          <button className="btn btn-g" onClick={() => setWords([])}>清空重列</button>
          <span className="hint">确认入库后自动生成 21 天 10 次复习计划（第 1·2·3·5·7·9·12·14·17·21 天，FR-P-01）</span>
        </div>
      </div>

      {/* 词条编辑/新增弹窗 */}
      {isWordModalOpen && (
        <div className="mask">
          <div className="modal" style={{ width: '420px' }}>
            <h3>{editIndex !== null ? '编辑词条' : '添加词条'}</h3>
            <div className="frow">
              <label>英文拼写</label>
              <input 
                value={wordForm.spelling} 
                onChange={e => setWordForm({...wordForm, spelling: e.target.value})}
              />
            </div>
            <div className="frow">
              <label>音标</label>
              <input 
                value={wordForm.phonetic} 
                onChange={e => setWordForm({...wordForm, phonetic: e.target.value})}
              />
            </div>
            <div className="frow">
              <label>中文释义</label>
              <input 
                value={wordForm.meaning} 
                onChange={e => setWordForm({...wordForm, meaning: e.target.value})}
              />
            </div>
            <div className="mbtns">
              <button className="btn btn-g" onClick={() => setIsWordModalOpen(false)}>取消</button>
              <button className="btn btn-p" onClick={saveWord}>确认</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
