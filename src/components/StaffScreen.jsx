import React, { useState } from 'react';
import { db } from '../firebase';

const StaffScreen = ({ appData, goBackToRoles }) => {
  const [dashboardView, setDashboardView] = useState('main'); 
  const [currentModule, setCurrentModule] = useState(null); 
  const [selectedSession, setSelectedSession] = useState(''); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null); 

  const [eduData, setEduData] = useState({ lessons: [], pages: 0, questions: 0 });
  const [examData, setExamData] = useState({}); 
  const [valuesTopic, setValuesTopic] = useState({ subject: '', topic: '' });

  const eduClassList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "ELİT", "STANDART"];
  const levelList = ["SEVİYE 1/A", "SEVİYE 1/B", "SEVİYE 2"];
  const examSubjects = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din Kültürü"];
  
  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});
  const isElite = (name) => appData?.student_tiers?.[name] === 'elite';

  const mebLessons = { 
      "5. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], 
      "6. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], 
      "7. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], 
      "8. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"],
      "ELİT": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"],
      "STANDART": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"]
  };
  const valuesSubjectsList = ["K.Kerim", "İlmihal", "Siyer-i Nebi", "Adabı Muaşeret", "Tecvid"];

  const getFilteredRoster = (session) => {
      if(session === 'ELİT') return roster.filter(n => isElite(n));
      if(session === 'STANDART') return roster.filter(n => !isElite(n));
      return roster.filter(n => appData?.student_classes?.[n] === session);
  };

  const handleBack = () => {
    if (currentModule && (modalType || selectedStudent)) { setModalType(null); setSelectedStudent(null); return; }
    if (currentModule === 'yoklama' && selectedSession) { setSelectedSession(''); return; }
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); return; } 
    if (dashboardView !== 'main') { if (dashboardView.startsWith('egitim_')) setDashboardView('egitim'); else setDashboardView('main'); return; }
    goBackToRoles();
  };

  const getCalculatedPoints = (name, basePts, type) => {
    if (basePts === 0) return 0;
    const currentXp = Number(appData?.xp?.[name]) || 0;
    const lvl = Math.floor(Math.sqrt(currentXp / 50)) + 1; 
    let bns = lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0;
    if (type === 'yatak') bns = Math.min(bns, 1);
    const eliteMulti = isElite(name) && basePts > 0 && type !== 'kanaat' ? 2 : 0;
    const isGlobal2X = appData?.settings?.global_event === '2x_xp';
    const activeMultiplier = appData?.active_cards?.[name]?.multiplier;
    const isPersonal2X = activeMultiplier && activeMultiplier.date === new Date().toDateString();
    let total = basePts > 0 ? basePts + bns + eliteMulti : basePts;
    if ((isPersonal2X || isGlobal2X) && total > 0 && type !== 'kanaat') total *= 2;
    return total;
  };

  const saveData = (type, status, basePts) => {
    if (!selectedStudent) return;
    const finalPts = getCalculatedPoints(selectedStudent, basePts, type);
    const updates = {};
    const isFail = status === 'a' || status === 'l' || (type === 'yatak' && basePts === 0) || (type === 'telefon' && status === 'a');
    if (isFail) {
        const hasStreakSaver = appData?.active_cards?.[selectedStudent]?.streak?.date === new Date().toDateString();
        if (hasStreakSaver) { alert(`🛡️ ${selectedStudent} SERİ KORUMA KALKANI kullandı! Eksi aldı ama serisi bozulmadı.`); updates[`active_cards/${selectedStudent}/streak`] = null; } 
        else { updates[`streaks/${selectedStudent}`] = 0; updates[`daily_flags/${selectedStudent}/broken`] = true; }
    }
    if (finalPts !== 0) { 
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts; 
        updates[`xp/${selectedStudent}`] = Math.max(0, (Number(appData?.xp?.[selectedStudent]) || 0) + (basePts * 10)); 
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        let descText = type === 'kanaat' ? 'Personel Kanaat Notu' : (type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : 'Yatak/Dolap Düzeni'));
        updates[`transactions/${selectedStudent}/${tId}`] = { desc: descText, amt: finalPts, date: new Date().toLocaleString('tr-TR') };
    }
    if (type === 'yoklama') updates[`yoklama_d/${selectedStudent}/sessions/${selectedSession}`] = { st: status, pts: finalPts };
    else if (type === 'telefon') updates[`telefon_d/${selectedStudent}/sessions/gunluk`] = { st: status, pts: finalPts };
    else if (type === 'kanaat') updates[`kanaat_w/${selectedStudent}`] = (Number(appData?.kanaat_w?.[selectedStudent]) || 0) + finalPts;
    else if (type === 'yatak') updates[`yatak_d/${selectedStudent}/${status}_pts`] = finalPts; 
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null);
  };

  const saveEducationData = () => {
    const oldData = appData?.education_d?.[selectedStudent] || {}; let earnedPoints = 0;
    const validNew = (eduData.lessons || []).filter(hw => !hw.includes("YOK")); const validOld = (oldData.lessons || []).filter(hw => !hw.includes("YOK"));
    if (validOld.length === 0 && validNew.length > 0) earnedPoints += 2;
    if ((eduData.pages || 0) > (oldData.pages || 0)) earnedPoints += Math.floor((eduData.pages || 0) / 10) - Math.floor((oldData.pages || 0) / 10);
    if ((eduData.questions || 0) > (oldData.questions || 0)) earnedPoints += Math.floor((eduData.questions || 0) / 10) - Math.floor((oldData.questions || 0) / 10);
    const updates = {}; updates[`education_d/${selectedStudent}`] = { ...eduData, date: new Date().toDateString() };
    if (earnedPoints > 0) {
        const finalM = getCalculatedPoints(selectedStudent, earnedPoints, 'egitim');
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (Number(appData?.season_score?.[selectedStudent]) || 0) + (earnedPoints + (isElite(selectedStudent) ? 2 : 0));
        updates[`xp/${selectedStudent}`] = (Number(appData?.xp?.[selectedStudent]) || 0) + (earnedPoints * 10);
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        updates[`transactions/${selectedStudent}/${tId}`] = { desc: 'Günlük Eğitim/Ödev Başarısı', amt: finalM, date: new Date().toLocaleString('tr-TR') };
    }
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null); alert("Eğitim Verileri Güncellendi!");
  };

  const saveExamData = (type) => {
    const updates = {};
    if (type === 'deneme') {
        let totalNet = 0;
        for(let i=0; i<examSubjects.length; i++) { const d = parseFloat(examData[`d_${i}`]) || 0; const y = parseFloat(examData[`y_${i}`]) || 0; totalNet += (d - (y/3)); }
        updates[`exams/${selectedStudent}/deneme`] = { ...examData, net: totalNet, date: new Date().toDateString() };
    } else if (type === 'yazili') {
        let total = 0; let count = 0;
        for(let i=0; i<examSubjects.length; i++) { const val = examData[`p_${i}`]; if(val !== undefined && val !== '') { total += parseFloat(val); count++; } }
        updates[`exams/${selectedStudent}/yazili`] = { ...examData, avg: count > 0 ? (total / count) : 0, date: new Date().toDateString() };
    }
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null); alert(`${type.toUpperCase()} Kaydedildi!`);
  };

  const renderStudentGrid = (students, type) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
      {students.map(name => {
        let bgColor = '#ffffff'; let subText = '';
        if (currentModule === 'yoklama') { const st = appData?.yoklama_d?.[name]?.sessions?.[selectedSession]?.st; if (st === 'p' || st === 't') bgColor = '#ecfdf5'; if (st === 'a') bgColor = '#fef2f2'; if (st === 'l') bgColor = '#fffbeb'; } 
        else if (currentModule === 'values_view') { if (appData?.values_edu_d?.[name]?.[new Date().toDateString()]?.done) bgColor = '#ecfdf5'; } 
        else if (currentModule === 'class_view') { const d = appData?.education_d?.[name]; if(d) subText = `Ödev: ${(d.lessons||[]).length}`; } 
        
        const isEliteStud = isElite(name);
        return (
          <div key={name} onClick={() => { 
                setSelectedStudent(name); 
                if (type === 'isleyis') setModalType('isleyis');
                else if (type === 'egitim_ders') { setEduData({ lessons: appData?.education_d?.[name]?.lessons || [], pages: appData?.education_d?.[name]?.pages || 0, questions: appData?.education_d?.[name]?.questions || 0 }); setModalType('egitim'); }
                else if (type === 'egitim_deneme') { setExamData(appData?.exams?.[name]?.deneme || {}); setModalType('deneme'); }
                else if (type === 'egitim_yazili') { setExamData(appData?.exams?.[name]?.yazili || {}); setModalType('yazili'); }
                else if (type === 'degerler') {
                   const bugun = new Date().toDateString();
                   if(!appData?.values_edu_d?.[name]?.[bugun]?.done) { if(window.confirm(`${name} dersi verdi mi?`)) { db.ref(`mavikent_premium/values_edu_d/${name}/${bugun}/done`).set(true); db.ref(`mavikent_premium/wallet/${name}`).transaction(c => (Number(c)||0) + (isEliteStud?4:2)); db.ref(`mavikent_premium/season_score/${name}`).transaction(c => (Number(c)||0) + (isEliteStud?4:2)); } } 
                   else { if(window.confirm("Kaldırılsın mı?")) db.ref(`mavikent_premium/values_edu_d/${name}/${bugun}/done`).set(null); }
                }
             }} 
               className="card-hover" style={{ background: bgColor, border: isEliteStud ? '2px solid #d4af37' : 'none', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a', cursor: 'pointer' }}>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>{isEliteStud ? '👑 ' : ''}{name}</div>
            {subText && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>{subText}</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        * { outline: none !important; } button, input, select { border: none !important; outline: none !important; }
        .premium-btn { border-radius: 50px !important; border: none !important; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.08); display: inline-flex; align-items: center; justify-content: center;}
        .premium-btn:hover { filter: brightness(0.95); transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.12); } .premium-btn:active { transform: scale(0.96); }
        .btn-iptal { background: #f1f5f9 !important; color: #64748b !important; padding: 16px 24px; border-radius: 50px !important; font-weight: 800; border: none !important; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-iptal:hover { background: #e2e8f0 !important; color: #0f172a !important; transform: translateY(-2px); } .btn-iptal:active { transform: scale(0.96); }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); } .card-hover:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 35px -5px rgba(0,0,0,0.1) !important; } .card-hover:active { transform: scale(0.98); }
        .elite-input { outline: none !important; border: 2px solid #e2e8f0 !important; transition: all 0.2s; padding: 14px 20px; border-radius: 20px; width: 100%; font-weight: 700; color: #0f172a; background: #f8fafc; }
        .elite-input:focus { border-color: #3b82f6 !important; background: #ffffff; box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important; }
        .clean-scroll::-webkit-scrollbar { width: 6px; } .clean-scroll::-webkit-scrollbar-track { background: transparent; } .clean-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '50px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <button onClick={handleBack} className="premium-btn" style={{ background: '#f1f5f9', color: '#0f172a', padding: '12px 20px', fontWeight: 800 }}>← {currentModule || dashboardView !== 'main' ? 'Geri Dön' : 'Çıkış Yap'}</button>
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>PERSONEL PANELİ</div>
      </div>

      {!currentModule && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {dashboardView === 'main' && [
              { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' }, { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
              { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="card-hover" style={{ background: 'white', textAlign: 'center', borderRadius: '24px', padding: '35px 20px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{mod.label}</div>
              </div>
            ))}
            
            {dashboardView === 'egitim' && [ { id: 'egitim_ders', icon: '📝', label: 'ÖDEV / KİTAP TAKİBİ' }, { id: 'egitim_deneme', icon: '📊', label: 'DENEME SINAVLARI' }, { id: 'egitim_yazili', icon: '💯', label: 'YAZILI HAZIRLIK' } ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="card-hover" style={{ background: 'white', textAlign: 'center', borderRadius: '24px', padding: '35px 20px', cursor:'pointer' }}><div style={{ fontSize: '42px', marginBottom: '16px' }}>{mod.icon}</div><div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{mod.label}</div></div>
            ))}
            {dashboardView === 'egitim_ders' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('class_view'); setSelectedSession(cls); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', cursor:'pointer' }}>📝 <br/><br/> {cls}</div>))}
            {dashboardView === 'egitim_deneme' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('deneme_view'); setSelectedSession(cls); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', cursor:'pointer' }}>📊 <br/><br/> {cls}</div>))}
            {dashboardView === 'egitim_yazili' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('yazili_view'); setSelectedSession(cls); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', cursor:'pointer' }}>💯 <br/><br/> {cls}</div>))}
            {dashboardView === 'degerler' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('values_view'); setSelectedSession(lvl); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', cursor:'pointer' }}>🕌 <br/><br/> {lvl}</div>))}
            {dashboardView === 'isleyis' && [ { id: 'yoklama', icon: '📋', label: 'Yoklama' }, { id: 'telefon', icon: '📱', label: 'Telefon' }, { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' }, { id: 'kanaat', icon: '✍️', label: 'Kanaat Notu' } ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="card-hover" style={{ background: 'white', textAlign: 'center', borderRadius: '24px', padding: '35px 20px', cursor:'pointer' }}><div style={{ fontSize: '42px', marginBottom: '16px' }}>{mod.icon}</div><div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{mod.label}</div></div>
            ))}
          </div>
      )}

      {currentModule === 'yoklama' && !selectedSession && ( <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>{['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => ( <div key={s} onClick={() => setSelectedSession(s)} className="card-hover" style={{ background: 'white', padding: '24px', textAlign: 'center', fontWeight: 900, fontSize: '16px', borderRadius: '20px', cursor:'pointer' }}>{s}</div> ))}</div> )}
      {currentModule === 'yoklama' && selectedSession && ( <div className="clean-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '15px' }}>{['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => ( <button key={s} onClick={() => setSelectedSession(s)} className="premium-btn" style={{ padding: '14px 24px', background: selectedSession === s ? '#0f172a' : 'white', color: selectedSession === s ? '#d4af37' : '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>{s}</button> ))}</div> )}
      {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'kanaat'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
      
      {currentModule === 'class_view' && renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_ders')}
      {currentModule === 'deneme_view' && renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_deneme')}
      {currentModule === 'yazili_view' && renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_yazili')}
      
      {currentModule === 'values_view' && (
        <>
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
             <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px' }}>📖 GÜNLÜK DERS KONUSU</h4>
             <select value={valuesTopic.subject} onChange={e => setValuesTopic({...valuesTopic, subject: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}><option value="">Ders Seçin</option>{valuesSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}</select>
             <input value={valuesTopic.topic} onChange={e => setValuesTopic({...valuesTopic, topic: e.target.value})} placeholder="İşlenen konu vb." className="elite-input" style={{ marginBottom: '16px' }} />
             <button onClick={() => { db.ref(`mavikent_premium/values_log/${selectedSession}/${new Date().toDateString()}`).set(valuesTopic); alert("Konu Kaydedildi"); }} className="premium-btn" style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white', fontSize: '15px' }}>DERSİ YAYINLA</button>
          </div>
          {renderStudentGrid(roster.filter(n => appData?.student_levels?.[n] === selectedSession), 'degerler')}
        </>
      )}

      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px' }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '13px', background: '#fde047', color: '#b45309', padding: '6px 14px', borderRadius: '12px', fontWeight: 900, marginBottom: '24px', display: 'inline-block' }}>👑 ELİT LİG BONUSU</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: isElite(selectedStudent) ? '0' : '24px' }}>
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', 3)} className="premium-btn" style={{ background: '#d4af37', color: 'white', padding: '20px' }}>👳‍♂️ TAKKELİ</button>
                  <button onClick={() => saveData('yoklama', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>✅ GELDİ</button>
                  <button onClick={() => saveData('yoklama', 'l', 1)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '20px' }}>⏳ GEÇ</button>
                  <button onClick={() => saveData('yoklama', 'a', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>❌ GELMEDİ</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <>
                  <button onClick={() => saveData('telefon', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>📱 TESLİM</button>
                  <button onClick={() => saveData('telefon', 'e', 2)} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '20px' }}>📵 TELEFONU YOK</button>
                  <button onClick={() => saveData('telefon', 'a', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 VERMEDİ</button>
                </>
              )}
              {currentModule === 'yatak' && (
                <>
                  <button onClick={() => saveData('yatak', 'yatak', 1)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🛏️ YATAK DÜZENLİ</button>
                  <button onClick={() => saveData('yatak', 'yatak', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🕸️ YATAK BOZUK</button>
                  <button onClick={() => saveData('yatak', 'dolap', 1)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🚪 DOLAP DÜZENLİ</button>
                  <button onClick={() => saveData('yatak', 'dolap', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🏚️ DOLAP BOZUK</button>
                </>
              )}
              {currentModule === 'kanaat' && (
                <>
                  <input id="kanaatInput" type="number" placeholder="Puan (Örn: 10 veya -5)" className="elite-input" style={{ padding: '20px', fontSize: '20px', textAlign: 'center', marginBottom: '16px' }} />
                  <button onClick={() => saveData('kanaat', 'k', parseInt(document.getElementById('kanaatInput').value) || 0)} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '20px', width: '100%' }}>KAYDET</button>
                </>
              )}
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ marginTop: '10px' }}>İPTAL</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && modalType === 'egitim' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px' }}>{selectedStudent}</h3>
            <div style={{ fontSize: '14px', color: '#d4af37', fontWeight: 900, marginBottom: '30px' }}>{selectedSession} EĞİTİM KOÇLUĞU</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', textAlign: 'left' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>📝 ÖDEV TAKİBİ</div>
                <div className="clean-scroll" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
                  {(mebLessons[selectedSession] || []).map(lesson => {
                    const isChecked = (eduData.lessons || []).includes(lesson);
                    return (
                      <div key={lesson} onClick={() => setEduData(prev => ({...prev, lessons: isChecked ? (prev.lessons || []).filter(l => l !== lesson) : [...(prev.lessons || []), lesson]}))} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: isChecked ? '#ecfdf5' : 'white', borderRadius: '20px', marginBottom: '12px', fontSize: '15px', fontWeight: 800, color: isChecked ? '#047857' : '#334155', border: `2px solid ${isChecked ? '#10b981' : '#e2e8f0'}`, cursor: 'pointer' }}>
                        <span>{lesson}</span><span>{isChecked ? '✓' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px' }}>📖 KİTAP SAYACI (10 S. = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, pages: Math.max(0, (prev.pages || 0) - 10)}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#e2e8f0', color: '#0f172a', fontSize: '28px' }}>-</button>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', width: '80px' }}>{eduData.pages || 0}</div>
                    <button onClick={() => setEduData(prev => ({...prev, pages: (prev.pages || 0) + 10}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#0f172a', color: 'white', fontSize: '28px' }}>+</button>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px' }}>🧠 SORU SAYACI (10 S. = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, questions: Math.max(0, (prev.questions || 0) - 10)}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#e2e8f0', color: '#0f172a', fontSize: '28px' }}>-</button>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', width: '80px' }}>{eduData.questions || 0}</div>
                    <button onClick={() => setEduData(prev => ({...prev, questions: (prev.questions || 0) + 10}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#0f172a', color: 'white', fontSize: '28px' }}>+</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '35px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ flex: 1 }}>İPTAL</button>
              <button onClick={saveEducationData} className="premium-btn" style={{ flex: 2, padding: '20px', background: '#10b981', color: 'white', fontSize: '16px' }}>VERİLERİ KAYDET</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (modalType === 'deneme' || modalType === 'yazili') && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center' }}>
             <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px' }}>{selectedStudent}</h3>
             <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 900, marginBottom: '30px' }}>{modalType === 'deneme' ? 'DENEME SINAVI' : 'YAZILI'} GİRİŞİ</div>
             
             <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                 {examSubjects.map((sub, idx) => (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: idx !== examSubjects.length-1 ? '16px' : '0' }}>
                         <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>{sub}</span>
                         {modalType === 'deneme' ? (
                             <div style={{ display: 'flex', gap: '12px' }}>
                                 <input type="number" placeholder="D" value={examData[`d_${idx}`] || ''} onChange={e => setExamData({...examData, [`d_${idx}`]: e.target.value})} className="elite-input" style={{ width: '70px', padding: '12px 0', textAlign: 'center', fontSize: '16px' }} />
                                 <input type="number" placeholder="Y" value={examData[`y_${idx}`] || ''} onChange={e => setExamData({...examData, [`y_${idx}`]: e.target.value})} className="elite-input" style={{ width: '70px', padding: '12px 0', textAlign: 'center', fontSize: '16px' }} />
                             </div>
                         ) : (
                             <input type="number" placeholder="Not" value={examData[`p_${idx}`] || ''} onChange={e => setExamData({...examData, [`p_${idx}`]: e.target.value})} className="elite-input" style={{ width: '90px', padding: '12px 0', textAlign: 'center', fontSize: '16px' }} />
                         )}
                     </div>
                 ))}
             </div>

             <div style={{ textAlign: 'left', fontWeight: '900', fontSize: '14px', color: '#64748b', marginBottom: '10px', paddingLeft: '8px' }}>HEDEF {modalType === 'deneme' ? 'NET' : 'ORTALAMA'}:</div>
             <input type="number" value={examData.target || ''} onChange={e => setExamData({...examData, target: e.target.value})} placeholder="Örn: 85" className="elite-input" style={{ width: '100%', padding: '20px', fontSize: '20px', textAlign: 'center', marginBottom: '35px' }} />

             <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ flex: 1 }}>İPTAL</button>
              <button onClick={() => saveExamData(modalType)} className="premium-btn" style={{ flex: 2, padding: '20px', background: '#3b82f6', color: 'white', fontSize: '16px' }}>KAYDET</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffScreen;