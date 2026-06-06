import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { toast } from '../toast';

const EMPTY_Q = { text: '', A: '', B: '', C: '', D: '', correct: 'A' };

const CLASS_LIST = ['Tüm Sınıflar', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
const LEVEL_LIST = ['Tümü', 'SEVİYE 1', 'SEVİYE 2'];
const SUBJECT_LIST = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal/İnkılap', 'İngilizce', 'Din Kültürü'];
const SET_TYPES = [
  { value: '', label: 'Seçilmedi' },
  { value: 'akademik', label: '🎓 Akademik' },
  { value: 'dahili', label: '🏫 Dahili Ders' },
];

const parseOcrText = (rawText) => {
  const questions = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let current = null;
  for (const line of lines) {
    const qMatch = line.match(/^(\d+)\s*[.)]\s*(.+)/);
    if (qMatch) {
      if (current && current.text) questions.push(current);
      current = { ...EMPTY_Q, text: qMatch[2] };
      continue;
    }
    const optMatch = line.match(/^([A-Da-d])\s*[.)]\s*(.+)/);
    if (optMatch && current) {
      current[optMatch[1].toUpperCase()] = optMatch[2];
      continue;
    }
    if (current && !current.A && line.length > 3) {
      current.text += ' ' + line;
    }
  }
  if (current && current.text) questions.push(current);
  return questions;
};

