import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';

const AdminScreen = ({ appData, goBackToRoles }) => {
  const [dashboardView, setDashboardView] = useState('main'); 
  const [currentModule, setCurrentModule] = useState(null); 
  
  const [hygieneTab, setHygieneTab] = useState('wc'); 
  const [hygieneForm, setHygieneForm] = useState({ areaId: '', score: 5, note: '' });
  const [generalCleaningList, setGeneralCleaningList] = useState({}); 
  const [isHygieneSaving, setIsHygieneSaving] = useState(false);
  const [wcEditMode, setWcEditMode] = useState(false);
  const [tempWcData, setTempWcData] = useState({});
  const [roomEditMode, setRoomEditMode] = useState(false);
  const [tempRoomData, setTempRoomData] = useState({});
  const [roomForm, setRoomForm] = useState({ areaId: '', score: 5, note: '' });

  // Kayıtlı görev yerlerini veritabanından çekip listeye doldurur
  useEffect(() => {
    if (appData?.hygiene_assignments) {
      const savedTasks = {};
      Object.entries(appData.hygiene_assignments).forEach(([name, area]) => {
        // Sadece hala listede (roster) olan öğrencileri getirir
        if (roster.includes(name)) {
          savedTasks[name] = { area: area, score: (generalCleaningList[name]?.score || 0) };
        }
      });
      setGeneralCleaningList(prev => ({ ...prev, ...savedTasks }));
    }
  }, [appData?.hygiene_assignments, appData?.roster]);

  const getCoinImpact = (score) => {
      if (score === 5) return 30;
      if (score === 4) return 20;
      if (score === 3) return 10;
      if (score === 2) return -30;
      if (score === 1) return -60;
      return 0;
  };

  const saveInspection = async () => {
      if(!hygieneForm.areaId) return alert("Lütfen bir alan seçin!");
      setIsHygieneSaving(true);
      const area = appData.hygiene_areas?.[hygieneForm.areaId];
      const responsibles = area?.responsibles || [];
      const coinImpact = getCoinImpact(hygieneForm.score);
      const updates = {};
      const logId = `hyg_${Date.now()}`;
      
      updates[`hygiene_logs/${logId}`] = {
          ...hygieneForm, areaName: area?.name || 'Bilinmeyen Alan',
          responsibles: responsibles, timestamp: Date.now(),
          inspector: "Yönetici", coinImpact, type: 'wc'
      };

      responsibles.forEach(studentId => {
          updates[`wallet/${studentId}`] = (Number(appData?.wallet?.[studentId]) || 0) + coinImpact;
          updates[`transactions/${studentId}/txn_hyg_${Date.now()}`] = { 
              desc: `${area?.name || 'Alan'} WC Denetimi`, amt: coinImpact, date: new Date().toLocaleString('tr-TR') 
          };
      });

      try {
          await db.ref('mavikent_premium').update(updates);
          alert(`✅ Denetim kaydedildi! ${coinImpact > 0 ? '+' : ''}${coinImpact} M-Coin yansıtıldı.`);
          setHygieneForm({ areaId: '', score: 5, note: '' });
      } catch (e) { alert("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
  };

  // SADECE TEMİZLİK GÖREV YERLERİNİ KAYDEDER (PUAN VERMEZ)
  const saveCleaningTasks = async () => {
    const tasks = {};
    Object.entries(generalCleaningList).forEach(([name, data]) => {
      if (data.area) tasks[name] = data.area;
    });
    try {
      await db.ref('mavikent_premium/hygiene_assignments').set(tasks);
      alert("✅ Temizlik görev yerleri başarıyla kaydedildi!");
    } catch (e) { alert("Hata oluştu!"); }
  };

  const openWcEditMode = () => {
      const initial = {};
      for(let i=1; i<=6; i++) {
          const key = `wc_${i}`;
          const existingRoster = appData?.hygiene_areas?.[key]?.responsibles || [];
          const validStudents = existingRoster.filter(s => roster.includes(s)); 
          initial[key] = { name: `${i} Numaralı Tuvalet`, type: 'wc', responsibles: validStudents };
      }
      setTempWcData(initial);
      setWcEditMode(true);
  };

  const saveWcAssignments = async () => {
      try {
          await db.ref('mavikent_premium/hygiene_areas').update(tempWcData);
          alert("✅ WC Nöbetçileri Kaydedildi!");
          setWcEditMode(false);
      } catch(e) { alert("Hata!"); }
  };

  const getRoomCoinImpact = (score) => {
      if (score === 5) return 50;
      if (score === 4) return 40;
      if (score === 3) return 30;
      if (score === 2) return -10;
      if (score === 1) return -20;
      return 0;
  };

  const openRoomEditMode = () => {
      const initial = {};
      for(let i=1; i<=10; i++) {
          const key = `room_${i}`;
          const existing = appData?.room_areas?.[key] || { name: `${i}. Oda`, responsibles: [] };
          const validStudents = (existing.responsibles || []).filter(s => roster.includes(s));
          initial[key] = { ...existing, responsibles: validStudents };
      }
      setTempRoomData(initial);
      setRoomEditMode(true);
  };

  const saveRoomAssignments = async () => {
      try {
          await db.ref('mavikent_premium/room_areas').update(tempRoomData);
          alert("✅ Oda İsimleri ve Öğrencileri Kaydedildi!");
          setRoomEditMode(false);
      } catch(e) { alert("Hata!"); }
  };

  const saveRoomInspection = async () => {
      if(!roomForm.areaId) return alert("Lütfen bir oda seçin!");
      setIsHygieneSaving(true);
      const area = appData.room_areas?.[roomForm.areaId];
      const responsibles = area?.responsibles || [];
      const coinImpact = getRoomCoinImpact(roomForm.score);
      const updates = {};
      const logId = `room_${Date.now()}`;
      
      updates[`hygiene_logs/${logId}`] = {
          ...roomForm, areaName: area?.name || 'Bilinmeyen Oda',
          responsibles: responsibles, timestamp: Date.now(),
          inspector: "Yönetici", coinImpact, type: 'room'
      };

      responsibles.forEach(studentId => {
          updates[`wallet/${studentId}`] = (Number(appData?.wallet?.[studentId]) || 0) + coinImpact;
          updates[`transactions/${studentId}/txn_room_${Date.now()}_${Math.floor(Math.random()*1000)}`] = { 
              desc: `${area?.name || 'Oda'} Denetimi`, amt: coinImpact, date: new Date().toLocaleString('tr-TR') 
          };
      });

      try {
          await db.ref('mavikent_premium').update(updates);
          alert(`✅ Oda denetimi kaydedildi! Odadaki öğrencilere ${coinImpact > 0 ? '+' : ''}${coinImpact} M-Coin yansıtıldı.`);
          setRoomForm({ areaId: '', score: 5, note: '' });
      } catch (e) { alert("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
  };

  const [selectedSession, setSelectedSession] = useState(''); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null); 

  const [eduData, setEduData] = useState({ lessons: [], pages: 0, questions: 0 });
  const [examData, setExamData] = useState({}); 
  const [valuesTopic, setValuesTopic] = useState({ subject: '', topic: '' });
  const [deliveryTab, setDeliveryTab] = useState('wait'); 

  const [settingsInputs, setSettingsInputs] = useState({ 
      news_ticker: appData?.settings?.news_ticker || '', ann1: appData?.settings?.ann1 || '', ann2: appData?.settings?.ann2 || '', 
      active_theme: appData?.settings?.active_theme || 'default', admin_pin: appData?.settings?.admin_pin || '1507', staff_pin: appData?.settings?.staff_pin || '1234' 
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

  const [banInput, setBanInput] = useState({ student: '', duration: '1', reason: '', photoUrl: '' });
  const [newPenaltyCard, setNewPenaltyCard] = useState({ name: '', mcoin: 0, banDays: 0, rp: 0 });
  const [newRewardCard, setNewRewardCard] = useState({ name: '', type: 'mcoin', amount1: '', amount2: '' });
  const [tutanakTab, setTutanakTab] = useState('odul');
  const [newTourney, setNewTourney] = useState({ name: '', game: 'FIFA 24', fee: '', p1: '', p2: '', p3: '', device: 'ps5' });

  const handleCreatePenaltyCard = () => {
      if (!newPenaltyCard.name) return alert("Ceza adı zorunludur!");
      const cId = `penalty_${Date.now()}`;
      db.ref(`mavikent_premium/penalty_cards/${cId}`).set({
          name: newPenaltyCard.name,
          mcoin: parseInt(newPenaltyCard.mcoin) || 0,
          banDays: parseInt(newPenaltyCard.banDays) || 0,
          rp: parseInt(newPenaltyCard.rp) || 0
      });
      alert("✅ Ceza Kartı sisteme eklendi!");
      setNewPenaltyCard({ name: '', mcoin: 0, banDays: 0, rp: 0 });
  };

  const handleCreateRewardCard = () => {
      if (!newRewardCard.name) return alert("Ödül adı zorunludur!");
      const cId = `reward_${Date.now()}`;
      db.ref(`mavikent_premium/reward_cards/${cId}`).set({
          name: newRewardCard.name,
          type: newRewardCard.type,
          amount1: newRewardCard.amount1,
          amount2: newRewardCard.amount2
      });
      alert("✅ Ödül Kartı sisteme eklendi!");
      setNewRewardCard({ name: '', type: 'mcoin', amount1: '', amount2: '' });
  };

  const applyPenaltyCard = (studentName, cardId) => {
      const card = appData?.penalty_cards?.[cardId];
      if (!card) return alert("Hata: Kart bulunamadı!");
      if (!window.confirm(`${studentName} adlı öğrenciye '${card.name}' cezası uygulanacak. Onaylıyor musunuz?`)) return;

      const updates = {};
      const timestamp = Date.now();

      if (card.mcoin > 0) {
          updates[`wallet/${studentName}`] = (Number(appData?.wallet?.[studentName]) || 0) - card.mcoin;
          updates[`transactions/${studentName}/txn_pen_${timestamp}`] = { desc: `⚖️ Disiplin Cezası: ${card.name}`, amt: -card.mcoin, date: new Date().toLocaleString('tr-TR') };
      }

      if (card.rp > 0) {
          updates[`season_score/${studentName}`] = (Number(appData?.season_score?.[studentName]) || 0) - card.rp;
      }

      if (card.banDays > 0) {
          const expTime = timestamp + (card.banDays * 24 * 60 * 60 * 1000);
          updates[`game_room_bans/${studentName}`] = { reason: `Disiplin Cezası: ${card.name}`, photoUrl: '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR') };
          
          Object.keys(appData?.game_room_appointments || {}).forEach(device => {
              Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
                  Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                      if (appData.game_room_appointments[device][day][slotId] === studentName) { updates[`game_room_appointments/${device}/${day}/${slotId}`] = null; }
                  });
              });
          });
      }

      updates[`streaks/${studentName}`] = 0; 
      updates[`daily_flags/${studentName}/broken`] = true;

      updates[`notifications/${studentName}/notif_${timestamp}`] = { title: 'Disiplin İhlali!', message: `'${card.name}' kurallarını ihlal ettiğin için ceza aldın.`, isRead: false, timestamp };

      db.ref('mavikent_premium').update(updates).then(() => {
          alert(`✅ ${studentName} adlı öğrenciye ${card.name} cezası başarıyla uygulandı!`);
          setSelectedStudent(null);
          setModalType(null);
      });
  };

  const applyRewardCard = (studentName, cardId) => {
      const card = appData?.reward_cards?.[cardId];
      if (!card) return alert("Hata: Ödül kartı bulunamadı!");
      if (!window.confirm(`${studentName} adlı öğrenciye '${card.name}' ödülü verilecek. Onaylıyor musunuz?`)) return;

      const updates = {};
      const timestamp = Date.now();

      if (card.type === 'mcoin') {
          if (card.amount1 > 0) {
              updates[`wallet/${studentName}`] = (Number(appData?.wallet?.[studentName]) || 0) + Number(card.amount1);
              updates[`transactions/${studentName}/txn_rew_${timestamp}`] = { desc: `🎁 Ödül: ${card.name}`, amt: Number(card.amount1), date: new Date().toLocaleString('tr-TR') };
          }
          if (card.amount2 > 0) updates[`season_score/${studentName}`] = (Number(appData?.season_score?.[studentName]) || 0) + Number(card.amount2);
      } else if (card.type === 'joker') {
          updates[`inventory/${studentName}/joker_ticket`] = (Number(appData?.inventory?.[studentName]?.joker_ticket) || 0) + Number(card.amount1);
      } else if (card.type === 'box') {
          const boxType = card.amount2 === '1' ? 'standart_bilet' : card.amount2 === '2' ? 'mega_bilet' : 'elit_bilet';
          updates[`inventory/${studentName}/${boxType}`] = (Number(appData?.inventory?.[studentName]?.[boxType]) || 0) + Number(card.amount1);
      } else if (card.type === 'discount') {
          updates[`inventory/${studentName}/discount_rate`] = Number(card.amount1);
      } else if (card.type === 'bounty') {
          updates[`inventory/${studentName}/kings_bounty`] = { count: Number(card.amount1), amount: Number(card.amount2) };
      }

      updates[`notifications/${studentName}/notif_${timestamp}`] = { title: 'Ödül Kazandın!', message: `'${card.name}' ödülü hesabına tanımlandı. Harikasın!`, isRead: false, timestamp };

      db.ref('mavikent_premium').update(updates).then(() => {
          alert(`✅ ${studentName} adlı öğrenciye ${card.name} ödülü başarıyla tanımlandı!`);
          setSelectedStudent(null);
          setModalType(null);
      });
  };
  const [tourneyDaysMap, setTourneyDaysMap] = useState({}); 
  const [newCustomSlot, setNewCustomSlot] = useState({ device: 'ps4', day: 'Pazartesi', time: '', price: '' });

  const csvDenemeRef = useRef(null); const csvYaziliRef = useRef(null);

  const classList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"];
  const eduClassList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "ELİT", "STANDART"];
  const levelList = ["SEVİYE 1/A", "SEVİYE 1/B", "SEVİYE 2"];
  const examSubjects = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din Kültürü"];
  
  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});
  const isElite = (name) => appData?.student_tiers?.[name] === 'elite';

  const mebLessons = { "5. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], "6. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], "7. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], "8. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], "ELİT": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"], "STANDART": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"] };
  const valuesSubjectsList = ["K.Kerim", "İlmihal", "Siyer-i Nebi", "Adabı Muaşeret", "Tecvid"];
  const collectionTypes = [{ id: 'AKILLI SAAT', label: 'Akıllı Saat', icon: '⌚' }, { id: 'FORMA', label: 'Forma', icon: '👕' }, { id: 'KRAMPON', label: 'Krampon', icon: '👟' }, { id: 'ÇİKOLATA EVİM', label: 'Çikolata Evim', icon: '🍫' }, { id: 'KÜNEFE', label: 'Künefe', icon: '🍮' }, { id: 'NEŞELİ BALIK', label: 'Neşeli Balık', icon: '🐟' }, { id: 'PİZZA', label: 'Pizza', icon: '🍕' }, { id: 'FUTBOL TOPU', label: 'Futbol Topu', icon: '⚽' }];
  const exactCollections = collectionTypes.map(c => c.id);

  const GAME_DEVICES = [{ id: 'ps4', name: 'PS4' }, { id: 'ps5', name: 'PS5' }, { id: 'vr', name: 'VR' }, { id: 'pc', name: 'Bilgisayar' }];
  const GAME_SLOTS = {
      'ps4': [{ id: 'ps4_1', time: '15:45 - 16:15' }, { id: 'ps4_2', time: '16:15 - 16:45' }, { id: 'ps4_3', time: '21:00 - 21:30' }, { id: 'ps4_4', time: '21:30 - 22:15' }],
      'ps5': [{ id: 'ps5_1', time: '21:00 - 21:30' }, { id: 'ps5_2', time: '21:30 - 22:15' }],
      'vr':  [{ id: 'vr_1', time: '21:00 - 21:30' }, { id: 'vr_2', time: '21:30 - 22:15' }],
   'pc':  [{ id: 'pc_1', time: '21:00 - 21:30' }, { id: 'pc_2', time: '21:30 - 22:15' }]
  };

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  const handleAddCustomSlot = () => {
      if(!newCustomSlot.time || !newCustomSlot.price) return alert("Saat ve Fiyat girin!");
      const slotId = `custom_${Date.now()}`;
      db.ref(`mavikent_premium/custom_game_slots/${newCustomSlot.device}/${newCustomSlot.day}/${slotId}`).set({
          time: newCustomSlot.time, price: parseInt(newCustomSlot.price)
      });
      alert("✅ Özel seans eklendi!");
      setNewCustomSlot({...newCustomSlot, time: ''});
  };

  const handleAdminPhotoUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          const img = new Image(); img.src = event.target.result;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              let scaleSize = 800 / img.width; if (img.height > img.width) scaleSize = 800 / img.height; 
              canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              setBanInput({ ...banInput, photoUrl: canvas.toDataURL('image/jpeg', 0.6) });
          };
      };
  };

  useEffect(() => {
      if (!appData || !roster.length) return;
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() >= 19) {
          const todayStr = now.toDateString();
          if (appData?.settings?.last_ticket_dist !== todayStr) {
              const updates = {}; roster.forEach(n => { updates[`tickets/${n}`] = (Number(appData?.tickets?.[n]) || 0) + 1; });
              updates[`settings/last_ticket_dist`] = todayStr; db.ref('mavikent_premium').update(updates);
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
    const isPersonal2X = appData?.active_cards?.[name]?.multiplier?.date === new Date().toDateString();
    let total = basePts > 0 ? basePts + bns + eliteMulti : basePts;
    if ((isPersonal2X || appData?.settings?.global_event === '2x_xp') && total > 0 && type !== 'kanaat') total *= 2;
    return total;
  };

const saveData = (type, status, basePts) => {
    if (!selectedStudent) return;

    // KURAL 2: Öğrenci kurumda yoksa ödül/ceza puanı (Yoklama ve Okul hariç) verilemez!
    const todayStr = new Date().toDateString();
    if (appData?.daily_status?.[todayStr]?.[selectedStudent] === 'a' && type !== 'okul' && type !== 'yoklama') {
        return alert(`⚠️ ${selectedStudent} adlı öğrenci bugün kurumda değil (İzinli/Gelmedi). Puan işlemi yapılamaz.`);
    }

    const finalPts = getCalculatedPoints(selectedStudent, basePts, type);
    const updates = {};
    const isFail = status === 'a' || status === 'l' || (type === 'yatak' && basePts === 0) || (type === 'telefon' && status === 'a');
    
    if (isFail) {
        const strk = appData?.active_cards?.[selectedStudent]?.streak;
        if (strk && (strk.date === todayStr || (strk.end && strk.end > Date.now()))) { 
            alert(`🛡️ ${selectedStudent} SERİ KORUMA KALKANI kullandı!`); updates[`active_cards/${selectedStudent}/streak`] = null; 
        } else { updates[`streaks/${selectedStudent}`] = 0; updates[`daily_flags/${selectedStudent}/broken`] = true; }
    }
    
    if (finalPts !== 0) { 
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts; 
        updates[`xp/${selectedStudent}`] = Math.max(0, (Number(appData?.xp?.[selectedStudent]) || 0) + (basePts * 10)); 
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        let desc = type === 'kanaat' ? 'Yönetici Kanaat Notu' : (type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : (type === 'okul' ? 'Okul Dönüş Yoklaması' : 'Yatak/Dolap')));
        updates[`transactions/${selectedStudent}/${tId}`] = { desc, amt: finalPts, date: new Date().toLocaleString('tr-TR') };
    }
    
    if (type === 'okul') {
        updates[`daily_status/${todayStr}/${selectedStudent}`] = status;
        if (status === 'a') { 
            const currentAbs = Number(appData?.absences?.[selectedStudent] || 0) + 1;
            updates[`absences/${selectedStudent}`] = currentAbs;
            if (currentAbs % 10 === 0) { 
                updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts - 100;
                updates[`transactions/${selectedStudent}/abs_fine_${Date.now()}`] = { desc: '🚨 10 Günlük Devamsızlık Cezası', amt: -100, date: new Date().toLocaleString('tr-TR') };
                alert(`🚨 ${selectedStudent} 10. devamsızlığını yaptı! Hesabından ekstra 100 M-Coin düşüldü.`);
            }
        }
    }
    else if (type === 'yoklama') updates[`yoklama_d/${todayStr}/${selectedStudent}/sessions/${selectedSession}`] = { st: status, pts: finalPts };
    else if (type === 'telefon') updates[`telefon_d/${todayStr}/${selectedStudent}/sessions/gunluk`] = { st: status, pts: finalPts };
    else if (type === 'kanaat') updates[`kanaat_w/${selectedStudent}`] = (Number(appData?.kanaat_w?.[selectedStudent]) || 0) + finalPts;
    else if (type === 'yatak') updates[`yatak_d/${todayStr}/${selectedStudent}/${status}_pts`] = finalPts; 
    
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null);
  };
const saveEducationData = () => {
    const todayStr = new Date().toDateString();
    const oldData = appData?.education_d?.[selectedStudent] || {}; 
    let earnedPoints = 0;
    const validNew = (eduData.lessons || []).filter(hw => !hw.includes("YOK")); 
    const validOld = (oldData.lessons || []).filter(hw => !hw.includes("YOK"));
    
    if (validOld.length === 0 && validNew.length > 0) earnedPoints += 2;
    if ((eduData.pages || 0) > (oldData.pages || 0)) earnedPoints += Math.floor((eduData.pages || 0) / 10) - Math.floor((oldData.pages || 0) / 10);
    if ((eduData.questions || 0) > (oldData.questions || 0)) earnedPoints += Math.floor((eduData.questions || 0) / 10) - Math.floor((oldData.questions || 0) / 10);
    
    // --- HAFTALIK BİRİKTİRME MOTORU (Cmt 16:00 Sıfırlamalı) ---
    const now = new Date(); const pivot = new Date(now);
    pivot.setDate(now.getDate() - (now.getDay() + 1) % 7); pivot.setHours(16, 0, 0, 0);
    if (now < pivot) pivot.setDate(pivot.getDate() - 7);
    const weekId = `week_${pivot.getTime()}`;

    let qDelta = 0; let pDelta = 0;
    if (oldData.date === todayStr) { // Eğer bugün içinde 2. kez düzeltme yapılıyorsa sadece farkı al
        qDelta = (eduData.questions || 0) - (oldData.questions || 0);
        pDelta = (eduData.pages || 0) - (oldData.pages || 0);
    } else { // İlk defa giriliyorsa hepsini al
        qDelta = (eduData.questions || 0);
        pDelta = (eduData.pages || 0);
    }

    const currentWeeklyQ = appData?.weekly_stats?.[weekId]?.[selectedStudent]?.questions || 0;
    const currentWeeklyP = appData?.weekly_stats?.[weekId]?.[selectedStudent]?.pages || 0;

    const updates = {}; 
    updates[`education_d/${selectedStudent}`] = { ...eduData, date: todayStr };
    updates[`weekly_stats/${weekId}/${selectedStudent}/questions`] = Math.max(0, currentWeeklyQ + qDelta);
    updates[`weekly_stats/${weekId}/${selectedStudent}/pages`] = Math.max(0, currentWeeklyP + pDelta);

    if (earnedPoints > 0) {
        const finalM = getCalculatedPoints(selectedStudent, earnedPoints, 'egitim');
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (Number(appData?.season_score?.[selectedStudent]) || 0) + (earnedPoints + (isElite(selectedStudent) ? 2 : 0));
        updates[`xp/${selectedStudent}`] = (Number(appData?.xp?.[selectedStudent]) || 0) + (earnedPoints * 10);
        updates[`transactions/${selectedStudent}/txn_${Date.now()}`] = { desc: 'Günlük Eğitim Başarısı', amt: finalM, date: new Date().toLocaleString('tr-TR') };
    }
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null); alert("✅ Eğitim Kaydedildi ve Haftalık Panoya İşlendi!");
  };

  const saveExamData = (type) => {
    const updates = {};
    if (type === 'deneme') {
        let totalNet = 0; let subjectsData = {};
        for(let i=0; i<examSubjects.length; i++) { 
            const d = parseFloat(examData[`d_${i}`]) || 0; const y = parseFloat(examData[`y_${i}`]) || 0; const b = parseFloat(examData[`b_${i}`]) || 0;
            const net = d - (y/3); totalNet += net; subjectsData[i] = { d, y, b, net };
        }
        updates[`exams/${selectedStudent}/deneme`] = { subjects: subjectsData, net: totalNet, target: parseFloat(examData.target) || 0, date: new Date().toDateString() };
    } else if (type === 'yazili') {
        let total = 0; let count = 0; let writeData = {};
        for(let i=0; i<examSubjects.length; i++) { 
            const val = examData[`p_${i}`]; 
            if(val !== undefined && val !== '') { total += parseFloat(val); count++; writeData[`p_${i}`] = parseFloat(val); } 
        }
        updates[`exams/${selectedStudent}/yazili`] = { ...writeData, avg: count > 0 ? (total / count) : 0, target: parseFloat(examData.target) || 0, date: new Date().toDateString() };
    }
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null); alert(`${type.toUpperCase()} Kaydedildi!`);
  };

  const downloadCSVTemplate = (type) => {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
      if (type === 'deneme') {
          csvContent += "Ogrenci_Adi,Turkce_D,Turkce_Y,Turkce_B,Matematik_D,Matematik_Y,Matematik_B,Fen_D,Fen_Y,Fen_B,Sosyal_D,Sosyal_Y,Sosyal_B,Ingilizce_D,Ingilizce_Y,Ingilizce_B,Din_D,Din_Y,Din_B,Hedef_Net\n";
          getFilteredRoster(selectedSession).forEach(name => { csvContent += `${name},0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n`; });
      } else if (type === 'yazili') {
          csvContent += "Ogrenci_Adi,Turkce,Matematik,Fen,Sosyal,Ingilizce,Din,Hedef_Ortalama\n";
          getFilteredRoster(selectedSession).forEach(name => { csvContent += `${name},0,0,0,0,0,0,0\n`; });
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `Mavikent_${selectedSession}_${type}_Sablon.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCSVUpload = (e, type) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return alert("⚠️ Lütfen Excel'de dosyanızı doldurduktan sonra 'Farklı Kaydet' diyerek 'CSV (Virgülle ayrılmış)' formatında kaydedip sisteme yükleyin.");
      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target.result; const rows = text.split(/\r?\n/).map(row => row.split(/[,;]/));
          const updates = {}; let matchCount = 0; const normalize = (str) => String(str).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
          for (let i = 1; i < rows.length; i++) { 
              const cols = rows[i]; if (cols.length < 2) continue; 
              const matchedStudent = roster.find(n => normalize(n) === normalize(cols[0]));
              if (matchedStudent) {
                  matchCount++;
                  if (type === 'deneme') {
                      let totalNet = 0; let subjectsData = {};
                      for (let j = 0; j < 6; j++) {
                          const d = parseFloat(cols[1 + j*3]) || 0; const y = parseFloat(cols[2 + j*3]) || 0; const b = parseFloat(cols[3 + j*3]) || 0;
                          const net = d - (y/3); totalNet += net; subjectsData[j] = { d, y, b, net };
                      }
                      updates[`exams/${matchedStudent}/deneme`] = { subjects: subjectsData, net: totalNet, target: parseFloat(cols[19]) || 0, date: new Date().toDateString() };
                  } else if (type === 'yazili') {
                      let total = 0; let count = 0; let writeData = {};
                      for (let j = 0; j < 6; j++) {
                          const val = cols[1 + j];
                          if (val !== undefined && val !== '' && !isNaN(parseFloat(val))) { total += parseFloat(val); count++; writeData[`p_${j}`] = parseFloat(val); }
                      }
                      updates[`exams/${matchedStudent}/yazili`] = { ...writeData, avg: count > 0 ? (total / count) : 0, target: parseFloat(cols[7]) || 0, date: new Date().toDateString() };
                  }
              }
          }
          if (Object.keys(updates).length > 0) { db.ref('mavikent_premium').update(updates); alert(`✅ Başarılı! ${matchCount} öğrencinin verisi aktarıldı.`); } else { alert('⚠️ Hata: İsimler eşleşmedi.'); }
          e.target.value = null; 
      };
      reader.readAsText(file, 'UTF-8');
  };

  const loadHtml2Canvas = async () => {
      if (window.html2canvas) return window.html2canvas;
      return new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; script.onload = () => resolve(window.html2canvas); document.head.appendChild(script); });
  };

  const downloadReportAsJPG = async (type, className) => {
      const btnId = `btn-jpg-${type}`; const originalText = document.getElementById(btnId).innerText; document.getElementById(btnId).innerText = "⏳ Hazırlanıyor...";
      const html2canvas = await loadHtml2Canvas(); const container = document.createElement('div');
      container.style.cssText = "position:absolute;left:-9999px;top:0;width:1200px;background:#ffffff;padding:40px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;";
      const studentsToMap = type === 'degerler' ? roster.filter(n => appData?.student_levels?.[n] === className) : getFilteredRoster(className);
      let title = ''; let tableHTML = `<table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 20px;">`;
      if (type === 'deneme') {
          title = 'DENEME SINAVI SONUÇLARI (VELİ BİLGİLENDİRME)';
          let dataArr = studentsToMap.map(n => {
              const data = appData?.exams?.[n]?.deneme || {}; let totalNet = 0; let subsHTML = '';
              examSubjects.forEach((s, i) => { const d = parseFloat(data?.subjects?.[i]?.d) || 0; const y = parseFloat(data?.subjects?.[i]?.y) || 0; const b = parseFloat(data?.subjects?.[i]?.b) || 0; const net = d - (y/3); totalNet += net; subsHTML += `<td style="padding:15px;border-bottom:1px solid #e2e8f0;"><div style="font-size:11px;color:#64748b;">${d}D ${y}Y ${b}B</div><div style="font-weight:900;font-size:15px;">${net.toFixed(2)} N</div></td>`; });
              const target = parseFloat(data.target)||0; let statusHTML = '-';
              if (target > 0) { statusHTML = totalNet >= target ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:900;font-size:12px;letter-spacing:0.5px;">HEDEFİ GEÇTİ ✅</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:900;font-size:12px;letter-spacing:0.5px;">HEDEFİN ALTINDA ❌</span>`; }
              return { n, totalNet, target, subsHTML, statusHTML };
          }).sort((a,b) => b.totalNet - a.totalNet);
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th>`;
          examSubjects.forEach(s => tableHTML += `<th style="padding:15px;font-size:13px;">${s}</th>`);
          tableHTML += `<th style="padding:15px;background:#3b82f6;">Toplam Net</th><th style="padding:15px;background:#d4af37;color:#0f172a;">Hedef</th><th style="padding:15px;border-radius:0 12px 0 0;">Durum</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:15px;border-bottom:1px solid #e2e8f0;">${d.n}</td>${d.subsHTML}<td style="padding:15px;font-weight:900;font-size:18px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.totalNet.toFixed(2)}</td><td style="padding:15px;font-weight:800;font-size:16px;color:#d4af37;border-bottom:1px solid #e2e8f0;">${d.target}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      } else if (type === 'yazili') {
          title = 'HAFTALIK YAZILI DEĞERLENDİRME';
          let dataArr = studentsToMap.map(n => {
              const data = appData?.exams?.[n]?.yazili || {}; let total = 0; let count = 0; let subsHTML = '';
              examSubjects.forEach((s, i) => { const val = data[`p_${i}`]; if (val!==undefined&&val!=='') { total+=parseFloat(val); count++; } subsHTML += `<td style="padding:15px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:16px;">${val||'-'}</td>`; });
              const avg = count>0 ? (total/count) : 0; const target = parseFloat(data.target)||0; let statusHTML = '-';
              if (target>0 && avg>0) { statusHTML = avg >= target ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">HEDEFİ GEÇTİ ✅</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">HEDEFİN ALTINDA ❌</span>`; }
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
          let dataArr = studentsToMap.map(n => { const isDone = appData?.values_edu_d?.[n]?.[todayStr]?.done; return { n, statusHTML: isDone ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">KATILDI ✓</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">KATILMADI ✕</span>` }; });
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th><th style="padding:15px;border-radius:0 12px 0 0;">Günlük Katılım</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${d.n}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      }
      
      tableHTML += `</table>`;
      container.innerHTML = `<div style="background:linear-gradient(135deg, #0f172a, #1e293b);padding:30px;border-radius:24px;display:flex;justify-content:space-between;align-items:center;color:white;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div><h1 style="margin:0;font-size:42px;font-weight:900;letter-spacing:-1px;">MAVİKENT <span style="color:#d4af37;">ELITE</span></h1><h2 style="margin:5px 0 0 0;font-size:20px;color:#cbd5e1;font-weight:700;">${className} - ${title}</h2></div><div style="text-align:right;"><div style="font-size:16px;font-weight:600;color:#cbd5e1;">Tarih</div><div style="font-size:22px;font-weight:800;color:#d4af37;">${new Date().toLocaleDateString('tr-TR')}</div></div></div>${tableHTML}`;
      document.body.appendChild(container);
      
      try { const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true }); const link = document.createElement('a'); link.download = `Mavikent_${className}_${type}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click(); } catch(e) { console.error(e); } finally { document.body.removeChild(container); document.getElementById(btnId).innerText = originalText; }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return alert("İsim ve fiyat zorunludur!");
    const productData = { n: newProduct.name, p: parseInt(newProduct.price), i: newProduct.icon, type: newProduct.type, stock: newProduct.stock !== '' ? parseInt(newProduct.stock) : 999 };
    if (newProduct.type === 'bundle') { if (bundleSelection.length === 0) return alert("Lütfen paket içine eklenecek ürünleri seçin!"); productData.bundleItems = bundleSelection; }
    if (editProductKey) { db.ref(`mavikent_premium/market_products/${editProductKey}`).update(productData); setEditProductKey(null); } 
    else { db.ref('mavikent_premium/market_products').push(productData); }
    setNewProduct({ name: '', price: '', icon: '📦', type: 'normal', stock: '' }); setBundleSelection([]);
  };
  
  const editProduct = (key, prod) => { setNewProduct({ name: prod.n, price: prod.p, icon: prod.i, type: prod.type || 'normal', stock: prod.stock !== undefined ? prod.stock : '' }); setBundleSelection(prod.bundleItems || []); setEditProductKey(key); window.scrollTo(0,0); };

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
      alert("🔨 İhale başlatıldı! Öğrenciler artık teklif verebilir."); document.getElementById('aucItem').value = ''; document.getElementById('aucPrice').value = '';
  };

  const handleEndAuction = () => {
      if(!window.confirm("İhaleyi bitirmek istediğine emin misin?")) return;
      const auc = appData?.auction;
      if (auc && auc.highestBidder) { db.ref('mavikent_premium/deliveries').push({ s: auc.highestBidder, i: `${auc.item} (İhale Kazancı)`, st: 'wait', type: 'normal', val: auc.item, date: new Date().toLocaleDateString('tr-TR') }); alert(`🏆 İhale bitti! ${auc.highestBidder} kazandı.`); } else { alert("İhaleye kimse teklif vermedi."); }
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
      if(clan && clan.members) { const updates = {}; updates[`clans/${cId}`] = null; clan.members.forEach(m => { updates[`clan_war_participants/${m}`] = null; }); db.ref('mavikent_premium').update(updates); alert("Klan temizlendi."); }
  };

  // EKSİK 1: KLAN SAVAŞINI BİTİRME VE ÖDÜL DAĞITIMI
  const handleEndClanWar = () => {
      if (!window.confirm("Klan savaşını bitirip kazanan klana 60'ar M-Coin ödül dağıtmak istiyor musunuz?")) return;
      let highestScore = -1; let winnerClanId = null;
      Object.keys(appData?.clans || {}).forEach(cId => {
          const clan = appData.clans[cId]; let warScore = 0;
          (clan.members || []).forEach(m => { if (appData?.clan_war_participants?.[m]) { warScore += Number(appData?.season_score?.[m] || 0); } });
          if (warScore > highestScore) { highestScore = warScore; winnerClanId = cId; }
      });
      if (!winnerClanId || highestScore === 0) return alert("Savaşa katılan klan veya puan yok.");
      
      const winnerClan = appData.clans[winnerClanId]; const updates = {};
      (winnerClan.members || []).forEach(m => {
          if (appData?.clan_war_participants?.[m]) { updates[`wallet/${m}`] = (Number(appData?.wallet?.[m]) || 0) + 60; updates[`transactions/${m}/txn_cw_${Date.now()}`] = { desc: '🏆 Klan Savaşı Şampiyonluğu', amt: 60, date: new Date().toLocaleString('tr-TR') }; }
      });
      updates['clan_war_participants'] = null;
      db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🏆 HAFTANIN KLAN SAVAŞI ŞAMPİYONU: ${winnerClan.name}! Katılan üyelere 60 M-Coin yatırıldı.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      db.ref('mavikent_premium').update(updates); alert(`✅ Savaş bitti! Şampiyon: ${winnerClan.name} (${highestScore} Puan)`);
  };

  // EKSİK 2: GÖREV TAMAMLAMA VE ÖDÜL DAĞITIMI
  const completeQuest = (qId) => {
      const quest = appData?.quests?.[qId]; if (!quest) return;
      const parts = quest.participants || []; if (parts.length === 0) return alert("Bu görevde katılımcı yok!");
      if (!window.confirm(`${parts.length} öğrenciye ödülleri dağıtılsın mı?`)) return;
      
      const updates = {};
      parts.forEach(p => {
          if (quest.type === 'M') { updates[`wallet/${p}`] = (Number(appData?.wallet?.[p]) || 0) + Number(quest.amt); updates[`transactions/${p}/txn_q_${Date.now()}`] = { desc: `Görev Ödülü: ${quest.text}`, amt: Number(quest.amt), date: new Date().toLocaleString('tr-TR') }; } 
          else if (quest.type === 'RP') { updates[`season_score/${p}`] = (Number(appData?.season_score?.[p]) || 0) + Number(quest.amt); }
          updates[`xp/${p}`] = (Number(appData?.xp?.[p]) || 0) + 50; 
      });
      updates[`quests/${qId}/participants`] = null; db.ref('mavikent_premium').update(updates); alert("✅ Ödüller dağıtıldı ve liste temizlendi.");
  };

  // EKSİK 3: YÖNETİCİ SOHBET MESAJI GÖNDERİMİ
  const sendAdminChat = () => {
      if (!adminChatInput.trim()) return;
      db.ref('mavikent_premium/global_chat').push({ s: 'YÖNETİCİ', t: adminChatInput, ts: Date.now(), type: 'admin', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      setAdminChatInput('');
  };

  // EKSİK 4: TESLİMAT ONAYLARI VE KOLEKSİYON YÖNETİMİ
  const handleApproveDelivery = (k, item) => {
      if (!window.confirm(`${item.n || item.i} teslimatını onaylıyor musun?`)) return;
      const updates = {}; const iName = String(item.n || item.i || '').toUpperCase();
      const isDigital = item.type === 'multiplier' || item.type === 'streak' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ");
      if (isDigital) {
          if (item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ")) { updates[`tickets/${item.s}`] = (Number(appData?.tickets?.[item.s]) || 0) + 1; }
          else if (item.type === 'multiplier') { updates[`active_cards/${item.s}/multiplier`] = { date: new Date().toDateString(), val: "2X" }; }
          else if (item.type === 'streak') { const today = new Date(); let nextSat = new Date(); nextSat.setDate(today.getDate() + 6); nextSat.setHours(15, 0, 0, 0); updates[`active_cards/${item.s}/streak`] = { val: "aktif", date: new Date().toDateString(), end: nextSat.getTime() }; }
      }
      updates[`deliveries/${k}/st`] = 'done'; db.ref('mavikent_premium').update(updates); alert("✅ Onaylandı!");
  };

  const handleDeliverCollection = (student, cName, keys) => {
      if (!window.confirm(`${student} için ${cName} koleksiyon ödülünü (500 M-Coin) vermek istiyor musunuz?`)) return;
      const updates = {}; keys.forEach(k => { updates[`deliveries/${k}/st`] = 'done'; });
      updates[`wallet/${student}`] = (Number(appData?.wallet?.[student]) || 0) + 500;
      updates[`transactions/${student}/txn_col_${Date.now()}`] = { desc: `🏆 Koleksiyon Ödülü (${cName})`, amt: 500, date: new Date().toLocaleString('tr-TR') };
      db.ref('mavikent_premium').update(updates); alert("✅ Ödül yatırıldı!");
  };

  const handleCancelCollection = (student, keys, items, withRefund) => {
      if (!window.confirm(withRefund ? "Bu koleksiyon parçalarını iptal edip iade yapmak istiyor musunuz?" : "İADESİZ silmek istiyor musunuz?")) return;
      const updates = {}; let totalRefund = 0;
      keys.forEach((k, idx) => {
          updates[`deliveries/${k}`] = null;
          if (withRefund) {
              const it = items[idx]; const iName = String(it.n || it.i || ''); let refundAmt = 0;
              if (iName.includes('(Çekiliş)')) refundAmt = 20; else if (iName.includes('(Kazı Kazan)')) refundAmt = 15;
              else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === iName); if (prod && prod.p) refundAmt = Number(prod.p); }
              totalRefund += refundAmt;
          }
      });
      if (withRefund && totalRefund > 0) {
          updates[`wallet/${student}`] = (Number(appData?.wallet?.[student]) || 0) + totalRefund;
          updates[`transactions/${student}/txn_ref_col_${Date.now()}`] = { desc: `Toplu İade (Koleksiyon)`, amt: totalRefund, date: new Date().toLocaleString('tr-TR') };
      }
      db.ref('mavikent_premium').update(updates); alert(withRefund ? `✅ İade yapıldı: ${totalRefund} M` : "🗑️ Silindi.");
  };

  const handleBulkDeliveryAction = (action) => {
      const waitingKeys = Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].st === 'wait');
      if (waitingKeys.length === 0) return alert("Bekleyen teslimat yok.");
      const updates = {};
      
      if (action === 'approve') {
          if(!window.confirm(`Görünen tüm teslimatları onaylamak istediğine emin misin?`)) return;
          waitingKeys.forEach(k => {
              const item = appData.deliveries[k]; const iName = String(item.n || item.i || '').toUpperCase();
              const isDigital = item.type === 'multiplier' || item.type === 'streak' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ");
              if (isDigital) {
                  if (item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ")) { updates[`tickets/${item.s}`] = (Number(appData?.tickets?.[item.s]) || 0) + 1; } 
                  else if (item.type === 'multiplier') { updates[`active_cards/${item.s}/multiplier`] = { date: new Date().toDateString(), val: "2X" }; } 
                  else if (item.type === 'streak') { const today = new Date(); let nextSat = new Date(); nextSat.setDate(today.getDate() + 6); nextSat.setHours(15, 0, 0, 0); updates[`active_cards/${item.s}/streak`] = { val: "aktif", date: new Date().toDateString(), end: nextSat.getTime() }; } 
              }
              updates[`deliveries/${k}/st`] = 'done';
          });
          db.ref('mavikent_premium').update(updates); alert(`✅ Toplu onaylandı!`);
      } 
      else if (action === 'refund') {
          if(!window.confirm(`Tüm bekleyen siparişleri iptal edip ücretlerini iade etmek istediğine emin misin?`)) return;
          let localWallets = {};
          waitingKeys.forEach(k => {
              const item = appData.deliveries[k]; let refundAmt = 0; const itemName = String(item.n || item.i || '');
              if (itemName.includes('(Çekiliş)')) refundAmt = 20; else if (itemName.includes('(Kazı Kazan)')) refundAmt = 15; 
              else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === itemName); if (prod && prod.p) refundAmt = Number(prod.p); }
              updates[`deliveries/${k}`] = null;
              if (refundAmt > 0) {
                  if (localWallets[item.s] === undefined) localWallets[item.s] = Number(appData?.wallet?.[item.s] || 0);
                  localWallets[item.s] += refundAmt; updates[`wallet/${item.s}`] = localWallets[item.s];
                  updates[`transactions/${item.s}/txn_${Date.now()}_${Math.floor(Math.random()*1000)}`] = { desc: `Toplu İade: ${itemName}`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') };
              }
          });
          db.ref('mavikent_premium').update(updates); alert(`💰 İadeler tamamlandı!`);
      }
      else if (action === 'delete') {
          if(!window.confirm(`Tüm bekleyen siparişleri İADESİZ olarak silmek istediğine emin misin?`)) return;
          waitingKeys.forEach(k => updates[`deliveries/${k}`] = null); db.ref('mavikent_premium').update(updates); alert(`🗑️ Teslimatlar silindi.`);
      }
  };

  const handleCancelDelivery = (k, item, withRefund) => {
      if (!window.confirm(withRefund ? "İptal edip iade yapmak istediğinize emin misiniz?" : "İadesiz SİLMEK istediğinize emin misiniz?")) return;
      const updates = {}; updates[`deliveries/${k}`] = null;
      if (withRefund) {
          let refundAmt = 0; const iName = String(item.n || item.i || '');
          if (iName.includes('(Çekiliş)')) refundAmt = 20; else if (iName.includes('(Kazı Kazan)')) refundAmt = 15;
          else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === iName); if (prod && prod.p) refundAmt = Number(prod.p); }
          
          if (refundAmt > 0) {
              updates[`wallet/${item.s}`] = (Number(appData?.wallet?.[item.s]) || 0) + refundAmt;
              updates[`transactions/${item.s}/txn_ref_${Date.now()}`] = { desc: `İade: ${iName}`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') };
              alert(`✅ İade edildi: ${refundAmt} M`);
          } else { alert(`✅ İptal edildi. (Sabit bedel bulunamadı)`); }
      } else { alert("🗑️ Kalıcı olarak silindi."); }
      db.ref('mavikent_premium').update(updates);
  };

  const applyBan = () => {
      if (!banInput.student || !banInput.reason) return alert("Öğrenci ve Ceza Sebebi zorunludur!");
      let expTime = 0;
      if (banInput.duration === '1') expTime = Date.now() + (1 * 24 * 60 * 60 * 1000);
      else if (banInput.duration === '3') expTime = Date.now() + (3 * 24 * 60 * 60 * 1000);
      else if (banInput.duration === '7') expTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      else expTime = Date.now() + (365 * 24 * 60 * 60 * 1000); 

      const updates = {};
      updates[`game_room_bans/${banInput.student}`] = { reason: banInput.reason, photoUrl: banInput.photoUrl || '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR') };

      Object.keys(appData?.game_room_appointments || {}).forEach(device => {
          Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
              Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                  if (appData.game_room_appointments[device][day][slotId] === banInput.student) { updates[`game_room_appointments/${device}/${day}/${slotId}`] = null; }
              });
          });
      });
      db.ref('mavikent_premium').update(updates); alert(`⛔ ${banInput.student} adlı öğrenciye başarıyla ceza kesildi ve aktif randevuları iptal edildi!`);
      setBanInput({ student: '', duration: '1', reason: '', photoUrl: '' });
  };

  const removeBan = (student) => {
      if(window.confirm(`${student} adlı öğrencinin yasağını kaldırmak istiyor musun?`)) { db.ref(`mavikent_premium/game_room_bans/${student}`).remove(); alert("Yasak kaldırıldı."); }
  };

  const toggleTourneyDay = (tId, day) => {
      setTourneyDaysMap(prev => {
          const current = prev[tId] || [];
          if(current.includes(day)) return {...prev, [tId]: current.filter(d => d !== day)};
          return {...prev, [tId]: [...current, day]};
      });
  };

  const generateFixture = (tId, tourneyData) => {
      const selectedDays = tourneyDaysMap[tId] || [];
      if (selectedDays.length === 0) return alert("Lütfen maçların oynanacağı günleri (Aşağıdaki Butonlardan) seçin!");
      const players = [...(tourneyData.participants || [])];
      if (players.length < 2) return alert("Fikstür oluşturmak için en az 2 kişi gerekli!");
      if (!window.confirm(`Fikstür çekilecek ve seçtiğiniz günlerin (Akşam) seansları bu turnuva için kilitlenecektir. Onaylıyor musun?`)) return;

      players.sort(() => Math.random() - 0.5);
      let fixturePlayers = [...players];
      if (fixturePlayers.length % 2 !== 0) fixturePlayers.push("BAY");

      const numPlayers = fixturePlayers.length;
      const numRounds = numPlayers - 1;
      const matches = {}; let matchIdx = 0;

      const devSlotsObj = GAME_SLOTS[tourneyData.device] || [];
      const eveningSlots = devSlotsObj.filter(s => parseInt(s.time.split(':')[0]) >= 20);

      if (eveningSlots.length === 0) return alert("Bu cihaz için akşam seansı bulunamadı!");

      let currentWeek = 1; let currentDayIdx = 0; let currentSlotIdx = 0;
      let updates = {}; let lockedCount = 0;

      for (let round = 0; round < numRounds; round++) {
          for (let i = 0; i < numPlayers / 2; i++) {
              const home = fixturePlayers[i];
              const away = fixturePlayers[numPlayers - 1 - i];

              if (home !== "BAY" && away !== "BAY") {
                  const targetDay = selectedDays[currentDayIdx];
                  const targetSlot = eveningSlots[currentSlotIdx];

                  matches[`m_${matchIdx}`] = { p1: home, p2: away, played: false, s1: 0, s2: 0, week: currentWeek, day: targetDay, slotId: targetSlot.id, time: targetSlot.time };
                  updates[`game_room_appointments/${tourneyData.device}/${targetDay}/${targetSlot.id}`] = `🏆 TURNUVA: ${tourneyData.name}`;
                  lockedCount++; matchIdx++; currentSlotIdx++;

                  if (currentSlotIdx >= eveningSlots.length) {
                      currentSlotIdx = 0; currentDayIdx++;
                      if (currentDayIdx >= selectedDays.length) { currentDayIdx = 0; currentWeek++; }
                  }
              }
          }
          fixturePlayers.splice(1, 0, fixturePlayers.pop());
      }

      const standings = {}; players.forEach(p => { standings[p] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; });

      updates[`tournaments/${tId}/status`] = 'active';
      updates[`tournaments/${tId}/fixture`] = matches;
      updates[`tournaments/${tId}/standings`] = standings;
      db.ref('mavikent_premium').update(updates); alert(`✅ Fikstür başarıyla oluşturuldu! Toplam ${lockedCount} seans turnuva için kilitlendi.`);
  };

  const handleCreateTournament = () => {
      if (!newTourney.name || !newTourney.fee || !newTourney.p1) return alert("Turnuva Adı, Giriş Ücreti ve 1. Ödülü zorunludur!");
      const tId = `tourney_${Date.now()}`;
      const updates = {};
      updates[`tournaments/${tId}`] = {
          name: newTourney.name, game: newTourney.game, device: newTourney.device, fee: parseInt(newTourney.fee),
          p1: parseInt(newTourney.p1), p2: parseInt(newTourney.p2) || 0, p3: parseInt(newTourney.p3) || 0,
          participants: [], status: 'open', date: new Date().toLocaleDateString('tr-TR')
      };
      db.ref('mavikent_premium').update(updates);
      alert("🏆 Turnuva başarıyla oluşturuldu! Öğrenciler katılım sağlayabilir.");
      setNewTourney({ name: '', game: 'FIFA 24', fee: '', p1: '', p2: '', p3: '', device: 'ps5' });
  };

  const handleEndTournament = (tId, tourneyData) => {
      const parts = tourneyData.participants || [];
      if (parts.length === 0) return alert("Turnuvada katılımcı yok!");
      let msg = "🏆 ŞAMPİYONU SEÇİN:\n\n";
      parts.forEach((p, i) => { msg += `${i + 1}- ${p}\n`; });
      msg += "\nŞampiyonun numarasını girin:";
      const res = prompt(msg);
      if (!res) return;
      const idx = parseInt(res) - 1;
      if (isNaN(idx) || idx < 0 || idx >= parts.length) return alert("Geçersiz bir numara girdiniz.");
      
      const winner = parts[idx];
      const prize = parseInt(tourneyData.p1); 
      
      if (window.confirm(`👑 ŞAMPİYON: ${winner}\n💰 KAZANCI: ${prize} M-Coin\n\nOnaylıyor musunuz?`)) {
          const updates = {};
          const currentWallet = Number(appData?.wallet?.[winner]) || 0;
          updates[`wallet/${winner}`] = currentWallet + prize;
          updates[`transactions/${winner}/txn_tourneywin_${Date.now()}`] = { desc: `🏆 Turnuva Şampiyonu: ${tourneyData.name}`, amt: prize, date: new Date().toLocaleString('tr-TR') };
          updates[`tournaments/${tId}`] = null;
          
          Object.keys(appData?.game_room_appointments || {}).forEach(device => {
              Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
                  Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                      const sName = appData.game_room_appointments[device][day][slotId];
                      if (String(sName).includes(`TURNUVA: ${tourneyData.name}`)) { updates[`game_room_appointments/${device}/${day}/${slotId}`] = null; }
                  });
              });
          });
          
          db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🏆 ${tourneyData.name} Turnuvasının Şampiyonu ${winner.split(' ')[0]} oldu ve ${prize} M-Coin kazandı! Tebrikler! 🎉`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
          db.ref('mavikent_premium').update(updates); alert(`🎉 İşlem tamam! Şampiyon ilan edildi, oyun odası saatleri açıldı ve ödül yatırıldı.`);
      }
  };

const renderStudentGrid = (students, type) => {
    const todayStr = new Date().toDateString();
    
    if (currentModule === 'devamsizlik') {
        return (
            <div className="fade-in" style={{ gridColumn: '1 / -1', background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 40px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '25px', fontWeight: 900, color: '#0f172a', textAlign: 'center', fontSize: '24px' }}>📉 Genel Devamsızlık Çizelgesi</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    {[...students].sort((a,b) => (appData?.absences?.[b] || 0) - (appData?.absences?.[a] || 0)).map((n, index) => (
                        <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: '#0f172a', color: '#d4af37', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>{index + 1}</div>
                                <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{n}</span>
                            </div>
                            <span style={{ fontWeight: 900, fontSize: '14px', background: (appData?.absences?.[n] || 0) >= 8 ? '#fef2f2' : '#f1f5f9', color: (appData?.absences?.[n] || 0) >= 8 ? '#ef4444' : '#0f172a', padding: '8px 16px', borderRadius: '12px' }}>{appData?.absences?.[n] || 0} GÜN</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
    <div className="grid-mobile-2">
      {students.map(name => {
        const okulDurumu = appData?.daily_status?.[todayStr]?.[name];
        const isNotAtYurt = okulDurumu === 'a'; // Okula gelmediyse tüm modüllerde kilitlenir
        
        let bgColor = '#ffffff'; let subText = ''; let isCompletedToday = false;
        
        if (currentModule === 'okul') {
            if (okulDurumu) { 
                isCompletedToday = true; 
                bgColor = okulDurumu === 'p' ? '#ecfdf5' : (okulDurumu === 'a' ? '#fef2f2' : '#f1f5f9'); 
                subText = okulDurumu === 'p' ? '✅ Döndü (İşlem Yapıldı)' : (okulDurumu === 'a' ? '❌ Gelmedi (İşlem Yapıldı)' : '✉️ İzinli (İşlem Yapıldı)');
            } else {
                subText = '⏳ Bekliyor';
            }
        }
        else if (currentModule === 'yoklama') { 
            const st = appData?.yoklama_d?.[todayStr]?.[name]?.sessions?.[selectedSession]?.st; 
            if (st) { isCompletedToday = true; subText = '✅ Yoklama Alındı'; }
            if (st === 'p' || st === 't') bgColor = '#ecfdf5'; 
            if (st === 'a') bgColor = '#fef2f2'; 
            if (st === 'l') bgColor = '#fffbeb'; 
        } 
        else if (currentModule === 'telefon') {
            const st = appData?.telefon_d?.[todayStr]?.[name]?.sessions?.gunluk?.st;
            if (st) { isCompletedToday = true; subText = '✅ İşlem Yapıldı'; }
            if (st === 'p' || st === 'e') bgColor = '#ecfdf5';
            if (st === 'a') bgColor = '#fef2f2';
        }
        else if (currentModule === 'yatak') {
            const yt = appData?.yatak_d?.[todayStr]?.[name];
            if (yt && yt.yatak_pts !== undefined && yt.dolap_pts !== undefined) { isCompletedToday = true; subText = '✅ İşlem Yapıldı'; }
            if (yt) bgColor = '#f0f9ff';
        }
        else if (currentModule === 'values_view') { 
            if (appData?.values_edu_d?.[name]?.[todayStr]?.done) { bgColor = '#ecfdf5'; isCompletedToday = true; }
        } 
        else if (currentModule === 'class_view') { 
            const d = appData?.education_d?.[name]; 
            if(d) subText = `Ödev: ${(d.lessons||[]).length} | Kitap: ${d.pages||0} | Soru: ${d.questions||0}`; 
        } 
        else if (currentModule === 'deneme_view') { 
            const net = appData?.exams?.[name]?.deneme?.net; 
            subText = net !== undefined ? `Net: ${parseFloat(net).toFixed(2)}` : 'Girilmedi'; 
        } 
        else if (currentModule === 'yazili_view') { 
            const avg = appData?.exams?.[name]?.yazili?.avg; 
            subText = avg !== undefined ? `Ort: ${parseFloat(avg).toFixed(1)}` : 'Girilmedi'; 
        }
        
        const isEliteStud = isElite(name);
        const has2X = (appData?.active_cards?.[name]?.multiplier?.date === todayStr) || (appData?.settings?.global_event === '2x_xp');
        const streakData = appData?.active_cards?.[name]?.streak;
        const hasStreak = streakData && (streakData.date === todayStr || (streakData.end && streakData.end > Date.now()));
        const isDisabled = isNotAtYurt && currentModule !== 'okul';

        return (
          <div key={name} onClick={() => { 
                if (isDisabled || isCompletedToday) {
                    if (isCompletedToday && currentModule === 'okul') alert(`⚠️ ${name} için bugünün Okul Dönüş işlemi zaten yapılmış!\n\nGünde sadece bir kez işlem yapılabilir.`);
                    return;
                }
                setSelectedStudent(name); 
                if (type === 'isleyis') setModalType('isleyis');
                else if (type === 'egitim_ders') { setEduData({ lessons: appData?.education_d?.[name]?.lessons || [], pages: appData?.education_d?.[name]?.pages || 0, questions: appData?.education_d?.[name]?.questions || 0 }); setModalType('egitim'); }
                else if (type === 'egitim_deneme') { setExamData(appData?.exams?.[name]?.deneme || {}); setModalType('deneme'); }
                else if (type === 'egitim_yazili') { setExamData(appData?.exams?.[name]?.yazili || {}); setModalType('yazili'); }
             }} 
               className="card-hover" style={{ background: isDisabled ? '#e2e8f0' : bgColor, border: isEliteStud && !isDisabled ? '2px solid #d4af37' : 'none', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a', cursor: (isDisabled || isCompletedToday) ? 'not-allowed' : 'pointer', opacity: (isDisabled || isCompletedToday) ? 0.7 : 1, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {isCompletedToday && <span style={{ fontSize: '18px' }} title="Tamamlandı">✅</span>}
                {isDisabled && <span style={{ fontSize: '18px' }} title="Kurumda Yok">🚫</span>}
                {isEliteStud && !isCompletedToday && !isDisabled && <span style={{ fontSize: '18px' }} title="Elit Lig">👑</span>}
                {has2X && <span style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>⚡ 2X</span>}
                {hasStreak && <span style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>🛡️</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', textDecoration: isCompletedToday ? 'line-through' : 'none' }}>{name}</div>
            {isDisabled && <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, marginTop: '5px' }}>Kurumda Değil</div>}
            {subText && <div style={{ fontSize: '12px', color: (isCompletedToday && currentModule === 'okul') ? '#10b981' : '#64748b', marginTop: '8px', fontWeight: 800 }}>{subText}</div>}
          </div>
        );
      })}
    </div>
  )};

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

      <input type="file" ref={csvDenemeRef} accept=".csv, .xlsx, .xls" style={{display: 'none'}} onChange={(e) => handleCSVUpload(e, 'deneme')} />
      <input type="file" ref={csvYaziliRef} accept=".csv, .xlsx, .xls" style={{display: 'none'}} onChange={(e) => handleCSVUpload(e, 'yazili')} />

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
              { id: 'turnuva', icon: '🎮', label: 'OYUN ODASI & TURNUVA' },
              { id: 'yonetim', icon: '👑', label: 'SİSTEM YÖNETİMİ' },
              { id: 'admin_custom_slot', icon: '⏰', label: 'Özel Seans Ekle' },
              { id: 'hygiene', icon: '✨', label: 'HİJYEN DENETİM', bg: '#f0fdf4' }
            ].map(mod => (
              <div key={mod.id} onClick={() => {
                  if (mod.id === 'admin_custom_slot' || mod.id === 'hygiene') setCurrentModule(mod.id);
                  else setDashboardView(mod.id);
              }} className="premium-card card-hover" style={{ background: mod.bg || 'white' }}>
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

{dashboardView === 'turnuva' && [
                { id: 'admin_ban', icon: '🕵️‍♂️', label: 'Oyun Odası Denetim Merkezi' },
                { id: 'admin_turnuva', icon: '🏆', label: 'Turnuva Organizasyonu' }
            ].map(mod => (
                <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
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
              { id: 'okul', icon: '🏫', label: 'Okul Dönüş' },
              { id: 'yoklama', icon: '📋', label: 'Yoklama' }, 
              { id: 'telefon', icon: '📱', label: 'Telefon' }, 
              { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' }, 
              { id: 'tutanak', icon: '⚖️', label: 'Tutanak / Ceza' },
              { id: 'devamsizlik', icon: '📉', label: 'Devamsızlık' }
            ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
            
            {dashboardView === 'yonetim' && [ 
              { id: 'admin_students', icon: '👥', label: 'ÖĞRENCİ / BİLET' }, 
              { id: 'admin_discipline', icon: '📜', label: 'DİSİPLİN KURULU' },
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

        {/* --- OYUN ODASI DENETİM MERKEZİ --- */}
        {currentModule === 'admin_ban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '30px', borderRadius: '24px', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e3a8a', fontWeight: 900 }}>🕵️‍♂️ Oyun Odası Sorumlusu & Yönetim</h3>
                    <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '20px', fontWeight: 600 }}>Seçilen öğrenci, oyun odası randevularını kontrol edebilir. Ayrıca buradan tüm randevuları manuel olarak sıfırlayabilirsiniz.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={appData?.settings?.game_room_controller || ''} onChange={e => {
                            db.ref('mavikent_premium/settings/game_room_controller').set(e.target.value);
                            alert(`Oyun Odası Sorumlusu başarıyla atandı! (${e.target.value})`);
                        }} className="elite-input" style={{ flex: 1 }}>
                            <option value="">Sorumlu Seçin</option>
                            {roster.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <button onClick={() => {
                        if(window.confirm('Tüm oyun odası randevuları ŞU AN tamamen temizlenecek. Emin misiniz?')) {
                            const newAppointments = {};
                            
                            // 1. Oynanmamış tüm turnuva maçlarını bul ve yeni tertemiz seans tablosuna yerleştir (2. Hafta, 3. Hafta vb.)
                            Object.keys(appData?.tournaments || {}).forEach(tId => {
                                const t = appData.tournaments[tId];
                                if (t.status === 'active' && t.fixture) {
                                    Object.values(t.fixture).forEach(m => {
                                        if (!m.played && m.day && m.slotId) {
                                            if (!newAppointments[t.device]) newAppointments[t.device] = {};
                                            if (!newAppointments[t.device][m.day]) newAppointments[t.device][m.day] = {};
                                            newAppointments[t.device][m.day][m.slotId] = `🏆 TURNUVA: ${t.name}`;
                                        }
                                    });
                                }
                            });

                            const updates = {};
                            // 2. game_room_appointments tablosunu sadece turnuva maçları olacak şekilde tamamen ez
                            updates['game_room_appointments'] = Object.keys(newAppointments).length > 0 ? newAppointments : null;

                            db.ref('mavikent_premium').update(updates).then(() => {
                                db.ref('mavikent_premium/global_chat').push({ 
                                    s: 'YÖNETİCİ', 
                                    t: '📢 Oyun Odası randevuları sıfırlandı! (Sıradaki lig maçları seanslara otomatik kilitlendi)', 
                                    ts: Date.now(), 
                                    type: 'admin', 
                                    date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
                                });
                                alert('Sistem sıfırlandı! Oynanmamış tüm turnuva maçları (sıradaki haftalar) otomatik olarak oyun odasını kapattı.');
                            }).catch(err => alert("Hata oluştu: " + err.message));
                        }
                    }} className="premium-btn" style={{ width: '100%', background: '#f59e0b', color: 'white', padding: '16px', marginTop: '15px' }}>
                        🎮 TÜM RANDEVULARI ŞİMDİ SIFIRLA
                    </button>
                </div>

                {/* --- YENİ EKLENEN: AKTİF RANDEVULAR VE İADE YÖNETİMİ --- */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🔄 Randevu İptal & İade Yönetimi</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Cihaz arızası gibi durumlarda öğrencinin randevusunu iptal edip ücretini (M-Coin) anında iade edebilirsiniz.</p>
                    <div className="clean-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {(() => {
                            const appointments = [];
                            Object.keys(appData?.game_room_appointments || {}).forEach(device => {
                                Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
                                    Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                                        const student = appData.game_room_appointments[device][day][slotId];
                                        // Turnuva maçlarını listeye dahil etme, sadece normal randevular görünsün
                                        if (student && !String(student).includes("TURNUVA")) { 
                                            appointments.push({ device, day, slotId, student });
                                        }
                                    });
                                });
                            });

                            if (appointments.length === 0) return <div style={{color:'#64748b', fontSize:'13px', fontWeight:600}}>Şu an alınmış aktif randevu bulunmuyor.</div>;

                            return appointments.map((app, idx) => {
                                const devObj = GAME_DEVICES.find(d => d.id === app.device);
                                const devName = devObj ? devObj.name : app.device.toUpperCase();
                                const slotObj = (GAME_SLOTS[app.device] || []).find(s => s.id === app.slotId);
                                const timeStr = slotObj ? slotObj.time : 'Özel Seans';

                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{app.student}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>{devName} • {app.day} • {timeStr}</div>
                                        </div>
                                        <button onClick={() => {
                                            // Tahmini fiyat belirleme
                                            let suggestedPrice = 0;
                                            if (app.device === 'ps5') suggestedPrice = 30;
                                            else if (app.device === 'ps4') suggestedPrice = 20;
                                            else if (app.device === 'vr') suggestedPrice = 40;
                                            else if (app.device === 'pc') suggestedPrice = 30;
                                            
                                            // Eğer özel bir seans ise onun fiyatını bul
                                            const customSlot = appData?.custom_game_slots?.[app.device]?.[app.day]?.[app.slotId];
                                            if (customSlot && customSlot.price) suggestedPrice = Number(customSlot.price);

                                            // Yöneticiye iade edilecek miktarı sor (Tahmini fiyatı otomatik getirir)
                                            const overridePrice = prompt(`${app.student} adlı öğrenciye ne kadar M-Coin iade edilecek?`, suggestedPrice);
                                            if (overridePrice === null) return; 
                                            const finalPrice = parseInt(overridePrice) || 0;

                                            if (window.confirm(`${app.student} adlı öğrencinin randevusu silinip hesabına ${finalPrice} M-Coin iade edilecek. Onaylıyor musunuz?`)) {
                                                const updates = {};
                                                
                                                // 1. Randevuyu boşa çıkar
                                                updates[`game_room_appointments/${app.device}/${app.day}/${app.slotId}`] = null;
                                                
                                                // 2. Bakiyeyi iade et ve loglara yaz
                                                if (finalPrice > 0) {
                                                    updates[`wallet/${app.student}`] = (Number(appData?.wallet?.[app.student]) || 0) + finalPrice;
                                                    updates[`transactions/${app.student}/txn_refund_${Date.now()}`] = { 
                                                        desc: `Randevu İadesi (${devName})`, 
                                                        amt: finalPrice, 
                                                        date: new Date().toLocaleString('tr-TR') 
                                                    };
                                                }

                                                // 3. Değişiklikleri kaydet ve anons geç
                                                db.ref('mavikent_premium').update(updates).then(() => {
                                                    db.ref('mavikent_premium/global_chat').push({ 
                                                        s: 'SİSTEM', 
                                                        t: `📢 ${String(app.student).split(' ')[0]} adlı öğrencinin ${devName} randevusu teknik sebeplerle iptal edilmiş ve ücreti anında iade edilmiştir.`, 
                                                        ts: Date.now(), 
                                                        type: 'system', 
                                                        date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
                                                    });
                                                    alert("✅ Randevu başarıyla iptal edildi ve iade sağlandı.");
                                                });
                                            }
                                        }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '8px 16px', fontSize: '12px' }}>
                                            🔄 İptal & İade
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>📋 Gelen Kontrol Raporları</h3>
                    <div className="clean-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {Object.keys(appData?.game_room_reports || {}).length === 0 ? <div style={{color:'#64748b', fontSize:'13px', fontWeight:600}}>Henüz rapor bulunmuyor.</div> : (
                           Object.keys(appData.game_room_reports).reverse().map(k => {
                               const rep = appData.game_room_reports[k];
                               return (
                                   <div key={k} style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                       <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                           <span>🎮 {rep.target}</span>
                                           <span style={{fontSize:'11px', color:'#64748b'}}>{rep.date}</span>
                                       </div>
                                       <div style={{ fontSize: '12px', color: '#334155', marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                           <div>Sağlam Teslim: {rep.q1 ? '✅' : '❌'}</div>
                                           <div>Tertip Düzen: {rep.q2 ? '✅' : '❌'}</div>
                                           <div>Oyundan Çıkıldı: {rep.q3 ? '✅' : '❌'}</div>
                                           <div>Cihaz Kapatıldı: {rep.q4 ? '✅' : '❌'}</div>
                                       </div>
                                       <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 800 }}>
                                           Yiyecek/İçecek İhlali: {rep.q5 ? <span style={{color:'#ef4444'}}>EVET ⛔ (1 Hafta Ban)</span> : <span style={{color:'#10b981'}}>HAYIR ✅</span>}
                                       </div>
                                       {rep.photoUrl && (
                                           <div style={{ marginTop: '10px' }}>
                                              <img src={rep.photoUrl} alt="İhlal Kanıtı" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ef4444', cursor: 'pointer' }} onClick={() => window.open(rep.photoUrl, '_blank')} />
                                              <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800 }}>📸 Kanıt Fotoğrafı</div>
                                           </div>
                                       )}
                                       <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>Denetleyen: {rep.controller}</div>
                                   </div>
                               )
                           })
                        )}
                    </div>
                </div>

                <div style={{ background: '#fef2f2', padding: '30px', borderRadius: '24px', border: '1px solid #fca5a5' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#b91c1c', fontWeight: 900 }}>⛔ Manuel Ceza Ver</h3>
                    <select value={banInput.student} onChange={e => setBanInput({...banInput, student: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}>
                        <option value="">Öğrenci Seçin</option>
                        {roster.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select value={banInput.duration} onChange={e => setBanInput({...banInput, duration: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}>
                        <option value="1">1 Gün Uzaklaştırma</option>
                        <option value="3">3 Gün Uzaklaştırma</option>
                        <option value="7">1 Hafta Uzaklaştırma</option>
                        <option value="999">Süresiz Kapatma</option>
                    </select>
                    <input type="text" value={banInput.reason} onChange={e => setBanInput({...banInput, reason: e.target.value})} placeholder="Ceza Sebebi" className="elite-input" style={{ marginBottom: '15px' }} />
                    
                    <input type="file" id="adminPhotoInput" accept="image/*" capture="environment" onChange={handleAdminPhotoUpload} style={{ display: 'none' }} />
                    
                    {!banInput.photoUrl ? (
                        <button onClick={() => document.getElementById('adminPhotoInput').click()} className="premium-btn" style={{ background: '#fca5a5', color: '#7f1d1d', padding: '12px', fontSize: '13px', width: '100%', marginBottom: '20px' }}>
                            📷 İsteğe Bağlı: Kanıt Çek / Yükle
                        </button>
                    ) : (
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <img src={banInput.photoUrl} alt="Kanıt" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ef4444', marginBottom: '10px' }} />
                            <button onClick={() => setBanInput({...banInput, photoUrl: ''})} className="premium-btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5 !important', padding: '8px 16px', fontSize: '12px' }}>🗑️ Fotoğrafı Sil</button>
                        </div>
                    )}
                    <button onClick={applyBan} className="premium-btn" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '16px' }}>CEZAYI UYGULA</button>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🚫 Cezalı Öğrenciler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.keys(appData?.game_room_bans || {}).length === 0 && <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 700 }}>Şu an cezalı öğrenci bulunmuyor.</div>}
                        {Object.keys(appData?.game_room_bans || {}).map(student => {
                            const ban = appData.game_room_bans[student];
                            const isExpired = Date.now() > ban.expiry;
                            if (isExpired) return null; 
                            
                            const remainingDays = Math.ceil((ban.expiry - Date.now()) / (1000 * 60 * 60 * 24));
                            const banText = remainingDays > 300 ? 'SÜRESİZ' : `${remainingDays} Gün Kaldı`;

                            return (
                                <div key={student} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 900, color: '#ef4444', fontSize: '15px', marginBottom: '4px' }}>{student}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Sebep: {ban.reason}</div>
                                        {ban.photoUrl && (
                                            <div style={{ marginTop: '8px', cursor: 'pointer' }} onClick={() => window.open(ban.photoUrl, '_blank')}>
                                                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 800, background: '#eff6ff', padding: '4px 8px', borderRadius: '6px' }}>📸 Kanıtı Gör</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', background: '#fef2f2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontWeight: 900, marginBottom: '8px' }}>{banText}</div>
                                        <button onClick={() => removeBan(student)} className="premium-btn" style={{ background: 'white', border: '1px solid #e2e8f0 !important', color: '#64748b', padding: '6px 12px', fontSize: '11px' }}>Kaldır</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

{/* --- ÖZEL SEANS EKLEME MERKEZİ --- */}
        {currentModule === 'admin_custom_slot' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. SEANS EKLEME FORMU */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontWeight: 900 }}>⏰ Yeni Özel Seans Ekle</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '15px' }}>
                        <select value={newCustomSlot.device} onChange={e => setNewCustomSlot({...newCustomSlot, device: e.target.value})} className="elite-input">
                            {GAME_DEVICES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={newCustomSlot.day} onChange={e => setNewCustomSlot({...newCustomSlot, day: e.target.value})} className="elite-input">
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="text" placeholder="Saat (Örn: 10:00 - 11:00)" value={newCustomSlot.time} onChange={e => setNewCustomSlot({...newCustomSlot, time: e.target.value})} className="elite-input" />
                        <input type="number" placeholder="Fiyat (M-Coin)" value={newCustomSlot.price} onChange={e => setNewCustomSlot({...newCustomSlot, price: e.target.value})} className="elite-input" />
                        <button onClick={handleAddCustomSlot} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '16px', fontWeight: 900, border: 'none' }}>YAYINLA</button>
                    </div>
                </div>

                {/* 2. TÜM ÖZEL SEANSLARIN LİSTESİ (GLOBAL GÖRÜNÜM) */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 900 }}>🌐 Aktif Tüm Özel Seanslar</h3>
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                            Toplam: {Object.values(appData?.custom_game_slots || {}).reduce((acc, dev) => acc + Object.values(dev || {}).reduce((acc2, day) => acc2 + Object.keys(day || {}).length, 0), 0)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(() => {
                            const allSlots = [];
                            Object.entries(appData?.custom_game_slots || {}).forEach(([devId, days]) => {
                                Object.entries(days || {}).forEach(([dayName, slots]) => {
                                    Object.entries(slots || {}).forEach(([slotId, slotData]) => {
                                        allSlots.push({ devId, dayName, slotId, ...slotData });
                                    });
                                });
                            });

                            if (allSlots.length === 0) {
                                return <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, border: '2px dashed #e2e8f0', borderRadius: '15px' }}>Henüz hiçbir özel seans eklenmemiş.</div>;
                            }

                            return allSlots.sort((a, b) => DAYS.indexOf(a.dayName) - DAYS.indexOf(b.dayName)).map((item) => (
                                <div key={item.slotId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ background: '#0f172a', color: '#d4af37', padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center', minWidth: '85px' }}>
                                            {item.dayName.toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{item.time} <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>({item.devId.toUpperCase()})</span></div>
                                            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>{item.price} M-Coin</div>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        if(window.confirm(`${item.dayName} günü ${item.time} seansını silmek istediğine emin misin?`)) {
                                            db.ref(`mavikent_premium/custom_game_slots/${item.devId}/${item.dayName}/${item.slotId}`).remove();
                                        }
                                    }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>🗑️ SİL</button>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* --- TURNUVA YÖNETİMİ --- */}
        {currentModule === 'admin_turnuva' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 20px rgba(59,130,246,0.3)' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🏆 Yeni Turnuva (Lig) Başlat</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Turnuva başladığında sistem otomatik fikstür çeker ve maçları seçtiğiniz günlerin akşamlarına dağıtır.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <input type="text" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} placeholder="Turnuva Adı (Örn: FIFA Kış Ligi)" className="elite-input" style={{ gridColumn: '1 / -1' }} />
                        
                        <select value={newTourney.device} onChange={e => setNewTourney({...newTourney, device: e.target.value})} className="elite-input">
                            <option value="ps5">Oynanacak Cihaz: PS5</option>
                            <option value="ps4">Oynanacak Cihaz: PS4</option>
                            <option value="pc">Oynanacak Cihaz: PC</option>
                        </select>
                        <input type="text" value={newTourney.game} onChange={e => setNewTourney({...newTourney, game: e.target.value})} placeholder="Oyun (Örn: FC 24)" className="elite-input" />
                        <input type="number" value={newTourney.fee} onChange={e => setNewTourney({...newTourney, fee: e.target.value})} placeholder="Giriş Ücreti (M)" className="elite-input" />
                        
                        <input type="number" value={newTourney.p1} onChange={e => setNewTourney({...newTourney, p1: e.target.value})} placeholder="🥇 1. Ödülü (M)" className="elite-input" style={{ borderColor: '#fcd34d' }} />
                        <input type="number" value={newTourney.p2} onChange={e => setNewTourney({...newTourney, p2: e.target.value})} placeholder="🥈 2. Ödülü (M)" className="elite-input" style={{ borderColor: '#cbd5e1' }} />
                        <input type="number" value={newTourney.p3} onChange={e => setNewTourney({...newTourney, p3: e.target.value})} placeholder="🥉 3. Ödülü (M)" className="elite-input" style={{ borderColor: '#b45309' }} />
                        
                        <button onClick={handleCreateTournament} className="premium-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', gridColumn: '1 / -1', padding: '16px', marginTop: '10px' }}>TURNUVAYI İLANA AÇ</button>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🎮 Aktif Turnuvalar ve Fikstür</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.keys(appData?.tournaments || {}).length === 0 && <div style={{ color: '#64748b', fontWeight: 700 }}>Henüz oluşturulmuş turnuva yok.</div>}
                        
                        {Object.keys(appData?.tournaments || {}).reverse().map(tId => {
                            const t = appData.tournaments[tId];
                            const parts = t.participants || [];
                            const isLocked = t.status === 'active';
                            const selectedDaysArray = tourneyDaysMap[tId] || [];

                            return (
                                <div key={tId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>{t.name} <span style={{fontSize: '12px', background: isLocked ? '#ecfdf5' : '#fffbeb', color: isLocked ? '#10b981' : '#d97706', padding: '4px 8px', borderRadius: '8px', marginLeft: '8px', verticalAlign: 'middle'}}>{isLocked ? 'Oynanıyor (Fikstür Çekildi)' : 'Kayıt Aşamasında'}</span></div>
                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{t.game} • {String(t.device).toUpperCase()} • Ödüller: 🥇{t.p1}M | 🥈{t.p2}M | 🥉{t.p3}M</div>
                                        </div>
                                        <button onClick={() => { if(window.confirm('Bu turnuvayı tamamen iptal edip SİLMEK istediğine emin misin?')) db.ref(`mavikent_premium/tournaments/${tId}`).remove(); }} className="premium-btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 16px', fontSize: '12px' }}>İptal Et/Sil</button>
                                    </div>

                                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Kayıtlı Oyuncular ({parts.length} Kişi)</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                            {parts.length === 0 ? <div style={{ fontSize: '12px', color: '#94a3b8' }}>Kayıt yok.</div> : parts.map((p, i) => (
                                                <div key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>{String(p).split(' ')[0]}</div>
                                            ))}
                                        </div>

                                        {!isLocked && parts.length >= 2 && (
                                            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', marginBottom: '10px' }}>📅 Maçların Oynanacağı Günleri Seçin:</div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                                    {DAYS.map(day => {
                                                        const isSel = selectedDaysArray.includes(day);
                                                        return (
                                                            <button key={day} onClick={() => toggleTourneyDay(tId, day)} className="profile-btn" style={{ background: isSel ? '#3b82f6' : '#f1f5f9', color: isSel ? 'white' : '#64748b', padding: '8px 16px', fontSize: '12px', border: `1px solid ${isSel ? '#2563eb' : '#e2e8f0'}` }}>
                                                                {day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <button onClick={() => generateFixture(tId, t)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '12px 20px', width: '100%', fontSize: '14px' }}>
                                                    ⚔️ SEÇİLİ GÜNLERE OTOMATİK FİKSTÜR ÇEK VE BAŞLAT
                                                </button>
                                            </div>
                                        )}
                                        
                                        {isLocked && (
                                            <div style={{ marginTop: '15px' }}>
                                                <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>✅ Lig fikstürü çekildi, maçlar oynanıyor. (Sorumlu skorları giriyor)</div>
                                                <button onClick={() => handleEndTournament(tId, t)} className="premium-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', padding: '12px 20px', width: '100%', fontSize: '14px' }}>
                                                    🏆 TURNUVAYI BİTİR VE ŞAMPİYONLARA ÖDÜLLERİ DAĞIT
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
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
        
        {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'tutanak', 'okul', 'devamsizlik'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
        
        {/* EĞİTİM VE DEĞERLER EKRANLARI */}
        {currentModule === 'class_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_ders')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-egitim" onClick={() => downloadReportAsJPG('egitim', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#d4af37', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
             </div>
          </>
        )}
        
        {currentModule === 'deneme_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_deneme')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-deneme" onClick={() => downloadReportAsJPG('deneme', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0d9488', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
                <button onClick={() => downloadCSVTemplate('deneme')} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#10b981', color: 'white', fontSize: '16px', minWidth: '200px' }}>📥 ŞABLON İNDİR (CSV)</button>
                <button onClick={() => csvDenemeRef.current.click()} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0f172a', color: 'white', fontSize: '16px', minWidth: '200px' }}>📤 TOPLU SONUÇ YÜKLE</button>
             </div>
          </>
        )}

        {currentModule === 'yazili_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_yazili')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-yazili" onClick={() => downloadReportAsJPG('yazili', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0d9488', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
                <button onClick={() => downloadCSVTemplate('yazili')} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#3b82f6', color: 'white', fontSize: '16px', minWidth: '200px' }}>📥 ŞABLON İNDİR (CSV)</button>
                <button onClick={() => csvYaziliRef.current.click()} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0f172a', color: 'white', fontSize: '16px', minWidth: '200px' }}>📤 TOPLU SONUÇ YÜKLE</button>
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
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-degerler" onClick={() => downloadReportAsJPG('degerler', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#d4af37', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
            </div>
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
                    <button onClick={() => {
                        if (!newGiftCode.code || !newGiftCode.val) return alert("Tüm alanları doldurun!");
                        db.ref(`mavikent_premium/gift_codes/${newGiftCode.code.toUpperCase().trim()}`).set({
                            type: newGiftCode.type, val: parseInt(newGiftCode.val), uses: parseInt(newGiftCode.uses), usedBy: {}
                        });
                        alert("Kod başarıyla oluşturuldu!"); setNewGiftCode({ code: '', type: 'mcoin', val: '', uses: '1' });
                    }} className="premium-btn" style={{ background: '#0f172a', color: 'white', gridColumn: '1 / -1', padding: '16px' }}>KODU YAYINLA</button>
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

        {/* DİSİPLİN VE ÖDÜL YÖNETİMİ */}
        {currentModule === 'admin_discipline' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 20px rgba(4,120,87,0.3)' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🎁 Yeni Ödül Kartı Üret</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Öğrencilere atanacak dijital ödülleri ve avantajları belirleyin.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                      <input type="text" placeholder="Ödül Adı (Örn: Haftanın Yıldızı)" value={newRewardCard.name} onChange={e => setNewRewardCard({...newRewardCard, name: e.target.value})} className="elite-input" style={{ gridColumn: '1 / -1' }} />
                      <select value={newRewardCard.type} onChange={e => setNewRewardCard({...newRewardCard, type: e.target.value, amount1: '', amount2: ''})} className="elite-input" style={{ gridColumn: '1 / -1', fontWeight: 900, color: '#0f172a' }}>
                          <option value="mcoin">💰 Doğrudan M-Coin & RP Yükle</option>
                          <option value="joker">🎫 Altın Bilet (Oyun Odası Jokeri)</option>
                          <option value="box">📦 Kutu Açma Bileti (Standart/Mega/Elit)</option>
                          <option value="discount">📉 Oyun Odası İndirim Kuponu</option>
                          <option value="bounty">🤝 Kralın İkramı (Arkadaşlarına Para Gönder)</option>
                      </select>
                      
                      {newRewardCard.type === 'mcoin' && (
                          <>
                              <input type="number" placeholder="M-Coin Miktarı" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />
                              <input type="number" placeholder="RP Miktarı" value={newRewardCard.amount2} onChange={e => setNewRewardCard({...newRewardCard, amount2: e.target.value})} className="elite-input" />
                          </>
                      )}
                      {newRewardCard.type === 'joker' && (
                          <input type="number" placeholder="Kaç Adet Bilet Verilecek?" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />
                      )}
                      {newRewardCard.type === 'box' && (
                          <>
                              <input type="number" placeholder="Açılış Hakkı Adedi" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />
                              <select value={newRewardCard.amount2} onChange={e => setNewRewardCard({...newRewardCard, amount2: e.target.value})} className="elite-input">
                                  <option value="">Kutu Tipi Seçin</option><option value="1">Standart Kutu</option><option value="2">Mega Kutu</option><option value="3">Elit Kutu</option>
                              </select>
                          </>
                      )}
                      {newRewardCard.type === 'discount' && (
                          <input type="number" placeholder="İndirim Yüzdesi (Örn: 50)" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />
                      )}
                      {newRewardCard.type === 'bounty' && (
                          <>
                              <input type="number" placeholder="Kaç Kişiye?" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />
                              <input type="number" placeholder="Kişi Başı M-Coin?" value={newRewardCard.amount2} onChange={e => setNewRewardCard({...newRewardCard, amount2: e.target.value})} className="elite-input" />
                          </>
                      )}
                  </div>
                  <button onClick={handleCreateRewardCard} className="premium-btn badge-glow" style={{ background: '#34d399', color: '#064e3b', gridColumn: '1 / -1', padding: '16px' }}>ÖDÜL KARTINI SİSTEME EKLE</button>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 20px rgba(127,29,29,0.3)' }}>
                 <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>📜 Yeni Ceza Kartı Oluştur</h3>
                 <p style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Öğrencilere atanacak standart ihlal ve ceza kurallarını belirleyin.</p>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <input type="text" value={newPenaltyCard.name} onChange={e => setNewPenaltyCard({...newPenaltyCard, name: e.target.value})} placeholder="Ceza Adı (Örn: İzinsiz Dışarı Çıkma)" className="elite-input" style={{ gridColumn: '1 / -1' }} />
                    <input type="number" value={newPenaltyCard.mcoin} onChange={e => setNewPenaltyCard({...newPenaltyCard, mcoin: e.target.value})} placeholder="M-Coin Kesintisi (Örn: 100)" className="elite-input" />
                    <input type="number" value={newPenaltyCard.banDays} onChange={e => setNewPenaltyCard({...newPenaltyCard, banDays: e.target.value})} placeholder="Oyun Odası Ban (Gün)" className="elite-input" />
                    <input type="number" value={newPenaltyCard.rp} onChange={e => setNewPenaltyCard({...newPenaltyCard, rp: e.target.value})} placeholder="RP Kesintisi (Örn: 5)" className="elite-input" />
                    <button onClick={handleCreatePenaltyCard} className="premium-btn badge-glow" style={{ background: '#fca5a5', color: '#450a0a', gridColumn: '1 / -1', padding: '16px', marginTop: '10px' }}>CEZA KARTINI SİSTEME EKLE</button>
                 </div>
              </div>

              <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '15px' }}>📋 Mevcut Ödül ve Ceza Yönetmeliği</h4>
                 <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }} className="clean-scroll">
                     {Object.entries(appData?.reward_cards || {}).map(([id, card]) => (
                         <div key={id} style={{ background: '#ecfdf5', padding: '12px 20px', borderRadius: '16px', border: '1px solid #6ee7b7', minWidth: '220px' }}>
                             <div style={{ fontWeight: 900, color: '#065f46', fontSize: '15px' }}>{card.name}</div>
                             <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700, margin: '5px 0' }}>{card.type.toUpperCase()}</div>
                             <button onClick={() => { if(window.confirm('Ödülü silmek istediğine emin misin?')) db.ref(`mavikent_premium/reward_cards/${id}`).remove(); }} style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, width: '100%' }}>Sil</button>
                         </div>
                     ))}
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.keys(appData?.penalty_cards || {}).map(k => {
                        const card = appData.penalty_cards[k];
                        return (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div>
                                   <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>{card.name}</div>
                                   <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700, marginTop: '4px', display: 'flex', gap: '10px' }}>
                                       {card.mcoin > 0 && <span>-{card.mcoin} M-Coin</span>}
                                       {card.banDays > 0 && <span>{card.banDays} Gün Ban</span>}
                                       {card.rp > 0 && <span>-{card.rp} RP</span>}
                                   </div>
                                </div>
                                <button onClick={() => { if(window.confirm("Bu ceza kartı tamamen silinsin mi?")) db.ref(`mavikent_premium/penalty_cards/${k}`).remove(); }} className="premium-btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 15px' }}>🗑️ SİL</button>
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
                     <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>🕒 Son Giriş: {appData?.last_logins?.[name] || 'Hiç Girmedi'}</div>
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

        {/* TESLİMAT YÖNETİMİ (3'LÜ BİRİKTİRME DESTEKLİ) */}
        {currentModule === 'admin_teslimat' && (() => {
            const allDeliveries = Object.keys(appData?.deliveries || {}).map(k => ({ key: k, ...appData.deliveries[k] })).reverse();
            const waitDeliveries = allDeliveries.filter(d => d.st === 'wait');
            const doneDeliveries = allDeliveries.filter(d => d.st === 'done');

            const studentGroups = {};
            waitDeliveries.forEach(d => {
                if (!studentGroups[d.s]) {
                    studentGroups[d.s] = { normal: [], collections: {} };
                }
                const itemNameUpper = String(d.i || d.n).toUpperCase();
                const matchedCollection = exactCollections.find(cId => itemNameUpper.includes(cId));
                
                if (matchedCollection) {
                    if (!studentGroups[d.s].collections[matchedCollection]) studentGroups[d.s].collections[matchedCollection] = [];
                    studentGroups[d.s].collections[matchedCollection].push(d);
                } else {
                    studentGroups[d.s].normal.push(d);
                }
            });

            return (
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                   <button onClick={() => setDeliveryTab('wait')} className="premium-btn" style={{ flex: 1, padding: '16px', background: deliveryTab === 'wait' ? '#0f172a' : '#f1f5f9', color: deliveryTab === 'wait' ? 'white' : '#64748b', fontSize: '15px' }}>BEKLEYENLER ({waitDeliveries.length})</button>
                   <button onClick={() => setDeliveryTab('done')} className="premium-btn" style={{ flex: 1, padding: '16px', background: deliveryTab === 'done' ? '#10b981' : '#f1f5f9', color: deliveryTab === 'done' ? 'white' : '#64748b', fontSize: '15px' }}>ONAYLANMIŞ ({doneDeliveries.length})</button>
                 </div>

                 {deliveryTab === 'wait' && waitDeliveries.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', background: '#fefce8', padding: '15px', borderRadius: '16px', border: '1px dashed #fde047' }}>
                       <div style={{ width: '100%', fontSize: '13px', fontWeight: 900, color: '#b45309', marginBottom: '8px' }}>⚡ TOPLU İŞLEMLER (Tüm Bekleyenler İçin)</div>
                       <button onClick={() => handleBulkDeliveryAction('approve')} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '10px 15px', fontSize: '12px', flex: 1 }}>✅ TÜMÜNÜ ONAYLA</button>
                       <button onClick={() => handleBulkDeliveryAction('refund')} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '10px 15px', fontSize: '12px', flex: 1 }}>💰 TÜMÜNÜ İPTAL ET (İADELİ)</button>
                       <button onClick={() => handleBulkDeliveryAction('delete')} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 15px', fontSize: '12px', flex: 1 }}>🗑️ TÜMÜNÜ SİL (İADESİZ)</button>
                    </div>
                 )}

                 {deliveryTab === 'wait' ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                         {Object.keys(studentGroups).length === 0 ? (
                             <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: 700 }}>Bekleyen sipariş yok.</div>
                         ) : (
                             Object.keys(studentGroups).map(student => {
                                 const { normal, collections } = studentGroups[student];
                                 return (
                                     <div key={student} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                         <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                             <span style={{ fontSize: '24px' }}>👤</span> {student}
                                         </div>

                                         {/* ÖZEL KOLEKSİYON (3'LÜ) ÜRÜNLERİ */}
                                         {Object.keys(collections).map(cName => {
                                             const items = collections[cName];
                                             const count = items.length;
                                             const isReady = count >= 3;
                                             const cObj = collectionTypes.find(c => c.id === cName) || { icon: '🎁' };
                                             
                                             return (
                                                 <div key={cName} style={{ background: isReady ? '#ecfdf5' : '#fffbeb', border: `1px solid ${isReady ? '#10b981' : '#f59e0b'}`, borderRadius: '16px', padding: '15px', marginBottom: '10px' }}>
                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                         <div style={{ fontWeight: 900, color: isReady ? '#047857' : '#b45309', fontSize: '15px' }}>{cObj.icon} {cName} ({count}/3)</div>
                                                         {isReady ? (
                                                             <button onClick={() => handleDeliverCollection(student, cName, items.map(i=>i.key))} className="premium-btn badge-glow" style={{ background: '#10b981', color: 'white', padding: '8px 16px', fontSize: '12px' }}>🏆 ÖDÜLÜ VER</button>
                                                         ) : (
                                                             <div style={{ display: 'flex', gap: '5px' }}>
                                                                 <button onClick={() => handleCancelCollection(student, items.map(i=>i.key), items, true)} className="premium-btn" style={{ background: 'white', color: '#f59e0b', border: '1px solid #fcd34d !important', padding: '6px 12px', fontSize: '11px' }}>İade</button>
                                                                 <button onClick={() => handleCancelCollection(student, items.map(i=>i.key), items, false)} className="premium-btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5 !important', padding: '6px 12px', fontSize: '11px' }}>Sil</button>
                                                             </div>
                                                         )}
                                                     </div>
                                                     <div style={{ display: 'flex', gap: '6px' }}>
                                                         {[1,2,3].map(i => (<div key={i} style={{ flex: 1, height: '8px', borderRadius: '4px', background: i <= count ? (isReady ? '#10b981' : '#f59e0b') : '#e2e8f0' }}></div>))}
                                                     </div>
                                                 </div>
                                             )
                                         })}

                                         {/* NORMAL ÜRÜNLER (TOST, İZİN VS) */}
                                         {normal.map(ord => {
                                             const isLottery = ord.i && ord.i.includes("(Çekiliş)");
                                             const isScratch = ord.i && ord.i.includes("(Kazı Kazan)");
                                             const isBox = ord.n && ord.n.includes("(Kutudan)");
                                             let badgeText = isLottery ? '🎰 ÇEKİLİŞ' : isScratch ? '🪙 KAZI KAZAN' : isBox ? '🎁 KUTU' : '🛍️ MARKET';
                                             let badgeColor = isLottery ? '#8b5cf6' : isScratch ? '#059669' : isBox ? '#f59e0b' : '#3b82f6';
                                             
                                             return (
                                                 <div key={ord.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '12px', borderLeft: `4px solid ${badgeColor}`, marginBottom: '8px' }}>
                                                     <div>
                                                         <div style={{ fontWeight: 800, fontSize: '14px', color: '#334155', marginBottom: '4px' }}>{ord.i || ord.n}</div>
                                                         <span style={{ background: badgeColor, color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{badgeText}</span>
                                                     </div>
                                                     <div style={{ display: 'flex', gap: '5px' }}>
                                                         <button onClick={() => handleApproveDelivery(ord.key, ord)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '6px 12px', fontSize: '12px' }}>✅ Ver</button>
                                                         <button onClick={() => handleCancelDelivery(ord.key, ord, true)} className="premium-btn" style={{ background: '#f1f5f9', color: '#f59e0b', padding: '6px 12px', fontSize: '12px' }}>💰 İade</button>
                                                         <button onClick={() => handleCancelDelivery(ord.key, ord, false)} className="premium-btn" style={{ background: '#f1f5f9', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>🗑️ Sil</button>
                                                     </div>
                                                 </div>
                                             )
                                         })}
                                     </div>
                                 )
                             })
                         )}
                     </div>
                 ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                         {doneDeliveries.map(item => (
                             <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '16px', borderLeft: '4px solid #10b981', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                 <div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{item.s}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{item.i || item.n} <span style={{fontSize:'11px', color:'#94a3b8'}}>({item.date})</span></div>
                                 </div>
                                 <button onClick={() => db.ref(`mavikent_premium/deliveries/${item.key}/st`).set('wait')} className="premium-btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '8px 15px', fontSize: '12px' }}>Geri Al</button>
                             </div>
                         ))}
                         {doneDeliveries.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontWeight: 700 }}>Geçmiş işlem bulunmuyor.</div>}
                     </div>
                 )}
              </div>
            );
        })()}

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
                       <button onClick={() => { if(window.confirm('Bu görevi tamamen silmek istediğine emin misin?')) { db.ref(`mavikent_premium/quests/${qId}`).set(null); setQuestInputs({...questInputs, [`${qId}_text`]: '', [`${qId}_amt`]: '', [`${qId}_type`]: 'M'}); alert("Görev Silindi!"); } }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '16px', minWidth: '80px' }}>🗑️ SİL</button>
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

        {/* AYARLAR YÖNETİMİ */}
        {currentModule === 'admin_settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', gridColumn: '1 / -1' }}>
               <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '8px' }}>⚡ SİSTEM ETKİNLİKLERİ</h4>
               <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Tüm yurtta aynı anda devreye girecek etkinlikler ve enflasyon yönetimi.</p>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <button onClick={() => { db.ref('mavikent_premium/settings/global_event').set('2x_xp'); alert("Tüm yurt için 2X XP aktif edildi!"); }} className="premium-btn" style={{ background: appData?.settings?.global_event === '2x_xp' ? '#10b981' : '#f8fafc', color: appData?.settings?.global_event === '2x_xp' ? 'white' : '#64748b', border: appData?.settings?.global_event === '2x_xp' ? 'none' : '2px solid #e2e8f0' }}>⭐ TÜM YURT 2X ÇARPAN</button>
                  <button onClick={() => { db.ref('mavikent_premium/settings/global_event').set('none'); alert("Etkinlikler durduruldu."); }} className="premium-btn" style={{ background: appData?.settings?.global_event === 'none' || !appData?.settings?.global_event ? '#ef4444' : '#f8fafc', color: appData?.settings?.global_event === 'none' || !appData?.settings?.global_event ? 'white' : '#64748b', border: appData?.settings?.global_event === 'none' || !appData?.settings?.global_event ? 'none' : '2px solid #e2e8f0' }}>🚫 ETKİNLİKLERİ BİTİR</button>
                  <button onClick={() => { if(window.confirm('Tüm öğrencilere anında 1 adet Şans Çarkı Bileti hediye edilecek. Onaylıyor musun?')) { const updates = {}; roster.forEach(n => { updates[`tickets/${n}`] = (Number(appData?.tickets?.[n]) || 0) + 1; }); db.ref('mavikent_premium').update(updates); alert('🎟️ Biletler başarıyla dağıtıldı!'); } }} className="premium-btn" style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '15px' }}>🎟️ HERKESE 1 BİLET DAĞIT</button>
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
{/* --- HİJYEN DENETİM MERKEZİ (PREMIUM TASARIM) --- */}
        {currentModule === 'hygiene' && (
            <div className="fade-in" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                
                {/* ŞIK ÜST SEKME MENÜSÜ */}
                <div className="clean-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', background: 'white', padding: '12px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', marginBottom: '25px', border: '1px solid #f1f5f9' }}>
                    <button onClick={() => setHygieneTab('wc')} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '16px', border: 'none', background: hygieneTab === 'wc' ? '#0ea5e9' : 'transparent', color: hygieneTab === 'wc' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🚽</span> WC Paneli
                    </button>
                    <button onClick={() => setHygieneTab('general')} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '16px', border: 'none', background: hygieneTab === 'general' ? '#10b981' : 'transparent', color: hygieneTab === 'general' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🧹</span> Temizlik Kontrol
                    </button>
                    <button onClick={() => setHygieneTab('rooms')} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '16px', border: 'none', background: hygieneTab === 'rooms' ? '#8b5cf6' : 'transparent', color: hygieneTab === 'rooms' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🛏️</span> Oda Düzeni
                    </button>
                    <button onClick={() => setHygieneTab('history')} style={{ flexShrink: 0, padding: '14px 24px', borderRadius: '16px', border: 'none', background: hygieneTab === 'history' ? '#f59e0b' : 'transparent', color: hygieneTab === 'history' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📜</span> Geçmiş
                    </button>
                </div>

                {/* 1. PANEL: WC DENETİM */}
                {hygieneTab === 'wc' && (
                    <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(15,23,42,0.04)', border: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '22px' }}>WC Denetim Paneli</h3>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Denetlemek istediğiniz alanı şık kartlardan seçin.</div>
                            </div>
                            <button onClick={wcEditMode ? saveWcAssignments : openWcEditMode} className="premium-btn" style={{ background: wcEditMode ? '#10b981' : '#f1f5f9', color: wcEditMode ? 'white' : '#0ea5e9', padding: '12px 20px', fontSize: '13px', border: `1px solid ${wcEditMode ? '#10b981' : '#e0f2fe'} !important` }}>
                                {wcEditMode ? '💾 LİSTEYİ KAYDET' : '🛠️ Nöbetçileri Ata'}
                            </button>
                        </div>

                        {wcEditMode ? (
                            <div className="fade-in">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                                    {Object.entries(tempWcData).map(([wcKey, wcData]) => (
                                        <div key={wcKey} style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontWeight: 900, color: '#0ea5e9', fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🚽</span> {wcData.name}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {[0, 1, 2, 3, 4].map(slot => (
                                                    <select key={slot} value={wcData.responsibles[slot] || ''} onChange={(e) => {
                                                            const newArr = [...(wcData.responsibles || [])];
                                                            newArr[slot] = e.target.value;
                                                            setTempWcData({...tempWcData, [wcKey]: {...wcData, responsibles: newArr.filter(Boolean)}});
                                                        }}
                                                        className="elite-input" style={{ padding: '12px', fontSize: '13px', borderRadius: '12px', background: 'white' }}
                                                    >
                                                        <option value="">-- Öğrenci Seç --</option>
                                                        {roster.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setWcEditMode(false)} className="btn-iptal" style={{ width: '100%', marginTop: '20px' }}>İPTAL ET</button>
                            </div>
                        ) : (
                            <div className="fade-in">
                                {/* DOKUNMATİK WC SEÇİCİ (Select yerine kullanıyoruz) */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '30px' }}>
                                    {['wc_1', 'wc_2', 'wc_3', 'wc_4', 'wc_5', 'wc_6'].map(key => {
                                        const area = appData?.hygiene_areas?.[key];
                                        if(!area) return null;
                                        const isSelected = hygieneForm.areaId === key;
                                        return (
                                            <div key={key} onClick={() => setHygieneForm({...hygieneForm, areaId: key})} className="card-hover" style={{ background: isSelected ? '#0ea5e9' : '#f8fafc', border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`, padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: '0.2s', boxShadow: isSelected ? '0 10px 20px rgba(14,165,233,0.3)' : 'none' }}>
                                                <div style={{ fontSize: '24px', marginBottom: '6px', opacity: isSelected ? 1 : 0.6 }}>🚽</div>
                                                <div style={{ fontWeight: 900, fontSize: '14px', color: isSelected ? 'white' : '#0f172a' }}>{area.name}</div>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#e0f2fe' : '#64748b', marginTop: '4px' }}>{(area.responsibles || []).length} Nöbetçi</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '25px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ textAlign: 'center', fontWeight: 900, color: '#0ea5e9', fontSize: '16px', marginBottom: '15px' }}>TEMİZLİK PUANINI BELİRLE</div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setHygieneForm({...hygieneForm, score: star})} style={{ flex: 1, maxWidth: '70px', padding: '15px 0', fontSize: '28px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: hygieneForm.score >= star ? 'linear-gradient(135deg, #fcd34d, #f59e0b)' : '#ffffff', color: hygieneForm.score >= star ? '#fff' : '#cbd5e1', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: hygieneForm.score >= star ? '0 8px 15px rgba(245,158,11,0.3)' : '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px', fontWeight: 800, color: hygieneForm.score >= 3 ? '#10b981' : '#ef4444' }}>
                                        Bu puana göre nöbetçilere {hygieneForm.score === 5 ? '+30 M-Coin' : hygieneForm.score === 4 ? '+20 M-Coin' : hygieneForm.score === 3 ? '+10 M-Coin' : hygieneForm.score === 2 ? '-30 M-Coin' : '-60 M-Coin'} yansıtılacak.
                                    </div>

                                    <button onClick={saveInspection} disabled={isHygieneSaving} className="premium-btn badge-glow" style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #1e3a8a, #0f172a)', color: 'white', fontWeight: 900, fontSize: '16px', border: 'none', boxShadow: '0 10px 20px rgba(30,58,138,0.4)' }}>
                                    {isHygieneSaving ? '⏳ İşleniyor...' : '✅ DENETİMİ ONAYLA VE KAYDET'}
                                </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. PANEL: ODA DENETİMİ (DOKUNMATİK) */}
                {hygieneTab === 'rooms' && (
                    <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(15,23,42,0.04)', border: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '22px' }}>Oda Düzeni Paneli</h3>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Odaların genel tertip düzenini denetleyin.</div>
                            </div>
                            <button onClick={roomEditMode ? saveRoomAssignments : openRoomEditMode} className="premium-btn" style={{ background: roomEditMode ? '#10b981' : '#f1f5f9', color: roomEditMode ? 'white' : '#8b5cf6', padding: '12px 20px', fontSize: '13px', border: `1px solid ${roomEditMode ? '#10b981' : '#ede9fe'} !important` }}>
                                {roomEditMode ? '💾 ODALARI KAYDET' : '🛠️ Odaları Düzenle'}
                            </button>
                        </div>

                        {roomEditMode ? (
                            <div className="fade-in">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                    {Object.entries(tempRoomData).map(([roomKey, roomData]) => (
                                        <div key={roomKey} style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                            <input value={roomData.name} onChange={e => setTempRoomData({...tempRoomData, [roomKey]: {...roomData, name: e.target.value}})} className="elite-input" style={{ marginBottom: '15px', fontWeight: 900, color: '#8b5cf6', borderColor: '#8b5cf6', background: 'white' }} />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {Array.from({ length: 10 }, (_, i) => i).map(slot => (
                                                    <select key={slot} value={roomData.responsibles[slot] || ''} onChange={(e) => {
                                                            const newArr = [...(roomData.responsibles || [])];
                                                            newArr[slot] = e.target.value;
                                                            setTempRoomData({...tempRoomData, [roomKey]: {...roomData, responsibles: newArr.filter(Boolean)}});
                                                        }}
                                                        className="elite-input" style={{ padding: '10px', fontSize: '12px', borderRadius: '10px', background: 'white' }}
                                                    >
                                                        <option value="">-- Seç --</option>
                                                        {roster.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setRoomEditMode(false)} className="btn-iptal" style={{ width: '100%', marginTop: '25px' }}>İPTAL ET</button>
                            </div>
                        ) : (
                            <div className="fade-in">
                                {/* DOKUNMATİK ODA SEÇİCİ */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '30px' }}>
                                    {Object.entries(appData?.room_areas || {}).filter(([k, v]) => v.responsibles?.length > 0).map(([key, area]) => {
                                        const isSelected = roomForm.areaId === key;
                                        return (
                                            <div key={key} onClick={() => setRoomForm({...roomForm, areaId: key})} className="card-hover" style={{ background: isSelected ? '#8b5cf6' : '#f8fafc', border: `2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`, padding: '16px', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: '0.2s', boxShadow: isSelected ? '0 10px 20px rgba(139,92,246,0.3)' : 'none' }}>
                                                <div style={{ fontSize: '24px', marginBottom: '6px', opacity: isSelected ? 1 : 0.6 }}>🛏️</div>
                                                <div style={{ fontWeight: 900, fontSize: '14px', color: isSelected ? 'white' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{area.name}</div>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#ede9fe' : '#64748b', marginTop: '4px' }}>{(area.responsibles || []).length} Öğrenci</div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '25px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ textAlign: 'center', fontWeight: 900, color: '#8b5cf6', fontSize: '16px', marginBottom: '15px' }}>ODA DÜZENİ PUANINI BELİRLE</div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setRoomForm({...roomForm, score: star})} style={{ flex: 1, maxWidth: '70px', padding: '15px 0', fontSize: '28px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: roomForm.score >= star ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' : '#ffffff', color: roomForm.score >= star ? '#fff' : '#cbd5e1', transition: 'all 0.2s', boxShadow: roomForm.score >= star ? '0 8px 15px rgba(139,92,246,0.3)' : '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px', fontWeight: 800, color: roomForm.score >= 3 ? '#10b981' : '#ef4444' }}>
                                        Bu puana göre odadaki öğrencilere {getRoomCoinImpact(roomForm.score)} M-Coin yansıtılacak.
                                    </div>

                                    <button onClick={saveRoomInspection} disabled={isHygieneSaving} className="premium-btn badge-glow" style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #4c1d95, #2e1065)', color: 'white', fontWeight: 900, fontSize: '16px', border: 'none', boxShadow: '0 10px 20px rgba(76,29,149,0.4)' }}>
                                        {isHygieneSaving ? '⏳ İşleniyor...' : '✅ ODA DENETİMİNİ KAYDET'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. PANEL: GENEL TEMİZLİK (KOMPAKT KARTLI SİSTEM) */}
                {hygieneTab === 'general' && (
                    <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(15,23,42,0.04)', border: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '22px' }}>🧹 Bireysel Temizlik Kontrolü</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Öğrencilerin görev alanlarını şık ve hızlı bir şekilde puanlayın.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={saveCleaningTasks} className="premium-btn" style={{ background: 'linear-gradient(135deg, #334155, #0f172a)', color: 'white', padding: '10px 20px', fontSize: '13px', border: 'none', boxShadow: '0 5px 15px rgba(15,23,42,0.3)' }}>📍 YERLERİ KAYDET</button>
                                <button onClick={async () => {
                                        const entries = Object.entries(generalCleaningList).filter(([name, data]) => data.area && data.score);
                                        if(entries.length === 0) return alert("En az bir öğrenci için alan ve puan girmelisiniz!");
                                        if(!window.confirm(`${entries.length} öğrencinin puanı kaydedilecek. Onaylıyor musun?`)) return;
                                        
                                        setIsHygieneSaving(true);
                                        const updates = {};
                                        const now = Date.now();
                                        
                                        entries.forEach(([student, data]) => {
                                            const impact = getCoinImpact(data.score);
                                            const logId = `gen_${student}_${now}`;
                                            updates[`hygiene_logs/${logId}`] = { student, areaName: data.area, score: data.score, timestamp: now, coinImpact: impact, type: 'general' };
                                            updates[`wallet/${student}`] = (Number(appData?.wallet?.[student]) || 0) + impact;
                                            updates[`transactions/${student}/txn_${logId}`] = { desc: `${data.area} Temizlik Kontrolü`, amt: impact, date: new Date().toLocaleString('tr-TR') };
                                        });

                                        try {
                                            await db.ref('mavikent_premium').update(updates);
                                            alert("✅ Günlük temizlik kontrolleri kaydedildi ve M-Coin'ler dağıtıldı!");
                                            setGeneralCleaningList({}); 
                                        } catch (e) { alert("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
                                    }} 
                                    disabled={isHygieneSaving} className="premium-btn badge-glow" style={{ background: 'linear-gradient(135deg, #065f46, #022c22)', color: 'white', padding: '10px 24px', fontSize: '13px', border: 'none', boxShadow: '0 5px 15px rgba(6,78,59,0.4)' }}>
                                    {isHygieneSaving ? '⏳...' : '🚀 PUANLARI DAĞIT'}
                                </button>
                            </div>
                        </div>

                        {/* DERLİ TOPLU LİSTE GÖRÜNÜMÜ */}
                        <div className="clean-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingRight: '10px' }}>
                            {roster.map(student => {
                                const data = generalCleaningList[student] || {};
                                const isScored = data.score > 0;
                                return (
                                    <div key={student} style={{ background: isScored ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isScored ? '#a7f3d0' : '#e2e8f0'}`, borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: isScored ? '0 4px 10px rgba(16,185,129,0.1)' : 'none' }}>
                                        <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{student}</span>
                                            {isScored && <span style={{ fontSize: '12px', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '8px' }}>Hazır</span>}
                                        </div>
                                        <input placeholder="Görev Alanı (Örn: Mescid)" value={data.area || ''} onChange={(e) => setGeneralCleaningList({...generalCleaningList, [student]: {...data, area: e.target.value}})} className="elite-input" style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '12px', background: 'white' }} />
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                                            {[1,2,3,4,5].map(s => (
                                                <button key={s} onClick={() => setGeneralCleaningList({...generalCleaningList, [student]: {...data, score: s}})} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', cursor: 'pointer', background: (data.score || 0) >= s ? '#10b981' : '#e2e8f0', color: (data.score || 0) >= s ? 'white' : '#94a3b8', fontSize: '16px', transition: '0.2s' }}>★</button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4. PANEL: GEÇMİŞ LOGLAR (TEMİZ TASARIM) */}
                {hygieneTab === 'history' && (
                    <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(15,23,42,0.04)', border: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '22px' }}>📜 Son Denetim Kayıtları</h3>
                            <button onClick={() => { if(window.confirm('Tüm geçmişi silmek istediğine emin misin?')) db.ref('mavikent_premium/hygiene_logs').set(null); }} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>Geçmişi Temizle</button>
                        </div>
                        
                        <div className="clean-scroll" style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px' }}>
                            {Object.values(appData?.hygiene_logs || {}).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 700 }}>Henüz kayıt bulunmuyor.</div>
                            ) : (
                                Object.values(appData.hygiene_logs).sort((a,b) => b.timestamp - a.timestamp).slice(0, 50).map((log, i) => (
                                    <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{log.type === 'room' ? '🛏️' : log.type === 'wc' ? '🚽' : '🧹'} {log.areaName}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                                                {log.student || (log.responsibles && log.responsibles.length > 0 ? log.responsibles.join(', ') : 'Kişi Yok')}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginTop: '4px' }}>{new Date(log.timestamp).toLocaleString('tr-TR')} • {log.inspector}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 900, color: log.coinImpact >= 0 ? '#10b981' : '#ef4444', fontSize: '18px', background: log.coinImpact >= 0 ? '#ecfdf5' : '#fef2f2', padding: '4px 12px', borderRadius: '12px', display: 'inline-block' }}>
                                                {log.coinImpact >= 0 ? '+' : ''}{log.coinImpact} M
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px', letterSpacing: '2px' }}>{'★'.repeat(log.score)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
      {/* --- EKSİK KALAN MODALLAR (YOKLAMA, EĞİTİM, SINAV VB.) --- */}
      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '13px', background: '#fde047', color: '#b45309', padding: '6px 14px', borderRadius: '12px', fontWeight: 900, marginBottom: '24px', display: 'inline-block' }}>👑 ELİT LİG BONUSU</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: isElite(selectedStudent) ? '0' : '24px' }}>
              {currentModule === 'tutanak' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setTutanakTab('odul')} className="premium-btn" style={{ flex: 1, background: tutanakTab === 'odul' ? '#10b981' : '#f1f5f9', color: tutanakTab === 'odul' ? 'white' : '#64748b', padding: '12px' }}>🎁 Ödül Ver</button>
                        <button onClick={() => setTutanakTab('ceza')} className="premium-btn" style={{ flex: 1, background: tutanakTab === 'ceza' ? '#ef4444' : '#f1f5f9', color: tutanakTab === 'ceza' ? 'white' : '#64748b', padding: '12px' }}>⚖️ Ceza Yaz</button>
                    </div>

                    {tutanakTab === 'odul' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.keys(appData?.reward_cards || {}).length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Kayıtlı ödül yok. Yönetimden ekleyin.</div>
                            ) : (
                                Object.keys(appData?.reward_cards || {}).map(k => {
                                    const card = appData.reward_cards[k];
                                    return (
                                        <button key={k} onClick={() => applyRewardCard(selectedStudent, k)} className="premium-btn" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7 !important', color: '#065f46', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '16px' }}>{card.name}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {card.type === 'mcoin' && `+${card.amount1} M-Coin | +${card.amount2} RP`}
                                                {card.type === 'joker' && `${card.amount1}x Altın Bilet`}
                                                {card.type === 'box' && `${card.amount1}x ${card.amount2 === '1' ? 'Standart' : card.amount2 === '2' ? 'Mega' : 'Elit'} Kutu`}
                                                {card.type === 'discount' && `%${card.amount1} İndirim`}
                                                {card.type === 'bounty' && `Kralın İkramı (${card.amount1} Kişi)`}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {tutanakTab === 'ceza' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.keys(appData?.penalty_cards || {}).length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Kayıtlı ceza yok.</div>
                            ) : (
                                Object.keys(appData?.penalty_cards || {}).map(k => {
                                    const card = appData.penalty_cards[k];
                                    return (
                                        <button key={k} onClick={() => applyPenaltyCard(selectedStudent, k)} className="premium-btn" style={{ background: '#fef2f2', border: '1px solid #fca5a5 !important', color: '#7f1d1d', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '16px' }}>{card.name}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {card.mcoin > 0 && `-${card.mcoin} M-Coin `}
                                                {card.banDays > 0 && ` | ${card.banDays} Gün Ban `}
                                                {card.rp > 0 && ` | -${card.rp} RP `}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
              )}
              {currentModule === 'okul' && (
                <>
                  <button onClick={() => saveData('okul', 'p', 10)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🏠 DÖNDÜ (+10 M)</button>
                  <button onClick={() => saveData('okul', 'a', -20)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 GELMEDİ (-20 M + 📉)</button>
                  <button onClick={() => saveData('okul', 'i', 0)} className="premium-btn" style={{ background: '#64748b', color: 'white', padding: '20px' }}>✉️ İZİNLİ (0 M)</button>
                </>
              )}
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', 3)} className="premium-btn" style={{ background: '#d4af37', color: 'white', padding: '20px' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, 3, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, 2, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', 1)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '20px' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, 1, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', -3)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>❌ GELMEDİ (-3 M, Seri Bozar)</button>
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
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>
             
             <button onClick={() => {
                 if(window.confirm(`${selectedStudent} adlı öğrencinin ${modalType === 'deneme' ? 'Deneme' : 'Yazılı'} geçmişi tamamen silinecek. Onaylıyor musun?`)) {
                     db.ref(`mavikent_premium/exams/${selectedStudent}/${modalType}`).set(null);
                     setExamData({});
                     alert('Geçmiş başarıyla temizlendi!');
                 }
             }} style={{ position: 'absolute', top: '20px', right: '20px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>🗑️ Geçmişi Sil</button>

             <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
             <div style={{ fontSize: '14px', color: '#0d9488', fontWeight: 900, marginBottom: '30px', letterSpacing: '1px' }}>{modalType === 'deneme' ? 'DETAYLI DENEME SINAVI (OPTİK)' : 'YAZILI GİRİŞİ'}</div>
             
             <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                 {examSubjects.map((sub, idx) => {
                     const currentD = parseFloat(examData[`d_${idx}`]) || 0;
                     const currentY = parseFloat(examData[`y_${idx}`]) || 0;
                     const currentNet = (currentD - (currentY / 3)).toFixed(2);
                     
                     return (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: idx !== examSubjects.length-1 ? '16px' : '0' }}>
                         <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', width: '100px', textAlign: 'left' }}>{sub}</span>
                         {modalType === 'deneme' ? (
                             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                 <input type="number" placeholder="D" value={examData[`d_${idx}`] || ''} onChange={e => setExamData({...examData, [`d_${idx}`]: e.target.value})} className="elite-input" style={{ width: '50px', padding: '10px 0', textAlign: 'center', fontSize: '14px', border: '1px solid #10b981 !important', color: '#047857', background: '#ecfdf5' }} title="Doğru Sayısı" />
                                 <input type="number" placeholder="Y" value={examData[`y_${idx}`] || ''} onChange={e => setExamData({...examData, [`y_${idx}`]: e.target.value})} className="elite-input" style={{ width: '50px', padding: '10px 0', textAlign: 'center', fontSize: '14px', border: '1px solid #ef4444 !important', color: '#b91c1c', background: '#fef2f2' }} title="Yanlış Sayısı" />
                                 <input type="number" placeholder="B" value={examData[`b_${idx}`] || ''} onChange={e => setExamData({...examData, [`b_${idx}`]: e.target.value})} className="elite-input" style={{ width: '50px', padding: '10px 0', textAlign: 'center', fontSize: '14px', border: '1px solid #94a3b8 !important', color: '#475569', background: '#f8fafc' }} title="Boş Sayısı" />
                                 
                                 <div style={{ width: '65px', padding: '10px 0', background: '#0f172a', color: 'white', borderRadius: '12px', fontWeight: 900, fontSize: '14px', textAlign: 'center' }} title="Ders Neti">
                                     {currentNet}
                                 </div>
                             </div>
                         ) : (
                             <input type="number" placeholder="Not" value={examData[`p_${idx}`] || ''} onChange={e => setExamData({...examData, [`p_${idx}`]: e.target.value})} className="elite-input" style={{ width: '90px', padding: '12px 0', textAlign: 'center', fontSize: '16px' }} />
                         )}
                     </div>
                 )})}
             </div>

             {modalType === 'deneme' && (
                 <div style={{ background: '#f0fdfa', border: '2px dashed #0d9488', padding: '15px', borderRadius: '16px', marginBottom: '20px', color: '#0f766e', fontWeight: 900, fontSize: '20px' }}>
                     TOPLAM NET: {
                         examSubjects.reduce((total, _, i) => {
                             const d = parseFloat(examData[`d_${i}`]) || 0;
                             const y = parseFloat(examData[`y_${i}`]) || 0;
                             return total + (d - (y / 3));
                         }, 0).toFixed(2)
                     }
                 </div>
             )}

             <div style={{ textAlign: 'left', fontWeight: '900', fontSize: '14px', color: '#64748b', marginBottom: '10px', paddingLeft: '8px' }}>HEDEF {modalType === 'deneme' ? 'NET' : 'ORTALAMA'}:</div>
             <input type="number" value={examData.target || ''} onChange={e => setExamData({...examData, target: e.target.value})} placeholder="Örn: 85" className="elite-input" style={{ width: '100%', padding: '20px', fontSize: '20px', textAlign: 'center', marginBottom: '35px' }} />

             <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ flex: 1 }}>İPTAL</button>
              <button onClick={() => saveExamData(modalType)} className="premium-btn" style={{ flex: 2, padding: '20px', background: '#0d9488', color: 'white', fontSize: '16px' }}>KAYDET</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminScreen;