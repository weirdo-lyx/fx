'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function BatchDetailPage() {
  const routeParams = useParams();
  const batchId = routeParams.id as string;
  const [batch, setBatch] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);

  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [wordForm, setWordForm] = useState<any>({ spelling: '', phonetic: '', meaning: '' });
  const [editMode, setEditMode] = useState(false);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/admin/batches/${batchId}`);
      const json = await res.json();
      if (json.success) {
        setBatch(json.data);
        setWords(json.data.words || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const openAdd = () => {
    setEditMode(false);
    setWordForm({ spelling: '', phonetic: '', meaning: '' });
    setIsWordModalOpen(true);
  };

  const openEdit = (word: any) => {
    setEditMode(true);
    setWordForm({ ...word });
    setIsWordModalOpen(true);
  };

  const handleSave = async () => {
    if (editMode) {
      // Edit
      try {
        const res = await fetch(`/api/admin/words/${wordForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wordForm)
        });
        const data = await res.json();
        if (data.success) {
          alert('修改成功！');
          setIsWordModalOpen(false);
          fetchBatch();
        }
      } catch (err) {
        alert('保存失败');
      }
    } else {
      // 新增
      if (!wordForm.spelling.trim() || !wordForm.meaning.trim()) {
        alert('请填写单词和中文释义');
        return;
      }
      try {
        const res = await fetch('/api/admin/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchId,
            spelling: wordForm.spelling,
            phonetic: wordForm.phonetic,
            meaning: wordForm.meaning
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('添加成功！');
          setIsWordModalOpen(false);
          fetchBatch();
        } else {
          alert('添加失败: ' + (data.error || '未知错误'));
        }
      } catch (err) {
        alert('添加失败');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确认软删除词条吗？')) {
      try {
        const res = await fetch(`/api/admin/words/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          alert('删除成功');
          fetchBatch();
        }
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  if (!batch) return <div>加载中...</div>;

  return (
    <>
      <div className="tf">
        <Link href={`/admin/students/${batch.studentId}`} className="btn btn-g" style={{ textDecoration: 'none' }}>
          ← 返回学员详情
        </Link>
        <span className="lab" id="wd-crumb">
          学员详情 / {batch.student?.name} / 词条列表 / {new Date(batch.classDate).toISOString().split('T')[0]} 批次
        </span>
        <div className="spacer" style={{ flex: 1 }}></div>
        <button className="btn btn-p" onClick={openAdd}>+ 添加单词</button>
      </div>
      <div className="card">
        <h3>词条详情</h3>
        <table>
          <thead>
            <tr>
              <th style={{ width: '18%' }}>单词</th>
              <th style={{ width: '24%' }}>音标</th>
              <th>中文意思</th>
              <th style={{ width: '150px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={i}>
                <td><b>{w.spelling}</b></td>
                <td className="mono">{w.phonetic}</td>
                <td>{w.meaning}</td>
                <td>
                  <span className="opt-btn opt-edit" onClick={() => openEdit(w)}>编辑</span>
                  <span className="opt-btn opt-del" onClick={() => handleDelete(w.id)}>删除</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="hint" style={{ marginTop: '10px' }}>
          编辑 / 删除规则沿用 FR-B-05：编辑仅后续复习次生效、历史答题记录不回溯；删除为软删除。点「+ 添加单词」通过弹窗录入单词基础信息。
        </div>
      </div>

      {/* 词条编辑/新增弹窗 */}
      {isWordModalOpen && (
        <div className="mask">
          <div className="modal" style={{ width: '420px' }}>
            <h3>{editMode ? '编辑词条' : '添加词条'}</h3>
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
              <button className="btn btn-p" onClick={handleSave}>确认</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
