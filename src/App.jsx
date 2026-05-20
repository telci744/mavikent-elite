import React, { useState, useEffect } from 'react';
import { db, authReady } from './firebase';
import AdminScreen from './components/AdminScreen';
import StudentScreen from './components/StudentScreen';
import StaffScreen from './components/StaffScreen';
import Toast from './Toast.jsx';

const App = () => {
  const [appData, setAppData] = useState(null);
  const [role, setRole] = useState(null); 
  const [currentUser, setCurrentUser] = useState('');
  
  const [loginMode, setLoginMode] = useState('select');
  const [pinInput, setPinInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Öğrenci Ekstra Giriş Durumları
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotPin, setForgotPin] = useState('');
  const [recoveredPass, setRecoveredPass] = useState('');

  // Veritabanını Dinle
  useEffect(() => {
    let ref;
    authReady.then(() => {
      ref = db.ref('mavikent_premium');
      ref.on('value', snapshot => {
        setAppData(snapshot.val() || {});
      });
    });
    return () => { if (ref) ref.off(); };
  }, []);

  // Otomatik Giriş (Beni Hatırla) Kontrolü
  useEffect(() => {
      const savedUser = localStorage.getItem('mavikentUser');
      const savedPass = localStorage.getItem('mavikentPass');
      if (savedUser && savedPass && appData?.student_credentials) {
          const found = Object.keys(appData.student_credentials).find(name =>
              String(appData.student_credentials[name].username||'').trim() === savedUser &&
              String(appData.student_credentials[name].password||'').trim() === savedPass
          );
          if (found) {
              setCurrentUser(found);
              setRole('student');
          }
      }
  }, [appData]);

  if (!appData) return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#0f172a', fontSize: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900 }}>
          <div style={{ animation: 'pulse 1.5s infinite' }}>Sistem Yükleniyor... Lütfen Bekleyin.</div>
      </div>
  );

  const handleAdminLogin = () => {
      const adminPin = appData?.settings?.admin_pin || '1507';
      if (pinInput === adminPin) {
          setRole('admin');
          setLoginMode('select');
          setPinInput('');
      } else {
          alert('❌ Hatalı Yönetici Şifresi!');
          setPinInput('');
      }
  };

  const handleStaffLogin = () => {
      const staffPin = appData?.settings?.staff_pin || '1234';
      if (pinInput === staffPin) {
          setRole('staff');
          setLoginMode('select');
          setPinInput('');
      } else {
          alert('❌ Hatalı Personel Şifresi!');
          setPinInput('');
      }
  };

  const handleStudentLogin = () => {
      const credentials = appData?.student_credentials || {};
      let foundStudent = null;
      
      for (const [name, creds] of Object.entries(credentials)) {
          if (String(creds.username||'').trim() === String(usernameInput).trim() && String(creds.password||'').trim() === String(passwordInput).trim()) {
              foundStudent = name;
              break;
          }
      }

      if (foundStudent) {
          if (rememberMe) {
              localStorage.setItem('mavikentUser', String(usernameInput).trim());
              localStorage.setItem('mavikentPass', String(passwordInput).trim());
          }
          setCurrentUser(foundStudent);
          setRole('student');
          setLoginMode('select');
          setUsernameInput('');
          setPasswordInput('');
      } else {
          alert('❌ Kullanıcı adı veya şifre hatalı!');
          setPasswordInput('');
      }
  };

  const handleRecoverPassword = () => {
      const creds = appData?.student_credentials || {};
      const found = Object.keys(creds).find(n => String(creds[n]?.username||'').trim() === String(forgotUser).trim());
      if (!found) return alert("Böyle bir Kullanıcı Adı bulunamadı!");
      const sData = creds[found];
      if (!sData.recoveryPin) return alert("Hesaba Kurtarma PIN'i eklenmemiş! Yöneticiye başvurun.");
      if (String(sData.recoveryPin) === String(forgotPin).trim()) {
          setRecoveredPass(sData.password);
      } else {
          alert("Hatalı Kurtarma PIN'i!");
      }
  };

  const goBackToRoles = () => {
      setRole(null);
      setCurrentUser('');
  };

  // YÖNLENDİRMELER
  const logoUrl = appData?.settings?.corporate_logo_url;
  const LogoWatermark = logoUrl ? (
    <img src={logoUrl} alt="" style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '65vw', maxWidth: '520px',
      opacity: 0.045,
      pointerEvents: 'none', userSelect: 'none',
      zIndex: 0, objectFit: 'contain',
    }} />
  ) : null;

  if (role === 'admin') return <>{LogoWatermark}<AdminScreen appData={appData} goBackToRoles={goBackToRoles} /><Toast /></>;
  if (role === 'staff') return <>{LogoWatermark}<StaffScreen appData={appData} goBackToRoles={goBackToRoles} /><Toast /></>;
  if (role === 'student') return <>{LogoWatermark}<StudentScreen studentName={currentUser} appData={appData} goBackToRoles={goBackToRoles} /><Toast /></>;
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        <style>{`
            * { outline: none !important; font-family: 'Plus Jakarta Sans', sans-serif; }
            
            .login-card { 
                background: #ffffff; border-radius: 24px; padding: 24px 28px; display: flex; align-items: center; gap: 24px; 
                cursor: pointer; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); 
                border: 1px solid rgba(226, 232, 240, 0.6); position: relative; overflow: hidden;
            }
            .login-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%); opacity: 0; transition: opacity 0.5s; }
            .login-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); border-color: rgba(59, 130, 246, 0.3); }
            .login-card:hover::before { opacity: 1; }
            .login-card:active { transform: translateY(0px) scale(0.97); box-shadow: 0 5px 15px -5px rgba(0,0,0,0.05); transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1); }
            
            .icon-box { width: 56px; height: 56px; border-radius: 20px; display: flex; justify-content: center; align-items: center; font-size: 26px; flex-shrink: 0; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); }
            .login-card:hover .icon-box { transform: scale(1.1) rotate(-5deg); }
            
            /* ZARİF İNPUT STİLİ */
            .elite-input { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; padding: 18px 20px; border-radius: 16px; font-size: 16px; width: 100%; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); font-weight: 600; text-align: left; }
            .elite-input::placeholder { color: #94a3b8; font-weight: 500; }
            .elite-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); background: #ffffff; transform: translateY(-2px); }
            
            .btn-action { background: #0f172a; color: white; padding: 20px 24px; border-radius: 16px; font-weight: 900; border: none; cursor: pointer; width: 100%; font-size: 16px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 10px 20px -5px rgba(15,23,42,0.3); }
            .btn-action:hover { transform: translateY(-3px); box-shadow: 0 15px 25px -5px rgba(15,23,42,0.4); }
            .btn-action:active { transform: translateY(0) scale(0.96); box-shadow: 0 5px 10px rgba(15,23,42,0.2); transition: all 0.1s; }
            
            .btn-back { background: transparent; color: #64748b; padding: 16px; font-weight: 800; border: none; cursor: pointer; transition: all 0.3s; width: 100%; margin-top: 10px; border-radius: 16px; }
            .btn-back:hover { background: #f1f5f9; color: #0f172a; }
            .btn-back:active { transform: scale(0.96); }
            
            @keyframes popInSmooth { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            .popIn-anim { animation: popInSmooth 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>

        <div className="popIn-anim" style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            
            {/* LOGO KISMI */}
            <div style={{ marginBottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {appData?.settings?.corporate_logo_url ? (
                    <img src={appData.settings.corporate_logo_url} alt="Kurumsal Logo" style={{ maxHeight: '100px', objectFit: 'contain', marginBottom: '20px' }} />
                ) : (
                    <h1 style={{ margin: '0', fontSize: '42px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>MAVİKENT</h1>
                )}
                <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 800, letterSpacing: '10px', marginTop: '6px', marginLeft: '10px' }}>E L I T E</div>
            </div>

            {/* MENÜ (KARTLAR) */}
            {loginMode === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div onClick={() => setLoginMode('student')} className="login-card">
                        <div className="icon-box" style={{ background: '#f8fafc', color: '#3b82f6' }}>🎓</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>Öğrenci Portalı</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Görevler, Market ve Liderlik</div>
                        </div>
                    </div>

                    <div onClick={() => setLoginMode('staff')} className="login-card">
                        <div className="icon-box" style={{ background: '#f0fdfa', color: '#0d9488' }}>👔</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>Personel Paneli</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Eğitim ve İşleyiş Yönetimi</div>
                        </div>
                    </div>

                    <div onClick={() => setLoginMode('admin')} className="login-card">
                        <div className="icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>👑</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>Yönetici Paneli</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Tüm Sistem Kontrolleri</div>
                        </div>
                    </div>

                </div>
            )}

            {/* YÖNETİCİ GİRİŞİ (Kaba harfler silindi, elit input eklendi) */}
            {loginMode === 'admin' && (
                <div className="popIn-anim" style={{ background: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(226,232,240,0.6)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>👑</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 25px 0' }}>Yönetici Girişi</h2>
                    <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} placeholder="PIN Kodunuzu girin" className="elite-input" style={{ textAlign: 'center', marginBottom: '20px' }} autoFocus />
                    <button onClick={handleAdminLogin} className="btn-action">GİRİŞ YAP</button>
                    <button onClick={() => { setLoginMode('select'); setPinInput(''); }} className="btn-back">Geri Dön</button>
                </div>
            )}

            {/* PERSONEL GİRİŞİ */}
            {loginMode === 'staff' && (
                <div className="popIn-anim" style={{ background: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(226,232,240,0.6)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>👔</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 25px 0' }}>Personel Girişi</h2>
                    <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStaffLogin()} placeholder="PIN Kodunuzu girin" className="elite-input" style={{ textAlign: 'center', marginBottom: '20px' }} autoFocus />
                    <button onClick={handleStaffLogin} className="btn-action">GİRİŞ YAP</button>
                    <button onClick={() => { setLoginMode('select'); setPinInput(''); }} className="btn-back">Geri Dön</button>
                </div>
            )}

            {/* ÖĞRENCİ GİRİŞİ VE ŞİFREMİ UNUTTUM */}
            {loginMode === 'student' && (
                <div className="popIn-anim" style={{ background: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(226,232,240,0.6)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎓</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 25px 0' }}>{isForgot ? 'Şifremi Unuttum' : 'Öğrenci Portalı'}</h2>

                    {!isForgot ? (
                        <>
                            <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="Kullanıcı Adınız" className="elite-input" style={{ marginBottom: '12px' }} />
                            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStudentLogin()} placeholder="Şifreniz" className="elite-input" style={{ marginBottom: '20px' }} />

                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer', userSelect: 'none' }}>
                                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}/>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Beni Hatırla</span>
                            </label>

                            <button onClick={handleStudentLogin} className="btn-action" style={{ background: '#3b82f6', boxShadow: '0 10px 20px -5px rgba(59,130,246,0.4)' }}>GİRİŞ YAP</button>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', gap: '10px' }}>
                                <button onClick={() => { setLoginMode('select'); setUsernameInput(''); setPasswordInput(''); }} className="btn-back" style={{ margin: 0, padding: '12px' }}>Geri Dön</button>
                                <button onClick={() => setIsForgot(true)} className="btn-back" style={{ margin: 0, padding: '12px', color: '#3b82f6' }}>Şifremi Unuttum</button>
                            </div>
                        </>
                    ) : (
                        <div className="popIn-anim">
                            {!recoveredPass ? (
                                <>
                                    <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '20px' }}>Yönetici tarafından verilen 4 haneli PIN'i girin.</p>
                                    <input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)} placeholder="Kullanıcı Adı" className="elite-input" style={{ marginBottom: '12px' }} />
                                    <input type="password" maxLength="4" value={forgotPin} onChange={e => setForgotPin(e.target.value)} placeholder="4 Haneli PIN" className="elite-input" style={{ textAlign: 'center', letterSpacing: '5px', marginBottom: '20px' }} />
                                    <button onClick={handleRecoverPassword} className="btn-action">ŞİFREYİ GÖSTER</button>
                                </>
                            ) : (
                                <div className="popIn-anim">
                                    <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>Mevcut Şifreniz:</p>
                                    <div style={{ background: '#ecfdf5', border: '2px solid #10b981', padding: '15px', borderRadius: '16px', fontSize: '22px', fontWeight: 900, color: '#047857', marginBottom: '20px', letterSpacing: '2px' }}>{recoveredPass}</div>
                                    <button onClick={() => { setRecoveredPass(''); setIsForgot(false); }} className="btn-action" style={{ background: '#3b82f6' }}>GİRİŞ EKRANINA DÖN</button>
                                </div>
                            )}
                            {!recoveredPass && <button onClick={() => { setIsForgot(false); setForgotUser(''); setForgotPin(''); }} className="btn-back">Geri Dön</button>}
                        </div>
                    )}
                </div>
            )}

        </div>
    </div>
  );
};

export default App;