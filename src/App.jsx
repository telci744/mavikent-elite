import React, { useState, useEffect } from 'react';
import { db } from './firebase';

import AdminScreen from './components/AdminScreen';
import StaffScreen from './components/StaffScreen';
import StudentScreen from './components/StudentScreen';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMessage: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorMessage: error.toString() }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#ef4444', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{fontSize:'30px', fontWeight:'900'}}>⛔ SİSTEM KORUMASI AKTİF</h2>
          <p style={{fontSize:'18px'}}>Beyaz ekran engellendi. Tespit edilen hata:</p>
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{this.state.errorMessage}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '15px 30px', marginTop: '20px', fontSize: '16px', fontWeight: 'bold', background: 'white', color: '#ef4444', border: 'none', borderRadius: '50px', cursor: 'pointer' }}>Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [role, setRole] = useState(null);
  const [appData, setAppData] = useState({});
  const [pendingRole, setPendingRole] = useState(null);
  const [pinInput, setPinInput] = useState('');

  const [deviceId] = useState(() => {
    let id = localStorage.getItem('elite_device_id');
    if (!id) { id = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase(); localStorage.setItem('elite_device_id', id); }
    return id;
  });

  useEffect(() => {
    const ref = db.ref('mavikent_premium');
    ref.on('value', snap => {
      if(snap.exists()) {
          const data = snap.val() || {};
          const today = new Date().toDateString();
          setAppData(data);
          if (data?.settings?.last_daily_reset !== today) {
              ref.update({ 'yoklama_d': null, 'telefon_d': null, 'yatak_d': null, 'education_d': null, 'settings/last_daily_reset': today });
          }
      }
    });
    return () => ref.off();
  }, []);

  const handleLogin = () => {
    const adminPin = String(appData?.settings?.admin_pin || '1507').trim();
    const staffPin = String(appData?.settings?.staff_pin || '1234').trim();
    const girilen = String(pinInput).trim();

    if (pendingRole === 'admin' && girilen === adminPin) { setRole('admin'); setPendingRole(null); setPinInput(''); localStorage.setItem('elite_fails', 0); }
    else if (pendingRole === 'staff' && girilen === staffPin) { setRole('staff'); setPendingRole(null); setPinInput(''); localStorage.setItem('elite_fails', 0); }
    else {
        // İŞTE BURASI 3 KEZ HATALI GİRENİ ENGELLEYEN KOD
        let fails = parseInt(localStorage.getItem('elite_fails') || 0) + 1;
        localStorage.setItem('elite_fails', fails);
        if (fails >= 3) { db.ref(`mavikent_premium/banned_devices/${deviceId}`).set({ banDate: new Date().toLocaleString('tr-TR'), reason: '3 Kez Hatalı Şifre' }); setPendingRole(null); setPinInput(''); } 
        else { alert(`❌ Hatalı Şifre! (Kalan Hakkınız: ${3 - fails})`); setPinInput(''); }
    }
  };

  if (appData?.banned_devices?.[deviceId]) {
     return (<div style={{ minHeight: '100vh', width: '100%', background: '#ef4444', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '70px', marginBottom: '10px' }}>⛔</div><h1 style={{ fontWeight: 900 }}>CİHAZ ENGELLENDİ</h1><p>Çok sayıda hatalı giriş denemesi yapıldı.</p></div>);
  }

  if (role === 'admin') return <AdminScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'staff') return <StaffScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'student') return <StudentScreen appData={appData} goBackToRoles={() => setRole(null)} />;

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; outline: none !important; }
          body { background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; overflow-x: hidden; }
          button, input, select, textarea { border: none; outline: none !important; }
          ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.65) !important; backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 20px; animation: fadeIn 0.3s ease-out; }
          .modal-content { background-color: #ffffff !important; padding: 35px !important; border-radius: 32px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important; width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto; color: #0f172a; animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          
          /* GİRİŞ KUTULARI (Hafif Oval) */
          .premium-input { width: 100%; padding: 18px 24px; border-radius: 20px; border: 2px solid #e2e8f0; background: #f8fafc; font-size: 16px; font-weight: 800; color: #0f172a; transition: all 0.3s ease; }
          .premium-input:focus { border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
          
          /* TÜM BUTONLAR TAMAMEN OVAL (Hap Şekli) */
          .premium-btn { padding: 16px 30px; border-radius: 50px !important; font-weight: 800; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
          .premium-btn:active, .premium-hover:active, .elite-card:active { transform: scale(0.96) !important; }
          
          .premium-card { background: #ffffff; border-radius: 28px; padding: 24px; box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; }
          .premium-hover { cursor: pointer; transition: all 0.2s ease; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          .ios-enter { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1); } @keyframes slideUpFade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      <div className="ios-enter" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        {pendingRole && (
           <div className="modal-overlay">
              <div className="modal-content" style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                 <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px 0', color: '#0f172a', letterSpacing: '-0.5px' }}>{pendingRole === 'admin' ? 'Yönetici Girişi' : 'Personel Girişi'}</h2>
                 <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 30px 0', fontWeight: 600 }}>Lütfen 4 haneli PIN kodunu girin.</p>
                 <input type="password" inputMode="numeric" pattern="[0-9]*" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleLogin(); }} maxLength="4" className="premium-input" style={{ fontSize: '32px', textAlign: 'center', letterSpacing: '12px', padding: '20px', marginBottom: '24px', fontWeight: 900 }} placeholder="••••" autoFocus />
                 <button onClick={handleLogin} className="premium-btn" style={{ width: '100%', marginBottom: '12px', background: '#3b82f6', color: 'white', boxShadow: '0 8px 20px -6px rgba(59,130,246,0.5)' }}>GİRİŞ YAP</button>
                 <button onClick={() => {setPendingRole(null); setPinInput('');}} className="premium-btn" style={{ width: '100%', background: '#f1f5f9', color: '#64748b' }}>Vazgeç</button>
              </div>
           </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-2px', color: '#0f172a' }}>MAVİKENT</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', letterSpacing: '10px', marginTop: '4px' }}>ELITE</div>
        </div>
        
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div onClick={() => setRole('student')} className="premium-card premium-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ background: '#f0f9ff', color: '#0ea5e9', width: '60px', height: '60px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>🎓</div>
             <div><div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a', marginBottom: '4px' }}>Öğrenci Portalı</div><div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Görevler, Market ve Liderlik</div></div>
          </div>
          <div onClick={() => setPendingRole('staff')} className="premium-card premium-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ background: '#ecfdf5', color: '#10b981', width: '60px', height: '60px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>👔</div>
             <div><div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a', marginBottom: '4px' }}>Personel Paneli</div><div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Eğitim ve İşleyiş Yönetimi</div></div>
          </div>
          <div onClick={() => setPendingRole('admin')} className="premium-card premium-hover" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ background: '#fef2f2', color: '#ef4444', width: '60px', height: '60px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>👑</div>
             <div><div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a', marginBottom: '4px' }}>Yönetici Paneli</div><div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Tüm Sistem Kontrolleri</div></div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AppWrapper() { return <ErrorBoundary><MainApp /></ErrorBoundary>; }