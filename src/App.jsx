import React, { useState, useEffect } from 'react';
import { db } from './firebase';

import AdminScreen from './components/AdminScreen';
import StaffScreen from './components/StaffScreen';
import StudentScreen from './components/StudentScreen';

function App() {
  const [role, setRole] = useState(null);
  const [appData, setAppData] = useState({});
  const [pendingRole, setPendingRole] = useState(null); // Şifre bekleyen rol
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    const ref = db.ref('mavikent_premium');
    ref.on('value', snap => {
      if(snap.exists()) setAppData(snap.val());
    });
    return () => ref.off();
  }, []);

  if (role === 'admin') return <AdminScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'staff') return <StaffScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'student') return <StudentScreen appData={appData} goBackToRoles={() => setRole(null)} />;

  const handleLogin = () => {
    // Veritabanında şifre yoksa varsayılan şifreler: Yönetici 1453, Personel 1234
    const adminPin = appData?.settings?.admin_pin || '1453';
    const staffPin = appData?.settings?.staff_pin || '1234';

    if (pendingRole === 'admin') {
      if (pinInput === adminPin) { setRole('admin'); setPendingRole(null); setPinInput(''); }
      else alert("Hatalı Yönetici Şifresi!");
    } else if (pendingRole === 'staff') {
      if (pinInput === staffPin) { setRole('staff'); setPendingRole(null); setPinInput(''); }
      else alert("Hatalı Personel Şifresi!");
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#f8fafc', fontFamily: '"Nunito", sans-serif' }}>
      
      {/* ŞİFRE EKRANI (MODAL) */}
      {pendingRole && (
         <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '360px', textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
               <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
               <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '5px' }}>{pendingRole === 'admin' ? 'YÖNETİCİ GİRİŞİ' : 'PERSONEL GİRİŞİ'}</div>
               <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Lütfen 4 haneli güvenlik şifrenizi girin</div>
               <input 
                  type="password" inputMode="numeric" pattern="[0-9]*"
                  value={pinInput} onChange={e => setPinInput(e.target.value)} maxLength="4" 
                  style={{ width: '100%', padding: '15px', fontSize: '24px', textAlign: 'center', letterSpacing: '10px', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '20px', outline: 'none', fontWeight: 900, color: '#0f172a' }} 
                  placeholder="****" autoFocus 
               />
               <button onClick={handleLogin} style={{ width: '100%', background: pendingRole === 'admin' ? '#f59e0b' : '#64748b', color: 'white', padding: '15px', borderRadius: '16px', fontWeight: 900, border: 'none', fontSize: '16px', cursor: 'pointer', marginBottom: '10px' }}>GİRİŞ YAP</button>
               <button onClick={() => {setPendingRole(null); setPinInput('');}} style={{ width: '100%', background: 'transparent', color: '#64748b', padding: '10px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>İPTAL</button>
            </div>
         </div>
      )}

      {/* BAŞLIK */}
      <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ fontSize: '42px', fontWeight: 900, color: '#0f172a', letterSpacing: '3px' }}>MAVİKENT</div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', letterSpacing: '5px', marginTop: '-5px' }}>ELITE</div>
      </div>
      
      {/* SEÇİM KARTLARI */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.6s ease-out' }}>
        
        <div onClick={() => setRole('student')} className="elite-card elite-hover" style={{ borderLeft: '6px solid #3b82f6' }}>
          <div style={{ fontSize: '42px', background: '#eff6ff', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '18px' }}>🎓</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>ÖĞRENCİ</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>M-Rank & Market</div>
          </div>
        </div>

        <div onClick={() => setPendingRole('staff')} className="elite-card elite-hover" style={{ borderLeft: '6px solid #64748b' }}>
          <div style={{ fontSize: '42px', background: '#f1f5f9', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '18px' }}>👔</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>PERSONEL</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Yoklama ve Kontrol</div>
          </div>
        </div>

        <div onClick={() => setPendingRole('admin')} className="elite-card elite-hover" style={{ borderLeft: '6px solid #f59e0b' }}>
          <div style={{ fontSize: '42px', background: '#fffbeb', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '18px' }}>👑</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>YÖNETİCİ</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Tam Yetki ve Ayarlar</div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;