import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import QuizStudent from './QuizStudent';
import BilgiKulesi from './BilgiKulesi';
import KelimeAvi from './KelimeAvi';
import WeeklySummaryCard from './WeeklySummaryCard';
import { playClick, playCoin, playBooking, playCancel } from '../sounds';
import { toast } from '../toast';
import { burst } from '../confetti';

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
  gizli_3: { id: 'gizli_3', icon: '👑', name: 'Elitlerin Efendisi', desc: 'Elit Lige çıkana verilir.', type: 'gizli' },
  sezon1_samp: { id: 'sezon1_samp', icon: '🏆', name: '1. Sezon Fatihi', desc: 'Mavikent Premier League 1. Sezon Şampiyonu. (Ebedi Rozet)', type: 'gizli' }
};

const BAD_WORDS = ['amk', 'aq', 'siktir', 'piç', 'oç', 'yavşak', 'lan', 'mal', 'salak', 'gerizekalı'];

const censorText = (text) => {
    let res = text;
    BAD_WORDS.forEach(bw => { 
        const regex = new RegExp(bw, 'gi'); 
        res = res.replace(regex, '***'); 
    });
    return res;
};

const formatTitle = (raw) => {
    if (!raw) return null;
    return String(raw).replace(/\(.*?\)/g, '').replace(/Ünvanı/gi, '').replace(/['"]/g, '').trim(); 
};

const isGameRoomItem = (name) => {
    const n = String(name || '').toUpperCase();
    return ['PS4', 'PS5', 'VR ', 'GÖZLÜK', 'BİLGİSAYAR', ' PC', ' DK)'].some(kw => n.includes(kw));
};

const isDigitalItem = (type, name) => {
    const t = String(type || '').toLowerCase();
    const n = String(name || '').toUpperCase();
    return t === 'multiplier' || t === 'streak' || t === 'avatar' || t === 'title' || t === 'frame' || 
           n.includes("KUTU") || n.includes("GİZEMLİ") || n.includes("2X") || 
           n.includes("ÇARPAN") || n.includes("KORUMA") || n.includes("SERİ") || 
           n.includes("ÜNVAN") || n.includes("JOKER");
};

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GAME_DEVICES = [
    { id: 'ps4', name: 'PS4', icon: '🎮' },
    { id: 'ps5', name: 'PS5', icon: '🕹️' },
    { id: 'vr', name: 'VR (Sanal Gerçeklik)', icon: '🥽' },
    { id: 'pc', name: 'Bilgisayar', icon: '💻' }
];

const SHARD_TYPES = [
    { id: 'ps4', name: 'PS4', icon: '🎮', color: '#3b82f6', bg: '#eff6ff' },
    { id: 'pc', name: 'PC', icon: '💻', color: '#10b981', bg: '#ecfdf5' },
    { id: 'ps5', name: 'PS5', icon: '🕹️', color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'vr', name: 'VR', icon: '🥽', color: '#f59e0b', bg: '#fffbeb' }
];

const FLOOR_AREA_TYPES = {
    wc:        { icon: '🚽', label: 'WC / Tuvalet',   color: '#0ea5e9', bg: '#f0f9ff' },
    etut:      { icon: '📚', label: 'Etüt Salonu',    color: '#8b5cf6', bg: '#faf5ff' },
    yatakhane: { icon: '🛏️', label: 'Yatakhane',      color: '#10b981', bg: '#f0fdf4' },
    genel:     { icon: '🧹', label: 'Genel Temizlik', color: '#f59e0b', bg: '#fffbeb' },
};

const GAME_SLOTS = {
    'ps4': [
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

// 🍽️ YEMEK PUANLAMA BİLEŞENİ
const YemekPuanlama = ({ ogrenciAdi }) => {
  const [menu, setMenu] = useState('');
  const [mevcutPuan, setMevcutPuan] = useState({ kahvalti: 0, ogle: 0, aksam: 0 });
  const [hoverPuan, setHoverPuan] = useState({ kahvalti: 0, ogle: 0, aksam: 0 });
  const [yukleniyor, setYukleniyor] = useState(true);

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const bugunTarihStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

  useEffect(() => {
    const menuRef = db.ref(`mavikent_premium/yemek_gecmisi/${bugunTarihStr}`);
    const handleMenu = (snap) => {
      if (snap.exists()) setMenu(snap.val() || '');
      else setMenu('');
      setYukleniyor(false);
    };
    menuRef.on('value', handleMenu);
    return () => menuRef.off('value', handleMenu);
  }, [bugunTarihStr]);

  useEffect(() => {
    if (ogrenciAdi) {
      const oyRef = db.ref(`mavikent_premium/yemek_puanlari/${bugunTarihStr}/${ogrenciAdi}`);
      const handleOy = (snap) => {
        if (snap.exists()) {
           const val = snap.val();
           if (typeof val === 'number') setMevcutPuan({ kahvalti: 0, ogle: val, aksam: 0 });
           else setMevcutPuan({ kahvalti: val.kahvalti || 0, ogle: val.ogle || 0, aksam: val.aksam || 0 });
        } else setMevcutPuan({ kahvalti: 0, ogle: 0, aksam: 0 });
      };
      oyRef.on('value', handleOy);
      return () => oyRef.off('value', handleOy);
    }
  }, [ogrenciAdi, bugunTarihStr]);

  const puanGonder = async (ogunId, puan) => {
    if (!ogrenciAdi) return toast("⚠️ Lütfen önce sisteme giriş yapın!");
    try {
      await db.ref(`mavikent_premium/yemek_puanlari/${bugunTarihStr}/${ogrenciAdi}/${ogunId}`).set(puan);
      setMevcutPuan(prev => ({ ...prev, [ogunId]: puan }));
    } catch (error) { toast("Hata oluştu: " + error.message); }
  };

  const isUnlocked = (ogun) => {
    const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
    if (ogun === 'kahvalti') return h >= 8;
    if (ogun === 'ogle') return h > 13 || (h === 13 && m >= 30);
    if (ogun === 'aksam') return h >= 19;
    return false;
  };

  if (yukleniyor || !menu || menu.trim() === '') return null;

  const renderOylama = (ogunId, icon, baslik, saatStr) => {
    const isAcik = isUnlocked(ogunId);
    return (
      <div key={ogunId} style={{ background: 'white', padding: '15px', borderRadius: '20px', marginBottom: '10px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '10px' }}>
           <div style={{ fontSize: '15px', fontWeight: '900', color: '#b45309', display:'flex', alignItems:'center', gap:'5px' }}><span>{icon}</span> {baslik}</div>
           <div style={{ fontSize: '11px', fontWeight: '800', color: isAcik ? '#10b981' : '#ef4444', background: isAcik ? '#d1fae5' : '#fef2f2', padding: '4px 8px', borderRadius: '8px' }}>
              {isAcik ? 'AÇIK' : `Saat ${saatStr}'de Açılacak`}
           </div>
        </div>
        
        {isAcik ? (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', marginBottom: '5px' }}>{mevcutPuan[ogunId] > 0 ? `Verdiğin Puan: ${mevcutPuan[ogunId]}` : "Puan Ver:"}</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((yildiz) => (
                <button key={yildiz} 
                  onClick={() => puanGonder(ogunId, yildiz)} 
                  onMouseEnter={() => setHoverPuan({...hoverPuan, [ogunId]: yildiz})} 
                  onMouseLeave={() => setHoverPuan({...hoverPuan, [ogunId]: 0})} 
                  style={{ background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: (hoverPuan[ogunId] || mevcutPuan[ogunId]) >= yildiz ? '#f59e0b' : '#fef3c7', transition: 'all 0.2s', padding: 0, transform: hoverPuan[ogunId] === yildiz ? 'scale(1.2)' : 'scale(1)' }}>★</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '30px', color: '#fef3c7', display: 'flex', gap: '8px' }}>★★★★★</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: '#fffbeb', borderRadius: '32px', padding: '30px', boxShadow: '0 15px 40px -10px rgba(217,119,6,0.15)', border: '2px solid #fde68a', marginTop: '25px', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', fontWeight: '900', color: '#b45309', letterSpacing: '2px', marginBottom: '10px' }}>🍽️ GÜNÜN MENÜSÜ</div>
      <div style={{ fontSize: '16px', fontWeight: '800', color: '#78350f', marginBottom: '20px', lineHeight: '1.6', background: 'white', padding: '20px', borderRadius: '20px', whiteSpace: 'pre-line', border: '1px solid #fde68a' }}>
        {menu}
      </div>
      <div style={{ width: '100%', height: '2px', background: '#fde68a', marginBottom: '20px' }}></div>
      <div style={{ fontSize: '14px', fontWeight: '900', color: '#92400e', marginBottom: '15px' }}>👇 ÖĞÜNLERİ DEĞERLENDİR 👇</div>
      
      {renderOylama('kahvalti', '🍳', 'Kahvaltı', '08:00')}
      {renderOylama('ogle', '🍲', 'Öğle Yemeği', '13:30')}
      {renderOylama('aksam', '🍽️', 'Akşam Yemeği', '19:00')}
    </div>
  );
};

// Zaman Kilidi Algoritması (Tarih ve Saati Kontrol Eder)
const isMatchPlayable = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return true; 
    try {
        let year, month, day;
        let cleanDate = String(dateStr).trim();
        
        if (cleanDate.includes('.')) {
            let parts = cleanDate.split('.');
            day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
            if (year < 100) year += 2000;
        } else if (cleanDate.includes('/')) {
            let parts = cleanDate.split('/');
            day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
            if (year < 100) year += 2000;
        } else if (cleanDate.includes('-')) {
            let parts = cleanDate.split('-');
            if (parts[0].length === 4) {
                year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]);
            } else {
                day = parseInt(parts[0]); month = parseInt(parts[1]) - 1; year = parseInt(parts[2]);
                if (year < 100) year += 2000;
            }
        } else {
            return true;
        }
        
        let h = 0, m = 0;
        if (timeStr.includes('-')) {
            let timeParts = timeStr.split('-')[0].trim().split(':');
            h = parseInt(timeParts[0]); m = parseInt(timeParts[1]);
        } else {
            let timeParts = timeStr.trim().split(':');
            h = parseInt(timeParts[0]); m = parseInt(timeParts[1]);
        }
        
        const matchDate = new Date(year, month, day, h, m, 0);
        return new Date() >= matchDate;
    } catch (e) {
        return true; 
    }
};

const StudentScreen = ({ studentName, appData, goBackToRoles }) => {
  const safeName = String(studentName || '');
  
  const [activeTab, setActiveTab] = useState('home');
  const [rankTab, setRankTab] = useState('rp');
const [walletTab, setWalletTab] = useState('plus');
const [bankTimeFilter, setBankTimeFilter] = useState('all'); // Banka filtrelemesi için eklendi

  // Bildirimleri Oku (Sadece okunmamışları filtrele)
  const unreadNotifications = Object.entries(appData?.notifications?.[safeName] || {}).filter(([id, notif]) => !notif.isRead).sort((a,b) => b[1].timestamp - a[1].timestamp);
  
  const [boxAnim, setBoxAnim] = useState({ active: false, type: '', step: 0, result: null, count: 1 });
  const [actionModal, setActionModal] = useState({ active: false, type: '', data: null });
  
  const [unlockedQueue, setUnlockedQueue] = useState([]);
  const [viewProfile, setViewProfile] = useState(null);
  
  const [showCreateClan, setShowCreateClan] = useState(false);
  const [newClan, setNewClan] = useState({ name: '', tag: '', icon: '🛡️', desc: '' });
  const [inviteUser, setInviteUser] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [lastMsgTime, setLastMsgTime] = useState(0);
  const chatContainerRef = useRef(null);
  
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  
  const [purchaseModal, setPurchaseModal] = useState({ active: false, item: null, target: 'self', receiver: '' });

  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [gameDay, setGameDay] = useState(DAYS[currentDayIndex]);
  const [gameDevice, setGameDevice] = useState('ps4');
  
  const [akademiView, setAkademiView] = useState('menu');
  const [activeTourneyTab, setActiveTourneyTab] = useState({});
  const [activeWeekTab, setActiveWeekTab] = useState({});
  const [expandedTourney, setExpandedTourney] = useState(null);
  const [stuHygSection, setStuHygSection] = useState(null);
  const [stuHygFloor, setStuHygFloor] = useState(null);
  const [stuHygAreaId, setStuHygAreaId] = useState(null);
  const [stuHygScore, setStuHygScore] = useState(5);
  const [isHygSaving, setIsHygSaving] = useState(false);

  const isController = appData?.settings?.game_room_controller === safeName;
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [evalForm, setEvalForm] = useState({ 
      bookingId: '', student: '', device: '', day: '', slot: '', time: '', 
      attended: true, // İştirak durumu
      q1: true, q2: true, q3: true, q4: true, q5: false, photoUrl: '' 
  });
  const [scoreForm, setScoreForm] = useState({ tId: '', matchId: '', s1: '', s2: '' });

  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});

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

  const todayStrTR = DAYS[currentDayIndex] || 'Pazartesi';

  const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              let MAX_WIDTH = 800;
              let scaleSize = MAX_WIDTH / img.width;
              if (img.height > img.width) {
                  const MAX_HEIGHT = 800;
                  scaleSize = MAX_HEIGHT / img.height;
              }
              canvas.width = img.width * scaleSize;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
              setEvalForm({ ...evalForm, photoUrl: compressedBase64 });
          };
      };
  };

  const getDetailedLevelInfo = (xp) => { 
      const safeXp = Number(xp) || 0; 
      const level = Math.floor(Math.sqrt(safeXp / 50)) + 1; 
      const currentLevelBaseXp = Math.pow(level - 1, 2) * 50; 
      const nextLevelBaseXp = Math.pow(level, 2) * 50; 
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
          let val = 0; 
          if (metric === 'rp') val = Number(appData?.season_score?.[n] || 0); 
          if (metric === 'wealth') val = Number(appData?.wallet?.[n] || 0); 
          if (metric === 'xp') val = Number(appData?.xp?.[n] || 0); 
          return { n: String(n), val }; 
      }).sort((a,b) => b.val - a.val); 
  };

  let myClanId = null; let myClan = {};
  Object.keys(appData?.clans || {}).forEach(k => { 
      if ((appData?.clans?.[k]?.members || []).includes(safeName)) { myClanId = k; myClan = appData.clans[k] || {}; } 
  });

  const clanScores = Object.keys(appData?.clans || {}).map(cId => {
      const clan = appData.clans[cId] || {}; let warScore = 0; let totalRp = 0;
      (clan.members || []).forEach(m => { const rp = Number(appData?.season_score?.[m] || 0); totalRp += rp; if (appData?.clan_war_participants?.[m]) warScore += rp; });
      return { id: cId, ...clan, warScore, totalRp };
  }).sort((a,b) => b.warScore - a.warScore || b.totalRp - a.totalRp);

  useEffect(() => { if (activeTab === 'chat' && chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; } }, [activeTab, appData?.global_chat]);

  useEffect(() => {
      if(safeName) {
          db.ref(`mavikent_premium/last_logins/${safeName}`).set(new Date().toLocaleString('tr-TR'));
      }
  }, [safeName]);

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
      const dayIndex = new Date().getDay(); // 0:Pazar, 6:Cmt
      const hour = new Date().getHours();

      if (dayIndex === 6 && hour >= 16) {
          const todayStr = new Date().toDateString();
          if (appData?.settings?.last_gameroom_reset !== todayStr) {
              const newAppointments = {};
              
              // 1. Oynanmamış tüm turnuva maçlarını bul ve seanslara yerleştir (2. Hafta, 3. Hafta vb.)
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
              updates['settings/last_gameroom_reset'] = todayStr;
              updates['game_room_appointments'] = Object.keys(newAppointments).length > 0 ? newAppointments : null;
              
              db.ref('mavikent_premium').update(updates).then(() => {
                  db.ref('mavikent_premium/global_chat').push({ 
                      s: 'SİSTEM', 
                      t: `📢 Oyun Odası randevuları sıfırlandı! (Sıradaki lig maçları seanslara otomatik kilitlendi). Yeni hafta rezervasyonları açılmıştır.`, 
                      ts: Date.now(), 
                      type: 'system', 
                      date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
                  });
              });
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
  }, [safeName, appData, unlockedQueue]);

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
      localStorage.removeItem('mavikentSession'); goBackToRoles();
  };

  const sendChatMessage = () => {
      if (!chatInput.trim()) return;
      if (appData?.banned_chat?.[safeName]) return toast("⛔ Yönetici tarafından sohbetten kalıcı olarak yasaklandınız!");
      if (Date.now() - lastMsgTime < 10000) return toast("⏳ Yavaş Mod aktif! Lütfen 10 saniye bekleyip tekrar gönderin.");
      const cleanText = censorText(chatInput);
      db.ref('mavikent_premium/global_chat').push({ s: safeName, t: cleanText, ts: Date.now(), date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      setChatInput(''); setLastMsgTime(Date.now());
  };

  const submitEvaluation = () => {
      if(!evalForm.student) return toast("Değerlendirilecek randevuyu seçin!");
      
      if(evalForm.attended !== false) {
          const hasViolation = !evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || evalForm.q5;
          if(hasViolation && !evalForm.photoUrl) {
              if(!window.confirm("İhlal bildirdiniz ama KANIT FOTOĞRAFI eklemediniz. Yine de göndermek istiyor musunuz?")) return;
          }
      }

      if(window.confirm(`${String(evalForm.student || '')} adlı öğrenci için işlem sisteme işlenecek. Onaylıyor musun?`)) {
          const updates = {};
          const rId = `rep_${Date.now()}`;
          
          updates[`game_room_reports/${rId}`] = {
              controller: safeName, target: evalForm.student, device: evalForm.device, day: evalForm.day, time: evalForm.time,
              attended: evalForm.attended !== false,
              q1: evalForm.q1, q2: evalForm.q2, q3: evalForm.q3, q4: evalForm.q4, q5: evalForm.q5,
              photoUrl: evalForm.photoUrl || '', date: new Date().toLocaleString('tr-TR')
          };

          if(evalForm.attended !== false) {
              // 1. ÖĞRENCİ GELDİYSE NORMAL İŞLEYİŞ VE CEZALAR
              if(evalForm.q5) {
                  const expTime = Date.now() + (7 * 24 * 60 * 60 * 1000); 
                  updates[`game_room_bans/${evalForm.student}`] = {
                      reason: 'Yiyecek/İçecek İhlali (Sorumlu Raporu)', photoUrl: evalForm.photoUrl || '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR')
                  };
                  Object.keys(appData?.game_room_appointments || {}).forEach(d => {
                      Object.keys(appData.game_room_appointments[d] || {}).forEach(dy => {
                          Object.keys(appData.game_room_appointments[d][dy] || {}).forEach(sId => {
                              if (appData.game_room_appointments[d][dy][sId] === evalForm.student) { updates[`game_room_appointments/${d}/${dy}/${sId}`] = null; }
                          });
                      });
                  });
              }
          } else {
              // 2. İŞTİRAK ETMEDİYSE İPTAL VE İADE YAP
              if (evalForm.device && evalForm.day && evalForm.slot) {
                  updates[`game_room_appointments/${evalForm.device}/${evalForm.day}/${evalForm.slot}`] = null;
              }
              
              let refundAmt = 0;
              const slotList = GAME_SLOTS[evalForm.device] || [];
              const slotObj = slotList.find(s => s.id === evalForm.slot);
              if (slotObj && slotObj.price) refundAmt = Number(slotObj.price);
              else if (evalForm.device === 'ps5') refundAmt = 30;
              else if (evalForm.device === 'ps4') refundAmt = 5;
              else if (evalForm.device === 'vr') refundAmt = 60;
              else if (evalForm.device === 'pc') refundAmt = 30;

              const customPrice = appData?.custom_game_slots?.[evalForm.device]?.[evalForm.day]?.[evalForm.slot]?.price;
              if (customPrice) refundAmt = Number(customPrice);

              updates[`wallet/${evalForm.student}`] = (Number(appData?.wallet?.[evalForm.student]) || 0) + refundAmt;
              updates[`transactions/${evalForm.student}/txn_auto_ref_${Date.now()}`] = { 
                  desc: `Oyun Odası İadesi (Gelmeme/Arıza)`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') 
              };

              db.ref('mavikent_premium/global_chat').push({ 
                  s: 'SİSTEM', 
                  t: `📢 ${String(evalForm.student).split(' ')[0]} adlı öğrenci randevusuna iştirak edemediği için ${refundAmt} M-Coin iadesi yapılmıştır.`, 
                  ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
              });
          }
          
          db.ref('mavikent_premium').update(updates).then(() => {
              toast(evalForm.attended !== false ? "✅ Rapor başarıyla yöneticiye iletildi!" : "🔄 Randevu iptal edildi ve M-Coin iadesi yapıldı.");
              setEvalForm({ bookingId: '', student: '', device: '', day: '', slot: '', time: '', attended: true, q1: true, q2: true, q3: true, q4: true, q5: false, photoUrl: '' });
              setShowControlPanel(false);
          });
      }
  };

  const submitMatchScore = () => {
      if(!scoreForm.tId || !scoreForm.matchId) return toast("Lütfen bir turnuva ve maç seçin!");
      if(scoreForm.s1 === '' || scoreForm.s2 === '') return toast("Lütfen her iki takımın da skorunu girin!");
      
      const t = appData?.tournaments?.[scoreForm.tId];
      if (!t || !t.fixture || !t.fixture[scoreForm.matchId]) return toast("Maç verisi bulunamadı!");
      
      const m = t.fixture[scoreForm.matchId];
      const s1 = parseInt(scoreForm.s1);
      const s2 = parseInt(scoreForm.s2);
      
      const p1Name = String(m.p1 || '');
      const p2Name = String(m.p2 || '');
      
      if(window.confirm(`⚽ ${p1Name} ${s1} - ${s2} ${p2Name}\n\nBu skor kaydedilecek ve geri alınamayacak. Oyunculara M-Coin ödülleri yatırılacak. Onaylıyor musun?`)) {
          const updates = {};
          
          updates[`tournaments/${scoreForm.tId}/fixture/${scoreForm.matchId}/played`] = true;
          updates[`tournaments/${scoreForm.tId}/fixture/${scoreForm.matchId}/s1`] = s1;
          updates[`tournaments/${scoreForm.tId}/fixture/${scoreForm.matchId}/s2`] = s2;
          
          const st = t.standings || {};
          const p1St = { ...(st[m.p1] || { p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }) }; 
          const p2St = { ...(st[m.p2] || { p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }) };
          
          p1St.p += 1; p1St.gf += s1; p1St.ga += s2; p1St.gd = p1St.gf - p1St.ga;
          p2St.p += 1; p2St.gf += s2; p2St.ga += s1; p2St.gd = p2St.gf - p2St.ga;
          
          let p1Coin = 0; let p2Coin = 0;
          
          if (s1 > s2) {
              p1St.w += 1; p1St.pts += 3; 
              p2St.l += 1;
              p1Coin = 3; 
          } else if (s1 < s2) {
              p2St.w += 1; p2St.pts += 3; 
              p1St.l += 1;
              p2Coin = 3; 
          } else {
              p1St.d += 1; p2St.d += 1; 
              p1St.pts += 1; p2St.pts += 1;
              p1Coin = 1; p2Coin = 1; 
          }
          
          updates[`tournaments/${scoreForm.tId}/standings/${m.p1}`] = p1St;
          updates[`tournaments/${scoreForm.tId}/standings/${m.p2}`] = p2St;
          
          if(p1Coin > 0) {
              updates[`wallet/${m.p1}`] = (Number(appData?.wallet?.[m.p1]) || 0) + p1Coin;
              updates[`transactions/${m.p1}/txn_tw_${Date.now()}_1`] = { desc: `Lig Maçı (${p2Name})`, amt: p1Coin, date: new Date().toLocaleString('tr-TR') };
          }
          if(p2Coin > 0) {
              updates[`wallet/${m.p2}`] = (Number(appData?.wallet?.[m.p2]) || 0) + p2Coin;
              updates[`transactions/${m.p2}/txn_tw_${Date.now()}_2`] = { desc: `Lig Maçı (${p1Name})`, amt: p2Coin, date: new Date().toLocaleString('tr-TR') };
          }
          
          db.ref('mavikent_premium').update(updates);
          toast("✅ Skor başarıyla kaydedildi, puan tablosu güncellendi ve M-Coinler yatırıldı!");
          setScoreForm({ tId: '', matchId: '', s1: '', s2: '' });
      }
  };

  const getShard = (devId) => Number(appData?.shards?.[safeName]?.[devId] || 0);
  const getJoker = (devId) => Number(appData?.joker_tickets?.[safeName]?.[devId] || 0);

  const handleBookGameSlot = (slot, currentBookedStr, capacity) => {
      if (appData?.game_room_bans?.[safeName] && appData.game_room_bans[safeName].expiry > Date.now()) return toast("⛔ Oyun odasından banlısınız!");
      
      const bookedArray = currentBookedStr ? String(currentBookedStr).split(', ') : [];
      if (bookedArray.includes(safeName)) return toast("Bu seansa zaten kayıtlısınız!");
      if (bookedArray.length >= capacity) return toast("❌ Bu seans tamamen dolu!");

      const slotPrice = parseInt(slot.price) || 0;
      const universalJokers = Number(appData?.inventory?.[safeName]?.joker_ticket || 0);
      const myJokersForDevice = getJoker(gameDevice);

      let useUniversalJoker = false;
      let useDeviceJoker = false;

      if (universalJokers > 0) {
          if (window.confirm(`🎫 1 Adet ALTIN BİLETİN (Joker) var! Bu seansı (${slotPrice} M) bedavaya almak için Altın Biletini kullanmak ister misin?`)) {
              useUniversalJoker = true;
          }
      } else if (myJokersForDevice > 0) {
          if (window.confirm(`🎟️ 1 Adet BEDAVA ${gameDevice.toUpperCase()} BİLETİN var! Bu seansı (${slotPrice} M) bedavaya almak için biletini kullanmak ister misin?`)) {
              useDeviceJoker = true;
          }
      }

      if (!useUniversalJoker && !useDeviceJoker && mCoin < slotPrice) return toast(`❌ Bakiyeniz yetersiz! (${slotPrice} M-Coin gerekli)`);

      if (useUniversalJoker || useDeviceJoker || window.confirm(`${gameDay} ${slot.time} seansını ${slotPrice} M-Coin karşılığında rezerve etmek istiyor musun?`)) {
          const updates = {};
          if (useUniversalJoker) {
              updates[`inventory/${safeName}/joker_ticket`] = universalJokers - 1;
              updates[`transactions/${safeName}/txn_game_${Date.now()}`] = { 
                  desc: `🎫 Altın Bilet Kullanımı (${gameDevice.toUpperCase()} - ${gameDay} ${slot.time})`, 
                  amt: 0, date: new Date().toLocaleString('tr-TR') 
              };
          } else if (useDeviceJoker) {
              updates[`joker_tickets/${safeName}/${gameDevice}`] = myJokersForDevice - 1;
              updates[`transactions/${safeName}/txn_game_${Date.now()}`] = { 
                  desc: `🎟️ Ücretsiz Rezervasyon (${gameDevice.toUpperCase()} - ${gameDay} ${slot.time})`, 
                  amt: 0, date: new Date().toLocaleString('tr-TR') 
              };
          } else {
              updates[`wallet/${safeName}`] = mCoin - slotPrice;
              updates[`transactions/${safeName}/txn_game_${Date.now()}`] = { 
                  desc: `Oyun Rezervasyonu (${gameDevice.toUpperCase()} - ${gameDay} ${slot.time})`, 
                  amt: -slotPrice, date: new Date().toLocaleString('tr-TR') 
              };
          }
          
          const newBooking = bookedArray.length > 0 ? `${currentBookedStr}, ${safeName}` : safeName;
          updates[`game_room_appointments/${gameDevice}/${gameDay}/${slot.id}`] = newBooking;
          
          db.ref('mavikent_premium').update(updates)
            .then(() => { playBooking(); burst(); toast(useUniversalJoker || useDeviceJoker ? "🎟️ Bilet kullanıldı! Bedava seansın hayırlı olsun." : "🚀 Rezervasyon yapıldı ve M-Coin düştü! İyi eğlenceler."); })
            .catch(() => toast("❌ Bir hata oluştu, internetini kontrol et."));
      }
  };

  const handleJoinTournament = (tId, t) => {
      if (mCoin < t.fee) return toast(`❌ Bakiye yetersiz! Giriş ücreti ${t.fee} M-Coin.`);
      if ((t.participants || []).includes(safeName)) return toast("✅ Zaten bu turnuvaya katıldın!");
      if (t.status !== 'open') return toast("❌ Bu turnuva artık katılıma kapalı!");

      if (window.confirm(`${t.name} turnuvasına ${t.fee} M karşılığında katılmak istiyor musun?`)) {
          const updates = {};
          updates[`wallet/${safeName}`] = mCoin - t.fee;
          updates[`transactions/${safeName}/txn_tourney_${Date.now()}`] = { desc: `Turnuva Katılım: ${t.name}`, amt: -t.fee, date: new Date().toLocaleString('tr-TR') };
          
          const newParts = [...(t.participants || []), safeName];
          updates[`tournaments/${tId}/participants`] = newParts;
          
          db.ref('mavikent_premium').update(updates);
          toast("🏆 Turnuvaya başarıyla katıldın! Fikstür açıklanınca saatler kilitlenecektir.");
      }
  };

  const firstName = safeName || 'Öğrenci';
  const xpDetail = getDetailedLevelInfo(appData?.xp?.[safeName]);
  const mCoin = Number(appData?.wallet?.[safeName] || 0);
  const isCritical = mCoin < 50;
  const myRp = Number(appData?.season_score?.[safeName] || 0);
  const myBadge = getRankBadge(myRp);
  const isEliteStud = appData?.student_tiers?.[safeName] === 'elite';
  const myCosmetics = appData?.active_cards?.[safeName] || {};
  const myTickets = Number(appData?.tickets?.[safeName] || 0);
  const myPinnedBadges = appData?.pinned_badges?.[safeName] || [];
  
  const sortedTxns = Object.keys(appData?.transactions?.[safeName] || {})
      .map(k => ({ id: k, ...appData.transactions[safeName][k] }))
      .sort((a,b) => b.id.localeCompare(a.id));
  
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

  const quizResults = appData?.quiz_results || {};
  const akademiSorted = roster.map(n => {
    const studentResults = quizResults[n] || {};
    let totalScore = 0, totalQuestions = 0, totalCoins = 0, setCount = 0;
    Object.values(studentResults).forEach(r => {
      if (r?.disqualified) return;
      if (typeof r?.score === 'number' && typeof r?.total === 'number' && r.total > 0) {
        totalScore += r.score;
        totalQuestions += r.total;
        totalCoins += Number(r.earned_coins || 0);
        setCount++;
      }
    });
    const avgPct = setCount > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    return { n: String(n), avgPct, totalCoins, setCount };
  }).filter(s => s.setCount > 0).sort((a, b) => b.avgPct - a.avgPct || b.totalCoins - a.totalCoins);

  const myAkademiRank = akademiSorted.findIndex(s => s.n === safeName) + 1 || '-';

  // --- ZIRHLANMIŞ HESAPLAMALAR ---
  let totalExpected = 0;
  let totalControlled = 0;
  const allBookingsForController = [];

  if (isController) {
      Object.values(appData?.game_room_reports || {}).forEach(rep => {
          if (rep.controller === safeName) totalControlled++;
      });

      Object.keys(appData?.game_room_appointments || {}).forEach(device => {
          const deviceData = appData.game_room_appointments[device];
          if(typeof deviceData !== 'object' || deviceData === null) return;

          Object.keys(deviceData).forEach(day => {
              const dayIdx = DAYS.indexOf(day);
              const dayData = deviceData[day];
              if(typeof dayData !== 'object' || dayData === null) return;

              Object.keys(dayData).forEach(slotId => {
                  const sName = dayData[slotId];
                  if (sName && typeof sName === 'string' && !sName.includes("TURNUVA")) {
                      const slotList = GAME_SLOTS[device] || [];
                      const slotInfo = slotList.find(s => s.id === slotId);
                      
                      if (day === todayStrTR) {
                          const devInfo = GAME_DEVICES.find(d => d.id === device);
                          allBookingsForController.push({ 
                              student: sName, device, day, slotId, 
                              time: slotInfo?.time || 'Bilinmiyor', 
                              devName: devInfo?.name || device 
                          });
                      }

                      if (slotInfo && slotInfo.time) {
                          let isPast = false;
                          if (dayIdx < currentDayIndex) {
                              isPast = true;
                          } else if (dayIdx === currentDayIndex) {
                              const timeParts = slotInfo.time.split('-');
                              if (timeParts && timeParts.length > 0 && timeParts[0]) {
                                  const timeSplit = timeParts[0].trim().split(':');
                                  if(timeSplit && timeSplit.length === 2) {
                                      const sH = Number(timeSplit[0]);
                                      const sM = Number(timeSplit[1]);
                                      if (currentHour > sH || (currentHour === sH && currentMin >= sM)) {
                                          isPast = true;
                                      }
                                  }
                              }
                          }
                          if (isPast) totalExpected++;
                      }
                  }
              });
          });
      });
      totalExpected = Math.max(totalExpected, totalControlled); 
  }
  
  const controlPercentage = totalExpected === 0 ? 100 : Math.round((totalControlled / totalExpected) * 100);

  const myGameAppointments = [];
  Object.keys(appData?.game_room_appointments || {}).forEach(device => {
      const dData = appData.game_room_appointments[device];
      if(typeof dData !== 'object' || dData === null) return;
      Object.keys(dData).forEach(day => {
          const dyData = dData[day];
          if(typeof dyData !== 'object' || dyData === null) return;
          Object.keys(dyData).forEach(slotId => {
              if (dyData[slotId] === safeName) {
                  const devInfo = GAME_DEVICES.find(d => d.id === device);
                  const slotList = GAME_SLOTS[device] || [];
                  const slotInfo = slotList.find(s => s.id === slotId);
                  myGameAppointments.push({
                      day, device: devInfo?.name || device, icon: devInfo?.icon || '🎮', time: slotInfo?.time || 'Bilinmiyor'
                  });
              }
          });
      });
  });

  const togglePin = (bId) => { let pinned = [...myPinnedBadges]; if (pinned.includes(bId)) { pinned = pinned.filter(id => id !== bId); } else { if (pinned.length >= 3) return toast("En fazla 3 rozet sabitleyebilirsin!"); pinned.push(bId); } db.ref(`mavikent_premium/pinned_badges/${safeName}`).set(pinned); };
  
  const handleBuy = (item) => {
     if (item.stock !== undefined && item.stock <= 0) return toast("❌ Maalesef bu ürün tükendi!");
     setPurchaseModal({ active: true, item: item, target: 'self', receiver: '' });
  };

  const confirmPurchaseProcess = () => {
      let pData = purchaseModal.item;
      if (!pData) return;
      const myInflation = Number(appData?.personal_inflation?.[safeName]?.[pData.key] || 0);
      let baseP = Number(pData.p || 0) + (myInflation * 5); 
      let finalPrice = Math.ceil(baseP * (1 - currentActiveDiscountPercent / 100));

      if (mCoin < finalPrice) return toast("❌ Bakiyen yetersiz!");
      if (purchaseModal.target === 'friend' && !purchaseModal.receiver) return toast("Lütfen hediye göndereceğin arkadaşını seç!");

      const receiver = purchaseModal.target === 'friend' ? purchaseModal.receiver : safeName;
      const updates = {};
      
      updates[`wallet/${safeName}`] = mCoin - finalPrice;
      updates[`personal_inflation/${safeName}/${pData.key}`] = myInflation + 1; 
      
      let txnDesc = `Market: ${pData.n}`;
      if (purchaseModal.target === 'friend') txnDesc += ` -> ${receiver} (Hediye)`;
      updates[`transactions/${safeName}/txn_buy_${Date.now()}`] = { desc: txnDesc, amt: -finalPrice, date: new Date().toLocaleString('tr-TR') };

      if (pData.type === 'ticket') {
          updates[`tickets/${receiver}`] = (Number(appData?.tickets?.[receiver]) || 0) + 1;
          if(purchaseModal.target === 'friend') { db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🎁 ${safeName}, ${receiver} adlı arkadaşına Çekiliş Bileti hediye etti! Ne kral adam.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) }); }
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
          if(purchaseModal.target === 'friend') { db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🎁 ${safeName}, ${receiver} adlı arkadaşına ${pData.n} hediye etti! Helal olsun.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) }); }
      }

      if (isPersonalDiscountActive && currentActiveDiscountPercent === Number(myDiscountObj.value)) updates[`active_discounts/${safeName}`] = null;
      playCoin(); burst(); db.ref('mavikent_premium').update(updates); toast("✅ İşlem başarılı!"); setPurchaseModal({ active: false, item: null, target: 'self', receiver: '' });
  };

  const handleJoinGroupBuy = (gbKey, gb) => {
      if (mCoin < gb.pp) return toast(`Bu imeceye katılmak için ${gb.pp} M-Coin gerekli.`);
      if ((gb.participants || []).includes(safeName)) return toast("Zaten bu imeceye ortaksın!");
      
      if (window.confirm(`${gb.n} imecesine ${gb.pp} M vererek ortak olmak istiyor musun?`)) {
          playCoin(); burst();
          const updates = {};
          updates[`wallet/${safeName}`] = mCoin - gb.pp;
          updates[`transactions/${safeName}/txn_imece_${Date.now()}`] = { desc: `İmece Katılım: ${gb.n}`, amt: -gb.pp, date: new Date().toLocaleString('tr-TR') };
          
          const newParts = [...(gb.participants || []), safeName];
          if (newParts.length >= gb.mp) {
              updates[`group_buys/${gbKey}/participants`] = newParts;
              updates[`group_buys/${gbKey}/active`] = false;
              db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🚀 ${gb.n} imecesi başarıyla tamamlandı!`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
              toast("🎉 İmece tamamlandı! Gerekli kişi sayısına ulaşıldı.");
          } else {
              updates[`group_buys/${gbKey}/participants`] = newParts;
              toast("🤝 İmeceye başarıyla katıldın!");
          }
          db.ref('mavikent_premium').update(updates);
      }
  };

  const handlePlaceBid = () => {
      const auc = appData?.auction;
      if (!auc || !auc.active) return toast("Şu an aktif bir ihale bulunmuyor!");
      const bidInput = document.getElementById('bidInput'); const bidAmt = parseInt(bidInput.value);
      if (isNaN(bidAmt) || bidAmt <= auc.currentBid) return toast(`Teklifiniz en yüksek tekliften (${auc.currentBid} M) daha büyük olmalı!`);
      if (mCoin < bidAmt) return toast("Bakiyeniz bu teklif için yetersiz!");
      
      if (window.confirm(`İhaleye ${bidAmt} M ile girmek istiyor musunuz? M-Coin cüzdanınızdan kesilecektir.`)) {
          const updates = {};
          if (auc.highestBidder) {
              updates[`wallet/${auc.highestBidder}`] = (Number(appData?.wallet?.[auc.highestBidder]) || 0) + auc.currentBid;
              updates[`transactions/${auc.highestBidder}/txn_auc_refund_${Date.now()}`] = { desc: `İhale İadesi (${auc.item})`, amt: auc.currentBid, date: new Date().toLocaleString('tr-TR') };
          }
          updates[`wallet/${safeName}`] = mCoin - bidAmt;
          updates[`transactions/${safeName}/txn_auc_bid_${Date.now()}`] = { desc: `İhale Teklifi (${auc.item})`, amt: -bidAmt, date: new Date().toLocaleString('tr-TR') };
          updates[`auction/currentBid`] = bidAmt; updates[`auction/highestBidder`] = safeName;
          db.ref('mavikent_premium').update(updates); toast("🔨 Teklifiniz başarıyla alındı! İhalenin yeni lideri sizsiniz.");
          bidInput.value = '';
      }
  };

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

  const openLootBox = (boxType, count = 1) => {
      let basePrice = boxType === 'standart' ? 7 : boxType === 'mega' ? 10 : 15;
      let totalCost = count === 10 ? Math.ceil((basePrice * 10) * 0.9) : basePrice * count;

      if (mCoin < totalCost) return toast(`❌ Bu işlem için ${totalCost} M-Coin gerekli!`);

      if (window.confirm(`${totalCost} M-Coin harcayarak ${count} adet ${boxType.toUpperCase()} kutu açmak istiyor musun?`)) {
          setBoxAnim({ active: true, type: boxType, step: 1, result: null, count });
          
          setTimeout(() => {
              let totalMcoinWon = 0;
              let shardsWon = { ps4: 0, pc: 0, ps5: 0, vr: 0 };
              let sessionsWon = []; 
              let sessionRolled = false;

              let jokersWon = [];
              const updates = {};

              for (let i = 0; i < count; i++) {
                  let rng = Math.floor(Math.random() * 100) + 1;
                  
                  if (count === 10 && i === 9 && !sessionRolled) {
                      rng = 99; 
                  }

                  if (boxType === 'standart') {
                      if (rng <= 60) {
                          let dev = Math.random() < 0.5 ? 'ps4' : 'pc';
                          shardsWon[dev] += Math.floor(Math.random() * 2) + 1;
                      } else if (rng <= 80) totalMcoinWon += 3;
                      else if (rng <= 95) totalMcoinWon += 7;
                      else { jokersWon.push('ps4'); sessionRolled = true; }
                  } else if (boxType === 'mega') {
                      if (rng <= 60) {
                          let dev = Math.random() < 0.5 ? 'pc' : 'ps5';
                          shardsWon[dev] += Math.floor(Math.random() * 2) + 2;
                      } else if (rng <= 80) totalMcoinWon += 5;
                      else if (rng <= 95) totalMcoinWon += 12;
                      else { jokersWon.push(Math.random() < 0.5 ? 'ps5' : 'pc'); sessionRolled = true; }
                  } else if (boxType === 'elit') {
                      if (rng <= 60) {
                          let dev = Math.random() < 0.5 ? 'ps5' : 'vr';
                          shardsWon[dev] += Math.floor(Math.random() * 2) + 2;
                      } else if (rng <= 80) totalMcoinWon += 7;
                      else if (rng <= 95) totalMcoinWon += 18;
                      else { jokersWon.push('vr'); sessionRolled = true; }
                  }
              }

              jokersWon.forEach(dev => {
                  updates[`joker_tickets/${safeName}/${dev}`] = getJoker(dev) + 1;
              });

              updates[`wallet/${safeName}`] = mCoin - totalCost + totalMcoinWon;
              Object.keys(shardsWon).forEach(dev => {
                  if (shardsWon[dev] > 0) updates[`shards/${safeName}/${dev}`] = getShard(dev) + shardsWon[dev];
              });

              let finalDesc = "";
              let finalIcon = count === 10 ? '🎊' : '🎁';

              if (count === 1) {
                  if (jokersWon.length > 0) { finalDesc = `🔥 İNANILMAZ! Bedava ${jokersWon[0].toUpperCase()} Seans Bileti Kaptın!`; finalIcon = '🎫'; }
                  else if (totalMcoinWon > 0) { finalDesc = `+${totalMcoinWon} M-Coin Kazandın!`; finalIcon = '💰'; }
                  else {
                      let sText = [];
                      Object.keys(shardsWon).forEach(d => { if(shardsWon[d]>0) sText.push(`+${shardsWon[d]} ${d.toUpperCase()}`) });
                      finalDesc = sText.join(', ') + " Parçası!"; finalIcon = '🧩';
                  }
              } else {
                  let sText = [];
                  Object.keys(shardsWon).forEach(d => { if(shardsWon[d]>0) sText.push(`${shardsWon[d]} ${d.toUpperCase()}`) });
                  finalDesc = `📦 10'LU KUTU ÖZETİ:\n\n${sText.length > 0 ? sText.join(' | ') + ' Parçası\n' : ''}${totalMcoinWon > 0 ? `💰 +${totalMcoinWon} M-Coin\n` : ''}${jokersWon.length > 0 ? `🎫 KAZANILAN BİLETLER: ${jokersWon.map(d=>d.toUpperCase()).join(', ')}\n` : ''}`;
              }

              updates[`transactions/${safeName}/txn_box_${Date.now()}`] = { desc: `${count}x Kutu (${boxType.toUpperCase()}) Açılımı`, amt: -totalCost + totalMcoinWon, date: new Date().toLocaleString('tr-TR') };
              
              db.ref('mavikent_premium').update(updates);
              setBoxAnim({ active: true, type: boxType, step: 2, result: { desc: finalDesc, icon: finalIcon }, count });
          }, 1500);
      }
  };

  const redeemShards = (devId, devName, icon) => {
      const currentShards = getShard(devId);
      if (currentShards < 20) return toast(`Henüz yeterli parçan yok! Kutu açarak 20 ${devName} parçasına ulaşmalısın.`);
      if (window.confirm(`20 ${devName} Parçasını birleştirip 1 Adet BEDAVA ${devName} SEANSI bileti almak istiyor musun?`)) {
          const updates = {};
          updates[`shards/${safeName}/${devId}`] = currentShards - 20;
          updates[`joker_tickets/${safeName}/${devId}`] = getJoker(devId) + 1;
          db.ref('mavikent_premium').update(updates); 
          toast(`🎉 Tebrikler! 20 Parça birleşti ve 1 Adet ${devName} Biletin hesabına eklendi! Oyun odası sekmesinden kullanabilirsin.`);
      }
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
              if (today.getDay() !== 0) return toast("❌ Haftalık Seri Kartı SADECE PAZAR GÜNLERİ aktif edilebilir!");
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

  const leaveClan = () => {
    if (!myClanId) return;
    if (window.confirm('Klandan ayrılmak istediğine emin misin? Savaş puanların silinecek.')) {
      const updates = {};
      const clanMembers = appData.clans[myClanId].members || [];
      const newMembers = clanMembers.filter(m => m !== safeName);
      
      if (newMembers.length === 0) {
        updates[`clans/${myClanId}`] = null;
      } else {
        updates[`clans/${myClanId}/members`] = newMembers;
        if (appData.clans[myClanId].leader === safeName) {
          updates[`clans/${myClanId}/leader`] = newMembers[0];
        }
      }
      updates[`clan_war_participants/${safeName}`] = null;
      db.ref('mavikent_premium').update(updates);
    }
  };

  const acceptInvite = (clanId) => {
    if (myClanId) return toast('Zaten bir klandasın! Önce mevcut klandan ayrılmalısın.');
    const clanToJoin = appData.clans[clanId];
    if (!clanToJoin) return toast('Klan bulunamadı.');
    if ((clanToJoin.members || []).length >= 3) return toast('Bu klan tamamen dolu (3/3).');
    
    const updates = {};
    updates[`clans/${clanId}/members`] = [...(clanToJoin.members || []), safeName];
    updates[`clan_invites/${safeName}`] = null;
    db.ref('mavikent_premium').update(updates);
    toast(`${clanToJoin.name} klanına katıldın!`);
  };

  const rejectInvite = (clanId) => {
    db.ref(`mavikent_premium/clan_invites/${safeName}/${clanId}`).remove();
  };

  const joinWar = () => {
    if (!myClanId) return toast('Savaşa katılmak için bir klanda olmalısın!');
    if ((myClan?.members || []).length < 3) return toast('Klan savaşına katılmak için klanın tam kapasite (3 kişi) olmalıdır!');
    if (mCoin < 10) return toast('Savaşa giriş ücreti için 10 M-Coin gerekiyor.');
    
    if (window.confirm('Klan savaşına 10 M-Coin karşılığında katılmak istiyor musun? Bu andan itibaren kazanacağın tüm RP puanları klan savaş hanesine de yazılacak!')) {
      const updates = {};
      updates[`wallet/${safeName}`] = mCoin - 10;
      updates[`transactions/${safeName}/txn_war_${Date.now()}`] = { desc: `Klan Savaşı Giriş Ücreti`, amt: -10, date: new Date().toLocaleString('tr-TR') };
      updates[`clan_war_participants/${safeName}`] = true;
      db.ref('mavikent_premium').update(updates);
      toast('Savaşa katıldın! Artık kastığın her RP klanı şampiyonluğa taşıyacak.');
    }
  };

  const handleInviteUser = () => {
    if (!inviteUser.trim()) return;
    if ((myClan?.members || []).length >= 3) return toast('Klanın tamamen dolu (3/3)!');
    if (!roster.includes(inviteUser.trim())) return toast('Böyle bir öğrenci bulunamadı.');
    if ((myClan?.members || []).includes(inviteUser.trim())) return toast('Bu oyuncu zaten klanınızda.');
    
    db.ref(`mavikent_premium/clan_invites/${inviteUser.trim()}/${myClanId}`).set({
      clanName: myClan.name,
      icon: myClan.icon
    });
    toast(`${inviteUser} oyuncusuna davet gönderildi!`);
    setInviteUser('');
  };


  const isHygieneInspector = Object.keys(appData?.hygiene_inspectors?.[safeName] || {}).length > 0;

  const getCoinImpact = (score) => {
      if (score === 5) return 30;
      if (score === 4) return 20;
      if (score === 3) return 10;
      if (score === 2) return -30;
      return -60;
  };

  const saveStuFloorInspection = async (section, floorKey, areaId) => {
      const area = appData?.hygiene_floors?.[section]?.[floorKey]?.areas?.[areaId];
      if (!area) return toast('Alan bulunamadı!');
      const responsibles = area.responsibles || [];
      if (responsibles.length === 0) return toast('Bu alanda sorumlu öğrenci yok!');
      const todayMidnight = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
      const alreadyDone = Object.values(appData?.hygiene_logs || {}).some(
          l => l.areaName === area.name && l.section === section && l.floor === floorKey && l.timestamp >= todayMidnight
      );
      if (alreadyDone) return toast(`⚠️ ${area.name} bugün zaten denetlendi.`);
      setIsHygSaving(true);
      const coinImpact = getCoinImpact(stuHygScore);
      const updates = {};
      const logId = `floor_${Date.now()}`;
      const sectionLabel = section === 'rutin' ? 'Rutin' : 'Temizlik';
      updates[`hygiene_logs/${logId}`] = {
          areaName: area.name, score: stuHygScore,
          responsibles, timestamp: Date.now(), inspector: safeName,
          coinImpact, type: area.type, floor: floorKey, section,
      };
      responsibles.forEach(name => {
          updates[`wallet/${name}`] = (Number(appData?.wallet?.[name]) || 0) + coinImpact;
          updates[`transactions/${name}/txn_${logId}`] = {
              desc: `${area.name} ${sectionLabel} Denetimi (${safeName})`, amt: coinImpact,
              date: new Date().toLocaleString('tr-TR'),
          };
      });
      try {
          await db.ref('mavikent_premium').update(updates);
          toast(`✅ ${area.name} denetimi kaydedildi!`);
          setStuHygScore(5);
      } catch(e) { toast('Hata!'); } finally { setIsHygSaving(false); }
  };

  let myResponsibilities = [];
  if (appData?.hygiene_assignments?.[safeName]) myResponsibilities.push(`🧹 ${appData.hygiene_assignments[safeName]}`);
  Object.entries(appData?.room_areas || {}).forEach(([k, v]) => {
      if ((v.responsibles || []).includes(safeName)) myResponsibilities.push(`🛏️ ${v.name}`);
  });
  Object.entries(appData?.hygiene_areas || {}).forEach(([k, v]) => {
      if ((v.responsibles || []).includes(safeName)) myResponsibilities.push(`🚽 ${v.name}`);
  });

  const getNavStyle = (tab) => ({ flex: 1, border: 'none', background: activeTab === tab ? '#ffffff' : 'transparent', color: activeTab === tab ? '#0f172a' : '#64748b', fontWeight: activeTab === tab ? 900 : 700, cursor: 'pointer', padding: '14px 0', borderRadius: '50px', fontSize: '11px', outline: 'none', boxShadow: activeTab === tab ? '0 10px 20px -5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.3s', whiteSpace: 'nowrap' });

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px', paddingBottom: '140px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }}>
      
      {unreadNotifications.length > 0 && (
        <div className="popIn-anim" style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 999999, width: '90%', maxWidth: '400px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', border: '1px solid #334155' }}>
          {unreadNotifications.slice(0, 1).map(([id, notif]) => (
            <div key={id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{notif.title.includes('Ceza') || notif.title.includes('İhlal') ? '🚨' : '🎁'}</span>
                <span style={{ fontWeight: 900, color: notif.title.includes('Ceza') || notif.title.includes('İhlal') ? '#ef4444' : '#10b981', fontSize: '16px', letterSpacing: '0.5px' }}>{notif.title}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '15px', lineHeight: '1.4' }}>{notif.message}</div>
              <button onClick={() => db.ref(`mavikent_premium/notifications/${safeName}/${id}/isRead`).set(true)} className="profile-btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px', fontSize: '13px', fontWeight: 800 }}>Okudum, Gizle</button>
            </div>
          ))}
        </div>
      )}

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
      
      {/* 🔔 YENİ: BİLDİRİM (POP-UP) SİSTEMİ */}
      {unreadNotifications.length > 0 && (
        <div className="popIn-anim" style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 999999, width: '90%', maxWidth: '400px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', border: '1px solid #334155' }}>
          {unreadNotifications.slice(0, 1).map(([id, notif]) => (
            <div key={id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{notif.title.includes('Ceza') || notif.title.includes('İhlal') ? '🚨' : '🎁'}</span>
                <span style={{ fontWeight: 900, color: notif.title.includes('Ceza') || notif.title.includes('İhlal') ? '#ef4444' : '#10b981', fontSize: '16px', letterSpacing: '0.5px' }}>{notif.title}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '15px', lineHeight: '1.4' }}>{notif.message}</div>
              <button onClick={() => db.ref(`mavikent_premium/notifications/${safeName}/${id}/isRead`).set(true)} className="profile-btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px', fontSize: '13px', fontWeight: 800 }}>Okudum, Gizle</button>
            </div>
          ))}
        </div>
      )}

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

      {/* --- TÜM MODALLAR --- */}

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

      {showTxnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards', overflow: 'hidden' }}>
             <div style={{ padding: '30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>📜 Puan ve Hesap Geçmişi</h2></div>
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
             <button onClick={() => { toast("Mesajınız iletildi."); setShowMessageModal(false); setMessageText(''); }} className="profile-btn" style={{ width: '100%', background: '#0f172a', color: 'white', padding: '16px', fontSize: '16px' }}>MESAJI GÖNDER</button>
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

      {boxAnim.active && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(15px)' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
                {boxAnim.step === 1 ? (
                    <div className="fade-in">
                       <div className="shake-anim" style={{ fontSize: '150px', filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.6))' }}>
                           {boxAnim.type === 'standart' ? '📦' : boxAnim.type === 'mega' ? '🧰' : '💎'}
                       </div>
                       <h2 style={{ marginTop: '30px', fontSize: '28px', fontWeight: 900, color: '#e0e7ff', letterSpacing: '1px' }}>KUTU AÇILIYOR...</h2>
                    </div>
                ) : (
                    <div className="popIn-anim" style={{ background: '#ffffff', padding: '50px 30px', borderRadius: '40px', width: '100%', maxWidth: '380px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', color: '#0f172a' }}>
                       <div style={{ fontSize: '14px', color: '#b45309', fontWeight: 900, letterSpacing: '2px', marginBottom: '15px' }}>TEBRİKLER!</div>
                       <div style={{ fontSize: '100px', marginBottom: '20px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>{boxAnim.result?.icon}</div>
                       <h2 style={{ color: '#10b981', fontSize: '18px', margin: '0 0 15px 0', fontWeight: 900, lineHeight: '1.5', whiteSpace: 'pre-line' }}>{boxAnim.result?.desc}</h2>
                       <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '30px' }}>Ödül hesabına tanımlandı.</p>
                       <button onClick={() => setBoxAnim({active:false, type:'', step:0, result:null, count: 1})} className="profile-btn" style={{ background: '#0f172a', color: 'white', width: '100%', padding: '18px', fontSize: '16px' }}>HARİKA!</button>
                    </div>
                )}
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

      {/* --- ANA EKRAN İÇERİĞİ --- */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', paddingTop: '10px' }}>
          {appData?.settings?.corporate_logo_url && (
              <img src={appData.settings.corporate_logo_url} alt="Kurumsal Logo" style={{ maxHeight: '60px', objectFit: 'contain', marginRight: '20px' }} />
          )}
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
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. AD SOYAD VE PROFİL BÖLÜMÜ */}
            <div style={{ background: '#ffffff', borderRadius: '32px', padding: '30px', border: '1px solid #f1f5f9', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                   <div style={avatarStyle}>{(myCosmetics.avatar && myCosmetics.avatar.val) ? myCosmetics.avatar.val : '🎓'}</div>
                   <div>
                     <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px' }}>{safeName}</div>
                     <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ background: myBadge.color, color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 }}>{myBadge.icon} {myBadge.name}</span>
                        <TitleBadge title={getStudentTitle(safeName)} />
                     </div>
                     <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {is2XActive && <span style={{ color: 'white', fontWeight: 900, fontSize: '10px', background: 'linear-gradient(135deg, #f59e0b, #b45309)', padding: '5px 10px', borderRadius: '8px' }}>⚡ 2X XP</span>}
                        {hasStreak && <span style={{ color: 'white', fontWeight: 900, fontSize: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '5px 10px', borderRadius: '8px' }}>🛡️ KORUMA</span>}
                     </div>
                   </div>
                </div>
            </div>

            {/* 2. SORUMLULUK ALANLARI BÖLÜMÜ */}
            {myResponsibilities.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '28px', padding: '20px', border: '1px solid #bae6fd', boxShadow: '0 10px 20px -5px rgba(186,230,253,0.3)', animation: 'popIn 0.5s forwards' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#0369a1', marginBottom: '12px', letterSpacing: '1px' }}>📍 AKTİF SORUMLULUKLARIM</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {myResponsibilities.map((res, i) => (
                            <div key={i} style={{ background: 'white', padding: '10px 18px', borderRadius: '16px', fontSize: '13px', fontWeight: 800, color: '#0369a1', border: '1px solid rgba(3,105,161,0.1)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>{res}</div>
                        ))}
                    </div>
                </div>
            )}

            {isHygieneInspector && (
                <div onClick={() => setActiveTab('hygiene')} style={{ background: 'linear-gradient(135deg,#0ea5e9,#0369a1)', borderRadius: '20px', padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 20px rgba(14,165,233,0.3)' }}>
                    <span style={{ fontSize: '36px' }}>🧹</span>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '16px', color: 'white' }}>Hijyen Denetim Paneli</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>Denetçi olarak atandın — Puan vermek için tıkla</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: '20px' }}>→</div>
                </div>
            )}

            {/* 3. DENETİM SONUÇLARI (3'LÜ PANEL) */}
            {(() => {
                const allMyLogs = Object.values(appData?.hygiene_logs || {})
                    .filter(log => log.student === safeName || log.responsibles?.includes(safeName))
                    .sort((a, b) => b.timestamp - a.timestamp);

                const wcLog = allMyLogs.find(l => l.category === 'wc' || /wc|tuvalet|banyo/i.test(l.areaName));
                const etutLog = allMyLogs.find(l => l.category === 'room' || /etüt|oda|yatak/i.test(l.areaName));
                const temizlikLog = allMyLogs.find(l => l.category === 'general' || /temizlik|görev|mıntıka/i.test(l.areaName));

                const renderControlCard = (title, icon, log) => {
                    const isSuccess = log && log.coinImpact > 0;
                    const isFail = log && log.coinImpact < 0;
                    const isNeutral = log && log.coinImpact === 0;
                    const bg = isSuccess ? '#ecfdf5' : (isFail ? '#fef2f2' : (isNeutral ? '#f8fafc' : '#ffffff'));
                    const border = isSuccess ? '#10b981' : (isFail ? '#ef4444' : (isNeutral ? '#cbd5e1' : '#e2e8f0'));
                    const titleColor = isSuccess ? '#064e3b' : (isFail ? '#7f1d1d' : '#0f172a');
                    const dateStr = log ? (log.date || new Date(log.timestamp).toLocaleDateString('tr-TR')) : '-';

                    return (
                        <div style={{ 
                            background: bg, border: `2px solid ${border}`, borderRadius: '24px', 
                            padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)', flex: 1, minWidth: '140px',
                            animation: 'popIn 0.5s forwards'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
                                    <div style={{ fontWeight: 900, fontSize: '13px', color: titleColor, lineHeight: '1.2' }}>{title}</div>
                                </div>
                                {log && <span style={{ fontSize: '18px' }}>{isSuccess ? '✅' : (isFail ? '⚠️' : '➖')}</span>}
                            </div>
                            {log ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, background: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>📅 {dateStr}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: '#f59e0b', fontSize: '15px' }}>{'★'.repeat(log.score || 0)}{'☆'.repeat(5 - (log.score || 0))}</div>
                                        <div style={{ fontWeight: 900, fontSize: '15px', color: isSuccess ? '#10b981' : (isFail ? '#ef4444' : '#64748b') }}>{log.coinImpact > 0 ? `+${log.coinImpact}` : log.coinImpact} M</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>Kayıt Yok</div>
                            )}
                        </div>
                    );
                };

                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                        {renderControlCard('WC Kontrol', '🚽', wcLog)}
                        {renderControlCard('Etüt Kontrol', '📚', etutLog)}
                        {renderControlCard('Görev Kontrol', '🧹', temizlikLog)}
                    </div>
                );
            })()}

            <div className="grid-mobile-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                <div style={{ background: '#fef3c7', borderRadius: '20px', padding: '20px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#b45309' }}>🏆 RP SIRASI</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#92400e' }}>{myRpRank}.</span></div>
                <div style={{ background: '#ecfdf5', borderRadius: '20px', padding: '20px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>💳 ZENGİNLİK</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b' }}>{myWealthRank}.</span></div>
               <div style={{ background: '#eff6ff', borderRadius: '20px', padding: '20px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#1d4ed8' }}>🏅 KATILIM</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#1e3a8a' }}>{myXpRank}.</span></div>
                <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '20px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: '1 / -1' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b' }}>📉 TOPLAM DEVAMSIZLIK</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>{appData?.absences?.[safeName] || 0} GÜN</span></div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Seviye {xpDetail.level}</span><span style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>Seviye {xpDetail.level + 1}</span></div>
               <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}><div style={{ background: 'linear-gradient(90deg, #3b82f6, #0ea5e9)', width: `${xpDetail.progress}%`, height: '100%', borderRadius: '10px', transition: 'width 0.5s ease-out' }}></div></div>
               <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}><span style={{ color: '#0f172a', fontWeight: 900 }}>{xpDetail.currentXp} XP</span> / {xpDetail.nextLevelXp} XP</div>
            </div>

            {/* Haftalık Özet */}
            <div style={{ borderRadius: '20px', border: '1.5px solid #e2e8f0', overflow: 'hidden', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div
                onClick={() => setSummaryOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', background: summaryOpen ? '#0f172a' : 'white', transition: 'background 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📋</span>
                  <span style={{ fontWeight: 900, fontSize: '14px', color: summaryOpen ? 'white' : '#0f172a' }}>Haftalık Karne</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: summaryOpen ? '#94a3b8' : '#64748b', background: summaryOpen ? 'rgba(255,255,255,0.1)' : '#f1f5f9', padding: '3px 10px', borderRadius: '20px' }}>
                    Bu Hafta
                  </span>
                  <span style={{ fontSize: '14px', color: summaryOpen ? 'white' : '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: summaryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>
              </div>
              {summaryOpen && (
                <div style={{ padding: '16px', borderTop: '1.5px solid #e2e8f0' }}>
                  <WeeklySummaryCard studentName={safeName} appData={appData} compact={true} />
                </div>
              )}
            </div>

            {/* 🍽️ ZAMAN KİLİTLİ 3 ÖĞÜNLÜ YEMEK PUANLAMA BİLEŞENİ BURADA! */}
            <YemekPuanlama ogrenciAdi={safeName} />

            {myGameAppointments.length > 0 && (
                <div style={{ background: '#fffbeb', border: '2px solid #fde047', borderRadius: '24px', padding: '25px' }}>
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

            <div style={{ background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '25px' }}>
               <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>🎯 Aktif Görevler</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['q1', 'q2', 'q3'].map(qId => {
                     const q = quests[qId]; 
                     if (!q || !q.text) return null; 
                     const isPart = (q.participants || []).includes(safeName);
                     return (
                        <div key={qId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isPart ? '#f0fdf4' : '#f8fafc', padding: '16px', borderRadius: '16px', border: `1px solid ${isPart ? '#10b981' : '#e2e8f0'}` }}>
                           <div><div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{q.text}</div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>Ödül: +{q.amt} {q.type}</div></div>
                           {isPart ? <div style={{ color: '#10b981', fontWeight: 900, fontSize: '12px' }}>KATILDIN</div> : <button onClick={() => { db.ref(`mavikent_premium/quests/${qId}/participants`).set([...(q.participants||[]), safeName]); toast("Göreve katıldın!"); }} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '8px 16px', fontSize: '12px' }}>Katıl</button>}
                        </div>
                     )
                  })}
               </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '32px', padding: '30px', color: 'white', boxShadow: '0 15px 30px rgba(49,46,129,0.3)', border: '1px solid #4338ca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: 900, color: '#e0e7ff' }}>🎁 Ganimet Odası</h3>
                        <div style={{ fontSize: '13px', color: '#a5b4fc', fontWeight: 600 }}>10'lu açılımlarda %10 indirim ve 1 GARANTİ SEANS!</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                    {SHARD_TYPES.map(st => {
                        const count = getShard(st.id);
                        const progress = Math.min(100, (count / 20) * 100);
                        const isReady = count >= 20;
                        return (
                            <div key={st.id} onClick={() => isReady && redeemShards(st.id, st.name, st.icon)} style={{ background: st.bg, border: `1px solid ${st.color}`, borderRadius: '16px', padding: '12px', textAlign: 'center', cursor: isReady ? 'pointer' : 'default', opacity: isReady ? 1 : 0.8 }}>
                                <div style={{ fontSize: '24px', marginBottom: '5px' }}>{st.icon}</div>
                                <div style={{ fontSize: '12px', fontWeight: 900, color: st.color }}>{st.name} PARÇASI</div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '5px 0' }}>{count} / 20</div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: st.color, transition: '0.3s' }}></div>
                                </div>
                                {isReady && <div className="badge-glow" style={{ fontSize: '10px', background: st.color, color: 'white', padding: '4px', borderRadius: '6px', marginTop: '8px', fontWeight: 900 }}>BİRLEŞTİR</div>}
                            </div>
                        )
                    })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #334155, #1e293b)', borderRadius: '20px', padding: '20px 10px', textAlign: 'center', border: '2px solid #475569' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>📦</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: 'white', marginBottom: '15px' }}>STANDART KUTU</div>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button onClick={() => openLootBox('standart', 1)} className="profile-btn card-hover" style={{ background: '#0f172a', color: '#94a3b8', padding: '8px', fontSize: '11px', flex: 1 }}>1x<br/>(7 M)</button>
                            <button onClick={() => openLootBox('standart', 10)} className="profile-btn card-hover" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '8px', fontSize: '11px', flex: 1, border: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>10x<br/>(63 M)</button>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #d97706, #92400e)', borderRadius: '20px', padding: '20px 10px', textAlign: 'center', border: '2px solid #f59e0b' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>🧰</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: 'white', marginBottom: '15px' }}>MEGA KUTU</div>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button onClick={() => openLootBox('mega', 1)} className="profile-btn card-hover" style={{ background: '#78350f', color: '#fde68a', padding: '8px', fontSize: '11px', flex: 1 }}>1x<br/>(10 M)</button>
                            <button onClick={() => openLootBox('mega', 10)} className="profile-btn card-hover" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '8px', fontSize: '11px', flex: 1, border: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>10x<br/>(90 M)</button>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderRadius: '20px', padding: '20px 10px', textAlign: 'center', border: '2px solid #38bdf8' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>💎</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: 'white', marginBottom: '15px' }}>ELİT SANDIK</div>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button onClick={() => openLootBox('elit', 1)} className="profile-btn card-hover" style={{ background: '#075985', color: '#bae6fd', padding: '8px', fontSize: '11px', flex: 1 }}>1x<br/>(15 M)</button>
                            <button onClick={() => openLootBox('elit', 10)} className="profile-btn card-hover" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '8px', fontSize: '11px', flex: 1, border: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>10x<br/>(135 M)</button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: '0', fontSize: '18px', fontWeight: 900, color: 'white' }}>💬 Canlı Meydan Özeti</h3>
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
                    </div>
                </div>
                <div style={{ position: 'absolute', top: 50, left: 0, width: '100%', height: '20px', background: 'linear-gradient(to bottom, #0f172a, transparent)', zIndex: 2 }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20px', background: 'linear-gradient(to top, #0f172a, transparent)', zIndex: 2 }}></div>
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
                                {!isMe && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, marginBottom: '4px', marginLeft: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>{msg.s} <TitleBadge title={msgTitle && !isSystem ? msgTitle : null} /></div>}
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
              {isCritical ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔒</div>
                  <div style={{ fontWeight: 900, fontSize: '24px', color: '#dc2626', marginBottom: '8px' }}>Erişim Kısıtlandı</div>
                  <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, marginBottom: '20px' }}>Bakiyen 50 M-Coin altında.</div>
                  <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '16px 28px', border: '1px solid #fca5a5', marginBottom: '24px' }}>
                    <div style={{ fontWeight: 900, color: '#b91c1c', fontSize: '22px' }}>{mCoin} M</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Min. 50 M-Coin gerekli</div>
                  </div>
                  {(() => {
                    const myMission = appData?.kurtarma_gorevleri?.[safeName];
                    const claimMission = async () => {
                      const myM = appData?.kurtarma_gorevleri?.[safeName];
                      if (myM?.status === 'reddedildi' && myM.rejected_at && Date.now() - myM.rejected_at < 12*60*60*1000) { toast('12 saat beklemelisin.'); return; }
                      const starReward = { 1: 80, 2: 60, 3: 40, 4: 20 };
                      const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
                      const failedAreas = Object.values(appData?.hygiene_logs || {})
                        .filter(l => l.timestamp >= todayStart && l.score < 5 && (l.responsibles || []).includes(safeName))
                        .map(l => ({ name: l.areaName, type: l.type || 'genel', score: l.score, reward: starReward[l.score] || 20 }));
                      let missionAreas = failedAreas;
                      let totalReward = missionAreas.reduce((s, a) => s + a.reward, 0);
                      if (missionAreas.length === 0) {
                        const floors = appData?.hygiene_floors || {};
                        const responsible = [];
                        ['rutin','temizlik'].forEach(sec => {
                          ['kat2','kat3','kat4'].forEach(fl => {
                            Object.entries(floors[sec]?.[fl]?.areas || {}).forEach(([,a]) => {
                              if ((a.responsibles || []).includes(safeName)) responsible.push({ name: a.name, type: a.type || 'genel', reward: 40 });
                            });
                          });
                        });
                        missionAreas = responsible.slice(0, 1);
                        totalReward = 40;
                      }
                      if (missionAreas.length === 0) { toast('Henüz sorumlu alanın yok. Yöneticine başvur.'); return; }
                      await db.ref(`mavikent_premium/kurtarma_gorevleri/${safeName}`).set({ status: 'bekliyor', assigned_at: Date.now(), reward_coins: totalReward, areas: missionAreas });
                      toast('Kurtarma görevi alındı! Tamamlayınca onay iste.');
                    };
                    const completeMission = async () => {
                      await db.ref(`mavikent_premium/kurtarma_gorevleri/${safeName}`).update({ status: 'talep_edildi', claimed_at: Date.now() });
                      toast('Onay isteğin gönderildi!');
                    };
                    // Red sonrası 12 saat bekleme
                    if (myMission?.status === 'reddedildi') {
                      const remaining = myMission.rejected_at ? Math.max(0, 12*60*60*1000 - (Date.now() - myMission.rejected_at)) : 0;
                      const hrs = Math.floor(remaining / 3600000);
                      const mins = Math.floor((remaining % 3600000) / 60000);
                      if (remaining > 0) return (
                        <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '20px 24px', border: '1px solid #fca5a5', textAlign: 'center', maxWidth: '280px' }}>
                          <div style={{ fontSize: '28px', marginBottom: '8px' }}>❌</div>
                          <div style={{ fontWeight: 900, fontSize: '14px', color: '#dc2626', marginBottom: '6px' }}>Görev Reddedildi</div>
                          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, marginBottom: '10px' }}>Tekrar almak için bekle</div>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '10px 16px', border: '1px solid #fca5a5' }}>
                            <div style={{ fontWeight: 900, fontSize: '20px', color: '#dc2626' }}>{hrs}s {mins}dk</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>kalan süre</div>
                          </div>
                        </div>
                      );
                    }
                    if (!myMission || myMission.status === 'tamamlandi' || (myMission.status === 'reddedildi' && myMission.rejected_at && Date.now() - myMission.rejected_at >= 12*60*60*1000)) return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Kurtarma görevi ile kilit açabilirsin</div>
                        <button onClick={claimMission} style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '18px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(14,165,233,0.4)' }}>🚀 Kurtarma Görevi Al</button>
                      </div>
                    );
                    if (myMission.status === 'bekliyor') return (
                      <div style={{ background: '#fff7ed', borderRadius: '20px', padding: '20px 24px', border: '1px solid #fed7aa', maxWidth: '300px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#c2410c', marginBottom: '10px' }}>🎯 Aktif Görevin</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                          {(myMission.areas || []).map((a, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '10px', padding: '8px 12px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#c2410c' }}>{a.name}</span>
                              <span style={{ fontSize: '12px', fontWeight: 900, color: '#10b981' }}>+{a.reward || myMission.reward_coins} M</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '13px', color: '#c2410c', fontWeight: 900, marginBottom: '14px', textAlign: 'right' }}>Toplam: +{myMission.reward_coins} M-Coin</div>
                        <button onClick={completeMission} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', width: '100%', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>✅ Tamamladım, Onay İste</button>
                      </div>
                    );
                    if (myMission.status === 'talep_edildi') return (
                      <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '18px 24px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>⏳</div>
                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#059669' }}>Onay Bekleniyor</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Yönetici onayladığında bakiyen yüklenir</div>
                      </div>
                    );
                    return null;
                  })()}
                </div>
              ) : (<>
               {/* 🏆 AKTİF TURNUVALAR EKRANI */}
               {Object.keys(appData?.tournaments || {}).length > 0 && (
                   <div style={{ background: 'white', borderRadius: '32px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
                       <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900, fontSize: '20px' }}>🏆 Aktif Turnuvalar (Lig)</h3>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                           {Object.keys(appData.tournaments).reverse().map(tId => {
                               const t = appData.tournaments[tId];
                               const isJoined = (t.participants || []).includes(safeName);
                               const isLocked = t.status === 'active';
                               const activeTTab = activeTourneyTab[tId] || 'standings';
                               const isExpanded = expandedTourney === tId;
                               
                               const standingsArray = Object.keys(t.standings || {}).map(p => ({ name: p, ...t.standings[p] })).sort((a,b) => {
                                   if((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
                                   if((b.gd || 0) !== (a.gd || 0)) return (b.gd || 0) - (a.gd || 0);
                                   return (b.gf || 0) - (a.gf || 0);
                               });

                               // Fikstürü haftalara göre grupla ve sırala
                               const fixturesByWeek = {};
                               const sortedFixtures = Object.keys(t.fixture || {}).map(k => ({ id: k, ...t.fixture[k] })).sort((a, b) => {
                                   const weekA = parseInt(String(a.week).replace(/\D/g, '')) || 0;
                                   const weekB = parseInt(String(b.week).replace(/\D/g, '')) || 0;
                                   return weekA - weekB;
                               });

                               sortedFixtures.forEach(m => {
                                   const weekNum = parseInt(String(m.week).replace(/\D/g, '')) || 1;
                                   if (!fixturesByWeek[weekNum]) fixturesByWeek[weekNum] = [];
                                   fixturesByWeek[weekNum].push(m);
                               });

                               const availableWeeks = Object.keys(fixturesByWeek).map(Number).sort((a,b) => a - b);
                               const selectedWeek = activeWeekTab[tId] || (availableWeeks.length > 0 ? availableWeeks[0] : 1);

                               return (
                                   <div key={tId} style={{ background: isJoined ? '#f0fdf4' : '#f8fafc', border: `2px solid ${isJoined ? '#10b981' : '#e2e8f0'}`, borderRadius: '24px', overflow: 'hidden', transition: 'all 0.3s' }}>
                                       
                                       {/* TIKLANABİLİR AKORDİYON BAŞLIĞI */}
                                       <div onClick={() => setExpandedTourney(isExpanded ? null : tId)} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                           <div>
                                               <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                   <span style={{ fontSize: '14px', background: 'white', padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>{isExpanded ? '🔽' : '▶️'}</span>
                                                   {t.name} 
                                                   <span style={{fontSize: '12px', background: isLocked ? '#ecfdf5' : '#fffbeb', color: isLocked ? '#10b981' : '#d97706', padding: '4px 8px', borderRadius: '8px', marginLeft: '8px'}}>{isLocked ? 'Lig Başladı ⚔️' : 'Kayıt'}</span>
                                               </div>
                                               <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, marginLeft: '38px' }}>{t.game} • Cihaz: {String(t.device).toUpperCase()} • Katılımcı: {(t.participants || []).length} Kişi</div>
                                           </div>
                                           <div onClick={e => e.stopPropagation()}>
                                               {!isLocked && (
                                                   isJoined ? (
                                                       <div style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '50px', fontWeight: 900, fontSize: '12px' }}>✅ KATILDIN</div>
                                                   ) : (
                                                       <button onClick={() => handleJoinTournament(tId, t)} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '10px 16px', fontSize: '13px' }}>KATIL ({t.fee} M)</button>
                                                   )
                                               )}
                                           </div>
                                       </div>

                                       {/* AÇILAN DETAY PANELİ */}
                                       {isExpanded && isLocked && (
                                           <div className="fade-in" style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #e2e8f0', marginTop: '5px', paddingTop: '20px' }}>
                                               
                                               {/* 3'LÜ ANA SEKMELER */}
                                               <div className="clean-scroll" style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', overflowX: 'auto' }}>
                                                   <button onClick={() => setActiveTourneyTab({...activeTourneyTab, [tId]: 'standings'})} style={{ background: 'transparent', border: 'none', fontWeight: 900, fontSize: '14px', color: activeTTab === 'standings' ? '#0f172a' : '#94a3b8', borderBottom: activeTTab === 'standings' ? '3px solid #0f172a' : 'none', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>📊 Puan Durumu</button>
                                                   <button onClick={() => setActiveTourneyTab({...activeTourneyTab, [tId]: 'fixture'})} style={{ background: 'transparent', border: 'none', fontWeight: 900, fontSize: '14px', color: activeTTab === 'fixture' ? '#0f172a' : '#94a3b8', borderBottom: activeTTab === 'fixture' ? '3px solid #0f172a' : 'none', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>🗓️ Fikstür</button>
                                                   <button onClick={() => setActiveTourneyTab({...activeTourneyTab, [tId]: 'rules'})} style={{ background: 'transparent', border: 'none', fontWeight: 900, fontSize: '14px', color: activeTTab === 'rules' ? '#3b82f6' : '#94a3b8', borderBottom: activeTTab === 'rules' ? '3px solid #3b82f6' : 'none', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>📜 Kurallar & Ödül</button>
                                               </div>

                                               {/* 1. SEKMЕ: PUAN DURUMU (KÜRSÜLÜ VE FORM GRAFİKLİ) */}
                                               {activeTTab === 'standings' && standingsArray.length > 0 && (
                                                   <div className="fade-in">
                                                       {/* 🏆 ŞEREF KÜRSÜSÜ (PODIUM) */}
                                                       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '10px', marginBottom: '30px', padding: '20px 0' }}>
                                                           {standingsArray[1] && (
                                                               <div style={{ textAlign: 'center' }}>
                                                                   <div style={{ fontSize: '30px' }}>🥈</div>
                                                                   <div style={{ width: '80px', background: '#f1f5f9', border: '2px solid #cbd5e1', borderRadius: '15px 15px 0 0', padding: '10px 5px', height: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                                       <div style={{ fontSize: '10px', fontWeight: 900, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis' }}>{standingsArray[1].name}</div>
                                                                   </div>
                                                               </div>
                                                           )}
                                                           <div style={{ textAlign: 'center', transform: 'scale(1.1)', zIndex: 2 }}>
                                                               <div style={{ fontSize: '40px', filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }}>👑</div>
                                                               <div style={{ width: '90px', background: 'linear-gradient(180deg, #fef3c7, #fde68a)', border: '3px solid #f59e0b', borderRadius: '15px 15px 0 0', padding: '15px 5px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 20px rgba(245,158,11,0.2)' }}>
                                                                   <div style={{ fontSize: '11px', fontWeight: 900, color: '#92400e' }}>{standingsArray[0].name}</div>
                                                                   <div style={{ fontSize: '9px', color: '#b45309', fontWeight: 800, marginTop: '4px' }}>LİDER</div>
                                                               </div>
                                                           </div>
                                                           {standingsArray[2] && (
                                                               <div style={{ textAlign: 'center' }}>
                                                                   <div style={{ fontSize: '30px' }}>🥉</div>
                                                                   <div style={{ width: '80px', background: '#fff7ed', border: '2px solid #ffedd5', borderRadius: '15px 15px 0 0', padding: '10px 5px', height: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                                       <div style={{ fontSize: '10px', fontWeight: 900, color: '#9a3412', overflow: 'hidden', textOverflow: 'ellipsis' }}>{standingsArray[2].name}</div>
                                                                   </div>
                                                               </div>
                                                           )}
                                                       </div>

                                                       {/* PUAN TABLOSU */}
                                                       <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto' }} className="clean-scroll">
                                                           <div style={{ minWidth: '650px' }}>
                                                               <div style={{ background: '#0f172a', color: '#94a3b8', padding: '12px 15px', fontSize: '11px', fontWeight: 900, display: 'grid', gridTemplateColumns: '3fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1.5fr', textAlign: 'center', letterSpacing: '0.5px' }}>
                                                                   <div style={{textAlign:'left', color: 'white'}}>TAKIM / OYUNCU</div>
                                                                   <div>O</div><div>G</div><div>B</div><div>M</div><div>AV</div><div>P</div><div style={{color: '#38bdf8'}}>SON 5 MAÇ</div>
                                                               </div>
                                                               
                                                               {standingsArray.map((st, i) => {
                                                                   const last5 = sortedFixtures.filter(m => m.played && (m.p1 === st.name || m.p2 === st.name)).slice(-5).map(m => {
                                                                       const isP1 = m.p1 === st.name;
                                                                       const myS = isP1 ? m.s1 : m.s2;
                                                                       const opS = isP1 ? m.s2 : m.s1;
                                                                       if (myS > opS) return { r: 'G', c: '#10b981' };
                                                                       if (myS < opS) return { r: 'M', c: '#ef4444' };
                                                                       return { r: 'B', c: '#f59e0b' };
                                                                   });

                                                                   let rowBg = 'white'; let rankColor = '#64748b'; let rankBg = '#f1f5f9';
                                                                   if (i === 0) { rowBg = '#fefce8'; rankColor = '#b45309'; rankBg = '#fde68a'; }
                                                                   else if (i === 1) { rowBg = '#f8fafc'; rankColor = '#334155'; rankBg = '#e2e8f0'; }
                                                                   else if (i === 2) { rowBg = '#fff7ed'; rankColor = '#9a3412'; rankBg = '#ffedd5'; }

                                                                   return (
                                                                       <div key={st.name} style={{ padding: '10px 15px', fontSize: '13px', fontWeight: 700, borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '3fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1.5fr', textAlign: 'center', alignItems: 'center', background: rowBg, transition: 'background 0.2s' }}>
                                                                           <div style={{textAlign:'left', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                                               <div style={{ background: rankBg, color: rankColor, width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px' }}>{i+1}</div>
                                                                               <div style={{ fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</div>
                                                                           </div>
                                                                           <div style={{color: '#475569'}}>{st.p || 0}</div>
                                                                           <div style={{color: '#10b981', fontWeight: 800}}>{st.w || 0}</div>
                                                                           <div style={{color: '#f59e0b', fontWeight: 800}}>{st.d || 0}</div>
                                                                           <div style={{color: '#ef4444', fontWeight: 800}}>{st.l || 0}</div>
                                                                           <div style={{fontWeight: 800, color: (st.gd || 0) > 0 ? '#10b981' : ((st.gd || 0) < 0 ? '#ef4444' : '#64748b')}}>{(st.gd || 0) > 0 ? `+${st.gd}` : (st.gd || 0)}</div>
                                                                           <div style={{fontWeight: 900, color: '#0f172a', fontSize: '15px', background: '#e0f2fe', padding: '4px 0', borderRadius: '6px'}}>{st.pts || 0}</div>
                                                                           <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                               {last5.length === 0 ? <span style={{fontSize:'10px', color:'#cbd5e1'}}>Maç yok</span> : last5.map((form, idx) => (
                                                                                   <div key={idx} style={{ width: '18px', height: '18px', borderRadius: '4px', background: form.c, color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{form.r}</div>
                                                                               ))}
                                                                           </div>
                                                                       </div>
                                                                   )
                                                               })}
                                                           </div>
                                                       </div>
                                                   </div>
                                               )}

                                               {/* 2. SEKMЕ: FİKSTÜR (TIKLANABİLİR VE KİLİTLİ HAKEM GİRİŞİ) */}
                                               {activeTTab === 'fixture' && availableWeeks.length > 0 && (
                                                   <div className="fade-in">
                                                       <div className="clean-scroll" style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                                                           {availableWeeks.map(week => (
                                                               <button key={week} onClick={() => setActiveWeekTab({...activeWeekTab, [tId]: week})} style={{ background: selectedWeek === week ? '#3b82f6' : '#f1f5f9', color: selectedWeek === week ? 'white' : '#64748b', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                                   {week}. Hafta
                                                               </button>
                                                           ))}
                                                       </div>

                                                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                                                           {(fixturesByWeek[selectedWeek] || []).map(m => {
                                                               const macTarihi = m.date || m.day; 
                                                               const isPlayable = isMatchPlayable(macTarihi, m.time);
                                                               const isEditingThis = scoreForm.matchId === m.id && scoreForm.tId === tId;
                                                               
                                                               // 🔥 DERBİ KONTROLÜ
                                                               const isDerby = standingsArray.slice(0, 3).some(s => s.name === m.p1) && standingsArray.slice(0, 3).some(s => s.name === m.p2);

                                                               return (
                                                                   <div key={m.id} 
                                                                        onClick={() => { if (isController && !m.played && isPlayable) setScoreForm({ tId: tId, matchId: m.id, s1: '', s2: '' }); }}
                                                                        style={{ background: isDerby && !m.played ? 'linear-gradient(135deg, #fffbeb, #ffffff)' : (m.played ? '#f1f5f9' : 'white'), border: `2px solid ${isDerby && !m.played ? '#f59e0b' : (isEditingThis ? '#3b82f6' : (m.played ? '#cbd5e1' : '#e2e8f0'))}`, borderRadius: '20px', padding: '16px', opacity: m.played ? 0.8 : 1, boxShadow: isDerby && !m.played ? '0 8px 20px rgba(245,158,11,0.2)' : (isEditingThis ? '0 4px 15px rgba(59,130,246,0.2)' : '0 4px 10px rgba(0,0,0,0.02)'), cursor: (isController && !m.played && isPlayable) ? 'pointer' : 'default', transition: 'all 0.2s', position: 'relative' }}>
                                                                       
                                                                       {isDerby && !m.played && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(245,158,11,0.3)' }}>🔥 HAFTANIN DERBİSİ</div>}

                                                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: isDerby && !m.played ? '10px' : '0' }}>
                                                                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 900, background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>Hafta {selectedWeek}</span>
                                                                          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 800 }}>📅 {macTarihi} • 🕒 {m.time}</span>
                                                                       </div>
                                                                       
                                                                       {!isEditingThis ? (
                                                                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>
                                                                               <span style={{ flex: 1, textAlign: 'right' }}>{m.p1}</span>
                                                                               {m.played ? (
                                                                                   <span style={{ background: '#0f172a', color: 'white', padding: '4px 12px', borderRadius: '8px', margin: '0 15px', fontSize: '14px', whiteSpace: 'nowrap' }}>{m.s1} - {m.s2}</span>
                                                                               ) : (
                                                                                   <span style={{ color: !isPlayable ? '#ef4444' : '#cbd5e1', fontSize: '12px', margin: '0 15px', textAlign: 'center' }}>
                                                                                       {!isPlayable ? '⏳ BEKLENİYOR' : 'VS'}
                                                                                   </span>
                                                                               )}
                                                                               <span style={{ flex: 1, textAlign: 'left' }}>{m.p2}</span>
                                                                           </div>
                                                                       ) : (
                                                                           <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #bfdbfe', marginTop: '10px' }}>
                                                                               <div style={{ fontSize: '12px', fontWeight: 900, color: '#3b82f6', marginBottom: '10px', textAlign: 'center' }}>⚽ HAKEM: SKORU GİRİNİZ</div>
                                                                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                                   <div style={{ flex: 1, textAlign: 'right', fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>{m.p1}</div>
                                                                                   <input type="number" value={scoreForm.s1} onChange={e => setScoreForm({...scoreForm, s1: e.target.value})} className="elite-input" style={{ width: '60px', textAlign: 'center', fontSize: '20px', padding: '10px', background: 'white' }} />
                                                                                   <div style={{ fontWeight: 900, color: '#cbd5e1' }}>-</div>
                                                                                   <input type="number" value={scoreForm.s2} onChange={e => setScoreForm({...scoreForm, s2: e.target.value})} className="elite-input" style={{ width: '60px', textAlign: 'center', fontSize: '20px', padding: '10px', background: 'white' }} />
                                                                                   <div style={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>{m.p2}</div>
                                                                               </div>
                                                                               <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                                                   <button onClick={() => setScoreForm({ tId: '', matchId: '', s1: '', s2: '' })} className="profile-btn" style={{ flex: 1, background: '#e2e8f0', color: '#64748b', padding: '12px', fontSize: '13px' }}>İPTAL</button>
                                                                                   <button onClick={submitMatchScore} className="profile-btn badge-glow" style={{ flex: 2, background: '#10b981', color: 'white', padding: '12px', fontSize: '13px' }}>KAYDET</button>
                                                                               </div>
                                                                           </div>
                                                                       )}
                                                                       
                                                                       {isController && !m.played && !isEditingThis && (
                                                                           <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px', fontWeight: 800, color: isPlayable ? '#3b82f6' : '#ef4444' }}>
                                                                               {isPlayable ? '👉 Skoru girmek için maça dokun' : '⏳ Maç saati gelmediği için kilitli'}
                                                                           </div>
                                                                       )}
                                                                   </div>
                                                               )
                                                           })}
                                                       </div>
                                                   </div>
                                               )}

                                               {/* 3. SEKMЕ: KURALLAR VE ÖDÜLLER */}
                                               {activeTTab === 'rules' && (
                                                   <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                       <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '25px', borderRadius: '24px', textAlign: 'center' }}>
                                                           <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎁</div>
                                                           <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 900 }}>1. SEZON BÜYÜK ÖDÜLLERİ</h4>
                                                           <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                                               <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '15px', border: '1px solid #f59e0b' }}>🥇 <b>{t.p1} M-Coin</b> + "1. Sezon Fatihi" Rozeti</div>
                                                               <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '15px', border: '1px solid #cbd5e1' }}>🥈 <b>{t.p2} M-Coin</b></div>
                                                               <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '15px', border: '1px solid #9a3412' }}>🥉 <b>{t.p3} M-Coin</b></div>
                                                           </div>
                                                       </div>

                                                       <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                                           <h4 style={{ color: '#0f172a', fontWeight: 900, marginBottom: '15px' }}>📜 LİG KURALLARI</h4>
                                                           <ul style={{ paddingLeft: '20px', color: '#475569', fontWeight: 700, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                               <li>⚡ Maç saati gelmeden skor girilemez, erkencilik yapmayın!</li>
                                                               <li>🛡️ Maç bitiminde skoru sorumlu öğrenci (hakem) sisteme girer. Hakem maça tıklayarak skoru yazar.</li>
                                                               <li>🔥 "Haftanın Derbisi" maçlarını kaçırmayın, ilk 3 arasındaki rekabeti izleyin.</li>
                                                               <li>🏆 Sezon sonunda 1. olan öğrenci, profiline süresiz "1. Sezon Fatihi" rozetini takar.</li>
                                                               <li>⚠️ Centilmenlik dışı hareket edenler ligden ihraç edilir.</li>
                                                           </ul>
                                                       </div>
                                                   </div>
                                               )}
                                           </div>
                                       )}
                                   </div>
                               )
                           })}
                       </div>
                   </div>
               )}

               {/* 🕵️‍♂️ SORUMLU ÖĞRENCİ DENETİM PANELİ GRAFİĞİ VE GİRİŞİ */}
               {isController && (
                   <div className="fade-in">
                       <div style={{ background: 'white', borderRadius: '32px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
                           <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900, fontSize: '20px' }}>📊 Denetim Kontrol Raporu (Haftalık)</h3>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                               <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                   <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '5px' }}>Gereken Kontrol</div>
                                   <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{totalExpected}</div>
                               </div>
                               <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '16px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                                   <div style={{ fontSize: '12px', fontWeight: 800, color: '#047857', marginBottom: '5px' }}>Yapılan Kontrol</div>
                                   <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669' }}>{totalControlled}</div>
                               </div>
                           </div>
                           
                           <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                               <span>Denetim Başarısı</span>
                               <span style={{ color: controlPercentage >= 80 ? '#10b981' : (controlPercentage >= 50 ? '#f59e0b' : '#ef4444') }}>%{controlPercentage}</span>
                           </div>
                           <div style={{ width: '100%', height: '16px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                               <div style={{ background: controlPercentage >= 80 ? '#10b981' : (controlPercentage >= 50 ? '#f59e0b' : '#ef4444'), width: `${controlPercentage}%`, height: '100%', transition: 'width 0.5s ease-out' }}></div>
                           </div>
                       </div>

                       <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', padding: '20px 25px', borderRadius: '32px', color: 'white', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px rgba(30,58,138,0.3)', flexWrap: 'wrap', gap: '15px' }}>
                           <div>
                               <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>🕵️‍♂️ Sorumlu Denetim Paneli</div>
                               <div style={{ fontSize: '13px', fontWeight: 600, color: '#bfdbfe' }}>Oyun odası kurallarını koruma yetkisi sende. Bugünün randevularını denetle!</div>
                           </div>
                           <button onClick={() => setShowControlPanel(!showControlPanel)} className="profile-btn" style={{ background: showControlPanel ? '#ef4444' : 'white', color: showControlPanel ? 'white' : '#1e3a8a', padding: '12px 20px', fontSize: '14px', border: 'none' }}>
                               {showControlPanel ? 'KAPAT' : 'DENETİM YAP'}
                           </button>
                       </div>
                   </div>
               )}

               {showControlPanel ? (
                   <div className="fade-in" style={{ background: 'white', borderRadius: '32px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                       <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontWeight: 900 }}>📋 Randevu Değerlendirme Formu ({todayStrTR})</h3>
                       
                       <div style={{ marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                           <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e3a8a', marginBottom: '10px' }}>1. AŞAMA: DEĞERLENDİRİLECEK RANDEVUYU SEÇ</div>
                           <select className="elite-input" style={{textAlign: 'left'}} value={evalForm.bookingId} onChange={e => {
                               const val = e.target.value;
                               if(!val) return setEvalForm({...evalForm, bookingId: '', student: ''});
                               const [dev, day, slot, stu, time] = val.split('|');
                               setEvalForm({...evalForm, bookingId: val, device: dev, day, slot, student: stu, time});
                           }}>
                               <option value="">Bugünün Aktif Randevularından Seçin...</option>
                               {allBookingsForController.map(b => (
                                   <option key={`${b.device}|${b.day}|${b.slotId}`} value={`${b.device}|${b.day}|${b.slotId}|${b.student}|${b.time}`}>
                                       {b.time} | {b.devName} | Oynayan: {b.student}
                                   </option>
                               ))}
                           </select>
                       </div>

                       {evalForm.student && (
                           <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                               <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e3a8a', marginBottom: '5px' }}>2. AŞAMA: DURUM TESPİTİ (Evet / Hayır)</div>
                            
                            {/* İLK SORU: İŞTİRAK DURUMU */}
                            <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '2px solid #3b82f6', marginBottom: '10px' }}>
                                <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e40af', marginBottom: '12px' }}>Öğrenci randevusuna iştirak etti mi?</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setEvalForm({...evalForm, attended: true})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: evalForm.attended !== false ? '#10b981' : '#e2e8f0', color: evalForm.attended !== false ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer' }}>EVET (Oynadı)</button>
                                    <button onClick={() => setEvalForm({...evalForm, attended: false})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: evalForm.attended === false ? '#ef4444' : '#e2e8f0', color: evalForm.attended === false ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer' }}>HAYIR (İade Yap)</button>
                                </div>
                            </div>

                            {evalForm.attended !== false ? (
                                <>
                                   <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                       <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>1. Cihazlar sağlam bir şekilde teslim edildi mi?</div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                           <button onClick={() => setEvalForm({...evalForm, q1: true})} className="profile-btn" style={{ background: evalForm.q1 ? '#10b981' : '#e2e8f0', color: evalForm.q1 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                           <button onClick={() => setEvalForm({...evalForm, q1: false})} className="profile-btn" style={{ background: !evalForm.q1 ? '#ef4444' : '#e2e8f0', color: !evalForm.q1 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                       </div>
                                   </div>

                                   <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                       <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>2. Masa sandalye tertip düzenli bırakıldı mı?</div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                           <button onClick={() => setEvalForm({...evalForm, q2: true})} className="profile-btn" style={{ background: evalForm.q2 ? '#10b981' : '#e2e8f0', color: evalForm.q2 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                           <button onClick={() => setEvalForm({...evalForm, q2: false})} className="profile-btn" style={{ background: !evalForm.q2 ? '#ef4444' : '#e2e8f0', color: !evalForm.q2 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                       </div>
                                   </div>

                                   <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                       <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>3. Eğer ilk seans ise oyundan çıkılarak teslim edildi mi?</div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                           <button onClick={() => setEvalForm({...evalForm, q3: true})} className="profile-btn" style={{ background: evalForm.q3 ? '#10b981' : '#e2e8f0', color: evalForm.q3 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                           <button onClick={() => setEvalForm({...evalForm, q3: false})} className="profile-btn" style={{ background: !evalForm.q3 ? '#ef4444' : '#e2e8f0', color: !evalForm.q3 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                       </div>
                                   </div>

                                   <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                       <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>4. Eğer son seans ise cihaz tamamen kapatılıp teslim edildi mi?</div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                           <button onClick={() => setEvalForm({...evalForm, q4: true})} className="profile-btn" style={{ background: evalForm.q4 ? '#10b981' : '#e2e8f0', color: evalForm.q4 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                           <button onClick={() => setEvalForm({...evalForm, q4: false})} className="profile-btn" style={{ background: !evalForm.q4 ? '#ef4444' : '#e2e8f0', color: !evalForm.q4 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                       </div>
                                   </div>

                                   <div style={{ background: evalForm.q5 ? '#fef2f2' : '#f8fafc', padding: '20px', borderRadius: '16px', border: `2px solid ${evalForm.q5 ? '#ef4444' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                       <div style={{ flex: 1 }}>
                                           <div style={{ fontSize: '15px', fontWeight: 900, color: evalForm.q5 ? '#b91c1c' : '#334155' }}>5. Oyun odasına yiyecek veya içecek sokuldu mu?</div>
                                           {evalForm.q5 ? (
                                               <div className="fade-in" style={{ fontSize: '12px', color: '#ef4444', fontWeight: 900, marginTop: '6px', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>⛔ DİKKAT: Gönderildiği an öğrenci 1 Hafta Ban yiyecek!</div>
                                           ) : (
                                               <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>Kesinlikle yasaktır, tespiti halinde ağır cezası vardır.</div>
                                           )}
                                       </div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                           <button onClick={() => setEvalForm({...evalForm, q5: true})} className="profile-btn" style={{ background: evalForm.q5 ? '#ef4444' : '#e2e8f0', color: evalForm.q5 ? 'white' : '#64748b', padding: '10px 16px' }}>Evet (İhlal Var)</button>
                                           <button onClick={() => setEvalForm({...evalForm, q5: false})} className="profile-btn" style={{ background: !evalForm.q5 ? '#10b981' : '#e2e8f0', color: !evalForm.q5 ? 'white' : '#64748b', padding: '10px 16px' }}>Hayır (Temiz)</button>
                                       </div>
                                   </div>

                                   {(!evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || evalForm.q5) && (
                                       <div className="fade-in" style={{ marginTop: '15px', background: '#fef2f2', border: '2px dashed #fca5a5', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                                           <div style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444', marginBottom: '10px' }}>📸 İHLAL TESPİT EDİLDİ - KANIT FOTOĞRAFI YÜKLE</div>
                                           
                                           <input type="file" id="proofPhotoInput" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                           
                                           {!evalForm.photoUrl ? (
                                               <button onClick={() => document.getElementById('proofPhotoInput').click()} className="profile-btn" style={{ background: '#ef4444', color: 'white', padding: '16px 20px', fontSize: '14px', width: '100%', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }}>
                                                   📷 Kamerayı Aç veya Galeriden Seç
                                               </button>
                                           ) : (
                                               <div className="fade-in">
                                                   <img src={evalForm.photoUrl} alt="Kanıt" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ef4444', marginBottom: '15px' }} />
                                                   <button onClick={() => setEvalForm({...evalForm, photoUrl: ''})} className="profile-btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5 !important', padding: '10px 16px', fontSize: '13px' }}>🗑️ Fotoğrafı Sil / Yeniden Yükle</button>
                                               </div>
                                           )}
                                       </div>
                                   )}
                                </>
                            ) : (
                                <div className="fade-in" style={{ padding: '20px', background: '#fff1f2', borderRadius: '16px', border: '1px solid #fda4af', color: '#be123c', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                                    ⚠️ "HAYIR" seçildiği için diğer sorular devre dışı bırakıldı. Onayladığınızda öğrenciye otomatik M-Coin iadesi yapılacak ve bu seans iptal edilecektir.
                                </div>
                            )}

                            <button onClick={submitEvaluation} className="premium-btn badge-glow" style={{ background: '#0f172a', color: 'white', padding: '20px', width: '100%', marginTop: '15px', fontSize: '16px' }}>
                                {evalForm.attended !== false ? 'RAPORU YÖNETİCİYE GÖNDER' : 'İADE YAP VE İPTAL ET'}
                            </button>
                           </div>
                       )}
                   </div>
               ) : (
                   // --- STANDART RANDEVU ALMA EKRANI ---
                   <>
                       <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '30px', borderRadius: '32px', color: 'white', marginBottom: '25px', boxShadow: '0 15px 30px rgba(99,102,241,0.3)' }}>
                          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎮</div>
                          <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>Oyun Odası Randevu</h2>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, opacity: 0.9 }}>Bakiye ile istediğin cihazı şimdiden rezerve et, sıranı garantile!</p>
                          
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                              {Number(appData?.inventory?.[safeName]?.joker_ticket || 0) > 0 && (
                                  <div style={{ background: `linear-gradient(135deg, #d4af37, #0f172a)`, padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: `2px solid #fef08a`, boxShadow: `0 4px 15px rgba(212,175,55,0.5)` }}>
                                      <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🎫</span>
                                      <span style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.5px' }}>{Number(appData?.inventory?.[safeName]?.joker_ticket)}x ALTIN BİLET (JOKER)</span>
                                  </div>
                              )}
                              {SHARD_TYPES.map(st => {
                                  const jCount = getJoker(st.id);
                                  if (jCount > 0) {
                                      return (
                                          <div key={st.id} style={{ background: `linear-gradient(135deg, ${st.color}, #0f172a)`, padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: `2px solid ${st.bg}`, boxShadow: `0 4px 15px ${st.color}80` }}>
                                              <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{st.icon}</span>
                                              <span style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.5px' }}>{jCount}x BEDAVA {st.name}</span>
                                          </div>
                                      );
                                  }
                                  return null;
                              })}
                          </div>
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
                             {([...(GAME_SLOTS[gameDevice] || []), ...Object.keys(appData?.custom_game_slots?.[gameDevice]?.[gameDay] || {}).map(k => ({id: k, ...appData.custom_game_slots[gameDevice][gameDay][k]}))].sort((a,b) => a.time.localeCompare(b.time))).map(slot => {
                                 const rawBookedBy = appData?.game_room_appointments?.[gameDevice]?.[gameDay]?.[slot.id];
                                 const hasTournaments = Object.keys(appData?.tournaments || {}).length > 0;
                                 // Turnuva slotu ama aktif turnuva yoksa → boş say
                                 const bookedBy = (rawBookedBy && String(rawBookedBy).includes('TURNUVA') && !hasTournaments) ? null : rawBookedBy;
                                 const isBooked = !!bookedBy;
                                 const isMyBook = bookedBy === safeName;

                                 let isPastTimeToday = false;
                                 if (selectedDayIdx === liveDayIdx) {
                                     const timeParts = slot?.time?.split('-');
                                     if (timeParts && timeParts[1]) {
                                         const timeSplit = timeParts[1].trim().split(':');
                                         if (timeSplit.length === 2) {
                                             const eH = Number(timeSplit[0]);
                                             const eM = Number(timeSplit[1]);
                                             if (currentHour > eH || (currentHour === eH && currentMin >= eM)) {
                                                 isPastTimeToday = true;
                                             }
                                         }
                                     }
                                 }
                                 const isLockedTime = isPastDay || isPastTimeToday;

                                 return (
                                     <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: isMyBook ? '#ecfdf5' : (isBooked ? '#fef2f2' : (isLockedTime ? '#f1f5f9' : '#ffffff')), border: `2px solid ${isMyBook ? '#10b981' : (isBooked ? '#fca5a5' : (isLockedTime ? '#e2e8f0' : '#e2e8f0'))}`, borderRadius: '20px', opacity: isLockedTime && !isMyBook && !isBooked ? 0.6 : 1 }}>
                                         <div>
                                             <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '4px', textDecoration: isLockedTime && !isMyBook && !isBooked ? 'line-through' : 'none' }}>🕒 {slot.time}</div>
                                             <div style={{ fontSize: '13px', fontWeight: 800, color: isMyBook ? '#047857' : (isBooked ? '#ef4444' : (isLockedTime ? '#94a3b8' : '#64748b')) }}>
                                                 {isMyBook ? '✅ SENİN RANDEVUN' : (isLockedTime && !isBooked ? '⏳ SÜRESİ GEÇTİ' : (isBooked ? `🔒 DOLU (${String(bookedBy||'')})` : '🟢 BOŞ'))}
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
                   </>
               )}
              </>)}
            </div>
          )}

          {activeTab === 'banka' && (() => {
              // Tarih Filtreleme Mantığı
              const now = new Date();
              const isToday = (dStr) => {
                  if(!dStr) return false;
                  const d = new Date(dStr.split(' ')[0].split('.').reverse().join('-'));
                  return d.toDateString() === now.toDateString();
              };
              const isThisWeek = (dStr) => {
                  if(!dStr) return false;
                  const d = new Date(dStr.split(' ')[0].split('.').reverse().join('-'));
                  const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
                  return d >= weekAgo;
              };
              const isThisMonth = (dStr) => {
                  if(!dStr) return false;
                  const d = new Date(dStr.split(' ')[0].split('.').reverse().join('-'));
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              };

              // Seçili filtreye göre işlemleri süz
              const filteredTxns = sortedTxns.filter(t => {
                  if (bankTimeFilter === 'today') return isToday(t.date);
                  if (bankTimeFilter === 'week') return isThisWeek(t.date);
                  if (bankTimeFilter === 'month') return isThisMonth(t.date);
                  return true;
              });

              const plusTxns = filteredTxns.filter(t => t.amt > 0);
              const minusTxns = filteredTxns.filter(t => t.amt < 0);

              const totalIn = plusTxns.reduce((sum, t) => sum + t.amt, 0);
              const totalOut = minusTxns.reduce((sum, t) => sum + Math.abs(t.amt), 0);

              const plusStatsMap = {}; const minusStatsMap = {};
              filteredTxns.forEach(t => {
                  let genericDesc = (t.desc || 'Diğer').split('(')[0].trim();
                  if (t.amt > 0) plusStatsMap[genericDesc] = (plusStatsMap[genericDesc] || 0) + t.amt;
                  else if (t.amt < 0) minusStatsMap[genericDesc] = (minusStatsMap[genericDesc] || 0) + Math.abs(t.amt);
              });

              const topPlus = Object.entries(plusStatsMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
              const topMinus = Object.entries(minusStatsMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

              return (
                <div className="fade-in" style={{ padding: '0px', paddingBottom: '100px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>🏦 Elite Banka</h2>
                  
                  <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '35px', borderRadius: '32px', color: 'white', marginBottom: '20px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ fontSize: '14px', opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Kullanılabilir Bakiye</div>
                      <div style={{ fontSize: '42px', fontWeight: 900 }}>{mCoin} <span style={{ fontSize: '16px', opacity: 0.6 }}>M</span></div>
                  </div>

                  {/* ZAMAN FİLTRESİ BUTONLARI */}
                  <div className="clean-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px' }}>
                      {[
                          {id:'all', n:'Tümü'}, {id:'today', n:'Bugün'}, {id:'week', n:'Bu Hafta'}, {id:'month', n:'Bu Ay'}
                      ].map(f => (
                          <button key={f.id} onClick={() => setBankTimeFilter(f.id)} className="profile-btn" style={{ 
                              background: bankTimeFilter === f.id ? '#0f172a' : 'white', 
                              color: bankTimeFilter === f.id ? 'white' : '#64748b',
                              border: '1px solid #e2e8f0', padding: '8px 16px', fontSize: '12px', flexShrink: 0
                          }}>{f.n}</button>
                      ))}
                  </div>

                  {/* ÖZET PANELİ */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                      <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                          <div style={{ fontSize: '10px', fontWeight: 900, color: '#047857' }}>TOPLAM GİRİŞ</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>+{totalIn} M</div>
                      </div>
                      <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '20px', border: '1px solid #fecaca' }}>
                          <div style={{ fontSize: '10px', fontWeight: 900, color: '#991b1b' }}>TOPLAM ÇIKIŞ</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>-{totalOut} M</div>
                      </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', background: '#f1f5f9', padding: '6px', borderRadius: '20px' }}>
                      <button onClick={() => setWalletTab('plus')} className="profile-btn" style={{ flex: 1, padding: '10px', borderRadius: '15px', background: walletTab === 'plus' ? 'white' : 'transparent', color: walletTab === 'plus' ? '#10b981' : '#64748b', boxShadow: walletTab === 'plus' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>Gelen</button>
                      <button onClick={() => setWalletTab('minus')} className="profile-btn" style={{ flex: 1, padding: '10px', borderRadius: '15px', background: walletTab === 'minus' ? 'white' : 'transparent', color: walletTab === 'minus' ? '#ef4444' : '#64748b', boxShadow: walletTab === 'minus' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>Giden</button>
                      <button onClick={() => setWalletTab('stats')} className="profile-btn" style={{ flex: 1, padding: '10px', borderRadius: '15px', background: walletTab === 'stats' ? 'white' : 'transparent', color: walletTab === 'stats' ? '#0f172a' : '#64748b', boxShadow: walletTab === 'stats' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>Analiz</button>
                  </div>

                  <div className="fade-in">
                      {walletTab === 'plus' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {plusTxns.length > 0 ? plusTxns.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '18px', borderRadius: '22px', border: '1px solid #f1f5f9' }}>
                                      <div><div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{item.desc}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.date}</div></div>
                                      <div style={{ fontWeight: 900, color: '#10b981' }}>+{item.amt}</div>
                                  </div>
                              )) : <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Kayıt bulunamadı.</div>}
                          </div>
                      )}

                      {walletTab === 'minus' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {minusTxns.length > 0 ? minusTxns.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '18px', borderRadius: '22px', border: '1px solid #f1f5f9' }}>
                                      <div><div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{item.desc}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.date}</div></div>
                                      <div style={{ fontWeight: 900, color: '#ef4444' }}>{item.amt}</div>
                                  </div>
                              )) : <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Kayıt bulunamadı.</div>}
                          </div>
                      )}

                      {walletTab === 'stats' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', marginBottom: '15px' }}>📈 EN ÇOK KAZANDIRANLAR</div>
                                  {topPlus.map((s, i) => (
                                      <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'14px', fontWeight:700 }}>
                                          <span style={{color:'#64748b'}}>{s[0]}</span>
                                          <span style={{color:'#10b981'}}>+{s[1]} M</span>
                                      </div>
                                  ))}
                              </div>
                              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', marginBottom: '15px' }}>📉 EN ÇOK HARCATANLAR</div>
                                  {topMinus.map((s, i) => (
                                      <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'14px', fontWeight:700 }}>
                                          <span style={{color:'#64748b'}}>{s[0]}</span>
                                          <span style={{color:'#ef4444'}}>-{s[1]} M</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                </div>
              );
          })()}

          {activeTab === 'market' && (
            <div className="fade-in">
              {isCritical ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔒</div>
                  <div style={{ fontWeight: 900, fontSize: '24px', color: '#dc2626', marginBottom: '8px' }}>Market Kilitli</div>
                  <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, marginBottom: '20px' }}>Bakiyen 50 M-Coin altında.</div>
                  <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '16px 28px', border: '1px solid #fca5a5', marginBottom: '24px' }}>
                    <div style={{ fontWeight: 900, color: '#b91c1c', fontSize: '22px' }}>{mCoin} M</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Min. 50 M-Coin gerekli</div>
                  </div>
                  {(() => {
                    const myMission = appData?.kurtarma_gorevleri?.[safeName];
                    const claimMission = async () => {
                      const myM = appData?.kurtarma_gorevleri?.[safeName];
                      if (myM?.status === 'reddedildi' && myM.rejected_at && Date.now() - myM.rejected_at < 12*60*60*1000) { toast('12 saat beklemelisin.'); return; }
                      const starReward = { 1: 80, 2: 60, 3: 40, 4: 20 };
                      const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
                      const failedAreas = Object.values(appData?.hygiene_logs || {})
                        .filter(l => l.timestamp >= todayStart && l.score < 5 && (l.responsibles || []).includes(safeName))
                        .map(l => ({ name: l.areaName, type: l.type || 'genel', score: l.score, reward: starReward[l.score] || 20 }));
                      let missionAreas = failedAreas;
                      let totalReward = missionAreas.reduce((s, a) => s + a.reward, 0);
                      if (missionAreas.length === 0) {
                        const floors = appData?.hygiene_floors || {};
                        const responsible = [];
                        ['rutin','temizlik'].forEach(sec => {
                          ['kat2','kat3','kat4'].forEach(fl => {
                            Object.entries(floors[sec]?.[fl]?.areas || {}).forEach(([,a]) => {
                              if ((a.responsibles || []).includes(safeName)) responsible.push({ name: a.name, type: a.type || 'genel', reward: 40 });
                            });
                          });
                        });
                        missionAreas = responsible.slice(0, 1);
                        totalReward = 40;
                      }
                      if (missionAreas.length === 0) { toast('Henüz sorumlu alanın yok. Yöneticine başvur.'); return; }
                      await db.ref(`mavikent_premium/kurtarma_gorevleri/${safeName}`).set({ status: 'bekliyor', assigned_at: Date.now(), reward_coins: totalReward, areas: missionAreas });
                      toast('Kurtarma görevi alındı! Tamamlayınca onay iste.');
                    };
                    const completeMission = async () => {
                      await db.ref(`mavikent_premium/kurtarma_gorevleri/${safeName}`).update({ status: 'talep_edildi', claimed_at: Date.now() });
                      toast('Onay isteğin gönderildi!');
                    };
                    // Red sonrası 12 saat bekleme
                    if (myMission?.status === 'reddedildi') {
                      const remaining = myMission.rejected_at ? Math.max(0, 12*60*60*1000 - (Date.now() - myMission.rejected_at)) : 0;
                      const hrs = Math.floor(remaining / 3600000);
                      const mins = Math.floor((remaining % 3600000) / 60000);
                      if (remaining > 0) return (
                        <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '20px 24px', border: '1px solid #fca5a5', textAlign: 'center', maxWidth: '280px' }}>
                          <div style={{ fontSize: '28px', marginBottom: '8px' }}>❌</div>
                          <div style={{ fontWeight: 900, fontSize: '14px', color: '#dc2626', marginBottom: '6px' }}>Görev Reddedildi</div>
                          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, marginBottom: '10px' }}>Tekrar almak için bekle</div>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '10px 16px', border: '1px solid #fca5a5' }}>
                            <div style={{ fontWeight: 900, fontSize: '20px', color: '#dc2626' }}>{hrs}s {mins}dk</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>kalan süre</div>
                          </div>
                        </div>
                      );
                    }
                    if (!myMission || myMission.status === 'tamamlandi' || (myMission.status === 'reddedildi' && myMission.rejected_at && Date.now() - myMission.rejected_at >= 12*60*60*1000)) return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Kurtarma görevi ile kilit açabilirsin</div>
                        <button onClick={claimMission} style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '18px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(14,165,233,0.4)' }}>🚀 Kurtarma Görevi Al</button>
                      </div>
                    );
                    if (myMission.status === 'bekliyor') return (
                      <div style={{ background: '#fff7ed', borderRadius: '20px', padding: '20px 24px', border: '1px solid #fed7aa', maxWidth: '300px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#c2410c', marginBottom: '10px' }}>🎯 Aktif Görevin</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                          {(myMission.areas || []).map((a, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '10px', padding: '8px 12px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#c2410c' }}>{a.name}</span>
                              <span style={{ fontSize: '12px', fontWeight: 900, color: '#10b981' }}>+{a.reward || myMission.reward_coins} M</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '13px', color: '#c2410c', fontWeight: 900, marginBottom: '14px', textAlign: 'right' }}>Toplam: +{myMission.reward_coins} M-Coin</div>
                        <button onClick={completeMission} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', width: '100%', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>✅ Tamamladım, Onay İste</button>
                      </div>
                    );
                    if (myMission.status === 'talep_edildi') return (
                      <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '18px 24px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>⏳</div>
                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#059669' }}>Onay Bekleniyor</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Yönetici onayladığında bakiyen yüklenir</div>
                      </div>
                    );
                    return null;
                  })()}
                </div>
              ) : (<>
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
                               <div style={{ fontSize: '16px', fontWeight: 800 }}>{appData.auction.highestBidder ? String(appData.auction.highestBidder) : 'Yok'}</div>
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
              </>)}
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

          {activeTab === 'akademi' && (
            <div className="fade-in">
              {!(appData?.settings?.quiz_enabled) && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
                  <h2 style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a', margin: '0 0 10px' }}>Quiz Bölümü Kapalı</h2>
                  <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                    Yönetici bu bölümü henüz açmadı.<br />Biraz bekle!
                  </p>
                </div>
              )}
              {!!(appData?.settings?.quiz_enabled) && akademiView === 'menu' && (

                <div>
                  <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px', color: '#0f172a' }}>📚 Akademi</h2>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px', fontWeight: 600 }}>Öğren, yarış, kazan!</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { key: 'quiz', icon: '📖', title: 'Quiz Bölümleri', desc: 'Soru çöz, M-Coin kazan', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', shadow: 'rgba(59,130,246,0.3)' },
                      { key: 'kule', icon: '🏰', title: 'Bilgi Kulesi', desc: 'Her doğru cevap seni bir kat yukarı çıkarır!', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)' },
                      { key: 'kelimeavi', icon: '🔍', title: 'Kelime Avı', desc: 'İngilizce kelimeleri ızgarada bul, zamana karşı yarış!', gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)' },
                    ].map(item => (
                      <button key={item.key} onClick={() => setAkademiView(item.key)}
                        style={{ background: item.gradient, border: 'none', borderRadius: '22px', padding: '22px 20px', cursor: 'pointer', textAlign: 'left', boxShadow: `0 8px 24px ${item.shadow}`, transition: 'transform 0.15s', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '40px' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '17px', color: 'white', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{item.desc}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: '20px' }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!!(appData?.settings?.quiz_enabled) && akademiView === 'quiz' && <QuizStudent studentName={safeName} appData={appData} onBack={() => setAkademiView('menu')} />}
              {!!(appData?.settings?.quiz_enabled) && akademiView === 'kule' && <BilgiKulesi studentName={safeName} appData={appData} onBack={() => setAkademiView('menu')} />}
              {!!(appData?.settings?.quiz_enabled) && akademiView === 'kelimeavi' && <KelimeAvi studentName={safeName} appData={appData} onBack={() => setAkademiView('menu')} />}
            </div>
          )}

          {activeTab === 'rank' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '16px', color: '#0f172a', letterSpacing: '-0.5px' }}>🏆 Liderlik</h2>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', borderRadius: '18px', padding: '6px' }}>
                <button onClick={() => setRankTab('coins')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', background: rankTab === 'coins' ? 'white' : 'transparent', color: rankTab === 'coins' ? '#0f172a' : '#94a3b8', boxShadow: rankTab === 'coins' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>💰 M-Coin</button>
                <button onClick={() => setRankTab('akademi')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', background: rankTab === 'akademi' ? 'white' : 'transparent', color: rankTab === 'akademi' ? '#0f172a' : '#94a3b8', boxShadow: rankTab === 'akademi' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>🎓 Akademi</button>
              </div>

              {rankTab === 'coins' && (
                <div style={{ background: '#ffffff', borderRadius: '32px', padding: '20px', boxShadow: '0 15px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                  {wealthSorted.map((s, idx) => {
                    const isMe = s.n === safeName;
                    const pinned = appData?.pinned_badges?.[s.n] || [];
                    const title = getStudentTitle(s.n);
                    return (
                      <div key={s.n} onClick={() => setViewProfile(s.n)} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: idx < wealthSorted.length - 1 ? '1px solid #e2e8f0' : 'none', background: isMe ? '#f8fafc' : 'transparent', borderRadius: isMe ? '20px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ width: '35px', fontWeight: 900, color: idx < 3 ? '#0f172a' : '#94a3b8', fontSize: '18px' }}>{idx + 1}.</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {s.n}
                            <TitleBadge title={title} />
                            {pinned.map(bId => <span key={bId} style={{ fontSize: '14px' }}>{BADGES[bId]?.icon}</span>)}
                          </span>
                        </div>
                        <div style={{ color: '#10b981', fontWeight: 900, fontSize: '20px' }}>{s.val} <span style={{ fontSize: '11px', color: '#64748b' }}>M-COIN</span></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {rankTab === 'akademi' && (
                <div>
                  {akademiSorted.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '50px 24px', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', marginBottom: '6px' }}>Henüz sıralama yok</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Öğrenciler quiz çözdükçe sıralama oluşacak</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {akademiSorted.map((s, idx) => {
                        const isMe = s.n === safeName;
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                        const barColor = s.avgPct >= 80 ? '#10b981' : s.avgPct >= 60 ? '#3b82f6' : s.avgPct >= 40 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={s.n} onClick={() => setViewProfile(s.n)} style={{ background: 'white', borderRadius: '20px', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: isMe ? '2px solid #6366f1' : '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                              <div style={{ width: '32px', fontWeight: 900, color: idx < 3 ? '#0f172a' : '#94a3b8', fontSize: '18px', textAlign: 'center' }}>
                                {medal || (idx + 1) + '.'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>{s.n}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{s.setCount} bölüm · +{s.totalCoins} M-Coin kazanıldı</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: '22px', color: barColor }}>%{s.avgPct}</div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>BAŞARI</div>
                              </div>
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                              <div style={{ background: barColor, height: '100%', width: s.avgPct + '%', borderRadius: '8px', transition: 'width 0.5s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {myAkademiRank && myAkademiRank !== '-' && (
                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#6366f1' }}>
                      Akademi sıralaman: #{myAkademiRank}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'hygiene' && isHygieneInspector && (() => {
              const allLogs = Object.values(appData?.hygiene_logs || {});
              const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
              const timeAgo = (ts) => {
                  if (!ts) return null;
                  const m = Math.floor((Date.now() - ts) / 60000);
                  if (m < 1) return 'az önce';
                  if (m < 60) return `${m} dk önce`;
                  const h = Math.floor(m / 60);
                  if (h < 24) return `${h} saat önce`;
                  return `${Math.floor(h / 24)} gün önce`;
              };
              const lastLogTs = (filterFn) => {
                  const f = allLogs.filter(filterFn);
                  return f.length ? Math.max(...f.map(l => l.timestamp)) : null;
              };
              const todayAreaCount = (section) =>
                  new Set(allLogs.filter(l => l.section === section && l.timestamp >= todayStart).map(l => l.areaName)).size;
              const lastScoreForArea = (areaName) => {
                  const f = allLogs.filter(l => l.areaName === areaName).sort((a,b) => b.timestamp - a.timestamp);
                  return f.length ? f[0].score : null;
              };

              return (
              <div className="fade-in" style={{ animation: 'fadeIn 0.4s ease-out' }}>

                  {(stuHygSection || stuHygFloor) && (
                      <div style={{ marginBottom: '20px' }}>
                          <button onClick={() => {
                              if (stuHygAreaId) { setStuHygAreaId(null); setStuHygScore(5); }
                              else if (stuHygFloor) { setStuHygFloor(null); setStuHygAreaId(null); }
                              else { setStuHygSection(null); setStuHygFloor(null); setStuHygAreaId(null); }
                          }} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                              ← Geri
                          </button>
                      </div>
                  )}

                  {!stuHygSection && (
                      <div className="fade-in">
                          <div style={{ marginBottom: '24px' }}>
                              <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>🏥 Hijyen Denetim Merkezi</div>
                              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>Denetim türünü seç</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                              {[
                                  ['rutin',    '🛏️', 'Rutin Kontrol',    'Yatak, dolap, oda düzeni', '#f59e0b', '#b45309', 'linear-gradient(135deg,#fef3c7,#fde68a)'],
                                  ['temizlik', '🧹', 'Temizlik Kontrol', 'WC, etüt, koridorlar',     '#10b981', '#065f46', 'linear-gradient(135deg,#d1fae5,#a7f3d0)'],
                              ].map(([key, icon, label, desc, color, dark, grad]) => {
                                  const total = ['kat2','kat3','kat4'].reduce((n,fk) => n + Object.keys(appData?.hygiene_floors?.[key]?.[fk]?.areas || {}).length, 0);
                                  const today = todayAreaCount(key);
                                  const last  = lastLogTs(l => l.section === key);
                                  const pct   = total > 0 ? Math.min(100, Math.round(today / total * 100)) : 0;
                                  return (
                                      <div key={key} onClick={() => { setStuHygSection(key); setStuHygFloor(null); }} className="card-hover"
                                          style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 24px rgba(15,23,42,0.07)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                                          <div style={{ background: grad, padding: '24px 24px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                              <div style={{ fontSize: '44px', lineHeight: 1 }}>{icon}</div>
                                              <div>
                                                  <div style={{ fontWeight: 900, fontSize: '18px', color: dark }}>{label}</div>
                                                  <div style={{ fontSize: '12px', fontWeight: 600, color: dark + 'aa', marginTop: '2px' }}>{desc}</div>
                                              </div>
                                          </div>
                                          <div style={{ padding: '16px 24px 20px' }}>
                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px 14px' }}>
                                                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Toplam Alan</div>
                                                      <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a', marginTop: '2px' }}>{total}</div>
                                                  </div>
                                                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px 14px' }}>
                                                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Son Denetim</div>
                                                      <div style={{ fontWeight: 700, fontSize: '12px', color: last ? '#0f172a' : '#94a3b8', marginTop: '4px' }}>{last ? timeAgo(last) : 'Kayıt yok'}</div>
                                                  </div>
                                              </div>
                                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                  <span>Bugün tamamlanan</span>
                                                  <span style={{ fontWeight: 900, color }}>{today}/{total}</span>
                                              </div>
                                              <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: '8px', transition: 'width 0.6s ease' }} />
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {stuHygSection && !stuHygFloor && (
                      <div className="fade-in">
                          <div style={{ marginBottom: '20px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  {stuHygSection === 'rutin' ? '🛏️ Rutin Kontrol' : '🧹 Temizlik Kontrol'} — Kat seç
                              </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                              {[
                                  ['kat2','Kat 2','2','#0ea5e9','#0369a1','linear-gradient(135deg,#e0f2fe,#bae6fd)'],
                                  ['kat3','Kat 3','3','#8b5cf6','#6d28d9','linear-gradient(135deg,#ede9fe,#ddd6fe)'],
                                  ['kat4','Kat 4','4','#10b981','#065f46','linear-gradient(135deg,#d1fae5,#a7f3d0)'],
                              ].filter(([key]) => !!appData?.hygiene_inspectors?.[safeName]?.[key])
                              .map(([key, label, num, color, dark, grad]) => {
                                  const areaCount = Object.keys(appData?.hygiene_floors?.[stuHygSection]?.[key]?.areas || {}).length;
                                  const last = lastLogTs(l => l.section === stuHygSection && l.floor === key);
                                  return (
                                      <div key={key} onClick={() => { setStuHygFloor(key); setStuHygAreaId(null); }} className="card-hover"
                                          style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                                          <div style={{ background: grad, padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                              <div>
                                                  <div style={{ fontWeight: 900, fontSize: '36px', color: dark, lineHeight: 1 }}>{num}</div>
                                                  <div style={{ fontWeight: 900, fontSize: '13px', color: dark, marginTop: '4px', opacity: 0.8 }}>{label}</div>
                                              </div>
                                              <div style={{ fontSize: '28px', opacity: 0.5 }}>🏢</div>
                                          </div>
                                          <div style={{ padding: '12px 20px 16px' }}>
                                              <div style={{ fontWeight: 800, color: color, fontSize: '14px' }}>{areaCount} alan tanımlı</div>
                                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>{last ? `Son: ${timeAgo(last)}` : 'Henüz denetim yok'}</div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {stuHygSection && stuHygFloor && (() => {
                      const section = stuHygSection;
                      const floorKey = stuHygFloor;
                      const floorLabel = { kat2: 'Kat 2', kat3: 'Kat 3', kat4: 'Kat 4' }[floorKey];
                      const floorAreas = appData?.hygiene_floors?.[section]?.[floorKey]?.areas || {};
                      const selectedArea = stuHygAreaId ? floorAreas[stuHygAreaId] : null;
                      return (
                          <div className="fade-in">
                              <div style={{ marginBottom: '16px' }}>
                                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>🏢 {floorLabel} — {section === 'rutin' ? '🛏️ Rutin' : '🧹 Temizlik'}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: '3px' }}>Denetim yapacağın alana tıkla</div>
                              </div>
                              {Object.keys(floorAreas).length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                      <div style={{ fontSize: '44px', marginBottom: '12px' }}>🏗️</div>
                                      <div style={{ fontWeight: 900, fontSize: '16px', color: '#64748b' }}>Bu kat için henüz alan tanımlanmadı.</div>
                                  </div>
                              ) : !stuHygAreaId ? (
                                  <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
                                      {Object.entries(floorAreas).map(([areaId, area]) => {
                                          const ti = FLOOR_AREA_TYPES[area.type] || FLOOR_AREA_TYPES.genel;
                                          const lastScore = lastScoreForArea(area.name);
                                          const done = allLogs.some(l => l.areaName === area.name && l.section === section && l.floor === floorKey && l.timestamp >= todayStart);
                                          return (
                                              <div key={areaId} onClick={done ? undefined : () => { setStuHygAreaId(areaId); setStuHygScore(5); }}
                                                  style={{ background: done ? '#f8fafc' : 'white', border: `1px solid ${done ? '#e2e8f0' : ti.color + '20'}`, borderRadius: '16px', overflow: 'hidden', cursor: done ? 'default' : 'pointer', boxShadow: '0 2px 12px rgba(15,23,42,0.05)', transition: 'all 0.2s', opacity: done ? 0.55 : 1, pointerEvents: done ? 'none' : 'auto' }}>
                                                  <div style={{ height: '4px', background: done ? '#e2e8f0' : `linear-gradient(90deg,${ti.color},${ti.color}66)` }} />
                                                  <div style={{ padding: '14px' }}>
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                          <span style={{ fontSize: '26px' }}>{ti.icon}</span>
                                                          {done ? (
                                                              <span style={{ background: '#ecfdf5', color: '#10b981', fontSize: '10px', fontWeight: 900, padding: '2px 7px', borderRadius: '8px' }}>✓ Tamam</span>
                                                          ) : lastScore && (
                                                              <span style={{ background: lastScore >= 3 ? '#ecfdf5' : '#fef2f2', color: lastScore >= 3 ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: 900, padding: '2px 7px', borderRadius: '8px' }}>
                                                                  {'★'.repeat(lastScore)}
                                                              </span>
                                                          )}
                                                      </div>
                                                      <div style={{ fontWeight: 900, fontSize: '13px', color: done ? '#94a3b8' : '#0f172a', marginBottom: '3px' }}>{area.name}</div>
                                                      <div style={{ fontSize: '11px', fontWeight: 700, color: done ? '#cbd5e1' : ti.color }}>{ti.label}</div>
                                                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '6px' }}>👥 {(area.responsibles || []).length} sorumlu</div>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              ) : selectedArea && (() => {
                                  const ti = FLOOR_AREA_TYPES[selectedArea.type] || FLOOR_AREA_TYPES.genel;
                                  const responsibles = selectedArea.responsibles || [];
                                  const scoreLabels = { 1: 'Çok Kötü', 2: 'Kötü', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' };
                                  return (
                                      <div className="fade-in">
                                          <div style={{ marginBottom: '14px' }}>
                                              <button onClick={() => { setStuHygAreaId(null); setStuHygScore(5); }}
                                                  style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                                                  ← Geri
                                              </button>
                                          </div>
                                          <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' }}>
                                              <div style={{ height: '5px', background: `linear-gradient(90deg,${ti.color},${ti.color}66)` }} />
                                              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{ti.icon}</div>
                                                  <div>
                                                      <div style={{ fontWeight: 900, fontSize: '17px', color: '#0f172a' }}>{selectedArea.name}</div>
                                                      <div style={{ fontSize: '12px', fontWeight: 700, color: ti.color, marginTop: '2px' }}>{ti.label}</div>
                                                  </div>
                                              </div>
                                          </div>
                                          {responsibles.length > 0 && (
                                              <div style={{ background: 'white', borderRadius: '16px', padding: '14px 18px', marginBottom: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>👥 Sorumlu Öğrenciler</div>
                                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                                      {responsibles.map(r => <span key={r} style={{ background: ti.color + '15', color: ti.color, padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, border: `1px solid ${ti.color}30` }}>{r}</span>)}
                                                  </div>
                                              </div>
                                          )}
                                          <div style={{ background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', marginBottom: '16px' }}>Denetim Puanı</div>
                                              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                                  {[1,2,3,4,5].map(star => (
                                                      <button key={star} onClick={() => setStuHygScore(star)}
                                                          style={{ flex: 1, padding: '14px 0', fontSize: '22px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: stuHygScore >= star ? ti.color : '#f8fafc', color: stuHygScore >= star ? '#fff' : '#cbd5e1', transition: 'all 0.18s', boxShadow: stuHygScore >= star ? `0 6px 14px ${ti.color}40` : 'none' }}>★</button>
                                                  ))}
                                              </div>
                                              <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 900, color: ti.color, marginBottom: '16px' }}>
                                                  {scoreLabels[stuHygScore]} — {getCoinImpact(stuHygScore) >= 0 ? '+' : ''}{getCoinImpact(stuHygScore)} M-Coin × {responsibles.length} kişi
                                              </div>
                                              <button onClick={() => saveStuFloorInspection(section, floorKey, stuHygAreaId)} disabled={isHygSaving}
                                                  className="profile-btn" style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${ti.color}cc,${ti.color})`, color: 'white', fontWeight: 900, fontSize: '15px', border: 'none', borderRadius: '14px', boxShadow: `0 8px 20px ${ti.color}40` }}>
                                                  {isHygSaving ? '⏳ İşleniyor...' : '✅ DENETİMİ KAYDET'}
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })()}
                          </div>
                      );
                  })()}
              </div>
              );
          })()}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: '50px', display: 'flex', padding: '10px', width: '98%', maxWidth: '600px', zIndex: 1000, boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2)', border: '1px solid rgba(226,232,240,0.8)' }}>
         <button onClick={() => setActiveTab('home')} style={getNavStyle('home')}>Özet</button>
         <button onClick={() => setActiveTab('chat')} style={getNavStyle('chat')}>💬 Meydan</button>
         <button onClick={() => setActiveTab('banka')} style={getNavStyle('banka')}>🏦 Banka</button>
         <button onClick={() => setActiveTab('market')} style={getNavStyle('market')}>Market</button>
         <button onClick={() => { if (appData?.settings?.quiz_enabled) { setActiveTab('akademi'); setAkademiView('menu'); } }} style={{ ...getNavStyle('akademi'), opacity: appData?.settings?.quiz_enabled ? 1 : 0.4 }}>📚 Quiz{!appData?.settings?.quiz_enabled ? ' 🔒' : ''}</button>
         <button onClick={() => setActiveTab('game')} style={getNavStyle('game')}>🎮 Oyun</button>
         <button onClick={() => setActiveTab('inventory')} style={getNavStyle('inventory')}>Çanta</button>
         <button onClick={() => setActiveTab('rank')} style={getNavStyle('rank')}>Liderlik</button>
         {isHygieneInspector && <button onClick={() => setActiveTab('hygiene')} style={getNavStyle('hygiene')}>🧹 Denetim</button>}
      </div>
    </div>
  );
};

export default StudentScreen;