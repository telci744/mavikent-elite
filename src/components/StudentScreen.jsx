import React, { useState } from 'react';
import { db } from '../firebase';

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

  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster);

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
          setLoginUser(''); 
          setLoginPass('');
      } else {
          alert("Kullanıcı Adı veya Şifre Hatalı!");
          setLoginPass('');
      }
  };

  // XP Hesaplama Motoru (Detaylı)
  const getDetailedLevelInfo = (xp) => {
      const safeXp = Number(xp) || 0;
      const level = Math.floor(Math.sqrt(safeXp / 50)) + 1;
      const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
      const nextLevelBaseXp = Math.pow(level, 2) * 50;
      const progress = ((safeXp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp)) * 100;
      return { 
          level, 
          progress: Math.min(100, Math.max(0, progress)),
          currentXp: safeXp,
          nextLevelXp: nextLevelBaseXp
      };
  };

  const getRankBadge = (rpVal) => {
      const rp = Number(rpVal) || 0;
      if (rp >= 1000) return { name: 'Fatih', icon: '👑', color: '#ff3b30' }; 
      if (rp >= 750) return { name: 'Elmas', icon: '💎', color: '#3b82f6' }; 
      if (rp >= 500) return { name: 'Altın', icon: '🥇', color: '#f59e0b' }; 
      if (rp >= 250) return { name: 'Gümüş', icon: '🥈', color: '#64748b' }; 
      return { name: 'Bronz', icon: '🥉', color: '#b45309' }; 
  };

  const getAllRankings = (metric) => {
    return roster.map(n => {
        let val = 0;
        if(metric === 'rp') val = Number(appData?.season_score?.[n] || 0);
        if(metric === 'wealth') val = Number(appData?.wallet?.[n] || 0);
        return { n: String(n), val };
    }).sort((a,b) => b.val - a.val);
  };

  const getTop3 = (metric) => getAllRankings(metric).slice(0, 3);

  let publicProducts = [];
  if (appData?.market_products) {
      publicProducts = Object.keys(appData.market_products).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0));
  }
  const quests = appData?.quests || {};

  // -------------------------------------------------------------
  // EKRAN 1: PUBLIC PANO (TAŞMAYAN DİKEY KART TASARIMI)
  // -------------------------------------------------------------
  if (!activeStudent) {
    return (
      <div className="fade-in" style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
        
        <style>
          {`
            @keyframes tickerScroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
            .ticker-content { display: inline-block; white-space: nowrap; animation: tickerScroll 25s linear infinite; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
            
            /* DİKEY KART TASARIMI (Asla Taşmaz) */
            .action-card { 
                background: #ffffff; border-radius: 28px; padding: 35px 20px; 
                box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.05); 
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                border: 1px solid #f1f5f9; cursor: pointer;
                display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; outline: none;
            }
            .action-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -5px rgba(15, 23, 42, 0.1); border-color: #e2e8f0; }
            .action-card:active { transform: scale(0.96); }

            /* BUTONLAR */
            .btn-gold { background: linear-gradient(135deg, #d4af37 0%, #b45309 100%); color: white; padding: 16px 28px; border-radius: 16px; font-weight: 800; font-size: 16px; border: none; outline: none; cursor: pointer; box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3); transition: all 0.2s; }
            .btn-gold:active { transform: scale(0.95); }

            .btn-nav { background: #ffffff; color: #0f172a; border: 2px solid #e2e8f0; padding: 10px 20px; border-radius: 14px; font-weight: 800; font-size: 14px; outline: none; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
            .btn-nav:hover { border-color: #0f172a; }
            .btn-nav:active { transform: scale(0.95); }

            .grid-2 { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
            .grid-5 { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
          `}
        </style>

        {/* ÜST BAR */}
        <div style={{ background: '#ffffff', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #f1f5f9' }}>
           <div style={{ flex: 1 }}>
               <button className="btn-nav" onClick={goBackToRoles}>
                 <span style={{ fontSize: '18px', marginTop: '-2px' }}>←</span> Geri Dön
               </button>
           </div>
           
           <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <span style={{ fontWeight: 900, fontSize: '24px', color: '#0f172a', letterSpacing: '-0.5px' }}>MAVİKENT</span>
             <span style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(212,175,55,0.3)' }}>ELITE</span>
           </div>

           <div style={{ flex: 1 }}></div>
        </div>

        {/* KAYAN YAZI */}
        <div style={{ background: '#0f172a', padding: '14px 24px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
           <div style={{ background: '#d4af37', color: '#0f172a', padding: '6px 16px', borderRadius: '10px', marginRight: '20px', fontSize: '13px', fontWeight: 900, zIndex: 2, position: 'relative', whiteSpace: 'nowrap' }}>DUYURU</div>
           <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
             <div className="ticker-content" style={{ color: '#ffffff' }}>{appData?.settings?.news_ticker || 'Mavikent Elite Sistemine Hoş Geldiniz.'}</div>
           </div>
        </div>

        {/* ANA İÇERİK ALANI */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
            
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', letterSpacing: '-1px' }}>Genel Bakış</h1>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '35px', fontWeight: 500 }}>Yurdun en güncel istatistikleri ve kuralları.</p>

            <div className="grid-2" style={{ marginBottom: '50px' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '30px', borderRadius: '32px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '100px', opacity: 0.05 }}>📢</div>
                    <div style={{ color: '#d4af37', fontWeight: 900, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px' }}>ÖNEMLİ BİLDİRİM</div>
                    <div style={{ fontSize: '16px', lineHeight: '1.6', fontWeight: 500, color: '#f8fafc' }}>{appData?.settings?.ann1 || 'Şu an için genel bir duyuru bulunmamaktadır.'}</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '100px', opacity: 0.03 }}>⚠️</div>
                    <div style={{ color: '#3b82f6', fontWeight: 900, fontSize: '13px', letterSpacing: '2px', marginBottom: '16px' }}>GÜNCEL BİLGİ</div>
                    <div style={{ fontSize: '16px', lineHeight: '1.6', fontWeight: 600, color: '#334155' }}>{appData?.settings?.ann2 || 'Kurallara uymayı ve görevleri takip etmeyi unutmayın.'}</div>
                </div>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginBottom: '25px', letterSpacing: '-0.5px' }}>İnteraktif Paneller</h2>
            
            {/* TAŞMAYAN DİKEY KART DÜZENİ */}
            <div className="grid-5">
                
                <div className="action-card" onClick={() => setShowLoginModal(true)} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px', color: '#d4af37' }}>🔑</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Öğrenci Girişi</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>Sisteme bağlanın</p>
                </div>

                <div className="action-card" onClick={() => setFullListView('rp')}>
                    <div style={{ background: '#fef3c7', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>⚔️</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>RP Liderleri</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sezonun en iyileri</p>
                </div>

                <div className="action-card" onClick={() => setFullListView('wealth')}>
                    <div style={{ background: '#ecfdf5', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>💳</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Zenginler</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>M-Coin listesi</p>
                </div>

                <div className="action-card" onClick={() => setShowPublicQuests(true)}>
                    <div style={{ background: '#eff6ff', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>🎯</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Görevler</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Güncel hedefler</p>
                </div>

                <div className="action-card" onClick={() => setShowPublicMarket(true)}>
                    <div style={{ background: '#f5f3ff', width: '65px', height: '65px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>🛍️</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Market Vitrini</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Ödüllere göz at</p>
                </div>

            </div>
        </div>

        {/* MODALLAR */}
        {fullListView && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(5px)' }}>
             <div className="modal-content" style={{ width: '100%', maxWidth: '500px', background: '#ffffff', borderRadius: '32px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                   <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
                     {fullListView === 'rp' ? `🏆 RP Liderleri` : `💳 M-Coin Zenginleri`}
                   </h2>
                   <button onClick={() => setFullListView(null)} className="btn-nav">Kapat</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {getAllRankings(fullListView).map((s, idx) => {
                      const badge = fullListView === 'rp' ? getRankBadge(s.val) : null;
                      return (
                         <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                               <span style={{ fontSize: '18px', fontWeight: 900, color: idx < 3 ? '#0f172a' : '#94a3b8', width: '25px', textAlign: 'center' }}>{idx + 1}.</span>
                               <div>
                                 <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{s.n}</div>
                                 {badge && <div style={{ fontSize: '11px', color: badge.color, fontWeight: 800, marginTop: '4px' }}>{badge.icon} {badge.name}</div>}
                               </div>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: fullListView === 'rp' ? '#0f172a' : '#10b981' }}>
                               {s.val} <span style={{fontSize:'12px', color:'#64748b'}}>{fullListView === 'rp' ? 'RP' : 'M'}</span>
                            </div>
                         </div>
                      )
                   })}
                </div>
             </div>
          </div>
        )}

        {showPublicQuests && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(5px)' }}>
             <div className="modal-content" style={{ width: '100%', maxWidth: '500px', background: '#ffffff', borderRadius: '32px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                   <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>🎯 Aktif Görevler</h2>
                   <button onClick={() => setShowPublicQuests(false)} className="btn-nav">Kapat</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {['q1', 'q2', 'q3'].map(qId => {
                      const q = quests[qId];
                      if (!q || !q.text) return null;
                      const parts = q.participants || [];
                      return (
                          <div key={qId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: '1.4' }}>{q.text}</div>
                                  <div style={{ background: '#d4af37', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap', marginLeft: '12px' }}>+{q.amt} {q.type}</div>
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                  <span style={{ fontWeight: 800, color: '#0f172a' }}>👥 Katılanlar ({parts.length}): </span>
                                  {parts.length > 0 ? parts.map(n => String(n).split(' ')[0]).join(', ') : 'Henüz katılan yok.'}
                              </div>
                          </div>
                      )
                   })}
                </div>
             </div>
          </div>
        )}

        {showPublicMarket && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(5px)' }}>
             <div className="modal-content" style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '32px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                   <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>🛍️ Market Vitrini</h2>
                   <button onClick={() => setShowPublicMarket(false)} className="btn-nav">Kapat</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                   <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px', borderRadius: '24px', textAlign: 'center', color: 'white', boxShadow: '0 10px 20px rgba(15,23,42,0.2)' }}>
                       <div style={{ fontSize: '42px', marginBottom: '12px' }}>🎟️</div>
                       <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px' }}>Çekiliş Bileti</div>
                       <div style={{ background: '#d4af37', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>20 M</div>
                   </div>
                   {publicProducts.map(p => (
                     <div key={p.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
                       <div style={{ fontSize: '42px', marginBottom: '12px' }}>{p.i || '📦'}</div>
                       <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>{p.n}</div>
                       <div style={{ background: 'white', border: '2px solid #e2e8f0', color: '#0f172a', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 900, display: 'inline-block' }}>{p.p} M</div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* GİRİŞ MODALI */}
        {showLoginModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
            <div className="modal-content" style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center', padding: '40px 30px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: '50px', marginBottom: '16px' }}>🎓</div>
              <h2 style={{ fontWeight: 900, margin: '0 0 8px 0', fontSize: '26px', color: '#0f172a', letterSpacing: '-0.5px' }}>Öğrenci Girişi</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px', fontWeight: 500 }}>Sisteme erişmek için bilgilerinizi girin.</p>
              
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="Kullanıcı Adı" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: `2px solid #e2e8f0`, background: '#f8fafc', marginBottom: '12px', fontSize: '15px', fontWeight: '700', outline: 'none', color: '#0f172a', transition: '0.3s' }} onFocus={e => {e.target.style.borderColor='#3b82f6'; e.target.style.background='#fff'}} onBlur={e => {e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'}} />
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleStudentLogin(); }} placeholder="Şifre" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: `2px solid #e2e8f0`, background: '#f8fafc', marginBottom: '30px', fontSize: '15px', fontWeight: '700', outline: 'none', color: '#0f172a', transition: '0.3s' }} onFocus={e => {e.target.style.borderColor='#3b82f6'; e.target.style.background='#fff'}} onBlur={e => {e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'}} />
              
              <button onClick={handleStudentLogin} className="btn-gold" style={{ width: '100%', marginBottom: '12px' }}>SİSTEME GİRİŞ YAP</button>
              <button onClick={() => setShowLoginModal(false)} style={{ width: '100%', padding: '16px', border: 'none', background: 'transparent', color: '#64748b', fontSize: '15px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>Vazgeç</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // EKRAN 2: ÖĞRENCİ ÖZEL PROFİLİ (SIRALAMALAR VE DETAYLI XP BARI EKLENDİ)
  // -------------------------------------------------------------
  const safeName = String(activeStudent || '');
  const firstName = safeName.split(' ')[0] || 'Öğrenci';
  
  // YENİ ÖZELLİK: Detaylı XP Bilgisi (Mevcut ve Sonraki Seviye XP rakamları)
  const xpDetail = getDetailedLevelInfo(appData?.xp?.[safeName]);
  
  const mCoin = Number(appData?.wallet?.[safeName] || 0);
  const myRp = Number(appData?.season_score?.[safeName] || 0);
  const myBadge = getRankBadge(myRp);
  const isElite = appData?.student_tiers?.[safeName] === 'elite';
  const myCosmetics = appData?.active_cards?.[safeName] || {};
  const myTickets = Number(appData?.tickets?.[safeName] || 0);

  const activeFrame = myCosmetics?.frame?.val || '';
  let avatarStyle = { background: '#f8fafc', border: `2px solid #e2e8f0`, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', fontSize: '40px' };
  if (activeFrame.includes('Fatih')) { avatarStyle.border = '4px solid #ff3b30'; avatarStyle.boxShadow = '0 0 20px rgba(255,59,48,0.3)'; }
  else if (activeFrame.includes('Elmas')) { avatarStyle.border = '4px solid #3b82f6'; avatarStyle.boxShadow = '0 0 20px rgba(59,130,246,0.3)'; }
  else if (activeFrame.includes('Altın')) { avatarStyle.border = '4px solid #d4af37'; }

  const is2XActive = myCosmetics?.multiplier?.date === new Date().toDateString();

  // YENİ ÖZELLİK: Kişisel Sıralama Hesaplamaları (RP ve M-Coin için ayrı)
  const rpSorted = roster.map(n => ({ n: String(n), rp: Number(appData?.season_score?.[n] || 0) })).sort((a,b) => b.rp - a.rp);
  const myRpRankIndex = rpSorted.findIndex(s => s.n === safeName);
  const myRpRank = myRpRankIndex !== -1 ? myRpRankIndex + 1 : '-';

  const wealthSorted = roster.map(n => ({ n: String(n), w: Number(appData?.wallet?.[n] || 0) })).sort((a,b) => b.w - a.w);
  const myWealthRankIndex = wealthSorted.findIndex(s => s.n === safeName);
  const myWealthRank = myWealthRankIndex !== -1 ? myWealthRankIndex + 1 : '-';

  const products = Object.keys(appData?.market_products || {}).map(k => ({...appData.market_products[k], key: k})).sort((a,b) => Number(b.p || 0) - Number(a.p || 0));

  const handleBuy = (item) => {
     let price = Number(item.p || 0);
     let discount = Number(myCosmetics?.discount || 0);
     if(isElite && discount < 10) discount = 10;
     let finalPrice = Math.ceil(price * (1 - discount/100));
     if (mCoin < finalPrice) return alert(`❌ Bakiyen yetersiz! En az ${finalPrice} M gerekli.`);
     if (window.confirm(`${item.n} ürününü almak istiyor musun?`)) {
        db.ref(`mavikent_premium/wallet/${safeName}`).transaction(c => (Number(c)||0) - finalPrice);
        db.ref('mavikent_premium/deliveries').push({ s: safeName, i: item.n, st: 'wait', type: item.type || 'normal', val: item.val || item.i, date: new Date().toLocaleDateString('tr-TR') });
        alert("✅ Satın alındı! Lütfen envanterinden takip et.");
     }
  };

  const buyTicket = () => {
    if (mCoin < 20) return alert(`Yetersiz M!`);
    db.ref(`mavikent_premium/wallet/${safeName}`).transaction(c => (Number(c)||0) - 20);
    db.ref(`mavikent_premium/tickets/${safeName}`).transaction(c => (Number(c)||0) + 1);
    alert("🎟️ Bilet alındı!");
  };

  const rollLottery = () => {
      if (myTickets <= 0) return alert("Biletin yok!");
      let drawItems = products.filter(p => p.n !== "Çekiliş Bileti" && (p.type === 'normal' || !p.type));
      if (drawItems.length === 0) return alert("Çekiliş havuzu boş.");
      
      const rankMultiplier = 1 + ((roster.length || 1) - (myWealthRank !== '-' ? myWealthRank : 1)) / (roster.length || 1); 
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
          if (spins < 40) { setTimeout(spinLoop, currentSpeed); } 
          else {
              setLotteryState({ active: true, result: selectedPrize, spinning: false, currentDisplay: selectedPrize.i || '🎁', speed: currentSpeed });
              db.ref('mavikent_premium/deliveries').push({ s: safeName, i: selectedPrize.n + " (Çekiliş)", st: 'wait', type: selectedPrize.type || 'normal', val: selectedPrize.val || selectedPrize.i, date: new Date().toLocaleDateString('tr-TR') });
          }
      };
      setTimeout(spinLoop, currentSpeed);
  };

  const activateItem = (delKey, item) => {
      const today = new Date().toDateString();
      const exp = Date.now() + 14 * 24 * 60 * 60 * 1000;
      const updates = {};
      if (item.type === 'multiplier' || (item.i && item.i.includes("2X"))) { updates[`active_cards/${safeName}/multiplier`] = { date: today, val: "2X" }; alert("⚡ 2X Puan Kartı aktif edildi."); } 
      else if (item.type === 'avatar' || item.type === 'title' || item.type === 'frame') { updates[`active_cards/${safeName}/${item.type}`] = { val: item.val || item.i, exp: exp }; alert("✨ Özellik başarıyla kullanıldı."); } 
      else if (item.i && item.i.includes("Gizemli Kutu")) {
          const prize = products[Math.floor(Math.random()*products.length)];
          updates[`deliveries/${db.ref().push().key}`] = { s: safeName, i: (prize?.n || 'Sürpriz') + " (Kutudan)", st: 'wait', type: prize?.type || 'normal', val: prize?.val || prize?.i, date: new Date().toLocaleDateString('tr-TR') };
          alert(`🎁 Kutudan ${prize?.n || 'Ödül'} çıktı! Onay için envanterine eklendi.`);
      }
      updates[`deliveries/${delKey}`] = null; 
      db.ref('mavikent_premium').update(updates);
  };

  const getNavStyle = (tab) => ({
      flex: 1, border: 'none', background: activeTab === tab ? '#ffffff' : 'transparent', 
      color: activeTab === tab ? '#0f172a' : '#64748b', fontWeight: activeTab === tab ? 900 : 700, 
      cursor: 'pointer', padding: '14px 0', borderRadius: '18px', fontSize: '13px', outline: 'none',
      boxShadow: activeTab === tab ? `0 10px 20px -5px rgba(0,0,0,0.1)` : 'none', transition: 'all 0.3s'
  });

  return (
    <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px', paddingBottom: '140px', fontFamily: "'Outfit', sans-serif", outline: 'none' }}>
      
      {lotteryState.active && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '350px', textAlign: 'center', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', animation: 'popIn 0.4s' }}>
             <h2 style={{ margin: '0 0 10px 0', fontWeight: 900, fontSize: '26px', color: '#0f172a' }}>ŞANS ÇARKI</h2>
             <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 30px 0', fontWeight: 600 }}>Ödül aranıyor...</p>
             <div style={{ fontSize: '70px', margin: '0 auto 30px auto', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '50%', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: lotteryState.spinning ? `0 0 30px rgba(212,175,55,0.4)` : 'none', transition: '0.3s' }}>
                 {lotteryState.currentDisplay}
             </div>
             {!lotteryState.spinning ? (
               <div className="fade-in">
                 <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>{lotteryState.result?.n}</div>
                 <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '25px', fontWeight: 600 }}>Envanterine eklendi.</div>
                 <button onClick={() => setLotteryState({active:false})} style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: 'white', width: '100%', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>HARİKA!</button>
               </div>
             ) : <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Bekleyin...</div>}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', paddingTop: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#d4af37', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>HOŞ GELDİN</div>
            <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', color: '#0f172a' }}>{firstName}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: '#ffffff', border: `1px solid #e2e8f0`, padding: '12px 18px', borderRadius: '16px', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', boxShadow: `0 10px 20px -5px rgba(0,0,0,0.05)` }}>
               <span>🪙</span> {mCoin} M
            </div>
            <button onClick={() => setActiveStudent(null)} style={{ background: '#ef4444', color: 'white', padding: '12px 18px', borderRadius: '16px', border: 'none', fontWeight: 800, cursor: 'pointer', outline: 'none' }}>Çıkış</button>
          </div>
        </div>

        <div className="fade-in" key={activeTab}>
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* GELİŞTİRİLMİŞ ÖĞRENCİ PROFİL KARTI (YENİ ÖZELLİKLER BURADA) */}
              <div style={{ background: '#ffffff', borderRadius: '32px', padding: '35px', border: '1px solid #f1f5f9', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)' }}>
                
                {/* Üst Profil Kısmı */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px' }}>
                   <div style={avatarStyle}>{(myCosmetics.avatar && myCosmetics.avatar.val) ? myCosmetics.avatar.val : '🎓'}</div>
                   <div>
                     <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{safeName}</div>
                     <div style={{ fontSize: '15px', color: '#64748b', fontWeight: 700, marginTop: '6px' }}>
                        <span style={{ background: myBadge.color, color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', marginRight: '8px', fontWeight: 900 }}>{myBadge.icon} {myBadge.name}</span>
                        {myCosmetics.title?.val || 'Öğrenci'}
                     </div>
                     {is2XActive && <div style={{ color: 'white', fontWeight: 900, fontSize: '12px', marginTop: '12px', background: 'linear-gradient(135deg, #d4af37, #b45309)', padding: '6px 14px', borderRadius: '10px', display: 'inline-block' }}>⚡ 2X PUAN AKTİF</div>}
                   </div>
                </div>

                {/* YENİ: RP VE ZENGİNLİK SIRALAMASI */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '25px' }}>
                    <div style={{ background: '#fef3c7', borderRadius: '16px', padding: '16px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#b45309' }}>🏆 RP SIRALAMASI</span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#92400e' }}>{myRpRank}.</span>
                    </div>
                    <div style={{ background: '#ecfdf5', borderRadius: '16px', padding: '16px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>💳 ZENGİNLİK (M)</span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#064e3b' }}>{myWealthRank}.</span>
                    </div>
                </div>

                {/* YENİ: DETAYLI XP BARI */}
                <div style={{ background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: '20px', padding: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                       <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Seviye {xpDetail.level}</span>
                       <span style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>Seviye {xpDetail.level + 1}</span>
                   </div>
                   
                   <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                       <div style={{ background: 'linear-gradient(90deg, #3b82f6, #0ea5e9)', width: `${xpDetail.progress}%`, height: '100%', borderRadius: '10px', transition: 'width 0.5s ease-out' }}></div>
                   </div>
                   
                   <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                       <span style={{ color: '#0f172a', fontWeight: 900 }}>{xpDetail.currentXp} XP</span> / {xpDetail.nextLevelXp} XP
                   </div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', borderRadius: '28px', padding: '30px', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.3)' }}>
                 <div><div style={{ fontWeight: 900, fontSize: '22px', marginBottom: '6px' }}>🎰 Şans Çarkı</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Biletiniz: <span style={{ fontWeight: 900, color: '#d4af37', fontSize: '16px' }}>{myTickets}</span></div></div>
                 <button onClick={rollLottery} style={{ background: 'linear-gradient(135deg, #d4af37, #b45309)', color: 'white', padding: '16px 30px', borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(212,175,55,0.3)' }}>Çevir</button>
              </div>

              <div>
                 <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px', color: '#0f172a', letterSpacing: '-0.5px' }}>🎯 Günlük Görevler</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {['q1', 'q2', 'q3'].map(qId => {
                      const q = quests[qId];
                      if (!q || !q.text) return null;
                      const isJoined = (q.participants || []).includes(safeName);
                      return (
                        <div key={qId} style={{ background: '#ffffff', border: `1px solid #f1f5f9`, borderRadius: '24px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                          <div><div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{q.text}</div><div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Ödül: <span style={{ color: '#d4af37', fontWeight: 900 }}>+{q.amt} {q.type}</span></div></div>
                          {isJoined ? <div style={{ background: '#ecfdf5', color: '#10b981', border: `1px solid #10b981`, padding: '10px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 900 }}>Katıldın ✓</div> : <button onClick={() => { db.ref(`mavikent_premium/quests/${qId}/participants`).set([...(q.participants||[]), safeName]); alert('Göreve katıldınız.'); }} style={{ background: '#0f172a', color: 'white', padding: '12px 24px', fontSize: '14px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', outline: 'none' }}>Katıl</button>}
                        </div>
                      )
                   })}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>🛍️ Market</h2>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                 <div onClick={buyTicket} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none', borderRadius: '24px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 15px 30px -5px rgba(15,23,42,0.2)' }}>
                     <div style={{ fontSize: '50px', marginBottom: '16px' }}>🎟️</div><div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>Çekiliş Bileti</div><div style={{ background: '#d4af37', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 900, display: 'inline-block' }}>20 M</div>
                 </div>
                 {products.filter(p=>p.n!=="Çekiliş Bileti").map(p => (
                   <div key={p.key} onClick={() => handleBuy(p)} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                     <div style={{ fontSize: '50px', marginBottom: '16px' }}>{p.i || '📦'}</div><div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: '#0f172a', lineHeight: '1.4' }}>{p.n}</div><div style={{ background: '#f8fafc', border: `2px solid #e2e8f0`, color: '#0f172a', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 900, display: 'inline-block' }}>{p.p} M</div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>🎒 Envanterim</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {Object.keys(appData?.deliveries || {}).reverse().filter(k => appData.deliveries[k].s === safeName && appData.deliveries[k].st === 'done').map(k => {
                    const item = appData.deliveries[k];
                    const isDigital = item.type === 'multiplier' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || (item.i && item.i.includes("Gizemli"));
                    if (!isDigital) return null; 
                    return (
                      <div key={k} style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                        <div><div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', marginBottom: '6px' }}>{item.i}</div><div style={{ fontSize: '12px', color: '#10b981', fontWeight: 900 }}>✅ HAZIR</div></div>
                        <button onClick={() => activateItem(k, item)} style={{ background: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', outline: 'none' }}>Kullan</button>
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
                 {Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].s === safeName).length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontWeight: 700, fontSize: '16px' }}>Envanterin şu an boş.</div>}
               </div>
            </div>
          )}

          {activeTab === 'rank' && (
            <div className="fade-in">
               <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>🏆 Liderlik Tablosu</h2>
               <div style={{ background: '#ffffff', borderRadius: '28px', padding: '15px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                 {allTimeRankings.map((s, idx) => {
                   const currentBadge = getRankBadge(s.rp);
                   return (
                     <div key={s.n} style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', borderBottom: idx < allTimeRankings.length-1 ? `1px solid #e2e8f0` : 'none' }}>
                       <div style={{ width: '40px', fontWeight: 900, color: idx<3 ? '#0f172a' : '#94a3b8', fontSize: '18px' }}>{idx+1}.</div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>{s.n}</span><span style={{ fontSize: '12px', color: currentBadge.color, fontWeight: 900, marginTop: '4px' }}>{currentBadge.icon} {currentBadge.name}</span></div>
                       <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '18px' }}>{s.rp} <span style={{ fontSize: '12px', color: '#64748b' }}>RP</span></div>
                     </div>
                   )
                 })}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* LÜKS ALT MENÜ (NAVBAR) */}
      <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', display: 'flex', padding: '10px', width: '90%', maxWidth: '500px', zIndex: 1000, boxShadow: `0 20px 40px -10px rgba(0,0,0,0.15)`, border: `1px solid rgba(255,255,255,0.5)` }}>
         <button onClick={() => setActiveTab('home')} style={getNavStyle('home')}>Özet</button>
         <button onClick={() => setActiveTab('market')} style={getNavStyle('market')}>Market</button>
         <button onClick={() => setActiveTab('inventory')} style={getNavStyle('inventory')}>Envanter</button>
         <button onClick={() => setActiveTab('rank')} style={getNavStyle('rank')}>Sıralama</button>
      </div>
    </div>
  );
};

export default StudentScreen;