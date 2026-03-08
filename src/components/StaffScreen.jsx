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
        // XP HATASI BURADA DÜZELTİLDİ: Math.abs kaldırıldı, eksi not XP'yi düşürür ama sıfırın altına inmez.
        updates[`xp/${selectedStudent}`] = Math.max(0, (Number(appData?.xp?.[selectedStudent]) || 0) + (basePts * 10)); 
        
        // BANKA GEÇMİŞİNE KAYIT EKLENDİ
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        let descText = type === 'kanaat' ? 'Yönetici Kanaat Notu' : (type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : 'Yatak/Dolap Düzeni'));
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
        
        // BANKA GEÇMİŞİNE KAYIT
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

  const loadHtml2Canvas = async () => {
      if (window.html2canvas) return window.html2canvas;
      return new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; script.onload = () => resolve(window.html2canvas); document.head.appendChild(script); });
  };

  const downloadPanoAsJPG = async (type) => {
      const btnId = `btn-pano-${type}`; const originalText = document.getElementById(btnId).innerText; document.getElementById(btnId).innerText = "⏳ Lüks Pano Hazırlanıyor...";
      const html2canvas = await loadHtml2Canvas(); const container = document.createElement('div');
      container.style.cssText = "position:absolute;left:-9999px;top:0;width:1200px;background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:60px;font-family:'Plus Jakarta Sans',sans-serif;color:white;border-radius:40px;";
      const renderTop3 = (title, data, unit, icon) => {
          let html = `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);padding:35px;border-radius:30px;width:31%;box-shadow:0 20px 40px rgba(0,0,0,0.3);"><div style="font-size:60px;text-align:center;margin-bottom:20px;filter:drop-shadow(0 10px 10px rgba(0,0,0,0.5));">${icon}</div><h3 style="text-align:center;color:#d4af37;font-size:22px;font-weight:900;margin:0 0 30px 0;letter-spacing:1px;text-transform:uppercase;">${title}</h3>`;
          const topData = data.slice(0, 3);
          if(topData.length === 0 || topData[0].val === 0) { html += `<div style="text-align:center;color:#64748b;font-weight:700;font-size:18px;">Henüz Veri Yok</div>`; } 
          else {
              topData.forEach((item, idx) => {
                  const colors = ['#f59e0b', '#cbd5e1', '#b45309']; const bgColors = ['rgba(245,158,11,0.1)', 'rgba(203,213,225,0.1)', 'rgba(180,83,9,0.1)'];
                  if(item.val > 0) { html += `<div style="display:flex;justify-content:space-between;align-items:center;background:${bgColors[idx]};padding:20px;border-radius:20px;margin-bottom:15px;border-left:4px solid ${colors[idx]};"><div style="display:flex;align-items:center;gap:15px;"><span style="font-size:24px;font-weight:900;color:${colors[idx]}">#${idx+1}</span><span style="font-size:18px;font-weight:800;color:white;">${String(item.n).split(' ')[0]}</span></div><div style="font-size:24px;font-weight:900;color:white;">${item.val} <span style="font-size:12px;color:#94a3b8;">${unit}</span></div></div>`; }
              });
          }
          html += `</div>`; return html;
      };
      let titleStr = ''; let contentHTML = '<div style="display:flex;justify-content:space-between;margin-top:50px;">';
      if (type === 'egitim') {
          titleStr = 'HAFTANIN EĞİTİM LİDERLERİ';
          contentHTML += renderTop3('Soru Şampiyonu', roster.map(n => ({ n, val: Number(appData?.education_d?.[n]?.questions||0) })).sort((a,b)=>b.val-a.val), 'Soru', '🧠');
          contentHTML += renderTop3('Kitap Kurdu', roster.map(n => ({ n, val: Number(appData?.education_d?.[n]?.pages||0) })).sort((a,b)=>b.val-a.val), 'Sayfa', '📖');
          contentHTML += renderTop3('Deneme Fatihi', roster.map(n => ({ n, val: Number(appData?.exams?.[n]?.deneme?.net||0) })).sort((a,b)=>b.val-a.val), 'Net', '🎯');
      } else if (type === 'isleyis') {
          titleStr = 'YURT İŞLEYİŞ VE LİDERLİK PANOSU';
          contentHTML += renderTop3('RP Kralları', roster.map(n => ({ n, val: Number(appData?.season_score?.[n]||0) })).sort((a,b)=>b.val-a.val), 'RP', '👑');
          contentHTML += renderTop3('M-Coin Zenginleri', roster.map(n => ({ n, val: Number(appData?.wallet?.[n]||0) })).sort((a,b)=>b.val-a.val), 'M', '💳');
          contentHTML += renderTop3('XP Liderleri', roster.map(n => ({ n, val: Number(appData?.xp?.[n]||0) })).sort((a,b)=>b.val-a.val), 'XP', '⭐');
      } else if (type === 'degerler') {
          titleStr = 'DEĞERLER EĞİTİMİ YILDIZLARI';
          contentHTML += renderTop3('Katılım Liderleri', roster.map(n => { const counts = Object.values(appData?.values_edu_d?.[n] || {}).filter(v => v.done).length; return { n, val: counts }; }).sort((a,b)=>b.val-a.val), 'Ders', '🕌');
          contentHTML += renderTop3('Takke Muhafızları', roster.map(n => { const sess = appData?.yoklama_d?.[n]?.sessions || {}; let tCount = Object.values(sess).filter(s => s.st === 't').length; return { n, val: tCount }; }).sort((a,b)=>b.val-a.val), 'Kez', '👳‍♂️');
          contentHTML += renderTop3('Kanaat Liderleri', roster.map(n => ({ n, val: Number(appData?.kanaat_w?.[n]||0) })).sort((a,b)=>b.val-a.val), 'Puan', '✍️');
      }
      contentHTML += '</div>';
      container.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid rgba(255,255,255,0.1);padding-bottom:40px;"><div><h1 style="margin:0;font-size:60px;font-weight:900;letter-spacing:-2px;color:white;">MAVİKENT <span style="color:#d4af37;">ELITE</span></h1><h2 style="margin:10px 0 0 0;font-size:26px;color:#cbd5e1;font-weight:700;letter-spacing:1px;">${titleStr}</h2></div><div style="text-align:right;"><div style="font-size:20px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:2px;">Tarih</div><div style="font-size:32px;font-weight:900;color:#d4af37;">${new Date().toLocaleDateString('tr-TR')}</div></div></div>${contentHTML}`;
      document.body.appendChild(container);
      try { const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#0f172a', useCORS: true }); const link = document.createElement('a'); link.download = `Mavikent_${type}_Panosu.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click(); } 
      catch(e) {} finally { document.body.removeChild(container); document.getElementById(btnId).innerText = originalText; }
  };

  const downloadReportAsJPG = async (type, className) => {
      const btnId = `btn-jpg-${type}`; const originalText = document.getElementById(btnId).innerText; document.getElementById(btnId).innerText = "⏳ Hazırlanıyor...";
      const html2canvas = await loadHtml2Canvas(); const container = document.createElement('div');
      container.style.cssText = "position:absolute;left:-9999px;top:0;width:1200px;background:#ffffff;padding:40px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;";
      const studentsToMap = type === 'degerler' ? roster.filter(n => appData?.student_levels?.[n] === className) : getFilteredRoster(className);
      let title = ''; let tableHTML = `<table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 20px;">`;
      if (type === 'deneme') {
          title = 'DENEME SINAVI SONUÇLARI';
          let dataArr = studentsToMap.map(n => {
              const data = appData?.exams?.[n]?.deneme || {}; let totalNet = 0; let subsHTML = '';
              examSubjects.forEach((s, i) => { const d = parseFloat(data[`d_${i}`])||0; const y = parseFloat(data[`y_${i}`])||0; const net = d-(y/3); totalNet += net; subsHTML += `<td style="padding:15px;border-bottom:1px solid #e2e8f0;"><div style="font-size:12px;color:#64748b;">${d}D ${y}Y</div><div style="font-weight:900;font-size:16px;">${net.toFixed(1)} N</div></td>`; });
              const target = parseFloat(data.target)||0; let statusHTML = '-';
              if (target>0 && totalNet>0) { statusHTML = totalNet >= target ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">BAŞARILI ✓</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">GELİŞTİRİLMELİ ✕</span>`; }
              return { n, totalNet, target, subsHTML, statusHTML };
          }).sort((a,b) => b.totalNet - a.totalNet);
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th>`;
          examSubjects.forEach(s => tableHTML += `<th style="padding:15px;">${s}</th>`);
          tableHTML += `<th style="padding:15px;background:#3b82f6;">Toplam Net</th><th style="padding:15px;background:#d4af37;color:#0f172a;">Hedef</th><th style="padding:15px;border-radius:0 12px 0 0;">Durum</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.n}</td>${d.subsHTML}<td style="padding:15px;font-weight:900;font-size:20px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.totalNet.toFixed(2)}</td><td style="padding:15px;font-weight:800;font-size:18px;color:#d4af37;border-bottom:1px solid #e2e8f0;">${d.target}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      } else if (type === 'yazili') {
          title = 'HAFTALIK YAZILI DEĞERLENDİRME';
          let dataArr = studentsToMap.map(n => {
              const data = appData?.exams?.[n]?.yazili || {}; let total = 0; let count = 0; let subsHTML = '';
              examSubjects.forEach((s, i) => { const val = data[`p_${i}`]; if (val!==undefined&&val!=='') { total+=parseFloat(val); count++; } subsHTML += `<td style="padding:15px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:16px;">${val||'-'}</td>`; });
              const avg = count>0 ? (total/count) : 0; const target = parseFloat(data.target)||0; let statusHTML = '-';
              if (target>0 && avg>0) { statusHTML = avg >= target ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">BAŞARILI ✓</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">GELİŞTİRİLMELİ ✕</span>`; }
              return { n, avg, target, subsHTML, statusHTML };
          }).sort((a,b) => b.avg - a.avg);
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th>`;
          examSubjects.forEach(s => tableHTML += `<th style="padding:15px;">${s}</th>`);
          tableHTML += `<th style="padding:15px;background:#3b82f6;">Ortalama</th><th style="padding:15px;background:#d4af37;color:#0f172a;">Hedef</th><th style="padding:15px;border-radius:0 12px 0 0;">Durum</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.n}</td>${d.subsHTML}<td style="padding:15px;font-weight:900;font-size:20px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.avg.toFixed(1)}</td><td style="padding:15px;font-weight:800;font-size:18px;color:#d4af37;border-bottom:1px solid #e2e8f0;">${d.target}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      } else if (type === 'egitim') {
          title = 'GÜNLÜK EĞİTİM VE ÖDEV TAKİBİ';
          let dataArr = studentsToMap.map(n => { const d = appData?.education_d?.[n] || {}; return { n, lessons: (d.lessons||[]).join(', ')||'-', pages: d.pages||0, questions: d.questions||0 }; }).sort((a,b) => b.questions - a.questions);
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th><th style="padding:15px;">Ödevler</th><th style="padding:15px;">Kitap (S)</th><th style="padding:15px;border-radius:0 12px 0 0;background:#3b82f6;">Soru</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.n}</td><td style="padding:15px;font-weight:700;color:#10b981;border-bottom:1px solid #e2e8f0;">${d.lessons}</td><td style="padding:15px;font-weight:800;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.pages}</td><td style="padding:15px;font-weight:900;font-size:20px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.questions}</td></tr>`; });
      } else if (type === 'degerler') {
          const todayStr = new Date().toDateString();
          const log = appData?.values_log?.[className]?.[todayStr] || { subject: 'Belirtilmedi', topic: '-' };
          title = `DEĞERLER EĞİTİMİ (${log.subject} - ${log.topic})`;
          let dataArr = studentsToMap.map(n => {
              const isDone = appData?.values_edu_d?.[n]?.[todayStr]?.done;
              return { n, statusHTML: isDone ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">KATILDI ✓</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">KATILMADI ✕</span>` };
          });
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th><th style="padding:15px;border-radius:0 12px 0 0;">Günlük Katılım</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${d.n}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      }
      tableHTML += `</table>`;
      container.innerHTML = `<div style="background:linear-gradient(135deg, #0f172a, #1e293b);padding:30px;border-radius:24px;display:flex;justify-content:space-between;align-items:center;color:white;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div><h1 style="margin:0;font-size:42px;font-weight:900;letter-spacing:-1px;">MAVİKENT <span style="color:#d4af37;">ELITE</span></h1><h2 style="margin:5px 0 0 0;font-size:20px;color:#cbd5e1;font-weight:700;">${className} - ${title}</h2></div><div style="text-align:right;"><div style="font-size:16px;font-weight:600;color:#cbd5e1;">Tarih</div><div style="font-size:22px;font-weight:800;color:#d4af37;">${new Date().toLocaleDateString('tr-TR')}</div></div></div>${tableHTML}`;
      document.body.appendChild(container);
      try { const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true }); const link = document.createElement('a'); link.download = `Mavikent_${className}_${type}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click(); } 
      catch(e) {} finally { document.body.removeChild(container); document.getElementById(btnId).innerText = originalText; }
  };

  const renderStudentGrid = (students, type) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
      {students.map(name => {
        let bgColor = '#ffffff'; let subText = '';
        if (currentModule === 'yoklama') { const st = appData?.yoklama_d?.[name]?.sessions?.[selectedSession]?.st; if (st === 'p' || st === 't') bgColor = '#ecfdf5'; if (st === 'a') bgColor = '#fef2f2'; if (st === 'l') bgColor = '#fffbeb'; } 
        else if (currentModule === 'values_view') { if (appData?.values_edu_d?.[name]?.[new Date().toDateString()]?.done) bgColor = '#ecfdf5'; } 
        else if (currentModule === 'class_view') { const d = appData?.education_d?.[name]; if(d) subText = `Ödev: ${(d.lessons||[]).length} | Kitap: ${d.pages||0} | Soru: ${d.questions||0}`; } 
        else if (currentModule === 'deneme_view') { const net = appData?.exams?.[name]?.deneme?.net; subText = net ? `Net: ${parseFloat(net).toFixed(2)}` : 'Girilmedi'; } 
        else if (currentModule === 'yazili_view') { const avg = appData?.exams?.[name]?.yazili?.avg; subText = avg ? `Ort: ${parseFloat(avg).toFixed(1)}` : 'Girilmedi'; }
        
        const isEliteStud = isElite(name);
        const has2X = (appData?.active_cards?.[name]?.multiplier?.date === new Date().toDateString()) || (appData?.settings?.global_event === '2x_xp');
        const hasStreak = appData?.active_cards?.[name]?.streak?.date === new Date().toDateString();

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
               className="card-hover" style={{ background: bgColor, border: isEliteStud ? '2px solid #d4af37' : 'none', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {isEliteStud && <span style={{ fontSize: '18px' }} title="Elit Lig">👑</span>}
                {has2X && <span style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>⚡ 2X AKTİF</span>}
                {hasStreak && <span style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>🛡️ KORUMA</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>{name}</div>
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
        .clean-scroll::-webkit-scrollbar { width: 6px; } .clean-scroll::-webkit-scrollbar-track { background: transparent; } .clean-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .clean-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .premium-btn { border-radius: 50px !important; border: none !important; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.08); outline: none !important; display: inline-flex; align-items: center; justify-content: center;}
        .premium-btn:hover { filter: brightness(0.95); transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.12); } .premium-btn:active { transform: scale(0.96); }
        .btn-iptal { background: #f1f5f9 !important; color: #64748b !important; padding: 16px 24px; border-radius: 50px !important; font-weight: 800; border: none !important; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-iptal:hover { background: #e2e8f0 !important; color: #0f172a !important; transform: translateY(-2px); } .btn-iptal:active { transform: scale(0.96); }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none !important; } .card-hover:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 35px -5px rgba(0,0,0,0.1) !important; } .card-hover:active { transform: scale(0.98); }
        .view-transition { animation: fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); } @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .elite-input { outline: none !important; border: 2px solid #e2e8f0 !important; transition: all 0.2s; padding: 14px 20px; border-radius: 20px; width: 100%; font-weight: 700; color: #0f172a; background: #f8fafc; }
        .elite-input:focus { border-color: #3b82f6 !important; background: #ffffff; box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important; }
      `}</style>

      <div className="view-transition" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '50px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <button onClick={handleBack} className="premium-btn" style={{ background: '#f1f5f9', color: '#0f172a', padding: '12px 20px', fontWeight: 800 }}><span style={{fontSize:'18px', marginRight:'8px'}}>←</span> {currentModule || dashboardView !== 'main' ? 'Geri Dön' : 'Çıkış Yap'}</button>
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.5px' }}>PERSONEL PANELİ</div>
      </div>

      <div className="view-transition" key={dashboardView + (currentModule || '')}>
        {!currentModule && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {dashboardView === 'main' && [
              { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' }, { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
              { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="card-hover" style={{ background: 'white', textAlign: 'center', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>{mod.icon}</div><div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>{mod.label}</div>
              </div>
            ))}
            
            {dashboardView === 'egitim' && [ { id: 'egitim_ders', icon: '📝', label: 'ÖDEV / KİTAP TAKİBİ' }, { id: 'egitim_deneme', icon: '📊', label: 'DENEME SINAVLARI' }, { id: 'egitim_yazili', icon: '💯', label: 'YAZILI HAZIRLIK' } ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="card-hover" style={{ background: 'white', textAlign: 'center', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}><div style={{ fontSize: '42px', marginBottom: '16px' }}>{mod.icon}</div><div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{mod.label}</div></div>
            ))}
            {dashboardView === 'egitim_ders' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('class_view'); setSelectedSession(cls); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a' }}>📝 <br/><br/> {cls}</div>))}
            {dashboardView === 'egitim_deneme' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('deneme_view'); setSelectedSession(cls); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a' }}>📊 <br/><br/> {cls}</div>))}
            {dashboardView === 'egitim_yazili' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('yazili_view'); setSelectedSession(cls); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a' }}>💯 <br/><br/> {cls}</div>))}
            {dashboardView === 'degerler' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('values_view'); setSelectedSession(lvl); }} className="card-hover" style={{ background: 'white', textAlign: 'center', fontWeight: 900, fontSize: '18px', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a' }}>🕌 <br/><br/> {lvl}</div>))}
            {dashboardView === 'isleyis' && [ { id: 'yoklama', icon: '📋', label: 'Yoklama' }, { id: 'telefon', icon: '📱', label: 'Telefon' }, { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' }, { id: 'kanaat', icon: '✍️', label: 'Kanaat Notu' } ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="card-hover" style={{ background: 'white', textAlign: 'center', borderRadius: '24px', padding: '35px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}><div style={{ fontSize: '42px', marginBottom: '16px' }}>{mod.icon}</div><div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>{mod.label}</div></div>
            ))}
          </div>
        )}

        {/* --- LÜKS PANO İNDİRME BUTONLARI --- */}
        {!currentModule && dashboardView === 'egitim' && (
          <div style={{ marginTop: '20px' }}>
            <button id="btn-pano-egitim" onClick={() => downloadPanoAsJPG('egitim')} className="premium-btn" style={{ width: '100%', background: '#0f172a', color: '#d4af37', padding: '24px', fontSize: '16px', letterSpacing: '1px', border: '2px solid #d4af37 !important' }}>📸 EĞİTİM İSTATİSTİKLERİ VE ENLERİ PANOSU (JPG)</button>
          </div>
        )}
        {!currentModule && dashboardView === 'isleyis' && (
          <div style={{ marginTop: '20px' }}>
            <button id="btn-pano-isleyis" onClick={() => downloadPanoAsJPG('isleyis')} className="premium-btn" style={{ width: '100%', background: '#0f172a', color: '#d4af37', padding: '24px', fontSize: '16px', letterSpacing: '1px', border: '2px solid #d4af37 !important' }}>📸 LİDERLİK VE İŞLEYİŞ ENLERİ PANOSU (JPG)</button>
          </div>
        )}
        {!currentModule && dashboardView === 'degerler' && (
          <div style={{ marginTop: '20px' }}>
            <button id="btn-pano-degerler" onClick={() => downloadPanoAsJPG('degerler')} className="premium-btn" style={{ width: '100%', background: '#0f172a', color: '#d4af37', padding: '24px', fontSize: '16px', letterSpacing: '1px', border: '2px solid #d4af37 !important' }}>📸 DEĞERLER EĞİTİMİ ENLERİ PANOSU (JPG)</button>
          </div>
        )}

        {currentModule === 'yoklama' && !selectedSession && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => (
               <div key={s} onClick={() => setSelectedSession(s)} className="card-hover" style={{ background: 'white', padding: '24px', textAlign: 'center', fontWeight: 900, fontSize: '16px', borderRadius: '20px', color: '#0f172a', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>{s}</div>
            ))}
          </div>
        )}

        {currentModule === 'yoklama' && selectedSession && (
           <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '15px' }}>
              {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => (
                 <button key={s} onClick={() => setSelectedSession(s)} className="premium-btn" style={{ padding: '14px 24px', background: selectedSession === s ? '#0f172a' : 'white', color: selectedSession === s ? '#d4af37' : '#64748b', fontWeight: 800 }}>{s}</button>
              ))}
           </div>
        )}

        {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'kanaat'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
        
        {currentModule === 'class_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_ders')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button id="btn-jpg-egitim" onClick={() => downloadReportAsJPG('egitim', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0f172a', color: 'white', fontSize: '16px' }}>📸 SINIF ÖDEV/KİTAP RAPORU (JPG İNDİR)</button>
             </div>
          </>
        )}
        {currentModule === 'deneme_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_deneme')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button id="btn-jpg-deneme" onClick={() => downloadReportAsJPG('deneme', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#3b82f6', color: 'white', fontSize: '16px' }}>📸 SINIF DENEME RAPORU (JPG İNDİR)</button>
             </div>
          </>
        )}
        {currentModule === 'yazili_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_yazili')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button id="btn-jpg-yazili" onClick={() => downloadReportAsJPG('yazili', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#10b981', color: 'white', fontSize: '16px' }}>📸 SINIF YAZILI RAPORU (JPG İNDİR)</button>
             </div>
          </>
        )}
        {currentModule === 'values_view' && (
          <>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
               <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px' }}>📖 GÜNLÜK DERS KONUSU</h4>
               <select value={valuesTopic.subject} onChange={e => setValuesTopic({...valuesTopic, subject: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}>
                  <option value="">Ders Seçin</option>{valuesSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <input value={valuesTopic.topic} onChange={e => setValuesTopic({...valuesTopic, topic: e.target.value})} placeholder="İşlenen konu vb." className="elite-input" style={{ marginBottom: '16px' }} />
               <button onClick={() => { db.ref(`mavikent_premium/values_log/${selectedSession}/${new Date().toDateString()}`).set(valuesTopic); alert("Konu Kaydedildi"); }} className="premium-btn" style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white', fontSize: '15px' }}>DERSİ YAYINLA</button>
            </div>
            {renderStudentGrid(roster.filter(n => appData?.student_levels?.[n] === selectedSession), 'degerler')}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button id="btn-jpg-degerler" onClick={() => downloadReportAsJPG('degerler', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#d4af37', color: 'white', fontSize: '16px' }}>📸 HAFTALIK VELİ BİLGİLENDİRME (JPG İNDİR)</button>
             </div>
          </>
        )}
      </div>

      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '13px', background: '#fde047', color: '#b45309', padding: '6px 14px', borderRadius: '12px', fontWeight: 900, marginBottom: '24px', display: 'inline-block' }}>👑 ELİT LİG BONUSU</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: isElite(selectedStudent) ? '0' : '24px' }}>
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', 3)} className="premium-btn" style={{ background: '#d4af37', color: 'white', padding: '20px' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, 3, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, 2, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', 1)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '20px' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, 1, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>❌ GELMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <>
                  <button onClick={() => saveData('telefon', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>📱 TESLİM (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'e', 2)} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '20px' }}>📵 TELEFONU YOK (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'a', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 VERMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'yatak' && (
                <>
                  <button onClick={() => saveData('yatak', 'yatak', 1)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🛏️ YATAK DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'yatak', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🕸️ YATAK BOZUK (Seri Bozar)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 1)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🚪 DOLAP DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🏚️ DOLAP BOZUK (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'kanaat' && (
                <>
                  <input id="kanaatInput" type="number" placeholder="Puan (Örn: 10 veya -5)" className="elite-input" style={{ padding: '20px', fontSize: '20px', textAlign: 'center' }} />
                  <button onClick={() => saveData('kanaat', 'k', parseInt(document.getElementById('kanaatInput').value) || 0)} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '20px' }}>KAYDET</button>
                </>
              )}
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ marginTop: '10px' }}>İPTAL</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && modalType === 'egitim' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
            <div style={{ fontSize: '14px', color: '#d4af37', fontWeight: 900, marginBottom: '30px', letterSpacing: '1px' }}>{selectedSession} EĞİTİM KOÇLUĞU</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', textAlign: 'left' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.5px' }}>📝 ÖDEV TAKİBİ</div>
                <div className="clean-scroll" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
                  {(mebLessons[selectedSession] || []).map(lesson => {
                    const isChecked = (eduData.lessons || []).includes(lesson);
                    return (
                      <div key={lesson} onClick={() => setEduData(prev => ({...prev, lessons: isChecked ? (prev.lessons || []).filter(l => l !== lesson) : [...(prev.lessons || []), lesson]}))} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: isChecked ? '#ecfdf5' : 'white', borderRadius: '20px', marginBottom: '12px', fontSize: '15px', fontWeight: 800, color: isChecked ? '#047857' : '#334155', border: `2px solid ${isChecked ? '#10b981' : '#e2e8f0'}` }}>
                        <span>{lesson}</span><span>{isChecked ? '✓' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', letterSpacing: '0.5px' }}>📖 KİTAP SAYACI (10 S. = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, pages: Math.max(0, (prev.pages || 0) - 10)}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#e2e8f0', color: '#0f172a', fontSize: '28px' }}>-</button>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', width: '80px' }}>{eduData.pages || 0}</div>
                    <button onClick={() => setEduData(prev => ({...prev, pages: (prev.pages || 0) + 10}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#0f172a', color: 'white', fontSize: '28px' }}>+</button>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', letterSpacing: '0.5px' }}>🧠 SORU SAYACI (10 S. = +1)</div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
             <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
             <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 900, marginBottom: '30px', letterSpacing: '1px' }}>{modalType === 'deneme' ? 'DENEME SINAVI' : 'YAZILI'} GİRİŞİ</div>
             
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