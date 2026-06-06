import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { toast } from '../toast';

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

const QuizStudent = ({ studentName, appData }) => {
  const [sets, setSets] = useState({});
  const [results, setResults] = useState({});
  const [view, setView] = useState('browse');
  const [activeSet, setActiveSet] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const timerRef = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const scoreRef = useRef(0);
  const activeSetIdRef = useRef(null);

  useEffect(() => {
    const ref = db.ref('mavikent_premium/quiz_sets');
    ref.on('value', snap => setSets(snap.val() || {}));
    return () => ref.off();
  }, []);

  useEffect(() => {
    if (!studentName) return;
    const ref = db.ref(`mavikent_premium/quiz_results/${studentName}`);
    ref.on('value', snap => setResults(snap.val() || {}));
    return () => ref.off();
  }, [studentName]);

  // Kopya Önleme
  const handleCheat = useCallback(() => {
    if (viewRef.current !== 'quiz') return;
    clearInterval(timerRef.current);
    const setId = activeSetIdRef.current;
    if (setId && studentName) {
      db.ref(`mavikent_premium/quiz_results/${studentName}/${setId}`).set({
        disqualified: true,
        disqualified_at: new Date().toLocaleString('tr-TR'),
      });
    }
    setView('cheated');
  }, [studentName]);

  useEffect(() => {
    if (view !== 'quiz') return;
    const onVisibility = () => { if (document.hidden) handleCheat(); };
    const onBlur = () => handleCheat();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [view, handleCheat]);

  // Zamanlayıcı
  useEffect(() => {
    if (view !== 'quiz' || showAnswer) { clearInterval(timerRef.current); return; }
    const secs = activeSet?.time_per_q || 30;
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setShowAnswer(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, view, showAnswer, activeSet]);

  const startQuiz = (setId, set) => {
    const qs = shuffle(Object.values(set.questions || {}));
    if (qs.length === 0) return toast('Bu bölümde henüz soru yok!');
    scoreRef.current = 0;
    activeSetIdRef.current = setId;
    setActiveSetId(setId);
    setActiveSet(set);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setView('quiz');
  };

  const selectOption = (opt) => {
    if (showAnswer) return;
    clearInterval(timerRef.current);
    setSelected(opt);
    setShowAnswer(true);
    if (opt === questions[currentQ]?.correct) {
      scoreRef.current += 1;
      setScore(s => s + 1);
    }
  };

  const nextQuestion = async () => {
    const isLast = currentQ + 1 >= questions.length;
    if (!isLast) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowAnswer(false);
      return;
    }
    // Quiz bitti
    clearInterval(timerRef.current);
    const fs = scoreRef.current;
    const total = questions.length;
    const earned = fs * (activeSet?.points_per_q || 10);
    setFinalScore(fs);
    setCoinsEarned(earned);

    // Sonucu kaydet
    await db.ref(`mavikent_premium/quiz_results/${studentName}/${activeSetId}`).set({
      score: fs, total, earned_coins: earned,
      completed_at: new Date().toLocaleString('tr-TR'),
    });

    // M-Coin ekle
    if (earned > 0) {
      const snap = await db.ref(`mavikent_premium/wallet/${studentName}`).once('value');
      const current = snap.val() || 0;
      const ts = Date.now();
      const updates = {};
      updates[`wallet/${studentName}`] = current + earned;
      updates[`transactions/${studentName}/txn_quiz_${ts}`] = {
        desc: `📚 Akademi: ${activeSet?.name} (${fs}/${total} doğru)`,
        amt: earned,
        date: new Date().toLocaleString('tr-TR'),
      };
      await db.ref('mavikent_premium').update(updates);
    }

    setView('result');
  };

  const studentClass = appData?.student_classes?.[studentName] || '';
  const studentLevel = appData?.student_levels?.[studentName] || '';

  const publishedSets = Object.entries(sets).filter(([, s]) => {
    if (s.status !== 'published') return false;
    const classMatch = !s.target_class || s.target_class === 'Tüm Sınıflar' || s.target_class === studentClass;
    // "SEVİYE 1" → SEVİYE 1/A ve SEVİYE 1/B öğrencilerini de kapsar
    const levelMatch = !s.target_level || s.target_level === 'Tümü' || s.target_level === studentLevel || studentLevel.startsWith(s.target_level);
    return classMatch && levelMatch;
  });
  const hasDraft = Object.values(sets).some(s => s.status === 'draft');

  // ── BROWSE ──
  if (view === 'browse') return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>📚 Akademi</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Soru çöz, M-Coin kazan!</p>
      </div>

      {publishedSets.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '24px', padding: '50px 24px', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>⏳</div>
          <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '18px', marginBottom: '8px' }}>Sorular Hazırlanıyor</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600, lineHeight: 1.7 }}>
            Yöneticiniz soru bankalarını hazırlıyor.<br />Yayınlandığında burada görünecek, beklemede kal!
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {publishedSets.map(([id, set]) => {
            const result = results[id];
            const disqualified = !!result?.disqualified;
            const completed = !!result && !disqualified;
            const locked = completed || disqualified;
            const qCount = Object.keys(set.questions || {}).length;
            const maxCoins = qCount * (set.points_per_q || 10);
            const subjectEmojis = { 'Türkçe': '📝', 'Matematik': '🔢', 'Fen Bilimleri': '🔬', 'Sosyal/İnkılap': '🌍', 'İngilizce': '🌐', 'Din Kültürü': '🕌' };
            const icon = subjectEmojis[set.subject] || (set.set_type === 'akademik' ? '🎓' : set.set_type === 'dahili' ? '🏫' : '📚');
            const borderColor = disqualified ? '#fca5a5' : completed ? '#c4b5fd' : '#e2e8f0';
            const bgTop = disqualified ? '#fef2f2' : completed ? '#f5f3ff' : '#f8fafc';
            return (
              <div key={id} style={{ background: 'white', borderRadius: '20px', border: `2px solid ${borderColor}`, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                {/* Üst renkli alan */}
                <div style={{ background: bgTop, padding: '14px 14px 10px', borderBottom: `1px solid ${borderColor}` }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{icon}</div>
                  <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '13px', lineHeight: 1.3, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {set.name}
                  </div>
                </div>
                {/* Alt bilgi alanı */}
                <div style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                    {set.subject && <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 7px', borderRadius: '8px' }}>{set.subject}</span>}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '8px' }}>{qCount}S</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: '8px' }}>+{maxCoins}🪙</span>
                  </div>
                  {completed && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: '#ede9fe', padding: '3px 8px', borderRadius: '8px', marginBottom: '8px' }}>
                      ✓ {result.score}/{result.total} · +{result.earned_coins}🪙
                    </div>
                  )}
                  {disqualified && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '3px 8px', borderRadius: '8px', marginBottom: '8px' }}>🚫 Sınav dışı</div>
                  )}
                  {!locked ? (
                    <button onClick={() => startQuiz(id, set)} style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '13px', boxShadow: '0 3px 10px rgba(99,102,241,0.3)' }}>
                      Başla →
                    </button>
                  ) : (
                    <div style={{ width: '100%', textAlign: 'center', padding: '9px', borderRadius: '12px', fontWeight: 900, fontSize: '12px', background: disqualified ? '#fef2f2' : '#ede9fe', color: disqualified ? '#ef4444' : '#6366f1' }}>
                      {disqualified ? '🚫 Kilitli' : '🔒 Tamamlandı'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {hasDraft && (
            <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '14px 18px', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⏳</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>Hazırlanmakta olan ek bölümler var, yakında yayınlanacak!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── QUIZ ──
  if (view === 'quiz') {
    const q = questions[currentQ];
    if (!q) return null;
    const total = questions.length;
    const secs = activeSet?.time_per_q || 30;
    const timePercent = (timeLeft / secs) * 100;
    const timeWarning = timeLeft <= 5 && timeLeft > 0;
    const progressPercent = (currentQ / total) * 100;

    return (
      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '0 4px' }}>
        {/* Üst bilgi */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>Soru {currentQ + 1} / {total}</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: timeWarning ? '#ef4444' : timeLeft === 0 ? '#ef4444' : '#64748b', background: timeWarning ? '#fef2f2' : '#f8fafc', padding: '4px 12px', borderRadius: '20px' }}>
              ⏱ {timeLeft}sn
            </span>
          </div>
          {/* İlerleme */}
          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '6px', marginBottom: '5px', overflow: 'hidden' }}>
            <div style={{ background: '#6366f1', height: '100%', width: `${progressPercent}%`, borderRadius: '8px', transition: 'width 0.3s' }} />
          </div>
          {/* Süre */}
          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '4px', overflow: 'hidden' }}>
            <div style={{ background: timeWarning ? '#ef4444' : '#10b981', height: '100%', width: `${timePercent}%`, borderRadius: '8px', transition: 'width 1s linear' }} />
          </div>
        </div>

        {/* Soru */}
        <div style={{ background: 'white', borderRadius: '22px', padding: '24px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1.5px solid #e2e8f0' }}>
          <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', lineHeight: 1.65 }}>{q.text}</div>
        </div>

        {/* Şıklar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {['A', 'B', 'C', 'D'].map(opt => {
            let bg = 'white', color = '#0f172a', border = '1.5px solid #e2e8f0';
            if (showAnswer) {
              if (opt === q.correct) { bg = '#ecfdf5'; color = '#059669'; border = '2px solid #10b981'; }
              else if (opt === selected && opt !== q.correct) { bg = '#fef2f2'; color = '#ef4444'; border = '2px solid #ef4444'; }
              else { bg = '#f8fafc'; color = '#94a3b8'; border = '1.5px solid #e2e8f0'; }
            }
            return (
              <button key={opt} onClick={() => selectOption(opt)} disabled={showAnswer} style={{ background: bg, color, border, borderRadius: '16px', padding: '16px 20px', fontWeight: 800, cursor: showAnswer ? 'default' : 'pointer', textAlign: 'left', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', boxShadow: showAnswer ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ width: '30px', height: '30px', borderRadius: '9px', background: showAnswer && opt === q.correct ? '#10b981' : showAnswer && opt === selected && opt !== q.correct ? '#ef4444' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0, color: showAnswer && (opt === q.correct || (opt === selected && opt !== q.correct)) ? 'white' : '#64748b', transition: 'all 0.2s' }}>
                  {opt}
                </span>
                <span style={{ flex: 1, wordBreak: 'break-word' }}>{q[opt]}</span>
                {showAnswer && opt === q.correct && <span style={{ fontSize: '16px' }}>✓</span>}
                {showAnswer && opt === selected && opt !== q.correct && <span style={{ fontSize: '16px' }}>✗</span>}
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <button onClick={nextQuestion} style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '18px', padding: '18px', fontWeight: 900, cursor: 'pointer', fontSize: '16px', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
            {currentQ + 1 >= questions.length ? '🏁 Sonuçları Gör' : 'Sonraki Soru →'}
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
          ⚠️ Sınav sırasında başka sayfaya geçerseniz sınav otomatik sonlanır
        </div>
      </div>
    );
  }

  // ── RESULT ──
  if (view === 'result') {
    const total = questions.length;
    const pct = total > 0 ? Math.round((finalScore / total) * 100) : 0;
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '12px 0' }}>
        <div style={{ background: 'white', borderRadius: '28px', padding: '28px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {pct === 100 ? '🏆' : pct >= 80 ? '🎯' : pct >= 60 ? '📚' : '💪'}
          </div>
          <h2 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: '24px', color: '#0f172a' }}>
            {pct === 100 ? 'Mükemmel!' : pct >= 80 ? 'Harika!' : pct >= 60 ? 'İyi iş!' : 'Devam et!'}
          </h2>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginBottom: '28px' }}>{activeSet?.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '18px' }}>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#3b82f6' }}>{finalScore}/{total}</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', marginTop: '4px' }}>DOĞRU CEVAP</div>
            </div>
            <div style={{ background: '#fffbeb', borderRadius: '18px', padding: '18px' }}>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#f59e0b' }}>+{coinsEarned}</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', marginTop: '4px' }}>M-COİN</div>
            </div>
          </div>
          <button onClick={() => setView('browse')} style={{ width: '100%', background: '#0f172a', color: 'white', border: 'none', borderRadius: '16px', padding: '18px', fontWeight: 900, cursor: 'pointer', fontSize: '15px' }}>
            Bölümlere Dön
          </button>
        </div>
      </div>
    );
  }

  // ── CHEATED ──
  if (view === 'cheated') return (
    <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '12px 0' }}>
      <div style={{ background: 'white', borderRadius: '28px', padding: '28px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '2px solid #ef4444' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ margin: '0 0 12px', fontWeight: 900, fontSize: '22px', color: '#ef4444' }}>Sınav Sonlandırıldı!</h2>
        <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, lineHeight: 1.7, marginBottom: '28px' }}>
          Sınav sırasında başka bir sayfa veya uygulamaya geçtiğiniz tespit edildi.<br /><br />
          <strong style={{ color: '#ef4444' }}>Bu bölüm kalıcı olarak kilitlendi. Tekrar giremezsiniz.</strong>
        </p>
        <button onClick={() => setView('browse')} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', padding: '18px', fontWeight: 900, cursor: 'pointer', fontSize: '15px' }}>
          Tamam, Anladım
        </button>
      </div>
    </div>
  );

  return null;
};

export default QuizStudent;
