import React, { useState } from 'react';
import { db } from '../firebase';

const StudentScreen = ({ appData, goBackToRoles }) => {
  const [activeStudent, setActiveStudent] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  
  const [lotteryState, setLotteryState] = useState({ 
    active: false, result: null, spinning: false, currentDisplay: '❓', speed: 100 
  });

  const roster = appData?.roster || [];
  
  // --- GÜVENLİ GİRİŞ ---
  const handleStudentLogin = () => {
      const creds = appData?.student_credentials || {};
      const foundStudentName = Object.keys(creds).find(name => {
          const c = creds[name];
          if(c && typeof c === 'object') {
              return String(c.username || '').trim() === String(loginUser).trim() && 
                     String(c.password || '').trim() === String(loginPass).trim();
          }
          return false; 
      });

      if (foundStudentName) {
          setActiveStudent(foundStudentName);
          setShowLoginModal(false);
          setLoginUser(''); setLoginPass('');
      } else {
          alert("Kullanıcı Adı veya Şifre Hatalı!");
          setLoginPass('');
      }
  };

  // --- XP VE RP HESAPLAMALARI ---
  const getLevelInfo = (xp) => {
      const safeXp = Number(xp) || 0;
      const level = Math.floor(Math.sqrt(safeXp / 50)) + 1;
      const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
      const nextLevelBaseXp = Math.pow(level, 2) * 50;
      const progress = ((safeXp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp)) * 100;
      return { level, progress: Math.min(100, Math.max(0, progress)) };
  };

  const getRankBadge = (rpVal) => {
      const rp = Number(rpVal) || 0;
      if (rp >= 1000) return { name: 'Fatih', icon: '👑', color: '#ff3b30' }; // Apple Red
      if (rp >= 750) return { name: 'Elmas', icon: '💎', color: '#5ac8fa' }; // Apple Light Blue
      if (rp >= 500) return { name: 'Altın', icon: '🥇', color: '#ffcc00' }; // Apple Yellow
      if (rp >= 250) return { name: 'Gümüş', icon: '🥈', color: '#8e8e93' }; // Apple Gray
      return { name: 'Bronz', icon: '🥉', color: '#a2845e' }; // Brown
  };

  const getTop3 = (metric) => {
    if (!roster) return [];
    return roster.map(n => {
        let val = 0;
        if(metric === 'rp') val = Number(appData?.season_score?.[n] || 0);
        if(metric === 'wealth') val = Number(appData?.wallet?.[n] || 0);
        if(metric === 'books') val = Number(appData?.education_d?.[n]?.pages || 0);
        if(metric === 'questions') val = Number(appData?.education_d?.[n]?.questions || 0);
        return { n, val };
    }).sort((a,b) => b.val - a.val).slice(0, 3);
  };

  let publicProducts = [];
  if (appData?.market_products) {
      publicProducts = Object.keys(appData.market_products).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0));
  }
  const marqueeProducts = [...publicProducts, ...publicProducts];

  // -------------------------------------------------------------
  // EKRAN 1: PUBLIC PANO (APPLE STYLE)
  // -------------------------------------------------------------
  if (!activeStudent) {
    return (
      <div className="fade-in" style={{ minHeight: '100vh', background: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif', color: '#1d1d1f' }}>
        
        <style>
          {`
            @keyframes scrollMarket { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            @keyframes tickerScroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
            .market-marquee { display: flex; animation: scrollMarket 60s linear infinite; width: max-content; }
            .market-marquee:hover { animation-play-state: paused; }
            .ticker-content { display: inline-block; white-space: nowrap; animation: tickerScroll 25s linear infinite; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; }
            .apple-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); }
            .apple-glass { background: rgba(255,255,255,0.75); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); }
          `}
        </style>

        {/* APPLE TOP NAVIGATION */}
        <div className="apple-glass" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <button onClick={goBackToRoles} style={{ background: 'transparent', border: 'none', color: '#0071e3', fontSize: '24px', cursor: 'pointer', padding: 0 }}>‹</button>
             <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Mavikent <span style={{ fontWeight: 400, color: '#86868b' }}>Elite</span></div>
           </div>
           <button onClick={() => setShowLoginModal(true)} style={{ background: '#0071e3', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Giriş Yap</button>
        </div>

        {/* TICKER */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e5ea', padding: '12px 24px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
           <div style={{ background: '#ff3b30', color: 'white', padding: '4px 10px', borderRadius: '12px', marginRight: '16px', fontSize: '11px', fontWeight: 700, zIndex: 2, position: 'relative', letterSpacing: '0.5px' }}>DUYURU</div>
           <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
             <div className="ticker-content" style={{ color: '#1d1d1f' }}>{appData?.settings?.news_ticker || 'Sisteme hoş geldiniz. Lütfen görevlerinizi tamamlamayı unutmayın.'}</div>
           </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
            
            <h1 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Genel Bakış</h1>
            <p style={{ fontSize: '17px', color: '#86868b', marginBottom: '30px' }}>Yurdun en güncel istatistikleri ve duyuruları.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="apple-shadow" style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e5e5ea' }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>📢</div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: '#1d1d1f', lineHeight: '1.4' }}>{appData?.settings?.ann1 || 'Şu an için yeni bir genel duyuru bulunmamaktadır.'}</div>
                </div>
                <div className="apple-shadow" style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e5e5ea' }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: '#1d1d1f', lineHeight: '1.4' }}>{appData?.settings?.ann2 || 'Kurallara uymayı ve görevleri takip etmeyi unutmayın.'}</div>
                </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '20px' }}>1. Sezon Liderleri</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '50px' }}>
                
                {/* RP LİDERLERİ */}
                <div className="apple-shadow" style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e5e5ea' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#86868b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>🏆 RP Sıralaması</h3>
                    {getTop3('rp').map((s, i) => {
                        const badge = getRankBadge(s.val);
                        return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '14px 0', borderBottom: i<2 ? '1px solid #f2f2f7' : 'none' }}>
                           <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                              <span style={{ color: '#86868b', fontSize: '15px', fontWeight: 600, width: '20px' }}>{i+1}.</span> 
                              <span style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f' }}>{s.n.split(' ')[0]}</span>
                           </div>
                           <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <span style={{ fontSize:'12px', color: badge.color, fontWeight:700 }}>{badge.icon} {badge.name}</span>
                              <span style={{ color: '#1d1d1f', fontWeight: 700 }}>{s.val}</span>
                           </div>
                        </div>
                    )})}
                </div>

                <div className="apple-shadow" style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e5e5ea' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#86868b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>💳 M-Coin Milyarderleri</h3>
                    {getTop3('wealth').map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '14px 0', borderBottom: i<2 ? '1px solid #f2f2f7' : 'none' }}>
                           <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                              <span style={{ color: '#86868b', fontSize: '15px', fontWeight: 600, width: '20px' }}>{i+1}.</span> 
                              <span style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f' }}>{s.n.split(' ')[0]}</span>
                           </div>
                           <span style={{ color: '#0071e3', fontWeight: 700 }}>{s.val} M</span>
                        </div>
                    ))}
                </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '20px' }}>Market Vitrini</h2>
            <div style={{ overflow: 'hidden', width: '100%', position: 'relative', padding: '10px 0' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '100%', background: 'linear-gradient(to right, #f5f5f7, transparent)', zIndex: 10 }}></div>
               <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '100%', background: 'linear-gradient(to left, #f5f5f7, transparent)', zIndex: 10 }}></div>
               <div className="market-marquee">
                  {marqueeProducts.map((p, idx) => (
                     <div key={idx} className="apple-shadow" style={{ background: '#ffffff', borderRadius: '20px', minWidth: '160px', maxWidth: '160px', textAlign: 'center', marginRight: '20px', padding: '24px 16px', border: '1px solid #e5e5ea' }}>
                       <div style={{ fontSize: '40px', marginBottom: '16px' }}>{p.i || '📦'}</div>
                       <div style={{ fontSize: '14px', fontWeight: 600, height: '40px', overflow: 'hidden', color: '#1d1d1f' }}>{p.n}</div>
                       <div style={{ color: '#86868b', fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>{p.p} M</div>
                     </div>
                  ))}
               </div>
            </div>
        </div>

        {/* APPLE LOGIN MODAL */}
        {showLoginModal && (
          <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
            <div className="apple-shadow" style={{ background: '#ffffff', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
              <h2 style={{ fontWeight: 700, margin: '0 0 8px 0', fontSize: '22px', letterSpacing: '-0.5px' }}>Öğrenci Girişi</h2>
              <p style={{ color: '#86868b', fontSize: '14px', marginBottom: '24px' }}>Hesabınıza erişmek için bilgilerinizi girin.</p>
              
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Kullanıcı Adı" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #d2d2d7', marginBottom: '12px', fontSize: '15px', outline: 'none', background: '#fafafa' }} />
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleStudentLogin(); }} placeholder="Şifre" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #d2d2d7', marginBottom: '24px', fontSize: '15px', outline: 'none', background: '#fafafa' }} />
              
              <button onClick={handleStudentLogin} style={{ width: '100%', padding: '14px', background: '#0071e3', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginBottom: '12px' }}>Giriş Yap</button>
              <button onClick={() => setShowLoginModal(false)} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#0071e3', border: 'none', fontWeight: 500, fontSize: '15px', cursor: 'pointer' }}>Vazgeç</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // EKRAN 2: ÖĞRENCİ PANELİ (GİRİŞ YAPILDIKTAN SONRA)
  // -------------------------------------------------------------
  const safeName = String(activeStudent || '');
  const firstName = safeName.split(' ')[0] || 'Öğrenci';
  
  const xpInfo = getLevelInfo(appData?.xp?.[safeName]);
  const mCoin = Number(appData?.wallet?.[safeName] || 0);
  const myRp = Number(appData?.season_score?.[safeName] || 0);
  const myBadge = getRankBadge(myRp);
  const isElite = appData?.student_tiers?.[safeName] === 'elite';
  const myCosmetics = appData?.active_cards?.[safeName] || {};
  const myTickets = Number(appData?.tickets?.[safeName] || 0);

  const activeFrame = myCosmetics?.frame?.val || '';
  let avatarStyle = { fontSize: '40px', background: '#f5f5f7', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (activeFrame.includes('Fatih')) { avatarStyle.border = '3px solid #ff3b30'; }
  else if (activeFrame.includes('Elmas')) { avatarStyle.border = '3px solid #5ac8fa'; }
  else if (activeFrame.includes('Altın')) { avatarStyle.border = '3px solid #ffcc00'; }

  const is2XActive = myCosmetics?.multiplier?.date === new Date().toDateString();

  const allTimeRankings = (roster || []).map(n => ({ n: String(n), rp: Number(appData?.season_score?.[n] || 0) })).sort((a,b) => b.rp - a.rp);
  const myRankIndex = allTimeRankings.findIndex(s => s.n === safeName);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '-';

  const products = Object.keys(appData?.market_products || {}).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0));
  const quests = appData?.quests || {};

  const handleBuy = (item) => {
     let price = Number(item.p || 0);
     let discount = Number(myCosmetics?.discount || 0);
     if(isElite && discount < 10) discount = 10;
     let finalPrice = Math.ceil(price * (1 - discount/100));

     if (mCoin < finalPrice) return alert("Bakiyen yetersiz!");
     if (window.confirm(`${item.n} ürününü almak istiyor musun?`)) {
        db.ref(`mavikent_premium/wallet/${safeName}`).transaction(c => (Number(c)||0) - finalPrice);
        db.ref('mavikent_premium/deliveries').push({ s: safeName, i: item.n, st: 'wait', type: item.type || 'normal', val: item.val || item.i, date: new Date().toLocaleDateString('tr-TR') });
        alert("Satın alındı! Lütfen envanterinden durumunu takip et.");
     }
  };

  const buyTicket = () => {
    if (mCoin < 20) return alert("Yetersiz M-Coin!");
    db.ref(`mavikent_premium/wallet/${safeName}`).transaction(c => (Number(c)||0) - 20);
    db.ref(`mavikent_premium/tickets/${safeName}`).transaction(c => (Number(c)||0) + 1);
    alert("Bilet alındı!");
  };

  const rollLottery = () => {
      if (myTickets <= 0) return alert("Biletin yok!");
      let drawItems = products.filter(p => p.n !== "Çekiliş Bileti" && (p.type === 'normal' || !p.type));
      if (drawItems.length === 0) return alert("Çekiliş havuzu boş.");
      
      const wealthSorted = (roster || []).map(n => ({n, w: Number(appData?.wallet?.[n] || 0)})).sort((a,b)=>b.w-a.w);
      const myWealthRank = wealthSorted.findIndex(s=>s.n===safeName)+1;
      const rankMultiplier = 1 + (((roster?.length || 1) - myWealthRank) / (roster?.length || 1)); 
      
      let weightedArray = [];
      drawItems.forEach(item => {
          let weight = (1000 / (Number(item.p) || 10)) * (item.p >= 30 ? Math.pow(rankMultiplier, 2) : 1);
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
          if (spins < 15) currentSpeed = Math.max(30, currentSpeed - 10);
          else if (spins > 25) currentSpeed += 20;
          if (spins < 40) setTimeout(spinLoop, currentSpeed);
          else {
              setLotteryState({ active: true, result: selectedPrize, spinning: false, currentDisplay: selectedPrize.i || '🎁', speed: currentSpeed });
              db.ref('mavikent_premium/deliveries').push({ s: safeName, i: selectedPrize.n + " (Çekiliş Kazancı)", st: 'wait', type: selectedPrize.type || 'normal', val: selectedPrize.val || selectedPrize.i, date: new Date().toLocaleDateString('tr-TR') });
          }
      };
      setTimeout(spinLoop, currentSpeed);
  };

  const activateItem = (delKey, item) => {
      const today = new Date().toDateString();
      const exp = Date.now() + 14 * 24 * 60 * 60 * 1000;
      const updates = {};
      
      if (item.type === 'multiplier' || (item.i && item.i.includes("2X"))) {
          updates[`active_cards/${safeName}/multiplier`] = { date: today, val: "2X" };
          alert("2X Puan Kartı aktif edildi.");
      } else if (item.type === 'avatar' || item.type === 'title' || item.type === 'frame') {
          updates[`active_cards/${safeName}/${item.type}`] = { val: item.val || item.i, exp: exp };
          alert("Özellik başarıyla kullanıldı.");
      } else if (item.i && item.i.includes("Gizemli Kutu")) {
          const prize = products[Math.floor(Math.random()*products.length)];
          const prizeName = prize?.n || 'Sürpriz Ödül';
          updates[`deliveries/${db.ref().push().key}`] = { s: safeName, i: prizeName + " (Kutudan Çıktı)", st: 'wait', type: prize?.type || 'normal', val: prize?.val || prize?.i, date: new Date().toLocaleDateString('tr-TR') };
          alert(`Kutudan ${prizeName} çıktı! Onay için envanterine eklendi.`);
      }

      updates[`deliveries/${delKey}`] = null; 
      db.ref('mavikent_premium').update(updates);
  };

  const getNavStyle = (tab) => ({
      flex: 1, padding: '12px 0', border: 'none', background: activeTab === tab ? '#ffffff' : 'transparent', 
      color: activeTab === tab ? '#1d1d1f' : '#86868b', fontWeight: activeTab === tab ? 700 : 500, 
      fontSize: '13px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s ease',
      boxShadow: activeTab === tab ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
  });

  return (
    <div className="fade-in" style={{ background: '#f5f5f7', minHeight: '100vh', padding: '20px', paddingBottom: '120px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif', color: '#1d1d1f' }}>
      
      <style>
        {`
          .apple-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); }
          .apple-glass { background: rgba(255,255,255,0.75); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); }
        `}
      </style>

      {/* APPLE STYLE LOTTERY MODAL */}
      {lotteryState.active && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '28px', width: '100%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
             <h2 style={{ margin: '0 0 10px 0', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>Şans Çarkı</h2>
             <p style={{ color: '#86868b', fontSize: '14px', margin: '0 0 30px 0' }}>Büyük ödül için çark dönüyor...</p>
             
             <div style={{ fontSize: '80px', margin: '0 auto 30px auto', background: '#f5f5f7', borderRadius: '50%', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {lotteryState.currentDisplay}
             </div>
             
             {!lotteryState.spinning ? (
               <div className="fade-in">
                 <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d1d1f', marginBottom: '8px' }}>{lotteryState.result?.n}</div>
                 <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '24px' }}>Ödülün envanterine eklendi.</div>
                 <button onClick={() => setLotteryState({active:false})} style={{ width: '100%', padding: '14px', background: '#0071e3', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}>Kapat</button>
               </div>
             ) : <div style={{ fontSize: '15px', fontWeight: 600, color: '#0071e3' }}>Lütfen bekleyin...</div>}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* APPLE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', paddingTop: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Genel Bakış</div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>{firstName}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="apple-shadow" style={{ background: '#ffffff', padding: '10px 16px', borderRadius: '16px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span>🪙</span> <span>{mCoin} M</span>
            </div>
          </div>
        </div>

        {activeTab === 'home' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* PROFILE CARD */}
            <div className="apple-shadow" style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #e5e5ea' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                 <div style={avatarStyle}>{(myCosmetics.avatar && myCosmetics.avatar.val) ? myCosmetics.avatar.val : '🎓'}</div>
                 <div>
                   <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>{safeName}</div>
                   <div style={{ fontSize: '14px', color: '#86868b', fontWeight: 500, marginTop: '4px' }}>
                      {myCosmetics.title?.val || 'Öğrenci'} {isElite && <span style={{ color: '#ff3b30' }}>• Elite</span>}
                   </div>
                   {is2XActive && <div style={{ color: '#ff9f0a', fontWeight: 700, fontSize: '12px', marginTop: '6px' }}>⚡ 2X Puan Aktif</div>}
                 </div>
                 <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#86868b', fontWeight: 600 }}>Rütbe</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: myBadge.color }}>{myBadge.icon} {myBadge.name}</div>
                 </div>
              </div>

              <div style={{ background: '#f5f5f7', borderRadius: '16px', padding: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                   <span style={{ color: '#1d1d1f' }}>Seviye {xpInfo.level}</span>
                   <span style={{ color: '#86868b' }}>Sıralama: {myRank}</span>
                 </div>
                 <div style={{ width: '100%', height: '10px', background: '#e5e5ea', borderRadius: '10px', overflow: 'hidden' }}>
                   <div style={{ background: '#0071e3', width: `${xpInfo.progress}%`, height: '100%', borderRadius: '10px' }}></div>
                 </div>
              </div>
            </div>

            {/* WHEEL CARD */}
            <div className="apple-shadow" style={{ background: '#ffffff', borderRadius: '24px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e5ea' }}>
               <div>
                 <div style={{ color: '#1d1d1f', fontWeight: 800, fontSize: '17px', marginBottom: '4px' }}>Şans Çarkı</div>
                 <div style={{ fontSize: '13px', color: '#86868b' }}>Kullanılabilir biletiniz: <span style={{ fontWeight: 700, color: '#1d1d1f' }}>{myTickets}</span></div>
               </div>
               <button onClick={rollLottery} style={{ background: '#f5f5f7', color: '#0071e3', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px', cursor:'pointer' }}>Çevir</button>
            </div>

            <div style={{ marginTop: '10px' }}>
               <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '15px' }}>Görevler</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {['q1', 'q2', 'q3'].map(qId => {
                    const q = quests[qId];
                    if (!q || !q.text) return null;
                    const isJoined = (q.participants || []).includes(safeName);
                    return (
                      <div key={qId} className="apple-shadow" style={{ background: '#ffffff', borderRadius: '20px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e5ea' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', marginBottom: '4px' }}>{q.text}</div>
                          <div style={{ fontSize: '13px', color: '#86868b', fontWeight: 500 }}>Ödül: <span style={{ color: '#0071e3', fontWeight: 600 }}>{q.amt} {q.type}</span></div>
                        </div>
                        {isJoined ? (
                          <div style={{ color: '#34c759', fontSize: '13px', fontWeight: 700 }}>Katıldın</div>
                        ) : (
                          <button onClick={() => { db.ref(`mavikent_premium/quests/${qId}/participants`).set([...(q.participants||[]), safeName]); alert('Göreve katıldınız.'); }} style={{ background: '#f5f5f7', color: '#0071e3', border: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Katıl</button>
                        )}
                      </div>
                    )
                 })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="fade-in">
             <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '20px' }}>Market</h2>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
               <div onClick={buyTicket} className="apple-shadow" style={{ background: '#ffffff', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', cursor:'pointer', border: '1px solid #e5e5ea' }}>
                   <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎟️</div>
                   <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', marginBottom: '12px' }}>Çekiliş Bileti</div>
                   <div style={{ background: '#f5f5f7', color: '#1d1d1f', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, display: 'inline-block' }}>20 M</div>
               </div>
               {products.filter(p=>p.n!=="Çekiliş Bileti").map(p => (
                 <div key={p.key} onClick={() => handleBuy(p)} className="apple-shadow" style={{ background: '#ffffff', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', cursor:'pointer', border: '1px solid #e5e5ea' }}>
                   <div style={{ fontSize: '40px', marginBottom: '12px' }}>{p.i || '📦'}</div>
                   <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', marginBottom: '12px' }}>{p.n}</div>
                   <div style={{ background: '#f5f5f7', color: '#0071e3', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, display: 'inline-block' }}>{p.p} M</div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="fade-in">
             <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '20px' }}>Envanter</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               
               {/* KULLANILABİLİR (DONE) DİJİTAL ÜRÜNLER */}
               {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'done').map(k => {
                  const item = appData.deliveries[k];
                  const isDigital = item.type === 'multiplier' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || (item.i && item.i.includes("Gizemli"));
                  if (!isDigital) return null; 
                  return (
                    <div key={k} className="apple-shadow" style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e5ea' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1d1d1f', fontSize: '15px' }}>{item.i}</div>
                        <div style={{ fontSize: '12px', color: '#34c759', fontWeight: 600, marginTop: '4px' }}>Onaylandı, kullanıma hazır.</div>
                      </div>
                      <button onClick={() => activateItem(k, item)} style={{ background: '#0071e3', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', cursor:'pointer' }}>Kullan</button>
                    </div>
                  );
               })}

               {/* ONAY BEKLEYENLER (WAIT) */}
               {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'wait').map(k => {
                  const item = appData.deliveries[k];
                  return (
                    <div key={k} className="apple-shadow" style={{ background: '#ffffff', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e5ea' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: '#1d1d1f' }}>{item.i}</div>
                        <div style={{ fontSize: '12px', color: '#86868b', fontWeight: 500, marginTop: '4px' }}>Yönetici onayı bekleniyor.</div>
                      </div>
                    </div>
                  );
               })}

               {Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].s === safeName).length === 0 && (
                   <div style={{ textAlign: 'center', padding: '60px 20px', color: '#86868b', fontWeight: 500, fontSize: '15px' }}>Envanterinizde şu an eşya bulunmuyor.</div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'rank' && (
          <div className="fade-in">
             <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '20px' }}>Sıralama</h2>
             <div className="apple-shadow" style={{ background: '#ffffff', borderRadius: '24px', padding: '10px', border: '1px solid #e5e5ea' }}>
               {allTimeRankings.map((s, idx) => {
                 const currentBadge = getRankBadge(s.rp);
                 return (
                   <div key={s.n} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: idx < allTimeRankings.length-1 ? '1px solid #f5f5f7' : 'none' }}>
                     <div style={{ width: '30px', fontWeight: 700, color: '#86868b', fontSize: '15px' }}>{idx+1}</div>
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#1d1d1f' }}>{s.n}</span>
                        <span style={{ fontSize: '12px', color: currentBadge.color, fontWeight: 600, marginTop: '2px' }}>{currentBadge.name}</span>
                     </div>
                     <div style={{ color: '#1d1d1f', fontWeight: 700, fontSize: '15px' }}>{s.rp} RP</div>
                   </div>
                 )
               })}
             </div>
          </div>
        )}
      </div>

      {/* APPLE BOTTOM NAV */}
      <div className="apple-glass" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', borderRadius: '24px', display: 'flex', padding: '6px', width: '90%', maxWidth: '400px', zIndex: 1000, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
         <button onClick={() => setActiveTab('home')} style={getNavStyle('home')}>Özet</button>
         <button onClick={() => setActiveTab('market')} style={getNavStyle('market')}>Market</button>
         <button onClick={() => setActiveTab('inventory')} style={getNavStyle('inventory')}>Envanter</button>
         <button onClick={() => setActiveTab('rank')} style={getNavStyle('rank')}>Sıralama</button>
      </div>
    </div>
  );
};

export default StudentScreen;