import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

const BADGES = {
  soru_1: { id: 'soru_1', icon: '🥉', name: 'Soru Çırağı', desc: 'Toplam 500 soru çöz.', req: 500, rew: 50, type: 'soru' },
  soru_2: { id: 'soru_2', icon: '🥈', name: 'Soru Avcısı', desc: 'Toplam 1.000 soru çöz.', req: 1000, rew: 150, type: 'soru' },
  soru_3: { id: 'soru_3', icon: '🥇', name: 'Test Makinesi', desc: 'Toplam 2.000 soru çöz.', req: 2000, rew: 300, type: 'soru' },
  deneme_1: { id: 'deneme_1', icon: '💎', name: 'Keskin Nişancı', desc: 'Deneme sınavında hedefini tam isabetle geç.', rew: 50, type: 'manual' },
  odev_1: { id: 'odev_1', icon: '🔥', name: 'Görevin Adamı', desc: 'Ödevlerini 10 gün üst üste eksiksiz teslim et.', type: 'manual' },
  kitap_1: { id: 'kitap_1', icon: '🥉', name: 'Kitap Kurdu', desc: 'Toplam 500 sayfa kitap oku.', req: 500, rew: 50, type: 'kitap' },
  kitap_2: { id: 'kitap_2', icon: '🥈', name: 'Bilgi Bekçisi', desc: 'Toplam 2.000 sayfa kitap oku.', req: 2000, rew: 150, type: 'kitap' },
  kitap_3: { id: 'kitap_3', icon: '🥇', name: 'Filozof', desc: 'Toplam 5.000 sayfa kitap oku.', req: 5000, rew: 250, type: 'kitap' },
  yoklama_1: { id: 'yoklama_1', icon: '⏰', name: 'Erkenci Kuş', desc: '1 ay boyunca sabah yoklamasına tam vaktinde katıl.', rew: 50, type: 'manual' },
  telefon_1: { id: 'telefon_1', icon: '📵', name: 'Dijital Detoks', desc: '30 gün boyunca telefonu firesiz teslim et.', rew: 50, type: 'manual' },
  yatak_1: { id: 'yatak_1', icon: '🛏️', name: 'Jilet Gibi', desc: '1 ay boyunca yatak ve dolap kontrolünden tam puan al.', rew: 50, type: 'manual' },
  takke_1: { id: 'takke_1', icon: '👳‍♂️', name: 'Muhafız', desc: 'Yoklamalarda 15 gün üst üste Takkeli işaretlen.', type: 'manual' },
  degerler_1: { id: 'degerler_1', icon: '🕌', name: 'Ahlak Şövalyesi', desc: 'Değerler Eğitimine 4 hafta kesintisiz katıl.', type: 'manual' },
  cuzdan_1: { id: 'cuzdan_1', icon: '🪙', name: 'İlk Maaş', desc: 'Cüzdanında ilk defa 300 M-Coin biriktir.', req: 300, type: 'cuzdan' },
  cuzdan_2: { id: 'cuzdan_2', icon: '🏦', name: 'Borsa Kurdu', desc: 'Cüzdanında aynı anda 1.000 M-Coin görsün.', req: 1000, type: 'cuzdan' },
  market_1: { id: 'market_1', icon: '🛍️', name: 'Alışverişkoliği', desc: 'Marketten toplam 10 farklı ürün satın al.', type: 'manual' },
  sans_1: { id: 'sans_1', icon: '🎰', name: 'Şans Meleği', desc: 'Şans Çarkını toplam 20 kere çevir.', type: 'manual' },
  gizli_1: { id: 'gizli_1', icon: '🛡️', name: 'Mavikent Efsanesi', desc: 'Tüm notları kusursuz olan tek kişiye verilir.', type: 'gizli' },
  gizli_2: { id: 'gizli_2', icon: '🚩', name: 'Klan Şampiyonu', desc: 'Klanıyla birlikte takım savaşını kazananlara verilir.', type: 'gizli' },
  gizli_3: { id: 'gizli_3', icon: '👑', name: 'Elitlerin Efendisi', desc: 'Standart Ligden Elit Lige yükselmeyi başaranlara verilir.', type: 'gizli' }
};

