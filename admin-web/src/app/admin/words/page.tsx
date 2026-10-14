'use client';

import { useState, useEffect } from 'react';

export default function WordsPage() {
  const [keyword, setKeyword] = useState('');
  const [words, setWords] = useState<any[]>([]);
  
  // 行内编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ spelling: '', phonetic: '', meaning: '' });

  const startEdit = (w: any) => {
    setEditingId(w.id);
    setDraft({ spelling: w.spelling, phonetic: w.phonetic, meaning: w.meaning });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchWords();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const fetchWords = async () => {
    try {
      const res = await fetch(`/api/admin/words?keyword=${encodeURIComponent(keyword)}`);
      const json = await res.json();
      if (json.success) {
        setWords(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [keyword]);

  const handleDelete = async (id: string) => {
    if (confirm('确认删除该词条吗？（仅删除后续复习计划，保留历史记录）')) {
      try {
        const res = await fetch(`/api/admin/words/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          alert('删除成功');
          fetchWords();
        }
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  // 全选状态
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map(w => w.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
    setSelectAll(newSet.size === words.length && words.length > 0);
  };

  return (
    <>
      <div className="card">
        <div className="tf" style={{ marginBottom: '12px' }}>
          <input 
            placeholder="单词 / 释义" 
            style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '200px', fontFamily: 'inherit' }} 
          />
          <select style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--text2)' }}>
            <option value="">全部学员</option>
            <option>朵朵</option>
            <option>乐乐</option>
          </select>
          <select style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--text2)' }}>
            <option value="">全部批次</option>
            <option>Unit 1</option>
            <option>Unit 2</option>
          </select>
          <button className="btn btn-p">搜索</button>
          <div className="spacer" style={{ flex: 1 }}></div>
          <button className="btn btn-g" onClick={() => {
            if(confirm('确定要批量修改选中的词条吗？\n(演示原型：批量编辑功能)')) {
              alert('批量编辑成功');
            }
          }}>批量编辑</button>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: '36px' }}><input type="checkbox" onClick={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
                checkboxes.forEach((cb: any) => cb.checked = checked);
              }} /></th>
              <th>学员</th>
              <th>批次</th>
              <th>上课日期</th>
              <th>单词</th>
              <th>音标</th>
              <th>释义</th>
              <th>识别置信度</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id} style={w.status === 'DELETED' ? { background: '#f9f9f9' } : {}}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(w.id)}
                    onChange={() => toggleSelect(w.id)}
                  />
                </td>
                <td>{w.batch?.student?.name}</td>
                <td>{w.batch?.name}</td>
                <td>{w.batch?.classDate ? new Date(w.batch.classDate).toISOString().split('T')[0] : ''}</td>
                {editingId === w.id ? (
                  <>
                    <td><input value={draft.spelling} onChange={e => setDraft({...draft, spelling: e.target.value})} style={{ width: '100%', padding: '4px' }} /></td>
                    <td><input value={draft.phonetic} onChange={e => setDraft({...draft, phonetic: e.target.value})} style={{ width: '100%', padding: '4px' }} /></td>
                    <td><input value={draft.meaning}  onChange={e => setDraft({...draft, meaning:  e.target.value})} style={{ width: '100%', padding: '4px' }} /></td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      <span className="opt-btn opt-edit" onClick={() => saveEdit(w.id)}>保存</span>
                      <span className="opt-btn opt-del" onClick={cancelEdit}>取消</span>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <b style={w.status === 'DELETED' ? { color: 'var(--text3)', textDecoration: 'line-through' } : {}}>
                        {w.spelling}
                      </b>
                    </td>
                    <td className="mono" style={w.status === 'DELETED' ? { color: 'var(--text3)' } : {}}>{w.phonetic}</td>
                    <td style={w.status === 'DELETED' ? { color: 'var(--text3)' } : {}}>{w.meaning}</td>
                    <td>
                      <span className={w.confidence && w.confidence >= 85 ? "chip ok" : "chip bad"}>
                        {w.confidence ? `${w.confidence}%` : '-'}
                      </span>
                    </td>
                    <td>
                      {w.status === 'DELETED' ? (
                        <span className="chip gray">已删除</span>
                      ) : (
                        <span className="chip ok">正常</span>
                      )}
                    </td>
                    <td>
                      {w.status === 'DELETED' ? (
                        <span className="opt-btn opt-edit" style={{ background: '#eee', color: '#999', cursor: 'not-allowed' }}>恢复</span>
                      ) : (
                        <>
                          <span className="opt-btn opt-edit" onClick={() => startEdit(w)}>编辑</span>
                          <span className="opt-btn opt-del" onClick={() => handleDelete(w.id)}>删除</span>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="hint" style={{ marginTop: '10px' }}>
          规则（PRD FR-B-05）：行内直接编辑 4 字段；软删除剔除后续复习但保留历史答题；编辑后仅后续复习次生效，历史答题记录不回溯。
        </div>
      </div>

      <div className="card">
        <h3>操作日志（word_audit_log）</h3>
        <div className="logline"><b>王老师</b> · 2026-10-10 18:02 · 修改释义：elephant 「n. 大像」→「n. 大象」（朵朵 / Unit 4）</div>
        <div className="logline"><b>王老师</b> · 2026-10-10 17:46 · 批量编辑：Unit 3 共 3 条音标补全（识别置信度 &lt; 90% 的词条）</div>
        <div className="logline"><b>王老师</b> · 2026-10-10 16:31 · 软删除：appale（识别错误词条，朵朵 / Unit 3，历史记录保留）</div>
      </div>
    </>
  );
}
