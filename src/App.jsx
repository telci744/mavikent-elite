import React, { useState, useEffect } from 'react';
import { db } from './firebase';

import AdminScreen from './components/AdminScreen';
import StaffScreen from './components/StaffScreen';
import StudentScreen from './components/StudentScreen';

function App() {
  const [role, setRole] = useState(null);
  const [appData, setAppData] = useState({});

  // Veritabanını Dinleme
  useEffect(() => {
    const ref = db.ref('mavikent_premium');
    ref.on('value', snap => {
      if(snap.exists()) setAppData(snap.val());
    });
    return () => ref.off();
  }, []);

  // Yönlendirmeler
  if (role === 'admin') return <AdminScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'staff') return <StaffScreen appData={appData} goBackToRoles={() => setRole(null)} />;
  if (role === 'student') return <StudentScreen appData={appData} goBackToRoles={() => setRole(null)} />;

  // ANA GİRİŞ EKRANI TASARIMI (ASLA BOZULMAZ)
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#f8fafc', fontFamily: '"Nunito", sans-serif' }}>
      
      {/* BAŞLIK */}
      <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ fontSize: '42px', fontWeight: 900, color: '#0f172a', letterSpacing: '3px' }}>MAVİKENT</div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', letterSpacing: '5px', marginTop: '-5px' }}>ELITE</div>
      </div>
      
      {/* SEÇİM KARTLARI KUTUSU */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.6s ease-out' }}>
        
        {/* ÖĞRENCİ KARTI */}
        <div onClick={() => setRole('student')} style={{ background: 'white', padding: '25px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', borderLeft: '6px solid #3b82f6', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '42px', background: '#eff6ff', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '18px' }}>🎓</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>ÖĞRENCİ</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>M-Rank & Market</div>
          </div>
        </div>

        {/* PERSONEL KARTI */}
        <div onClick={() => setRole('staff')} style={{ background: 'white', padding: '25px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', borderLeft: '6px solid #64748b', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '42px', background: '#f1f5f9', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '18px' }}>👔</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>PERSONEL</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Yoklama ve Kontrol</div>
          </div>
        </div>

        {/* YÖNETİCİ KARTI */}
        <div onClick={() => setRole('admin')} style={{ background: 'white', padding: '25px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', borderLeft: '6px solid #f59e0b', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
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