const StudentScreen = ({ appData, goBackToRoles }) => {
  const [activeStudent, setActiveStudent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  
  const [lotteryState, setLotteryState] = useState({ active: false, result: null, spinning: false, currentDisplay: '❓', speed: 100 });
  const [fullListView, setFullListView] = useState(null); 
  const [showPublicQuests, setShowPublicQuests] = useState(false);
  const [showPublicMarket, setShowPublicMarket] = useState(false);

  const [unlockedQueue, setUnlockedQueue] = useState([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);

  const [showCreateClan, setShowCreateClan] = useState(false);
  const [newClan, setNewClan] = useState({ name: '', tag: '', icon: '🛡️', desc: '' });
  const [inviteUser, setInviteUser] = useState('');
  const [selectedClan, setSelectedClan] = useState(null);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  
  const [showTxnModal, setShowTxnModal] = useState(false);

  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});
  const safeName = String(activeStudent || '');

  let myClanId = null; let myClan = {};
  Object.keys(appData?.clans || {}).forEach(k => {
      if ((appData?.clans?.[k]?.members || []).includes(safeName)) { myClanId = k; myClan = appData.clans[k] || {}; }
  });

  const clanScores = Object.keys(appData?.clans || {}).map(cId => {
      const clan = appData.clans[cId] || {}; let warScore = 0; let totalRp = 0;
      (clan.members || []).forEach(m => { const rp = Number(appData?.season_score?.[m] || 0); totalRp += rp; if (appData?.clan_war_participants?.[m]) warScore += rp; });
      return { id: cId, ...clan, warScore, totalRp };
  }).sort((a,b) => b.warScore - a.warScore || b.totalRp - a.totalRp);

  useEffect(() => {
    if (!activeStudent || !appData) return;
    const myBadges = appData?.badges?.[activeStudent] || {};
    const stats = { soru: Number(appData?.education_d?.[activeStudent]?.questions || 0), kitap: Number(appData?.education_d?.[activeStudent]?.pages || 0), cuzdan: Number(appData?.wallet?.[activeStudent] || 0), elit: appData?.student_tiers?.[activeStudent] === 'elite' };
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
  }, [activeStudent, appData]);

  const claimBadge = () => {
    const bId = unlockedQueue[0]; const b = BADGES[bId]; const updates = {};
    updates[`badges/${activeStudent}/${bId}`] = true;
    if (b.rew) {
        updates[`wallet/${activeStudent}`] = (Number(appData.wallet?.[activeStudent]) || 0) + b.rew;
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        updates[`transactions/${activeStudent}/${tId}`] = { desc: `Rozet Ödülü: ${b.name}`, amt: b.rew, date: new Date().toLocaleString('tr-TR') };
    }
    db.ref('mavikent_premium').update(updates); setUnlockedQueue(prev => prev.slice(1));
  };

  const handleStudentLogin = () => {
      const creds = appData?.student_credentials || {};
      const foundStudentName = Object.keys(creds).find(name => { const c = creds[name]; if(c && typeof c === 'object') return String(c.username||'').trim() === String(loginUser).trim() && String(c.password||'').trim() === String(loginPass).trim(); return false; });
      if (foundStudentName) { setActiveStudent(foundStudentName); setShowLoginModal(false); setLoginUser(''); setLoginPass(''); } 
      else { alert("Kullanıcı Adı veya Şifre Hatalı!"); setLoginPass(''); }
  };

  const handleSendMessage = () => {
      if(!messageText.trim()) return alert("Mesaj boş olamaz!");
      db.ref('mavikent_premium/messages').push({ sender: safeName, text: messageText, date: new Date().toLocaleString('tr-TR') });
      alert('✅ Mesajınız yöneticiye başarıyla iletildi!');
      setMessageText(''); setShowMessageModal(false);
  };

  const handleRedeemGiftCode = () => {
      const codeKey = giftCodeInput.toUpperCase().trim();
      const codeData = appData?.gift_codes?.[codeKey];
      if(!codeData) return alert("❌ Geçersiz veya hatalı bir kod girdiniz!");
      if(codeData.usedBy && codeData.usedBy[safeName]) return alert("⚠️ Bu kodu zaten daha önce kullandın uyanık!");
      const usedCount = Object.keys(codeData.usedBy || {}).length;
      if(usedCount >= codeData.uses) return alert("😔 Maalesef bu kodun kullanım sınırı dolmuş.");

      const updates = {};
      updates[`gift_codes/${codeKey}/usedBy/${safeName}`] = true;

      if(codeData.type === 'mcoin') {
          updates[`wallet/${safeName}`] = mCoin + Number(codeData.val);
          const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          updates[`transactions/${safeName}/${tId}`] = { desc: `Hediye Kodu Kullanımı (${codeKey})`, amt: Number(codeData.val), date: new Date().toLocaleString('tr-TR') };
          alert(`🎉 BİNGÖ! Kod başarıyla onaylandı ve ${codeData.val} M-Coin hesabına yattı!`);
      } else if(codeData.type === 'discount') {
          updates[`active_discounts/${safeName}`] = { value: Number(codeData.val), expiry: Date.now() + (7 * 24 * 60 * 60 * 1000) };
          alert(`🔥 HARİKA! %${codeData.val} Bayram İndirimi hesabına tanımlandı. Kullanmak için tam 7 günün var, süreyi kaçırma!`);
      }
      db.ref('mavikent_premium').update(updates);
      setShowGiftModal(false); setGiftCodeInput('');
  };

  const getDetailedLevelInfo = (xp) => { const safeXp = Number(xp) || 0; const level = Math.floor(Math.sqrt(safeXp / 50)) + 1; const currentLevelBaseXp = Math.pow(level - 1, 2) * 50; const nextLevelBaseXp = Math.pow(level, 2) * 50; const progress = ((safeXp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp)) * 100; return { level, progress: Math.min(100, Math.max(0, progress)), currentXp: safeXp, nextLevelXp: nextLevelBaseXp }; };
  const getRankBadge = (rpVal) => { const rp = Number(rpVal) || 0; if (rp >= 1000) return { name: 'Fatih', icon: '👑', color: '#ff3b30' }; if (rp >= 750) return { name: 'Elmas', icon: '💎', color: '#3b82f6' }; if (rp >= 500) return { name: 'Altın', icon: '🥇', color: '#f59e0b' }; if (rp >= 250) return { name: 'Gümüş', icon: '🥈', color: '#64748b' }; return { name: 'Bronz', icon: '🥉', color: '#b45309' }; };
  const getAllRankings = (metric) => { return roster.map(n => { let val = 0; if(metric === 'rp') val = Number(appData?.season_score?.[n] || 0); if(metric === 'wealth') val = Number(appData?.wallet?.[n] || 0); return { n: String(n), val }; }).sort((a,b) => b.val - a.val); };

  let publicProducts = []; if (appData?.market_products) { publicProducts = Object.keys(appData?.market_products || {}).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0)); }
  const quests = appData?.quests || {};

  const rpSorted = roster.map(n => ({ n: String(n), rp: Number(appData?.season_score?.[n] || 0) })).sort((a,b) => b.rp - a.rp);
  const myRpRank = rpSorted.findIndex(s => s.n === safeName) + 1 || '-';
  const wealthSorted = roster.map(n => ({ n: String(n), w: Number(appData?.wallet?.[n] || 0) })).sort((a,b) => b.w - a.w);
  const myWealthRank = wealthSorted.findIndex(s => s.n === safeName) + 1 || '-';

  if (!activeStudent) {
    return (
      <div className="fade-in" style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
          * { font-family: 'Outfit', sans-serif; outline: none !important; }
          
          /* EKSİK OLAN ANIMASYONLAR EKLENDİ */
          @keyframes tickerScroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
          @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
          
          .fade-in { animation: fadeIn 0.4s ease-out; }
          .ticker-content { display: inline-block; white-space: nowrap; animation: tickerScroll 25s linear infinite; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
          .elite-card { background: #ffffff; border-radius: 28px; padding: 30px 15px; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.05); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #f1f5f9; cursor: pointer; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important; min-height: 180px; position: relative; z-index: 10; }
          .elite-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -5px rgba(15, 23, 42, 0.1); border-color: #e2e8f0; }
          .elite-card:active { transform: scale(0.96); }
          button { border: none !important; outline: none !important; cursor: pointer; }
          .btn-gold { background: linear-gradient(135deg, #d4af37 0%, #b45309 100%); color: white; padding: 16px 28px; border-radius: 50px; font-weight: 800; font-size: 16px; cursor: pointer; box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3); transition: all 0.2s; }
          .btn-gold:active { transform: scale(0.95); }
          .btn-nav { background: #ffffff; color: #0f172a; border: 2px solid #e2e8f0 !important; padding: 10px 20px; border-radius: 50px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
          .btn-nav:hover { border-color: #0f172a !important; }
          .grid-2 { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
          .grid-6 { display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
        `}</style>
        <div style={{ background: '#ffffff', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #f1f5f9' }}>
           <div style={{ flex: 1 }}><button className="btn-nav" onClick={goBackToRoles}><span style={{ fontSize: '18px', marginTop: '-2px' }}>←</span> Geri Dön</button></div>
           <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span style={{ fontWeight: 900, fontSize: '24px', color: '#0f172a', letterSpacing: '-0.5px' }}>MAVİKENT</span><span style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(212,175,55,0.3)' }}>ELITE</span></div>
           <div style={{ flex: 1 }}></div>
        </div>
        <div style={{ background: '#0f172a', padding: '14px 24px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
           <div style={{ background: '#d4af37', color: '#0f172a', padding: '6px 16px', borderRadius: '10px', marginRight: '20px', fontSize: '13px', fontWeight: 900, zIndex: 2, position: 'relative', whiteSpace: 'nowrap' }}>DUYURU</div>
           <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}><div className="ticker-content" style={{ color: '#ffffff' }}>{appData?.settings?.news_ticker || 'Mavikent Elite Sistemine Hoş Geldiniz.'}</div></div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', letterSpacing: '-1px' }}>Genel Bakış</h1><p style={{ fontSize: '15px', color: '#64748b', marginBottom: '35px', fontWeight: 500 }}>Yurdun en güncel istatistikleri ve kuralları.</p>
            <div className="grid-2" style={{ marginBottom: '50px' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '30px', borderRadius: '32px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)', color: 'white', position: 'relative', overflow: 'hidden' }}><div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '100px', opacity: 0.05 }}>📢</div><div style={{ color: '#d4af37', fontWeight: 900, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px' }}>ÖNEMLİ BİLDİRİM</div><div style={{ fontSize: '16px', lineHeight: '1.6', fontWeight: 500, color: '#f8fafc' }}>{appData?.settings?.ann1 || 'Şu an için genel bir duyuru bulunmamaktadır.'}</div></div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}><div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '100px', opacity: 0.03 }}>⚠️</div><div style={{ color: '#3b82f6', fontWeight: 900, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px' }}>GÜNCEL BİLGİ</div><div style={{ fontSize: '16px', lineHeight: '1.6', fontWeight: 600, color: '#334155' }}>{appData?.settings?.ann2 || 'Kurallara uymayı ve görevleri takip etmeyi unutmayın.'}</div></div>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginBottom: '25px', letterSpacing: '-0.5px' }}>İnteraktif Paneller</h2>
            <div className="grid-6">
                <div className="elite-card" onClick={() => setShowLoginModal(true)} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}><div style={{ background: 'rgba(255,255,255,0.1)', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px', color: '#d4af37' }}>🔑</div><h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Öğrenci Girişi</h3><p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>Sisteme bağlanın</p></div>
                <div className="elite-card" onClick={() => setFullListView('rp')}><div style={{ background: '#fef3c7', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>⚔️</div><h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>RP Liderleri</h3><p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sezonun en iyileri</p></div>
                <div className="elite-card" onClick={() => setFullListView('clans')}><div style={{ background: '#fee2e2', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>🚩</div><h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Klanlar</h3><p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Savaş Sıralaması</p></div>
                <div className="elite-card" onClick={() => setFullListView('wealth')}><div style={{ background: '#ecfdf5', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>💳</div><h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Zenginler</h3><p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>M-Coin listesi</p></div>
                <div className="elite-card" onClick={() => setShowPublicQuests(true)}><div style={{ background: '#eff6ff', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>🎯</div><h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Görevler</h3><p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Güncel hedefler</p></div>
                <div className="elite-card" onClick={() => setShowPublicMarket(true)}><div style={{ background: '#f5f3ff', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>🛍️</div><h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Market Vitrini</h3><p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Ödüllere göz at</p></div>
            </div>
        </div>

        {/* TÜM MODALLAR (BURASI AYNEN KORUNDU) */}
        {fullListView && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(5px)' }}>
             <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', borderRadius: '32px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', animation: 'popIn 0.3s forwards' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}><h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{fullListView === 'rp' ? '🏆 RP Liderleri' : fullListView === 'wealth' ? '💳 M-Coin Zenginleri' : '🚩 Klan Savaşları'}</h2><button onClick={() => setFullListView(null)} className="btn-nav">Kapat</button></div>
                {fullListView === 'clans' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {clanScores.length > 0 ? clanScores.map((c, idx) => (
                           <div key={c.id} onClick={() => setSelectedClan(c)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ fontSize: '18px', fontWeight: 900, color: idx === 0 ? '#ef4444' : '#94a3b8', width: '25px', textAlign: 'center' }}>#{idx+1}</span><span style={{ fontSize: '30px' }}>{c.icon}</span><div><div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{c.name} <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', color: '#64748b' }}>{c.tag}</span></div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{(c.members || []).length}/3 Üye</div></div></div>
                              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '20px', fontWeight: 900, color: '#ef4444' }}>{c.warScore} <span style={{fontSize:'11px', color:'#64748b'}}>SVŞ P.</span></div></div>
                           </div>
                        )) : <div style={{ textAlign:'center', color:'#64748b', padding:'20px', fontWeight:700 }}>Henüz klan kurulmamış.</div>}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {getAllRankings(fullListView).map((s, idx) => {
                          const badge = fullListView === 'rp' ? getRankBadge(s.val) : null;
                          return ( <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ fontSize: '18px', fontWeight: 900, color: idx < 3 ? '#0f172a' : '#94a3b8', width: '25px', textAlign: 'center' }}>{idx + 1}.</span><div><div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{s.n}</div>{badge && <div style={{ fontSize: '11px', color: badge.color, fontWeight: 800, marginTop: '4px' }}>{badge.icon} {badge.name}</div>}</div></div><div style={{ fontSize: '18px', fontWeight: 900, color: fullListView === 'rp' ? '#0f172a' : '#10b981' }}>{s.val} <span style={{fontSize:'12px', color:'#64748b'}}>{fullListView === 'rp' ? 'RP' : 'M'}</span></div></div> )
                       })}
                    </div>
                )}
             </div>
          </div>
        )}

        {selectedClan && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '400px', padding: '40px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards', position: 'relative', textAlign: 'center' }}>
                 <button onClick={() => setSelectedClan(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50px', width: '40px', height: '40px', fontSize: '16px', fontWeight: 900, color: '#64748b', cursor: 'pointer' }}>✕</button>
                 <div style={{ fontSize: '60px', marginBottom: '10px' }}>{selectedClan.icon}</div>
                 <h2 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{selectedClan.name} <span style={{ fontSize: '14px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', verticalAlign: 'middle', color: '#64748b' }}>{selectedClan.tag}</span></h2>
                 <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, fontStyle: 'italic', marginBottom: '25px' }}>"{selectedClan.desc}"</p>
                 <div style={{ width: '100%', textAlign: 'left', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                     <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900, fontSize: '16px' }}>👥 Klan Üyeleri</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(selectedClan.members || []).map(m => (
                            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{String(m).split(' ')[0]} {selectedClan.leader === m ? '👑' : ''}</span>
                                <span style={{ fontWeight: 900, color: '#3b82f6', fontSize: '14px' }}>{appData?.season_score?.[m] || 0} RP</span>
                            </div>
                        ))}
                     </div>
                 </div>
              </div>
            </div>
        )}

        {showPublicQuests && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(5px)' }}>
             <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', borderRadius: '32px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', animation: 'popIn 0.3s forwards' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}><h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>🎯 Aktif Görevler</h2><button onClick={() => setShowPublicQuests(false)} className="btn-nav">Kapat</button></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {['q1', 'q2', 'q3'].map(qId => {
                      const q = quests[qId]; if (!q || !q.text) return null; const parts = q.participants || [];
                      return ( <div key={qId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}><div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: '1.4' }}>{q.text}</div><div style={{ background: '#d4af37', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap', marginLeft: '12px' }}>+{q.amt} {q.type}</div></div><div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}><span style={{ fontWeight: 800, color: '#0f172a' }}>👥 Katılanlar ({parts.length}): </span>{parts.length > 0 ? parts.map(n => String(n).split(' ')[0]).join(', ') : 'Henüz katılan yok.'}</div></div> )
                   })}
                </div>
             </div>
          </div>
        )}

        {showPublicMarket && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(5px)' }}>
             <div style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '32px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', animation: 'popIn 0.3s forwards' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}><h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>🛍️ Market Vitrini</h2><button onClick={() => setShowPublicMarket(false)} className="btn-nav">Kapat</button></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                   <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px', borderRadius: '24px', textAlign: 'center', color: 'white', boxShadow: '0 10px 20px rgba(15,23,42,0.2)' }}><div style={{ fontSize: '42px', marginBottom: '12px' }}>🎟️</div><div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px' }}>Çekiliş Bileti</div><div style={{ background: '#d4af37', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>20 M</div></div>
                   {publicProducts.map(p => (<div key={p.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><div style={{ fontSize: '42px', marginBottom: '12px' }}>{p.i || '📦'}</div><div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>{p.n}</div><div style={{ background: 'white', border: '2px solid #e2e8f0', color: '#0f172a', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>{p.p} M</div></div>))}
                </div>
             </div>
          </div>
        )}

        {showLoginModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center', padding: '40px 30px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards' }}>
              <div style={{ fontSize: '50px', marginBottom: '16px' }}>🎓</div><h2 style={{ fontWeight: 900, margin: '0 0 8px 0', fontSize: '26px', color: '#0f172a', letterSpacing: '-0.5px' }}>Öğrenci Girişi</h2><p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px', fontWeight: 500 }}>Sisteme erişmek için bilgilerinizi girin.</p>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Kullanıcı Adı" style={{ width: '100%', padding: '16px 20px', borderRadius: '20px', border: '2px solid #e2e8f0', background: '#f8fafc', marginBottom: '12px', fontSize: '15px', fontWeight: '700', outline: 'none', color: '#0f172a', transition: '0.3s' }} onFocus={e => {e.target.style.borderColor='#3b82f6'; e.target.style.background='#fff'}} onBlur={e => {e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'}} />
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleStudentLogin(); }} placeholder="Şifre" style={{ width: '100%', padding: '16px 20px', borderRadius: '20px', border: '2px solid #e2e8f0', background: '#f8fafc', marginBottom: '30px', fontSize: '15px', fontWeight: '700', outline: 'none', color: '#0f172a', transition: '0.3s' }} onFocus={e => {e.target.style.borderColor='#3b82f6'; e.target.style.background='#fff'}} onBlur={e => {e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'}} />
              <button onClick={handleStudentLogin} className="btn-gold" style={{ width: '100%', marginBottom: '12px' }}>GİRİŞ YAP</button>
              <button onClick={() => setShowLoginModal(false)} style={{ width: '100%', padding: '16px', border: 'none', background: 'transparent', color: '#64748b', fontSize: '15px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>Vazgeç</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleCreateClan = () => {
      if(mCoin < 50) return alert("Klan kurmak için 50 M-Coin'e ihtiyacın var!");
      if(!newClan.name || !newClan.tag) return alert("Klan adı ve kısaltması (TAG) zorunludur.");
      if(newClan.tag.length > 4) return alert("Klan TAG'ı en fazla 4 harf olabilir.");
      const cId = `clan_${Date.now()}`; const updates = {};
      updates[`wallet/${safeName}`] = mCoin - 50;
      updates[`transactions/${safeName}/txn_clan_${Date.now()}`] = { desc: `Klan Kurulum Bedeli (${newClan.name})`, amt: -50, date: new Date().toLocaleString('tr-TR') };
      updates[`clans/${cId}`] = { name: newClan.name.toUpperCase(), tag: newClan.tag.toUpperCase(), icon: newClan.icon, desc: newClan.desc, leader: safeName, members: [safeName] };
      db.ref('mavikent_premium').update(updates); alert(`🛡️ ${newClan.name} klanı başarıyla kuruldu!`); setShowCreateClan(false);
  };

  const handleInviteUser = () => {
      if(!inviteUser) return;
      const targetName = Object.keys(appData?.student_credentials || {}).find(n => String(appData.student_credentials[n]?.username||'').trim() === String(inviteUser).trim());
      if(!targetName) return alert("Bu kullanıcı adına sahip bir öğrenci bulunamadı!");
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

  const firstName = safeName.split(' ')[0] || 'Öğrenci';
  const xpDetail = getDetailedLevelInfo(appData?.xp?.[safeName]);
  const mCoin = Number(appData?.wallet?.[safeName] || 0);
  const myRp = Number(appData?.season_score?.[safeName] || 0);
  const myBadge = getRankBadge(myRp);
  const isEliteStud = appData?.student_tiers?.[safeName] === 'elite';
  const myCosmetics = appData?.active_cards?.[safeName] || {};
  const myTickets = Number(appData?.tickets?.[safeName] || 0);
  const myEarnedBadges = appData?.badges?.[safeName] || {};
  const myPinnedBadges = appData?.pinned_badges?.[safeName] || [];
  
  // BANKA (İŞLEM) GEÇMİŞİ VERİLERİ
  const myTransactions = appData?.transactions?.[safeName] || {};
  const sortedTxns = Object.keys(myTransactions).map(k => ({ id: k, ...myTransactions[k] })).sort((a,b) => b.id.localeCompare(a.id));

  const myDiscountObj = appData?.active_discounts?.[safeName];
  const isPersonalDiscountActive = myDiscountObj && myDiscountObj.expiry > Date.now();
  const personalDiscountVal = isPersonalDiscountActive ? Number(myDiscountObj.value) : 0;
  const remainingDiscountDays = isPersonalDiscountActive ? Math.ceil((myDiscountObj.expiry - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  let currentActiveDiscountPercent = 0;
  if (appData?.settings?.global_event === 'discount') currentActiveDiscountPercent = 20;
  if (isEliteStud && currentActiveDiscountPercent < 10) currentActiveDiscountPercent = 10;
  if (isPersonalDiscountActive && personalDiscountVal > currentActiveDiscountPercent) currentActiveDiscountPercent = personalDiscountVal;

  const activeFrame = myCosmetics?.frame?.val || '';
  let avatarStyle = { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', fontSize: '40px' };
  if (activeFrame.includes('Fatih')) { avatarStyle.border = '4px solid #ff3b30'; avatarStyle.boxShadow = '0 0 20px rgba(255,59,48,0.3)'; }
  else if (activeFrame.includes('Elmas')) { avatarStyle.border = '4px solid #3b82f6'; avatarStyle.boxShadow = '0 0 20px rgba(59,130,246,0.3)'; }
  else if (activeFrame.includes('Altın')) { avatarStyle.border = '4px solid #d4af37'; }

  const isGlobal2X = appData?.settings?.global_event === '2x_xp';
  const is2XActive = (myCosmetics?.multiplier?.date === new Date().toDateString()) || isGlobal2X;
  const hasStreak = myCosmetics?.streak?.date === new Date().toDateString();

  const products = Object.keys(appData?.market_products || {}).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0));

  const togglePin = (bId) => { let pinned = [...myPinnedBadges]; if (pinned.includes(bId)) { pinned = pinned.filter(id => id !== bId); } else { if (pinned.length >= 3) return alert("En fazla 3 rozet sabitleyebilirsin!"); pinned.push(bId); } db.ref(`mavikent_premium/pinned_badges/${safeName}`).set(pinned); };
  
  const handleBuy = (item) => {
     let price = Number(item.p || 0); 
     let finalPrice = Math.ceil(price * (1 - currentActiveDiscountPercent / 100));
     if (mCoin < finalPrice) return alert(`❌ Bakiyen yetersiz! En az ${finalPrice} M gerekli.`);
     if (window.confirm(`${item.n} ürününü ${finalPrice} M karşılığında almak istiyor musun?`)) { 
         const updates = {}; updates[`wallet/${safeName}`] = mCoin - finalPrice;
         updates[`transactions/${safeName}/txn_buy_${Date.now()}`] = { desc: `Market Alışverişi: ${item.n}`, amt: -finalPrice, date: new Date().toLocaleString('tr-TR') };
         
         if (isPersonalDiscountActive && currentActiveDiscountPercent === personalDiscountVal) { updates[`active_discounts/${safeName}`] = null; alert("✅ Satın alındı! (Özel Bayram İndirimi kullanıldı ve bitti)"); } 
         else { alert("✅ Satın alındı! Lütfen envanterinden takip et."); }
         db.ref('mavikent_premium/deliveries').push({ s: safeName, i: item.n, st: 'wait', type: item.type || 'normal', val: item.val || item.i, date: new Date().toLocaleDateString('tr-TR') }); 
         db.ref('mavikent_premium').update(updates);
     }
  };

  const buyTicket = () => { 
      const ticketPrice = Math.ceil(20 * (1 - currentActiveDiscountPercent / 100));
      if (mCoin < ticketPrice) return alert(`Yetersiz M! En az ${ticketPrice} M gerekli.`); 
      db.ref(`mavikent_premium/wallet/${safeName}`).transaction(c => (Number(c)||0) - ticketPrice); 
      db.ref(`mavikent_premium/tickets/${safeName}`).transaction(c => (Number(c)||0) + 1); 
      db.ref(`mavikent_premium/transactions/${safeName}`).push({ desc: 'Şans Çarkı Bileti Satın Alımı', amt: -ticketPrice, date: new Date().toLocaleString('tr-TR') });
      alert("🎟️ Bilet alındı! Artık Ana Sayfa'dan çarkı çevirebilirsin."); 
  };
  
  const rollLottery = () => {
      if (myTickets <= 0) return alert("Biletin yok! Marketten bilet satın alabilir veya haftalık hediye biletini bekleyebilirsin.");
      
      const excluded = ['KULAKLIK', 'SAAT', 'FORMA', 'KRAMPON', 'ÇİKOLATA', 'EVİM', 'AKILLI'];
      let drawItems = products.filter(p => p.n !== "Çekiliş Bileti" && (p.type === 'normal' || !p.type) && !excluded.some(kw => String(p.n).toUpperCase().includes(kw)));
      
      if (drawItems.length === 0) return alert("Şu an çark havuzunda uygun ürün bulunmuyor.");

      const rankMultiplier = 1 + ((roster.length || 1) - (myRpRank !== '-' ? myRpRank : 1)) / (roster.length || 1); 
      let weightedArray = []; 
      drawItems.forEach(item => { 
          let weight = (1000 / (Number(item.p) || 10)); 
          if (item.p >= 30) weight = weight * Math.pow(rankMultiplier, 3); 
          weightedArray.push({ ...item, weight }); 
      });
      
      let totalWeight = weightedArray.reduce((acc, curr) => acc + curr.weight, 0); 
      let randomNum = Math.random() * totalWeight; 
      let selectedPrize = weightedArray[0];
      for (let item of weightedArray) { if (randomNum < item.weight) { selectedPrize = item; break; } randomNum -= item.weight; }
      
      db.ref(`mavikent_premium/tickets/${safeName}`).transaction(c => Math.max(0, (Number(c)||0) - 1));
      setLotteryState({ active: true, result: selectedPrize, spinning: true, currentDisplay: '❓', speed: 100 });
      let spins = 0; let currentSpeed = 100;
      const spinLoop = () => { 
          setLotteryState(prev => ({ ...prev, currentDisplay: drawItems[Math.floor(Math.random() * drawItems.length)].i || '🎁', speed: currentSpeed })); 
          spins++; 
          if (spins < 15) currentSpeed = Math.max(30, currentSpeed - 10); else if (spins > 25) currentSpeed += 20; 
          if (spins < 40) { setTimeout(spinLoop, currentSpeed); } 
          else { 
              setLotteryState({ active: true, result: selectedPrize, spinning: false, currentDisplay: selectedPrize.i || '🎁', speed: currentSpeed }); 
              db.ref('mavikent_premium/deliveries').push({ s: safeName, i: selectedPrize.n + " (Çekiliş)", st: 'wait', type: selectedPrize.type || 'normal', val: selectedPrize.val || selectedPrize.i, date: new Date().toLocaleDateString('tr-TR') }); 
          } 
      };
      setTimeout(spinLoop, currentSpeed);
  };

  const activateItem = (delKey, item) => {
      const today = new Date().toDateString(); const exp = Date.now() + 14 * 24 * 60 * 60 * 1000; const updates = {};
      const iType = String(item.type || '').toLowerCase(); const iName = String(item.n || '').toUpperCase(); const iIcon = String(item.i || '').toUpperCase();
      if (iType === 'multiplier' || iName.includes("2X") || iName.includes("2 X") || iName.includes("ÇARPAN") || iIcon.includes("2X")) { updates[`active_cards/${safeName}/multiplier`] = { date: today, val: "2X" }; alert("⚡ 2X Puan Kartı bugün için aktif edildi! Bugün alacağın tüm puanlar 2 ile çarpılacak."); } 
      else if (iType === 'streak' || iName.includes("KORUMA") || iName.includes("SERİ") || iName.includes("KALKAN") || iIcon.includes("🛡️")) { updates[`active_cards/${safeName}/streak`] = { date: today, val: "aktif" }; alert("🛡️ Seri Koruma Kalkanı aktif! Bugün alacağın ilk eksi notta serin bozulmayacak."); }
      else if (iType === 'avatar' || iType === 'title' || iType === 'frame') { updates[`active_cards/${safeName}/${iType}`] = { val: item.val || item.i, exp: exp }; alert("✨ Kozmetik özellik başarıyla profiline eklendi."); } 
      else if (iName.includes("KUTU") || iIcon.includes("🎁") || iName.includes("SÜRPRİZ")) { const prize = products[Math.floor(Math.random()*products.length)]; updates[`deliveries/${db.ref().push().key}`] = { s: safeName, i: (prize?.n || 'Sürpriz') + " (Kutudan)", st: 'wait', type: prize?.type || 'normal', val: prize?.val || prize?.i, date: new Date().toLocaleDateString('tr-TR') }; alert(`🎁 Kutuyu açtın ve içinden ${prize?.n || 'Ödül'} çıktı! Onay için envanterine eklendi.`); } 
      else { alert(`✅ ${item.i || '📦'} ${item.n} eşyası teslim alındı.`); }
      updates[`deliveries/${delKey}`] = null; db.ref('mavikent_premium').update(updates);
  };

  const getNavStyle = (tab) => ({ flex: 1, border: 'none', background: activeTab === tab ? '#ffffff' : 'transparent', color: activeTab === tab ? '#0f172a' : '#64748b', fontWeight: activeTab === tab ? 900 : 700, cursor: 'pointer', padding: '14px 0', borderRadius: '50px', fontSize: '14px', outline: 'none', boxShadow: activeTab === tab ? '0 10px 20px -5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.3s' });

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px', paddingBottom: '140px', fontFamily: "'Outfit', sans-serif", outline: 'none' }}>
      <style>{`
        @keyframes badgePulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); } }
        .badge-glow { animation: badgePulse 2s infinite; border: 2px solid #d4af37 !important; background: #fffbeb !important; }
        .profile-btn { border: none; cursor: pointer; transition: all 0.2s; outline: none; border-radius: 50px; display:inline-flex; align-items:center; justify-content:center; font-weight:800;}
        .profile-btn:active { transform: scale(0.95); }
        .elite-input { outline: none !important; border: 2px solid #e2e8f0 !important; transition: all 0.2s; padding: 14px 20px; border-radius: 20px; width: 100%; font-weight: 700; color: #0f172a; background: #f8fafc; }
        .elite-input:focus { border-color: #3b82f6 !important; background: #ffffff; box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important; }
        .clean-scroll::-webkit-scrollbar { width: 6px; } .clean-scroll::-webkit-scrollbar-track { background: transparent; } .clean-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .grid-mobile-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      {/* CÜZDAN GEÇMİŞİ (BANKA DEKONTU) MODALI */}
      {showTxnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards', overflow: 'hidden' }}>
             <div style={{ padding: '30px 30px 20px 30px', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>💳 Cüzdan Geçmişi</h2><div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Hesap Özeti ve Harcamalar</div></div>
                <button onClick={() => setShowTxnModal(false)} className="profile-btn" style={{ background: '#f1f5f9', padding: '10px 15px', color: '#64748b' }}>✕</button>
             </div>
             <div className="clean-scroll" style={{ padding: '20px 30px', overflowY: 'auto', flex: 1 }}>
                {sortedTxns.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 700, padding: '40px 0' }}>Henüz hesap hareketi bulunmuyor.</div> : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sortedTxns.map(t => (
                         <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div>
                               <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', lineHeight: '1.3' }}>{t.desc}</div>
                               <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{t.date}</div>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: t.amt > 0 ? '#10b981' : '#ef4444', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                               {t.amt > 0 ? '+' : ''}{t.amt} M
                            </div>
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
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>✉️ Yöneticiye Mesaj</h2><button onClick={() => setShowMessageModal(false)} className="profile-btn" style={{ background: '#f1f5f9', padding: '10px 15px', color: '#64748b' }}>✕</button></div>
             <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Öneri, şikayet veya taleplerini yöneticiye doğrudan iletebilirsin.</p>
             <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Mesajınızı buraya yazın..." className="elite-input clean-scroll" style={{ height: '120px', resize: 'none', marginBottom: '25px' }} />
             <button onClick={handleSendMessage} className="profile-btn" style={{ width: '100%', background: '#0f172a', color: 'white', padding: '16px', fontSize: '16px' }}>MESAJI GÖNDER</button>
          </div>
        </div>
      )}

      {showGiftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '400px', padding: '40px 30px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards', textAlign: 'center' }}>
             <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}><button onClick={() => setShowGiftModal(false)} className="profile-btn" style={{ background: '#f1f5f9', padding: '10px 15px', color: '#64748b' }}>✕</button></div>
             <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎁</div>
             <h2 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>Hediye Kodu</h2>
             <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '25px', fontWeight: 600 }}>Yöneticinin paylaştığı veya bulduğun sürpriz kodu buraya gir.</p>
             <input type="text" value={giftCodeInput} onChange={e => setGiftCodeInput(e.target.value)} placeholder="Örn: BAYRAM50" className="elite-input" style={{ marginBottom: '25px', textTransform: 'uppercase', textAlign: 'center', fontSize: '20px', letterSpacing: '2px' }} />
             <button onClick={handleRedeemGiftCode} className="profile-btn" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '16px', fontSize: '16px' }}>KODU KULLAN</button>
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
             <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 30px 0', fontWeight: 600 }}>Ödül aranıyor...</p>
             <div style={{ fontSize: '70px', margin: '0 auto 30px auto', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '50%', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: lotteryState.spinning ? '0 0 30px rgba(212,175,55,0.4)' : 'none', transition: '0.3s' }}>{lotteryState.currentDisplay}</div>
             {!lotteryState.spinning ? (
               <div className="fade-in"><div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>{lotteryState.result?.n}</div><div style={{ fontSize: '14px', color: '#64748b', marginBottom: '25px', fontWeight: 600 }}>Envanterine eklendi.</div><button onClick={() => setLotteryState({active:false})} className="profile-btn" style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: 'white', width: '100%', padding: '16px', fontSize: '16px' }}>KAPAT</button></div>
             ) : <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Bekleyin...</div>}
          </div>
        </div>
      )}

      {showBadgesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '35px 25px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.3s forwards' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}><h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>🏆 Kupa Vitrini</h2><button onClick={() => setShowBadgesModal(false)} className="profile-btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '10px 20px' }}>Kapat</button></div>
             <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '25px', fontWeight: 600, textAlign: 'center' }}>Kazandığın rozetlere tıklayarak profiline sabitleyebilirsin. (Max 3)</p>
             <div className="grid-mobile-2">
                {Object.keys(BADGES).map(key => {
                   const b = BADGES[key]; const isUnlocked = myEarnedBadges[key]; const isPinned = myPinnedBadges.includes(key);
                   if (b.isSecret && !isUnlocked) return (<div key={key} style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '20px 15px', borderRadius: '20px', textAlign: 'center', opacity: 0.6 }}><div style={{ fontSize: '35px', filter: 'grayscale(100%)', marginBottom: '10px' }}>❓</div><div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b' }}>Gizli Başarım</div></div>);
                   return (
                      <div key={key} onClick={() => { if(isUnlocked) togglePin(key); }} className={isUnlocked ? 'profile-btn' : ''} style={{ background: isUnlocked ? (isPinned ? '#fffbeb' : '#ffffff') : '#f8fafc', border: `2px solid ${isPinned ? '#f59e0b' : (isUnlocked ? '#e2e8f0' : 'transparent')}`, padding: '20px 15px', borderRadius: '20px', textAlign: 'center', opacity: isUnlocked ? 1 : 0.4, boxShadow: isUnlocked ? '0 10px 20px -5px rgba(0,0,0,0.05)' : 'none', position: 'relative', width: '100%' }}>
                         {isPinned && <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 900 }}>SABİT</div>}
                         <div style={{ fontSize: '40px', filter: isUnlocked ? 'none' : 'grayscale(100%)', marginBottom: '12px' }}>{b.icon}</div>
                         <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', marginBottom: '6px', lineHeight: '1.2' }}>{b.name}</div>
                         <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, lineHeight: '1.4' }}>{b.desc}</div>
                      </div>
                   )
                })}
             </div>
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
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 800, marginBottom: '25px', background: '#f1f5f9', padding: '6px 16px', borderRadius: '12px' }}>{appData?.active_cards?.[viewProfile]?.title?.val || 'Öğrenci'} • Seviye {getDetailedLevelInfo(appData?.xp?.[viewProfile]).level}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', marginBottom: '30px' }}>
                   <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '20px', border: '1px solid #fde68a' }}><div style={{ fontSize: '12px', color: '#b45309', fontWeight: 800, marginBottom: '4px' }}>RP PUANI</div><div style={{ fontSize: '22px', fontWeight: 900, color: '#92400e' }}>{appData?.season_score?.[viewProfile] || 0}</div></div>
                   <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '20px', border: '1px solid #a7f3d0' }}><div style={{ fontSize: '12px', color: '#047857', fontWeight: 800, marginBottom: '4px' }}>M-COIN</div><div style={{ fontSize: '22px', fontWeight: 900, color: '#064e3b' }}>{appData?.wallet?.[viewProfile] || 0}</div></div>
                </div>
                <div style={{ width: '100%', textAlign: 'left' }}>
                   <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900, fontSize: '16px' }}>🏆 Kazanılan Rozetler</h4>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {Object.keys(appData?.badges?.[viewProfile] || {}).length > 0 ? ( Object.keys(appData?.badges?.[viewProfile]).map(bId => ( <div key={bId} title={BADGES[bId]?.name} style={{ fontSize: '28px', background: '#fffbeb', border: '2px solid #fde047', padding: '10px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{BADGES[bId]?.icon}</div> )) ) : <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Henüz rozet kazanmadı.</div>}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', paddingTop: '10px' }}>
          <div><div style={{ fontSize: '12px', color: '#d4af37', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>HOŞ GELDİN</div><div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', color: '#0f172a' }}>{firstName}</div></div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div onClick={() => setShowTxnModal(true)} className="profile-btn" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: '50px', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)', cursor: 'pointer' }}><span>🪙</span> {mCoin} M</div>
            <button onClick={() => setActiveStudent(null)} className="profile-btn" style={{ background: '#ef4444', color: 'white', padding: '12px 24px', fontWeight: 800, fontSize: '15px' }}>Çıkış</button>
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
                     <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}><span style={{ background: myBadge.color, color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>{myBadge.icon} {myBadge.name}</span>{myCosmetics.title?.val || 'Öğrenci'}</div>
                     <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {is2XActive && <span style={{ color: 'white', fontWeight: 900, fontSize: '11px', background: 'linear-gradient(135deg, #f59e0b, #b45309)', padding: '6px 12px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(245,158,11,0.3)' }}>⚡ {isGlobal2X ? 'TÜM YURT 2X' : '2X AKTİF'}</span>}
                        {hasStreak && <span style={{ color: 'white', fontWeight: 900, fontSize: '11px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '6px 12px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>🛡️ SERİ KORUMA AKTİF</span>}
                     </div>
                   </div>
                </div>

                <div className="grid-mobile-2" style={{ marginBottom: '25px' }}>
                    <div style={{ background: '#fef3c7', borderRadius: '20px', padding: '20px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#b45309' }}>🏆 RP SIRALAMASI</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#92400e' }}>{myRpRank}.</span></div>
                    <div style={{ background: '#ecfdf5', borderRadius: '20px', padding: '20px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>💳 ZENGİNLİK (M)</span><span style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b' }}>{myWealthRank}.</span></div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Seviye {xpDetail.level}</span><span style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>Seviye {xpDetail.level + 1}</span></div>
                   <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}><div style={{ background: 'linear-gradient(90deg, #3b82f6, #0ea5e9)', width: `${xpDetail.progress}%`, height: '100%', borderRadius: '10px', transition: 'width 0.5s ease-out' }}></div></div>
                   <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}><span style={{ color: '#0f172a', fontWeight: 900 }}>{xpDetail.currentXp} XP</span> / {xpDetail.nextLevelXp} XP</div>
                </div>

                <div style={{ marginTop: '25px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px', padding: '25px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(15,23,42,0.3)' }}>
                   <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎰</div>
                   <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: 900 }}>Şans Çarkı</h3>
                   <p style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Biletinle çarkı çevir, RP sıralamana göre sürpriz ödülleri kap!</p>
                   <button onClick={rollLottery} className="profile-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', padding: '16px 30px', fontSize: '16px', fontWeight: 900, width: '100%' }}>
                      ÇARK ÇEVİR ({myTickets} BİLET)
                   </button>
                </div>
                
                <div className="grid-mobile-2" style={{ marginTop: '20px' }}>
                    <button onClick={() => setShowBadgesModal(true)} className="profile-btn" style={{ width: '100%', background: '#fffbeb', border: '2px solid #fde047', color: '#b45309', padding: '16px', fontSize: '14px', fontWeight: 900 }}>🏆 KUPA VİTRİNİ</button>
                    <button onClick={() => setShowGiftModal(true)} className="profile-btn" style={{ width: '100%', background: '#ecfdf5', border: '2px solid #10b981', color: '#059669', padding: '16px', fontSize: '14px', fontWeight: 900 }}>🎁 KOD KULLAN</button>
                </div>
                <button onClick={() => setShowMessageModal(true)} className="profile-btn" style={{ width: '100%', marginTop: '12px', background: '#eff6ff', border: '2px solid #bfdbfe', color: '#1d4ed8', padding: '16px', fontSize: '14px', fontWeight: 900 }}>✉️ YÖNETİCİYE MESAJ GÖNDER</button>
              </div>
            </div>
          )}

          {activeTab === 'clan' && (
            <div className="fade-in">
               {!myClanId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '35px', borderRadius: '32px', color: 'white', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.3)', gap: '15px' }}>
                        <div><h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>🛡️ Klanlara Katıl</h2><p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontWeight: 600 }}>Kendi klanını kur ve haftalık savaşlarda liderliğe oyna.</p></div>
                        <button onClick={() => setShowCreateClan(true)} className="profile-btn" style={{ background: '#d4af37', color: 'white', padding: '16px 24px', fontSize: '15px' }}>Klan Kur (50 M)</button>
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
                        <div style={{ fontSize: '70px', marginBottom: '10px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))' }}>{myClan?.icon}</div>
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
                              return (
                                 <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                       <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{String(m).split(' ')[0]}</span>
                                       {myClan?.leader === m && <span style={{ fontSize: '14px' }} title="Klan Lideri">👑</span>}
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
                                 <input type="text" value={inviteUser} onChange={e => setInviteUser(e.target.value)} placeholder="Kullanıcı Adı" className="elite-input" style={{ flex: 1 }} />
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
               
               {isPersonalDiscountActive && (
                   <div className="badge-glow" style={{ background: '#ecfdf5', border: '2px solid #10b981', padding: '20px', borderRadius: '24px', marginBottom: '25px', textAlign: 'center' }}>
                       <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669', marginBottom: '5px' }}>🔥 %{personalDiscountVal} SANA ÖZEL İNDİRİM AKTİF!</div>
                       <div style={{ fontSize: '14px', color: '#047857', fontWeight: 700 }}>⏳ Bu fırsatı kaçırmamak için son <span style={{fontWeight: 900, fontSize: '16px'}}>{remainingDiscountDays} Gün</span>!</div>
                   </div>
               )}

               <div className="grid-mobile-2" style={{ gap: '16px' }}>
                 <div onClick={buyTicket} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none', borderRadius: '24px', padding: '25px 15px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15,23,42,0.2)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ fontSize: '45px', marginBottom: '15px' }}>🎟️</div><div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '15px' }}>Çekiliş Bileti</div>
                     {currentActiveDiscountPercent > 0 && <div style={{ fontSize: '12px', color: '#ef4444', textDecoration: 'line-through', fontWeight: 700, marginBottom: '4px' }}>20 M</div>}
                     <div style={{ background: '#d4af37', color: 'white', padding: '6px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>{Math.ceil(20 * (1 - currentActiveDiscountPercent / 100))} M</div>
                 </div>
                 {products.filter(p=>p.n!=="Çekiliş Bileti").map(p => (
                   <div key={p.key} onClick={() => handleBuy(p)} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '25px 15px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ fontSize: '45px', marginBottom: '15px' }}>{p.i || '📦'}</div><div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '15px', color: '#0f172a', lineHeight: '1.3' }}>{p.n}</div>
                     {currentActiveDiscountPercent > 0 && <div style={{ fontSize: '12px', color: '#ef4444', textDecoration: 'line-through', fontWeight: 800, marginBottom: '4px' }}>{p.p} M</div>}
                     <div style={{ background: currentActiveDiscountPercent > 0 ? '#10b981' : '#f8fafc', border: `2px solid ${currentActiveDiscountPercent > 0 ? '#10b981' : '#e2e8f0'}`, color: currentActiveDiscountPercent > 0 ? 'white' : '#0f172a', padding: '6px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>{Math.ceil(p.p * (1 - currentActiveDiscountPercent / 100))} M</div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '25px', color: '#0f172a', letterSpacing: '-0.5px' }}>🎒 Envanterim</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'done').map(k => {
                    const item = appData.deliveries[k];
                    const iName = String(item.n || item.i || '').toUpperCase();
                    const isDigital = item.type === 'multiplier' || item.type === 'streak' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || iName.includes("GİZEMLİ") || iName.includes("2X") || iName.includes("ÇARPAN") || iName.includes("KORUMA");
                    if (!isDigital) return null; 
                    return (
                      <div key={k} style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                        <div><div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', marginBottom: '6px' }}>{item.i}</div><div style={{ fontSize: '12px', color: '#10b981', fontWeight: 900 }}>✅ HAZIR</div></div>
                        <button onClick={() => activateItem(k, item)} className="profile-btn" style={{ background: '#0f172a', color: 'white', padding: '12px 20px', fontSize: '14px', fontWeight: 800 }}>Kullan</button>
                      </div>
                    );
                 })}
                 {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'wait').map(k => {
                    const item = appData.deliveries[k];
                    return (
                      <div key={k} style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                        <div><div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a', marginBottom: '6px' }}>{item.i}</div><div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 900 }}>⏳ BEKLİYOR</div></div>
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
               <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '25px', color: '#0f172a', letterSpacing: '-0.5px' }}>🏆 Liderlik Tablosu</h2>
               <div style={{ background: '#ffffff', borderRadius: '32px', padding: '20px', boxShadow: '0 15px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                 {rpSorted.map((s, idx) => {
                   const currentBadge = getRankBadge(s.rp); const isMe = s.n === safeName; const pinned = appData?.pinned_badges?.[s.n] || [];
                   return (
                     <div key={s.n} onClick={() => setViewProfile(s.n)} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: idx < rpSorted.length-1 ? '1px solid #e2e8f0' : 'none', background: isMe ? '#f8fafc' : 'transparent', borderRadius: isMe ? '20px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>
                       <div style={{ width: '35px', fontWeight: 900, color: idx<3 ? '#0f172a' : '#94a3b8', fontSize: '18px' }}>{idx+1}.</div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             {s.n} {pinned.map(bId => <span key={bId} style={{fontSize: '14px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}} title={BADGES[bId]?.name}>{BADGES[bId]?.icon}</span>)}
                          </span>
                          <span style={{ fontSize: '12px', color: currentBadge.color, fontWeight: 900, marginTop: '6px' }}>{currentBadge.icon} {currentBadge.name}</span>
                       </div>
                       <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '20px' }}>{s.rp} <span style={{ fontSize: '11px', color: '#64748b' }}>RP</span></div>
                     </div>
                   )
                 })}
               </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: '50px', display: 'flex', padding: '10px', width: '92%', maxWidth: '500px', zIndex: 1000, boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2)', border: '1px solid rgba(226,232,240,0.8)' }}>
         <button onClick={() => setActiveTab('home')} style={getNavStyle('home')}>Özet</button>
         <button onClick={() => setActiveTab('clan')} style={getNavStyle('clan')}>Klan</button>
         <button onClick={() => setActiveTab('market')} style={getNavStyle('market')}>Market</button>
         <button onClick={() => setActiveTab('inventory')} style={getNavStyle('inventory')}>Çanta</button>
         <button onClick={() => setActiveTab('rank')} style={getNavStyle('rank')}>Liderlik</button>
      </div>
    </div>
  );
};

export default StudentScreen;