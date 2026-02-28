import React, { useState } from 'react';
import { db } from '../firebase';

export default function StudentScreen({ appData, goBackToRoles }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const [usernameInput, setUsernameInput] = useState(''); 
  const [pinInput, setPinInput] = useState('');
  
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // --- YARDIMCI FONKSİYONLAR ---
  const getXP = (n) => appData.xp?.[n] || 0;
  const getLevel = (n) => Math.floor(getXP(n) / 200) + 1;
  const getWalletBalance = (n) => appData.wallet?.[n] || 0;
  const getRankScore = (n) => appData.season_score?.[n] || 0;
  const getAllTimeCoin = (n) => appData.all_time_coin?.[n] || getWalletBalance(n); 
  const isElite = (n) => appData.student_tiers?.[n] === 'elite';
  const getStreak = (n) => appData.streaks?.[n] || 0;

  const getBadgeInfo = (score) => {
    if(score >= 200) return { name: 'FATİH 👑', class: 'bg-fatih', color: '#ef4444' };
    if(score >= 150) return { name: 'TAÇ 💠', class: 'bg-tac', color: '#d946ef' };
    if(score >= 100) return { name: 'PLATİN 💎', class: 'bg-platin', color: '#0ea5e9' };
    if(score >= 70) return { name: 'ALTIN 🥇', class: 'bg-altin', color: '#eab308' };
    if(score >= 40) return { name: 'GÜMÜŞ 🥈', class: 'bg-gumus', color: '#64748b' };
    return { name: 'BRONZ 🥉', class: 'bg-bronz', color: '#b45309' };
  };

  const getCosmetics = (n) => {
    const ac = appData.active_cards?.[n] || {};
    const now = Date.now();
    return {
      avatar: (ac.avatar && ac.avatar.exp > now) ? ac.avatar.val : '🎓',
      frame: (ac.frame && ac.frame.exp > now) ? ac.frame.val : '',
      title: (ac.title && ac.title.exp > now) ? ac.title.val : '',
      style: (ac.title && ac.title.exp > now) ? ac.title.style : '',
      badge: ac.equipped_badge ? ac.equipped_badge.val : '' // Vitrindeki rozet
    };
  };

  const getAchievements = (n) => {
    if (!n) return [];
    const allTimeCoin = getAllTimeCoin(n);
    const streak = getStreak(n);
    const rankScore = getRankScore(n);
    
    return [
      { id: 'a1', name: 'İlk Kan', desc: 'Tüm zamanlar kasanda ilk defa 50 M-Coin biriktir.', icon: '🩸', unlocked: allTimeCoin >= 50 },
      { id: 'a2', name: 'Zengin', desc: 'Tüm zamanlar kasanda 200 M-Coin sınırını geç.', icon: '💸', unlocked: allTimeCoin >= 200 },
      { id: 'a3', name: 'Milyoner', desc: 'Tüm zamanlar kasanda 500 M-Coin barajını yık!', icon: '💎', unlocked: allTimeCoin >= 500 },
      { id: 'a4', name: 'Disiplinli', desc: 'Kurallara uyarak 5 gün üst üste seri (streak) yap.', icon: '🔥', unlocked: streak >= 5 },
      { id: 'a5', name: 'Prestij Ustası', desc: 'Sistemde gösterdiğin başarılarla 100 Rütbe Puanına (RP) ulaş.', icon: '🎖️', unlocked: rankScore >= 100 }
    ];
  };

  // --- GİRİŞ / ÇIKIŞ ---
  const handleLogin = () => {
    const rawUsername = usernameInput.trim().toLowerCase();
    if (!rawUsername || !pinInput) return alert("Lütfen kullanıcı adınızı ve şifrenizi girin.");

    let exactName = null;
    if (appData.student_usernames) {
      for (const [fullName, customUser] of Object.entries(appData.student_usernames)) {
        if (customUser === rawUsername) { exactName = fullName; break; }
      }
    }
    if (!exactName) exactName = appData.roster?.find(n => n.toLocaleLowerCase('tr-TR').replace(/\s+/g, '') === rawUsername);
    if (!exactName) return alert("Bu kullanıcı adına sahip bir hesap bulunamadı!");

    const realPin = appData.student_pins?.[exactName];
    if (!realPin) return alert("Henüz şifreniz belirlenmemiş. Yönetim ile görüşün.");

    if (pinInput === realPin) {
      setLoggedInStudent(exactName); 
      setShowLoginModal(false);      
      setUsernameInput('');              
      setPinInput('');
      setActiveTab('home'); 
    } else {
      alert("Hatalı şifre!");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Kişisel oturumun kapatılacak. Emin misin?")) {
      setLoggedInStudent(null);
      setActiveTab('home');
    }
  };

  const submitQuestForApproval = (questId) => {
    if (window.confirm("Bu görevi tamamladığına emin misin? Yönetici onayına gönderilecek.")) {
      db.ref(`mavikent_premium/personal_quests/${loggedInStudent}/${questId}`).update({ status: 'pending' });
    }
  };

  // --- MARKET VE ENVANTER YÖNETİMİ ---
  const handleBuyItem = (itemName, price, key, productType, productVal, productStyle) => {
    if (!loggedInStudent) return alert("Satın almak için GİRİŞ YAPMALISIN!");

    let currentDiscount = appData.active_cards?.[loggedInStudent]?.discount || 0;
    if (isElite(loggedInStudent) && currentDiscount < 10) currentDiscount = 10;

    const dailyItems = appData.daily_deals?.items || [];
    const deal = dailyItems.find(d => d.key === key);
    let basePrice = price;
    if (deal) basePrice = Math.floor(basePrice * (1 - deal.discount / 100)); 
    const finalPrice = Math.ceil(basePrice * (1 - currentDiscount / 100)); 

    const balance = getWalletBalance(loggedInStudent);
    if (balance < finalPrice) return alert(`Yetersiz Bakiye! Bu ürün ${finalPrice} M.`);

    if (window.confirm(`🛒 "${itemName}" adlı ürünü ${finalPrice} M karşılığında satın alıyorsun. Onaylıyor musun?`)) { 
      db.ref(`mavikent_premium/wallet/${loggedInStudent}`).set(balance - finalPrice); 
      
      if (productType === 'avatar' || productType === 'frame' || productType === 'title') {
        db.ref(`mavikent_premium/inventory/${loggedInStudent}/${key}`).set({ type: productType, val: productVal, style: productStyle, name: itemName });
        db.ref(`mavikent_premium/active_cards/${loggedInStudent}/${productType}`).set({val: productVal, style: productStyle || "", exp: Date.now() + 365*24*60*60*1000}); 
        alert("✅ Satın Alındı! Kozmetik hemen uygulandı ve KASANA eklendi."); 
      }
      else if (itemName.includes("2X")) { 
        db.ref(`mavikent_premium/active_cards/${loggedInStudent}/multiplier`).set({date: new Date().toDateString()}); 
        alert("✅ Aktif Edildi!"); 
      }
      else { 
        db.ref('mavikent_premium/deliveries').push({ s: loggedInStudent, i: itemName, st: 'wait', c: 1, date: new Date().toLocaleDateString('tr-TR') });
        alert(`✅ Siparişiniz başarıyla alındı! Yönetici panelinize iletildi.`);
      }
    } 
  };

  const equipItem = (item) => {
    db.ref(`mavikent_premium/active_cards/${loggedInStudent}/${item.type}`).set({
      val: item.val, style: item.style || "", exp: Date.now() + 365*24*60*60*1000
    });
    alert(`✅ ${item.name} kuşandın! Liderlik tablolarında herkes bunu görecek.`);
  };

  // ROZETİ VİTRİNE KOYMA VE KALDIRMA
  const equipBadge = (ach) => {
    db.ref(`mavikent_premium/active_cards/${loggedInStudent}/equipped_badge`).set({
      val: ach.icon, name: ach.name
    });
    alert(`🎖️ "${ach.name}" rozeti vitrine sabitlendi!`);
  };

  const unequipBadge = () => {
    db.ref(`mavikent_premium/active_cards/${loggedInStudent}/equipped_badge`).remove();
    alert(`🗑️ Rozet vitrinden kaldırıldı.`);
  };

  // --- GÜNLÜK GİRİŞ ÖDÜLÜ ---
  const checkDailyLogin = () => {
    if (!loggedInStudent) return null;
    const today = new Date(); const todayStr = today.toLocaleDateString('tr-TR');
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const yesterdayStr = yesterday.toLocaleDateString('tr-TR');

    const loginData = appData.daily_logins?.[loggedInStudent] || { lastDate: '', streak: 0 };
    if (loginData.lastDate === todayStr) return { canClaim: false };

    let newStreak = 1;
    if (loginData.lastDate === yesterdayStr) newStreak = loginData.streak + 1;

    const reward = newStreak + 1; 
    return { canClaim: true, streak: newStreak, reward };
  };

  const claimDailyReward = () => {
    const dailyInfo = checkDailyLogin();
    if (!dailyInfo || !dailyInfo.canClaim) return;
    
    const today = new Date().toLocaleDateString('tr-TR');
    const currentCoin = getWalletBalance(loggedInStudent);
    const currentAllTime = getAllTimeCoin(loggedInStudent);
    
    db.ref(`mavikent_premium/daily_logins/${loggedInStudent}`).set({ lastDate: today, streak: dailyInfo.streak });
    db.ref(`mavikent_premium/wallet/${loggedInStudent}`).set(currentCoin + dailyInfo.reward);
    db.ref(`mavikent_premium/all_time_coin/${loggedInStudent}`).set(currentAllTime + dailyInfo.reward);
    
    alert(`🎁 Harika! Günlük giriş serin ${dailyInfo.streak}. Gününde! +${dailyInfo.reward} M-Coin kazandın.`);
  };


  // ==========================================
  // BİLEŞEN: TEPEDEKİ DUYURU VE GÖREV KUTULARI
  // ==========================================
  const renderTopBoxes = () => {
    let annText = appData.settings?.ann1 || "Şu an için aktif bir genel duyuru bulunmuyor.";
    let activeQuests = []; let pendingQuests = [];
    
    if (loggedInStudent) {
      const myQuests = appData.personal_quests?.[loggedInStudent] || {};
      activeQuests = Object.entries(myQuests).filter(([id, q]) => q.status === 'wait');
      pendingQuests = Object.entries(myQuests).filter(([id, q]) => q.status === 'pending');
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="elite-card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '32px', marginRight: '15px' }}>📢</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 900, color: '#1e3a8a', fontSize: '16px', marginBottom: '5px' }}>GENEL DUYURU</div><div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 600 }}>{annText}</div></div>
        </div>

        <div className="elite-card" style={{ background: '#fdf4ff', border: '1px solid #fbcfe8', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '32px', marginRight: '15px' }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: '#86198f', fontSize: '16px', marginBottom: '10px' }}>BANA ÖZEL GÖREVLER</div>
            {!loggedInStudent ? (
              <div style={{ color: '#d946ef', fontSize: '13px', fontWeight: 600 }}>Görevleri görmek için giriş yapın.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeQuests.length === 0 && pendingQuests.length === 0 && <div style={{ color: '#d946ef', fontSize: '13px', fontWeight: 600 }}>Aktif bir görev yok.</div>}
                {activeQuests.map(([id, q]) => (
                  <div key={id} style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #fbcfe8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 800, color: '#86198f' }}>{q.text}</span><span style={{ fontSize: '11px', fontWeight: 900, color: q.type==='M'?'#10b981':'#f59e0b' }}>+{q.amt} {q.type}</span></div>
                    <button className="elite-action-btn" style={{ padding: '6px', fontSize: '11px', background: '#10b981', color: 'white' }} onClick={() => submitQuestForApproval(id)}>✅ TAMAMLADIM</button>
                  </div>
                ))}
                {pendingQuests.map(([id, q]) => (
                  <div key={id} style={{ background: '#fffbeb', padding: '10px', borderRadius: '12px', border: '1px dashed #fcd34d', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', textDecoration: 'line-through' }}>{q.text}</span><span style={{ fontSize: '10px', fontWeight: 900, color: '#d97706' }}>⏳ ONAY BEKLİYOR</span></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // BİLEŞEN: KİŞİSEL PANO VE BAŞARIM ROZETLERİ
  // ==========================================
  const renderPersonalDashboard = () => {
    const n = loggedInStudent;
    const c = getCosmetics(n);
    const lvl = getLevel(n);
    const xp = getXP(n);
    const xpInLevel = xp % 200;
    const progress = (xpInLevel / 200) * 100;
    const rankScore = getRankScore(n);
    const mCoin = getWalletBalance(n);
    const allTimeCoin = getAllTimeCoin(n);
    const badge = getBadgeInfo(rankScore);
    const streak = getStreak(n);
    const dailyInfo = checkDailyLogin();
    const achievements = getAchievements(loggedInStudent);
    
    const highestNet = appData.exams?.[n]?.deneme?.net ? parseFloat(appData.exams[n].deneme.net).toFixed(2) : "Girmedi";
    const weeklyYoklama = appData.yoklama_w?.[n] || 0;
    const weeklyYatak = appData.yatak_w?.[n] || 0;
    const weeklyTelefon = appData.telefon_w?.[n] || 0;
    const weeklyKanaat = appData.kanaat_w?.[n] || 0;

    return (
      <div className="fade-in" style={{ marginTop: '20px' }}>
        
        {dailyInfo && dailyInfo.canClaim && (
          <div onClick={claimDailyReward} style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', color: 'white', padding: '15px 20px', borderRadius: '16px', fontWeight: 900, fontSize: '15px', marginBottom: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', animation: 'pulseGold 2s infinite' }}>
            <span>🎁 GÜNLÜK GİRİŞ ÖDÜLÜNÜ AL!</span><span style={{ background: 'white', color: '#b45309', padding: '5px 10px', borderRadius: '10px', fontSize: '13px' }}>+{dailyInfo.reward} M</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', borderRadius: '24px', padding: '30px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '100px', opacity: 0.05 }}>{c.avatar}</div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                  <div className={c.frame} style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1e293b', fontSize: '40px' }}><span className="avatar-emoji">{c.avatar}</span></div>
                  {c.title && <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', marginBottom: '5px' }}><span className={`premium-title ${c.style}`}>[{c.title}]</span></div>}
                  
                  <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {c.badge && <span style={{ fontSize: '20px' }} title="Vitrindeki Rozet">{c.badge}</span>}
                    {n}
                  </div>
                  
                  {streak > 0 && <div style={{ marginBottom: '15px' }}><span style={{ background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 900 }}>🔥 {streak} Gün Seride!</span></div>}
                  {isElite(n) && <div style={{ marginBottom: '15px' }}><span style={{ background: 'linear-gradient(135deg, #facc15, #b45309)', color: '#0f172a', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 900 }}>👑 ELİT LİG</span></div>}
                  
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900 }}>PRESTİJ</div><div style={{ fontSize: '16px', fontWeight: 900, color: badge.color }}>{badge.name}</div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>{rankScore} RP</div></div>
                      <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900 }}>CÜZDAN</div><div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>{mCoin} M</div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>Mevcut</div></div>
                      <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900 }}>REKOR</div><div style={{ fontSize: '16px', fontWeight: 900, color: '#a855f7' }}>{allTimeCoin} M</div><div style={{ fontSize: '11px', fontWeight: 'bold' }}>Tüm Zamanlar</div></div>
                  </div>

                  <div style={{ textAlign: 'left', marginBottom: '5px', fontSize: '11px', fontWeight: 900, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#d4af37' }}>SEVİYE {lvl}</span><span style={{ color: '#94a3b8' }}>{xpInLevel} / 200 XP</span></div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '12px', width: '100%', overflow: 'hidden', marginBottom: '20px' }}><div style={{ background: 'linear-gradient(90deg, #d4af37, #fef08a)', height: '100%', width: `${progress}%`, borderRadius: '10px' }}></div></div>
                  
                  <div style={{ textAlign: 'left', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                     <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 900, marginBottom: '10px' }}>🎖️ TÜM BAŞARIMLARIN</div>
                     <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {achievements.map(ach => (
                           <div key={ach.id} onClick={() => setSelectedAchievement(ach)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ach.unlocked ? 1 : 0.3, filter: ach.unlocked ? 'none' : 'grayscale(1)', minWidth: '60px', transition: 'transform 0.2s' }} className="elite-hover">
                              <div style={{ fontSize: '24px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', border: ach.unlocked ? '1px solid #d4af37' : '1px solid transparent' }}>{ach.icon}</div>
                              <div style={{ fontSize: '9px', fontWeight: 800, marginTop: '5px', textAlign: 'center' }}>{ach.name}</div>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>
          </div>

          <div className="elite-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>📊 HAFTALIK KAZANÇ BİLANÇOSU</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '28px', marginBottom: '5px' }}>🕌</div><div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>YOKLAMA</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{weeklyYoklama} M</div></div>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '28px', marginBottom: '5px' }}>🛏️</div><div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>YATAK/DOLAP</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>{weeklyYatak} M</div></div>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '28px', marginBottom: '5px' }}>📱</div><div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>TELEFON</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#8b5cf6' }}>{weeklyTelefon} M</div></div>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '28px', marginBottom: '5px' }}>⭐</div><div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>KANAAT</div><div style={{ fontSize: '18px', fontWeight: 900, color: '#d946ef' }}>{weeklyKanaat} M</div></div>
              </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNavCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '40px' }}>
      <div className="elite-card elite-hover" onClick={() => setActiveTab('rp')} style={{ padding: '20px', borderLeft: '6px solid #d4af37' }}><div style={{ fontSize: '36px', marginRight: '15px' }}>🏆</div><div><div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>PRESTİJ KLASMANI</div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>RP Sezon Sıralaması.</div></div></div>
      <div className="elite-card elite-hover" onClick={() => setActiveTab('mcoin')} style={{ padding: '20px', borderLeft: '6px solid #10b981' }}><div style={{ fontSize: '36px', marginRight: '15px' }}>🪙</div><div><div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>ELİT CÜZDANLAR</div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Mevcut Bakiye Liderleri.</div></div></div>
      <div className="elite-card elite-hover" onClick={() => setActiveTab('alltime')} style={{ padding: '20px', borderLeft: '6px solid #a855f7' }}><div style={{ fontSize: '36px', marginRight: '15px' }}>🌟</div><div><div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>ŞÖHRETLER MÜZESİ</div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tüm zamanların rekorları.</div></div></div>
      <div className="elite-card elite-hover" onClick={() => setActiveTab('market')} style={{ padding: '20px', borderLeft: '6px solid #ef4444' }}><div style={{ fontSize: '36px', marginRight: '15px' }}>🛒</div><div><div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>SANAL MARKET</div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>M-Coin harca, ürün kazan.</div></div></div>
      
      {loggedInStudent && (
        <div className="elite-card elite-hover" onClick={() => setActiveTab('inventory')} style={{ padding: '20px', borderLeft: '6px solid #3b82f6' }}><div style={{ fontSize: '36px', marginRight: '15px' }}>🎒</div><div><div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>KİŞİSEL KASAM</div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Kozmetik ve Rozet Koleksiyonun.</div></div></div>
      )}
    </div>
  );

  // ==========================================
  // BİLEŞEN: KİŞİSEL KASAM (AKILLI VİTRİN)
  // ==========================================
  const renderInventory = () => {
    if (!loggedInStudent) return null;
    
    // 1. Kozmetikler
    const inv = appData.inventory?.[loggedInStudent] || {};
    const items = Object.keys(inv).map(k => ({ id: k, ...inv[k] }));

    // 2. Rozetler
    const myUnlockedBadges = getAchievements(loggedInStudent).filter(a => a.unlocked);
    const c = getCosmetics(loggedInStudent); // Şu an takılı olan rozeti kontrol etmek için

    return (
      <div className="fade-in">
        <button className="elite-back-btn" onClick={() => setActiveTab('home')}>❮ Ana Ekrana Dön</button>
        <div className="elite-section-title" style={{ color: '#3b82f6', marginBottom: '20px' }}>🎒 KİŞİSEL KASAM</div>
        
        {/* KOZMETİKLER BÖLÜMÜ */}
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '15px', paddingLeft: '10px' }}>🎭 Marketten Alınan Kozmetikler</div>
        {items.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', textAlign: 'center', color: '#64748b', marginBottom: '40px' }}>Henüz marketten kozmetik ürün satın almamışsın.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {items.map(item => (
              <div key={item.id} className="elite-card elite-hover" style={{ flexDirection: 'column', textAlign: 'center', padding: '20px 15px' }}>
                <div style={{ fontSize: '42px', marginBottom: '10px' }}>{item.val}</div>
                <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a', marginBottom: '15px' }}>{item.name}</div>
                <button className="elite-action-btn" style={{ background: '#3b82f6', color: 'white', padding: '8px 15px', fontSize: '11px' }} onClick={() => equipItem(item)}>BUNU KUŞAN</button>
              </div>
            ))}
          </div>
        )}

        {/* ROZETLER BÖLÜMÜ (VİTRİNE KOY / KALDIR) */}
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '15px', paddingLeft: '10px' }}>🎖️ Kazanılan Başarım Rozetleri</div>
        {myUnlockedBadges.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', textAlign: 'center', color: '#64748b' }}>Henüz hiçbir başarım rozetinin kilidini açamadın. Profilinden şartları öğrenebilirsin.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {myUnlockedBadges.map(ach => {
              const isEquipped = c.badge === ach.icon; // Bu rozet şu an vitrinde mi?
              
              return (
                <div key={ach.id} className="elite-card elite-hover" style={{ flexDirection: 'column', textAlign: 'center', padding: '20px 15px', border: isEquipped ? '2px solid #3b82f6' : '2px solid #fef08a', background: isEquipped ? '#eff6ff' : '#fffbeb' }} onClick={() => setSelectedAchievement(ach)}>
                  <div style={{ fontSize: '42px', marginBottom: '10px', filter: 'drop-shadow(0px 4px 6px rgba(212,175,55,0.4))' }}>{ach.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: isEquipped ? '#1e3a8a' : '#b45309', marginBottom: '10px' }}>{ach.name}</div>
                  
                  {isEquipped ? (
                    <button className="elite-action-btn" style={{ background: '#fee2e2', color: '#ef4444', padding: '8px 15px', fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); unequipBadge(); }}>VİTRİNDEN KALDIR</button>
                  ) : (
                    <button className="elite-action-btn" style={{ background: '#d4af37', color: 'white', padding: '8px 15px', fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); equipBadge(ach); }}>VİTRİNE KOY</button>
                  )}
                
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderLeaderboard = (boardType) => {
    const users = (appData.roster || []).map(n => ({ n, w: getWalletBalance(n), r: getRankScore(n), a: getAllTimeCoin(n) }));
    const sorted = [...users].sort((a,b) => { if(boardType === 'rp') return b.r - a.r; if(boardType === 'alltime') return b.a - a.a; return b.w - a.w; });
    const myRankIndex = loggedInStudent ? sorted.findIndex(user => user.n === loggedInStudent) : -1;
    const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;
    const top3 = sorted.slice(0,3); const rest = sorted.slice(3);
    let titleStr = ''; let mainColor = '';
    if(boardType === 'rp') { titleStr = '🏆 PRESTİJ KLASMANI'; mainColor = '#d4af37'; }
    if(boardType === 'mcoin') { titleStr = '🪙 ELİT CÜZDANLAR'; mainColor = '#10b981'; }
    if(boardType === 'alltime') { titleStr = '🌟 ŞÖHRETLER MÜZESİ'; mainColor = '#a855f7'; }

    return (
      <div className="fade-in">
        <button className="elite-back-btn" onClick={() => setActiveTab('home')}>❮ Ana Ekrana Dön</button>
        <div className="elite-section-title" style={{ color: mainColor }}>{titleStr}</div>
        
        {loggedInStudent && myRank && (
          <div style={{ background: `linear-gradient(135deg, ${mainColor}, #0f172a)`, color: 'white', padding: '20px', borderRadius: '16px', maxWidth: '600px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ fontSize: '32px' }}>🎯</div><div><div style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>SENİN SIRALAMAN</div><div style={{ fontSize: '20px', fontWeight: 900 }}>{myRank}. Sıradasın</div></div></div>
             <div style={{ fontSize: '24px', fontWeight: 900 }}>{boardType === 'rp' ? getRankScore(loggedInStudent) + ' RP' : boardType === 'mcoin' ? getWalletBalance(loggedInStudent) + ' M' : getAllTimeCoin(loggedInStudent) + ' M'}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '15px', marginBottom: '40px', minHeight: '200px' }}>
          {[1, 0, 2].map((idx) => {
            const p = top3[idx]; if (!p) return null;
            const pos = idx === 0 ? 1 : idx === 1 ? 2 : 3;
            const isMe = p.n === loggedInStudent; 
            const c = getCosmetics(p.n);
            let scoreStr = ''; if(boardType === 'rp') scoreStr = p.r + ' RP'; if(boardType === 'mcoin') scoreStr = p.w + ' M'; if(boardType === 'alltime') scoreStr = p.a + ' M';
            const heights = { 1: '160px', 2: '130px', 3: '110px' }; const colors = { 1: '#fef08a', 2: '#e2e8f0', 3: '#fed7aa' };
            return (
              <div key={p.n} style={{ width: '120px', background: isMe ? '#eff6ff' : 'white', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 10px', boxShadow: isMe ? '0 0 20px rgba(59,130,246,0.5)' : '0 -10px 20px rgba(0,0,0,0.05)', position: 'relative', height: heights[pos], border: isMe ? '3px solid #3b82f6' : 'none', borderBottom: 'none' }}>
                  <div style={{ position: 'absolute', top: '-25px', background: colors[pos], width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900, fontSize: '14px', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>{pos}</div>
                  <div style={{ fontSize: '32px', marginBottom: '5px' }}>{c.avatar}</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: isMe ? '#2563eb' : '#0f172a', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px' }}>
                    {c.badge && <span title="Seçili Rozet">{c.badge}</span>} {p.n.split(' ')[0]} {isMe && '(SEN)'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: mainColor, marginTop: 'auto' }}>{scoreStr}</div>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
          {rest.map((p, i) => {
            const isMe = p.n === loggedInStudent; 
            const c = getCosmetics(p.n);
            const badgeHtml = boardType === 'rp' ? getBadgeInfo(p.r) : null;
            let scoreStr = ''; if(boardType === 'rp') scoreStr = p.r + ' RP'; if(boardType === 'mcoin') scoreStr = p.w + ' M'; if(boardType === 'alltime') scoreStr = p.a + ' M';
            return (
              <div key={p.n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: i === rest.length-1 ? 'none' : '1px solid #f1f5f9', background: isMe ? '#eff6ff' : 'transparent', borderRadius: isMe ? '12px' : '0', border: isMe ? '2px solid #93c5fd' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontWeight: 900, color: isMe ? '#2563eb' : '#94a3b8', width: '20px' }}>{i+4}.</div>
                    <div style={{ fontSize: '24px' }}>{c.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 900, color: isMe ? '#1e3a8a' : '#0f172a', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {c.badge && <span title="Seçili Rozet">{c.badge}</span>} {p.n} {isElite(p.n) && '👑'} {isMe && <span style={{fontSize:'10px', background:'#3b82f6', color:'white', padding:'2px 6px', borderRadius:'6px'}}>SEN</span>}
                      </div>
                      {badgeHtml && <div style={{ fontSize: '10px', color: badgeHtml.color, fontWeight: 900 }}>{badgeHtml.name}</div>}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: mainColor }}>{scoreStr}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMarket = () => {
    let productList = [];
    const rawProds = appData.market_products || {};
    Object.keys(rawProds).forEach(key => productList.push({...rawProds[key], key: key}));
    let studentDiscount = 0; const myBalance = loggedInStudent ? getWalletBalance(loggedInStudent) : 0;
    if (loggedInStudent) { studentDiscount = appData.active_cards?.[loggedInStudent]?.discount || 0; if(isElite(loggedInStudent) && studentDiscount < 10) studentDiscount = 10; }

    return (
      <div className="fade-in">
          <button className="elite-back-btn" onClick={() => setActiveTab('home')}>❮ Ana Ekrana Dön</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
             <div className="elite-section-title" style={{ color: '#ef4444', margin: 0 }}>🛒 MAVİKENT MARKET</div>
             {loggedInStudent && (<div style={{ background: '#ecfdf5', border: '2px solid #10b981', color: '#065f46', padding: '10px 20px', borderRadius: '14px', fontWeight: 900, fontSize: '16px' }}>Cüzdan: {myBalance} M</div>)}
          </div>
          {loggedInStudent && studentDiscount > 0 && (<div style={{ background: '#fffbeb', color: '#b45309', padding: '15px', borderRadius: '16px', fontWeight: 'bold', fontSize: '14px', marginBottom: '30px', textAlign: 'center', border: '2px solid #fde047' }}>🎉 Özel %{studentDiscount} indirim hakkın var! Fiyatlar düştü.</div>)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {productList.sort((a,b) => b.p - a.p).map(p => {
                const finalPrice = Math.ceil(p.p * (1 - studentDiscount / 100));
                const canAfford = loggedInStudent ? myBalance >= finalPrice : true; 
                return (
                  <div key={p.key} className="elite-card elite-hover" style={{ flexDirection: 'column', textAlign: 'center', padding: '25px 15px', opacity: canAfford ? 1 : 0.6, filter: canAfford ? 'none' : 'grayscale(0.8)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>{p.i || '📦'}</div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', marginBottom: '10px' }}>{p.n}</div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                      {studentDiscount > 0 && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>{p.p}</span>}
                      <span style={{ fontWeight: 900, fontSize: '20px', color: canAfford ? '#10b981' : '#ef4444' }}>{finalPrice} M</span>
                    </div>
                    {loggedInStudent ? ( canAfford ? (<button className="elite-action-btn" style={{ background: '#10b981', color: 'white', padding: '10px' }} onClick={() => handleBuyItem(p.n, p.p, p.key, p.type, p.val, p.style)}>SATIN AL</button>) : (<div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '12px', fontWeight: 900, fontSize: '13px', width: '100%' }}>🔒 YETERSİZ BAKİYE</div>) ) : (<div style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>Almak için giriş yap</div>)}
                  </div>
                )
            })}
          </div>
      </div>
    )
  }

  // ==========================================
  // ANA RENDER 
  // ==========================================
  const tickerText = appData.settings?.news_ticker || "MAVİKENT ELITE YENİ SEZON BAŞLADI!";

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px 20px 60px 20px', fontFamily: '"Nunito", sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .elite-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); display: flex; align-items: center; transition: all 0.2s ease; cursor: pointer; }
        .elite-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
        .elite-back-btn { background: transparent; color: #64748b; border: none; font-size: 14px; font-weight: 800; cursor: pointer; padding: 0; margin-bottom: 20px; display: inline-block; transition: color 0.2s; }
        .elite-back-btn:hover { color: #0f172a; }
        .elite-section-title { text-align: center; font-weight: 900; font-size: 26px; color: #0f172a; margin-bottom: 40px; letter-spacing: 1px; }
        .elite-action-btn { width: 100%; padding: 12px 20px; border-radius: 12px; border: none; font-size: 14px; font-weight: 900; cursor: pointer; transition: transform 0.1s; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .elite-action-btn:active { transform: scale(0.98); }
        .elite-input { width: 100%; padding: 16px 20px; border-radius: 16px; border: 2px solid #e2e8f0; background: #f8fafc; font-size: 16px; font-weight: 700; outline: none; transition: border 0.2s; margin-bottom: 15px; color: #0f172a; }
        .elite-input:focus { border-color: #3b82f6; background: white; }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        .news-ticker { background: #0f172a; color: white; padding: 10px; border-radius: 12px; font-weight: bold; font-size: 13px; overflow: hidden; white-space: nowrap; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .news-ticker span { display: inline-block; padding-left: 100%; animation: scroll 15s linear infinite; }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
      `}} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, fontSize: '24px', color: '#0f172a', letterSpacing: '2px' }}>MAVİKENT</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {loggedInStudent ? (
            <button style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }} onClick={handleLogout}>👤 ÇIKIŞ YAP</button>
          ) : (
            <button style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }} onClick={() => setShowLoginModal(true)}>GİRİŞ YAP</button>
          )}
          <button style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }} onClick={goBackToRoles}>SİSTEMDEN ÇIK</button>
        </div>
      </div>

      <div className="news-ticker"><span>🔴 SON DAKİKA: {tickerText}</span></div>

      {activeTab === 'home' && (
        <div className="fade-in">
          {renderTopBoxes()}
          {loggedInStudent && renderPersonalDashboard()}
          {renderNavCards()}
        </div>
      )}

      {activeTab === 'rp' && renderLeaderboard('rp')}
      {activeTab === 'mcoin' && renderLeaderboard('mcoin')}
      {activeTab === 'alltime' && renderLeaderboard('alltime')}
      {activeTab === 'market' && renderMarket()}
      {activeTab === 'inventory' && renderInventory()}

      {/* GİRİŞ MODALI */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <div className="fade-in" style={{ background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '350px', width: '90%' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, marginBottom: '20px', color: '#0f172a' }}>ÖĞRENCİ GİRİŞİ</div>
            <input type="text" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '16px', fontWeight: 700, outline: 'none', marginBottom: '10px', color: '#0f172a', textTransform: 'lowercase' }} placeholder="KULLANICI ADI" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pinInputLogin').focus()} />
            <input id="pinInputLogin" type="password" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '16px', fontWeight: 700, outline: 'none', marginBottom: '20px', color: '#0f172a', letterSpacing: '5px', textAlign: 'center' }} placeholder="ŞİFRE" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="elite-action-btn" style={{ background: '#f1f5f9', color: '#64748b', boxShadow: 'none' }} onClick={() => setShowLoginModal(false)}>İPTAL</button>
              <button className="elite-action-btn" style={{ background: '#3b82f6', color: 'white' }} onClick={handleLogin}>GİRİŞ YAP</button>
            </div>
          </div>
        </div>
      )}

      {/* BAŞARIM ROZETİ BİLGİ MODALI */}
      {selectedAchievement && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(5px)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setSelectedAchievement(null)}>
          <div className="fade-in" style={{ background: 'white', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '300px', textAlign: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>{selectedAchievement.icon}</div>
            <div style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a', marginBottom: '10px' }}>{selectedAchievement.name}</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>{selectedAchievement.desc}</div>
            <div style={{ padding: '10px', background: selectedAchievement.unlocked ? '#ecfdf5' : '#f1f5f9', color: selectedAchievement.unlocked ? '#10b981' : '#94a3b8', borderRadius: '12px', fontWeight: 900, fontSize: '13px' }}>
               {selectedAchievement.unlocked ? '✅ BU BAŞARIMI KAZANDIN!' : '🔒 HENÜZ KİLİDİ AÇILMADI'}
            </div>
            <button className="elite-action-btn" style={{ background: '#f1f5f9', color: '#64748b', marginTop: '20px', boxShadow: 'none' }} onClick={() => setSelectedAchievement(null)}>KAPAT</button>
          </div>
        </div>
      )}

    </div>
  );
}