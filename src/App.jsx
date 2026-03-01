import React, { useState, useEffect } from 'react';
import { db } from './firebase';

import AdminScreen from './components/AdminScreen';
import StaffScreen from './components/StaffScreen';
import StudentScreen from './components/StudentScreen';

function App() {
  const [role, setRole] = useState(null);
  const [appData, setAppData] = useState({});
  const [pendingRole, setPendingRole] = useState(null);
  const [pinInput, setPinInput] = useState('');

  const [deviceId] = useState(() => {
    let id = localStorage.getItem('elite_device_id');
    if (!id) {
      id = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      localStorage.setItem('elite_device_id', id);
    }
    return id;
  });

  useEffect(() => {
    const ref = db.ref('mavikent_premium');
    ref.on('value', snap => {
      if(snap.exists()) setAppData(snap.val());
    });
    return () => ref.off();
  }, []);

  const isBanned = appData?.banned_devices?.[deviceId];

  if (isBanned) {
     return (
        <div style={{ minHeight: '100vh', width: '100%', background: '#ff3b30', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
           <div style={{ fontSize: '70px', marginBottom: '10px', animation: 'shake 0.5s infinite' }}>⛔</div>
           <h1 style={{ fontWeight: 900, letterSpacing: '2px', margin: '0 0 15px 0' }}>CİHAZ ENGELLENDİ</h1>
           <p style={{ fontWeight: 600, fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>Güvenlik nedeniyle bu cihazın sisteme erişimi durdurulmuştur. Lütfen Yönetici ile iletişime geçin.</p>
           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px 25px', borderRadius: '15px', marginTop: '30px', fontSize: '14px', fontWeight: 800, letterSpacing: '2px' }}>CİHAZ KODU: {deviceId}</div>
        </div>
     );
  }

  if (role === 'admin') return <AdminScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'staff') return <StaffScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'student') return <StudentScreen appData={appData} goBackToRoles={() => setRole(null)} />;

  const handleLogin = () => {
    const adminPin = String(appData?.settings?.admin_pin || '1507').trim();
    const staffPin = String(appData?.settings?.staff_pin || '1234').trim();
    const girilen = String(pinInput).trim();

    if (pendingRole === 'admin' && girilen === adminPin) { 
        setRole('admin'); setPendingRole(null); setPinInput(''); localStorage.setItem('elite_fails', 0); 
    }
    else if (pendingRole === 'staff' && girilen === staffPin) { 
        setRole('staff'); setPendingRole(null); setPinInput(''); localStorage.setItem('elite_fails', 0); 
    }
    else {
        let fails = parseInt(localStorage.getItem('elite_fails') || 0) + 1;
        localStorage.setItem('elite_fails', fails);
        
        db.ref('mavikent_premium/security_logs').push({
           date: new Date().toLocaleString('tr-TR'),
           role: pendingRole === 'admin' ? 'YÖNETİCİ' : 'PERSONEL',
           deviceId: deviceId,
           triedPin: girilen
        });

        if (fails >= 3) {
            db.ref(`mavikent_premium/banned_devices/${deviceId}`).set({ banDate: new Date().toLocaleString('tr-TR'), reason: '3 Kez Hatalı Şifre' });
            setPendingRole(null); setPinInput('');
        } else {
            alert(`❌ Hatalı Şifre! (Kalan Deneme Hakkınız: ${3 - fails})`);
            setPinInput('');
        }
    }
  };

  return (
    <>
      {/* GLOBAL APPLE PREMIUM CSS MOTORU */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body { background-color: #f2f2f7; margin: 0; padding: 0; color: #1d1d1f; -webkit-font-smoothing: antialiased; }
          
          .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes zoomIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
          
          /* Premium Kart ve Gölgeler */
          .premium-card { background: #ffffff; border-radius: 24px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.02); }
          .premium-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer; }
          .premium-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
          
          /* Apple Input ve Select */
          .premium-input { width: 100%; padding: 14px 16px; border-radius: 14px; border: 1px solid #d2d2d7; background: #fafafa; font-size: 15px; font-weight: 500; color: #1d1d1f; outline: none; transition: all 0.2s ease; }
          .premium-input:focus { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15); background: #ffffff; }
          select.premium-input { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2386868b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 15px top 50%; background-size: 10px auto; }
          
          /* Apple Butonlar */
          .premium-btn { padding: 14px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); display: inline-flex; align-items: center; justify-content: center; letter-spacing: -0.2px; }
          .premium-btn:active { transform: scale(0.96); }
          .btn-primary { background: #0071e3; color: white; }
          .btn-primary:hover { background: #0062c3; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3); }
          .btn-success { background: #34c759; color: white; }
          .btn-success:hover { background: #2eb04e; box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3); }
          .btn-danger { background: #ff3b30; color: white; }
          .btn-danger:hover { background: #e03329; box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3); }
          .btn-gold { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
          .btn-gold:hover { box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); }
          .btn-secondary { background: #e5e5ea; color: #1d1d1f; }
          .btn-secondary:hover { background: #d1d1d6; }
          
          /* Scrollbar */
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #d2d2d7; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #86868b; }
        `}
      </style>

      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        {pendingRole && (
           <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <div className="premium-card fade-in" style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
                 <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
                 <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '5px' }}>{pendingRole === 'admin' ? 'Yönetici Girişi' : 'Personel Girişi'}</div>
                 <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '25px' }}>Lütfen 4 haneli PIN kodunu girin.</div>
                 <input 
                    type="password" inputMode="numeric" pattern="[0-9]*"
                    value={pinInput} 
                    onChange={e => setPinInput(e.target.value)} 
                    onKeyDown={e => { if(e.key === 'Enter') handleLogin(); }}
                    maxLength="4" 
                    className="premium-input"
                    style={{ fontSize: '28px', textAlign: 'center', letterSpacing: '12px', padding: '20px', marginBottom: '20px', fontWeight: 900 }} 
                    placeholder="••••" autoFocus 
                 />
                 <button onClick={handleLogin} className="premium-btn btn-primary" style={{ width: '100%', padding: '16px', marginBottom: '10px', fontSize: '16px' }}>GİRİŞ YAP</button>
                 <button onClick={() => {setPendingRole(null); setPinInput('');}} className="premium-btn btn-secondary" style={{ width: '100%', background: 'transparent' }}>Vazgeç</button>
              </div>
           </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '50px', animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ fontSize: '42px', fontWeight: 900, color: '#1d1d1f', letterSpacing: '-1px' }}>MAVİKENT</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0071e3', letterSpacing: '6px', marginTop: '-5px' }}>ELITE</div>
        </div>
        
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeIn 0.6s ease-out' }}>
          <div onClick={() => setRole('student')} className="premium-card premium-hover" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ background: '#e8f0fe', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎓</div>
             <div><div style={{ fontWeight: 800, fontSize: '18px' }}>Öğrenci Portalı</div><div style={{ fontSize: '12px', color: '#86868b', fontWeight: 600, marginTop: '2px' }}>Görevler, Market ve Liderlik</div></div>
          </div>
          
          <div onClick={() => setPendingRole('staff')} className="premium-card premium-hover" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ background: '#f5f5f7', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👔</div>
             <div><div style={{ fontWeight: 800, fontSize: '18px' }}>Personel Paneli</div><div style={{ fontSize: '12px', color: '#86868b', fontWeight: 600, marginTop: '2px' }}>Eğitim ve İşleyiş Yönetimi</div></div>
          </div>

          <div onClick={() => setPendingRole('admin')} className="premium-card premium-hover" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(245,158,11,0.2)' }}>
             <div style={{ background: '#fffbeb', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👑</div>
             <div><div style={{ fontWeight: 800, fontSize: '18px', color: '#b45309' }}>Yönetici Paneli</div><div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>Tüm Sistem Kontrolleri</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
export default App;