const QuizAdmin = ({ appData }) => {
  const [sets, setSets] = useState({});
  const [view, setView] = useState('list');
  const [activeSetId, setActiveSetId] = useState(null);
  const [questions, setQuestions] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newSet, setNewSet] = useState({ name: '', points_per_q: 10, time_per_q: 30, set_type: '', subject: '', target_class: 'Tüm Sınıflar', target_level: 'Tümü' });
  const [qForm, setQForm] = useState({ ...EMPTY_Q });
  const [editingQId, setEditingQId] = useState(null);
  const [ocrStep, setOcrStep] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [parsedQs, setParsedQs] = useState([]);
  const [selectedParsed, setSelectedParsed] = useState([]);
  const [showSetSettings, setShowSetSettings] = useState(false);
  const [setEdit, setSetEdit] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const ref = db.ref('mavikent_premium/quiz_sets');
    ref.on('value', snap => setSets(snap.val() || {}));
    return () => ref.off();
  }, []);

  useEffect(() => {
    if (!activeSetId) { setQuestions({}); return; }
    const ref = db.ref(`mavikent_premium/quiz_sets/${activeSetId}/questions`);
    ref.on('value', snap => setQuestions(snap.val() || {}));
    return () => ref.off();
  }, [activeSetId]);

  const createSet = async () => {
    if (!newSet.name.trim()) return toast('❌ Bölüm adı boş olamaz!');
    await db.ref('mavikent_premium/quiz_sets').push({
      name: newSet.name.trim(),
      points_per_q: Number(newSet.points_per_q) || 10,
      time_per_q: Number(newSet.time_per_q) || 30,
      set_type: newSet.set_type || '',
      subject: newSet.subject || '',
      target_class: newSet.target_class || 'Tüm Sınıflar',
      target_level: newSet.target_level || 'Tümü',
      status: 'draft',
      created_at: Date.now(),
    });
    setNewSet({ name: '', points_per_q: 10, time_per_q: 30, set_type: '', subject: '', target_class: 'Tüm Sınıflar', target_level: 'Tümü' });
    setShowCreate(false);
    toast('✅ Bölüm oluşturuldu!');
  };

  const deleteSet = async (id) => {
    if (!window.confirm('Bu bölümü ve tüm sorularını silmek istiyor musunuz?')) return;
    await db.ref(`mavikent_premium/quiz_sets/${id}`).remove();
    toast('✅ Bölüm silindi.');
    if (activeSetId === id) { setActiveSetId(null); setView('list'); }
  };

  const togglePublish = async (id, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    await db.ref(`mavikent_premium/quiz_sets/${id}/status`).set(newStatus);
    toast(newStatus === 'published' ? '✅ Bölüm yayınlandı!' : '📋 Taslağa alındı.');
  };

  const openSet = (id) => {
    setActiveSetId(id);
    setView('detail');
    setQForm({ ...EMPTY_Q });
    setEditingQId(null);
    setOcrStep('idle');
    setParsedQs([]);
    setShowSetSettings(false);
    setSetEdit(null);
  };

  const openSetSettings = () => {
    setSetEdit({
      name: activeSet.name,
      set_type: activeSet.set_type || '',
      subject: activeSet.subject || '',
      target_class: activeSet.target_class || 'Tüm Sınıflar',
      target_level: activeSet.target_level || 'Tümü',
      points_per_q: activeSet.points_per_q || 10,
      time_per_q: activeSet.time_per_q || 30,
    });
    setShowSetSettings(true);
  };

  const saveSetSettings = async () => {
    if (!setEdit.name.trim()) return toast('❌ Bölüm adı boş olamaz!');
    await db.ref(`mavikent_premium/quiz_sets/${activeSetId}`).update({
      name: setEdit.name.trim(),
      set_type: setEdit.set_type || '',
      subject: setEdit.subject || '',
      target_class: setEdit.target_class || 'Tüm Sınıflar',
      target_level: setEdit.target_level || 'Tümü',
      points_per_q: Number(setEdit.points_per_q) || 10,
      time_per_q: Number(setEdit.time_per_q) || 30,
    });
    setShowSetSettings(false);
    setSetEdit(null);
    toast('✅ Bölüm ayarları güncellendi!');
  };

  const saveQuestion = async () => {
    if (!qForm.text.trim()) return toast('❌ Soru metni boş olamaz!');
    if (!qForm.A || !qForm.B || !qForm.C || !qForm.D) return toast('❌ Tüm şıkları doldurun!');
    const ref = editingQId
      ? db.ref(`mavikent_premium/quiz_sets/${activeSetId}/questions/${editingQId}`)
      : db.ref(`mavikent_premium/quiz_sets/${activeSetId}/questions`).push();
    await ref.set({ text: qForm.text.trim(), A: qForm.A.trim(), B: qForm.B.trim(), C: qForm.C.trim(), D: qForm.D.trim(), correct: qForm.correct });
    setQForm({ ...EMPTY_Q });
    setEditingQId(null);
    toast('✅ Soru kaydedildi!');
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm('Bu soruyu silmek istiyor musunuz?')) return;
    await db.ref(`mavikent_premium/quiz_sets/${activeSetId}/questions/${qId}`).remove();
    toast('✅ Soru silindi.');
  };

  const editQuestion = (qId, q) => {
    setQForm({ text: q.text, A: q.A, B: q.B, C: q.C, D: q.D, correct: q.correct });
    setEditingQId(qId);
    document.getElementById('qform-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const runTesseractOnBlob = async (blob, progressOffset, progressScale) => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(['tur', 'eng'], 1, {
      logger: m => {
        if (m.status === 'recognizing text')
          setOcrProgress(Math.round(progressOffset + m.progress * progressScale));
      }
    });
    const { data: { text } } = await worker.recognize(blob);
    await worker.terminate();
    return text;
  };

  const handleOcrFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setOcrStep('loading');
    setOcrProgress(0);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      let fullText = '';

      if (isPdf) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).href;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

        // Dijital PDF: metni direkt oku
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join('\n') + '\n';
          setOcrProgress(Math.round((i / pdf.numPages) * 60));
        }

        // Metinden soru çıkaramazsak → sayfaları canvas'a çiz + Tesseract
        const quickParsed = parseOcrText(fullText);
        if (quickParsed.length === 0) {
          fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
            const pageText = await runTesseractOnBlob(
              blob,
              60 + ((i - 1) / pdf.numPages) * 35,
              35 / pdf.numPages
            );
            fullText += pageText + '\n';
          }
        }
      } else {
        // Resim dosyası
        fullText = await runTesseractOnBlob(file, 0, 100);
      }

      setOcrProgress(98);
      const parsed = parseOcrText(fullText);
      if (parsed.length === 0) {
        toast('⚠️ Sorular bulunamadı. Dosyanın "1. Soru... A) B) C) D)" formatında olduğundan emin olun.');
        setOcrStep('idle');
        return;
      }
      const withIds = parsed.map((q, i) => ({ ...q, _id: i }));
      setParsedQs(withIds);
      setSelectedParsed(withIds.map(q => q._id));
      setOcrStep('review');
    } catch (err) {
      toast('❌ Okuma hatası: ' + err.message);
      setOcrStep('idle');
    }
  };

  const saveParsedQuestions = async () => {
    const toSave = parsedQs.filter(q => selectedParsed.includes(q._id));
    if (toSave.length === 0) return toast('❌ Kaydedilecek soru seçin!');
    let saved = 0;
    for (const q of toSave) {
      if (!q.text.trim() || !q.A || !q.B || !q.C || !q.D) continue;
      await db.ref(`mavikent_premium/quiz_sets/${activeSetId}/questions`).push({
        text: q.text.trim(), A: q.A.trim(), B: q.B.trim(), C: q.C.trim(), D: q.D.trim(), correct: q.correct,
      });
      saved++;
    }
    toast(`✅ ${saved} soru eklendi!`);
    setOcrStep('idle');
    setParsedQs([]);
    setSelectedParsed([]);
  };

  const activeSet = activeSetId ? sets[activeSetId] : null;
  const qList = Object.entries(questions);
  const setList = Object.entries(sets);

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '20px' }}>📚 Akademi Bölümleri</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Soru bankalarını yönetin</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '14px', padding: '12px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>+ Yeni Bölüm</button>
      </div>

      {showCreate && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '20px', border: '2px solid #3b82f6', boxShadow: '0 8px 30px rgba(59,130,246,0.12)' }}>
          <h4 style={{ margin: '0 0 16px', fontWeight: 900, color: '#0f172a' }}>Yeni Bölüm Oluştur</h4>
          <input value={newSet.name} onChange={e => setNewSet({ ...newSet, name: e.target.value })} placeholder="Bölüm adı (örn: Matematik Yazılı Hazırlık)" className="elite-input" style={{ marginBottom: '12px', display: 'block', width: '100%', boxSizing: 'border-box' }} />

          {/* Tür seçimi */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>SORU TÜRÜ</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SET_TYPES.map(t => (
                <button key={t.value} onClick={() => setNewSet({ ...newSet, set_type: t.value })} style={{ flex: '1 1 80px', padding: '10px 8px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer', background: newSet.set_type === t.value ? '#0f172a' : '#f1f5f9', color: newSet.set_type === t.value ? 'white' : '#64748b', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>DERS</div>
              <select value={newSet.subject} onChange={e => setNewSet({ ...newSet, subject: e.target.value })} className="elite-input" style={{ padding: '10px 8px', fontSize: '13px' }}>
                <option value="">Seçilmedi</option>
                {SUBJECT_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SINIF</div>
              <select value={newSet.target_class} onChange={e => setNewSet({ ...newSet, target_class: e.target.value })} className="elite-input" style={{ padding: '10px 8px', fontSize: '13px' }}>
                {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SEVİYE</div>
              <select value={newSet.target_level} onChange={e => setNewSet({ ...newSet, target_level: e.target.value })} className="elite-input" style={{ padding: '10px 8px', fontSize: '13px' }}>
                {LEVEL_LIST.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SORU BAŞINA KAZANÇ (M-Coin)</div>
              <input type="number" min="1" value={newSet.points_per_q} onChange={e => setNewSet({ ...newSet, points_per_q: e.target.value })} className="elite-input" style={{ textAlign: 'center', fontWeight: 900 }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SORU BAŞINA SÜRE (saniye)</div>
              <input type="number" min="5" value={newSet.time_per_q} onChange={e => setNewSet({ ...newSet, time_per_q: e.target.value })} className="elite-input" style={{ textAlign: 'center', fontWeight: 900 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={createSet} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, cursor: 'pointer' }}>✅ Oluştur</button>
            <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}

      {setList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Henüz bölüm oluşturulmadı</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>Yukarıdan yeni bir bölüm ekleyin</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {setList.map(([id, set]) => {
            const qCount = Object.keys(set.questions || {}).length;
            const isPublished = set.status === 'published';
            return (
              <div key={id} style={{ background: 'white', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: isPublished ? '2px solid #10b981' : '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{set.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '20px', background: isPublished ? '#ecfdf5' : '#f1f5f9', color: isPublished ? '#059669' : '#94a3b8', flexShrink: 0 }}>
                        {isPublished ? '● YAYINDA' : '○ TASLAK'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {set.set_type === 'akademik' && <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: '#fffbeb', color: '#d97706' }}>🎓 Akademik</span>}
                      {set.set_type === 'dahili' && <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: '#f0f9ff', color: '#0284c7' }}>🏫 Dahili Ders</span>}
                      {set.subject && <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>{set.subject}</span>}
                      {set.target_class && set.target_class !== 'Tüm Sınıflar' && <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a' }}>{set.target_class}</span>}
                      {set.target_level && set.target_level !== 'Tümü' && <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: '#fdf4ff', color: '#9333ea' }}>{set.target_level}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      {qCount} soru · {set.points_per_q} M-Coin/soru · {set.time_per_q}sn/soru
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => openSet(id)} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}>Düzenle</button>
                    <button onClick={() => togglePublish(id, set.status)} style={{ background: isPublished ? '#fef3c7' : '#ecfdf5', color: isPublished ? '#d97706' : '#059669', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}>
                      {isPublished ? 'Taslağa Al' : 'Yayınla'}
                    </button>
                    <button onClick={() => deleteSet(id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── DETAIL VIEW ──
  if (view === 'detail' && activeSet) return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => { setView('list'); setActiveSetId(null); setOcrStep('idle'); setParsedQs([]); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 800, cursor: 'pointer', color: '#64748b', flexShrink: 0 }}>← Geri</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeSet.name}</div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{qList.length} soru · {activeSet.points_per_q} M-Coin/soru · {activeSet.time_per_q}sn/soru</div>
        </div>
        <button onClick={openSetSettings} style={{ background: showSetSettings ? '#0f172a' : '#f1f5f9', color: showSetSettings ? 'white' : '#64748b', border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>⚙️</button>
        <button onClick={() => togglePublish(activeSetId, activeSet.status)} style={{ background: activeSet.status === 'published' ? '#fef3c7' : '#10b981', color: activeSet.status === 'published' ? '#d97706' : 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', fontWeight: 900, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>
          {activeSet.status === 'published' ? '⏸ Taslağa Al' : '▶ Yayınla'}
        </button>
      </div>

      {/* Bölüm Ayarları Paneli */}
      {showSetSettings && setEdit && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '20px', border: '2px solid #0f172a', boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}>
          <h4 style={{ margin: '0 0 16px', fontWeight: 900, color: '#0f172a' }}>⚙️ Bölüm Ayarları</h4>
          <input value={setEdit.name} onChange={e => setSetEdit({ ...setEdit, name: e.target.value })} placeholder="Bölüm adı" className="elite-input" style={{ marginBottom: '12px', display: 'block', width: '100%', boxSizing: 'border-box' }} />

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>SORU TÜRÜ</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SET_TYPES.map(t => (
                <button key={t.value} onClick={() => setSetEdit({ ...setEdit, set_type: t.value })} style={{ flex: '1 1 80px', padding: '10px 8px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer', background: setEdit.set_type === t.value ? '#0f172a' : '#f1f5f9', color: setEdit.set_type === t.value ? 'white' : '#64748b', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>DERS</div>
              <select value={setEdit.subject} onChange={e => setSetEdit({ ...setEdit, subject: e.target.value })} className="elite-input" style={{ padding: '10px 8px', fontSize: '13px' }}>
                <option value="">Seçilmedi</option>
                {SUBJECT_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SINIF</div>
              <select value={setEdit.target_class} onChange={e => setSetEdit({ ...setEdit, target_class: e.target.value })} className="elite-input" style={{ padding: '10px 8px', fontSize: '13px' }}>
                {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SEVİYE</div>
              <select value={setEdit.target_level} onChange={e => setSetEdit({ ...setEdit, target_level: e.target.value })} className="elite-input" style={{ padding: '10px 8px', fontSize: '13px' }}>
                {LEVEL_LIST.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SORU BAŞINA KAZANÇ (M-Coin)</div>
              <input type="number" min="1" value={setEdit.points_per_q} onChange={e => setSetEdit({ ...setEdit, points_per_q: e.target.value })} className="elite-input" style={{ textAlign: 'center', fontWeight: 900 }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SORU BAŞINA SÜRE (saniye)</div>
              <input type="number" min="5" value={setEdit.time_per_q} onChange={e => setSetEdit({ ...setEdit, time_per_q: e.target.value })} className="elite-input" style={{ textAlign: 'center', fontWeight: 900 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={saveSetSettings} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, cursor: 'pointer' }}>💾 Kaydet</button>
            <button onClick={() => { setShowSetSettings(false); setSetEdit(null); }} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}

      {/* Ekle butonları */}
      {ocrStep === 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setEditingQId(null); setQForm({ ...EMPTY_Q }); document.getElementById('qform-section')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>+ Manuel Soru Ekle</button>
          <button onClick={() => fileRef.current?.click()} style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>📄 PDF / Görsel Aktar</button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleOcrFile} />
        </div>
      )}

      {/* OCR Yükleniyor */}
      {ocrStep === 'loading' && (
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', textAlign: 'center', marginBottom: '20px', border: '2px solid #8b5cf6' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>Görsel okunuyor, sorular çıkarılıyor...</div>
          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
            <div style={{ background: '#8b5cf6', height: '100%', width: `${ocrProgress}%`, transition: 'width 0.3s', borderRadius: '8px' }} />
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', fontWeight: 700 }}>{ocrProgress}%</div>
        </div>
      )}

      {/* OCR Gözden Geçir */}
      {ocrStep === 'review' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '20px', border: '2px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>📋 {parsedQs.length} soru bulundu — İncele ve düzenle</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveParsedQuestions} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>✅ Seçilenleri Kaydet</button>
              <button onClick={() => { setOcrStep('idle'); setParsedQs([]); }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', padding: '10px 12px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>İptal</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
            {parsedQs.map((q) => (
              <div key={q._id} style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: selectedParsed.includes(q._id) ? '2px solid #8b5cf6' : '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={selectedParsed.includes(q._id)} onChange={e => setSelectedParsed(e.target.checked ? [...selectedParsed, q._id] : selectedParsed.filter(x => x !== q._id))} style={{ width: '16px', height: '16px', marginTop: '4px', flexShrink: 0, cursor: 'pointer' }} />
                  <textarea value={q.text} onChange={e => setParsedQs(pqs => pqs.map(pq => pq._id === q._id ? { ...pq, text: e.target.value } : pq))} style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 700, resize: 'vertical', minHeight: '56px', color: '#0f172a' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 900, color: '#64748b', fontSize: '12px', width: '14px', flexShrink: 0 }}>{opt})</span>
                      <input value={q[opt]} onChange={e => setParsedQs(pqs => pqs.map(pq => pq._id === q._id ? { ...pq, [opt]: e.target.value } : pq))} style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', fontWeight: 600, color: '#0f172a' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Doğru:</span>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button key={opt} onClick={() => setParsedQs(pqs => pqs.map(pq => pq._id === q._id ? { ...pq, correct: opt } : pq))} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '13px', background: q.correct === opt ? '#10b981' : '#e2e8f0', color: q.correct === opt ? 'white' : '#64748b', transition: 'all 0.15s' }}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soru Ekleme Formu */}
      <div id="qform-section" style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '20px', border: '1.5px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '14px', fontSize: '15px' }}>{editingQId ? '✏️ Soruyu Düzenle' : '+ Soru Ekle'}</div>
        <textarea value={qForm.text} onChange={e => setQForm({ ...qForm, text: e.target.value })} placeholder="Soru metnini buraya yazın..." style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 600, resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', marginBottom: '12px', color: '#0f172a' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {['A', 'B', 'C', 'D'].map(opt => (
            <div key={opt}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>{opt} ŞIKI</div>
              <input value={qForm[opt]} onChange={e => setQForm({ ...qForm, [opt]: e.target.value })} placeholder={`${opt} şıkkını yazın`} style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box', color: '#0f172a' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>Doğru Cevap:</span>
          {['A', 'B', 'C', 'D'].map(opt => (
            <button key={opt} onClick={() => setQForm({ ...qForm, correct: opt })} style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '15px', background: qForm.correct === opt ? '#10b981' : '#f1f5f9', color: qForm.correct === opt ? 'white' : '#64748b', transition: 'all 0.2s' }}>{opt}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={saveQuestion} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>{editingQId ? '💾 Güncelle' : '+ Kaydet'}</button>
          {editingQId && <button onClick={() => { setEditingQId(null); setQForm({ ...EMPTY_Q }); }} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', padding: '14px 18px', fontWeight: 900, cursor: 'pointer' }}>İptal</button>}
        </div>
      </div>

      {/* Soru Listesi */}
      <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>Mevcut Sorular ({qList.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {qList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 700, background: 'white', borderRadius: '16px', border: '1.5px dashed #e2e8f0' }}>Henüz soru eklenmedi</div>
        ) : qList.map(([qId, q], idx) => (
          <div key={qId} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1.5px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginBottom: '8px' }}>{idx + 1}. {q.text}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} style={{ fontSize: '12px', fontWeight: 600, color: q.correct === opt ? '#059669' : '#64748b', background: q.correct === opt ? '#ecfdf5' : '#f8fafc', padding: '4px 8px', borderRadius: '6px' }}>
                      {opt}) {q[opt]} {q.correct === opt ? '✓' : ''}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => editQuestion(qId, q)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}>Düzenle</button>
                <button onClick={() => deleteQuestion(qId)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}>Sil</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return null;
};

export default QuizAdmin;
