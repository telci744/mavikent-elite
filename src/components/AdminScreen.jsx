import React, { useState, useEffect } from 'react';
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
      active_theme: appData?.settings?.active_theme || 'default', 
      admin_pin: appData?.settings?.admin_pin || '1507', 
      staff_pin: appData?.settings?.staff_pin || '1234' 
  });
  
  const [questInputs, setQuestInputs] = useState({ 
      q1_text: appData?.quests?.q1?.text || '', q1_amt: appData?.quests?.q1?.amt || '', q1_type: appData?.quests?.q1?.type || 'M', 
      q2_text: appData?.quests?.q2?.text || '', q2_amt: appData?.quests?.q2?.amt || '', q2_type: appData?.quests?.q2?.type || 'M', 
      q3_text: appData?.quests?.q3?.text || '', q3_amt: appData?.quests?.q3?.amt || '', q3_type: appData?.quests?.q3?.type || 'M' 
  });
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', icon: '📦', type: 'normal', stock: '' });
  const [bundleSelection, setBundleSelection] = useState([]);
  const [editProductKey, setEditProductKey] = useState(null); 
  
  const [newAdminClan, setNewAdminClan] = useState({ name: '', tag: '', icon: '🛡️', leader: '' });
  const [newGiftCode, setNewGiftCode] = useState({ code: '', type: 'mcoin', val: '', uses: '1' });
  
  const [newGroupBuy, setNewGroupBuy] = useState({ name: '', totalCost: '', maxP: '', icon: '🤝' });
  const [adminChatInput, setAdminChatInput] = useState(''); 

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

  useEffect(() => {
      if (!appData || !roster.length) return;
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() >= 19) {
          const todayStr = now.toDateString();
          if (appData?.settings?.last_ticket_dist !== todayStr) {
              const updates = {};
              roster.forEach(n => { updates[`tickets/${n}`] = (Number(appData?.tickets?.[n]) || 0) + 1; });
              updates[`settings/last_ticket_dist`] = todayStr;
              db.ref('mavikent_premium').update(updates);
              alert("⏰ SİSTEM BİLDİRİMİ: Pazartesi 19:00 Çekiliş Hakları dağıtıldı!");
          }
      }
  }, [appData, roster]);

  const getFilteredRoster = (session) => { 
      if(session === 'ELİT') return roster.filter(n => isElite(n)); 
      if(session === 'STANDART') return roster.filter(n => !isElite(n)); 
      return roster.filter(n => appData?.student_classes?.[n] === session); 
  };

  const handleBack = () => {
    if (currentModule && (modalType || selectedStudent)) { setModalType(null); setSelectedStudent(null); return; }
    if (currentModule === 'yoklama' && selectedSession) { setSelectedSession(''); return; }
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); return; } 
    if (dashboardView !== 'main') { 
        if (dashboardView.startsWith('egitim_')) setDashboardView('egitim'); 
        else setDashboardView('main'); 
        return; 
    }
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
        const streakData = appData?.active_cards?.[selectedStudent]?.streak;
        const hasStreakSaver = streakData && (streakData.date === new Date().toDateString() || (streakData.end && streakData.end > Date.now()));
        if (hasStreakSaver) { 
            alert(`🛡️ ${selectedStudent} SERİ KORUMA KALKANI kullandı! Eksi aldı ama serisi bozulmadı.`); 
            updates[`active_cards/${selectedStudent}/streak`] = null; 
        } else { 
            updates[`streaks/${selectedStudent}`] = 0; 
            updates[`daily_flags/${selectedStudent}/broken`] = true; 
        }
    }
    
    if (finalPts !== 0) { 
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts; 
        updates[`xp/${selectedStudent}`] = Math.max(0, (Number(appData?.xp?.[selectedStudent]) || 0) + (basePts * 10)); 
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        let descText = type === 'kanaat' ? 'Yönetici Kanaat Notu' : (type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : 'Yatak/Dolap Düzeni'));
        updates[`transactions/${selectedStudent}/${tId}`] = { desc: descText, amt: finalPts, date: new Date().toLocaleString('tr-TR') };
    }
    
    if (type === 'yoklama') updates[`yoklama_d/${selectedStudent}/sessions/${selectedSession}`] = { st: status, pts: finalPts };
    else if (type === 'telefon') updates[`telefon_d/${selectedStudent}/sessions/gunluk`] = { st: status, pts: finalPts };
    else if (type === 'kanaat') updates[`kanaat_w/${selectedStudent}`] = (Number(appData?.kanaat_w?.[selectedStudent]) || 0) + finalPts;
    else if (type === 'yatak') updates[`yatak_d/${selectedStudent}/${status}_pts`] = finalPts; 
    
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); 
    setModalType(null);
  };

  const saveEducationData = () => {
    const oldData = appData?.education_d?.[selectedStudent] || {}; 
    let earnedPoints = 0;
    const validNew = (eduData.lessons || []).filter(hw => !hw.includes("YOK")); 
    const validOld = (oldData.lessons || []).filter(hw => !hw.includes("YOK"));
    
    if (validOld.length === 0 && validNew.length > 0) earnedPoints += 2;
    if ((eduData.pages || 0) > (oldData.pages || 0)) earnedPoints += Math.floor((eduData.pages || 0) / 10) - Math.floor((oldData.pages || 0) / 10);
    if ((eduData.questions || 0) > (oldData.questions || 0)) earnedPoints += Math.floor((eduData.questions || 0) / 10) - Math.floor((oldData.questions || 0) / 10);
    
    const updates = {}; 
    updates[`education_d/${selectedStudent}`] = { ...eduData, date: new Date().toDateString() };
    
    if (earnedPoints > 0) {
        const finalM = getCalculatedPoints(selectedStudent, earnedPoints, 'egitim');
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (Number(appData?.season_score?.[selectedStudent]) || 0) + (earnedPoints + (isElite(selectedStudent) ? 2 : 0));
        updates[`xp/${selectedStudent}`] = (Number(appData?.xp?.[selectedStudent]) || 0) + (earnedPoints * 10);
        updates[`transactions/${selectedStudent}/txn_${Date.now()}`] = { desc: 'Günlük Eğitim Başarısı', amt: finalM, date: new Date().toLocaleString('tr-TR') };
    }
    
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); setModalType(null); alert("Eğitim Verileri Güncellendi!");
  };

  const saveExamData = (type) => {
    const updates = {};
    if (type === 'deneme') {
        let totalNet = 0;
        for(let i=0; i<examSubjects.length; i++) { 
            const d = parseFloat(examData[`d_${i}`]) || 0; const y = parseFloat(examData[`y_${i}`]) || 0; totalNet += (d - (y/3)); 
        }
        updates[`exams/${selectedStudent}/deneme`] = { ...examData, net: totalNet, date: new Date().toDateString() };
    } else if (type === 'yazili') {
        let total = 0; let count = 0;
        for(let i=0; i<examSubjects.length; i++) { 
            const val = examData[`p_${i}`]; if(val !== undefined && val !== '') { total += parseFloat(val); count++; } 
        }
        updates[`exams/${selectedStudent}/yazili`] = { ...examData, avg: count > 0 ? (total / count) : 0, date: new Date().toDateString() };
    }
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); setModalType(null); alert(`${type.toUpperCase()} Kaydedildi!`);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return alert("İsim ve fiyat zorunludur!");
    const productData = { 
        n: newProduct.name, p: parseInt(newProduct.price), i: newProduct.icon, type: newProduct.type,
        stock: newProduct.stock !== '' ? parseInt(newProduct.stock) : 999 
    };

    if (newProduct.type === 'bundle') {
        if (bundleSelection.length === 0) return alert("Lütfen paket içine eklenecek ürünleri seçin!");
        productData.bundleItems = bundleSelection;
    }

    if (editProductKey) { db.ref(`mavikent_premium/market_products/${editProductKey}`).update(productData); setEditProductKey(null); } 
    else { db.ref('mavikent_premium/market_products').push(productData); }
    setNewProduct({ name: '', price: '', icon: '📦', type: 'normal', stock: '' }); setBundleSelection([]);
  };
  
  const editProduct = (key, prod) => { 
      setNewProduct({ name: prod.n, price: prod.p, icon: prod.i, type: prod.type || 'normal', stock: prod.stock !== undefined ? prod.stock : '' }); 
      setBundleSelection(prod.bundleItems || []); setEditProductKey(key); window.scrollTo(0,0); 
  };

  const handleCreateGroupBuy = () => {
      const tc = parseInt(newGroupBuy.totalCost); const mp = parseInt(newGroupBuy.maxP);
      if(!newGroupBuy.name || isNaN(tc) || isNaN(mp)) return alert("Tüm alanları doldurun!");
      db.ref('mavikent_premium/group_buys').push({ n: newGroupBuy.name, i: newGroupBuy.icon, tc: tc, mp: mp, pp: Math.ceil(tc/mp), participants: [], active: true, date: new Date().toLocaleDateString('tr-TR') });
      alert("🤝 İmece başlatıldı!"); setNewGroupBuy({ name: '', totalCost: '', maxP: '', icon: '🤝' });
  };

  const handleStartAuction = () => {
      const item = document.getElementById('aucItem').value; const price = parseInt(document.getElementById('aucPrice').value);
      if(!item || !price) return alert("İhale ürünü ve başlangıç fiyatı zorunludur!");
      db.ref('mavikent_premium/auction').set({ item: item, minBid: price, currentBid: price, highestBidder: null, active: true });
      alert("🔨 İhale başlatıldı! Öğrenciler artık teklif verebilir.");
      document.getElementById('aucItem').value = ''; document.getElementById('aucPrice').value = '';
  };

  const handleEndAuction = () => {
      if(!window.confirm("İhaleyi bitirmek istediğine emin misin?")) return;
      const auc = appData?.auction;
      if (auc && auc.highestBidder) {
          db.ref('mavikent_premium/deliveries').push({ s: auc.highestBidder, i: `${auc.item} (İhale Kazancı)`, st: 'wait', type: 'normal', val: auc.item, date: new Date().toLocaleDateString('tr-TR') });
          alert(`🏆 İhale bitti! ${auc.highestBidder} kazandı.`);
      } else { alert("İhaleye kimse teklif vermedi."); }
      db.ref('mavikent_premium/auction').set(null);
  };

  const handleAdminCreateClan = () => {
      if(!newAdminClan.name || !newAdminClan.tag || !newAdminClan.leader) return alert("Klan adı, TAG ve lider zorunludur!");
      const cId = `clan_${Date.now()}`;
      db.ref(`mavikent_premium/clans/${cId}`).set({ name: newAdminClan.name.toUpperCase(), tag: newAdminClan.tag.toUpperCase(), icon: newAdminClan.icon, desc: 'Yönetici tarafından kuruldu.', leader: newAdminClan.leader, members: [newAdminClan.leader] });
      alert("Klan başarıyla oluşturuldu."); setNewAdminClan({ name: '', tag: '', icon: '🛡️', leader: '' });
  };

  const handleAdminDeleteClan = (cId) => {
      if(!window.confirm("Bu klanı silmek istediğine emin misin?")) return;
      const clan = appData?.clans?.[cId];
      if(clan && clan.members) {
          const updates = {}; updates[`clans/${cId}`] = null;
          clan.members.forEach(m => { updates[`clan_war_participants/${m}`] = null; });
          db.ref('mavikent_premium').update(updates); alert("Klan temizlendi.");
      }
  };

  const handleBulkDeliveryAction = (action) => {
      const waitingKeys = Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].st === 'wait');
      if (waitingKeys.length === 0) return alert("Bekleyen teslimat yok.");
      const updates = {};
      if (action === 'approve') {
          if(!window.confirm(`Toplu onaylansın mı?`)) return;
          waitingKeys.forEach(k => updates[`deliveries/${k}/st`] = 'done'); db.ref('mavikent_premium').update(updates); alert(`✅ Toplu onaylandı!`);
      } 
      else if (action === 'refund') {
          if(!window.confirm(`Toplu iptal ve iade edilsin mi?`)) return;
          let localWallets = {};
          waitingKeys.forEach(k => {
              const item = appData.deliveries[k]; let refundAmt = 0; const itemName = String(item.n || item.i || '');
              if (itemName.includes('(Çekiliş)')) refundAmt = 20; else if (itemName.includes('(Kazı Kazan)')) refundAmt = 15; 
              else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === itemName); if (prod && prod.p) refundAmt = Number(prod.p); }
              updates[`deliveries/${k}`] = null;
              if (refundAmt > 0) {
                  if (localWallets[item.s] === undefined) localWallets[item.s] = Number(appData?.wallet?.[item.s] || 0);
                  localWallets[item.s] += refundAmt; updates[`wallet/${item.s}`] = localWallets[item.s];
                  updates[`transactions/${item.s}/txn_${Date.now()}_${Math.floor(Math.random()*1000)}`] = { desc: `İptal İadesi: ${itemName}`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') };
              }
          });
          db.ref('mavikent_premium').update(updates); alert(`💰 İadeleri tamamlandı!`);
      }
  };

  const sendAdminChat = () => {
      if(!adminChatInput.trim()) return;
      db.ref('mavikent_premium/global_chat').push({ s: 'YÖNETİCİ', t: adminChatInput, ts: Date.now(), type: 'admin', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      setAdminChatInput('');
  };

  const renderStudentGrid = (students, type) => (
    <div className="grid-mobile-2">
      {students.map(name => {
        let bgColor = '#ffffff'; let subText = '';
        
        if (currentModule === 'yoklama') { 
            const st = appData?.yoklama_d?.[name]?.sessions?.[selectedSession]?.st; 
            if (st === 'p' || st === 't') bgColor = '#ecfdf5'; 
            if (st === 'a') bgColor = '#fef2f2'; 
            if (st === 'l') bgColor = '#fffbeb'; 
        } 
        else if (currentModule === 'values_view') { 
            if (appData?.values_edu_d?.[name]?.[new Date().toDateString()]?.done) bgColor = '#ecfdf5'; 
        } 
        else if (currentModule === 'class_view') { 
            const d = appData?.education_d?.[name]; 
            if(d) subText = `Ödev: ${(d.lessons||[]).length} | Kitap: ${d.pages||0} | Soru: ${d.questions||0}`; 
        } 
        else if (currentModule === 'deneme_view') { 
            const net = appData?.exams?.[name]?.deneme?.net; 
            subText = net ? `Net: ${parseFloat(net).toFixed(2)}` : 'Girilmedi'; 
        } 
        else if (currentModule === 'yazili_view') { 
            const avg = appData?.exams?.[name]?.yazili?.avg; 
            subText = avg ? `Ort: ${parseFloat(avg).toFixed(1)}` : 'Girilmedi'; 
        }
        
        const isEliteStud = isElite(name);
        const has2X = (appData?.active_cards?.[name]?.multiplier?.date === new Date().toDateString()) || (appData?.settings?.global_event === '2x_xp');
        const streakData = appData?.active_cards?.[name]?.streak;
        const hasStreak = streakData && (streakData.date === new Date().toDateString() || (streakData.end && streakData.end > Date.now()));

        return (
          <div key={name} onClick={() => { 
                setSelectedStudent(name); 
                if (type === 'isleyis') setModalType('isleyis');
                else if (type === 'egitim_ders') { setEduData({ lessons: appData?.education_d?.[name]?.lessons || [], pages: appData?.education_d?.[name]?.pages || 0, questions: appData?.education_d?.[name]?.questions || 0 }); setModalType('egitim'); }
                else if (type === 'egitim_deneme') { setExamData(appData?.exams?.[name]?.deneme || {}); setModalType('deneme'); }
                else if (type === 'egitim_yazili') { setExamData(appData?.exams?.[name]?.yazili || {}); setModalType('yazili'); }
                else if (type === 'degerler') {
                   const bugun = new Date().toDateString();
                   if(!appData?.values_edu_d?.[name]?.[bugun]?.done) { 
                       if(window.confirm(`${name} dersi verdi mi?`)) { 
                           db.ref(`mavikent_premium/values_edu_d/${name}/${bugun}/done`).set(true); 
                           db.ref(`mavikent_premium/wallet/${name}`).transaction(c => (Number(c)||0) + (isEliteStud?4:2)); 
                           db.ref(`mavikent_premium/season_score/${name}`).transaction(c => (Number(c)||0) + (isEliteStud?4:2)); 
                       } 
                   } else { 
                       if(window.confirm("Kaldırılsın mı?")) db.ref(`mavikent_premium/values_edu_d/${name}/${bugun}/done`).set(null); 
                   }
                }
             }} 
               className="card-hover" style={{ background: bgColor, border: isEliteStud ? '2px solid #d4af37' : 'none', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a', cursor: 'pointer' }}>
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
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        * { outline: none !important; } button, input, select { border: none !important; outline: none !important; }
        .premium-btn { border-radius: 50px !important; border: none !important; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.08); display: inline-flex; align-items: center; justify-content: center;}
        .premium-btn:hover { filter: brightness(0.95); transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.12); } .premium-btn:active { transform: scale(0.96); }
        .btn-iptal { background: #f1f5f9 !important; color: #64748b !important; padding: 16px 24px; border-radius: 50px !important; font-weight: 800; border: none !important; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-iptal:hover { background: #e2e8f0 !important; color: #0f172a !important; transform: translateY(-2px); } .btn-iptal:active { transform: scale(0.96); }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none !important; } .card-hover:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 35px -5px rgba(0,0,0,0.1) !important; } .card-hover:active { transform: scale(0.98); }
        .elite-input { outline: none !important; border: 2px solid #e2e8f0 !important; transition: all 0.2s; padding: 14px 20px; border-radius: 20px; width: 100%; font-weight: 700; color: #0f172a; background: #f8fafc; }
        .elite-input:focus { border-color: #3b82f6 !important; background: #ffffff; box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important; }
        .clean-scroll::-webkit-scrollbar { width: 6px; } .clean-scroll::-webkit-scrollbar-track { background: transparent; } .clean-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .premium-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .premium-card { background: white; text-align: center; border-radius: 24px; padding: 35px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: center; align-items: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .premium-card .icon { font-size: 48px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .premium-card .label { font-size: 15px; font-weight: 900; color: #0f172a; line-height: 1.3; }
        .grid-mobile-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        @media (max-width: 768px) { .premium-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; } .premium-card { padding: 20px 10px; border-radius: 20px; aspect-ratio: 1; } .premium-card .icon { font-size: 40px; margin-bottom: 10px; } .premium-card .label { font-size: 13px; letter-spacing: 0; } .grid-mobile-2 { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .popIn-anim { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="popIn-anim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '50px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <button onClick={handleBack} className="premium-btn" style={{ background: '#f1f5f9', color: '#0f172a', padding: '12px 20px', fontWeight: 800 }}>← {currentModule || dashboardView !== 'main' ? 'Geri Dön' : 'Çıkış Yap'}</button>
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>YÖNETİCİ PANELİ</div>
      </div>

      <div className="fade-in" key={dashboardView + (currentModule || '')}>

        {!currentModule && (
          <div className="premium-grid">
            {dashboardView === 'main' && [
              { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' }, 
              { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
              { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' }, 
              { id: 'yonetim', icon: '👑', label: 'SİSTEM YÖNETİMİ', bg: '#f8fafc' }
            ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="premium-card card-hover" style={{ background: mod.bg || 'white' }}>
                <div className="icon">{mod.icon}</div><div className="label">{mod.label}</div>
              </div>
            ))}
            
            {dashboardView === 'egitim' && [ 
              { id: 'egitim_ders', icon: '📝', label: 'ÖDEV / KİTAP TAKİBİ' }, 
              { id: 'egitim_deneme', icon: '📊', label: 'DENEME SINAVLARI' }, 
              { id: 'egitim_yazili', icon: '💯', label: 'YAZILI HAZIRLIK' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
            
            {dashboardView === 'egitim_ders' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('class_view'); setSelectedSession(cls); }} className="premium-card card-hover"><div className="icon">📝</div><div className="label">{cls}</div></div>))}
            {dashboardView === 'egitim_deneme' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('deneme_view'); setSelectedSession(cls); }} className="premium-card card-hover"><div className="icon">📊</div><div className="label">{cls}</div></div>))}
            {dashboardView === 'egitim_yazili' && (
              <>
                {eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('yazili_view'); setSelectedSession(cls); }} className="premium-card card-hover"><div className="icon">💯</div><div className="label">{cls}</div></div>))}
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><button onClick={() => { if(window.confirm('Tüm sınıfların YAZILI notları sıfırlanacak. Emin misiniz?')) { const updates = {}; roster.forEach(n => updates[`exams/${n}/yazili`] = null); db.ref('mavikent_premium').update(updates); alert('Yazılı notları sıfırlandı!'); } }} className="premium-btn" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '18px', fontSize: '15px' }}>🔄 HAFTALIK YAZILI PERFORMANSLARINI SIFIRLA</button></div>
              </>
            )}

            {dashboardView === 'degerler' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('values_view'); setSelectedSession(lvl); }} className="premium-card card-hover"><div className="icon">🕌</div><div className="label">{lvl}</div></div>))}
            
            {dashboardView === 'isleyis' && [ 
              { id: 'yoklama', icon: '📋', label: 'Yoklama' }, 
              { id: 'telefon', icon: '📱', label: 'Telefon' }, 
              { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' }, 
              { id: 'kanaat', icon: '✍️', label: 'Kanaat Notu' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
            
            {dashboardView === 'yonetim' && [ 
              { id: 'admin_students', icon: '👥', label: 'ÖĞRENCİ / BİLET' }, 
              { id: 'admin_quests', icon: '🎯', label: 'GÖREVLER' }, 
              { id: 'admin_market', icon: '🛒', label: 'MARKET' }, 
              { id: 'admin_teslimat', icon: '📦', label: 'TESLİMAT' }, 
              { id: 'admin_lig', icon: '🏆', label: 'ELİT LİG' }, 
              { id: 'admin_clans', icon: '🚩', label: 'KLANLAR' }, 
              { id: 'admin_codes', icon: '🎟️', label: 'KODLAR' },
              { id: 'admin_chat', icon: '💬', label: 'SOHBET YÖNETİMİ' }, 
              { id: 'admin_settings', icon: '⚙️', label: 'AYARLAR' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
          </div>
        )}

        {/* SOHBET KONTROL MERKEZİ */}
        {currentModule === 'admin_chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '15px' }}>💬 Canlı Meydan Kontrolü</h4>
                  <div className="clean-scroll" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', height: '300px', overflowY: 'auto', padding: '15px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.keys(appData?.global_chat || {}).length === 0 ? <div style={{ textAlign: 'center', color: '#64748b' }}>Sohbet boş.</div> : (
                          Object.keys(appData.global_chat).map(k => {
                              const msg = appData.global_chat[k];
                              return (
                                  <div key={k} style={{ background: 'white', padding: '12px 15px', borderRadius: '12px', borderLeft: `4px solid ${msg.type==='admin' ? '#ef4444' : '#3b82f6'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                          <div style={{ fontSize: '12px', fontWeight: 900, color: msg.type==='admin' ? '#ef4444' : '#0f172a' }}>{msg.s} <span style={{color:'#94a3b8', fontWeight:600}}>- {msg.date}</span></div>
                                          <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>{msg.t}</div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                          <button onClick={() => { if(window.confirm('Mesaj silinsin mi?')) db.ref(`mavikent_premium/global_chat/${k}`).remove(); }} className="premium-btn" style={{ background: '#f1f5f9', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>Sil</button>
                                          {msg.type !== 'admin' && msg.type !== 'system' && <button onClick={() => { if(window.confirm(`${msg.s} adlı öğrenciyi sohbetten banlamak istiyor musun?`)) db.ref(`mavikent_premium/banned_chat/${msg.s}`).set(true); }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '12px' }}>Banla</button>}
                                      </div>
                                  </div>
                              )
                          })
                      )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" value={adminChatInput} onChange={e => setAdminChatInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') sendAdminChat(); }} placeholder="Tüm yurda duyuru/mesaj at..." className="elite-input" style={{ flex: 1 }} />
                      <button onClick={sendAdminChat} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '0 20px', fontWeight: 900 }}>YÖNETİCİ MESAJI</button>
                  </div>
               </div>

               <div style={{ background: '#fef2f2', padding: '30px', borderRadius: '24px', border: '1px solid #fca5a5' }}>
                  <h4 style={{ marginTop: 0, color: '#b91c1c', fontWeight: 900, fontSize: '18px', marginBottom: '15px' }}>⛔ Sohbetten Banlananlar</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.keys(appData?.banned_chat || {}).length === 0 ? <div style={{ color: '#991b1b', fontSize: '14px' }}>Banlı öğrenci yok.</div> : (
                          Object.keys(appData.banned_chat).map(u => (
                              <div key={u} style={{ background: 'white', padding: '12px 15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{u}</div>
                                  <button onClick={() => db.ref(`mavikent_premium/banned_chat/${u}`).remove()} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '6px 12px', fontSize: '12px' }}>Banı Kaldır</button>
                              </div>
                          ))
                      )}
                  </div>
               </div>
            </div>
        )}

        {/* İŞLEYİŞ EKRANLARI */}
        {currentModule === 'yoklama' && !selectedSession && ( 
            <div className="grid-mobile-2">
                {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => ( 
                    <div key={s} onClick={() => setSelectedSession(s)} className="premium-card card-hover"><div className="icon">⏰</div><div className="label">{s}</div></div> 
                ))}
            </div> 
        )}
        
        {currentModule === 'yoklama' && selectedSession && ( 
            <div className="clean-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '15px' }}>
                {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => ( 
                    <button key={s} onClick={() => setSelectedSession(s)} className="premium-btn" style={{ padding: '14px 24px', background: selectedSession === s ? '#0f172a' : 'white', color: selectedSession === s ? '#d4af37' : '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>{s}</button> 
                ))}
            </div> 
        )}
        
        {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'kanaat'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
        
        {/* EĞİTİM VE DEĞERLER EKRANLARI */}
        {currentModule === 'class_view' && renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_ders')}
        {currentModule === 'deneme_view' && renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_deneme')}
        {currentModule === 'yazili_view' && renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_yazili')}
        
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
          </>
        )}

        {/* HEDİYE KODU MERKEZİ */}
        {currentModule === 'admin_codes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 20px rgba(16,185,129,0.3)' }}>
                 <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🎁 Hediye Kodu Üret</h3>
                 <p style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Öğrencilere M-Coin veya süreli indirim sağlayan şifreler oluşturun.</p>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <input type="text" value={newGiftCode.code} onChange={e => setNewGiftCode({...newGiftCode, code: e.target.value})} placeholder="Kod Adı (Örn: BAYRAM50)" className="elite-input" style={{ textTransform: 'uppercase' }} />
                    <select value={newGiftCode.type} onChange={e => setNewGiftCode({...newGiftCode, type: e.target.value})} className="elite-input">
                        <option value="mcoin">🪙 M-Coin Ver</option>
                        <option value="discount">🔥 % İndirim Ver (7 Gün)</option>
                    </select>
                    <input type="number" value={newGiftCode.val} onChange={e => setNewGiftCode({...newGiftCode, val: e.target.value})} placeholder="Miktar / Yüzde" className="elite-input" />
                    <input type="number" value={newGiftCode.uses} onChange={e => setNewGiftCode({...newGiftCode, uses: e.target.value})} placeholder="Kaç Kez Kullanılabilir?" className="elite-input" />
                    <button onClick={handleAdminCreateGiftCode} className="premium-btn" style={{ background: '#0f172a', color: 'white', gridColumn: '1 / -1', padding: '16px' }}>KODU YAYINLA</button>
                 </div>
             </div>

             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '15px' }}>📋 Üretilmiş Tüm Kodlar ve Kullanım Durumu</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.keys(appData?.gift_codes || {}).length === 0 && <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '14px' }}>Henüz kod üretilmedi.</div>}
                    {Object.keys(appData?.gift_codes || {}).map(k => {
                        const code = appData.gift_codes[k];
                        const usedCount = Object.keys(code.usedBy || {}).length;
                        const remaining = (code.uses || 1) - usedCount;
                        const isFinished = remaining <= 0;
                        return (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isFinished ? '#fef2f2' : '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: `1px solid ${isFinished ? '#fca5a5' : '#e2e8f0'}` }}>
                                <div>
                                   <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', letterSpacing: '1px' }}>{k}</div>
                                   <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                                       {code.type === 'mcoin' ? `🪙 ${code.val} M-Coin` : `🔥 %${code.val} İndirim`}
                                   </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                   <div style={{ fontSize: '14px', fontWeight: 900, color: isFinished ? '#ef4444' : '#10b981' }}>{usedCount} / {code.uses || 1} KULLANILDI</div>
                                   <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, background: '#e2e8f0', padding: '2px 8px', borderRadius: '8px' }}>{Math.max(0, remaining)} ADET KALDI</div>
                                </div>
                                <button onClick={() => { if(window.confirm("Bu kod tamamen silinsin mi?")) db.ref(`mavikent_premium/gift_codes/${k}`).remove(); }} className="premium-btn" style={{ background: '#f1f5f9', color: '#ef4444', padding: '10px 15px' }}>🗑️ SİL</button>
                            </div>
                        )
                    })}
                 </div>
             </div>
          </div>
        )}

        {/* ÖĞRENCİ YÖNETİMİ VE BİLET */}
        {currentModule === 'admin_students' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Yeni Öğrenci Adı Soyadı" className="elite-input" style={{ flex: 1 }} />
              <button onClick={() => { if(newStudentName) db.ref('mavikent_premium/roster').set([...roster, newStudentName.trim()]); setNewStudentName(''); }} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '0 24px' }}>EKLE</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roster.map(name => {
                const creds = appData?.student_credentials?.[name] || { username: '', password: '' };
                return (
                <div key={name} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '24px' }}>
                  <div style={{ fontWeight: 900, fontSize: '15px', width: '100%', marginBottom: '16px', color:'#0f172a' }}>
                     {isElite(name)?'👑 ':''}{name} 
                     <span style={{ color: '#3b82f6', marginLeft: '12px' }}>🪙 {appData?.wallet?.[name] || 0} M</span>
                     <span style={{ color: '#f59e0b', marginLeft: '12px' }}>⭐ {appData?.xp?.[name] || 0} XP</span>
                     <span style={{ color: '#10b981', marginLeft: '12px' }}>⚔️ {appData?.season_score?.[name] || 0} RP</span>
                     <span style={{ color: '#8b5cf6', marginLeft: '12px' }}>🎟️ {appData?.tickets?.[name] || 0} BİLET</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                    <input type="text" placeholder="Kullanıcı" value={creds.username || ''} onChange={e => db.ref(`mavikent_premium/student_credentials/${name}/username`).set(e.target.value)} className="elite-input" style={{ padding: '12px 16px', fontSize: '13px', width: '110px' }} />
                    <input type="text" placeholder="Şifre" value={creds.password || ''} onChange={e => db.ref(`mavikent_premium/student_credentials/${name}/password`).set(e.target.value)} className="elite-input" style={{ padding: '12px 16px', fontSize: '13px', width: '90px' }} />
                    <select onChange={e => db.ref(`mavikent_premium/student_classes/${name}`).set(e.target.value)} value={appData?.student_classes?.[name] || ''} className="elite-input" style={{ padding: '12px 16px', fontSize: '13px', width: '110px' }}>
                      <option value="">Sınıf Seç</option>{classList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    <button onClick={() => { 
                        const val = prompt(`${name} M:`, appData?.wallet?.[name] || 0); 
                        if(val !== null) { 
                            const diff = parseInt(val) - (appData?.wallet?.[name] || 0);
                            db.ref(`mavikent_premium/wallet/${name}`).set(parseInt(val)); 
                            if(diff !== 0) db.ref(`mavikent_premium/transactions/${name}`).push({ desc: 'Yönetici Bakiye Düzenlemesi', amt: diff, date: new Date().toLocaleString('tr-TR') });
                        } 
                    }} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '10px 16px' }}>M</button>
                    
                    <button onClick={() => { const val = prompt(`${name} XP:`, appData?.xp?.[name] || 0); if(val) db.ref(`mavikent_premium/xp/${name}`).set(parseInt(val)); }} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '10px 16px' }}>XP</button>
                    <button onClick={() => { const val = prompt(`${name} RP:`, appData?.season_score?.[name] || 0); if(val) db.ref(`mavikent_premium/season_score/${name}`).set(parseInt(val)); }} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '10px 16px' }}>RP</button>
                    <button onClick={() => { const val = prompt(`${name} Bilet:`, appData?.tickets?.[name] || 0); if(val !== null) db.ref(`mavikent_premium/tickets/${name}`).set(parseInt(val)); }} className="premium-btn" style={{ background: '#8b5cf6', color: 'white', padding: '10px 16px' }}>🎟️ BİLET</button>
                    <button onClick={() => { if(window.confirm('Silinsin mi?')) db.ref('mavikent_premium/roster').set(roster.filter(n => n !== name)); }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 16px' }}>SİL</button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* MARKET YÖNETİMİ VE İHALE */}
        {currentModule === 'admin_market' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             
             {/* İHALE (AÇIK ARTIRMA) PANELİ */}
             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>🔨 HAFTALIK İHALE (AÇIK ARTIRMA)</h4>
                {appData?.auction?.active ? (
                    <div style={{ background: '#fefce8', border: '1px solid #fde047', padding: '20px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#b45309' }}>Yayındaki İhale: {appData.auction.item}</div>
                        <div style={{ fontSize: '14px', color: '#854d0e', marginTop: '5px', fontWeight: 700 }}>En Yüksek Teklif: {appData.auction.currentBid} M ({appData.auction.highestBidder || 'Henüz teklif yok'})</div>
                        <button onClick={handleEndAuction} className="premium-btn" style={{ background: '#ef4444', color: 'white', marginTop: '15px', padding: '12px 20px', width: '100%' }}>İHALEYİ BİTİR & TESLİM ET</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                        <input type="text" id="aucItem" placeholder="İhale Ürünü (Örn: Sınırsız Ev İzni)" className="elite-input" style={{ gridColumn: '1 / -1' }} />
                        <input type="number" id="aucPrice" placeholder="Başlangıç (M)" className="elite-input" />
                        <button onClick={handleStartAuction} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '16px' }}>İHALEYİ BAŞLAT</button>
                    </div>
                )}
             </div>

             {/* İMECE (KİTLE FONLAMA) PANELİ */}
             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>🤝 İMECE (ORTAK ALIM) OLUŞTUR</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <input type="text" value={newGroupBuy.name} onChange={e => setNewGroupBuy({...newGroupBuy, name: e.target.value})} placeholder="Örn: Tüm Yurda Çiğköfte" className="elite-input" style={{ gridColumn: '1 / -1' }} />
                    <input type="number" value={newGroupBuy.totalCost} onChange={e => setNewGroupBuy({...newGroupBuy, totalCost: e.target.value})} placeholder="Toplam Maliyet (M)" className="elite-input" />
                    <input type="number" value={newGroupBuy.maxP} onChange={e => setNewGroupBuy({...newGroupBuy, maxP: e.target.value})} placeholder="Kaç Kişi Ortak Olacak?" className="elite-input" />
                    <button onClick={handleCreateGroupBuy} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '16px' }}>İMECE BAŞLAT</button>
                </div>
             </div>

             <div style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
               <h4 style={{ marginTop: 0, color:'#0f172a', fontSize: '18px', fontWeight: 900 }}>{editProductKey ? '✏️ ÜRÜNÜ GÜNCELLE' : '📦 YENİ ÜRÜN EKLE'}</h4>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px', background:'#f8fafc', padding:'20px', borderRadius:'24px' }}>
                 <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Adı" className="elite-input" style={{ width: '100%' }} />
                 <input value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" placeholder="Fiyat (M)" className="elite-input" style={{ width: '100%' }} />
                 <input value={newProduct.icon} onChange={e => setNewProduct({...newProduct, icon: e.target.value})} placeholder="Emoji (📦)" className="elite-input" style={{ width: '100%', textAlign: 'center' }} />
                 <input value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} type="number" placeholder="Stok Adedi (Boş = Sınırsız)" className="elite-input" style={{ width: '100%' }} />
                 <select value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} className="elite-input" style={{ width: '100%' }}>
                   <option value="normal">🍔 Normal Ürün</option>
                   <option value="ticket">🎟️ Çekiliş Bileti</option>
                   <option value="bundle">🎁 Paket (Bundle Fırsatı)</option>
                   <option value="gift">🎁 Arkadaşa Hediye Ürünü</option>
                   <option value="avatar">👤 Profil Avatarı</option>
                   <option value="multiplier">⚡ 2X Puan Kartı</option>
                   <option value="streak">🛡️ Haftalık Seri Kalkanı</option>
                   <option value="title">🎖️ Profil Ünvanı</option>
                   <option value="frame">🖼️ Avatar Çerçevesi</option>
                 </select>

                 {/* EĞER PAKET SEÇİLİRSE ALTTA SEÇENEKLER ÇIKAR */}
                 {newProduct.type === 'bundle' && (
                     <div style={{ gridColumn: '1 / -1', background: 'white', padding: '15px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                         <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Paket İçeriğini Seçin (Mevcut Ürünler):</div>
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                             {Object.keys(appData?.market_products || {}).filter(k => appData.market_products[k].type !== 'bundle').map(k => {
                                 const p = appData.market_products[k];
                                 const isSelected = bundleSelection.includes(p.n);
                                 return (
                                     <div key={k} onClick={() => setBundleSelection(isSelected ? bundleSelection.filter(n => n !== p.n) : [...bundleSelection, p.n])} style={{ background: isSelected ? '#10b981' : '#f1f5f9', color: isSelected ? 'white' : '#64748b', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                                         {p.i} {p.n}
                                     </div>
                                 )
                             })}
                         </div>
                     </div>
                 )}

                 <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
                    <button onClick={handleAddProduct} className="premium-btn" style={{ flex: 1, background: editProductKey ? '#f59e0b' : '#10b981', color: 'white', padding: '16px' }}>{editProductKey ? 'KAYDET' : 'EKLE'}</button>
                    {editProductKey && <button onClick={() => { setEditProductKey(null); setNewProduct({ name: '', price: '', icon: '📦', type: 'normal', stock: '' }); setBundleSelection([]); }} className="btn-iptal" style={{ padding: '16px 24px' }}>İPTAL</button>}
                 </div>
               </div>
               <h4 style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', margin: '0 0 16px 0', fontSize: '18px', fontWeight: 900 }}>MEVCUT ÜRÜNLER VE STOKLAR</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {Object.keys(appData?.market_products || {}).map(key => {
                   const p = appData.market_products[key];
                   const stockText = p.stock !== undefined ? (p.stock > 0 ? `${p.stock} Kaldı` : 'TÜKENDİ') : 'Sınırsız';
                   return (
                     <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: p.stock === 0 ? '#fef2f2' : '#f8fafc', borderRadius: '20px', border: `1px solid ${p.stock === 0 ? '#fca5a5' : '#e2e8f0'}` }}>
                       <div>
                           <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>{p.i} {p.n} <span style={{ color: '#64748b' }}>({p.p} M)</span></div>
                           <div style={{ fontSize: '12px', fontWeight: 800, color: p.stock === 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>Stok: {stockText} | Tür: {p.type === 'bundle' ? 'Paket' : p.type}</div>
                           {p.type === 'bundle' && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>İçerik: {(p.bundleItems||[]).join(', ')}</div>}
                       </div>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button onClick={() => editProduct(key, p)} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '12px 18px' }}>✏️</button>
                         <button onClick={() => { if(window.confirm('Silinsin mi?')) db.ref(`mavikent_premium/market_products/${key}`).remove() }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '12px 18px' }}>🗑️</button>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        )}

        {/* TESLİMAT YÖNETİMİ */}
        {currentModule === 'admin_teslimat' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
             <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
               <button onClick={() => setDeliveryTab('wait')} className="premium-btn" style={{ flex: 1, padding: '16px', background: deliveryTab === 'wait' ? '#0f172a' : '#f1f5f9', color: deliveryTab === 'wait' ? 'white' : '#64748b', fontSize: '15px' }}>BEKLEYENLER</button>
               <button onClick={() => setDeliveryTab('done')} className="premium-btn" style={{ flex: 1, padding: '16px', background: deliveryTab === 'done' ? '#10b981' : '#f1f5f9', color: deliveryTab === 'done' ? 'white' : '#64748b', fontSize: '15px' }}>ONAYLANMIŞ</button>
             </div>

             {deliveryTab === 'wait' && Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].st === 'wait').length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', background: '#fefce8', padding: '15px', borderRadius: '16px', border: '1px dashed #fde047' }}>
                   <div style={{ width: '100%', fontSize: '13px', fontWeight: 900, color: '#b45309', marginBottom: '8px' }}>⚡ TOPLU İŞLEMLER (Tüm Bekleyenler)</div>
                   <button onClick={() => handleBulkDeliveryAction('approve')} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '10px 15px', fontSize: '12px', flex: 1 }}>✅ TÜMÜNÜ ONAYLA</button>
                   <button onClick={() => handleBulkDeliveryAction('refund')} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '10px 15px', fontSize: '12px', flex: 1 }}>💰 TÜMÜNÜ İPTAL ET (İADELİ)</button>
                   <button onClick={() => handleBulkDeliveryAction('delete')} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 15px', fontSize: '12px', flex: 1 }}>🗑️ TÜMÜNÜ SİL (İADESİZ)</button>
                </div>
             )}

             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].st === deliveryTab).map(k => {
                 const item = appData.deliveries[k];
                 const isLottery = item.i && item.i.includes("(Çekiliş)");
                 const isScratch = item.i && item.i.includes("(Kazı Kazan)");
                 const isBox = item.n && item.n.includes("(Kutudan)");
                 let badgeText = isLottery ? '🎰 ÇEKİLİŞ' : isScratch ? '🪙 KAZI KAZAN' : isBox ? '🎁 KUTU' : '🛍️ MARKET';
                 let badgeColor = isLottery ? '#8b5cf6' : isScratch ? '#059669' : isBox ? '#f59e0b' : '#3b82f6';
                 
                 return (
                   <div key={k} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '20px', borderLeft: `6px solid ${badgeColor}` }}>
                     <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                           <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>{item.s}</span>
                           <span style={{ background: badgeColor, color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>{badgeText}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>
                           📦 {(item.n || item.i || '').replace('(Çekiliş)','').replace('(Kazı Kazan)','').replace('(Kutudan Çıktı)','')}
                        </div>
                     </div>
                     
                     {deliveryTab === 'wait' ? (
                         <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={() => db.ref(`mavikent_premium/deliveries/${k}/st`).set('done')} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '10px 15px', fontSize: '12px' }}>✅ ONAYLA</button>
                            <button onClick={() => handleCancelDelivery(k, item, true)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '10px 15px', fontSize: '12px' }}>💰 İPTAL & İADE</button>
                            <button onClick={() => handleCancelDelivery(k, item, false)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 15px', fontSize: '12px' }}>🗑️ İADESİZ SİL</button>
                         </div>
                     ) : (
                         <button onClick={() => db.ref(`mavikent_premium/deliveries/${k}/st`).set('wait')} className="premium-btn" style={{ background: '#64748b', color: 'white', padding: '10px 15px', fontSize: '12px' }}>GERİ AL</button>
                     )}
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {/* GÖREV YÖNETİMİ */}
        {currentModule === 'admin_quests' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[1, 2, 3].map(num => {
                 const qId = `q${num}`; const parts = appData?.quests?.[qId]?.participants || [];
                 return (
                   <div key={qId} style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                     <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '16px', fontSize: '18px' }}>GÖREV {num}</div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                       <input value={questInputs[`${qId}_text`]} onChange={e => setQuestInputs({...questInputs, [`${qId}_text`]: e.target.value})} placeholder="Örn: 50 Soru Çöz" className="elite-input" style={{ gridColumn: '1 / -1' }} />
                       <input value={questInputs[`${qId}_amt`]} onChange={e => setQuestInputs({...questInputs, [`${qId}_amt`]: e.target.value})} type="number" placeholder="Ödül" className="elite-input" />
                       <select value={questInputs[`${qId}_type`]} onChange={e => setQuestInputs({...questInputs, [`${qId}_type`]: e.target.value})} className="elite-input">
                          <option value="M">M-Coin</option><option value="RP">RP Puanı</option>
                       </select>
                     </div>
                     <div style={{ display: 'flex', gap: '12px' }}>
                       <button onClick={() => { db.ref(`mavikent_premium/quests/${qId}`).update({ text: questInputs[`${qId}_text`], amt: questInputs[`${qId}_amt`], type: questInputs[`${qId}_type`] }); alert("Görev Yayınlandı!"); }} className="premium-btn" style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '16px' }}>YAYINLA</button>
                       <button onClick={() => completeQuest(qId)} className="premium-btn" style={{ flex: 1, background: '#10b981', color: 'white', padding: '16px' }}>✅ BİTİR ({parts.length})</button>
                     </div>
                   </div>
                 )
              })}
           </div>
        )}

        {/* LİG YÖNETİMİ */}
        {currentModule === 'admin_lig' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fffbeb', border: '2px solid #fde047', padding: '30px', borderRadius: '24px' }}>
               <h4 style={{ color: '#b45309', marginTop: 0, fontWeight: 900, fontSize: '18px' }}>👑 ELİT LİG (Terfi Alanlar)</h4>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                 {roster.filter(isElite).map(n => <div key={n} onClick={() => db.ref(`mavikent_premium/student_tiers/${n}`).set('standard')} className="premium-hover" style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, color:'#92400e', cursor: 'pointer' }}>{n} 👑</div>)}
               </div>
            </div>
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
               <h4 style={{ color: '#0f172a', marginTop: 0, fontWeight: 900, fontSize: '18px' }}>🎯 STANDART LİG (Adaylar)</h4>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                 {roster.filter(n => !isElite(n)).map(n => <div key={n} onClick={() => db.ref(`mavikent_premium/student_tiers/${n}`).set('elite')} className="premium-hover" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, color:'#334155', cursor: 'pointer' }}>{n} ⬆️</div>)}
               </div>
            </div>
          </div>
        )}

        {/* KLAN YÖNETİMİ */}
        {currentModule === 'admin_clans' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', padding: '30px', borderRadius: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(245,158,11,0.3)', flexWrap: 'wrap', gap: '15px' }}>
                 <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🚩 KLAN YÖNETİMİ</h3>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Savaşı bitir ve şampiyon klana 60'ar M-Coin dağıt.</p>
                 </div>
                 <button onClick={handleEndClanWar} className="premium-btn" style={{ background: 'white', color: '#b45309', padding: '16px 24px', fontWeight: 900 }}>🏆 SAVAŞI BİTİR & ÖDÜL DAĞIT</button>
              </div>

              <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>➕ Yeni Klan Oluştur</h4>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <input type="text" value={newAdminClan.icon} onChange={e => setNewAdminClan({...newAdminClan, icon: e.target.value})} placeholder="🛡️" className="elite-input" style={{ width: '70px', textAlign: 'center' }} maxLength="2" />
                    <input type="text" value={newAdminClan.name} onChange={e => setNewAdminClan({...newAdminClan, name: e.target.value})} placeholder="Klan Adı" className="elite-input" />
                    <input type="text" value={newAdminClan.tag} onChange={e => setNewAdminClan({...newAdminClan, tag: e.target.value})} placeholder="TAG (Örn: BJK)" className="elite-input" />
                    <select value={newAdminClan.leader} onChange={e => setNewAdminClan({...newAdminClan, leader: e.target.value})} className="elite-input">
                        <option value="">Lider Seç</option>{roster.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button onClick={handleAdminCreateClan} className="premium-btn" style={{ background: '#3b82f6', color: 'white' }}>KUR</button>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                 {Object.keys(appData?.clans || {}).length === 0 && <div style={{ color: '#64748b', fontWeight: 700, padding: '20px' }}>Sistemde aktif klan bulunmuyor.</div>}
                 {Object.keys(appData?.clans || {}).map((cId) => {
                    const c = appData.clans[cId];
                    let warScore = 0;
                    (c.members || []).forEach(m => { if(appData?.clan_war_participants?.[m]) warScore += Number(appData?.season_score?.[m] || 0); });
                    return (
                        <div key={cId} style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '30px' }}>{c.icon}</span><div><div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{c.name} <span style={{fontSize:'12px', background:'#f1f5f9', padding:'2px 6px', borderRadius:'6px'}}>{c.tag}</span></div><div style={{fontSize:'12px', color:'#64748b', fontWeight:700}}>Savaş Puanı: {warScore}</div></div></div>
                              <button onClick={() => handleAdminDeleteClan(cId)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 16px', fontSize: '12px' }}>SİL</button>
                           </div>
                           <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', fontWeight: 600, background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                              <span style={{ color: '#0f172a', fontWeight: 800 }}>Üyeler:</span> {(c.members || []).join(', ') || 'Yok'}
                           </div>
                        </div>
                    )
                 })}
              </div>
           </div>
        )}

        {/* AYARLAR YÖNETİMİ (OTOMATİK BORSA / ENFLASYON SIFIRLAMA EKLENDİ) */}
        {currentModule === 'admin_settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', gridColumn: '1 / -1' }}>
               <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '8px' }}>⚡ SİSTEM ETKİNLİKLERİ</h4>
               <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Tüm yurtta aynı anda devreye girecek etkinlikler ve manuel bilet dağıtımı.</p>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <button onClick={() => { db.ref('mavikent_premium/settings/global_event').set('2x_xp'); alert("Tüm yurt için 2X XP aktif edildi!"); }} className="premium-btn" style={{ background: appData?.settings?.global_event === '2x_xp' ? '#10b981' : '#f8fafc', color: appData?.settings?.global_event === '2x_xp' ? 'white' : '#64748b', border: appData?.settings?.global_event === '2x_xp' ? 'none' : '2px solid #e2e8f0' }}>⭐ TÜM YURT 2X ÇARPAN</button>
                  <button onClick={() => { db.ref('mavikent_premium/settings/global_event').set('none'); alert("Etkinlikler durduruldu."); }} className="premium-btn" style={{ background: appData?.settings?.global_event === 'none' || !appData?.settings?.global_event ? '#ef4444' : '#f8fafc', color: appData?.settings?.global_event === 'none' || !appData?.settings?.global_event ? 'white' : '#64748b', border: appData?.settings?.global_event === 'none' || !appData?.settings?.global_event ? 'none' : '2px solid #e2e8f0' }}>🚫 ETKİNLİKLERİ BİTİR</button>
                  <button onClick={() => { if(window.confirm('Tüm öğrencilere anında 1 adet Şans Çarkı Bileti hediye edilecek. Onaylıyor musun?')) { const updates = {}; roster.forEach(n => { updates[`tickets/${n}`] = (Number(appData?.tickets?.[n]) || 0) + 1; }); db.ref('mavikent_premium').update(updates); alert('🎟️ Biletler başarıyla dağıtıldı!'); } }} className="premium-btn" style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '15px' }}>🎟️ HERKESE 1 BİLET DAĞIT</button>
                  
                  {/* KİŞİSEL ENFLASYONU (BORSA) SIFIRLAMA BUTONU */}
                  <button onClick={() => { if(window.confirm('Tüm öğrencilerin kişisel enflasyonları sıfırlanacak. Ürün fiyatları ana fiyata dönecek. Emin misiniz?')) { db.ref('mavikent_premium/personal_inflation').set(null); alert('Enflasyon sıfırlandı!'); } }} className="premium-btn" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '15px' }}>🔄 KİŞİSEL ENFLASYONLARI SIFIRLA</button>
               </div>
             </div>

             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>📢 DUYURU MERKEZİ</h4>
                 <input value={settingsInputs.news_ticker} onChange={e => setSettingsInputs({...settingsInputs, news_ticker: e.target.value})} placeholder="Kayan Şerit Duyurusu..." className="elite-input" style={{ marginBottom: '12px' }} />
                 <input value={settingsInputs.ann1} onChange={e => setSettingsInputs({...settingsInputs, ann1: e.target.value})} placeholder="Siyah Kutu Duyurusu" className="elite-input" style={{ marginBottom: '12px' }} />
                 <input value={settingsInputs.ann2} onChange={e => setSettingsInputs({...settingsInputs, ann2: e.target.value})} placeholder="Beyaz Kutu Duyurusu" className="elite-input" style={{ marginBottom: '20px' }} />
                 <button onClick={() => { db.ref('mavikent_premium/settings/news_ticker').set(settingsInputs.news_ticker); db.ref('mavikent_premium/settings/ann1').set(settingsInputs.ann1); db.ref('mavikent_premium/settings/ann2').set(settingsInputs.ann2); alert('Duyurular Kaydedildi!'); }} className="premium-btn" style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white' }}>DUYURULARI KAYDET</button>
             </div>
             
             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
               <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>🎨 TEMA VE ŞİFRE</h4>
               <select value={settingsInputs.active_theme} onChange={e => setSettingsInputs({...settingsInputs, active_theme: e.target.value})} className="elite-input" style={{ marginBottom: '16px' }}>
                 <option value="default">🍎 Apple Premium (Varsayılan)</option><option value="osmanli">🏹 Osmanlı / Diriliş</option><option value="uzay">🚀 Uzay Çağı / Galaksi</option><option value="espor">🎮 Siber E-Spor</option><option value="futbol">⚽ Şampiyon Ligi</option><option value="teknoloji">💻 Teknoloji Devi / Cyber</option>
               </select>
               <input value={settingsInputs.admin_pin} onChange={e => setSettingsInputs({...settingsInputs, admin_pin: e.target.value})} placeholder="Yönetici Şifresi" className="elite-input" style={{ marginBottom: '12px' }} />
               <input value={settingsInputs.staff_pin} onChange={e => setSettingsInputs({...settingsInputs, staff_pin: e.target.value})} placeholder="Personel Şifresi" className="elite-input" style={{ marginBottom: '20px' }} />
               <button onClick={() => { db.ref('mavikent_premium/settings/active_theme').set(settingsInputs.active_theme); db.ref('mavikent_premium/settings/admin_pin').set(settingsInputs.admin_pin); db.ref('mavikent_premium/settings/staff_pin').set(settingsInputs.staff_pin); alert('Ayarlar başarıyla güncellendi!'); }} className="premium-btn" style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white' }}>KAYDET</button>
             </div>

             <div style={{ background: '#fef2f2', padding: '30px', borderRadius: '24px', border: '1px solid #fecaca' }}>
               <h4 style={{ marginTop: 0, color: '#b91c1c', fontWeight: 900, fontSize: '18px' }}>⛔ YASAKLI CİHAZ YÖNETİMİ</h4>
               <p style={{fontSize:'13px', color:'#991b1b', marginBottom:'20px', fontWeight:600}}>3 kez hatalı şifre girdiği için engellenen cihazların listesi.</p>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }} className="clean-scroll">
                   {Object.keys(appData?.banned_devices || {}).length === 0 && <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '14px', textAlign: 'center', padding: '10px' }}>Şu an engelli cihaz yok.</div>}
                   {Object.keys(appData?.banned_devices || {}).map(ip => (
                       <div key={ip} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fca5a5' }}>
                           <div>
                              <div style={{ fontWeight: 900, color: '#b91c1c', fontSize: '14px' }}>Cihaz ID / IP:</div>
                              <div style={{ fontSize: '12px', color: '#475569', wordBreak: 'break-all', marginTop: '2px' }}>{ip}</div>
                           </div>
                           <button onClick={() => db.ref(`mavikent_premium/banned_devices/${ip}`).remove()} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '8px 16px', fontSize: '12px' }}>Kaldır</button>
                       </div>
                   ))}
               </div>

               <button onClick={() => { if(window.confirm('Tüm cihaz engelleri kaldırılacak. Emin misiniz?')) { db.ref('mavikent_premium/banned_devices').set(null); alert('Tüm engeller kaldırıldı!'); } }} className="premium-btn" style={{ width: '100%', padding: '16px', background: 'transparent', color: '#ef4444', border: '2px solid #ef4444 !important' }}>TÜM ENGELLERİ KALDIR</button>
             </div>
          </div>
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
                      <div key={lesson} onClick={() => setEduData(prev => ({...prev, lessons: isChecked ? (prev.lessons || []).filter(l => l !== lesson) : [...(prev.lessons || []), lesson]}))} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: isChecked ? '#ecfdf5' : 'white', borderRadius: '20px', marginBottom: '12px', fontSize: '15px', fontWeight: 800, color: isChecked ? '#047857' : '#334155', border: `2px solid ${isChecked ? '#10b981' : '#e2e8f0'}`, cursor: 'pointer' }}>
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

export default AdminScreen;