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

  const classList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"];
  const levelList = ["SEVİYE 1/A", "SEVİYE 1/B", "SEVİYE 2"];
  const examSubjects = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din Kültürü"];
  const roster = appData?.roster || [];
  const isElite = (name) => appData?.student_tiers?.[name] === 'elite';

  const mebLessons = {
    "5. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü", "Bilişim", "Beden", "🚫 ÖDEVİ YOK"],
    "6. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü", "Bilişim", "Beden", "🚫 ÖDEVİ YOK"],
    "7. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü", "Teknoloji", "Beden", "🚫 ÖDEVİ YOK"],
    "8. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din Kültürü", "Teknoloji", "Beden", "🚫 ÖDEVİ YOK"]
  };

  const valuesSubjectsList = ["K.Kerim", "İlmihal", "Siyer-i Nebi", "Adabı Muaşeret", "Tecvid"];

  const handleBack = () => {
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); } 
    else {
      if (dashboardView === 'main') goBackToRoles();
      else if (dashboardView.startsWith('egitim_')) setDashboardView('egitim');
      else setDashboardView('main');
    }
  };

  const getCalculatedPoints = (name, basePts, type) => {
    if (basePts === 0) return 0;
    const lvl = Math.floor((appData?.xp?.[name] || 0) / 200) + 1;
    let bns = lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0;
    if (type === 'yatak') bns = Math.min(bns, 1);
    if (type === 'kanaat') bns = 0;
    const eliteMulti = isElite(name) && basePts > 0 && type !== 'kanaat' ? 2 : 0;
    const is2X = appData?.active_cards?.[name]?.multiplier?.date === new Date().toDateString();
    let total = basePts > 0 ? basePts + bns + eliteMulti : basePts;
    if (is2X && total > 0) total *= 2;
    return total;
  };

  const saveData = (type, status, basePts) => {
    if (!selectedStudent) return;
    const finalPts = getCalculatedPoints(selectedStudent, basePts, type);
    const updates = {};
    if (status === 'a' || status === 'l' || (type === 'yatak' && basePts === 0)) {
        updates[`streaks/${selectedStudent}`] = 0;
        updates[`daily_flags/${selectedStudent}/broken`] = true;
    }
    if (finalPts !== 0) {
        updates[`wallet/${selectedStudent}`] = (appData?.wallet?.[selectedStudent] || 0) + finalPts;
        updates[`xp/${selectedStudent}`] = (appData?.xp?.[selectedStudent] || 0) + (Math.abs(basePts) * 10);
    }
    if (type === 'yoklama') updates[`yoklama_d/${selectedStudent}/sessions/${selectedSession}`] = { st: status, pts: finalPts };
    else if (type === 'telefon') updates[`telefon_d/${selectedStudent}/sessions/gunluk`] = { st: status, pts: finalPts };
    else if (type === 'kanaat') updates[`kanaat_w/${selectedStudent}`] = (appData?.kanaat_w?.[selectedStudent] || 0) + finalPts;
    else if (type === 'yatak') updates[`yatak_d/${selectedStudent}/${status}_pts`] = finalPts; 

    db.ref('mavikent_premium').update(updates);
    setSelectedStudent(null); setModalType(null);
    alert(`İşlem Kaydedildi! ${finalPts !== 0 ? `(+${finalPts} M)` : ''}`);
  };

  const saveEducationData = () => {
    const oldData = appData?.education_d?.[selectedStudent] || {};
    let earnedPoints = 0;
    const validNew = eduData.lessons.filter(hw => !hw.includes("ÖDEVİ YOK"));
    const validOld = (oldData.lessons || []).filter(hw => !hw.includes("ÖDEVİ YOK"));
    if (validOld.length === 0 && validNew.length > 0) earnedPoints += 2;
    if (eduData.pages > (oldData.pages || 0)) earnedPoints += Math.floor(eduData.pages / 10) - Math.floor((oldData.pages || 0) / 10);
    if (eduData.questions > (oldData.questions || 0)) earnedPoints += Math.floor(eduData.questions / 10) - Math.floor((oldData.questions || 0) / 10);

    const updates = {};
    updates[`education_d/${selectedStudent}`] = { ...eduData, date: new Date().toDateString() };

    if (earnedPoints > 0) {
        const lvl = Math.floor((appData?.xp?.[selectedStudent] || 0) / 200) + 1;
        let bns = lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0;
        const eliteBonus = isElite(selectedStudent) ? 2 : 0;
        const finalM = earnedPoints + bns + eliteBonus;
        updates[`wallet/${selectedStudent}`] = (appData?.wallet?.[selectedStudent] || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (appData?.season_score?.[selectedStudent] || 0) + (earnedPoints + eliteBonus);
        updates[`xp/${selectedStudent}`] = (appData?.xp?.[selectedStudent] || 0) + (earnedPoints * 10);
    }
    db.ref('mavikent_premium').update(updates);
    setSelectedStudent(null); setModalType(null);
    alert("Eğitim Verileri Güncellendi!");
  };

  const saveExamData = (type) => {
    const updates = {};
    if (type === 'deneme') {
        let totalNet = 0;
        for(let i=0; i<examSubjects.length; i++) {
            const d = parseFloat(examData[`d_${i}`]) || 0;
            const y = parseFloat(examData[`y_${i}`]) || 0;
            totalNet += (d - (y/3)); 
        }
        updates[`exams/${selectedStudent}/deneme`] = { ...examData, net: totalNet, date: new Date().toDateString() };
    } else if (type === 'yazili') {
        let total = 0; let count = 0;
        for(let i=0; i<examSubjects.length; i++) {
            const val = examData[`p_${i}`];
            if(val !== undefined && val !== '') { total += parseFloat(val); count++; }
        }
        updates[`exams/${selectedStudent}/yazili`] = { ...examData, avg: count > 0 ? (total / count) : 0, date: new Date().toDateString() };
    }
    db.ref('mavikent_premium').update(updates);
    setSelectedStudent(null); setModalType(null);
    alert(`${type.toUpperCase()} Kaydedildi!`);
  };

  const generateParentReport = (type, className) => {
    const classStudents = roster.filter(n => appData?.student_classes?.[n] === className);
    let reportData = classStudents.map(n => {
        const data = appData?.exams?.[n]?.[type] || {};
        let score = type === 'deneme' ? (data.net || 0) : (data.avg || 0);
        return { name: n, score: score, target: data.target || '-' };
    }).sort((a,b) => b.score - a.score);

    let printWindow = window.open('', '', 'width=800,height=800');
    printWindow.document.write(`
      <html><head><title>${className} - ${type.toUpperCase()} GÜNLÜK RAPOR</title>
      <style>body{font-family:sans-serif; padding:20px;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ccc; padding:10px; text-align:center;} th{background:#0f172a; color:white;}</style>
      </head><body>
      <h2 style="text-align:center;">MAVİKENT YURDU - ${className} ${type.toUpperCase()} SONUÇLARI</h2>
      <table><tr><th>SIRA</th><th style="text-align:left;">ÖĞRENCİ ADI</th><th>${type === 'deneme' ? 'TOPLAM NET' : 'ORTALAMA'}</th><th>HEDEF</th></tr>
      ${reportData.map((d, i) => `<tr><td>${i+1}</td><td style="text-align:left; font-weight:bold;">${d.name}</td><td style="color:#b45309; font-weight:bold;">${parseFloat(d.score).toFixed(2)}</td><td>${d.target}</td></tr>`).join('')}
      </table></body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const generateDenemeReport = (className) => {
    const classStudents = roster.filter(n => appData?.student_classes?.[n] === className);
    let reportData = classStudents.map(n => {
        const data = appData?.exams?.[n]?.deneme || {};
        let subs = [];
        let totalNet = 0;
        for(let i=0; i<examSubjects.length; i++) {
            const d = parseFloat(data[`d_${i}`]) || 0;
            const y = parseFloat(data[`y_${i}`]) || 0;
            const net = d - (y/3);
            totalNet += net;
            subs.push(`<div style="font-size:10px; color:#64748b;">${d}D ${y}Y</div><div style="font-weight:bold; color:#0f172a;">${net.toFixed(1)} N</div>`);
        }
        const target = data.target || 0;
        let status = '-'; let statusColor = '#64748b'; 
        if (target > 0 && totalNet > 0) {
            if (totalNet >= target) { status = 'GEÇTİ ✅'; statusColor = '#10b981'; } 
            else { status = 'KALDI ❌'; statusColor = '#ef4444'; }
        }
        return { name: n, totalNet: totalNet, target: target || '-', subs: subs, status: status, statusColor: statusColor };
    }).sort((a,b) => b.totalNet - a.totalNet);

    let printWindow = window.open('', '', 'width=1100,height=800');
    printWindow.document.write(`
      <html><head><title>${className} - DENEME RAPORU</title>
      <style>body{font-family:sans-serif; padding:20px; background:#f8fafc;} table{width:100%; border-collapse:collapse; font-size:12px; background:white;} th,td{border:1px solid #e2e8f0; padding:8px; text-align:center;} th{background:#0f172a; color:white; font-weight:bold;} tr:nth-child(even){background:#f1f5f9;}</style>
      </head><body>
      <h2 style="text-align:center; color:#0f172a; border-bottom:3px solid #3b82f6; padding-bottom:10px;">MAVİKENT YURDU - ${className} DETAYLI DENEME SINAVI RAPORU</h2>
      <table><tr><th style="width:40px;">SIRA</th><th style="text-align:left;">ÖĞRENCİ ADI</th>${examSubjects.map(s => `<th>${s}</th>`).join('')}<th style="background:#b45309;">TOPLAM NET</th><th style="background:#0f172a;">HEDEF</th><th>DURUM</th></tr>
      ${reportData.map((d, i) => `<tr><td><b>${i+1}</b></td><td style="text-align:left; font-weight:bold; color:#334155;">${d.name}</td>${d.subs.map(s => `<td>${s}</td>`).join('')}<td style="color:#b45309; font-weight:900; font-size:15px;">${d.totalNet.toFixed(2)}</td><td style="font-weight:bold;">${d.target}</td><td style="color:white; background:${d.statusColor}; font-weight:900; letter-spacing:1px;">${d.status}</td></tr>`).join('')}
      </table></body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const generateWeeklyYaziliReport = (className) => {
    const classStudents = roster.filter(n => appData?.student_classes?.[n] === className);
    let reportData = classStudents.map(n => {
        const data = appData?.exams?.[n]?.yazili || {};
        let subs = [];
        for(let i=0; i<examSubjects.length; i++) { subs.push(data[`p_${i}`] !== undefined && data[`p_${i}`] !== '' ? data[`p_${i}`] : '-'); }
        const avg = data.avg || 0; const target = data.target || 0;
        let status = '-'; let statusColor = '#64748b'; 
        if (target > 0 && avg > 0) {
            if (avg >= target) { status = 'GEÇTİ ✅'; statusColor = '#10b981'; } 
            else { status = 'KALDI ❌'; statusColor = '#ef4444'; }
        }
        return { name: n, avg: avg, target: target || '-', subs: subs, status: status, statusColor: statusColor };
    }).sort((a,b) => b.avg - a.avg);

    let printWindow = window.open('', '', 'width=1000,height=800');
    printWindow.document.write(`
      <html><head><title>${className} - HAFTALIK YAZILI RAPORU</title>
      <style>body{font-family:sans-serif; padding:20px; background:#f8fafc;} table{width:100%; border-collapse:collapse; font-size:13px; background:white;} th,td{border:1px solid #e2e8f0; padding:10px; text-align:center;} th{background:#0f172a; color:white; font-weight:bold;} tr:nth-child(even){background:#f1f5f9;}</style>
      </head><body>
      <h2 style="text-align:center; color:#0f172a; border-bottom:3px solid #f59e0b; padding-bottom:10px;">MAVİKENT YURDU - ${className} HAFTALIK YAZILI DEĞERLENDİRME RAPORU</h2>
      <table><tr><th style="width:50px;">SIRA</th><th style="text-align:left;">ÖĞRENCİ ADI</th>${examSubjects.map(s => `<th>${s}</th>`).join('')}<th style="background:#b45309;">ORTALAMA</th><th style="background:#0f172a;">HEDEF</th><th>DURUM</th></tr>
      ${reportData.map((d, i) => `<tr><td><b>${i+1}</b></td><td style="text-align:left; font-weight:bold; color:#334155;">${d.name}</td>${d.subs.map(s => `<td style="color:#64748b; font-weight:bold;">${s}</td>`).join('')}<td style="color:#b45309; font-weight:900; font-size:16px;">${parseFloat(d.avg).toFixed(1)}</td><td style="font-weight:bold;">${d.target}</td><td style="color:white; background:${d.statusColor}; font-weight:900; letter-spacing:1px;">${d.status}</td></tr>`).join('')}
      </table></body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const generateEduReport = (className) => {
    const classStudents = roster.filter(n => appData?.student_classes?.[n] === className);
    let printWindow = window.open('', '', 'width=900,height=800');
    printWindow.document.write(`
      <html><head><title>${className} - GÜNLÜK EĞİTİM RAPORU</title>
      <style>body{font-family:sans-serif; padding:20px;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ccc; padding:10px; text-align:center;} th{background:#0f172a; color:white;}</style>
      </head><body>
      <h2 style="text-align:center;">MAVİKENT YURDU - ${className} GÜNLÜK EĞİTİM KOÇLUĞU RAPORU</h2>
      <table><tr><th style="text-align:left;">ÖĞRENCİ ADI</th><th>YAPILAN ÖDEVLER</th><th>KİTAP (SAYFA)</th><th>ÇÖZÜLEN SORU</th></tr>
      ${classStudents.map(n => {
         const d = appData?.education_d?.[n] || {};
         const lessons = (d.lessons || []).length > 0 ? (d.lessons || []).join(', ') : '-';
         return `<tr><td style="text-align:left; font-weight:bold;">${n}</td><td style="color:#10b981; font-weight:bold;">${lessons}</td><td>${d.pages || 0}</td><td>${d.questions || 0}</td></tr>`;
      }).join('')}
      </table></body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const renderStudentGrid = (students, type) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
      {students.map(name => {
        let bgColor = 'white'; let borderColor = 'transparent'; let subText = '';
        if (currentModule === 'yoklama') {
            const st = appData?.yoklama_d?.[name]?.sessions?.[selectedSession]?.st;
            if (st === 'p' || st === 't') { bgColor = '#ecfdf5'; borderColor = '#10b981'; }
            if (st === 'a') { bgColor = '#fef2f2'; borderColor = '#ef4444'; }
            if (st === 'l') { bgColor = '#fffbeb'; borderColor = '#f59e0b'; }
        } else if (currentModule === 'values_view') {
            if (appData?.values_edu_d?.[name]?.[new Date().toDateString()]?.done) { bgColor = '#ecfdf5'; borderColor = '#10b981'; }
        } else if (currentModule === 'class_view') {
            const d = appData?.education_d?.[name];
            if(d) subText = `Ödev: ${(d.lessons||[]).length} | Kitap: ${d.pages||0} | Soru: ${d.questions||0}`;
        } else if (currentModule === 'deneme_view') {
            const net = appData?.exams?.[name]?.deneme?.net;
            subText = net ? `Net: ${parseFloat(net).toFixed(2)}` : 'Girilmedi';
        } else if (currentModule === 'yazili_view') {
            const avg = appData?.exams?.[name]?.yazili?.avg;
            subText = avg ? `Ort: ${parseFloat(avg).toFixed(1)}` : 'Girilmedi';
        }
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
                   const isDone = appData?.values_edu_d?.[name]?.[bugun]?.done;
                   if(!isDone) {
                     if(window.confirm(`${name} dersini verdi olarak işaretlensin mi? (RP/M)`)) {
                       db.ref(`mavikent_premium/values_edu_d/${name}/${bugun}/done`).set(true);
                       db.ref(`mavikent_premium/wallet/${name}`).transaction(c => (c||0) + (isEliteStud?4:2));
                       db.ref(`mavikent_premium/season_score/${name}`).transaction(c => (c||0) + (isEliteStud?4:2));
                     }
                   } else { if(window.confirm("İşaret kaldırılsın mı?")) db.ref(`mavikent_premium/values_edu_d/${name}/${bugun}/done`).set(null); }
                }
             }} 
               style={{ background: bgColor, border: `2px solid ${isEliteStud ? '#fde047' : borderColor}`, padding: '20px', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
            {isEliteStud && <div style={{ fontSize: '16px', marginBottom: '5px' }}>👑</div>}
            {name}
            {subText && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>{subText}</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 25px', borderRadius: '20px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '6px solid #64748b' }}>
        <button onClick={handleBack} style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, color: '#475569', cursor: 'pointer' }}>
          ⬅ {currentModule || dashboardView !== 'main' ? 'GERİ' : 'ÇIKIŞ'}
        </button>
        <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', textAlign: 'right' }}>PERSONEL PANELİ<br/><span style={{ fontSize: '10px', color: '#64748b' }}>{currentModule ? `${currentModule.toUpperCase()} ${selectedSession}` : dashboardView.toUpperCase()}</span></div>
      </div>

      {!currentModule && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {dashboardView === 'main' && [
            { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' },
            { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
            { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' }
          ].map(mod => (
            <div key={mod.id} onClick={() => setDashboardView(mod.id)} style={{ background: 'white', borderRadius: '24px', padding: '30px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 30px -5px rgba(15,23,42,0.08)', border: '1px solid white' }}>
              <div style={{ fontSize: '42px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '13px', fontWeight: 900, color: '#475569' }}>{mod.label}</div>
            </div>
          ))}

          {dashboardView === 'egitim' && [
            { id: 'egitim_ders', icon: '📝', label: 'ÖDEV/KİTAP/SORU TAKİBİ' },
            { id: 'egitim_deneme', icon: '📊', label: 'DENEME SINAVLARI' },
            { id: 'egitim_yazili', icon: '💯', label: 'YAZILI HAZIRLIK' }
          ].map(mod => (
            <div key={mod.id} onClick={() => setDashboardView(mod.id)} style={{ background: 'white', borderRadius: '24px', padding: '30px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '12px', fontWeight: 800 }}>{mod.label}</div>
            </div>
          ))}

          {dashboardView === 'egitim_ders' && classList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('class_view'); setSelectedSession(cls); }} style={{ background: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 900, fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>📝 {cls} Ödev Takibi</div>))}
          {dashboardView === 'egitim_deneme' && classList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('deneme_view'); setSelectedSession(cls); }} style={{ background: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 900, fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>📊 {cls} Deneme Girişi</div>))}
          {dashboardView === 'egitim_yazili' && classList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('yazili_view'); setSelectedSession(cls); }} style={{ background: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 900, fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>💯 {cls} Yazılı Girişi</div>))}
          {dashboardView === 'degerler' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('values_view'); setSelectedSession(lvl); }} style={{ background: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 900, fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>🕌 {lvl} Konu & Takip</div>))}
          
          {dashboardView === 'isleyis' && [
            { id: 'yoklama', icon: '📋', label: 'Yoklama' }, { id: 'telefon', icon: '📱', label: 'Telefon' },
            { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' }, { id: 'kanaat', icon: '✍️', label: 'Kanaat Notu' }
          ].map(mod => (
            <div key={mod.id} onClick={() => setCurrentModule(mod.id)} style={{ background: 'white', borderRadius: '24px', padding: '30px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{mod.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* --- STANDART MODÜLLER --- */}
      {currentModule === 'yoklama' && !selectedSession && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => (
            <div key={s} onClick={() => setSelectedSession(s)} style={{ background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', fontWeight: 800, cursor: 'pointer' }}>{s}</div>
          ))}
        </div>
      )}
      {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'kanaat'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
      
      {currentModule === 'class_view' && (
        <>
           {renderStudentGrid(roster.filter(n => appData?.student_classes?.[n] === selectedSession), 'egitim_ders')}
           <button onClick={() => generateEduReport(selectedSession)} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 10px rgba(15,23,42,0.3)' }}>📄 VELİ BİLGİLENDİRME ÇIKTISI AL (ÖDEV/KİTAP/SORU)</button>
        </>
      )}
      {currentModule === 'deneme_view' && (
        <>
           {renderStudentGrid(roster.filter(n => appData?.student_classes?.[n] === selectedSession), 'egitim_deneme')}
           <button onClick={() => generateDenemeReport(selectedSession)} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>📊 DETAYLI VELİ ÇIKTISI (D/Y/NET VE HEDEF)</button>
        </>
      )}
      {currentModule === 'yazili_view' && (
        <>
           {renderStudentGrid(roster.filter(n => appData?.student_classes?.[n] === selectedSession), 'egitim_yazili')}
           <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => generateParentReport('yazili', selectedSession)} style={{ flex: 1, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>📄 GÜNLÜK VELİ ÇIKTISI</button>
              <button onClick={() => generateWeeklyYaziliReport(selectedSession)} style={{ flex: 1, padding: '15px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 10px rgba(245,158,11,0.3)' }}>📊 HAFTALIK VELİ ÇIKTISI (DURUM)</button>
           </div>
        </>
      )}

      {currentModule === 'values_view' && (
        <>
          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
             <h4 style={{ marginTop: 0, color: '#0f172a' }}>📖 GÜNLÜK DERS KONUSU (DAHİLİ DERS)</h4>
             <select value={valuesTopic.subject} onChange={e => setValuesTopic({...valuesTopic, subject: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                <option value="">Ders Seçin</option>{valuesSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <input value={valuesTopic.topic} onChange={e => setValuesTopic({...valuesTopic, topic: e.target.value})} placeholder="İşlenen konu, sayfa numarası vb." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
             <button onClick={() => { db.ref(`mavikent_premium/values_log/${selectedSession}/${new Date().toDateString()}`).set(valuesTopic); alert("Konu Kaydedildi"); }} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900 }}>DERSİ YAYINLA</button>
          </div>
          {renderStudentGrid(roster.filter(n => appData?.student_levels?.[n] === selectedSession), 'degerler')}
        </>
      )}

      {/* --- AÇILIR PENCERELER (MODALS) --- */}
      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'zoomIn 0.3s ease' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900 }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '11px', background: '#fde047', color: '#b45309', padding: '5px', borderRadius: '8px', fontWeight: 900, marginBottom: '15px' }}>👑 ELİT LİG BONUSU AKTİF</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', 3)} style={{ padding: '15px', background: '#d4af37', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, 3, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', 2)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, 2, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', 1)} style={{ padding: '15px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, 1, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>❌ GELMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <>
                  <button onClick={() => saveData('telefon', 'p', 2)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>📱 TESLİM (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'e', 2)} style={{ padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>📵 TELEFONU YOK (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'a', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🚫 VERMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'yatak' && (
                <>
                  <button onClick={() => saveData('yatak', 'yatak', 1)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🛏️ YATAK DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'yatak', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🕸️ YATAK BOZUK (Seri Bozar)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 1)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🚪 DOLAP DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🏚️ DOLAP BOZUK (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'kanaat' && (
                <>
                  <input id="kanaatInput" type="number" placeholder="Puan Girin (Örn: 10 veya -5)" style={{ padding: '15px', fontSize: '18px', textAlign: 'center', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} />
                  <button onClick={() => saveData('kanaat', 'k', parseInt(document.getElementById('kanaatInput').value) || 0)} style={{ padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>KAYDET</button>
                </>
              )}
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} style={{ padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 900, marginTop: '10px', cursor: 'pointer' }}>İPTAL</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && modalType === 'egitim' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', animation: 'zoomIn 0.3s ease' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900 }}>{selectedStudent} <br/><span style={{ fontSize: '12px', color: '#d4af37' }}>{selectedSession} EĞİTİM KOÇLUĞU</span></h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '11px', background: '#fde047', color: '#b45309', padding: '5px', borderRadius: '8px', fontWeight: 900, marginBottom: '15px', display: 'inline-block' }}>👑 ELİT LİG BONUSU AKTİF</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'left', marginTop: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '15px', textAlign: 'center' }}>📝 ÖDEV TAKİBİ</div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {(mebLessons[selectedSession] || []).map(lesson => {
                    const isChecked = eduData.lessons.includes(lesson);
                    return (
                      <div key={lesson} onClick={() => setEduData(prev => ({...prev, lessons: isChecked ? prev.lessons.filter(l => l !== lesson) : [...prev.lessons, lesson]}))} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: isChecked ? '#ecfdf5' : 'white', border: `1px solid ${isChecked ? '#10b981' : '#e2e8f0'}`, borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: isChecked ? '#047857' : '#475569' }}>
                        <span>{lesson}</span><span>{isChecked ? '✓' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '10px' }}>📖 KİTAP SAYACI (10 Sayfa = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, pages: Math.max(0, prev.pages - 10)}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', border: 'none', fontSize: '20px', fontWeight: 900, cursor: 'pointer' }}>-</button>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', width: '50px' }}>{eduData.pages}</div>
                    <button onClick={() => setEduData(prev => ({...prev, pages: prev.pages + 10}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0f172a', color: 'white', border: 'none', fontSize: '20px', fontWeight: 900, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '10px' }}>🧠 SORU SAYACI (10 Soru = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, questions: Math.max(0, prev.questions - 10)}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', border: 'none', fontSize: '20px', fontWeight: 900, cursor: 'pointer' }}>-</button>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', width: '50px' }}>{eduData.questions}</div>
                    <button onClick={() => setEduData(prev => ({...prev, questions: prev.questions + 10}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0f172a', color: 'white', border: 'none', fontSize: '20px', fontWeight: 900, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>İPTAL</button>
              <button onClick={saveEducationData} style={{ flex: 2, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>VERİLERİ KAYDET</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (modalType === 'deneme' || modalType === 'yazili') && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', animation: 'zoomIn 0.3s ease' }}>
             <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900 }}>{selectedStudent} <br/><span style={{ fontSize: '12px', color: '#d4af37' }}>{modalType === 'deneme' ? 'DENEME' : 'YAZILI'} NOT GİRİŞİ</span></h3>
             
             {examSubjects.map((sub, idx) => (
                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                     <span style={{ fontWeight: 800, fontSize: '12px' }}>{sub}</span>
                     {modalType === 'deneme' ? (
                         <div style={{ display: 'flex', gap: '5px' }}>
                             <input type="number" placeholder="D" value={examData[`d_${idx}`] || ''} onChange={e => setExamData({...examData, [`d_${idx}`]: e.target.value})} style={{ width: '50px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                             <input type="number" placeholder="Y" value={examData[`y_${idx}`] || ''} onChange={e => setExamData({...examData, [`y_${idx}`]: e.target.value})} style={{ width: '50px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                         </div>
                     ) : (
                         <input type="number" placeholder="Not" value={examData[`p_${idx}`] || ''} onChange={e => setExamData({...examData, [`p_${idx}`]: e.target.value})} style={{ width: '80px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                     )}
                 </div>
             ))}

             <div style={{ marginTop: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '12px' }}>HEDEF {modalType === 'deneme' ? 'NET' : 'ORTALAMA'}:</div>
             <input type="number" value={examData.target || ''} onChange={e => setExamData({...examData, target: e.target.value})} placeholder="Örn: 85 veya 450" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '5px', marginBottom: '20px' }} />

             <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>İPTAL</button>
              <button onClick={() => saveExamData(modalType)} style={{ flex: 2, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>KAYDET</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffScreen;