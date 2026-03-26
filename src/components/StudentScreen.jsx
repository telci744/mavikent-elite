import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';

const BADGES = {
  soru_1: { id: 'soru_1', icon: '🥉', name: 'Soru Çırağı', desc: '500 soru çöz.', req: 500, rew: 50, type: 'soru' },
  soru_2: { id: 'soru_2', icon: '🥈', name: 'Soru Avcısı', desc: '1.000 soru çöz.', req: 1000, rew: 150, type: 'soru' },
  soru_3: { id: 'soru_3', icon: '🥇', name: 'Test Makinesi', desc: '2.000 soru çöz.', req: 2000, rew: 300, type: 'soru' },
  deneme_1: { id: 'deneme_1', icon: '💎', name: 'Keskin Nişancı', desc: 'Denemede hedefi geç.', rew: 50, type: 'manual' },
  odev_1: { id: 'odev_1', icon: '🔥', name: 'Görevin Adamı', desc: 'Ödevleri eksiksiz yap.', type: 'manual' },
  kitap_1: { id: 'kitap_1', icon: '🥉', name: 'Kitap Kurdu', desc: '500 sayfa kitap oku.', req: 500, rew: 50, type: 'kitap' },
  kitap_2: { id: 'kitap_2', icon: '🥈', name: 'Bilgi Bekçisi', desc: '2.000 sayfa kitap oku.', req: 2000, rew: 150, type: 'kitap' },
  kitap_3: { id: 'kitap_3', icon: '🥇', name: 'Filozof', desc: '5.000 sayfa kitap oku.', req: 5000, rew: 250, type: 'kitap' },
  cuzdan_1: { id: 'cuzdan_1', icon: '🪙', name: 'İlk Maaş', desc: '300 M-Coin biriktir.', req: 300, type: 'cuzdan' },
  cuzdan_2: { id: 'cuzdan_2', icon: '🏦', name: 'Borsa Kurdu', desc: '1.000 M-Coin görsün.', req: 1000, type: 'cuzdan' },
  gizli_1: { id: 'gizli_1', icon: '🛡️', name: 'Mavikent Efsanesi', desc: 'Kusursuzlara verilir.', type: 'gizli' },
  gizli_3: { id: 'gizli_3', icon: '👑', name: 'Elitlerin Efendisi', desc: 'Elit Lige çıkana verilir.', type: 'gizli' }
};

const BAD_WORDS = ['amk', 'aq', 'siktir', 'piç', 'oç', 'yavşak', 'lan', 'mal', 'salak', 'gerizekalı'];
const censorText = (text) => {
    let res = text;
    BAD_WORDS.forEach(bw => { const regex = new RegExp(bw, 'gi'); res = res.replace(regex, '***'); });
    return res;
};

// --- EKLENEN: ÜNVAN TEMİZLEYİCİ VE OYUN ODASI FİLTRESİ ---
const formatTitle = (raw) => {
    if (!raw) return null;
    return String(raw)
        .replace(/\(.*?\)/g, '') // (Kazı Kazan), (Kutu) gibi kısımları sil
        .replace(/Ünvanı/gi, '') // "Ünvanı" kelimesini sil
        .replace(/['"]/g, '') // Tırnak işaretlerini sil
        .trim(); // Boşlukları al
};

const isGameRoomItem = (name) => {
    const n = String(name).toUpperCase();
    return ['PS4', 'PS5', 'VR ', 'GÖZLÜK', 'BİLGİSAYAR', ' PC', ' DK)'].some(kw => n.includes(kw));
};

const isDigitalItem = (type, name) => {
    const t = String(type || '').toLowerCase();
    const n = String(name || '').toUpperCase();
    return t === 'multiplier' || t === 'streak' || t === 'avatar' || t === 'title' || t === 'frame' || 
           n.includes("KUTU") || n.includes("GİZEMLİ") || n.includes("2X") || 
           n.includes("ÇARPAN") || n.includes("KORUMA") || n.includes("SERİ") || 
           n.includes("ÜNVAN");
};

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GAME_DEVICES = [
    { id: 'ps4', name: 'PS4', icon: '🎮' },
    { id: 'ps5', name: 'PS5', icon: '🕹️' },
    { id: 'vr', name: 'VR (Sanal Gerçeklik)', icon: '🥽' },
    { id: 'pc', name: 'Bilgisayar', icon: '💻' }
];
const GAME_SLOTS = {
    'ps4': [
        { id: 'ps4_1', time: '15:45 - 16:15', price: 5 },
        { id: 'ps4_2', time: '16:15 - 16:45', price: 5 },
        { id: 'ps4_3', time: '21:00 - 21:30', price: 5 },
        { id: 'ps4_4', time: '21:30 - 22:15', price: 8 }
    ],
    'ps5': [
        { id: 'ps5_1', time: '21:00 - 21:30', price: 30 },
        { id: 'ps5_2', time: '21:30 - 22:15', price: 45 }
    ],
    'vr': [
        { id: 'vr_1', time: '21:00 - 21:30', price: 60 },
        { id: 'vr_2', time: '21:30 - 22:15', price: 90 }
    ],
    'pc': [
        { id: 'pc_1', time: '21:00 - 21:30', price: 30 },
        { id: 'pc_2', time: '21:30 - 22:15', price: 45 }
    ]
};

const StudentScreen = ({ studentName, appData, goBackToRoles }) => {
  const safeName = String(studentName || '');

  const [activeTab, setActiveTab] = useState('home');
  const [rankTab, setRankTab] = useState('rp');
  
  const [lotteryState, setLotteryState] = useState({ active: false, result: null, spinning: false, currentDisplay: '❓' });
  const [scratchState, setScratchState] = useState({ active: false, result: null, isRevealed: false });
  const [actionModal, setActionModal] = useState({ active: false, type: '', data: null });

  const [unlockedQueue, setUnlockedQueue] = useState([]);
  const [viewProfile, setViewProfile] = useState(null);

  const [showCreateClan, setShowCreateClan] = useState(false);
  const [newClan, setNewClan] = useState({ name: '', tag: '', icon: '🛡️', desc: '' });
  const [inviteUser, setInviteUser] = useState('');
  const [selectedClan, setSelectedClan] = useState(null);
  
  const [chatInput, setChatInput] = useState('');
  const [lastMsgTime, setLastMsgTime] = useState(0);
  const chatContainerRef = useRef(null);

  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  const [purchaseModal, setPurchaseModal] = useState({ active: false, item: null, target: 'self', receiver: '' });

  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [gameDay, setGameDay] = useState(DAYS[currentDayIndex]);
  const [gameDevice, setGameDevice] = useState('ps4');

  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});

  const getDetailedLevelInfo = (xp) => { 
      const safeXp = Number(xp) || 0; const level = Math.floor(Math.sqrt(safeXp / 50)) + 1; 
      const currentLevelBaseXp = Math.pow(level - 1, 2) * 50; const nextLevelBaseXp = Math.pow(level, 2) * 50; 
      const progress = ((safeXp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp)) * 100; 
      return { level, progress: Math.min(100, Math.max(0, progress)), currentXp: safeXp, nextLevelXp: nextLevelBaseXp }; 
  };

  const getRankBadge = (rpVal) => { 
      const rp = Number(rpVal) || 0; 
      if (rp >= 1000) return { name: 'Fatih', icon: '👑', color: '#ff3b30' }; 
      if (rp >= 750) return { name: 'Elmas', icon: '💎', color: '#3b82f6' }; 
      if (rp >= 500) return { name: 'Altın', icon: '🥇', color: '#f59e0b' }; 
      if (rp >= 250) return { name: 'Gümüş', icon: '🥈', color: '#64748b' }; 
      return { name: 'Bronz', icon: '🥉', color: '#b45309' }; 
  };

  // --- GÜNCELLENEN: ÜNVANLARI TEMİZLEYEREK GETİR ---
  const getStudentTitle = (n) => { 
      const t = appData?.active_cards?.[n]?.title; 
      return (t && t.exp > Date.now()) ? formatTitle(t.val) : null; 
  };

  const TitleBadge = ({ title }) => {
      if (!title) return null;
      return (
          <span style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, marginLeft: '6px', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(212,175,55,0.3)', verticalAlign: 'middle' }}>
              {title}
          </span>
      );
  };

  const getAllRankings = (metric) => { 
      return roster.map(n => { 
          let val = 0; if(metric === 'rp') val = Number(appData?.season_score?.[n] || 0); if(metric === 'wealth') val = Number(appData?.wallet?.[n] || 0); if(metric === 'xp') val = Number(appData?.xp?.[n] || 0); 
          return { n: String(n), val }; 
      }).sort((a,b) => b.val - a.val); 
  };

  let myClanId = null; let myClan = {};
  Object.keys(appData?.clans || {}).forEach(k => { if ((appData?.clans?.[k]?.members || []).includes(safeName)) { myClanId = k; myClan = appData.clans[k] || {}; } });

  const clanScores = Object.keys(appData?.clans || {}).map(cId => {
      const clan = appData.clans[cId] || {}; let warScore = 0; let totalRp = 0;
      (clan.members || []).forEach(m => { const rp = Number(appData?.season_score?.[m] || 0); totalRp += rp; if (appData?.clan_war_participants?.[m]) warScore += rp; });
      return { id: cId, ...clan, warScore, totalRp };
  }).sort((a,b) => b.warScore - a.warScore || b.totalRp - a.totalRp);

  useEffect(() => { if (activeTab === 'chat' && chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; } }, [activeTab, appData?.global_chat]);

  useEffect(() => {
      if (!safeName || !appData) return;
      const streakData = appData?.active_cards?.[safeName]?.streak;
      if (streakData && streakData.end && Date.now() >= streakData.end) {
          const currentMCoin = Number(appData?.wallet?.[safeName] || 0); const updates = {};
          updates[`wallet/${safeName}`] = currentMCoin + 500;
          updates[`transactions/${safeName}/txn_streak_${Date.now()}`] = { desc: 'Haftalık Kusursuz Seri Ödülü', amt: 500, date: new Date().toLocaleString('tr-TR') };
          updates[`active_cards/${safeName}/streak`] = null; db.ref('mavikent_premium').update(updates);
          setActionModal({ active: true, type: 'success', data: { msg: '🏆 TEBRİKLER! Haftalık seriyi kusursuz tamamladın ve 500 M-Coin kazandın!', icon: '🎉', name: 'Kusursuz Hafta' } });
      }
  }, [safeName, appData]);

  useEffect(() => {
      if (!appData) return;
      const now = new Date();
      if (now.getDay() === 6 && now.getHours() >= 17) {
          const todayStr = now.toDateString();
          if (appData?.settings?.last_gameroom_reset !== todayStr) {
              const updates = {};
              updates['game_room_appointments'] = null; 
              updates['settings/last_gameroom_reset'] = todayStr;
              db.ref('mavikent_premium').update(updates);
              if(!appData?.settings?.last_gameroom_reset || appData.settings.last_gameroom_reset !== todayStr) {
                 db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `📢 Oyun Odası randevuları sıfırlandı! Yeni hafta için randevular açılmıştır.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
              }
          }
      }
  }, [appData]);

  useEffect(() => {
    if (!safeName || !appData) return;
    const myBadges = appData?.badges?.[safeName] || {};
    const stats = { soru: Number(appData?.education_d?.[safeName]?.questions || 0), kitap: Number(appData?.education_d?.[safeName]?.pages || 0), cuzdan: Number(appData?.wallet?.[safeName] || 0), elit: appData?.student_tiers?.[safeName] === 'elite' };
    const newUnlocks = [];
    Object.keys(BADGES).forEach(key => {
        const b = BADGES[key];
        if (!myBadges[key]) {
            if (b.type === 'soru' && stats.soru >= b.req) newUnlocks.push(key);
            if (b.type === 'kitap' && stats.kitap >= b.req) newUnlocks.push(key);
            if (b.type === 'cuzdan' && stats.cuzdan >= b.req) newUnlocks.push(key);
            if (key === 'gizli_3' && stats.elit) newUnlocks.push(key);
        }
    });
    if (newUnlocks.length > 0) { const unique = newUnlocks.filter(id => !unlockedQueue.includes(id)); if(unique.length > 0) setUnlockedQueue(prev => [...prev, ...unique]); }
  }, [safeName, appData]);

  const claimBadge = () => {
    const bId = unlockedQueue[0]; const b = BADGES[bId]; const updates = {};
    updates[`badges/${safeName}/${bId}`] = true;
    if (b.rew) {
        updates[`wallet/${safeName}`] = (Number(appData.wallet?.[safeName]) || 0) + b.rew;
        updates[`transactions/${safeName}/txn_${Date.now()}`] = { desc: `Rozet Ödülü: ${b.name}`, amt: b.rew, date: new Date().toLocaleString('tr-TR') };
    }
    db.ref('mavikent_premium').update(updates); setUnlockedQueue(prev => prev.slice(1));
  };

  const handleLogout = () => { 
      localStorage.removeItem('mavikentUser'); 
      localStorage.removeItem('mavikentPass'); 
      goBackToRoles(); 
  };

  const sendChatMessage = () => {
      if (!chatInput.trim()) return;
      if (appData?.banned_chat?.[safeName]) return alert("⛔ Yönetici tarafından sohbetten kalıcı olarak yasaklandınız!");
      if (Date.now() - lastMsgTime < 10000) return alert("⏳ Yavaş Mod aktif! Lütfen 10 saniye bekleyip tekrar gönderin.");
      const cleanText = censorText(chatInput);
      db.ref('mavikent_premium/global_chat').push({ s: safeName, t: cleanText, ts: Date.now(), date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      setChatInput(''); setLastMsgTime(Date.now());
  };

  const handleBookGameSlot = (slot) => {
      if (mCoin < slot.price) return alert(`❌ Bakiye yetersiz! Bu seans ${slot.price} M-Coin.`);
      const isBooked = appData?.game_room_appointments?.[gameDevice]?.[gameDay]?.[slot.id];
      if (isBooked) return alert("❌ Maalesef bu seans başka bir arkadaşın tarafından alınmış!");
      const devName = GAME_DEVICES.find(d => d.id === gameDevice)?.name || 'Cihaz';
      if (window.confirm(`${gameDay} günü saat ${slot.time} arası ${devName} cihazını ${slot.price} M karşılığında rezerve etmek istiyor musun?`)) {
          const updates = {};
          updates[`wallet/${safeName}`] = mCoin - slot.price;
          updates[`transactions/${safeName}/txn_game_${Date.now()}`] = { desc: `Oyun Odası (${devName} - ${gameDay} ${slot.time})`, amt: -slot.price, date: new Date().toLocaleString('tr-TR') };
          updates[`game_room_appointments/${gameDevice}/${gameDay}/${slot.id}`] = safeName;
          db.ref('mavikent_premium').update(updates);
          setActionModal({ active: true, type: 'success', data: { msg: '✅ Rezervasyon başarıyla alındı! Vaktinde gelmeyi unutma.', icon: '🎮', name: 'Oyun Odası' } });
      }
  };

  const firstName = safeName.split(' ')[0] || 'Öğrenci';
  const xpDetail = getDetailedLevelInfo(appData?.xp?.[safeName]);
  const mCoin = Number(appData?.wallet?.[safeName] || 0);
  const myRp = Number(appData?.season_score?.[safeName] || 0);
  const myBadge = getRankBadge(myRp);
  const isEliteStud = appData?.student_tiers?.[safeName] === 'elite';
  const myCosmetics = appData?.active_cards?.[safeName] || {};
  const myTickets = Number(appData?.tickets?.[safeName] || 0);
  const myPinnedBadges = appData?.pinned_badges?.[safeName] || [];
  const sortedTxns = Object.keys(appData?.transactions?.[safeName] || {}).map(k => ({ id: k, ...appData.transactions[safeName][k] })).sort((a,b) => b.id.localeCompare(a.id));
  
  const myDiscountObj = appData?.active_discounts?.[safeName];
  const isPersonalDiscountActive = myDiscountObj && myDiscountObj.expiry > Date.now();
  let currentActiveDiscountPercent = appData?.settings?.global_event === 'discount' ? 20 : 0;
  if (isEliteStud && currentActiveDiscountPercent < 10) currentActiveDiscountPercent = 10;
  if (isPersonalDiscountActive && Number(myDiscountObj.value) > currentActiveDiscountPercent) currentActiveDiscountPercent = Number(myDiscountObj.value);

  const activeFrame = myCosmetics?.frame?.val || '';
  let avatarStyle = { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', fontSize: '40px', flexShrink: 0 };
  if (activeFrame.includes('Fatih')) { avatarStyle.border = '4px solid #ff3b30'; avatarStyle.boxShadow = '0 0 20px rgba(255,59,48,0.3)'; }
  else if (activeFrame.includes('Elmas')) { avatarStyle.border = '4px solid #3b82f6'; avatarStyle.boxShadow = '0 0 20px rgba(59,130,246,0.3)'; }
  else if (activeFrame.includes('Altın')) { avatarStyle.border = '4px solid #d4af37'; }

  const isGlobal2X = appData?.settings?.global_event === '2x_xp';
  const is2XActive = (myCosmetics?.multiplier?.date === new Date().toDateString()) || isGlobal2X;
  const hasStreak = myCosmetics?.streak && (myCosmetics.streak.end > Date.now());

  const products = Object.keys(appData?.market_products || {}).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0));
  const quests = appData?.quests || {};

  const rpSorted = getAllRankings('rp');
  const wealthSorted = getAllRankings('wealth');
  const xpSorted = getAllRankings('xp');
  
  const myRpRank = rpSorted.findIndex(s => s.n === safeName) + 1 || '-';
  const myWealthRank = wealthSorted.findIndex(s => s.n === safeName) + 1 || '-';
  const myXpRank = xpSorted.findIndex(s => s.n === safeName) + 1 || '-';

  const myGameAppointments = [];
  Object.keys(appData?.game_room_appointments || {}).forEach(device => {
      Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
          Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
              if (appData.game_room_appointments[device][day][slotId] === safeName) {
                  const devInfo = GAME_DEVICES.find(d => d.id === device);
                  const slotInfo = GAME_SLOTS[device].find(s => s.id === slotId);
                  myGameAppointments.push({
                      day,
                      device: devInfo?.name || device,
                      icon: devInfo?.icon || '🎮',
                      time: slotInfo?.time || 'Bilinmiyor'
                  });
              }
          });
      });
  });

  const togglePin = (bId) => { let pinned = [...myPinnedBadges]; if (pinned.includes(bId)) { pinned = pinned.filter(id => id !== bId); } else { if (pinned.length >= 3) return alert("En fazla 3 rozet sabitleyebilirsin!"); pinned.push(bId); } db.ref(`mavikent_premium/pinned_badges/${safeName}`).set(pinned); };
  
  const handleBuy = (item) => {
     if (item.stock !== undefined && item.stock <= 0) return alert("❌ Maalesef bu ürün tükendi!");
     setPurchaseModal({ active: true, item: item, target: 'self', receiver: '' });
  };

  const confirmPurchaseProcess = () => {
      let pData = purchaseModal.item;
      if (!pData) return;
      
      const myInflation = Number(appData?.personal_inflation?.[safeName]?.[pData.key] || 0);
      let baseP = Number(pData.p || 0) + (myInflation * 5); 
      let finalPrice = Math.ceil(baseP * (1 - currentActiveDiscountPercent / 100));

      if (mCoin < finalPrice) return alert("❌ Bakiyen yetersiz!");
      if (purchaseModal.target === 'friend' && !purchaseModal.receiver) return alert("Lütfen hediye göndereceğin arkadaşını seç!");

      const receiver = purchaseModal.target === 'friend' ? purchaseModal.receiver : safeName;
      const updates = {};
      
      updates[`wallet/${safeName}`] = mCoin - finalPrice;
      updates[`personal_inflation/${safeName}/${pData.key}`] = myInflation + 1; 
      
      let txnDesc = `Market: ${pData.n}`;
      if (purchaseModal.target === 'friend') txnDesc += ` -> ${receiver} (Hediye)`;
      updates[`transactions/${safeName}/txn_buy_${Date.now()}`] = { desc: txnDesc, amt: -finalPrice, date: new Date().toLocaleString('tr-TR') };

      if (pData.type === 'ticket') {
          updates[`tickets/${receiver}`] = (Number(appData?.tickets?.[receiver]) || 0) + 1;
          if(purchaseModal.target === 'friend') {
              db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🎁 ${safeName}, ${receiver} adlı arkadaşına Çekiliş Bileti hediye etti! Ne kral adam.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
          }
      } else {
          let delName = pData.n;
          if (purchaseModal.target === 'friend') delName += ` (🎁 ${safeName} yolladı)`;
          
          if (pData.type === 'bundle' && pData.bundleItems && pData.bundleItems.length > 0) {
              pData.bundleItems.forEach((bItemName) => {
                  const isDig = isDigitalItem('normal', bItemName);
                  db.ref('mavikent_premium/deliveries').push({ s: receiver, i: `${bItemName} (Paketten)`, st: isDig ? 'done' : 'wait', type: 'normal', val: '📦', date: new Date().toLocaleDateString('tr-TR') });
              });
          } else {
              const isDig = isDigitalItem(pData.type, pData.n);
              db.ref('mavikent_premium/deliveries').push({ s: receiver, i: delName, st: isDig ? 'done' : 'wait', type: pData.type || 'normal', val: pData.val || pData.i, date: new Date().toLocaleDateString('tr-TR') }); 
          }

          if (pData.stock !== undefined) updates[`market_products/${pData.key}/stock`] = pData.stock - 1;
          
          if(purchaseModal.target === 'friend') {
              db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🎁 ${safeName}, ${receiver} adlı arkadaşına ${pData.n} hediye etti! Helal olsun.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
          }
      }

      if (isPersonalDiscountActive && currentActiveDiscountPercent === Number(myDiscountObj.value)) updates[`active_discounts/${safeName}`] = null;
      db.ref('mavikent_premium').update(updates); 
      alert("✅ İşlem başarılı!");
      setPurchaseModal({ active: false, item: null, target: 'self', receiver: '' });
  };

  const handleJoinGroupBuy = (gbKey, gb) => {
      if (mCoin < gb.pp) return alert(`Bu imeceye katılmak için ${gb.pp} M-Coin gerekli.`);
      if ((gb.participants || []).includes(safeName)) return alert("Zaten bu imeceye ortaksın!");
      
      if (window.confirm(`${gb.n} imecesine ${gb.pp} M vererek ortak olmak istiyor musun?`)) {
          const updates = {};
          updates[`wallet/${safeName}`] = mCoin - gb.pp;
          updates[`transactions/${safeName}/txn_imece_${Date.now()}`] = { desc: `İmece Katılımı: ${gb.n}`, amt: -gb.pp, date: new Date().toLocaleString('tr-TR') };
          
          const newParts = [...(gb.participants || []), safeName];
          if (newParts.length >= gb.mp) {
              updates[`group_buys/${gbKey}/participants`] = newParts;
              updates[`group_buys/${gbKey}/active`] = false;
              db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🚀 ${gb.n} imecesi başarıyla tamamlandı!`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
              alert("🎉 İmece tamamlandı! Gerekli kişi sayısına ulaşıldı.");
          } else {
              updates[`group_buys/${gbKey}/participants`] = newParts;
              alert("🤝 İmeceye başarıyla katıldın!");
          }
          db.ref('mavikent_premium').update(updates);
      }
  };

  const handlePlaceBid = () => {
      const auc = appData?.auction;
      if (!auc || !auc.active) return alert("Şu an aktif bir ihale bulunmuyor!");
      const bidInput = document.getElementById('bidInput'); const bidAmt = parseInt(bidInput.value);
      if (isNaN(bidAmt) || bidAmt <= auc.currentBid) return alert(`Teklifiniz en yüksek tekliften (${auc.currentBid} M) daha büyük olmalı!`);
      if (mCoin < bidAmt) return alert("Bakiyeniz bu teklif için yetersiz!");
      
      if (window.confirm(`İhaleye ${bidAmt} M ile girmek istiyor musunuz? M-Coin cüzdanınızdan kesilecektir.`)) {
          const updates = {};
          if (auc.highestBidder) {
              updates[`wallet/${auc.highestBidder}`] = (Number(appData?.wallet?.[auc.highestBidder]) || 0) + auc.currentBid;
              updates[`transactions/${auc.highestBidder}/txn_auc_refund_${Date.now()}`] = { desc: `İhale İadesi (${auc.item})`, amt: auc.currentBid, date: new Date().toLocaleString('tr-TR') };
          }
          updates[`wallet/${safeName}`] = mCoin - bidAmt;
          updates[`transactions/${safeName}/txn_auc_bid_${Date.now()}`] = { desc: `İhale Teklifi (${auc.item})`, amt: -bidAmt, date: new Date().toLocaleString('tr-TR') };
          updates[`auction/currentBid`] = bidAmt; updates[`auction/highestBidder`] = safeName;
          db.ref('mavikent_premium').update(updates); alert("🔨 Teklifiniz başarıyla alındı! İhalenin yeni lideri sizsiniz.");
          bidInput.value = '';
      }
  };

  // --- GÜNCELLENEN: ŞANS ÇARKI VE KUTU FİLTRESİ ---
  const calculateNerfedPrize = (drawItemsArray, isKutu = false) => {
      const isTopParticipant = myXpRank !== '-' && myXpRank <= 10;
      let weightedArray = []; 
      drawItemsArray.forEach(item => { 
          let weight = 10000 / Math.pow(Number(item.p) || 10, 2); 
          const itemName = String(item.n).toUpperCase();
          if (itemName.includes('İZİN') || itemName.includes('PİZZA') || itemName.includes('BALIK') || itemName.includes('KÜNEFE') || itemName.includes('HAMBURGER') || Number(item.p) >= 200) {
              if (isTopParticipant) weight = isKutu ? 0.5 : 0.0001; else weight = 0.00001; 
          }
          weightedArray.push({ ...item, weight }); 
      });
      let totalWeight = weightedArray.reduce((acc, curr) => acc + curr.weight, 0); 
      let randomNum = Math.random() * totalWeight; 
      let selected = weightedArray[0];
      for (let item of weightedArray) { if (randomNum < item.weight) { selected = item; break; } randomNum -= item.weight; }
      return selected;
  };
  
  const rollLottery = () => {
      if (myTickets <= 0) return alert("Biletin yok!");
      let drawItems = products.filter(p => p.type !== 'ticket' && p.type !== 'bundle' && p.type !== 'gift' && !['KULAKLIK', 'SAAT', 'FORMA', 'KRAMPON', 'ÇİKOLATA EVİM', 'PS4', 'PS5', 'VR', 'BİLGİSAYAR', 'PC', 'DK)'].some(kw => String(p.n).toUpperCase().includes(kw)));
      if (appData?.limits?.shoe_won) drawItems = drawItems.filter(p => !String(p.n).toUpperCase().includes('AYAKKABI'));
      if (drawItems.length === 0) return alert("Havuz boş.");

      let selectedPrize = calculateNerfedPrize(drawItems);
      const updates = {}; updates[`tickets/${safeName}`] = Math.max(0, myTickets - 1);
      if (String(selectedPrize.n).toUpperCase().includes('AYAKKABI')) updates[`limits/shoe_won`] = true;
      db.ref('mavikent_premium').update(updates);

      setLotteryState({ active: true, result: selectedPrize, spinning: true, currentDisplay: '❓' });
      let spins = 0; let currentSpeed = 100;
      const spinLoop = () => { 
          setLotteryState(prev => ({ ...prev, currentDisplay: drawItems[Math.floor(Math.random() * drawItems.length)].i || '🎁' })); 
          spins++; if (spins < 15) currentSpeed = Math.max(30, currentSpeed - 10); else if (spins > 25) currentSpeed += 20; 
          if (spins < 40) { setTimeout(spinLoop, currentSpeed); } 
          else { 
              const isDig = isDigitalItem(selectedPrize.type, selectedPrize.n);
              setLotteryState({ active: true, result: selectedPrize, spinning: false, currentDisplay: selectedPrize.i || '🎁' }); 
              db.ref('mavikent_premium/deliveries').push({ s: safeName, i: selectedPrize.n + " (Çekiliş)", st: isDig ? 'done' : 'wait', type: selectedPrize.type || 'normal', val: selectedPrize.val || selectedPrize.i, date: new Date().toLocaleDateString('tr-TR') }); 
          } 
      }; setTimeout(spinLoop, currentSpeed);
  };

  const playScratchcard = () => {
      if (mCoin < 15) return alert("❌ 15 M gerekli.");
      let drawItems = products.filter(p => p.type !== 'ticket' && p.type !== 'bundle' && p.type !== 'gift' && !['KULAKLIK', 'SAAT', 'FORMA', 'KRAMPON', 'ÇİKOLATA EVİM', 'PS4', 'PS5', 'VR', 'BİLGİSAYAR', 'PC', 'DK)'].some(kw => String(p.n).toUpperCase().includes(kw)));
      if (appData?.limits?.shoe_won) drawItems = drawItems.filter(p => !String(p.n).toUpperCase().includes('AYAKKABI'));
      if (drawItems.length === 0) return alert("Havuz boş.");

      let selectedPrize = calculateNerfedPrize(drawItems);
      const updates = {}; updates[`wallet/${safeName}`] = mCoin - 15; updates[`transactions/${safeName}/txn_scratch_${Date.now()}`] = { desc: 'Kazı Kazan Bedeli', amt: -15, date: new Date().toLocaleString('tr-TR') };
      if (String(selectedPrize.n).toUpperCase().includes('AYAKKABI')) updates[`limits/shoe_won`] = true;
      db.ref('mavikent_premium').update(updates);
      setScratchState({ active: true, result: selectedPrize, isRevealed: false });
  };

  const revealScratch = () => {
      if(scratchState.isRevealed) return;
      setScratchState(prev => ({...prev, isRevealed: true}));
      const isDig = isDigitalItem(scratchState.result.type, scratchState.result.n);
      db.ref('mavikent_premium/deliveries').push({ s: safeName, i: scratchState.result.n + " (Kazı Kazan)", st: isDig ? 'done' : 'wait', type: scratchState.result.type || 'normal', val: scratchState.result.val || scratchState.result.i, date: new Date().toLocaleDateString('tr-TR') });
  };

  const activateItem = (delKey, item) => {
      const iType = String(item.type || '').toLowerCase(); const itemName = String(item.n || item.i || '').toUpperCase(); const itemIcon = String(item.i || '').toUpperCase();
      if (itemName.includes("KUTU") || itemIcon.includes("🎁") || itemName.includes("SÜRPRİZ") || itemName.includes("GİZEMLİ")) {
          const isEliteBox = itemName.includes("ELİT") || itemName.includes("ELITE"); const maxPrice = isEliteBox ? 400 : 300; 
          let drawItems = products.filter(p => p.type !== 'ticket' && p.type !== 'bundle' && p.type !== 'gift' && Number(p.p) <= maxPrice && !['KULAKLIK', 'SAAT', 'FORMA', 'KRAMPON', 'ÇİKOLATA EVİM', 'PS4', 'PS5', 'VR', 'BİLGİSAYAR', 'PC', 'DK)'].some(kw => String(p.n).toUpperCase().includes(kw)));
          if (appData?.limits?.shoe_won) drawItems = drawItems.filter(p => !String(p.n).toUpperCase().includes('AYAKKABI'));
          
          let prize = calculateNerfedPrize(drawItems, true);
          setActionModal({ active: true, type: 'unboxing', data: { boxKey: delKey, prize: prize, step: 'closed' } });
      } else {
          const updates = {}; updates[`deliveries/${delKey}`] = null; let msg = '';
          if (iType === 'multiplier' || itemName.includes("2X") || itemName.includes("ÇARPAN")) { 
              updates[`active_cards/${safeName}/multiplier`] = { date: new Date().toDateString(), val: "2X" }; msg = "⚡ 2X Puan Kartı aktif! Bugün puanların ikiye katlanacak."; 
          } 
          else if (iType === 'streak' || itemName.includes("KORUMA") || itemName.includes("SERİ")) { 
              const today = new Date();
              if (today.getDay() !== 0) return alert("❌ Haftalık Seri Kartı SADECE PAZAR GÜNLERİ aktif edilebilir!");
              let nextSat = new Date(); nextSat.setDate(today.getDate() + 6); nextSat.setHours(15, 0, 0, 0);
              updates[`active_cards/${safeName}/streak`] = { val: "aktif", date: new Date().toDateString(), end: nextSat.getTime() }; msg = "🛡️ Haftalık Seri Koruma aktif! Cumartesi 15:00'a kadar fire vermezsen 500 M kazanacaksın."; 
          } 
          else if (iType === 'title' || itemName.includes("ÜNVAN")) {
              updates[`active_cards/${safeName}/title`] = { val: item.n || item.i, exp: Date.now() + 14 * 24 * 60 * 60 * 1000 }; msg = "🎖️ Yeni Ünvanın 14 gün boyunca profilinde sergilenecek!";
          }
          else if (iType === 'avatar' || iType === 'frame') { 
              updates[`active_cards/${safeName}/${iType}`] = { val: item.val || item.i || itemName, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }; msg = "✨ Kozmetik başarıyla profiline eklendi."; 
          } else { msg = `✅ Eşya başarıyla kullanıldı.`; }
          db.ref('mavikent_premium').update(updates); setActionModal({ active: true, type: 'success', data: { msg, icon: '✅', name: itemName } });
      }
  };

  const getNavStyle = (tab) => ({ flex: 1, border: 'none', background: activeTab === tab ? '#ffffff' : 'transparent', color: activeTab === tab ? '#0f172a' : '#64748b', fontWeight: activeTab === tab ? 900 : 700, cursor: 'pointer', padding: '14px 0', borderRadius: '50px', fontSize: '11px', outline: 'none', boxShadow: activeTab === tab ? '0 10px 20px -5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.3s', whiteSpace: 'nowrap' });

  const now = new Date();
  const liveDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const selectedDayIdx = DAYS.indexOf(gameDay);
  
  let isPastDay = false;
  if (liveDayIdx === 5 && currentHour >= 17) {
      if (selectedDayIdx < 5) isPastDay = false; 
      else if (selectedDayIdx === 5) isPastDay = false; 
  } else if (liveDayIdx === 6) {
      if (selectedDayIdx === 5) isPastDay = true; 
      else isPastDay = false; 
  } else {
      if (selectedDayIdx < liveDayIdx) isPastDay = true;
  }

  const handleCreateClan = () => {
      if(!newClan.name || !newClan.tag) return alert("Klan adı ve kısaltması (TAG) zorunludur.");
      if(newClan.tag.length > 4) return alert("Klan TAG'ı en fazla 4 harf olabilir.");
      const cId = `clan_${Date.now()}`; const updates = {};
      updates[`clans/${cId}`] = { name: newClan.name.toUpperCase(), tag: newClan.tag.toUpperCase(), icon: newClan.icon, desc: newClan.desc, leader: safeName, members: [safeName] };
      db.ref('mavikent_premium').update(updates); alert(`🛡️ ${newClan.name} klanı başarıyla kuruldu!`); setShowCreateClan(false);
  };

  const handleInviteUser = () => {
      if(!inviteUser) return;
      const targetName = Object.keys(appData?.student_credentials || {}).find(n => String(appData.student_credentials[n]?.username||'').trim() === String(inviteUser).trim());
      if(!targetName) return alert("Bu öğrenci bulunamadı!");
      if(targetName === safeName) return alert("Kendini davet edemezsin!");
      if((myClan.members||[]).length >= 3) return alert("Klan kapasitesi dolu! (Max 3 Kişi)");
      if((myClan.members||[]).includes(targetName)) return alert("Bu kişi zaten klanda!");
      db.ref(`mavikent_premium/clan_invites/${targetName}/${myClanId}`).set({ clanName: myClan.name, icon: myClan.icon }); alert("✅ Davet gönderildi!"); setInviteUser('');
  };

  const acceptInvite = (cId) => {
      const clan = appData?.clans?.[cId];
      if(!clan || (clan.members||[]).length >= 3) return alert("Bu klan dolmuş veya silinmiş.");
      const updates = {}; updates[`clans/${cId}/members`] = [...(clan.members||[]), safeName]; updates[`clan_invites/${safeName}`] = null; 
      db.ref('mavikent_premium').update(updates); alert(`${clan.name} klanına katıldın!`);
  };

  const rejectInvite = (cId) => { db.ref(`mavikent_premium/clan_invites/${safeName}/${cId}`).remove(); };

  const leaveClan = () => {
      if(!window.confirm("Klandan ayrılmak istediğine emin misin?")) return;
      const updates = {}; const newMembers = (myClan.members || []).filter(m => m !== safeName);
      if(newMembers.length === 0) { updates[`clans/${myClanId}`] = null; } else { updates[`clans/${myClanId}/members`] = newMembers; if(myClan.leader === safeName) updates[`clans/${myClanId}/leader`] = newMembers[0]; }
      updates[`clan_war_participants/${safeName}`] = null; db.ref('mavikent_premium').update(updates);
  };

  const joinWar = () => {
      if((myClan?.members || []).length < 3) return alert("Savaşa katılabilmek için klanınızda tam 3 kişi olmalıdır!");
      if(mCoin < 10) return alert("Savaş bileti için 10 M-Coin gerekli!");
      if(window.confirm("Haftalık klan savaşına katılıp klanına RP kazandırmak için 10 M-Coin kesilecek. Onaylıyor musun?")) {
          const updates = {}; updates[`wallet/${safeName}`] = mCoin - 10; updates[`clan_war_participants/${safeName}`] = true;
          updates[`transactions/${safeName}/txn_war_${Date.now()}`] = { desc: 'Klan Savaşı Bileti', amt: -10, date: new Date().toLocaleString('tr-TR') };
          db.ref('mavikent_premium').update(updates); alert("⚔️ Savaş bileti alındı!");
      }
  };

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px', paddingBottom: '140px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }}>
      <style>{`
        @keyframes badgePulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); } }
        .badge-glow { animation: badgePulse 2s infinite; border: 2px solid #d4af37 !important; background: #fffbeb !important; }
        .profile-btn { border: none; cursor: pointer; transition: all 0.2s; outline: none; border-radius: 50px; display:inline-flex; align-items:center; justify-content:center; font-weight:800;}
        .profile-btn:active { transform: scale(0.95); }
        .elite-input { outline: none !important; border: 1px solid #e2e8f0 !important; transition: all 0.2s ease-in-out; padding: 14px 20px; border-radius: 16px; width: 100%; font-weight: 600; color: #0f172a; background: #f8fafc; }
        .elite-input:focus { border-color: #3b82f6 !important; background: #ffffff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }
        .elite-input::placeholder { color: #94a3b8; font-weight: 500; }
        .clean-scroll::-webkit-scrollbar { width: 6px; } .clean-scroll::-webkit-scrollbar-track { background: transparent; } .clean-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .grid-mobile-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes boxShake { 0% { transform: rotate(0deg); } 25% { transform: rotate(15deg); } 50% { transform: rotate(-15deg); } 75% { transform: rotate(10deg); } 100% { transform: rotate(0deg); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .popIn-anim { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .shake-anim { animation: boxShake 1.5s infinite; }
        
        .chat-bubble { padding: 12px 16px; border-radius: 20px; max-width: 85%; font-size: 14px; line-height: 1.4; word-break: break-word; font-weight: 600; }
        .chat-me { background: #0f172a; color: white; border-bottom-right-radius: 4px; }
        .chat-other { background: #ffffff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
        
        @keyframes scrollChat { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        .auto-scroll-chat { animation: scrollChat 20s linear infinite; }
        .auto-scroll-chat:hover { animation-play-state: paused; }
      `}</style>

      {purchaseModal.active && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(10px)' }}>
            <div className="popIn-anim" style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>
               <div style={{ fontSize: '60px', marginBottom: '10px' }}>{purchaseModal.item.i || '📦'}</div>
               <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 900, margin: '0 0 5px 0' }}>{purchaseModal.item.n}</h2>
               <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '25px' }}>Bu ürünü kimin için alıyorsun?</p>
               
               <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                   <button onClick={() => setPurchaseModal({...purchaseModal, target: 'self'})} className="profile-btn" style={{ background: purchaseModal.target === 'self' ? '#0f172a' : '#f1f5f9', color: purchaseModal.target === 'self' ? 'white' : '#64748b', flex: 1, padding: '16px' }}>Kendim İçin</button>
                   <button onClick={() => setPurchaseModal({...purchaseModal, target: 'friend'})} className="profile-btn" style={{ background: purchaseModal.target === 'friend' ? '#10b981' : '#f1f5f9', color: purchaseModal.target === 'friend' ? 'white' : '#64748b', flex: 1, padding: '16px' }}>Hediye Et</button>
               </div>

               {purchaseModal.target === 'friend' && (
                   <select value={purchaseModal.receiver} onChange={e => setPurchaseModal({...purchaseModal, receiver: e.target.value})} className="elite-input" style={{ marginBottom: '20px', padding: '16px' }}>
                       <option value="">Öğrenci Seçin</option>
                       {roster.filter(n => n !== safeName).map(n => <option key={n} value={n}>{n}</option>)}
                   </select>
               )}

               <div style={{ display: 'flex', gap: '10px' }}>
                   <button onClick={() => setPurchaseModal({active:false, item:null, target:'self', receiver:''})} className="profile-btn" style={{ background: 'transparent', color: '#ef4444', flex: 1, padding: '16px' }}>İptal</button>
                   <button onClick={confirmPurchaseProcess} className="profile-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', flex: 1, padding: '16px' }}>ONAYLA</button>
               </div>
            </div>
        </div>
      )}

      {actionModal.active && actionModal.type === 'unboxing' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(10px)' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
                {actionModal.data.step === 'closed' ? (
                    <div className="fade-in">
                       <div className="shake-anim" style={{ fontSize: '120px', cursor: 'pointer', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))' }} onClick={() => {
                           const prize = actionModal.data.prize;
                           const isDig = isDigitalItem(prize.type, prize.n);
                           const updates = {};
                           updates[`deliveries/${actionModal.data.boxKey}`] = null;
                           updates[`deliveries/${db.ref().push().key}`] = { s: safeName, n: prize.n + " (Kutudan)", i: prize.i || '🎁', st: isDig ? 'done' : 'wait', type: prize.type || 'normal', val: prize.val || prize.i, date: new Date().toLocaleDateString('tr-TR') };
                           db.ref('mavikent_premium').update(updates);
                           setActionModal({ active: true, type: 'unboxing', data: { ...actionModal.data, step: 'open' } });
                       }}>🎁</div>
                       <h2 style={{ marginTop: '30px', fontSize: '24px', fontWeight: 900 }}>Açmak İçin Dokun!</h2>
                    </div>
                ) : (
                    <div className="popIn-anim" style={{ background: '#ffffff', padding: '50px 30px', borderRadius: '40px', width: '100%', maxWidth: '350px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', color: '#0f172a' }}>
                       <div style={{ fontSize: '14px', color: '#b45309', fontWeight: 900, letterSpacing: '2px', marginBottom: '10px' }}>TEBRİKLER!</div>
                       <div style={{ fontSize: '90px', marginBottom: '15px' }}>{actionModal.data.prize.i || '🎁'}</div>
                       <h2 style={{ color: '#10b981', fontSize: '26px', margin: '0 0 10px 0', fontWeight: 900 }}>{actionModal.data.prize.n}</h2>
                       <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600, marginBottom: '25px' }}>Envanterine eklendi!</p>
                       <button onClick={() => setActionModal({active:false})} className="profile-btn" style={{ background: '#0f172a', color: 'white', width: '100%', padding: '16px', fontSize: '16px' }}>HARİKA</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {actionModal.active && actionModal.type === 'success' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div className="popIn-anim" style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '32px', textAlign: 'center', width: '100%', maxWidth: '350px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
               <div style={{ fontSize: '70px', marginBottom: '15px' }}>{actionModal.data.icon}</div>
               <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 900, margin: '0 0 10px 0' }}>Başarılı!</h2>
               <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600, marginBottom: '25px', lineHeight: '1.5' }}>{actionModal.data.msg}</p>
               <button onClick={() => setActionModal({active:false})} className="profile-btn" style={{ background: '#10b981', color: 'white', width: '100%', padding: '16px', fontSize: '16px' }}>TAMAM</button>
            </div>
        </div>
      )}

      {scratchState.active && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '350px', textAlign: 'center', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', animation: 'popIn 0.4s' }}>
             <h2 style={{ margin: '0 0 10px 0', fontWeight: 900, fontSize: '26px', color: '#0f172a' }}>KAZI KAZAN</h2>
             <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 30px 0', fontWeight: 600 }}>Ödülünü görmek için gri alana dokun!</p>
             <div onClick={revealScratch} style={{ background: scratchState.isRevealed ? '#ecfdf5' : 'linear-gradient(135deg, #cbd5e1, #94a3b8)', border: `2px dashed ${scratchState.isRevealed ? '#10b981' : '#64748b'}`, borderRadius: '20px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: scratchState.isRevealed ? 'default' : 'pointer', transition: 'all 0.4s', marginBottom: '25px' }}>
                {!scratchState.isRevealed ? ( <div style={{ fontSize: '30px', color: '#475569', fontWeight: 900, opacity: 0.7 }}>TIRNAKLA</div> ) : ( <div className="fade-in"><div style={{ fontSize: '50px', marginBottom: '10px' }}>{scratchState.result?.i || '🎁'}</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#047857' }}>{scratchState.result?.n}</div></div> )}
             </div>
             {scratchState.isRevealed && ( <div className="fade-in"><div style={{ fontSize: '14px', color: '#64748b', marginBottom: '25px', fontWeight: 600 }}>Envanterine eklendi.</div><button onClick={() => setScratchState({active:false})} className="profile-btn" style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: 'white', width: '100%', padding: '16px', fontSize: '16px' }}>KAPAT</button></div> )}
          </div>
        </div>
      )}

      {showTxnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards', overflow: 'hidden' }}>
             <div style={{ padding: '30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>💳 Cüzdan Özeti</h2></div>
                <button onClick={() => setShowTxnModal(false)} className="profile-btn" style={{ background: '#f8fafc', padding: '10px 15px', color: '#64748b' }}>✕</button>
             </div>
             <div className="clean-scroll" style={{ padding: '20px 30px', overflowY: 'auto', flex: 1 }}>
                {sortedTxns.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 700, padding: '40px 0' }}>Hesap hareketi yok.</div> : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sortedTxns.map(t => (
                         <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div><div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{t.desc}</div><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{t.date}</div></div>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: t.amt > 0 ? '#10b981' : '#ef4444' }}>{t.amt > 0 ? '+' : ''}{t.amt} M</div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '400px', padding: '40px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ margin: '0', fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>✉️ Yöneticiye Mesaj</h2><button onClick={() => setShowMessageModal(false)} className="profile-btn" style={{ background: '#f1f5f9', padding: '10px 15px', color: '#64748b' }}>✕</button></div>
             <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Öneri, şikayet veya taleplerini yöneticiye doğrudan iletebilirsin.</p>
             <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Mesajınızı buraya yazın..." className="elite-input clean-scroll" style={{ height: '120px', resize: 'none', marginBottom: '25px', textAlign: 'left' }} />
             <button onClick={handleSendMessage} className="profile-btn" style={{ width: '100%', background: '#0f172a', color: 'white', padding: '16px', fontSize: '16px' }}>MESAJI GÖNDER</button>
          </div>
        </div>
      )}

      {unlockedQueue.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(15px)' }}>
          <div className="badge-glow" style={{ background: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '400px', textAlign: 'center', padding: '50px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', animation: 'popIn 0.5s forwards' }}>
             <div style={{ fontSize: '14px', color: '#b45309', fontWeight: 900, letterSpacing: '2px', marginBottom: '10px' }}>YENİ KUPA KAZANILDI!</div>
             <div style={{ fontSize: '90px', margin: '20px 0', filter: 'drop-shadow(0 10px 20px rgba(212,175,55,0.4))' }}>{BADGES[unlockedQueue[0]].icon}</div>
             <h2 style={{ margin: '0 0 10px 0', fontWeight: 900, fontSize: '32px', color: '#0f172a', letterSpacing: '-1px' }}>{BADGES[unlockedQueue[0]].name}</h2>
             <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 30px 0', fontWeight: 600 }}>{BADGES[unlockedQueue[0]].desc}</p>
             {BADGES[unlockedQueue[0]].rew && (<div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '12px 24px', borderRadius: '20px', fontSize: '18px', fontWeight: 900, display: 'inline-block', marginBottom: '30px' }}>+{BADGES[unlockedQueue[0]].rew} M ÖDÜL</div>)}
             <button onClick={claimBadge} style={{ background: '#0f172a', color: 'white', width: '100%', padding: '20px', borderRadius: '50px', border: 'none', fontWeight: 900, fontSize: '18px', cursor: 'pointer' }}>HARİKA!</button>
          </div>
        </div>
      )}

      {lotteryState.active && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '40px', width: '100%', maxWidth: '350px', textAlign: 'center', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', animation: 'popIn 0.4s forwards' }}>
             <h2 style={{ margin: '0 0 10px 0', fontWeight: 900, fontSize: '26px', color: '#0f172a' }}>ŞANS ÇARKI</h2>
             <div style={{ fontSize: '70px', margin: '30px auto', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '50%', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: lotteryState.spinning ? '0 0 30px rgba(212,175,55,0.4)' : 'none' }}>{lotteryState.currentDisplay}</div>
             {!lotteryState.spinning ? ( <div className="fade-in"><div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>{lotteryState.result?.n}</div><button onClick={() => setLotteryState({active:false})} className="profile-btn" style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: 'white', width: '100%', padding: '16px', marginTop: '20px' }}>KAPAT</button></div> ) : <div style={{ fontWeight: 800 }}>Bekleyin...</div>}
          </div>
        </div>
      )}

      {viewProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '400px', padding: '40px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards', position: 'relative' }}>
             <button onClick={() => setViewProfile(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50px', width: '40px', height: '40px', fontSize: '16px', fontWeight: 900, color: '#64748b', cursor: 'pointer' }}>✕</button>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '60px', background: '#f8fafc', border: `3px solid ${appData?.student_tiers?.[viewProfile] === 'elite' ? '#d4af37' : '#e2e8f0'}`, borderRadius: '30px', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: appData?.student_tiers?.[viewProfile] === 'elite' ? '0 0 30px rgba(212,175,55,0.4)' : 'none' }}>{appData?.active_cards?.[viewProfile]?.avatar?.val || '🎓'}</div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{viewProfile}</h2>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 800, marginBottom: '25px', background: '#f1f5f9', padding: '6px 16px', borderRadius: '12px' }}>{getStudentTitle(viewProfile) || 'Öğrenci'} • Seviye {getDetailedLevelInfo(appData?.xp?.[viewProfile]).level}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', marginBottom: '30px' }}>
                   <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '20px', border: '1px solid #fde68a' }}><div style={{ fontSize: '12px', color: '#b45309', fontWeight: 800, marginBottom: '4px' }}>RP PUANI</div><div style={{ fontSize: '22px', fontWeight: 900, color: '#92400e' }}>{appData?.season_score?.[viewProfile] || 0}</div></div>
                   <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '20px', border: '1px solid #a7f3d0' }}><div style={{ fontSize: '12px', color: '#047857', fontWeight: 800, marginBottom: '4px' }}>M-COIN</div><div style={{ fontSize: '22px', fontWeight: 900, color: '#064e3b' }}>{appData?.wallet?.[viewProfile] || 0}</div></div>
                </div>
             </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', paddingTop: '10px' }}>
          <div>
              <div style={{ fontSize: '12px', color: '#d4af37', fontWeight: 900, letterSpacing: '2px', marginBottom: '4px' }}>HOŞ GELDİN</div>
              <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', color: '#0f172a' }}>{firstName} <TitleBadge title={getStudentTitle(safeName)} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div onClick={() => setShowTxnModal(true)} className="profile-btn" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: '50px', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)', cursor: 'pointer' }}><span>🪙</span> {mCoin} M</div>
            <button onClick={handleLogout} className="profile-btn" style={{ background: '#ef4444', color: 'white', padding: '12px 24px', fontWeight: 800, fontSize: '15px' }}>Çıkış</button>
          </div>
        </div>

        <div className="fade-in" key={activeTab}>
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: '#ffffff', borderRadius: '32px', padding: '35px', border: '1px solid #f1f5f9', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px' }}>
                   <div style={avatarStyle}>{(myCosmetics.avatar && myCosmetics.avatar.val) ? myCosmetics.avatar.val : '🎓'}</div>
                   <div>
                     <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{safeName}</div>
                     <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}><span style={{ background: myBadge.color, color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>{myBadge.icon} {myBadge.name}</span><TitleBadge title={getStudentTitle(safeName)} /></div>
                     <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {is2XActive && <span style={{ color: 'white', fontWeight: 900, fontSize: '11px', background: 'linear-gradient(135deg, #f59e0b, #b45309)', padding: '6px 12px', borderRadius: '10px' }}>⚡ {isGlobal2X ? 'TÜM YURT 2X' : '2X AKTİF'}</span>}
                        {hasStreak && <span style={{ color: 'white', fontWeight: 900, fontSize: '11px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '6px 12px', borderRadius: '10px' }}>🛡️ KORUMA</span>}
                     </div>
                   </div>
                </div>

                <div className="grid-mobile-2" style={{ marginBottom: '25px', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                    <div style={{ background: '#fef3c7', borderRadius: '20px', padding: '20px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#b45309' }}>🏆 RP SIRASI</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#92400e' }}>{myRpRank}.</span></div>
                    <div style={{ background: '#ecfdf5', borderRadius: '20px', padding: '20px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>💳 ZENGİNLİK</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b' }}>{myWealthRank}.</span></div>
                    <div style={{ background: '#eff6ff', borderRadius: '20px', padding: '20px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#1d4ed8' }}>🏅 KATILIM</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#1e3a8a' }}>{myXpRank}.</span></div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Seviye {xpDetail.level}</span><span style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>Seviye {xpDetail.level + 1}</span></div>
                   <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}><div style={{ background: 'linear-gradient(90deg, #3b82f6, #0ea5e9)', width: `${xpDetail.progress}%`, height: '100%', borderRadius: '10px', transition: 'width 0.5s ease-out' }}></div></div>
                   <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}><span style={{ color: '#0f172a', fontWeight: 900 }}>{xpDetail.currentXp} XP</span> / {xpDetail.nextLevelXp} XP</div>
                </div>

                {myGameAppointments.length > 0 && (
                    <div style={{ background: '#fffbeb', border: '2px solid #fde047', borderRadius: '24px', padding: '25px', marginTop: '25px' }}>
                       <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 900, color: '#b45309' }}>🎮 Haftalık Oyun Odası Randevuların</h3>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {myGameAppointments.map((appt, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #fde68a' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <span style={{ fontSize: '24px' }}>{appt.icon}</span>
                                      <div>
                                          <div style={{ fontWeight: 900, color: '#92400e', fontSize: '15px' }}>{appt.device}</div>
                                          <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 700 }}>{appt.day} • {appt.time}</div>
                                      </div>
                                  </div>
                                  <div style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>ONAYLI</div>
                              </div>
                          ))}
                       </div>
                    </div>
                )}

                <div style={{ background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '25px', marginTop: '25px' }}>
                   <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>🎯 Aktif Görevler</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {['q1', 'q2', 'q3'].map(qId => {
                         const q = quests[qId]; if (!q || !q.text) return null; 
                         const isPart = (q.participants || []).includes(safeName);
                         return (
                            <div key={qId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isPart ? '#f0fdf4' : '#f8fafc', padding: '16px', borderRadius: '16px', border: `1px solid ${isPart ? '#10b981' : '#e2e8f0'}` }}>
                               <div><div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{q.text}</div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>Ödül: +{q.amt} {q.type}</div></div>
                               {isPart ? <div style={{ color: '#10b981', fontWeight: 900, fontSize: '12px' }}>KATILDIN</div> : <button onClick={() => { db.ref(`mavikent_premium/quests/${qId}/participants`).set([...(q.participants||[]), safeName]); alert("Göreve katıldın!"); }} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '8px 16px', fontSize: '12px' }}>Katıl</button>}
                            </div>
                         )
                      })}
                   </div>
                </div>

                <div className="grid-mobile-2" style={{ marginTop: '25px' }}>
                   <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px', padding: '25px', textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎰</div><h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 900 }}>Şans Çarkı</h3>
                      <button onClick={rollLottery} className="profile-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', padding: '14px', fontSize: '14px', fontWeight: 900, width: '100%', marginTop: '15px' }}>ÇEVİR ({myTickets} BİLET)</button>
                   </div>
                   <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: '24px', padding: '25px', textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: '50px', marginBottom: '10px' }}>🪙</div><h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 900 }}>Kazı Kazan</h3>
                      <button onClick={playScratchcard} className="profile-btn" style={{ background: 'white', color: '#047857', padding: '14px', fontSize: '14px', fontWeight: 900, width: '100%', marginTop: '15px' }}>OYNA (15 M)</button>
                   </div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: '24px', padding: '20px', marginTop: '25px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'white' }}>💬 Canlı Meydan Özeti</h3>
                        <button onClick={() => setActiveTab('chat')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Sohbete Git</button>
                    </div>
                    
                    <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                        <div className="auto-scroll-chat" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.keys(appData?.global_chat || {}).length === 0 ? <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>Henüz mesaj yok...</div> : (
                                Object.keys(appData.global_chat).slice(-15).map(k => { 
                                    const msg = appData.global_chat[k];
                                    const isSystem = msg.type === 'system';
                                    const isAdmin = msg.type === 'admin';
                                    const msgTitle = getStudentTitle(msg.s);
                                    
                                    if (isAdmin) {
                                        return (
                                            <div key={k} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', padding: '10px 15px', borderRadius: '12px', borderLeft: `3px solid #fca5a5`, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '11px', color: '#fecaca', fontWeight: 900, marginBottom: '4px' }}>👑 {msg.s}</div>
                                                <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>{msg.t}</div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={k} style={{ background: isSystem ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', borderLeft: `3px solid ${isSystem ? '#10b981' : '#3b82f6'}`, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '11px', color: isSystem ? '#10b981' : '#94a3b8', fontWeight: 900, marginBottom: '4px' }}>{msg.s} <TitleBadge title={msgTitle && !isSystem ? msgTitle : null} /></div>
                                            <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{msg.t}</div>
                                        </div>
                                    );
                                })
                            )}
                            {Object.keys(appData?.global_chat || {}).length > 0 && Object.keys(appData.global_chat).slice(-15).map(k => { 
                                    const msg = appData.global_chat[k];
                                    const isSystem = msg.type === 'system';
                                    const isAdmin = msg.type === 'admin';
                                    const msgTitle = getStudentTitle(msg.s);

                                    if (isAdmin) {
                                        return (
                                            <div key={k+"_dup"} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', padding: '10px 15px', borderRadius: '12px', borderLeft: `3px solid #fca5a5`, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '11px', color: '#fecaca', fontWeight: 900, marginBottom: '4px' }}>👑 {msg.s}</div>
                                                <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>{msg.t}</div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={k + "_dup"} style={{ background: isSystem ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', borderLeft: `3px solid ${isSystem ? '#10b981' : '#3b82f6'}`, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '11px', color: isSystem ? '#10b981' : '#94a3b8', fontWeight: 900, marginBottom: '4px' }}>{msg.s} <TitleBadge title={msgTitle && !isSystem ? msgTitle : null} /></div>
                                            <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{msg.t}</div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                    <div style={{ position: 'absolute', top: 50, left: 0, width: '100%', height: '20px', background: 'linear-gradient(to bottom, #0f172a, transparent)', zIndex: 2 }}></div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20px', background: 'linear-gradient(to top, #0f172a, transparent)', zIndex: 2 }}></div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="fade-in" style={{ background: '#ffffff', borderRadius: '32px', display: 'flex', flexDirection: 'column', height: '70vh', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
               <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '18px' }}>💬 Mavikent Meydanı</div>
                  <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>Canlı Sohbet</div>
               </div>
               
               <div ref={chatContainerRef} className="clean-scroll" style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {Object.keys(appData?.global_chat || {}).length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 700, marginTop: '20px' }}>Sohbet henüz boş. İlk mesajı sen at!</div> : (
                      Object.keys(appData.global_chat).map(k => {
                          const msg = appData.global_chat[k];
                          const isMe = msg.s === safeName;
                          const isSystem = msg.type === 'system';
                          const isAdmin = msg.type === 'admin';
                          const msgTitle = getStudentTitle(msg.s);
                          
                          if (isAdmin) {
                              return (
                                  <div key={k} style={{ alignSelf: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', padding: '12px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, margin: '10px 0', boxShadow: '0 4px 10px rgba(239,68,68,0.3)', textAlign: 'center', maxWidth: '90%', border: '2px solid #fca5a5' }}>
                                      <div style={{fontSize:'10px', color:'#fecaca', marginBottom:'4px', letterSpacing:'1px'}}>👑 YÖNETİCİ MESAJI</div>
                                      {msg.t}
                                  </div>
                              )
                          }

                          if (isSystem) {
                              return (
                                  <div key={k} style={{ alignSelf: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '8px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: 800, margin: '10px 0', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', textAlign: 'center', maxWidth: '90%' }}>
                                      {msg.t}
                                  </div>
                              )
                          }

                          return (
                             <div key={k} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                {!isMe && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, marginBottom: '4px', marginLeft: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>{msg.s.split(' ')[0]} <TitleBadge title={msgTitle && !isSystem ? msgTitle : null} /></div>}
                                <div className={isMe ? 'chat-me chat-bubble' : 'chat-other chat-bubble'}>{msg.t}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>{msg.date}</div>
                             </div>
                          )
                      })
                  )}
               </div>

               <div style={{ padding: '15px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                   <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') sendChatMessage(); }} placeholder="Mesaj yaz..." className="elite-input" style={{ flex: 1, padding: '15px', marginBottom: 0, textAlign: 'left' }} maxLength={150} />
                   <button onClick={sendChatMessage} className="profile-btn" style={{ background: '#3b82f6', color: 'white', padding: '0 25px', fontSize: '15px' }}>Gönder</button>
               </div>
            </div>
          )}

          {activeTab === 'game' && (
            <div className="fade-in">
               <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '30px', borderRadius: '32px', color: 'white', marginBottom: '25px', boxShadow: '0 15px 30px rgba(99,102,241,0.3)' }}>
                  <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎮</div>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>Oyun Odası Randevu</h2>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, opacity: 0.9 }}>Bakiye ile istediğin cihazı şimdiden rezerve et, sıranı garantile!</p>
               </div>

               <div style={{ background: 'white', borderRadius: '32px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>1. GÜN SEÇİN</div>
                  <div className="clean-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '15px' }}>
                     {DAYS.map((day, idx) => {
                         const isPast = (liveDayIdx === 5 && currentHour >= 17) 
                             ? (idx < 5 ? false : (idx === 5 ? false : true)) 
                             : (liveDayIdx === 6 ? (idx === 5 ? true : false) : idx < liveDayIdx);
                             
                         return (
                             <button key={day} onClick={() => { if(!isPast) setGameDay(day); }} className="profile-btn" style={{ background: gameDay === day ? '#0f172a' : '#f8fafc', color: gameDay === day ? 'white' : (isPast ? '#cbd5e1' : '#64748b'), padding: '14px 24px', flexShrink: 0, border: gameDay === day ? 'none' : '1px solid #e2e8f0', cursor: isPast ? 'not-allowed' : 'pointer' }}>
                                 {day} {isPast && <span style={{ fontSize:'10px', display:'block' }}>Süresi Geçti</span>}
                             </button>
                         )
                     })}
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>2. CİHAZ SEÇİN</div>
                  <div className="grid-mobile-2" style={{ marginBottom: '30px' }}>
                     {GAME_DEVICES.map(dev => (
                         <div key={dev.id} onClick={() => setGameDevice(dev.id)} className="card-hover" style={{ background: gameDevice === dev.id ? '#eff6ff' : '#f8fafc', border: `2px solid ${gameDevice === dev.id ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '20px', padding: '20px 15px', textAlign: 'center', cursor: 'pointer' }}>
                             <div style={{ fontSize: '40px', marginBottom: '10px' }}>{dev.icon}</div>
                             <div style={{ fontSize: '14px', fontWeight: 900, color: gameDevice === dev.id ? '#1e3a8a' : '#0f172a' }}>{dev.name}</div>
                         </div>
                     ))}
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>3. SEANS SEÇİN ({gameDay})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {GAME_SLOTS[gameDevice].map(slot => {
                         const bookedBy = appData?.game_room_appointments?.[gameDevice]?.[gameDay]?.[slot.id];
                         const isBooked = !!bookedBy;
                         const isMyBook = bookedBy === safeName;

                         let isPastTimeToday = false;
                         if (selectedDayIdx === liveDayIdx) {
                             const endTimeStr = slot.time.split('-')[1];
                             if (endTimeStr) {
                                 const [eH, eM] = endTimeStr.trim().split(':').map(Number);
                                 if (currentHour > eH || (currentHour === eH && currentMin >= eM)) {
                                     isPastTimeToday = true;
                                 }
                             }
                         }
                         const isLockedTime = isPastDay || isPastTimeToday;

                         return (
                             <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: isMyBook ? '#ecfdf5' : (isBooked ? '#fef2f2' : (isLockedTime ? '#f1f5f9' : '#ffffff')), border: `2px solid ${isMyBook ? '#10b981' : (isBooked ? '#fca5a5' : (isLockedTime ? '#e2e8f0' : '#e2e8f0'))}`, borderRadius: '20px', opacity: isLockedTime && !isMyBook && !isBooked ? 0.6 : 1 }}>
                                 <div>
                                     <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '4px', textDecoration: isLockedTime && !isMyBook && !isBooked ? 'line-through' : 'none' }}>🕒 {slot.time}</div>
                                     <div style={{ fontSize: '13px', fontWeight: 800, color: isMyBook ? '#047857' : (isBooked ? '#ef4444' : (isLockedTime ? '#94a3b8' : '#64748b')) }}>
                                         {isMyBook ? '✅ SENİN RANDEVUN' : (isLockedTime && !isBooked ? '⏳ SÜRESİ GEÇTİ' : (isBooked ? `🔒 DOLU (${bookedBy.split(' ')[0]})` : '🟢 BOŞ'))}
                                     </div>
                                 </div>
                                 {!isBooked && !isLockedTime && (
                                     <button onClick={() => handleBookGameSlot(slot)} className="profile-btn" style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', fontSize: '14px' }}>AL ({slot.price} M)</button>
                                 )}
                                 {isLockedTime && !isBooked && !isMyBook && (
                                     <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', padding: '12px 0' }}>KAPANDI</div>
                                 )}
                             </div>
                         )
                     })}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'clan' && (
            <div className="fade-in">
               {!myClanId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '35px', borderRadius: '32px', color: 'white', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.3)', gap: '15px' }}>
                        <div><h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>🛡️ Klanlara Katıl</h2><p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontWeight: 600 }}>Kendi klanını kur ve haftalık savaşlarda liderliğe oyna.</p></div>
                        <button onClick={() => setShowCreateClan(true)} className="profile-btn" style={{ background: '#d4af37', color: 'white', padding: '16px 24px', fontSize: '15px' }}>Klan Kur (Ücretsiz)</button>
                     </div>

                     {appData?.clan_invites?.[safeName] && Object.keys(appData.clan_invites[safeName]).length > 0 && (
                        <div style={{ background: '#fffbeb', border: '2px solid #fde047', borderRadius: '24px', padding: '25px' }}>
                           <h4 style={{ margin: '0 0 15px 0', color: '#b45309', fontWeight: 900, fontSize: '16px' }}>📬 Gelen Davetler</h4>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {Object.keys(appData.clan_invites[safeName]).map(cId => {
                                 const inv = appData.clan_invites[safeName][cId];
                                 return (
                                    <div key={cId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '16px' }}>
                                       <div style={{ fontWeight: 800, color: '#0f172a' }}>{inv.icon} {inv.clanName}</div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                          <button onClick={() => acceptInvite(cId)} className="profile-btn" style={{ background: '#10b981', color: 'white', padding: '8px 16px' }}>Katıl</button>
                                          <button onClick={() => rejectInvite(cId)} className="profile-btn" style={{ background: '#ef4444', color: 'white', padding: '8px 16px' }}>Reddet</button>
                                       </div>
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     )}

                     <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '24px', padding: '25px' }}>
                         <h4 style={{ margin: '0 0 15px 0', color: '#b45309', fontWeight: 900, fontSize: '18px' }}>🤝 Ortak İmece Fırsatları</h4>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             {Object.keys(appData?.group_buys || {}).filter(k => appData.group_buys[k].active).map(k => {
                                 const gb = appData.group_buys[k];
                                 const parts = gb.participants || [];
                                 const progress = (parts.length / gb.mp) * 100;
                                 return (
                                     <div key={k} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                             <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>{gb.i} {gb.n}</div>
                                             <div style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>Kişi Başı: {gb.pp} M</div>
                                         </div>
                                         <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}><div style={{ background: '#f59e0b', width: `${progress}%`, height: '100%', transition: '0.3s' }}></div></div>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                             <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{parts.length} / {gb.mp} Kişi Katıldı</div>
                                             <button onClick={() => handleJoinGroupBuy(k, gb)} className="profile-btn" style={{ background: parts.includes(safeName) ? '#fef2f2' : '#0f172a', color: parts.includes(safeName) ? '#ef4444' : 'white', padding: '6px 12px', fontSize: '12px' }}>
                                                 {parts.includes(safeName) ? 'ORTAK OLDUN' : 'ORTAK OL'}
                                             </button>
                                         </div>
                                     </div>
                                 )
                             })}
                             {Object.keys(appData?.group_buys || {}).filter(k => appData.group_buys[k].active).length === 0 && <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>Şu an aktif bir imece bulunmuyor.</div>}
                         </div>
                     </div>

                     <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '5px' }}>🚩 Genel Klan Sıralaması</h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {clanScores.map((c, idx) => (
                           <div key={c.id} onClick={() => setSelectedClan(c)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor:'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                 <span style={{ fontSize: '20px', fontWeight: 900, color: idx===0 ? '#f59e0b' : '#94a3b8' }}>#{idx+1}</span>
                                 <span style={{ fontSize: '32px' }}>{c.icon}</span>
                                 <div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{c.name} <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>{c.tag}</span></div>
                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Üyeler: {(c.members||[]).length}/3</div>
                                 </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{c.warScore} <span style={{ fontSize: '12px', color: '#64748b' }}>SAVAŞ P.</span></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '40px', borderRadius: '32px', color: 'white', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.3)' }}>
                        <button onClick={leaveClan} className="profile-btn" style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '8px 16px', fontSize: '12px' }}>Klandan Ayrıl</button>
                        <div style={{ fontSize: '70px', marginBottom: '10px' }}>{myClan?.icon}</div>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>{myClan?.name} <span style={{ fontSize: '16px', background: '#d4af37', padding: '4px 8px', borderRadius: '8px', verticalAlign: 'middle', marginLeft: '5px' }}>{myClan?.tag}</span></h2>
                        <p style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 500, fontStyle: 'italic', marginBottom: '25px' }}>"{myClan?.desc}"</p>

                        {!appData?.clan_war_participants?.[safeName] ? (
                           <button onClick={joinWar} disabled={(myClan?.members||[]).length < 3} className={`profile-btn ${(myClan?.members||[]).length >= 3 ? 'badge-glow' : ''}`} style={{ background: (myClan?.members||[]).length >= 3 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : '#475569', color: (myClan?.members||[]).length >= 3 ? 'white' : '#94a3b8', padding: '20px 40px', fontSize: '18px', width: '100%', maxWidth: '300px', cursor: (myClan?.members||[]).length >= 3 ? 'pointer' : 'not-allowed' }}>⚔️ SAVAŞA GİR (-10 M)</button>
                        ) : (
                           <div style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '2px solid #10b981', padding: '16px', borderRadius: '50px', fontWeight: 900, fontSize: '16px', display: 'inline-block' }}>⚔️ BU HAFTAKİ SAVAŞTASIN</div>
                        )}
                        {(myClan?.members || []).length < 3 && !appData?.clan_war_participants?.[safeName] && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', fontWeight: 600 }}>Savaşa girmek için klan 3 kişi olmalıdır.</div>}
                     </div>

                     <div style={{ background: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>👥 Klan Üyeleri ({(myClan?.members||[]).length}/3)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                           {(myClan?.members||[]).map(m => {
                              const rp = Number(appData?.season_score?.[m] || 0);
                              const isWarPart = appData?.clan_war_participants?.[m];
                              const title = getStudentTitle(m);
                              return (
                                 <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                       <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{String(m).split(' ')[0]}</span>
                                       {myClan?.leader === m && <span style={{ fontSize: '14px' }}>👑</span>}
                                       <TitleBadge title={title} />
                                       {isWarPart && <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900 }}>SAVAŞTA</span>}
                                    </div>
                                    <div style={{ fontWeight: 900, color: '#3b82f6', fontSize: '16px' }}>{rp} RP</div>
                                 </div>
                              )
                           })}
                        </div>
                        
                        {myClan?.leader === safeName && (myClan?.members||[]).length < 3 && (
                           <div style={{ marginTop: '20px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
                              <h5 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px', fontWeight: 800 }}>Oyuncu Davet Et</h5>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                 <input type="text" value={inviteUser} onChange={e => setInviteUser(e.target.value)} placeholder="Kullanıcı Adı" className="elite-input" style={{ flex: 1, textAlign: 'left' }} />
                                 <button onClick={handleInviteUser} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '0 20px' }}>Davet</button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
          )}

          {activeTab === 'market' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '10px', color: '#0f172a', letterSpacing: '-0.5px' }}>🛍️ Market Vitrini</h2>
               
               {appData?.auction?.active && (
                   <div className="badge-glow" style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'white', padding: '25px', borderRadius: '24px', marginBottom: '25px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(245,158,11,0.3)' }}>
                       <div style={{ fontSize: '12px', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', display: 'inline-block', marginBottom: '10px' }}>⚡ CANLI İHALE</div>
                       <h3 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 900 }}>{appData.auction.item}</h3>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                           <div>
                               <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>En Yüksek Teklif</div>
                               <div style={{ fontSize: '22px', fontWeight: 900 }}>{appData.auction.currentBid} M</div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>Lider</div>
                               <div style={{ fontSize: '16px', fontWeight: 800 }}>{appData.auction.highestBidder ? String(appData.auction.highestBidder).split(' ')[0] : 'Yok'}</div>
                           </div>
                       </div>
                       <div style={{ display: 'flex', gap: '10px' }}>
                           <input type="number" id="bidInput" placeholder={`Min: ${appData.auction.currentBid + 5} M`} className="elite-input" style={{ flex: 1, padding: '12px', border: 'none', textAlign: 'left' }} />
                           <button onClick={handlePlaceBid} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '0 20px' }}>TEKLİF VER</button>
                       </div>
                   </div>
               )}

               {isPersonalDiscountActive && (
                   <div className="badge-glow" style={{ background: '#ecfdf5', border: '2px solid #10b981', padding: '20px', borderRadius: '24px', marginBottom: '25px', textAlign: 'center' }}>
                       <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669', marginBottom: '5px' }}>🔥 %{personalDiscountVal} SANA ÖZEL İNDİRİM AKTİF!</div>
                       <div style={{ fontSize: '14px', color: '#047857', fontWeight: 700 }}>⏳ Bu fırsatı kaçırmamak için son <span style={{fontWeight: 900, fontSize: '16px'}}>{remainingDiscountDays} Gün</span>!</div>
                   </div>
               )}

               <div className="grid-mobile-2" style={{ gap: '16px' }}>
                 {products.map(p => {
                    // EKLENEN: OYUN ODASI ÜRÜNLERİNİ MARKETTE GÖSTERME (FİLTRE)
                    if (isGameRoomItem(p.n)) return null;

                    const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                    const isBundle = p.type === 'bundle';
                    const isTicket = p.type === 'ticket';
                    const myInflation = Number(appData?.personal_inflation?.[safeName]?.[p.key] || 0);
                    const currentBaseP = Number(p.p || 0) + (myInflation * 5);
                    const discountedP = Math.ceil(currentBaseP * (1 - currentActiveDiscountPercent / 100));
                    
                    return (
                        <div key={p.key} onClick={() => { if(!isOutOfStock) handleBuy({...p, p: currentBaseP, isTicket}) }} style={{ background: isBundle ? 'linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)' : isTicket ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff', border: `1px solid ${isOutOfStock ? '#fca5a5' : (isBundle ? '#d8b4fe' : isTicket ? '#0f172a' : '#e2e8f0')}`, borderRadius: '24px', padding: '25px 15px', textAlign: 'center', cursor: isOutOfStock ? 'not-allowed' : 'pointer', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)', opacity: isOutOfStock ? 0.6 : 1, position: 'relative' }}>
                          {p.stock !== undefined && ( <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: isOutOfStock ? '#ef4444' : '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>{isOutOfStock ? 'TÜKENDİ' : `STOK: ${p.stock}`}</div> )}
                          {isBundle && <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: '#9333ea', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>PAKET FIRSATI</div>}
                          
                          <div style={{ fontSize: '45px', marginBottom: '15px', filter: isOutOfStock ? 'grayscale(100%)' : 'none' }}>{p.i || '📦'}</div><div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '15px', color: isTicket ? 'white' : '#0f172a', lineHeight: '1.3' }}>{p.n}</div>
                          
                          {myInflation > 0 && <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 900, marginBottom: '6px', background: isTicket ? 'rgba(239,68,68,0.2)' : '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>📈 FİYAT ARTTI (+{myInflation * 5}M)</div>}
                          
                          {currentActiveDiscountPercent > 0 && <div style={{ fontSize: '12px', color: '#ef4444', textDecoration: 'line-through', fontWeight: 800, marginBottom: '4px' }}>{currentBaseP} M</div>}
                          <div style={{ background: isOutOfStock ? '#fef2f2' : (isBundle ? '#9333ea' : isTicket ? '#d4af37' : '#f8fafc'), border: `2px solid ${isOutOfStock ? '#fca5a5' : (isBundle ? '#9333ea' : isTicket ? '#d4af37' : '#e2e8f0')}`, color: isOutOfStock ? '#ef4444' : (isBundle || isTicket ? 'white' : '#0f172a'), padding: '6px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>{discountedP} M</div>
                        </div>
                    )
                 })}
               </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '25px', color: '#0f172a', letterSpacing: '-0.5px' }}>🎒 Envanterim</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'done').map(k => {
                    const item = appData.deliveries[k];
                    const isDigital = isDigitalItem(item.type, item.n || item.i);
                    return (
                      <div key={k} style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                        <div><div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', marginBottom: '6px' }}>{item.val || '📦'} {item.n || item.i}</div><div style={{ fontSize: '12px', color: '#10b981', fontWeight: 900 }}>✅ HAZIR</div></div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                           {isDigital && <button onClick={() => activateItem(k, item)} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '10px 20px', fontSize: '13px' }}>Kullan</button>}
                        </div>
                      </div>
                    );
                 })}
                 {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'wait').map(k => {
                    const item = appData.deliveries[k];
                    return (
                      <div key={k} style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                        <div><div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a', marginBottom: '6px' }}>{item.val || '📦'} {item.n || item.i}</div><div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 900 }}>⏳ ONAY BEKLİYOR</div></div>
                        <div style={{ fontSize: '30px' }}>📦</div>
                      </div>
                    );
                 })}
                 {Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].s === safeName).length === 0 && <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8', fontWeight: 700, fontSize: '16px' }}>Envanterin şu an boş.</div>}
               </div>
            </div>
          )}

          {activeTab === 'rank' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>🏆 Sıralamalar</h2>
               <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '10px' }} className="clean-scroll">
                   <button onClick={() => setRankTab('rp')} className="profile-btn" style={{ background: rankTab === 'rp' ? '#0f172a' : '#f1f5f9', color: rankTab === 'rp' ? 'white' : '#64748b', padding: '12px 20px', flexShrink: 0 }}>⚔️ RP Ligi</button>
                   <button onClick={() => setRankTab('wealth')} className="profile-btn" style={{ background: rankTab === 'wealth' ? '#10b981' : '#f1f5f9', color: rankTab === 'wealth' ? 'white' : '#64748b', padding: '12px 20px', flexShrink: 0 }}>💳 M-Coin</button>
                   <button onClick={() => setRankTab('xp')} className="profile-btn" style={{ background: rankTab === 'xp' ? '#3b82f6' : '#f1f5f9', color: rankTab === 'xp' ? 'white' : '#64748b', padding: '12px 20px', flexShrink: 0 }}>🏅 Katılım (XP)</button>
               </div>

               <div style={{ background: '#ffffff', borderRadius: '32px', padding: '20px', boxShadow: '0 15px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                 {(rankTab === 'rp' ? rpSorted : rankTab === 'wealth' ? wealthSorted : xpSorted).map((s, idx) => {
                   const currentBadge = rankTab === 'rp' ? getRankBadge(s.val) : null; 
                   const isMe = s.n === safeName; 
                   const pinned = appData?.pinned_badges?.[s.n] || [];
                   const title = getStudentTitle(s.n);
                   return (
                     <div key={s.n} onClick={() => setViewProfile(s.n)} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: idx < (rankTab === 'rp' ? rpSorted : rankTab === 'wealth' ? wealthSorted : xpSorted).length-1 ? '1px solid #e2e8f0' : 'none', background: isMe ? '#f8fafc' : 'transparent', borderRadius: isMe ? '20px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>
                       <div style={{ width: '35px', fontWeight: 900, color: idx<3 ? '#0f172a' : '#94a3b8', fontSize: '18px' }}>{idx+1}.</div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             {s.n} 
                             <TitleBadge title={title} />
                             {pinned.map(bId => <span key={bId} style={{fontSize: '14px'}}>{BADGES[bId]?.icon}</span>)}
                          </span>
                          {currentBadge && <span style={{ fontSize: '12px', color: currentBadge.color, fontWeight: 900, marginTop: '6px' }}>{currentBadge.icon} {currentBadge.name}</span>}
                       </div>
                       <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '20px' }}>{s.val} <span style={{ fontSize: '11px', color: '#64748b' }}>{rankTab.toUpperCase()}</span></div>
                     </div>
                   )
                 })}
               </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: '50px', display: 'flex', padding: '10px', width: '98%', maxWidth: '600px', zIndex: 1000, boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2)', border: '1px solid rgba(226,232,240,0.8)' }}>
         <button onClick={() => setActiveTab('home')} style={getNavStyle('home')}>Özet</button>
         <button onClick={() => setActiveTab('chat')} style={getNavStyle('chat')}>💬 Meydan</button>
         <button onClick={() => setActiveTab('clan')} style={getNavStyle('clan')}>Klan</button>
         <button onClick={() => setActiveTab('market')} style={getNavStyle('market')}>Market</button>
         <button onClick={() => setActiveTab('game')} style={getNavStyle('game')}>🎮 Oyun</button>
         <button onClick={() => setActiveTab('inventory')} style={getNavStyle('inventory')}>Çanta</button>
         <button onClick={() => setActiveTab('rank')} style={getNavStyle('rank')}>Liderlik</button>
      </div>
    </div>
  );
};

export default StudentScreen;