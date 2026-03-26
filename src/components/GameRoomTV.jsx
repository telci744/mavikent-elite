import React, { useState, useEffect } from 'react';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GAME_DEVICES = [
    { id: 'ps4', name: 'PLAYSTATION 4', icon: '🎮', color: '#3b82f6' },
    { id: 'ps5', name: 'PLAYSTATION 5', icon: '🕹️', color: '#f8fafc' },
    { id: 'pc', name: 'OYUN BİLGİSAYARI', icon: '💻', color: '#a855f7' },
    { id: 'vr', name: 'SİBER VR GÖZLÜK', icon: '🥽', color: '#10b981' }
];

const GAME_SLOTS = {
    'ps4': [{ id: 'ps4_1', time: '15:45 - 16:15' }, { id: 'ps4_2', time: '16:15 - 16:45' }, { id: 'ps4_3', time: '21:00 - 21:30' }, { id: 'ps4_4', time: '21:30 - 22:15' }],
    'ps5': [{ id: 'ps5_1', time: '21:00 - 21:30' }, { id: 'ps5_2', time: '21:30 - 22:15' }],
    'vr':  [{ id: 'vr_1', time: '21:00 - 21:30' }, { id: 'vr_2', time: '21:30 - 22:15' }],
    'pc':  [{ id: 'pc_1', time: '21:00 - 21:30' }, { id: 'pc_2', time: '21:30 - 22:15' }]
};

const parseTime = (timeStr) => {
    const [start, end] = timeStr.split(' - ');
    const [sH, sM] = start.trim().split(':').map(Number);
    const [eH, eM] = end.trim().split(':').map(Number);
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM, 0).getTime();
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM, 0).getTime();
    return { startTime, endTime };
};

const GameRoomTV = ({ appData, goBack }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Her saniye ekranı güncelle (Canlı Sayaç)
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const currentDayStr = DAYS[todayIndex];

    const formatDuration = (ms) => {
        if (ms < 0) return "00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ background: '#020617', minHeight: '100vh', width: '100vw', color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
                .glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                .progress-bar-bg { background: rgba(0,0,0,0.5); border-radius: 50px; overflow: hidden; height: 12px; width: 100%; margin-top: 15px; }
                .pulse-red { animation: pulseRed 2s infinite; }
                @keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
            `}</style>

            {/* TV ÜST BİLGİ */}
            <div style={{ padding: '30px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(15,23,42,0.9), rgba(2,6,23,0.9))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={goBack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', fontWeight: 800 }}>← Çıkış</button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '40px', fontWeight: 900, letterSpacing: '-1px', color: '#f8fafc', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>🎮 CANLI OYUN ODASI <span style={{color:'#38bdf8'}}>TV</span></h1>
                        <div style={{ color: '#94a3b8', fontSize: '18px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginTop: '5px' }}>Mavikent Elite Lojistik</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '55px', fontWeight: 900, color: '#f8fafc', textShadow: '0 0 30px rgba(56,189,248,0.5)', fontFamily: 'monospace' }}>
                        {new Date(currentTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ color: '#38bdf8', fontSize: '20px', fontWeight: 800 }}>{currentDayStr}</div>
                </div>
            </div>

            {/* CİHAZLAR GRID (EKRANIN ORTASI) */}
            <div style={{ flex: 1, padding: '40px 50px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                {GAME_DEVICES.map(dev => {
                    const slots = GAME_SLOTS[dev.id];
                    let activeSlot = null;
                    let nextSlot = null;

                    // Şu anki veya sıradaki seansı bul
                    for (let s of slots) {
                        const { startTime, endTime } = parseTime(s.time);
                        if (currentTime >= startTime && currentTime < endTime) {
                            activeSlot = { ...s, startTime, endTime };
                            break;
                        }
                        if (currentTime < startTime && !nextSlot) {
                            nextSlot = { ...s, startTime, endTime };
                        }
                    }

                    const isCurrentlyPlaying = activeSlot !== null;
                    const playingUser = isCurrentlyPlaying ? appData?.game_room_appointments?.[dev.id]?.[currentDayStr]?.[activeSlot.id] : null;

                    return (
                        <div key={dev.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${dev.color}`, position: 'relative' }}>
                            {/* CİHAZ BAŞLIĞI */}
                            <div style={{ padding: '25px 35px', background: 'rgba(0,0,0,0.3)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span style={{ fontSize: '45px', filter: `drop-shadow(0 0 15px ${dev.color})` }}>{dev.icon}</span>
                                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: dev.color }}>{dev.name}</h2>
                                </div>
                                {isCurrentlyPlaying && playingUser && (
                                    <div className="pulse-red" style={{ background: '#ef4444', color: 'white', padding: '6px 16px', borderRadius: '50px', fontWeight: 900, fontSize: '14px', letterSpacing: '2px' }}>CANLI YAYINDA</div>
                                )}
                            </div>

                            {/* DURUM EKRANI */}
                            <div style={{ padding: '40px 35px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {isCurrentlyPlaying ? (
                                    playingUser ? (
                                        // BİRİ OYNUYORSA
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Şu an Oynayan:</div>
                                            <div style={{ fontSize: '45px', fontWeight: 900, color: 'white', letterSpacing: '-1px', marginBottom: '30px' }}>{playingUser.split(' ')[0]}</div>
                                            
                                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '24px', display: 'inline-block', minWidth: '80%' }}>
                                                <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>KALAN SÜRE</div>
                                                <div style={{ fontSize: '65px', fontWeight: 900, color: '#fca5a5', fontFamily: 'monospace', textShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
                                                    {formatDuration(activeSlot.endTime - currentTime)}
                                                </div>
                                                
                                                {/* İLERLEME ÇUBUĞU */}
                                                <div className="progress-bar-bg">
                                                    <div style={{ background: 'linear-gradient(90deg, #ef4444, #fca5a5)', height: '100%', width: `${((currentTime - activeSlot.startTime) / (activeSlot.endTime - activeSlot.startTime)) * 100}%`, transition: 'width 1s linear' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // SEANS AÇIK AMA KİMSE ALMAMIŞSA
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '70px', marginBottom: '15px' }}>🟢</div>
                                            <div style={{ fontSize: '35px', fontWeight: 900, color: '#10b981' }}>CİHAZ ŞU AN BOŞ</div>
                                            <div style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 600, marginTop: '10px' }}>Öğrenci panelinden randevu alabilirsiniz.</div>
                                        </div>
                                    )
                                ) : (
                                    // ŞU AN SEANS YOK, SIRADAKİNİ GÖSTER
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '60px', opacity: 0.5, marginBottom: '20px' }}>😴</div>
                                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#64748b' }}>ŞU AN KAPALI</div>
                                        
                                        {nextSlot ? (
                                            <div style={{ marginTop: '30px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '20px', borderRadius: '20px' }}>
                                                <div style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 800, marginBottom: '5px' }}>Sıradaki Seans:</div>
                                                <div style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>{nextSlot.time}</div>
                                                <div style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 700, marginTop: '10px' }}>
                                                    Durum: {appData?.game_room_appointments?.[dev.id]?.[currentDayStr]?.[nextSlot.id] ? `🔒 ${appData.game_room_appointments[dev.id][currentDayStr][nextSlot.id].split(' ')[0]} tarafından alındı` : '🟢 Uygun'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ marginTop: '20px', color: '#475569', fontWeight: 700, fontSize: '16px' }}>Bugün için başka seans bulunmuyor.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default GameRoomTV;