import React, { useState } from 'react';
import { db } from '../firebase';

export default function AdminScreen({ appData, goBackToRoles }) {
  const [currentView, setCurrentView] = useState('main'); 
  const [subView, setSubView] = useState(''); 
  const [activeModal, setActiveModal] = useState(null); 
  
  const [egitimTab, setEgitimTab] = useState(''); 
  const [selectedClass, setSelectedClass] = useState('');
  
  const [selectedLevel, setSelectedLevel] = useState(''); 
  const [vakitTab, setVakitTab] = useState('Sabah');
  const [teslimatTab, setTeslimatTab] = useState('bekleyen');

  const [newStudentName, setNewStudentName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductEmoji, setNewProductEmoji] = useState('');
  const [massCoinAmount, setMassCoinAmount] = useState(''); 
  
  const [questStudent, setQuestStudent] = useState('');
  const [questText, setQuestText] = useState('');
  const [questReward, setQuestReward] = useState('');
  const [questType, setQuestType] = useState('M');

  const [loginStudent, setLoginStudent] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');

  const [settingsInputs, setSettingsInputs] = useState({
    news_ticker: appData.settings?.news_ticker || '',
    ann1: appData.settings?.ann1 || '',
    pin: appData.settings?.pin || ''
  });

  const roster = appData.roster || [];

  const getXP = (n) => appData.xp?.[n] || 0;
  const getWalletBalance = (n) => appData.wallet?.[n] || 0;
  const getRankScore = (n) => appData.season_score?.[n] || 0;

  const getStudentLevel = (totalXP) => {
    let level = 1; let threshold = 200; let currentXP = totalXP;
    while (currentXP >= threshold) { currentXP -= threshold; level++; threshold += 50; }
    return level;
  };

  const updatePoints = (student, baseCoin, rp, statKey, statVal, rawXp = 0) => {
    const currentXP = appData.xp?.[student] || 0;
    const currentLevel = getStudentLevel(currentXP);
    let coinMultiplier = 1; let xpMultiplier = 1;

    if (currentLevel >= 16) { coinMultiplier = 2.5; xpMultiplier = 0.25; } 
    else if (currentLevel >= 8) { coinMultiplier = 2.0; xpMultiplier = 0.50; } 
    else if (currentLevel >= 4) { coinMultiplier = 1.5; xpMultiplier = 0.75; }

    const finalCoin = Math.floor(baseCoin * coinMultiplier);
    const finalXp = Math.floor(rawXp * xpMultiplier);

    if (finalCoin !== 0) {
      const currentCoin = appData.wallet?.[student] || 0;
      const currentAllTime = appData.all_time_coin?.[student] || currentCoin;
      db.ref(`mavikent_premium/wallet/${student}`).set(currentCoin + finalCoin);
      db.ref(`mavikent_premium/all_time_coin/${student}`).set(currentAllTime + finalCoin);
    }
    if (rp !== 0) {
      const currentRP = appData.season_score?.[student] || 0;
      db.ref(`mavikent_premium/season_score/${student}`).set(currentRP + rp);
    }
    if (finalXp !== 0) {
      db.ref(`mavikent_premium/xp/${student}`).set(currentXP + finalXp);
    }
    if (statKey && statVal !== 0) {
      const currentStat = appData[`${statKey}_w`]?.[student] || 0;
      db.ref(`mavikent_premium/${statKey}_w/${student}`).set(currentStat + statVal);
    }
  };

  const handleActionClick = (student, baseCoin, rp, statKey, statVal, rawXp) => {
    updatePoints(student, baseCoin, rp, statKey, statVal, rawXp);
    setActiveModal(null); 
  };

  const updateStudentAttribute = (student, attributeKey, value) => { db.ref(`mavikent_premium/${attributeKey}/${student}`).set(value); };

  const handleManualEdit = (student, dataType, currentVal, label) => {
    const newVal = prompt(`${student} öğrencisinin yeni ${label} değerini giriniz:`, currentVal);
    if (newVal !== null && newVal.trim() !== '' && !isNaN(newVal)) {
      db.ref(`mavikent_premium/${dataType}/${student}`).set(parseInt(newVal));
      if (dataType === 'wallet') db.ref(`mavikent_premium/all_time_coin/${student}`).set(parseInt(newVal));
    }
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return alert("Ad Soyad giriniz!");
    if (roster.includes(newStudentName.trim())) return alert("Bu öğrenci zaten var!");
    db.ref('mavikent_premium/roster').set([...roster, newStudentName.trim()]);
    db.ref(`mavikent_premium/student_tiers/${newStudentName.trim()}`).set('standart');
    setNewStudentName(''); alert("Öğrenci başarıyla eklendi!");
  };

  const handleRemoveStudent = (name) => {
    if (window.confirm(`${name} adlı öğrenciyi silmek istediğine emin misin?`)) { db.ref('mavikent_premium/roster').set(roster.filter(n => n !== name)); }
  };

  const resetWeeklyPerformance = () => {
    if (window.confirm("Haftalık tüm puanlar sıfırlanacak! Emin misin?")) {
      db.ref('mavikent_premium/yoklama_w').set({}); db.ref('mavikent_premium/yatak_w').set({});
      db.ref('mavikent_premium/telefon_w').set({}); db.ref('mavikent_premium/kanaat_w').set({});
      alert("Sıfırlandı!");
    }
  };

  const deliverItem = (key) => db.ref(`mavikent_premium/deliveries/${key}`).update({ st: 'done' });
  const undoDeliverItem = (key) => window.confirm("Geri alınsın mı?") && db.ref(`mavikent_premium/deliveries/${key}`).update({ st: 'wait' });

  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice) return alert("Ürün adı ve fiyatı zorunludur!");
    db.ref(`mavikent_premium/market_products/prod_${Date.now()}`).set({ n: newProductName, p: parseInt(newProductPrice), i: newProductEmoji || '📦', type: 'physical' });
    setNewProductName(''); setNewProductPrice(''); setNewProductEmoji(''); alert("Ürün eklendi!");
  };

  const handleDeleteProduct = (key) => window.confirm("Ürün silinsin mi?") && db.ref(`mavikent_premium/market_products/${key}`).remove();
  const saveSettings = (key, val) => { db.ref(`mavikent_premium/settings/${key}`).set(val); alert("Başarıyla Güncellendi!"); };

  const handleMassCoinDistribution = () => {
    const val = parseInt(massCoinAmount);
    if (isNaN(val) || val <= 0) return alert("Geçerli bir miktar giriniz!");
    if (window.confirm(`Tüm öğrencilere ${val} M-Coin dağıtılacak. Emin misin?`)) {
      roster.forEach(student => {
        const currentCoin = appData.wallet?.[student] || 0;
        const currentAllTime = appData.all_time_coin?.[student] || currentCoin;
        db.ref(`mavikent_premium/wallet/${student}`).set(currentCoin + val);
        db.ref(`mavikent_premium/all_time_coin/${student}`).set(currentAllTime + val);
      });
      setMassCoinAmount(''); alert("Dağıtım başarılı!");
    }
  };

  const assignQuest = () => {
    if(!questStudent || !questText || !questReward) return alert("Boş alanları doldurun!");
    db.ref(`mavikent_premium/personal_quests/${questStudent}/q_${Date.now()}`).set({ text: questText, amt: parseInt(questReward), type: questType, status: 'wait' });
    alert(`🎯 Görev Atandı!`); setQuestText(''); setQuestReward('');
  };

  const approveQuest = (studentName, qId, amount, type) => {
    if (window.confirm(`${studentName} görevini onaylamak istiyor musun?`)) {
        if (type === 'M') {
            const currentCoin = appData.wallet?.[studentName] || 0;
            const currentAllTime = appData.all_time_coin?.[studentName] || currentCoin;
            db.ref(`mavikent_premium/wallet/${studentName}`).set(currentCoin + amount);
            db.ref(`mavikent_premium/all_time_coin/${studentName}`).set(currentAllTime + amount);
        } else if (type === 'RP') {
            const currentScore = appData.season_score?.[studentName] || 0;
            db.ref(`mavikent_premium/season_score/${studentName}`).set(currentScore + amount);
        }
        db.ref(`mavikent_premium/personal_quests/${studentName}/${qId}`).remove(); alert("✅ Görev onaylandı!");
    }
  };

  const rejectQuest = (studentName, qId) => {
    if (window.confirm("Görevi reddetmek istediğine emin misin?")) db.ref(`mavikent_premium/personal_quests/${studentName}/${qId}`).update({ status: 'wait' });
  };

  const allQuests = appData.personal_quests || {};
  let pendingList = [];
  Object.keys(allQuests).forEach(studentName => {
      Object.keys(allQuests[studentName]).forEach(qId => {
          if (allQuests[studentName][qId].status === 'pending') pendingList.push({ studentName, qId, ...allQuests[studentName][qId] });
      });
  });

  const handleLoginStudentChange = (e) => {
    const name = e.target.value; setLoginStudent(name);
    if(name) {
      setLoginUser(appData.student_usernames?.[name] || name.toLocaleLowerCase('tr-TR').replace(/\s+/g, ''));
      setLoginPin(appData.student_pins?.[name] || '');
    } else { setLoginUser(''); setLoginPin(''); }
  };

  const saveStudentLogin = () => {
    if(!loginStudent || !loginUser || !loginPin) return alert("Tüm alanları doldurun!");
    if(loginPin.length < 4) return alert("Şifre en az 4 haneli olmalıdır.");
    db.ref(`mavikent_premium/student_usernames/${loginStudent}`).set(loginUser.toLocaleLowerCase('tr-TR').replace(/\s+/g, ''));
    db.ref(`mavikent_premium/student_pins/${loginStudent}`).set(loginPin);
    alert(`✅ Kaydedildi!`); setLoginStudent(''); setLoginUser(''); setLoginPin('');
  };

  const printReport = (type, classNumber, students) => {
    let htmlContent = `
      <html>
      <head>
        <title>Veli Bilgilendirme Raporu</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; }
          h2 { text-align: center; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; text-transform: uppercase;}
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f8fafc; padding: 15px; text-align: left; border-bottom: 3px solid #cbd5e1; font-size: 14px; }
          td { padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 500; }
          .highlight { font-weight: 900; color: #3b82f6; }
          .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 50px; }
        </style>
      </head>
      <body>
    `;

    if (type === 'odev') {
      htmlContent += `<h2>${classNumber}. SINIF ÖDEV & GÖREV RAPORU</h2><table><thead><tr><th>SIRA</th><th>ÖĞRENCİ</th><th>GİRİLEN DERS</th><th>KİTAP (SAYFA)</th><th>TEST (SORU)</th><th>KAZANÇ</th></tr></thead><tbody>`;
      students.forEach((n, i) => {
        const data = appData.exams?.[n]?.odev_latest || { ders: '-', sayfa: '-', soru: '-', coin: '-' };
        htmlContent += `<tr><td>${i+1}</td><td>${n}</td><td style="max-width:200px; white-space:pre-wrap;">${data.ders}</td><td>${data.sayfa}</td><td>${data.soru}</td><td class="highlight">${data.coin} M</td></tr>`;
      });
    } 
    else if (type === 'deneme') {
      const sorted = [...students].sort((a,b) => (appData.exams?.[b]?.deneme?.net || 0) - (appData.exams?.[a]?.deneme?.net || 0));
      htmlContent += `<h2>${classNumber}. SINIF DENEME SINAVI RAPORU (NET SIRALI)</h2><table><thead><tr><th>SIRA</th><th>ÖĞRENCİ</th><th>TR</th><th>MAT</th><th>FEN</th><th>SOS</th><th>İNG</th><th>DİN</th><th>TOP. NET</th><th>HEDEF</th></tr></thead><tbody>`;
      sorted.forEach((n, i) => {
        const d = appData.exams?.[n]?.deneme || { tr: '-', mat: '-', fen: '-', sos: '-', ing: '-', din: '-', net: '-', target: '-' };
        htmlContent += `<tr><td>${i+1}</td><td>${n}</td><td>${d.tr}</td><td>${d.mat}</td><td>${d.fen}</td><td>${d.sos}</td><td>${d.ing}</td><td>${d.din}</td><td class="highlight">${d.net}</td><td>${d.target}</td></tr>`;
      });
    }
    else if (type === 'yazili') {
      const sorted = [...students].sort((a,b) => (appData.exams?.[b]?.yazili_latest?.puan || 0) - (appData.exams?.[a]?.yazili_latest?.puan || 0));
      htmlContent += `<h2>${classNumber}. SINIF YAZILI SINAV RAPORU (PUAN SIRALI)</h2><table><thead><tr><th>SIRA</th><th>ÖĞRENCİ</th><th>DERS</th><th>ALINAN PUAN</th><th>HEDEF PUAN</th></tr></thead><tbody>`;
      sorted.forEach((n, i) => {
        const d = appData.exams?.[n]?.yazili_latest || { ders: '-', puan: '-', target: '-' };
        htmlContent += `<tr><td>${i+1}</td><td>${n}</td><td>${d.ders}</td><td class="highlight">${d.puan}</td><td>${d.target}</td></tr>`;
      });
    }

    htmlContent += `</tbody></table><div class="footer">MAVİKENT ELITE EĞİTİM SİSTEMİ - OTOMATİK OLUŞTURULMUŞTUR</div></body></html>`;
    const printWin = window.open('', '_blank');
    printWin.document.write(htmlContent);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 500); 
  };

  const sendVeliMesaji = (msg) => { window.prompt("Veliye Göndermek İçin Metni Kopyalayın (CTRL+C):", msg); };

  const renderMainMenu = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginTop: '20px' }}>
      <div className="elite-card elite-hover" style={{ borderTop: '6px solid #3b82f6' }} onClick={() => setCurrentView('egitim')}><div className="elite-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>🎓</div><div className="elite-card-content"><div className="elite-title">EĞİTİM</div><div className="elite-desc">Sınıflar, Denemeler, Ödevler</div></div></div>
      <div className="elite-card elite-hover" style={{ borderTop: '6px solid #8b5cf6' }} onClick={() => setCurrentView('degerler')}><div className="elite-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>🏛️</div><div className="elite-card-content"><div className="elite-title">DEĞERLER EĞİTİMİ</div><div className="elite-desc">Seviye 1/A, 1/B ve Seviye 2</div></div></div>
      <div className="elite-card elite-hover" style={{ borderTop: '6px solid #10b981' }} onClick={() => setCurrentView('isleyis')}><div className="elite-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>⚙️</div><div className="elite-card-content"><div className="elite-title">İŞLEYİŞ</div><div className="elite-desc">Yoklama, Teslimat, Öğrenci Yönetimi</div></div></div>
    </div>
  );

  const renderEgitimMenu = () => {
    if (!egitimTab) {
      return (
        <div className="fade-in">
          <button className="elite-back-btn" onClick={() => setCurrentView('main')}>❮ Ana Menü</button>
          <div className="elite-section-title">EĞİTİM MERKEZİ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="elite-card elite-hover" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onClick={() => setEgitimTab('odev')}><div className="elite-icon" style={{ background: '#eff6ff', color: '#3b82f6', marginBottom: '15px' }}>📚</div><div className="elite-title">Ders/Ödev Takibi</div></div>
            <div className="elite-card elite-hover" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onClick={() => setEgitimTab('deneme')}><div className="elite-icon" style={{ background: '#f5f3ff', color: '#8b5cf6', marginBottom: '15px' }}>📊</div><div className="elite-title">Deneme Sınavı</div></div>
            <div className="elite-card elite-hover" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onClick={() => setEgitimTab('yazili')}><div className="elite-icon" style={{ background: '#ecfdf5', color: '#10b981', marginBottom: '15px' }}>💯</div><div className="elite-title">Yazılı Hazırlık</div></div>
          </div>
        </div>
      );
    }

    if (!selectedClass) {
      return (
        <div className="fade-in">
          <button className="elite-back-btn" onClick={() => setEgitimTab('')}>❮ Görev Seçimine Dön</button>
          <div className="elite-section-title">{egitimTab === 'odev' ? 'DERS/ÖDEV TAKİBİ' : egitimTab === 'deneme' ? 'DENEME SINAVI' : 'YAZILI HAZIRLIK'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {['5', '6', '7', '8'].map(sinif => (
              <div key={sinif} className="elite-card elite-hover" style={{ padding: '30px', justifyContent: 'center' }} onClick={() => setSelectedClass(sinif)}><div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{sinif}. SINIF</div></div>
            ))}
          </div>
        </div>
      );
    }

    const classStudents = roster.filter(n => appData.student_classes?.[n] === selectedClass).sort();
    return (
      <div className="fade-in">
        <button className="elite-back-btn" onClick={() => setSelectedClass('')}>❮ Sınıflara Dön</button>
        <div className="elite-section-title">{selectedClass}. SINIF - {egitimTab === 'odev' ? 'ÖDEV TAKİBİ' : egitimTab === 'deneme' ? 'DENEME LİSTESİ' : 'YAZILI LİSTESİ'}</div>
        
        {classStudents.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 'bold' }}>Bu sınıfta öğrenci yok.</div>) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
              {classStudents.map(name => {
                let infoText = ''; let infoColor = '#64748b';
                if (egitimTab === 'deneme') { const net = appData.exams?.[name]?.deneme?.net; infoText = net !== undefined ? `Son Net: ${net}` : 'Sınav Girilmedi'; infoColor = net !== undefined ? '#3b82f6' : '#94a3b8'; } 
                else if (egitimTab === 'yazili') { const sonYazili = appData.exams?.[name]?.yazili_latest; infoText = sonYazili ? `${sonYazili.ders}: ${sonYazili.puan}` : 'Not Girilmedi'; infoColor = sonYazili ? '#10b981' : '#94a3b8'; } 
                else if (egitimTab === 'odev') { const sonOdev = appData.exams?.[name]?.odev_latest; infoText = sonOdev ? `Sayfa: ${sonOdev.sayfa} | Soru: ${sonOdev.soru}` : 'Giriş Yok'; infoColor = sonOdev ? '#8b5cf6' : '#94a3b8'; }

                return (
                  <div key={name} className="elite-card elite-hover" style={{ padding: '20px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }} onClick={() => setActiveModal({ type: egitimTab, student: name })}>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', marginBottom: '5px' }}>{name}</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: infoColor }}>{infoText}</div>
                  </div>
                );
              })}
            </div>
            <button style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '20px', borderRadius: '16px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.3)' }} onClick={() => printReport(egitimTab, selectedClass, classStudents)}>
               🖨️ VELİ BİLGİLENDİRME RAPORU ({egitimTab === 'deneme' ? 'NET SIRALI' : egitimTab === 'yazili' ? 'PUAN SIRALI' : 'ÖDEV LİSTESİ'})
            </button>
          </>
        )}
      </div>
    );
  };

  const renderDegerlerMenu = () => {
    if (selectedLevel) {
      const levelStudents = roster.filter(n => appData.student_levels?.[n] === selectedLevel);
      return (
        <div className="fade-in">
          <button className="elite-back-btn" onClick={() => setSelectedLevel('')}>❮ Seviyelere Dön</button>
          <div className="elite-section-title" style={{ color: '#8b5cf6' }}>SEVİYE {selectedLevel} ÖĞRENCİLERİ</div>
          {levelStudents.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 'bold' }}>Öğrenci atanmamış.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
              {levelStudents.sort().map(name => (
                <div key={name} className="elite-card elite-hover" style={{ padding: '15px', borderLeft: '4px solid #8b5cf6' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900 }}>{name.charAt(0)}</div>
                  <div style={{ flex: 1, marginLeft: '15px' }}><div style={{ fontWeight: 800, color: '#0f172a' }}>{name}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="fade-in">
        <button className="elite-back-btn" onClick={() => setCurrentView('main')}>❮ Ana Menü</button>
        <div className="elite-section-title">DEĞERLER EĞİTİMİ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {['1/A', '1/B', '2'].map(lvl => (
            <div key={lvl} className="elite-card elite-hover" style={{ padding: '30px', flexDirection: 'column', alignItems: 'center', borderTop: '4px solid #8b5cf6' }} onClick={() => setSelectedLevel(lvl)}>
              <div className="elite-icon" style={{ background: '#f5f3ff', color: '#8b5cf6', marginBottom: '15px' }}>🏛️</div><div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>SEVİYE {lvl}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIsleyisGrid = () => (
    <div className="fade-in">
      <button className="elite-back-btn" onClick={() => setCurrentView('main')}>❮ Ana Menü</button>
      <div className="elite-section-title">SİSTEM İŞLEYİŞİ</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #3b82f6' }} onClick={() => setSubView('yoklama')}><div className="elite-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>🕌</div><div className="elite-title">YOKLAMA</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #8b5cf6' }} onClick={() => setSubView('telefon')}><div className="elite-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>📱</div><div className="elite-title">TELEFON</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #10b981' }} onClick={() => setSubView('yatak')}><div className="elite-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>🛏️</div><div className="elite-title">YATAK / DOLAP</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #f59e0b' }} onClick={() => setSubView('kanaat')}><div className="elite-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>⭐</div><div className="elite-title">KANAAT NOTU</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #f97316' }} onClick={() => setSubView('teslimat')}><div className="elite-icon" style={{ background: '#fff7ed', color: '#f97316' }}>📦</div><div className="elite-title">TESLİMATLAR</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #059669' }} onClick={() => setSubView('banka')}><div className="elite-icon" style={{ background: '#ecfdf5', color: '#059669' }}>🏦</div><div className="elite-title">MERKEZ BANKASI</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #ec4899' }} onClick={() => setSubView('urun_ayari')}><div className="elite-icon" style={{ background: '#fdf2f8', color: '#ec4899' }}>🏷️</div><div className="elite-title">ÜRÜN AYARLARI</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #64748b' }} onClick={() => setSubView('ogrenci')}><div className="elite-icon" style={{ background: '#f8fafc', color: '#64748b' }}>👥</div><div className="elite-title">ÖĞRENCİ YÖNETİMİ</div></div>
        <div className="elite-card elite-hover" style={{ borderTop: '4px solid #0f172a' }} onClick={() => setSubView('ayarlar')}><div className="elite-icon" style={{ background: '#f1f5f9', color: '#0f172a' }}>⚙️</div><div className="elite-title">AYARLAR & GÖREV</div></div>
      </div>
    </div>
  );

  const renderGridList = (title, type) => (
    <div className="fade-in">
      <button className="elite-back-btn" onClick={() => setSubView('')}>❮ İşleyişe Dön</button>
      <div className="elite-section-title">{title}</div>
      {type === 'yoklama' && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
          {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'].map(v => (<button key={v} onClick={() => setVakitTab(v)} className={`elite-tab-btn ${vakitTab === v ? 'active' : ''}`}>{v}</button>))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {roster.sort().map(name => (
          <div key={name} className="elite-card elite-hover" style={{ padding: '16px', justifyContent: 'center', border: '1px solid #e2e8f0' }} onClick={() => setActiveModal({ type, student: name })}><div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{name}</div></div>
        ))}
      </div>
    </div>
  );

  const renderTeslimat = () => {
    const deliveries = appData.deliveries || {};
    const waitList = Object.keys(deliveries).filter(k => deliveries[k].st === 'wait');
    const doneList = Object.keys(deliveries).filter(k => deliveries[k].st === 'done');
    return (
      <div className="fade-in">
         <button className="elite-back-btn" onClick={() => setSubView('')}>❮ İşleyişe Dön</button>
         <div className="elite-section-title" style={{ color: '#f97316' }}>TESLİMAT MERKEZİ</div>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
            <button className={`elite-tab-btn ${teslimatTab === 'bekleyen' ? 'active-orange' : ''}`} onClick={() => setTeslimatTab('bekleyen')}>BEKLEYENLER ({waitList.length})</button>
            <button className={`elite-tab-btn ${teslimatTab === 'tamamlanan' ? 'active-green' : ''}`} onClick={() => setTeslimatTab('tamamlanan')}>TAMAMLANANLAR ({doneList.length})</button>
         </div>
         <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
           {teslimatTab === 'bekleyen' && (
             <>
               {waitList.length === 0 ? <div style={{textAlign:'center', padding:'30px', color:'#64748b', fontWeight:'bold'}}>Bekleyen sipariş yok.</div> : null}
               {waitList.map(key => { const d = deliveries[key]; return (
                   <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                     <div><div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>{d.s}</div><div style={{ fontSize: '13px', color: '#f97316', fontWeight: 'bold', marginTop: '4px' }}>📦 {d.i} <span style={{color:'#64748b'}}>({d.date})</span></div></div>
                     <button className="elite-action-btn" style={{ background: '#10b981', color: 'white', width:'auto' }} onClick={() => deliverItem(key)}>✔ TESLİM ET</button>
                   </div>
               )})}
             </>
           )}
           {teslimatTab === 'tamamlanan' && (
             <>
               {doneList.length === 0 ? <div style={{textAlign:'center', padding:'30px', color:'#64748b', fontWeight:'bold'}}>Tamamlanan sipariş yok.</div> : null}
               {doneList.map(key => { const d = deliveries[key]; return (
                   <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f1f5f9', opacity: 0.8 }}>
                     <div><div style={{ fontWeight: 900, color: '#64748b', fontSize: '16px', textDecoration: 'line-through' }}>{d.s}</div><div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', marginTop: '4px' }}>✅ {d.i} <span style={{color:'#64748b'}}>({d.date})</span></div></div>
                     <button className="elite-action-btn" style={{ background: '#f1f5f9', color: '#64748b', width:'auto' }} onClick={() => undoDeliverItem(key)}>GERİ AL</button>
                   </div>
               )})}
             </>
           )}
         </div>
      </div>
    )
  };

  const renderBanka = () => {
    const totalCoin = roster.reduce((sum, name) => sum + getWalletBalance(name), 0);
    const topRich = [...roster].sort((a,b) => getWalletBalance(b) - getWalletBalance(a)).slice(0, 5);
    return (
      <div className="fade-in">
        <button className="elite-back-btn" onClick={() => setSubView('')}>❮ İşleyişe Dön</button>
        <div className="elite-section-title" style={{ color: '#059669' }}>MERKEZ BANKASI</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="elite-card" style={{ flexDirection: 'column', padding: '30px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.9 }}>SİSTEMDEKİ TOPLAM M-COIN</div>
            <div style={{ fontSize: '42px', fontWeight: 900, marginTop: '10px' }}>{totalCoin} M</div>
          </div>
          <div className="elite-card" style={{ flexDirection: 'column', padding: '30px', alignItems: 'stretch' }}>
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', marginBottom: '10px' }}>🎁 TOPLU PARA DAĞITIMI</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" className="elite-input" placeholder="Örn: 50" value={massCoinAmount} onChange={e => setMassCoinAmount(e.target.value)} style={{ marginBottom: 0 }} />
              <button className="elite-action-btn" style={{ background: '#3b82f6', color: 'white', width:'auto' }} onClick={handleMassCoinDistribution}>DAĞIT</button>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', paddingBottom: '15px', borderBottom: '2px solid #f1f5f9', marginBottom: '10px' }}>🏆 EN ZENGİN 5 ÖĞRENCİ</div>
          {topRich.map((name, i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: i === topRich.length -1 ? 'none' : '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{i + 1}. {name}</div><div style={{ fontWeight: 900, color: '#10b981' }}>{getWalletBalance(name)} M</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUrunAyari = () => {
    const prods = appData.market_products || {};
    return (
      <div className="fade-in">
        <button className="elite-back-btn" onClick={() => setSubView('')}>❮ İşleyişe Dön</button>
        <div className="elite-section-title" style={{ color: '#ec4899' }}>ÜRÜN AYARLARI</div>
        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '30px', padding: '30px' }}>
          <div style={{fontSize: '18px', fontWeight: 900, marginBottom: '20px', color: '#0f172a'}}>YENİ ÜRÜN EKLE</div>
          <input type="text" className="elite-input" placeholder="Ürün Adı (Örn: Cips)" value={newProductName} onChange={e=>setNewProductName(e.target.value)} />
          <input type="number" className="elite-input" placeholder="Fiyatı (Örn: 25)" value={newProductPrice} onChange={e=>setNewProductPrice(e.target.value)} />
          <input type="text" className="elite-input" placeholder="Emoji (Örn: 🍿)" value={newProductEmoji} onChange={e=>setNewProductEmoji(e.target.value)} />
          <button className="elite-action-btn" style={{ background: '#ec4899', color: 'white', marginTop: '10px' }} onClick={handleAddProduct}>MARKETE EKLE</button>
        </div>
        <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{padding: '20px', fontWeight: 900, fontSize:'16px', color:'#0f172a', borderBottom: '2px solid #f1f5f9'}}>MEVCUT ÜRÜNLER</div>
          {Object.keys(prods).map((key, i) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: i === Object.keys(prods).length -1 ? 'none' : '1px solid #f1f5f9' }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}><span style={{fontSize:'28px', background:'#f8fafc', padding:'10px', borderRadius:'16px'}}>{prods[key].i}</span> <div><div style={{fontWeight:800, fontSize:'16px', color:'#0f172a'}}>{prods[key].n}</div><div style={{color:'#ec4899', fontWeight:'bold', fontSize:'13px'}}>{prods[key].p} M-Coin</div></div></div>
              <button style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 15px', fontWeight: 'bold', cursor: 'pointer'}} onClick={() => handleDeleteProduct(key)}>SİL 🗑️</button>
            </div>
          ))}
        </div>
      </div>
    )
  };

  const renderOgrenciYonetimi = () => (
    <div className="fade-in">
      <button className="elite-back-btn" onClick={() => setSubView('')}>❮ İşleyişe Dön</button>
      <div className="elite-section-title" style={{ color: '#64748b' }}>ÖĞRENCİ YÖNETİMİ</div>
      <div className="elite-card" style={{ marginBottom: '30px', padding: '20px', display: 'flex', gap: '15px' }}>
        <input type="text" className="elite-input" style={{ marginBottom: 0 }} placeholder="Yeni Öğrenci Ad Soyad" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
        <button className="elite-action-btn" style={{ background: '#3b82f6', color: 'white', padding: '0 30px', width: 'auto' }} onClick={handleAddStudent}>EKLE</button>
      </div>
      <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        {roster.sort().map((name, i) => {
          const sClass = appData.student_classes?.[name] || '';
          const sTier = appData.student_tiers?.[name] || 'standart';
          const sLevel = appData.student_levels?.[name] || '';
          return (
            <div key={name} style={{ padding: '20px', borderBottom: i === roster.length -1 ? 'none' : '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>{name}</div><button style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }} onClick={() => handleRemoveStudent(name)}>SİL 🗑️</button></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '14px' }}>
                <select className="elite-select" value={sClass} onChange={e => updateStudentAttribute(name, 'student_classes', e.target.value)}><option value="">Sınıf Seç</option><option value="5">5. Sınıf</option><option value="6">6. Sınıf</option><option value="7">7. Sınıf</option><option value="8">8. Sınıf</option></select>
                <select className="elite-select" style={{ background: sTier === 'elite' ? '#fef08a' : '#f1f5f9', color: sTier === 'elite' ? '#854d0e' : '#475569' }} value={sTier} onChange={e => updateStudentAttribute(name, 'student_tiers', e.target.value)}><option value="standart">Standart Lig</option><option value="elite">👑 Elite Lig</option></select>
                <select className="elite-select" value={sLevel} onChange={e => updateStudentAttribute(name, 'student_levels', e.target.value)}><option value="">Seviye Seç</option><option value="1/A">Seviye 1/A</option><option value="1/B">Seviye 1/B</option><option value="2">Seviye 2</option></select>
                <div style={{ width: '2px', height: '24px', background: '#e2e8f0', margin: '0 5px' }}></div>
                <button className="elite-stat-btn" style={{ color: '#059669', background: '#d1fae5' }} onClick={() => handleManualEdit(name, 'wallet', getWalletBalance(name), 'CÜZDAN (M-Coin)')}>🪙 {getWalletBalance(name)} M</button>
                <button className="elite-stat-btn" style={{ color: '#d97706', background: '#fef3c7' }} onClick={() => handleManualEdit(name, 'season_score', getRankScore(name), 'RANK (RP)')}>🏆 {getRankScore(name)} RP</button>
                <button className="elite-stat-btn" style={{ color: '#2563eb', background: '#dbeafe' }} onClick={() => handleManualEdit(name, 'xp', getXP(name), 'TOPLAM (XP)')}>⭐ {getXP(name)} XP</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const renderAyarlar = () => (
    <div className="fade-in">
      <button className="elite-back-btn" onClick={() => setSubView('')}>❮ İşleyişe Dön</button>
      <div className="elite-section-title" style={{ color: '#0f172a' }}>AYARLAR & GÖREV MERKEZİ</div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        
        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px', borderTop: '4px solid #10b981' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#059669' }}>🔐 ÖĞRENCİ GİRİŞ BİLGİLERİ BELİRLEME</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom:'15px'}}>Öğrencilerin kendi panellerine girerken kullanacakları Kullanıcı Adı ve 4 haneli PIN kodunu (şifreyi) belirleyin.</div>
          <select className="elite-select" style={{ marginBottom: '15px', padding: '15px', width: '100%' }} value={loginStudent} onChange={handleLoginStudentChange}>
             <option value="">-- Öğrenci Seçin --</option>
             {roster.sort().map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <input type="text" className="elite-input" placeholder="Kullanıcı Adı" value={loginUser} onChange={e=>setLoginUser(e.target.value)} style={{ marginBottom: 0, textTransform: 'lowercase', flex: 1 }} />
            <input type="text" className="elite-input" placeholder="4 Haneli Şifre" maxLength="4" value={loginPin} onChange={e=>setLoginPin(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
          </div>
          <button className="elite-action-btn" style={{ background: '#10b981', color: 'white' }} onClick={saveStudentLogin}>BİLGİLERİ KAYDET / GÜNCELLE</button>
        </div>

        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px', borderTop: '4px solid #3b82f6' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#1e3a8a' }}>📢 GENEL DUYURU PANOSU</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom:'15px'}}>Öğrenci ekranının en üstünde duran sabit, büyük duyuru alanı.</div>
          <input type="text" className="elite-input" value={settingsInputs.ann1} onChange={e=>setSettingsInputs({...settingsInputs, ann1: e.target.value})} placeholder="Örn: Bu hafta sonu sinema etkinliği yapılacaktır!" />
          <button className="elite-action-btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => saveSettings('ann1', settingsInputs.ann1)}>DUYURUYU YAYINLA</button>
        </div>

        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px', borderTop: '4px solid #ef4444' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#991b1b' }}>🔴 CANLI HABER BANDI (AKAN YAZI)</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom:'15px'}}>Ekranın üstünde sağdan sola kayan sürekli yazılar.</div>
          <input type="text" className="elite-input" value={settingsInputs.news_ticker} onChange={e=>setSettingsInputs({...settingsInputs, news_ticker: e.target.value})} placeholder="Örn: Yeni rütbeler eklendi, hemen marketi ziyaret et!" />
          <button className="elite-action-btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => saveSettings('news_ticker', settingsInputs.news_ticker)}>HABER BANDINI GÜNCELLE</button>
        </div>

        {pendingList.length > 0 && (
          <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px', border: '2px solid #f59e0b', background: '#fffbeb' }}>
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#b45309', marginBottom: '15px' }}>⏳ ONAY BEKLEYEN ÖZEL GÖREVLER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingList.map(req => (
                <div key={req.qId} style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Öğrenci: <span style={{ color: '#0f172a' }}>{req.studentName}</span></div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{req.text}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: req.type === 'M' ? '#10b981' : '#f59e0b' }}>+{req.amt} {req.type}</div>
                    <button onClick={() => rejectQuest(req.studentName, req.qId)} className="elite-action-btn" style={{ padding: '8px 15px', background: '#fee2e2', color: '#ef4444', width: 'auto' }}>REDDET</button>
                    <button onClick={() => approveQuest(req.studentName, req.qId, req.amt, req.type)} className="elite-action-btn" style={{ padding: '8px 15px', background: '#10b981', color: 'white', width: 'auto' }}>✅ ONAYLA</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#5b21b6' }}>🎯 KİŞİYE ÖZEL GÖREV ATA</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom:'15px'}}>Seçtiğiniz öğrencinin kendi panosunda "Özel Görev" olarak çıkacaktır.</div>
          <select className="elite-select" style={{ marginBottom: '10px', width: '100%', padding: '15px' }} value={questStudent} onChange={e => setQuestStudent(e.target.value)}>
            <option value="">-- Öğrenci Seçin --</option>
            {roster.sort().map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="text" className="elite-input" placeholder="Görev Tanımı (Örn: Odanı 3 gün üst üste temiz tut)" value={questText} onChange={e=>setQuestText(e.target.value)} style={{ marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input type="number" className="elite-input" placeholder="Ödül Miktarı" value={questReward} onChange={e=>setQuestReward(e.target.value)} style={{ marginBottom: 0, flex: 2 }} />
            <select className="elite-select" value={questType} onChange={e=>setQuestType(e.target.value)} style={{ marginBottom: 0, flex: 1 }}><option value="M">M-Coin</option><option value="RP">RP Puanı</option></select>
          </div>
          <button className="elite-action-btn" style={{ background: '#8b5cf6', color: 'white' }} onClick={assignQuest}>ÖĞRENCİYE GÖREVİ GÖNDER</button>
        </div>

        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>GÜVENLİK PIN KODU</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom:'15px'}}>Yönetici ekranına giriş şifresi.</div>
          <input type="text" className="elite-input" maxLength="4" value={settingsInputs.pin} onChange={e=>setSettingsInputs({...settingsInputs, pin: e.target.value})} />
          <button className="elite-action-btn" style={{ background: '#0f172a', color: 'white' }} onClick={() => saveSettings('pin', settingsInputs.pin)}>PIN GÜNCELLE</button>
        </div>

        <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '30px', border: '2px solid #fecaca', background: '#fef2f2' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#ef4444' }}>TEHLİKELİ İŞLEMLER</div>
          <div style={{ fontSize: '12px', color: '#ef4444', marginBottom:'15px'}}>Bu işlemler geri alınamaz.</div>
          <button className="elite-action-btn" style={{ background: '#ef4444', color: 'white' }} onClick={resetWeeklyPerformance}>HAFTALIK PERFORMANSI SIFIRLA</button>
        </div>

      </div>
    </div>
  );

  // ==========================================
  // EĞİTİM MODALLARI (VİDEODAKİ GİBİ TAM EKRAN VE SAYAÇLI)
  // ==========================================
  const renderModals = () => {
    if (!activeModal) return null;
    const { type, student } = activeModal;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="fade-in" style={{ background: '#ffffff', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: type === 'odev' ? '600px' : '400px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)', maxHeight: '95vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '22px', color: '#0f172a', marginBottom: '24px' }}>{student}</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* VİDEODAKİ DERS/ÖDEV TAKİBİ */}
            {type === 'odev' && (
              <>
                <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 900, color: '#3b82f6', marginBottom: '15px', textTransform: 'uppercase' }}>Ödev & Görev Takibi</div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* SOL TÜR: MEB DERSLERİ */}
                  <div style={{ flex: '1 1 200px', background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '250px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#64748b', marginBottom: '10px' }}>📚 DERSLER (+2 M)</div>
                    {['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü', 'Bilişim', 'Görsel Sanatlar', 'Müzik', 'Beden Eğitimi', 'Teknoloji Tasarım', 'Seçmeli: Kur\'an-ı Kerim', 'Seçmeli: Peygamberimizin Hayatı', 'Seçmeli: Yabancı Dil'].map(ders => (
                       <label key={ders} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: '#0f172a', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                         <input type="checkbox" id={`chk_${ders.replace(/\s+/g, '')}`} value={ders} style={{ width: '18px', height: '18px' }} /> {ders}
                       </label>
                    ))}
                  </div>

                  {/* SAĞ TÜR: SAYAÇLAR */}
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                     
                     <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>📖</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>KİTAP SAYACI</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>10 Sayfa = +1 M</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                           <button className="elite-action-btn" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', background: '#fee2e2', color: '#ef4444', fontSize: '20px' }} onClick={() => { const el = document.getElementById('kitapSayfa'); el.value = Math.max(0, (parseInt(el.value)||0) - 10); }}>-</button>
                           <input type="number" id="kitapSayfa" defaultValue="0" style={{ width: '60px', textAlign: 'center', fontSize: '20px', fontWeight: 900, border: 'none', background: 'transparent', outline: 'none', color: '#0f172a' }} readOnly />
                           <button className="elite-action-btn" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', background: '#d1fae5', color: '#10b981', fontSize: '20px' }} onClick={() => { const el = document.getElementById('kitapSayfa'); el.value = (parseInt(el.value)||0) + 10; }}>+</button>
                        </div>
                     </div>

                     <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>🎯</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>SORU SAYACI</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>10 Soru = +1 M</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                           <button className="elite-action-btn" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', background: '#fee2e2', color: '#ef4444', fontSize: '20px' }} onClick={() => { const el = document.getElementById('testSoru'); el.value = Math.max(0, (parseInt(el.value)||0) - 10); }}>-</button>
                           <input type="number" id="testSoru" defaultValue="0" style={{ width: '60px', textAlign: 'center', fontSize: '20px', fontWeight: 900, border: 'none', background: 'transparent', outline: 'none', color: '#0f172a' }} readOnly />
                           <button className="elite-action-btn" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', background: '#d1fae5', color: '#10b981', fontSize: '20px' }} onClick={() => { const el = document.getElementById('testSoru'); el.value = (parseInt(el.value)||0) + 10; }}>+</button>
                        </div>
                     </div>

                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="elite-action-btn" style={{ background: '#f1f5f9', color: '#64748b', flex: '1 1 100px', boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
                  <button className="elite-action-btn" style={{ background: '#fee2e2', color: '#ef4444', flex: '1 1 120px' }} onClick={() => {
                    const msg = `📅 ${new Date().toLocaleDateString('tr-TR')} Eğitim Raporu\n👤 Öğrenci: ${student}\nℹ️ Bugün ödev veya görev verilmemiştir / yapılmamıştır.`;
                    handleActionClick(student, 0, 0, 'odev', 0, 0); 
                    db.ref(`mavikent_premium/exams/${student}/odev_latest`).set({ ders: 'Ödev Yok', yapildi: false, sayfa: 0, soru: 0, coin: 0, date: new Date().toLocaleDateString('tr-TR') });
                    sendVeliMesaji(msg);
                    setActiveModal(null);
                  }}>ÖDEV YOK (0 M)</button>
                  <button className="elite-action-btn" style={{ background: '#10b981', color: 'white', flex: '1 1 200px' }} onClick={() => {
                    const dersler = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü', 'Bilişim', 'Görsel Sanatlar', 'Müzik', 'Beden Eğitimi', 'Teknoloji Tasarım', 'Seçmeli: Kur\'an-ı Kerim', 'Seçmeli: Peygamberimizin Hayatı', 'Seçmeli: Yabancı Dil'];
                    let yapilanDersler = [];
                    dersler.forEach(ders => { const el = document.getElementById('chk_' + ders.replace(/\s+/g, '')); if(el && el.checked) yapilanDersler.push(ders); });
                    
                    const sayfa = parseInt(document.getElementById('kitapSayfa').value) || 0;
                    const soru = parseInt(document.getElementById('testSoru').value) || 0;
                    
                    const odevCoin = yapilanDersler.length * 2; 
                    const kitapCoin = Math.floor(sayfa / 10);
                    const testCoin = Math.floor(soru / 10);
                    const totalCoin = odevCoin + kitapCoin + testCoin;
                    const totalXp = totalCoin * 5; 
                    
                    if(totalCoin > 0) {
                       handleActionClick(student, totalCoin, 0, 'odev', totalCoin, totalXp);
                       db.ref(`mavikent_premium/exams/${student}/odev_latest`).set({ ders: yapilanDersler.join(', ') || 'Sadece Ekstra Görev', yapildi: true, sayfa, soru, coin: totalCoin, date: new Date().toLocaleDateString('tr-TR') });
                       const msg = `📅 ${new Date().toLocaleDateString('tr-TR')} Günlük Eğitim Raporu\n👤 Öğrenci: ${student}\n📚 Yapılan Ödevler: ${yapilanDersler.length > 0 ? yapilanDersler.join(', ') : 'Yok'}\n📖 Okunan Kitap: ${sayfa} Sayfa\n📝 Çözülen Test: ${soru} Soru\n⭐ Toplam Kazanılan: +${totalCoin} M-Coin`;
                       sendVeliMesaji(msg);
                       setActiveModal(null);
                    } else { alert("Herhangi bir ödev, kitap veya test girişi yapmadınız."); }
                  }}>KAYDET & BİLDİR</button>
                </div>
              </>
            )}

            {/* VİDEODAKİ DENEME SINAVI */}
            {type === 'deneme' && (
              <>
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 900, color: '#3b82f6', marginBottom: '15px' }}>DENEME SINAVI GİRİŞİ</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>TR:</span><input type="number" id="trNet" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>MAT:</span><input type="number" id="matNet" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>FEN:</span><input type="number" id="fenNet" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>SOS:</span><input type="number" id="sosNet" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>İNG:</span><input type="number" id="ingNet" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>DİN:</span><input type="number" id="dinNet" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', marginBottom: '5px' }}>HEDEF NET:</div>
                  <input type="number" id="hedefNet" className="elite-input" style={{marginBottom:0}} />
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="elite-action-btn" style={{ background: '#f1f5f9', color: '#64748b', flex: 1, boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
                  <button className="elite-action-btn" style={{ background: '#10b981', color: 'white', flex: 2 }} onClick={() => {
                    const tr = parseFloat(document.getElementById('trNet').value) || 0; const mat = parseFloat(document.getElementById('matNet').value) || 0;
                    const fen = parseFloat(document.getElementById('fenNet').value) || 0; const sos = parseFloat(document.getElementById('sosNet').value) || 0;
                    const ing = parseFloat(document.getElementById('ingNet').value) || 0; const din = parseFloat(document.getElementById('dinNet').value) || 0;
                    const target = parseFloat(document.getElementById('hedefNet').value) || 0;
                    
                    const total = tr + mat + fen + sos + ing + din;
                    const avg = (total / 6).toFixed(2);
                    
                    db.ref(`mavikent_premium/exams/${student}/deneme`).set({ net: total, tr, mat, fen, sos, ing, din, target, avg, date: new Date().toLocaleDateString('tr-TR') });
                    
                    let coin = 0; let xp = 10; let msgDurum = "Hedefe ulaşılamadı veya girilmedi.";
                    if(target > 0 && total >= target) { coin = 10; xp = 50; msgDurum = "🎉 HEDEFE ULAŞILDI!"; } 
                    else if (target === 0) { coin = 5; xp = 50; msgDurum = "Sınav Kaydedildi."; }
                    
                    handleActionClick(student, coin, 0, '', 0, xp); 
                    
                    const msg = `📊 ${new Date().toLocaleDateString('tr-TR')} Deneme Sınavı Sonucu\n👤 Öğrenci: ${student}\n🎯 Hedeflenen Net: ${target}\n✅ Toplam Net: ${total}\n📈 Net Ortalaması: ${avg}\n\n📌 Ders Bazlı Netler:\nTR: ${tr} | MAT: ${mat} | FEN: ${fen}\nSOS: ${sos} | İNG: ${ing} | DİN: ${din}\n\nDurum: ${msgDurum}`;
                    sendVeliMesaji(msg);
                    setActiveModal(null);
                  }}>KAYDET & BİLDİR</button>
                </div>
              </>
            )}

            {/* VİDEODAKİ YAZILI HAZIRLIK */}
            {type === 'yazili' && (
              <>
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 900, color: '#3b82f6', marginBottom: '15px' }}>YAZILI SINAV GİRİŞİ</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>TR:</span><input type="number" id="trYazili" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>MAT:</span><input type="number" id="matYazili" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>FEN:</span><input type="number" id="fenYazili" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>SOS:</span><input type="number" id="sosYazili" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>İNG:</span><input type="number" id="ingYazili" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '50px', fontSize: '13px', fontWeight: 800 }}>DİN:</span><input type="number" id="dinYazili" className="elite-input" style={{marginBottom:0, padding:'10px'}} /></div>
                </div>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', marginBottom: '5px' }}>HEDEF ORTALAMA:</div>
                  <input type="number" id="hedefYazili" className="elite-input" style={{marginBottom:0}} />
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="elite-action-btn" style={{ background: '#f1f5f9', color: '#64748b', flex: 1, boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
                  <button className="elite-action-btn" style={{ background: '#10b981', color: 'white', flex: 2 }} onClick={() => {
                    let sum = 0; let count = 0; let dersTxt = [];
                    const map = { trYazili:'TR', matYazili:'MAT', fenYazili:'FEN', sosYazili:'SOS', ingYazili:'İNG', dinYazili:'DİN' };
                    const vals = {};
                    Object.keys(map).forEach(id => {
                      const val = document.getElementById(id).value;
                      if(val !== '') { sum += parseFloat(val); count++; vals[id] = parseFloat(val); dersTxt.push(`${map[id]}: ${val}`); }
                    });

                    if(count === 0) return alert("En az bir not girmelisiniz!");

                    const avg = (sum / count).toFixed(2);
                    const hedef = parseFloat(document.getElementById('hedefYazili').value) || 0;
                    
                    db.ref(`mavikent_premium/exams/${student}/yazili_latest`).set({ puan: avg, ders: `Ortalama (${count} Ders)`, target: hedef, details: vals, date: new Date().toLocaleDateString('tr-TR') });
                    
                    let coin = 0; let xp = 5; let msgDurum = "Sınav Kaydedildi";
                    if(hedef > 0 && avg >= hedef) { coin = 10; xp = 50; msgDurum = "🎉 Hedef Ortalama Tuttu!"; if(avg >= 90) coin = 15; } 

                    handleActionClick(student, coin, 0, '', 0, xp);
                    
                    const msg = `💯 ${new Date().toLocaleDateString('tr-TR')} Sınav Sonucu\n👤 Öğrenci: ${student}\n🎯 Hedeflenen Ortalama: ${hedef}\n✅ Alınan Ortalama: ${avg}\n\n📌 Girilen Notlar:\n${dersTxt.join(' | ')}\n\nDurum: ${msgDurum}`;
                    sendVeliMesaji(msg);
                    setActiveModal(null);
                  }}>KAYDET & BİLDİR</button>
                </div>
              </>
            )}

            {/* STANDART RUTİN KONTROLLER */}
            {type === 'yoklama' && (
              <>
                <button className="elite-action-btn" style={{ background: '#fef08a', color: '#854d0e' }} onClick={() => handleActionClick(student, 3, 0, 'yoklama', 3, 25)}>Takkeli (+3 M)</button>
                <button className="elite-action-btn" style={{ background: '#d1fae5', color: '#065f46' }} onClick={() => handleActionClick(student, 2, 0, 'yoklama', 2, 15)}>Geldi (+2 M)</button>
                <button className="elite-action-btn" style={{ background: '#fef3c7', color: '#92400e' }} onClick={() => handleActionClick(student, 1, 0, 'yoklama', 1, 5)}>Geç (+1 M)</button>
                <button className="elite-action-btn" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={() => handleActionClick(student, 0, 0, 'yoklama', 0, 0)}>Gelmedi (0 M)</button>
                <button className="elite-action-btn" style={{ background: 'transparent', color: '#64748b', marginTop: '10px', boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
              </>
            )}

            {type === 'telefon' && (
              <>
                <button className="elite-action-btn" style={{ background: '#d1fae5', color: '#065f46' }} onClick={() => handleActionClick(student, 2, 0, 'telefon', 2, 5)}>Teslim Etti (+2 M)</button>
                <button className="elite-action-btn" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={() => handleActionClick(student, 0, 0, 'telefon', 0, 0)}>Vermedi (0 M)</button>
                <button className="elite-action-btn" style={{ background: '#dbeafe', color: '#1e40af' }} onClick={() => handleActionClick(student, 2, 0, 'telefon', 2, 5)}>Telefonu Yok (+2 M)</button>
                <button className="elite-action-btn" style={{ background: 'transparent', color: '#64748b', marginTop: '10px', boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
              </>
            )}

            {type === 'yatak' && (
              <>
                <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 900, color: '#64748b', marginTop: '10px' }}>YATAK DURUMU</div>
                <button className="elite-action-btn" style={{ background: '#d1fae5', color: '#065f46' }} onClick={() => handleActionClick(student, 1, 0, 'yatak', 1, 5)}>Düzenli (+1 M)</button>
                <button className="elite-action-btn" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={() => handleActionClick(student, 0, 0, 'yatak', 0, 0)}>Bozuk (0 M)</button>
                
                <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 900, color: '#64748b', marginTop: '15px' }}>DOLAP DURUMU</div>
                <button className="elite-action-btn" style={{ background: '#d1fae5', color: '#065f46' }} onClick={() => handleActionClick(student, 1, 0, 'yatak', 1, 5)}>Düzenli (+1 M)</button>
                <button className="elite-action-btn" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={() => handleActionClick(student, 0, 0, 'yatak', 0, 0)}>Bozuk (0 M)</button>
                <button className="elite-action-btn" style={{ background: 'transparent', color: '#64748b', marginTop: '10px', boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
              </>
            )}

            {type === 'kanaat' && (
              <>
                <input type="number" id="kanaatPuan" className="elite-input" placeholder="M-Coin (Örn: 50)" />
                <button className="elite-action-btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => { const val = parseInt(document.getElementById('kanaatPuan').value) || 0; handleActionClick(student, val, 0, 'kanaat', val, 10); }}>Puanı Kaydet</button>
                <button className="elite-action-btn" style={{ background: 'transparent', color: '#64748b', marginTop: '10px', boxShadow: 'none' }} onClick={() => setActiveModal(null)}>İPTAL</button>
              </>
            )}

          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px 20px 60px 20px', fontFamily: '"Nunito", sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .elite-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); display: flex; align-items: center; gap: 20px; transition: all 0.2s ease; cursor: pointer; }
        .elite-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
        .elite-icon { font-size: 32px; width: 64px; height: 64px; border-radius: 18px; display: flex; justify-content: center; align-items: center; }
        .elite-card-content { flex: 1; }
        .elite-title { font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
        .elite-desc { font-size: 13px; color: #64748b; font-weight: 600; }
        .elite-back-btn { background: transparent; color: #64748b; border: none; font-size: 14px; font-weight: 800; cursor: pointer; padding: 0; margin-bottom: 30px; display: inline-block; transition: color 0.2s; }
        .elite-back-btn:hover { color: #0f172a; }
        .elite-section-title { text-align: center; font-weight: 900; font-size: 26px; color: #0f172a; margin-bottom: 40px; letter-spacing: 1px; }
        .elite-input { width: 100%; padding: 16px 20px; border-radius: 16px; border: 2px solid #e2e8f0; background: #f8fafc; font-size: 16px; font-weight: 700; outline: none; transition: border 0.2s; margin-bottom: 15px; color: #0f172a; }
        .elite-input:focus { border-color: #3b82f6; background: white; }
        .elite-action-btn { width: 100%; padding: 16px 24px; border-radius: 16px; border: none; font-size: 15px; font-weight: 900; cursor: pointer; transition: transform 0.1s, opacity 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .elite-action-btn:active { transform: scale(0.98); }
        .elite-select { padding: 10px 15px; border-radius: 12px; border: 2px solid #e2e8f0; background: #f8fafc; font-size: 13px; font-weight: 800; color: #475569; outline: none; cursor: pointer; }
        .elite-stat-btn { padding: 8px 16px; border-radius: 12px; border: none; font-size: 13px; font-weight: 900; cursor: pointer; }
        .elite-tab-btn { padding: 12px 24px; border-radius: 14px; font-size: 14px; font-weight: 800; border: none; cursor: pointer; transition: 0.2s; background: white; color: #64748b; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .elite-tab-btn.active { background: #3b82f6; color: white; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
        .elite-tab-btn.active-orange { background: #f97316; color: white; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); }
        .elite-tab-btn.active-green { background: #10b981; color: white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, fontSize: '24px', color: 'var(--primary)', letterSpacing: '2px' }}>MAVİKENT <span style={{color: '#3b82f6'}}>ELITE</span></div>
        <button style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }} onClick={goBackToRoles}>ÇIKIŞ YAP</button>
      </div>

      {currentView === 'main' && renderMainMenu()}
      {currentView === 'egitim' && renderEgitimMenu()}
      {currentView === 'degerler' && renderDegerlerMenu()}
      {currentView === 'isleyis' && !subView && renderIsleyisGrid()}
      
      {currentView === 'isleyis' && subView === 'yoklama' && renderGridList('YOKLAMA KONTROLÜ', 'yoklama')}
      {currentView === 'isleyis' && subView === 'telefon' && renderGridList('TELEFON KONTROLÜ', 'telefon')}
      {currentView === 'isleyis' && subView === 'yatak' && renderGridList('YATAK & DOLAP KONTROLÜ', 'yatak')}
      {currentView === 'isleyis' && subView === 'kanaat' && renderGridList('KANAAT NOTLARI', 'kanaat')}
      
      {currentView === 'isleyis' && subView === 'teslimat' && renderTeslimat()}
      {currentView === 'isleyis' && subView === 'banka' && renderBanka()}
      {currentView === 'isleyis' && subView === 'urun_ayari' && renderUrunAyari()}
      {currentView === 'isleyis' && subView === 'ogrenci' && renderOgrenciYonetimi()}
      {currentView === 'isleyis' && subView === 'ayarlar' && renderAyarlar()}

      {renderModals()}

    </div>
  );
}