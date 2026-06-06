import React, { useRef } from 'react';

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.getTime(), end: sunday.getTime() };
};

const fmt2 = n => String(n).padStart(2, '0');

const getTxnTimestamp = key => {
  const m = key.match(/(\d{13})/);
  return m ? parseInt(m[1]) : 0;
};

const parseWeekLabel = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${fmt2(s.getDate())}.${fmt2(s.getMonth() + 1)} — ${fmt2(e.getDate())}.${fmt2(e.getMonth() + 1)}.${e.getFullYear()}`;
};

const getWeekDates = (start, end) => {
  const dates = [];
  const d = new Date(start);
  while (d.getTime() <= end) {
    dates.push(new Date(d).toDateString());
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

const computeStats = (studentName, appData, start, end) => {
  const weekDates = getWeekDates(start, end);

  // Game room
  const txns = appData?.transactions?.[studentName] || {};
  const weekTxns = Object.entries(txns).filter(([k]) => {
    const ts = getTxnTimestamp(k);
    return ts >= start && ts <= end;
  });
  const gameCount = weekTxns.filter(([k]) => k.startsWith('txn_game_')).length;

  // Namaz yoklaması
  const yoklamaData = appData?.yoklama_d || {};
  let namazGeldi = 0, namazToplam = 0;
  weekDates.forEach(dateStr => {
    const sessions = yoklamaData[dateStr]?.[studentName]?.sessions || {};
    Object.values(sessions).forEach(s => {
      namazToplam++;
      if (s.st && s.st !== 'a') namazGeldi++;
    });
  });

  // Okul dönüşleri & devamsızlık
  const dailyStatus = appData?.daily_status || {};
  let okulDondu = 0, okulGelmedi = 0;
  weekDates.forEach(dateStr => {
    const st = dailyStatus[dateStr]?.[studentName];
    if (st === 'p') okulDondu++;
    else if (st === 'a') okulGelmedi++;
  });
  const totalAbsences = Number(appData?.absences?.[studentName] || 0);

  // Hijyen denetim
  const hygieneLogs = appData?.hygiene_logs || {};
  const myHygieneLogs = Object.values(hygieneLogs).filter(log => {
    if (!log.timestamp || log.timestamp < start || log.timestamp > end) return false;
    return (log.responsibles || []).includes(studentName) || log.student === studentName;
  });
  const hygieneAvg = myHygieneLogs.length > 0
    ? myHygieneLogs.reduce((s, l) => s + (l.score || 0), 0) / myHygieneLogs.length
    : null;

  // Yazılı sınav
  const yaziliData = appData?.exams?.[studentName]?.yazili || null;

  // Quiz
  const quizResults = appData?.quiz_results?.[studentName] || {};
  const weekQuiz = Object.values(quizResults).filter(r => {
    if (r?.disqualified || !r?.completed_at) return false;
    try {
      const [datePart] = r.completed_at.split(' ');
      const [d, mo, y] = datePart.split('.');
      const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
      return dt.getTime() >= start && dt.getTime() <= end;
    } catch { return false; }
  });
  const completedSets = weekQuiz.length;
  const totalCorrect = weekQuiz.reduce((s, r) => s + (r.score || 0), 0);
  const totalQ = weekQuiz.reduce((s, r) => s + (r.total || 0), 0);
  const avgPct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const studentClass = appData?.student_classes?.[studentName] || '';
  const studentLevel = appData?.student_levels?.[studentName] || '';

  return {
    gameCount,
    namazGeldi, namazToplam,
    okulDondu, okulGelmedi, totalAbsences,
    hygieneAvg, hygieneCount: myHygieneLogs.length,
    yaziliData,
    completedSets, avgPct, totalCorrect, totalQ,
    studentClass, studentLevel,
  };
};

const StarRow = ({ avg }) => {
  const full = Math.floor(avg);
  const half = (avg - full) >= 0.5;
  return (
    <span style={{ fontSize: '15px', letterSpacing: '1px' }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
};

const SectionTitle = ({ icon, title, color }) => (
  <div style={{ fontSize: '10px', fontWeight: 900, color: color || '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>
    {icon} {title}
  </div>
);

const MiniCell = ({ label, value, valueColor }) => (
  <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center', minWidth: 0 }}>
    <div style={{ fontSize: '16px', fontWeight: 900, color: valueColor || '#0f172a' }}>{value}</div>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', marginTop: '2px' }}>{label}</div>
  </div>
);

const WeeklySummaryCard = ({ studentName, appData, compact = false }) => {
  const cardRef = useRef(null);
  const { start, end } = getWeekRange();
  const weekLabel = parseWeekLabel(start, end);
  const stats = computeStats(studentName, appData, start, end);

  const quizBarColor = stats.avgPct >= 80 ? '#10b981' : stats.avgPct >= 60 ? '#3b82f6' : stats.avgPct >= 40 ? '#f59e0b' : '#ef4444';
  const namazPct = stats.namazToplam > 0 ? Math.round((stats.namazGeldi / stats.namazToplam) * 100) : 0;
  const namazBarColor = namazPct >= 80 ? '#10b981' : namazPct >= 60 ? '#3b82f6' : namazPct >= 40 ? '#f59e0b' : '#ef4444';

  const downloadJpg = async () => {
    if (!cardRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardRef.current, {
      scale: 2.5,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `${studentName}_haftalik_karne.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const cardStyle = compact
    ? { background: 'white', borderRadius: '20px', padding: '18px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
    : { background: 'white', borderRadius: '24px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '480px', margin: '0 auto' };

  return (
    <div>
      <div ref={cardRef} style={cardStyle}>

        {/* Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6', letterSpacing: '1.5px', marginBottom: '3px' }}>📅 HAFTALIK AKADEMİ RAPORU</div>
            <div style={{ fontWeight: 900, fontSize: compact ? '17px' : '20px', color: '#0f172a', lineHeight: 1.2 }}>{studentName}</div>
            {(stats.studentClass || stats.studentLevel) && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '3px' }}>
                {[stats.studentClass, stats.studentLevel].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px' }}>🎓</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginTop: '3px' }}>{weekLabel}</div>
          </div>
        </div>

        {/* Yazılı Sınavı */}
        {stats.yaziliData && typeof stats.yaziliData.avg === 'number' && (
          <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '13px', marginBottom: '10px' }}>
            <SectionTitle icon="📝" title="YAZILI SINAVI" color="#059669" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <MiniCell label="ORTALAMA" value={stats.yaziliData.avg.toFixed(1)} valueColor="#059669" />
              {stats.yaziliData.target > 0 && (
                <MiniCell label="HEDEF" value={stats.yaziliData.target} valueColor="#64748b" />
              )}
              <MiniCell
                label="DURUM"
                value={stats.yaziliData.avg >= (stats.yaziliData.target || 0) ? '✅ Hedefte' : '⚠️ Hedef Altı'}
                valueColor={stats.yaziliData.avg >= (stats.yaziliData.target || 0) ? '#10b981' : '#f59e0b'}
              />
            </div>
          </div>
        )}

        {/* Namaz Yoklaması */}
        <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '13px', marginBottom: '10px' }}>
          <SectionTitle icon="🕌" title="NAMAZ YOKLAMASI" color="#7c3aed" />
          {stats.namazToplam === 0 ? (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>Bu hafta yoklama kaydı yok</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <MiniCell label="KATILDI" value={stats.namazGeldi} valueColor="#7c3aed" />
                <MiniCell label="TOPLAM" value={stats.namazToplam} valueColor="#64748b" />
                <MiniCell label="ORAN" value={`%${namazPct}`} valueColor={namazBarColor} />
              </div>
              <div style={{ background: '#ede9fe', borderRadius: '6px', height: '5px', overflow: 'hidden' }}>
                <div style={{ background: namazBarColor, height: '100%', width: `${namazPct}%`, borderRadius: '6px' }} />
              </div>
            </>
          )}
        </div>

        {/* Okul Dönüşleri & Devamsızlık */}
        <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '13px', marginBottom: '10px' }}>
          <SectionTitle icon="🏫" title="OKUL DÖNÜŞ & DEVAMSIZLIK" color="#c2410c" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <MiniCell label="DÖNDÜ" value={`${stats.okulDondu} gün`} valueColor="#10b981" />
            <MiniCell label="BU HAFTA YOK" value={`${stats.okulGelmedi} gün`} valueColor={stats.okulGelmedi > 0 ? '#ef4444' : '#94a3b8'} />
            <MiniCell label="TOPLAM İZİN" value={stats.totalAbsences} valueColor={stats.totalAbsences > 5 ? '#ef4444' : '#64748b'} />
          </div>
        </div>

        {/* Quiz */}
        <div style={{ background: '#eff6ff', borderRadius: '14px', padding: '13px', marginBottom: '10px' }}>
          <SectionTitle icon="📚" title="AKADEMİ QUIZ" color="#2563eb" />
          {stats.completedSets === 0 ? (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>Bu hafta quiz çözülmedi</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <MiniCell label="BÖLÜM" value={stats.completedSets} valueColor="#2563eb" />
                <MiniCell label="DOĞRU" value={`${stats.totalCorrect}/${stats.totalQ}`} valueColor="#0f172a" />
                <MiniCell label="BAŞARI" value={`%${stats.avgPct}`} valueColor={quizBarColor} />
              </div>
              <div style={{ background: '#dbeafe', borderRadius: '6px', height: '5px', overflow: 'hidden' }}>
                <div style={{ background: quizBarColor, height: '100%', width: `${stats.avgPct}%`, borderRadius: '6px' }} />
              </div>
            </>
          )}
        </div>

        {/* Hijyen Denetim */}
        <div style={{ background: '#f0fdfa', borderRadius: '14px', padding: '13px', marginBottom: '10px' }}>
          <SectionTitle icon="✨" title="HİJYEN DENETİM" color="#0d9488" />
          {stats.hygieneCount === 0 ? (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>Bu hafta denetim kaydı yok</div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <MiniCell label="DENETİM" value={stats.hygieneCount} valueColor="#0d9488" />
              <MiniCell
                label="ORTALAMA"
                value={`${stats.hygieneAvg.toFixed(1)}/5`}
                valueColor={stats.hygieneAvg >= 4 ? '#10b981' : stats.hygieneAvg >= 3 ? '#f59e0b' : '#ef4444'}
              />
              <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ color: stats.hygieneAvg >= 4 ? '#f59e0b' : stats.hygieneAvg >= 3 ? '#f59e0b' : '#ef4444' }}>
                  <StarRow avg={stats.hygieneAvg} />
                </div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', marginTop: '2px' }}>YILDIZ</div>
              </div>
            </div>
          )}
        </div>

        {/* Oyun Odası */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🎮</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '12px', color: '#0f172a' }}>Oyun Odası</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>Bu hafta</div>
            </div>
          </div>
          <div style={{ fontWeight: 900, fontSize: '18px', color: stats.gameCount > 0 ? '#6366f1' : '#94a3b8' }}>
            {stats.gameCount} <span style={{ fontSize: '10px', fontWeight: 700 }}>seans</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#cbd5e1', letterSpacing: '1px' }}>mavikent-elite.vercel.app</div>
        </div>
      </div>

      {!compact && (
        <button
          onClick={downloadJpg}
          style={{ width: '100%', marginTop: '14px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '16px', padding: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          📥 JPG Olarak İndir
        </button>
      )}
    </div>
  );
};

export default WeeklySummaryCard;
