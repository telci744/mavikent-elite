import React, { useState } from 'react';
import { db } from '../firebase';

const AdminScreen = ({ appData, goBackToRoles }) => {
  const [dashboardView, setDashboardView] = useState('main'); 
  const [currentModule, setCurrentModule] = useState(null); 
  const [selectedSession, setSelectedSession] = useState(''); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null); 

  const [eduData, setEduData] = useState({ lessons: [], pages: 0, questions: 0 });
  const [examData, setExamData] = useState({}); 
  const [valuesTopic, setValuesTopic] = useState({ subject: '', topic: '' });
  const [deliveryTab, setDeliveryTab] = useState('wait'); 

  const [settingsInputs, setSettingsInputs] = useState({
    news_ticker: appData?.settings?.news_ticker || '',
    ann1: appData?.settings?.ann1 || '',
    ann2: appData?.settings?.ann2 || '',
    admin_pin: appData?.settings?.admin_pin || '1507',
    staff_pin: appData?.settings?.staff_pin || '1234'
  });
  
  const [questInputs, setQuestInputs] = useState({
    q1_text: appData?.quests?.q1?.text || '', q1_amt: appData?.quests?.q1?.amt || '', q1_type: appData?.quests?.q1?.type || 'M',
    q2_text: appData?.quests?.q2?.text || '', q2_amt: appData?.quests?.q2?.amt || '', q2_type: appData?.quests?.q2?.type || 'M',
    q3_text: appData?.quests?.q3?.text || '', q3_amt: appData?.quests?.q3?.amt || '', q3_type: appData?.quests?.q3?.type || 'M'
  });

  const [newStudentName, setNewStudentName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', icon: '📦', type: 'normal' });
  const [editProductKey, setEditProductKey] = useState(null); 

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
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); setModalType(null); setSelectedStudent(null); } 
    else {
      if (dashboardView === 'main') goBackToRoles();
      else if (dashboardView.startsWith('egitim_')) setDashboardView('egitim');
      else setDashboardView('main');
    }
  };

  const getCalculatedPoints = (name, basePts, type) => {
    if (basePts === 0) return 0;
    const currentXp = Number(appData?.xp?.[name]) || 0;
    const lvl = Math.floor(Math.sqrt(currentXp / 50)) + 1; 
    let bns = lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0;
    if (type === 'yatak') bns = Math.min(bns, 1);
    const eliteMulti = isElite(name) && basePts > 0 && type !== 'kanaat' ? 2 : 0;
    const activeMultiplier = appData?.active_cards?.[name]?.multiplier;
    const is2XActive = activeMultiplier && activeMultiplier.date === new Date().toDateString();
    let total = basePts > 0 ? basePts + bns + eliteMulti : basePts;
    if (is2XActive && total > 0 && type !== 'kanaat') total *= 2;
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
        const finalM = getCalculatedPoints(selectedStudent, earnedPoints, 'egitim');
        updates[`wallet/${selectedStudent}`] = (appData?.wallet?.[selectedStudent] || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (appData?.season_score?.[selectedStudent] || 0) + (earnedPoints + (isElite(selectedStudent) ? 2 : 0));
        updates[`xp/${selectedStudent}`] = (appData?.xp?.[selectedStudent] || 0) + (earnedPoints * 10);
    }
    db.ref('mavikent_premium').update(updates);
    setSelectedStudent(null); setModalType(null); alert("Eğitim Verileri Güncellendi!");
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
    setSelectedStudent(null); setModalType(null); alert(`${type.toUpperCase()} Kaydedildi!`);
  };

  const completeQuest = (qId) => {
    const q = appData?.quests?.[qId];
    if(!q || !q.participants || q.participants.length === 0) return alert("Bu göreve katılan kimse yok.");
    if(window.confirm(`${q.participants.length} öğrenciye ödülleri ve 'Başarım' puanları dağıtılacak. Onaylıyor musun?`)) {
      q.participants.forEach(p => {
        db.ref(`mavikent_premium/stats/${p}/completed_quests`).transaction(c => (c||0) + 1); 
        if(q.type === 'M') {
           db.ref(`mavikent_premium/wallet/${p}`).transaction(c => (c||0) + parseInt(q.amt));
           db.ref(`mavikent_premium/xp/${p}`).transaction(c => (c||0) + (parseInt(q.amt) * 10));
        } else {
           db.ref(`mavikent_premium/season_score/${p}`).transaction(c => (c||0) + parseInt(q.amt));
        }
      });
      db.ref(`mavikent_premium/quests/${qId}/participants`).set(null); alert("Görev tamamlandı! Ödüller dağıtıldı.");
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return alert("İsim ve fiyat zorunludur!");
    if (editProductKey) {
        db.ref(`mavikent_premium/market_products/${editProductKey}`).update({ n: newProduct.name, p: parseInt(newProduct.price), i: newProduct.icon, type: newProduct.type });
        setEditProductKey(null);
    } else {
        db.ref('mavikent_premium/market_products').push({ n: newProduct.name, p: parseInt(newProduct.price), i: newProduct.icon, type: newProduct.type });
    }
    setNewProduct({ name: '', price: '', icon: '📦', type: 'normal' }); 
  };

  const editProduct = (key, prod) => {
      setNewProduct({ name: prod.n, price: prod.p, icon: prod.i, type: prod.type || 'normal' });
      setEditProductKey(key); window.scrollTo(0,0);
  };

  const distributeExamRewards = (type) => {
    const reward = parseInt(prompt(`${type.toUpperCase()} hedefini geçenlere kaç Puan/M verilsin?`, "50"));
    if (!reward || isNaN(reward)) return;
    let count = 0;
    roster.forEach(n => {
       const d = appData?.exams?.[n]?.[type] || {};
       const score = type === 'deneme' ? d.net : d.avg;
       if (score !== undefined && d.target && parseFloat(score) >= parseFloat(d.target)) {
           db.ref(`mavikent_premium/wallet/${n}`).transaction(c => (c||0) + reward);
           db.ref(`mavikent_premium/season_score/${n}`).transaction(c => (c||0) + reward);
           count++;
       }
    });
    alert(`${count} öğrenciye +${reward} Puan dağıtıldı!`);
  };

  const handleWeeklyReset = () => {
    if(window.confirm("DİKKAT: Yoklama, Telefon, Yatak verileri sıfırlanacak. (Cüzdan, XP ve RP KALIR). Onaylıyor musun?")) {
      db.ref('mavikent_premium').update({ yoklama_w: null, telefon_w: null, yatak_w: null, kanaat_w: null, yoklama_d: null, telefon_d: null, yatak_d: null });
      alert("Haftalık veriler sıfırlandı!");
    }
  };

  const handleSeasonEnd = () => {
    if(!window.confirm("1. SEZON bitirilecek! Fatih ve Elmas kademelere çerçeve/unvan ödülleri dağıtılıp herkesin RP'si sıfırlanacak. Emin misin?")) return;
    const updates = {};
    let count = 0;
    roster.forEach(n => {
        const rp = Number(appData?.season_score?.[n]) || 0;
        let mCoin = 0; let frame = null; let title = null;
        const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; 

        if (rp >= 1000) { mCoin = 200; frame = 'S1 Fatih'; title = '👑 S1 Fatih'; }
        else if (rp >= 750) { mCoin = 150; frame = 'S1 Elmas'; title = '💎 S1 Elmas'; }
        else if (rp >= 500) { mCoin = 100; frame = 'S1 Altın'; }
        else if (rp >= 250) { mCoin = 50; }
        else { mCoin = 20; } 

        if (mCoin > 0) updates[`wallet/${n}`] = (Number(appData?.wallet?.[n]) || 0) + mCoin;
        if (frame) updates[`active_cards/${n}/frame`] = { val: frame, exp };
        if (title) updates[`active_cards/${n}/title`] = { val: title, exp };
        
        updates[`season_score/${n}`] = 0; 
        count++;
    });
    db.ref('mavikent_premium').update(updates);
    alert(`Sezon başarıyla bitirildi! ${count} öğrenciye rütbe ödülleri kasalarına gönderildi.`);
  };

  const handleGlobalXpReset = () => {
      const confirmText = prompt("DİKKAT: Bu işlem GERİ ALINAMAZ! Tüm öğrencilerin XP (Seviye) puanlarını SIFIRLAYACAKTIR. Onaylıyorsan 'SIFIRLA' yaz.");
      if (confirmText === 'SIFIRLA') {
          const updates = {};
          roster.forEach(n => { updates[`xp/${n}`] = 0; });
          db.ref('mavikent_premium').update(updates);
          alert("TÜM XP'LER SIFIRLANDI! Herkes yeni zorlaştırılmış eğriye göre Seviye 1'den başlıyor.");
      }
  };

  // --- ÇIKTI VE RAPOR FONKSİYONLARI ---
  const generateParentReport = (type, className) => {
    const classStudents = roster.filter(n => appData?.student_classes?.[n] === className);
    let reportData = classStudents.map(n => {
        const data = appData?.exams?.[n]?.[type] || {};
        let score = type === 'deneme' ? (data.net || 0) : (data.avg || 0);
        return { name: n, score: score, target: data.target || '-' };
    }).sort((a,b) => b.score - a.score);

    let printWindow = window.open('', '', 'width=800,height=800');
    printWindow.document.write(`
      <html><head><title>${className} - ${type.toUpperCase()} RAPORU</title>
      <style>body{font-family:sans-serif; padding:20px;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ccc; padding:10px; text-align:center;} th{background:#0f172a; color:white;}</style>
      </head><body>
      <h2 style="text-align:center;">MAVİKENT YURDU - ${className} ${type.toUpperCase()} SONUÇLARI</h2>
      <table><tr><th>SIRA</th><th style="text-align:left;">ÖĞRENCİ ADI</th><th>${type === 'deneme' ? 'TOPLAM NET' : 'ORTALAMA'}</th><th>HEDEF</th></tr>
      ${reportData.map((d, i) => `<tr><td>${i+1}</td><td style="text-align:left; font-weight:bold;">${d.name}</td><td style="color:#b45309; font-weight:bold;">${parseFloat(d.score).toFixed(2)}</td><td>${d.target}</td></tr>`).join('')}
      </table></body></html>
    `);
    printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
  };

  const generateDenemeReport = (className) => {
    const classStudents = roster.filter(n => appData?.student_classes?.[n] === className);
    let reportData = classStudents.map(n => {
        const data = appData?.exams?.[n]?.deneme || {};
        let subs = []; let totalNet = 0;
        for(let i=0; i<examSubjects.length; i++) {
            const d = parseFloat(data[`d_${i}`]) || 0; const y = parseFloat(data[`y_${i}`]) || 0; const net = d - (y/3);
            totalNet += net;
            subs.push(`<div style="font-size:10px; color:#64748b;">${d}D ${y}Y</div><div style="font-weight:bold; color:#0f172a;">${net.toFixed(1)} N</div>`);
        }
        const target = data.target || 0; let status = '-'; let statusColor = '#64748b'; 
        if (target > 0 && totalNet > 0) {
            if (totalNet >= target) { status = 'GEÇTİ ✅'; statusColor = '#10b981'; } else { status = 'KALDI ❌'; statusColor = '#ef4444'; }
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
    printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
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
            if (avg >= target) { status = 'GEÇTİ ✅'; statusColor = '#10b981'; } else { status = 'KALDI ❌'; statusColor = '#ef4444'; }
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
    printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
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
    printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
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
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 25px', borderRadius: '20px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '6px solid #f59e0b' }}>
        <button onClick={handleBack} style={{ background: '#fef3c7', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, color: '#92400e', cursor: 'pointer' }}>⬅ {currentModule || dashboardView !== 'main' ? 'GERİ' : 'ÇIKIŞ'}</button>
        <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>YÖNETİCİ PANELİ</div>
      </div>

      {!currentModule && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {dashboardView === 'main' && [
            { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' },
            { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
            { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' },
            { id: 'yonetim', icon: '👑', label: 'SİSTEM YÖNETİMİ', color: '#fffbeb', border: '#fde047' }
          ].map(mod => (
            <div key={mod.id} onClick={() => setDashboardView(mod.id)} style={{ background: mod.color || 'white', borderRadius: '24px', padding: '30px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${mod.border || 'white'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '42px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '13px', fontWeight: 900 }}>{mod.label}</div>
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

          {dashboardView === 'yonetim' && [
            { id: 'admin_students', icon: '👥', label: 'ÖĞRENCİ & Puanlar' },
            { id: 'admin_quests', icon: '🎯', label: 'GÖREV YÖNETİMİ' },
            { id: 'admin_market', icon: '🛒', label: 'MARKET ÜRÜNLERİ' },
            { id: 'admin_teslimat', icon: '📦', label: 'TESLİMAT KUTUSU' },
            { id: 'admin_lig', icon: '🏆', label: 'ELİT LİG AYARLARI' },
            { id: 'admin_settings', icon: '⚙️', label: 'GENEL AYARLAR' }
          ].map(mod => (
            <div key={mod.id} onClick={() => setCurrentModule(mod.id)} style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: '24px', padding: '30px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '12px', fontWeight: 800, color: '#92400e' }}>{mod.label}</div>
            </div>
          ))}
        </div>
      )}

      {currentModule === 'yoklama' && !selectedSession && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => (<div key={s} onClick={() => setSelectedSession(s)} style={{ background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', fontWeight: 800, cursor: 'pointer' }}>{s}</div>))}
        </div>
      )}
      {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'kanaat'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
      
      {currentModule === 'class_view' && (
        <>
           {renderStudentGrid(roster.filter(n => appData?.student_classes?.[n] === selectedSession), 'egitim_ders')}
           <button onClick={() => generateEduReport(selectedSession)} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>📄 VELİ BİLGİLENDİRME ÇIKTISI AL (ÖDEV/KİTAP/SORU)</button>
        </>
      )}
      {currentModule === 'deneme_view' && (
        <>
           {renderStudentGrid(roster.filter(n => appData?.student_classes?.[n] === selectedSession), 'egitim_deneme')}
           <button onClick={() => generateDenemeReport(selectedSession)} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>📊 DETAYLI VELİ ÇIKTISI (D/Y/NET VE HEDEF)</button>
        </>
      )}
      {currentModule === 'yazili_view' && (
        <>
           {renderStudentGrid(roster.filter(n => appData?.student_classes?.[n] === selectedSession), 'egitim_yazili')}
           <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => generateParentReport('yazili', selectedSession)} style={{ flex: 1, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>📄 GÜNLÜK VELİ ÇIKTISI</button>
              <button onClick={() => generateWeeklyYaziliReport(selectedSession)} style={{ flex: 1, padding: '15px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>📊 HAFTALIK VELİ ÇIKTISI (DURUM)</button>
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
             <input value={valuesTopic.topic} onChange={e => setValuesTopic({...valuesTopic, topic: e.target.value})} placeholder="İşlenen konu vb." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
             <button onClick={() => { db.ref(`mavikent_premium/values_log/${selectedSession}/${new Date().toDateString()}`).set(valuesTopic); alert("Konu Kaydedildi"); }} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900 }}>DERSİ YAYINLA</button>
          </div>
          {renderStudentGrid(roster.filter(n => appData?.student_levels?.[n] === selectedSession), 'degerler')}
        </>
      )}

      {/* --- YÖNETİCİ ÖZEL MODÜLLERİ --- */}
      {currentModule === 'admin_students' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Yeni Öğrenci Adı Soyadı" style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} />
            <button onClick={() => { if(newStudentName) db.ref('mavikent_premium/roster').set([...roster, newStudentName.trim()]); setNewStudentName(''); }} style={{ background: '#0071e3', color: 'white', padding: '0 20px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor:'pointer' }}>EKLE</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roster.map(name => {
              const creds = appData?.student_credentials?.[name] || { username: '', password: '' };
              const usernameVal = typeof creds === 'string' ? '' : (creds.username || '');
              const passwordVal = typeof creds === 'string' ? creds : (creds.password || '');
              
              return (
              <div key={name} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f5f5f7', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', width: '100%', marginBottom: '10px', color:'#1d1d1f' }}>
                   {isElite(name)?'👑 ':''}{name} 
                   <span style={{ color: '#0071e3', marginLeft: '10px' }}>🪙 {appData?.wallet?.[name] || 0} M</span>
                   <span style={{ color: '#f59e0b', marginLeft: '10px' }}>⭐ {appData?.xp?.[name] || 0} XP</span>
                   <span style={{ color: '#10b981', marginLeft: '10px' }}>⚔️ {appData?.season_score?.[name] || 0} RP</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', width: '100%' }}>
                  <input type="text" placeholder="Kullanıcı Adı" value={usernameVal} onChange={e => db.ref(`mavikent_premium/student_credentials/${name}/username`).set(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '12px', width: '90px', outline:'none' }} />
                  <input type="text" placeholder="Şifre" value={passwordVal} onChange={e => db.ref(`mavikent_premium/student_credentials/${name}/password`).set(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '12px', width: '70px', outline:'none' }} />
                  
                  <select onChange={e => db.ref(`mavikent_premium/student_classes/${name}`).set(e.target.value)} value={appData?.student_classes?.[name] || ''} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '12px' }}>
                    <option value="">Sınıf</option>{classList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  <button onClick={() => { const val = prompt(`${name} için yeni CÜZDAN (M) bakiyesi:`, appData?.wallet?.[name] || 0); if(val) db.ref(`mavikent_premium/wallet/${name}`).set(parseInt(val)); }} style={{ background: '#0071e3', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor:'pointer' }}>M-COIN</button>
                  <button onClick={() => { const val = prompt(`${name} için yeni XP (Seviye) puanı:`, appData?.xp?.[name] || 0); if(val) db.ref(`mavikent_premium/xp/${name}`).set(parseInt(val)); }} style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor:'pointer' }}>XP</button>
                  <button onClick={() => { const val = prompt(`${name} için yeni RP (Rank) puanı:`, appData?.season_score?.[name] || 0); if(val) db.ref(`mavikent_premium/season_score/${name}`).set(parseInt(val)); }} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor:'pointer' }}>RP</button>
                  
                  <button onClick={() => { if(window.confirm('Silinsin mi?')) db.ref('mavikent_premium/roster').set(roster.filter(n => n !== name)); }} style={{ background: '#ff3b30', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor:'pointer' }}>SİL</button>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {currentModule === 'admin_market' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
           <h4 style={{ marginTop: 0, color:'#0f172a' }}>{editProductKey ? '✏️ ÜRÜNÜ GÜNCELLE' : '📦 YENİ ÜRÜN EKLE'}</h4>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', background:'#f8fafc', padding:'15px', borderRadius:'15px' }}>
             <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ürün Adı (Örn: Cips)" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', outline:'none' }} />
             <input value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" placeholder="Fiyat (Örn: 25)" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', outline:'none' }} />
             <input value={newProduct.icon} onChange={e => setNewProduct({...newProduct, icon: e.target.value})} placeholder="Emoji (📦)" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', textAlign: 'center', outline:'none' }} />
             <select value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', outline:'none' }}>
               <option value="normal">🍔 Normal Ürün / Kutu</option><option value="avatar">👤 Avatar (Emoji)</option><option value="multiplier">⚡ 2X Puan Kartı</option><option value="title">🎖️ Ünvan (VIP/Reis)</option><option value="frame">🖼️ Çerçeve</option>
             </select>
             <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                <button onClick={handleAddProduct} style={{ flex: 1, background: editProductKey ? '#f59e0b' : '#34c759', color: 'white', padding: '15px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor:'pointer' }}>{editProductKey ? 'DEĞİŞİKLİKLERİ KAYDET' : 'MARKETE EKLE'}</button>
                {editProductKey && <button onClick={() => { setEditProductKey(null); setNewProduct({ name: '', price: '', icon: '📦', type: 'normal' }); }} style={{ padding: '15px', background: '#e2e8f0', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>İPTAL</button>}
             </div>
           </div>
           
           <h4 style={{ borderTop: '1px solid #f5f5f7', paddingTop: '20px' }}>MEVCUT ÜRÜNLER (Düzenle / Sil)</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {Object.keys(appData?.market_products || {}).map(key => {
               const p = appData.market_products[key];
               return (
                 <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f5f5f7', borderRadius: '12px', border: editProductKey === key ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}>
                   <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.i} {p.n} <span style={{ color: '#86868b' }}>({p.p} M)</span></div>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <button onClick={() => editProduct(key, p)} style={{ background: '#0071e3', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight:800 }}>✏️</button>
                     <button onClick={() => { if(window.confirm('Silinsin mi?')) db.ref(`mavikent_premium/market_products/${key}`).remove() }} style={{ background: '#ff3b30', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight:800 }}>🗑️</button>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {currentModule === 'admin_teslimat' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
             <button onClick={() => setDeliveryTab('wait')} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 600, background: deliveryTab === 'wait' ? '#1d1d1f' : '#f5f5f7', color: deliveryTab === 'wait' ? 'white' : '#86868b', cursor:'pointer' }}>BEKLEYENLER</button>
             <button onClick={() => setDeliveryTab('done')} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 600, background: deliveryTab === 'done' ? '#34c759' : '#f5f5f7', color: deliveryTab === 'done' ? 'white' : '#86868b', cursor:'pointer' }}>ONAYLANMIŞ (Öğrenci Açabilir)</button>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].st === deliveryTab).map(k => {
               const item = appData.deliveries[k];
               return (
                 <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f5f5f7', borderRadius: '12px', borderLeft: deliveryTab === 'wait' ? '4px solid #ff9f0a' : '4px solid #34c759' }}>
                   <div><div style={{ fontWeight: 600, color: '#1d1d1f' }}>{item.s}</div><div style={{ fontSize: '12px', color: '#86868b' }}>📦 {item.i}</div></div>
                   <button onClick={() => db.ref(`mavikent_premium/deliveries/${k}/st`).set(deliveryTab === 'wait' ? 'done' : 'wait')} style={{ background: deliveryTab === 'wait' ? '#34c759' : '#86868b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{deliveryTab === 'wait' ? 'TESLİM EDİLDİ YAP' : 'GERİ AL'}</button>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {currentModule === 'admin_quests' && (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[1, 2, 3].map(num => {
               const qId = `q${num}`;
               const parts = appData?.quests?.[qId]?.participants || [];
               return (
                 <div key={qId} style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                   <div style={{ fontWeight: 800, color: '#1d1d1f', marginBottom: '10px' }}>GÖREV {num}</div>
                   <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                     <input value={questInputs[`${qId}_text`]} onChange={e => setQuestInputs({...questInputs, [`${qId}_text`]: e.target.value})} placeholder="Örn: 50 Soru Çöz" style={{ flex: 2, padding: '10px', borderRadius: '10px', border: '1px solid #d2d2d7' }} />
                     <input value={questInputs[`${qId}_amt`]} onChange={e => setQuestInputs({...questInputs, [`${qId}_amt`]: e.target.value})} type="number" placeholder="Ödül" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d2d2d7' }} />
                     <select value={questInputs[`${qId}_type`]} onChange={e => setQuestInputs({...questInputs, [`${qId}_type`]: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d2d2d7' }}>
                        <option value="M">M-Coin</option><option value="RP">Rank Puanı</option>
                     </select>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <button onClick={() => { db.ref(`mavikent_premium/quests/${qId}`).update({ text: questInputs[`${qId}_text`], amt: questInputs[`${qId}_amt`], type: questInputs[`${qId}_type`] }); alert("Görev Yayınlandı!"); }} style={{ background: '#0071e3', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>GÖREVİ YAYINLA</button>
                     <button onClick={() => completeQuest(qId)} style={{ background: '#34c759', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>✅ BİTİR ({parts.length} Kişi)</button>
                   </div>
                 </div>
               )
            })}
         </div>
      )}

      {currentModule === 'admin_lig' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde047', padding: '20px', borderRadius: '20px' }}>
             <h4 style={{ color: '#b45309', marginTop: 0 }}>👑 ELİT LİG (Terfi Alanlar)</h4>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
               {roster.filter(isElite).map(n => <div key={n} onClick={() => db.ref(`mavikent_premium/student_tiers/${n}`).set('standard')} style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color:'#92400e' }}>{n} 👑</div>)}
             </div>
          </div>
          <div style={{ background: '#f5f5f7', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '20px' }}>
             <h4 style={{ color: '#1d1d1f', marginTop: 0 }}>🎯 STANDART LİG (Adaylar)</h4>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
               {roster.filter(n => !isElite(n)).map(n => <div key={n} onClick={() => db.ref(`mavikent_premium/student_tiers/${n}`).set('elite')} style={{ background: 'white', border: '1px solid #d2d2d7', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color:'#1d1d1f' }}>{n} ⬆️</div>)}
             </div>
          </div>
        </div>
      )}

      {currentModule === 'admin_settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
           <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
             <h4 style={{ marginTop: 0, color: '#0f172a' }}>📢 DUYURU MERKEZİ</h4>
             <input value={settingsInputs.news_ticker} onChange={e => setSettingsInputs({...settingsInputs, news_ticker: e.target.value})} placeholder="Kayan Şerit..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px', outline:'none' }} />
             <input value={settingsInputs.ann1} onChange={e => setSettingsInputs({...settingsInputs, ann1: e.target.value})} placeholder="Mavi Kutu" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px', outline:'none' }} />
             <input value={settingsInputs.ann2} onChange={e => setSettingsInputs({...settingsInputs, ann2: e.target.value})} placeholder="Turuncu Kutu" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px', outline:'none' }} />
             <button onClick={() => { db.ref('mavikent_premium/settings/news_ticker').set(settingsInputs.news_ticker); db.ref('mavikent_premium/settings/ann1').set(settingsInputs.ann1); db.ref('mavikent_premium/settings/ann2').set(settingsInputs.ann2); alert('Kaydedildi'); }} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 800 }}>KAYDET</button>
           </div>

           <div style={{ background: '#f5f5f7', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
             <h4 style={{ marginTop: 0 }}>🔄 SİSTEM VE ÖDÜL KONTROLLERİ</h4>
             <button onClick={() => distributeExamRewards('deneme')} style={{ width: '100%', padding: '12px', background: '#0071e3', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, marginBottom: '10px', cursor:'pointer' }}>🏆 DENEME HEDEFİNİ GEÇENLERE ÖDÜL DAĞIT</button>
             <button onClick={() => distributeExamRewards('yazili')} style={{ width: '100%', padding: '12px', background: '#34c759', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, marginBottom: '20px', cursor:'pointer' }}>🏆 YAZILI HEDEFİNİ GEÇENLERE ÖDÜL DAĞIT</button>
             <button onClick={handleWeeklyReset} style={{ width: '100%', padding: '12px', background: '#ff9f0a', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, marginBottom: '10px', cursor:'pointer' }}>⚠️ HAFTALIK PERFORMANSI SIFIRLA</button>
             <button onClick={handleSeasonEnd} style={{ width: '100%', padding: '12px', background: '#8b5cf6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, marginBottom: '10px', cursor:'pointer' }}>🛑 1. SEZONU BİTİR (RP Ödüllerini Dağıt)</button>
             <button onClick={handleGlobalXpReset} style={{ width: '100%', padding: '15px', background: 'transparent', color: '#ff3b30', border: '2px dashed #ff3b30', borderRadius: '10px', fontWeight: 900, cursor:'pointer' }}>TÜM ÖĞRENCİ XP'LERİNİ SIFIRLA</button>
           </div>

           <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '20px', border: '1px solid #fef3c7' }}>
             <h4 style={{ marginTop: 0, color: '#92400e' }}>👑 YÖNETİM ŞİFRELERİ</h4>
             <input value={settingsInputs.admin_pin} onChange={e => setSettingsInputs({...settingsInputs, admin_pin: e.target.value})} placeholder="Yönetici Şifresi" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #f59e0b', marginBottom: '10px', outline:'none' }} />
             <button onClick={() => db.ref('mavikent_premium/settings/admin_pin').set(settingsInputs.admin_pin)} style={{ width: '100%', padding: '12px', background: '#f59e0b', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, marginBottom: '20px', cursor:'pointer' }}>KAYDET</button>
             <input value={settingsInputs.staff_pin} onChange={e => setSettingsInputs({...settingsInputs, staff_pin: e.target.value})} placeholder="Personel Şifresi" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #64748b', marginBottom: '10px', outline:'none' }} />
             <button onClick={() => db.ref('mavikent_premium/settings/staff_pin').set(settingsInputs.staff_pin)} style={{ width: '100%', padding: '12px', background: '#64748b', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, cursor:'pointer' }}>KAYDET</button>
           </div>

           <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '20px', border: '1px solid #fca5a5' }}>
              <h4 style={{ marginTop: 0, color: '#991b1b' }}>⛔ GÜVENLİK (BAN) MERKEZİ</h4>
              {Object.keys(appData?.banned_devices || {}).map(devId => (
                  <div key={devId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '10px', marginBottom: '5px' }}>
                     <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '12px' }}>{devId}</div>
                     <button onClick={() => db.ref(`mavikent_premium/banned_devices/${devId}`).remove()} style={{ background: '#34c759', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>KALDIR</button>
                  </div>
              ))}
              {Object.keys(appData?.banned_devices || {}).length === 0 && <div style={{ fontSize: '12px', color: '#86868b' }}>Engellenen cihaz yok.</div>}
              <button onClick={() => { if(window.confirm('Tüm logları sil?')) db.ref('mavikent_premium/security_logs').remove() }} style={{ background: 'transparent', color: '#ff3b30', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', marginTop: '15px', width:'100%', textAlign:'center' }}>GİRİŞ LOGLARINI TEMİZLE</button>
           </div>
        </div>
      )}

      {/* --- İŞLEM MODALLARI BURADA --- */}
      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'zoomIn 0.3s ease' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900 }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '11px', background: '#fde047', color: '#b45309', padding: '5px', borderRadius: '8px', fontWeight: 900, marginBottom: '15px' }}>👑 ELİT LİG BONUSU AKTİF</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', 3)} style={{ padding: '15px', background: '#d4af37', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, 3, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', 2)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, 2, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', 1)} style={{ padding: '15px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, 1, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>❌ GELMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <>
                  <button onClick={() => saveData('telefon', 'p', 2)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>📱 TESLİM (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'e', 2)} style={{ padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>📵 TELEFONU YOK (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'a', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>🚫 VERMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'yatak' && (
                <>
                  <button onClick={() => saveData('yatak', 'yatak', 1)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>🛏️ YATAK DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'yatak', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>🕸️ YATAK BOZUK (Seri Bozar)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 1)} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>🚪 DOLAP DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 0)} style={{ padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>🏚️ DOLAP BOZUK (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'kanaat' && (
                <>
                  <input id="kanaatInput" type="number" placeholder="Puan Girin (Örn: 10 veya -5)" style={{ padding: '15px', fontSize: '18px', textAlign: 'center', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} />
                  <button onClick={() => saveData('kanaat', 'k', parseInt(document.getElementById('kanaatInput').value) || 0)} style={{ padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>KAYDET</button>
                </>
              )}
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} style={{ padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 900, marginTop: '10px', cursor:'pointer' }}>İPTAL</button>
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
                    <button onClick={() => setEduData(prev => ({...prev, pages: Math.max(0, prev.pages - 10)}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', border: 'none', fontSize: '20px', fontWeight: 900, cursor:'pointer' }}>-</button>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', width: '50px' }}>{eduData.pages}</div>
                    <button onClick={() => setEduData(prev => ({...prev, pages: prev.pages + 10}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0f172a', color: 'white', border: 'none', fontSize: '20px', fontWeight: 900, cursor:'pointer' }}>+</button>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '10px' }}>🧠 SORU SAYACI (10 Soru = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, questions: Math.max(0, prev.questions - 10)}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', border: 'none', fontSize: '20px', fontWeight: 900, cursor:'pointer' }}>-</button>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', width: '50px' }}>{eduData.questions}</div>
                    <button onClick={() => setEduData(prev => ({...prev, questions: prev.questions + 10}))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0f172a', color: 'white', border: 'none', fontSize: '20px', fontWeight: 900, cursor:'pointer' }}>+</button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>İPTAL</button>
              <button onClick={saveEducationData} style={{ flex: 2, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>VERİLERİ KAYDET</button>
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
                             <input type="number" placeholder="D" value={examData[`d_${idx}`] || ''} onChange={e => setExamData({...examData, [`d_${idx}`]: e.target.value})} style={{ width: '50px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0', outline:'none' }} />
                             <input type="number" placeholder="Y" value={examData[`y_${idx}`] || ''} onChange={e => setExamData({...examData, [`y_${idx}`]: e.target.value})} style={{ width: '50px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0', outline:'none' }} />
                         </div>
                     ) : (
                         <input type="number" placeholder="Not" value={examData[`p_${idx}`] || ''} onChange={e => setExamData({...examData, [`p_${idx}`]: e.target.value})} style={{ width: '80px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0', outline:'none' }} />
                     )}
                 </div>
             ))}

             <div style={{ marginTop: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '12px' }}>HEDEF {modalType === 'deneme' ? 'NET' : 'ORTALAMA'}:</div>
             <input type="number" value={examData.target || ''} onChange={e => setExamData({...examData, target: e.target.value})} placeholder="Örn: 85 veya 450" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '5px', marginBottom: '20px', outline:'none' }} />

             <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} style={{ flex: 1, padding: '15px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>İPTAL</button>
              <button onClick={() => saveExamData(modalType)} style={{ flex: 2, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor:'pointer' }}>KAYDET</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminScreen;