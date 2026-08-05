import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { playSuccess, playCoin, playCancel, playReward, playPenalty } from '../sounds';
import { toast } from '../toast';
import { burst } from '../confetti';
import QuizAdmin from './QuizAdmin';
import { IMTIHAN_SORULAR } from './imtihanSorular';

const StaffScreen = ({ appData, goBackToRoles }) => {
  const [dashboardView, setDashboardView] = useState('main'); 
  const [currentModule, setCurrentModule] = useState(null); 
  
  const [staffHygSection, setStaffHygSection] = useState(null);
  const [staffHygFloor, setStaffHygFloor] = useState(null);
  const [staffHygAreaId, setStaffHygAreaId] = useState(null);
  const [staffHygScore, setStaffHygScore] = useState(5);
  const [isHygieneSaving, setIsHygieneSaving] = useState(false);

  const [staffIstirahatSelectedRoom, setStaffIstirahatSelectedRoom] = useState(null);
  const [staffIstirahatScore, setStaffIstirahatScore] = useState(5);
  const [isStaffIstirahatSaving, setIsStaffIstirahatSaving] = useState(false);
  const [staffIstirahatNote, setStaffIstirahatNote] = useState('');
  const [staffIstirahatView, setStaffIstirahatView] = useState(null);
  const [staffIstirahatEditMode, setStaffIstirahatEditMode] = useState(false);
  const [tempStaffIstirahatRooms, setTempStaffIstirahatRooms] = useState({});
  
  const [selectedSession, setSelectedSession] = useState(''); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null); 

  const [eduData, setEduData] = useState({ lessons: [], pages: 0, questions: 0 });
  const [examData, setExamData] = useState({}); 
  const [valuesTopic, setValuesTopic] = useState({ subject: '', topic: '' });
  const [imtihanStudent, setImtihanStudent] = useState(null);
  const [imtihanSubject, setImtihanSubject] = useState(null);

  // KANTİN STATELERİ
  const [canteenView, setCanteenView] = useState('satis');
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [canteenStudent, setCanteenStudent] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [newProduct, setNewProduct] = useState({ barcode: '', name: '', price: '', stock: '' });

  // OYUN ODASI VE TUTANAK STATELERİ
  const [tutanakTab, setTutanakTab] = useState('odul');
  const [evalForm, setEvalForm] = useState({
      bookingId: '', student: '', device: '', day: '', slot: '', time: '', 
      attended: true, q1: true, q2: true, q3: true, q4: true, q5: false, photoUrl: '' 
  });
  
  const csvDenemeRef = useRef(null);
  const csvYaziliRef = useRef(null);

  const classList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"];
  const eduClassList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "ELİT", "STANDART"];
  const levelList = ["SEVİYE 1/A", "SEVİYE 1/B", "SEVİYE 2"];
  const examSubjects = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din Kültürü"];
  const valuesSubjectsList = ["K.Kerim", "İlmihal", "Siyer-i Nebi", "Adabı Muaşeret", "Tecvid"];
  
  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});
  const isElite = (name) => appData?.student_tiers?.[name] === 'elite';

  const pointsConfig = appData?.settings?.points_config || {
    okul_dondu: 10,
    okul_gelmedi: -20,
    yoklama_takkeli: 3,
    yoklama_geldi: 2,
    yoklama_gec: 1,
    yoklama_gelmedi: -3,
    telefon_teslim: 2,
    telefon_vermedi: 0,
    yatak_duzenli: 1,
    yatak_bozuk: 0,
    dolap_duzenli: 1,
    dolap_bozuk: 0,
  };

  const mebLessons = { 
      "5. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], 
      "6. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], 
      "7. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], 
      "8. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], 
      "ELİT": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"], 
      "STANDART": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"] 
  };

  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const DEFAULT_GAME_DEVICES = [{ id: 'ps4', name: 'PS4', icon: '🎮' }, { id: 'ps5', name: 'PS5', icon: '🕹️' }, { id: 'vr', name: 'VR (Sanal Gerçeklik)', icon: '🥽' }, { id: 'pc', name: 'Bilgisayar', icon: '💻' }];
  const DEFAULT_GAME_SLOTS = {
      'ps4': [{ id: 'ps4_3', time: '21:00 - 21:30', price: 5 }, { id: 'ps4_4', time: '21:30 - 22:15', price: 8 }],
      'ps5': [{ id: 'ps5_1', time: '21:00 - 21:30', price: 30 }, { id: 'ps5_2', time: '21:30 - 22:15', price: 45 }],
      'vr':  [{ id: 'vr_1', time: '21:00 - 21:30', price: 60 }, { id: 'vr_2', time: '21:30 - 22:15', price: 90 }],
      'pc':  [{ id: 'pc_1', time: '21:00 - 21:30', price: 30 }, { id: 'pc_2', time: '21:30 - 22:15', price: 45 }]
  };

  const dbGameDevices = appData?.settings?.game_devices;
  const GAME_DEVICES = dbGameDevices && Object.keys(dbGameDevices).length > 0
      ? Object.entries(dbGameDevices).map(([id, d]) => ({ id, name: d.name || id.toUpperCase(), icon: d.icon || '🎮' }))
      : DEFAULT_GAME_DEVICES;

  const dbGameSlots = appData?.settings?.game_slots;
  const GAME_SLOTS = {};
  GAME_DEVICES.forEach(dev => {
      const deviceSlots = dbGameSlots?.[dev.id];
      GAME_SLOTS[dev.id] = (deviceSlots && Object.keys(deviceSlots).length > 0
          ? Object.entries(deviceSlots).map(([id, s]) => ({ id, time: s.time, price: Number(s.price) || 0 }))
          : (DEFAULT_GAME_SLOTS[dev.id] || [])
      ).sort((a, b) => a.time.localeCompare(b.time));
  });

  const now = new Date();
  const liveDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todayStrTR = DAYS[liveDayIdx] || 'Pazartesi';


  const allBookingsForController = [];
  Object.keys(appData?.game_room_appointments || {}).forEach(device => {
      const deviceData = appData?.game_room_appointments?.[device];
      if(typeof deviceData !== 'object' || deviceData === null) return;
      Object.keys(deviceData).forEach(day => {
          if (day !== todayStrTR) return; 
          const dayData = deviceData[day];
          if(typeof dayData !== 'object' || dayData === null) return;
          Object.keys(dayData).forEach(slotId => {
              const sName = dayData[slotId];
              if (sName && typeof sName === 'string' && !sName.includes("TURNUVA")) {
                  const slotList = GAME_SLOTS[device] || [];
                  const slotInfo = slotList.find(s => s.id === slotId);
                  const devInfo = GAME_DEVICES.find(d => d.id === device);
                  allBookingsForController.push({ 
                      student: sName, device, day, slotId, 
                      time: slotInfo?.time || 'Bilinmiyor', devName: devInfo?.name || device 
                  });
              }
          });
      });
  });

  const getCoinImpact = (score, type = 'hygiene') => {
      const cfg = appData?.settings?.points_config || {};
      const prefix = type === 'istirahat' ? 'istirahat_star_' : 'hygiene_star_';
      const defaults = { 5: 30, 4: 20, 3: 10, 2: -30, 1: -60 };
      const key = `${prefix}${score}`;
      return (key in cfg) ? cfg[key] : (defaults[score] ?? 0);
  };
  const STAFF_FLOOR_AREA_TYPES = {
      wc:        { icon: '🚽', label: 'WC / Tuvalet',   color: '#0ea5e9', bg: '#f0f9ff' },
      etut:      { icon: '📚', label: 'Etüt Salonu',    color: '#8b5cf6', bg: '#faf5ff' },
      yatakhane: { icon: '🛏️', label: 'Yatakhane',      color: '#10b981', bg: '#f0fdf4' },
      genel:     { icon: '🧹', label: 'Genel Temizlik', color: '#f59e0b', bg: '#fffbeb' },
  };

  const saveStaffFloorInspection = async (section, floorKey, areaId) => {
      const area = appData?.hygiene_floors?.[section]?.[floorKey]?.areas?.[areaId];
      if (!area) return toast('Alan bulunamadı!');
      const responsibles = area.responsibles || [];
      if (responsibles.length === 0) return toast('Bu alanda sorumlu öğrenci yok!');
      const todayMidnight = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
      const alreadyDone = Object.values(appData?.hygiene_logs || {}).some(
          l => l.areaName === area.name && l.section === section && l.floor === floorKey && l.timestamp >= todayMidnight
      );
      if (alreadyDone) return toast(`⚠️ ${area.name} bugün zaten denetlendi.`);
      setIsHygieneSaving(true);
      const coinImpact = getCoinImpact(staffHygScore);
      const updates = {};
      const logId = `floor_${Date.now()}`;
      const sectionLabel = section === 'rutin' ? 'Rutin' : 'Temizlik';
      updates[`hygiene_logs/${logId}`] = {
          areaName: area.name, score: staffHygScore,
          responsibles, timestamp: Date.now(), inspector: 'Personel',
          coinImpact, type: area.type, floor: floorKey, section,
      };
      responsibles.forEach(name => {
          updates[`wallet/${name}`] = (Number(appData?.wallet?.[name]) || 0) + coinImpact;
          updates[`transactions/${name}/txn_${logId}`] = {
              desc: `${area.name} ${sectionLabel} Denetimi (Personel)`, amt: coinImpact,
              date: new Date().toLocaleString('tr-TR'),
          };
      });
      try {
          await db.ref('mavikent_premium').update(updates);
          toast(`✅ ${area.name} denetimi kaydedildi!`);
          setStaffHygScore(5);
      } catch(e) { toast('Hata!'); } finally { setIsHygieneSaving(false); }
  };


  const openStaffIstirahatEditMode = () => {
      const initial = {};
      for (let i = 1; i <= 6; i++) {
          const key = `ist_room_${i}`;
          const existing = appData?.istirahat_rooms?.[key] || { name: `Yatakhane ${i}`, responsibles: [] };
          initial[key] = { ...existing, responsibles: (existing.responsibles || []).filter(s => roster.includes(s)) };
      }
      setTempStaffIstirahatRooms(initial);
      setStaffIstirahatEditMode(true);
  };

  const saveStaffIstirahatRooms = async () => {
      try {
          await db.ref('mavikent_premium/istirahat_rooms').set(tempStaffIstirahatRooms);
          toast('✅ Yatakhaneler kaydedildi!');
          setStaffIstirahatEditMode(false);
      } catch(e) { toast('Hata!'); }
  };

  const saveStaffIstirahatInspection = async (roomKey) => {
      const room = appData?.istirahat_rooms?.[roomKey] || { name: `Yatakhane ${roomKey.replace('ist_room_','')}`, responsibles: [] };
      const responsibles = room.responsibles || [];
      if (responsibles.length === 0) return toast('Bu odada kayıtlı öğrenci yok!');
      setIsStaffIstirahatSaving(true);
      const coinImpact = getCoinImpact(staffIstirahatScore);
      const updates = {};
      const logId = `ist_${Date.now()}`;
      updates[`istirahat_logs/${logId}`] = {
          roomName: room.name, roomKey,
          responsibles, score: staffIstirahatScore, note: staffIstirahatNote,
          timestamp: Date.now(), inspector: 'Personel', coinImpact,
      };
      responsibles.forEach(name => {
          updates[`wallet/${name}`] = (Number(appData?.wallet?.[name]) || 0) + coinImpact;
          updates[`transactions/${name}/txn_${logId}`] = {
              desc: `${room.name} İstirahat Kontrol`, amt: coinImpact,
              date: new Date().toLocaleString('tr-TR'),
          };
      });
      try {
          await db.ref('mavikent_premium').update(updates);
          toast(`✅ ${room.name} kontrolü kaydedildi!`);
          setStaffIstirahatSelectedRoom(null);
          setStaffIstirahatScore(5);
          setStaffIstirahatNote('');
      } catch(e) { toast('Hata!'); } finally { setIsStaffIstirahatSaving(false); }
  };

  const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          const img = new Image(); 
          img.src = event.target.result;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              let scaleSize = 800 / img.width; 
              if (img.height > img.width) scaleSize = 800 / img.height; 
              canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              setEvalForm({ ...evalForm, photoUrl: canvas.toDataURL('image/jpeg', 0.6) });
          };
      };
  };

  const submitEvaluation = () => {
      if(!evalForm.student) return toast("Değerlendirilecek randevuyu seçin!");
      
      if(evalForm.attended) {
          const hasViolation = !evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || evalForm.q5;
          if(hasViolation && !evalForm.photoUrl) {
              if(!window.confirm("İhlal bildirdiniz ama KANIT FOTOĞRAFI eklemediniz. Yine de kaydetmek istiyor musunuz?")) return;
          }
      }

      if(window.confirm(`${String(evalForm.student || '').split(',')[0]} için işlem sisteme işlenecek. Onaylıyor musun?`)) {
          playSuccess();
          const updates = {};
          const rId = `rep_${Date.now()}`;
          
          updates[`game_room_reports/${rId}`] = {
              controller: 'PERSONEL',
              target: evalForm.student, device: evalForm.device, day: evalForm.day, time: evalForm.time,
              attended: evalForm.attended,
              q1: evalForm.q1, q2: evalForm.q2, q3: evalForm.q3, q4: evalForm.q4, q5: evalForm.q5,
              photoUrl: evalForm.photoUrl || '', date: new Date().toLocaleString('tr-TR')
          };

          if(evalForm.attended) {
              if(evalForm.q5) {
                  const expTime = Date.now() + (7 * 24 * 60 * 60 * 1000); 
                  const studentArray = String(evalForm.student || '').split(', ');
                  studentArray.forEach(stu => {
                      if(stu.trim()) {
                          updates[`game_room_bans/${stu.trim()}`] = {
                              reason: 'Yiyecek/İçecek İhlali (Personel Tespiti)', photoUrl: evalForm.photoUrl || '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR')
                          };
                      }
                  });
                  if (evalForm.device && evalForm.day && evalForm.slotId) {
                      updates[`game_room_appointments/${evalForm.device}/${evalForm.day}/${evalForm.slotId}`] = null;
                  }
              }
          } else {
              updates[`game_room_appointments/${evalForm.device}/${evalForm.day}/${evalForm.slotId}`] = null;
              
              const defaultSlotObj = (GAME_SLOTS[evalForm.device] || []).find(s => s.id === evalForm.slotId);
              let refundAmt = defaultSlotObj?.price || 0;

              const customPrice = appData?.custom_game_slots?.[evalForm.device]?.[evalForm.day]?.[evalForm.slotId]?.price;
              if (customPrice) refundAmt = Number(customPrice);

              updates[`wallet/${evalForm.student}`] = (Number(appData?.wallet?.[evalForm.student]) || 0) + refundAmt;
              updates[`transactions/${evalForm.student}/txn_auto_ref_${Date.now()}`] = { 
                  desc: `Oyun Odası İadesi (Denetim Kaynaklı)`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') 
              };

              db.ref('mavikent_premium/global_chat').push({ 
                  s: 'SİSTEM', 
                  t: `📢 ${String(evalForm.student).split(' ')[0]} adlı öğrenci randevusuna iştirak edemediği için ${refundAmt} M-Coin iadesi yapılmıştır.`, 
                  ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
              });
          }
          
          db.ref('mavikent_premium').update(updates).then(() => {
              toast(evalForm.attended ? "✅ Denetim raporu kaydedildi!" : "🔄 Randevu iptal edildi ve M-Coin iadesi yapıldı.");
              setEvalForm({ bookingId: '', student: '', device: '', day: '', slotId: '', time: '', attended: true, q1: true, q2: true, q3: true, q4: true, q5: false, photoUrl: '' });
          });
      }
  };

  const getFilteredRoster = (session) => { 
      if(session === 'ELİT') return roster.filter(n => isElite(n)); 
      if(session === 'STANDART') return roster.filter(n => !isElite(n)); 
      return roster.filter(n => appData?.student_classes?.[n] === session); 
  };

  const handleBack = () => {
    if (currentModule && (modalType || selectedStudent)) { setModalType(null); setSelectedStudent(null); return; }
    if (currentModule === 'yoklama' && selectedSession) { setSelectedSession(''); return; }
    if (currentModule === 'imtihan_view') {
      if (imtihanSubject) { setImtihanSubject(null); return; }
      if (imtihanStudent) { setImtihanStudent(null); return; }
      setCurrentModule(null); setSelectedSession(''); return;
    }
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); return; }
    if (dashboardView !== 'main') {
        if (dashboardView.startsWith('egitim_')) { setDashboardView('egitim'); return; }
        if (dashboardView.startsWith('degerler_')) { setDashboardView('degerler'); return; }
        setDashboardView('main');
        return;
    }
    goBackToRoles();
  };

  const getCalculatedPoints = (name, basePts, type) => {
    if (basePts === 0) return 0;
    const currentXp = Number(appData?.xp?.[name]) || 0;
    const lvl = Math.floor(Math.sqrt(currentXp / 50)) + 1; 
    let bns = lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0;
    if (type === 'yatak') bns = Math.min(bns, 1);
    const eliteMulti = isElite(name) && basePts > 0 && type !== 'kanaat' ? 2 : 0;
    const isGlobal2X = appData?.settings?.global_event === '2x_xp';
    const activeMultiplier = appData?.active_cards?.[name]?.multiplier;
    const isPersonal2X = activeMultiplier && activeMultiplier.date === new Date().toDateString();
    let total = basePts > 0 ? basePts + bns + eliteMulti : basePts;
    if ((isPersonal2X || isGlobal2X) && total > 0 && type !== 'kanaat') total *= 2;
    return total;
  };

  const saveData = (type, status, basePts) => {
    if (!selectedStudent) return;
    
    const todayStr = new Date().toDateString();
    const okulDateStr = new Date().getHours() < 15 ? new Date(Date.now() - 86400000).toDateString() : new Date().toDateString();
    if (appData?.daily_status?.[okulDateStr]?.[selectedStudent] === 'a' && type !== 'okul' && type !== 'yoklama') {
        return toast(`⚠️ ${selectedStudent} adlı öğrenci bugün kurumda değil (İzinli/Gelmedi). Puan işlemi yapılamaz.`);
    }

    const finalPts = getCalculatedPoints(selectedStudent, basePts, type);
    const updates = {};
    const isFail = status === 'a' || status === 'x' || status === 'l' || (type === 'yatak' && basePts === 0) || (type === 'telefon' && status === 'a');
    
    if (isFail) {
        const streakData = appData?.active_cards?.[selectedStudent]?.streak;
        const hasStreakSaver = streakData && (streakData.date === todayStr || (streakData.end && streakData.end > Date.now()));
        if (hasStreakSaver) { 
            toast(`🛡️ ${selectedStudent} SERİ KORUMA KALKANI kullandı! Eksi aldı ama serisi bozulmadı.`); 
            updates[`active_cards/${selectedStudent}/streak`] = null; 
        } else { 
            updates[`streaks/${selectedStudent}`] = 0; 
            updates[`daily_flags/${selectedStudent}/broken`] = true; 
        }
    }
    
    if (finalPts !== 0) { 
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts; 
        updates[`xp/${selectedStudent}`] = Math.max(0, (Number(appData?.xp?.[selectedStudent]) || 0) + (basePts * 10)); 
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        let desc = type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : (type === 'okul' ? 'Okul Dönüş Yoklaması' : 'Yatak/Dolap Düzeni'));
        updates[`transactions/${selectedStudent}/${tId}`] = { desc, amt: finalPts, date: new Date().toLocaleString('tr-TR') };
    }
    
    if (type === 'okul') {
        updates[`daily_status/${okulDateStr}/${selectedStudent}`] = status;
        if (status === 'a') {
            const currentAbs = Number(appData?.absences?.[selectedStudent] || 0) + 1;
            updates[`absences/${selectedStudent}`] = currentAbs;
            if (currentAbs % 10 === 0) { 
                updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts - 100;
                updates[`transactions/${selectedStudent}/abs_fine_${Date.now()}`] = { desc: '🚨 10 Günlük Devamsızlık Cezası', amt: -100, date: new Date().toLocaleString('tr-TR') };
                toast(`🚨 ${selectedStudent} 10. devamsızlığını yaptı! Hesabından ekstra 100 M-Coin düşüldü.`);
            }
        }
    }
    else if (type === 'yoklama') updates[`yoklama_d/${todayStr}/${selectedStudent}/sessions/${selectedSession}`] = { st: status, pts: finalPts };
    else if (type === 'telefon') updates[`telefon_d/${todayStr}/${selectedStudent}/sessions/gunluk`] = { st: status, pts: finalPts };
    else if (type === 'yatak') updates[`yatak_d/${todayStr}/${selectedStudent}/${status}_pts`] = finalPts; 
    
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); 
    setModalType(null);
  };

  const applyPenaltyCard = (studentName, cardId) => {
      const card = appData?.penalty_cards?.[cardId];
      if (!card) return toast("Hata: Kart bulunamadı!");
      if (!window.confirm(`${studentName} adlı öğrenciye '${card.name}' cezası uygulanacak. Onaylıyor musunuz?`)) return;

      const updates = {};
      const timestamp = Date.now();

      if (card.mcoin > 0) {
          updates[`wallet/${studentName}`] = (Number(appData?.wallet?.[studentName]) || 0) - card.mcoin;
          updates[`transactions/${studentName}/txn_pen_${timestamp}`] = { desc: `⚖️ Disiplin Cezası: ${card.name}`, amt: -card.mcoin, date: new Date().toLocaleString('tr-TR') };
      }

      if (card.rp > 0) {
          updates[`season_score/${studentName}`] = (Number(appData?.season_score?.[studentName]) || 0) - card.rp;
      }

      if (card.banDays > 0) {
          const expTime = timestamp + (card.banDays * 24 * 60 * 60 * 1000);
          updates[`game_room_bans/${studentName}`] = { reason: `Disiplin Cezası: ${card.name}`, photoUrl: '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR') };
          
          Object.keys(appData?.game_room_appointments || {}).forEach(device => {
              Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
                  Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                      if (appData.game_room_appointments[device][day][slotId] === studentName) { updates[`game_room_appointments/${device}/${day}/${slotId}`] = null; }
                  });
              });
          });
      }

      updates[`streaks/${studentName}`] = 0; 
      updates[`daily_flags/${studentName}/broken`] = true;
      updates[`notifications/${studentName}/notif_${timestamp}`] = { title: 'Disiplin İhlali!', message: `'${card.name}' kurallarını ihlal ettiğin için ceza aldın.`, isRead: false, timestamp };

      playPenalty();
      db.ref('mavikent_premium').update(updates).then(() => {
          toast(`✅ ${studentName} adlı öğrenciye ${card.name} cezası başarıyla uygulandı!`);
          setSelectedStudent(null);
          setModalType(null);
      });
  };

  const applyRewardCard = (studentName, cardId) => {
      const card = appData?.reward_cards?.[cardId];
      if (!card) return toast("Hata: Ödül kartı bulunamadı!");
      if (!window.confirm(`${studentName} adlı öğrenciye '${card.name}' ödülü verilecek. Onaylıyor musunuz?`)) return;

      const updates = {};
      const timestamp = Date.now();

      if (card.type === 'mcoin') {
          if (card.amount1 > 0) {
              updates[`wallet/${studentName}`] = (Number(appData?.wallet?.[studentName]) || 0) + Number(card.amount1);
              updates[`transactions/${studentName}/txn_rew_${timestamp}`] = { desc: `🎁 Ödül: ${card.name}`, amt: Number(card.amount1), date: new Date().toLocaleString('tr-TR') };
          }
          if (card.amount2 > 0) updates[`season_score/${studentName}`] = (Number(appData?.season_score?.[studentName]) || 0) + Number(card.amount2);
      } else if (card.type === 'joker') {
          updates[`inventory/${studentName}/joker_ticket`] = (Number(appData?.inventory?.[studentName]?.joker_ticket) || 0) + Number(card.amount1);
      } else if (card.type === 'box') {
          const boxType = card.amount2 === '1' ? 'standart_bilet' : card.amount2 === '2' ? 'mega_bilet' : 'elit_bilet';
          updates[`inventory/${studentName}/${boxType}`] = (Number(appData?.inventory?.[studentName]?.[boxType]) || 0) + Number(card.amount1);
      } else if (card.type === 'discount') {
          updates[`inventory/${studentName}/discount_rate`] = Number(card.amount1);
      } else if (card.type === 'bounty') {
          updates[`inventory/${studentName}/kings_bounty`] = { count: Number(card.amount1), amount: Number(card.amount2) };
      }

      updates[`notifications/${studentName}/notif_${timestamp}`] = { title: 'Ödül Kazandın!', message: `'${card.name}' ödülü hesabına tanımlandı. Harikasın!`, isRead: false, timestamp };

      playReward(); burst();
      db.ref('mavikent_premium').update(updates).then(() => {
          toast(`✅ ${studentName} adlı öğrenciye ${card.name} ödülü başarıyla tanımlandı!`);
          setSelectedStudent(null);
          setModalType(null);
      });
  };    

  const saveEducationData = () => {
    const oldData = appData?.education_d?.[selectedStudent] || {}; 
    let earnedPoints = 0;
    const validNew = (eduData.lessons || []).filter(hw => !hw.includes("YOK")); 
    const validOld = (oldData.lessons || []).filter(hw => !hw.includes("YOK"));
    
    if (validOld.length === 0 && validNew.length > 0) earnedPoints += 2;
    if ((eduData.pages || 0) > (oldData.pages || 0)) earnedPoints += Math.floor((eduData.pages || 0) / 10) - Math.floor((oldData.pages || 0) / 10);
    if ((eduData.questions || 0) > (oldData.questions || 0)) earnedPoints += Math.floor((eduData.questions || 0) / 10) - Math.floor((oldData.questions || 0) / 10);
    
    const updates = {}; 
    updates[`education_d/${selectedStudent}`] = { ...eduData, date: new Date().toDateString() };
    
    if (earnedPoints > 0) {
        const finalM = getCalculatedPoints(selectedStudent, earnedPoints, 'egitim');
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (Number(appData?.season_score?.[selectedStudent]) || 0) + (earnedPoints + (isElite(selectedStudent) ? 2 : 0));
        updates[`xp/${selectedStudent}`] = (Number(appData?.xp?.[selectedStudent]) || 0) + (earnedPoints * 10);
        updates[`transactions/${selectedStudent}/txn_${Date.now()}`] = { desc: 'Günlük Eğitim Başarısı', amt: finalM, date: new Date().toLocaleString('tr-TR') };
    }
    
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); setModalType(null); toast("Eğitim Verileri Güncellendi!");
  };

  const saveExamData = (type) => {
    const updates = {};
    if (type === 'deneme') {
        let totalNet = 0;
        let subjectsData = {};
        for(let i=0; i<examSubjects.length; i++) { 
            const d = parseFloat(examData[`d_${i}`]) || 0; 
            const y = parseFloat(examData[`y_${i}`]) || 0; 
            const b = parseFloat(examData[`b_${i}`]) || 0;
            const net = d - (y/3); 
            totalNet += net; 
            subjectsData[i] = { d, y, b, net };
        }
        updates[`exams/${selectedStudent}/deneme`] = { 
            subjects: subjectsData, 
            net: totalNet, 
            target: parseFloat(examData.target) || 0,
            date: new Date().toDateString() 
        };
    } else if (type === 'yazili') {
        let total = 0; let count = 0; let writeData = {};
        for(let i=0; i<examSubjects.length; i++) { 
            const val = examData[`p_${i}`]; 
            if(val !== undefined && val !== '') { total += parseFloat(val); count++; writeData[`p_${i}`] = parseFloat(val); } 
        }
        updates[`exams/${selectedStudent}/yazili`] = { 
            ...writeData, 
            avg: count > 0 ? (total / count) : 0, 
            target: parseFloat(examData.target) || 0,
            date: new Date().toDateString() 
        };
    }
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); setModalType(null); toast(`${type.toUpperCase()} Kaydedildi!`);
  };

  const loadHtml2Canvas = async () => {
      if (window.html2canvas) return window.html2canvas;
      return new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; script.onload = () => resolve(window.html2canvas); document.head.appendChild(script); });
  };

  const downloadReportAsJPG = async (type, className) => {
      const btnId = `btn-jpg-${type}`; 
      const originalText = document.getElementById(btnId).innerText; 
      document.getElementById(btnId).innerText = "⏳ Hazırlanıyor...";
      
      const html2canvas = await loadHtml2Canvas(); 
      const container = document.createElement('div');
      container.style.cssText = "position:absolute;left:-9999px;top:0;width:1200px;background:#ffffff;padding:40px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;";
      
      const studentsToMap = type === 'degerler' ? roster.filter(n => appData?.student_levels?.[n] === className) : getFilteredRoster(className);
      let title = ''; let tableHTML = `<table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 20px;">`;
      
      if (type === 'deneme') {
          title = 'DENEME SINAVI SONUÇLARI (VELİ BİLGİLENDİRME)';
          let dataArr = studentsToMap.map(n => {
              const data = appData?.exams?.[n]?.deneme || {}; let totalNet = 0; let subsHTML = '';
              examSubjects.forEach((s, i) => { const d = parseFloat(data?.subjects?.[i]?.d) || 0; const y = parseFloat(data?.subjects?.[i]?.y) || 0; const b = parseFloat(data?.subjects?.[i]?.b) || 0; const net = d - (y/3); totalNet += net; subsHTML += `<td style="padding:15px;border-bottom:1px solid #e2e8f0;"><div style="font-size:11px;color:#64748b;">${d}D ${y}Y ${b}B</div><div style="font-weight:900;font-size:15px;">${net.toFixed(2)} N</div></td>`; });
              const target = parseFloat(data.target)||0; let statusHTML = '-';
              if (target > 0) { statusHTML = totalNet >= target ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:900;font-size:12px;letter-spacing:0.5px;">HEDEFİ GEÇTİ ✅</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:900;font-size:12px;letter-spacing:0.5px;">HEDEFİN ALTINDA ❌</span>`; }
              return { n, totalNet, target, subsHTML, statusHTML };
          }).sort((a,b) => b.totalNet - a.totalNet);
          
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th>`;
          examSubjects.forEach(s => tableHTML += `<th style="padding:15px;font-size:13px;">${s}</th>`);
          tableHTML += `<th style="padding:15px;background:#3b82f6;">Toplam Net</th><th style="padding:15px;background:#d4af37;color:#0f172a;">Hedef</th><th style="padding:15px;border-radius:0 12px 0 0;">Durum</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:15px;border-bottom:1px solid #e2e8f0;">${d.n}</td>${d.subsHTML}<td style="padding:15px;font-weight:900;font-size:18px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.totalNet.toFixed(2)}</td><td style="padding:15px;font-weight:800;font-size:16px;color:#d4af37;border-bottom:1px solid #e2e8f0;">${d.target}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      
      } else if (type === 'yazili') {
          title = 'HAFTALIK YAZILI DEĞERLENDİRME';
          let dataArr = studentsToMap.map(n => {
              const data = appData?.exams?.[n]?.yazili || {}; let total = 0; let count = 0; let subsHTML = '';
              examSubjects.forEach((s, i) => { const val = data[`p_${i}`]; if (val!==undefined&&val!=='') { total+=parseFloat(val); count++; } subsHTML += `<td style="padding:15px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:16px;">${val||'-'}</td>`; });
              const avg = count>0 ? (total/count) : 0; const target = parseFloat(data.target)||0; let statusHTML = '-';
              if (target>0 && avg>0) { statusHTML = avg >= target ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">HEDEFİ GEÇTİ ✅</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">HEDEFİN ALTINDA ❌</span>`; }
              return { n, avg, target, subsHTML, statusHTML };
          }).sort((a,b) => b.avg - a.avg);
          
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th>`;
          examSubjects.forEach(s => tableHTML += `<th style="padding:15px;">${s}</th>`);
          tableHTML += `<th style="padding:15px;background:#3b82f6;">Ortalama</th><th style="padding:15px;background:#d4af37;color:#0f172a;">Hedef</th><th style="padding:15px;border-radius:0 12px 0 0;">Durum</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.n}</td>${d.subsHTML}<td style="padding:15px;font-weight:900;font-size:20px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.avg.toFixed(1)}</td><td style="padding:15px;font-weight:800;font-size:18px;color:#d4af37;border-bottom:1px solid #e2e8f0;">${d.target}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      
      } else if (type === 'egitim') {
          title = 'GÜNLÜK EĞİTİM VE ÖDEV TAKİBİ';
          let dataArr = studentsToMap.map(n => { const d = appData?.education_d?.[n] || {}; return { n, lessons: (d.lessons||[]).join(', ')||'-', pages: d.pages||0, questions: d.questions||0 }; }).sort((a,b) => b.questions - a.questions);
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th><th style="padding:15px;">Ödevler</th><th style="padding:15px;">Kitap (S)</th><th style="padding:15px;border-radius:0 12px 0 0;background:#3b82f6;">Soru</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.n}</td><td style="padding:15px;font-weight:700;color:#10b981;border-bottom:1px solid #e2e8f0;">${d.lessons}</td><td style="padding:15px;font-weight:800;font-size:16px;border-bottom:1px solid #e2e8f0;">${d.pages}</td><td style="padding:15px;font-weight:900;font-size:20px;color:#3b82f6;border-bottom:1px solid #e2e8f0;">${d.questions}</td></tr>`; });
      
      } else if (type === 'degerler') {
          const todayStr = new Date().toDateString();
          const log = appData?.values_log?.[className]?.[todayStr] || { subject: 'Belirtilmedi', topic: '-' };
          title = `DEĞERLER EĞİTİMİ (${log.subject} - ${log.topic})`;
          let dataArr = studentsToMap.map(n => { const isDone = appData?.values_edu_d?.[n]?.[todayStr]?.done; return { n, statusHTML: isDone ? `<span style="background:#10b981;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">KATILDI ✓</span>` : `<span style="background:#ef4444;color:white;padding:6px 12px;border-radius:8px;font-weight:800;font-size:13px;">KATILMADI ✕</span>` }; });
          tableHTML += `<tr style="background:#0f172a;color:white;"><th style="padding:15px;border-radius:12px 0 0 0;">#</th><th style="padding:15px;text-align:left;">Öğrenci</th><th style="padding:15px;border-radius:0 12px 0 0;">Günlük Katılım</th></tr>`;
          dataArr.forEach((d, i) => { tableHTML += `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};"><td style="padding:15px;font-weight:900;color:#86868b;border-bottom:1px solid #e2e8f0;">${i+1}</td><td style="padding:15px;font-weight:800;text-align:left;font-size:16px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${d.n}</td><td style="padding:15px;border-bottom:1px solid #e2e8f0;">${d.statusHTML}</td></tr>`; });
      }
      
      tableHTML += `</table>`;
      container.innerHTML = `<div style="background:linear-gradient(135deg, #0f172a, #1e293b);padding:30px;border-radius:24px;display:flex;justify-content:space-between;align-items:center;color:white;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div><h1 style="margin:0;font-size:42px;font-weight:900;letter-spacing:-1px;">MAVİKENT <span style="color:#d4af37;">ELITE</span></h1><h2 style="margin:5px 0 0 0;font-size:20px;color:#cbd5e1;font-weight:700;">${className} - ${title}</h2></div><div style="text-align:right;"><div style="font-size:16px;font-weight:600;color:#cbd5e1;">Tarih</div><div style="font-size:22px;font-weight:800;color:#d4af37;">${new Date().toLocaleDateString('tr-TR')}</div></div></div>${tableHTML}`;
      document.body.appendChild(container);
      
      try { const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true }); const link = document.createElement('a'); link.download = `Mavikent_${className}_${type}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click(); } catch(e) { console.error(e); } finally { document.body.removeChild(container); document.getElementById(btnId).innerText = originalText; }
  };

  const startBarcodeScanner = async (onScanSuccess) => {
      if (!window.Html5Qrcode) {
          await new Promise(resolve => {
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/html5-qrcode';
              script.onload = resolve;
              document.head.appendChild(script);
          });
      }
      setScannerActive(true);
      setTimeout(() => {
          const html5QrCode = new window.Html5Qrcode("reader");
          window.currentScanner = html5QrCode;
          html5QrCode.start(
              { facingMode: "environment" },
              { 
                  fps: 20, 
                  formatsToSupport: [
                      window.Html5QrcodeSupportedFormats.EAN_13,
                      window.Html5QrcodeSupportedFormats.EAN_8,
                      window.Html5QrcodeSupportedFormats.UPC_A,
                      window.Html5QrcodeSupportedFormats.CODE_128,
                      window.Html5QrcodeSupportedFormats.QR_CODE
                  ]
              }, 
              (decodedText) => {
                  html5QrCode.stop().then(() => {
                      setScannerActive(false);
                      onScanSuccess(decodedText);
                  }).catch(() => {
                      setScannerActive(false);
                      onScanSuccess(decodedText);
                  });
              },
              (errorMessage) => { }
          ).catch((err) => {
              toast("Kamera başlatılamadı veya izin verilmedi.");
              setScannerActive(false);
          });
      }, 300);
  };

  const renderStudentGrid = (students, type) => {
    const todayStr = new Date().toDateString();
    const okulDateStr = new Date().getHours() < 15 ? new Date(Date.now() - 86400000).toDateString() : new Date().toDateString();
    
    if (currentModule === 'devamsizlik') {
        return (
            <div className="fade-in" style={{ gridColumn: '1 / -1', background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 40px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '25px', fontWeight: 900, color: '#0f172a', textAlign: 'center', fontSize: '24px' }}>📉 Genel Devamsızlık Çizelgesi</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    {[...students].sort((a,b) => (appData?.absences?.[b] || 0) - (appData?.absences?.[a] || 0)).map((n, index) => (
                        <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: '#0f172a', color: '#d4af37', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>{index + 1}</div>
                                <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{n}</span>
                            </div>
                            <span style={{ fontWeight: 900, fontSize: '14px', background: (appData?.absences?.[n] || 0) >= 8 ? '#fef2f2' : '#f1f5f9', color: (appData?.absences?.[n] || 0) >= 8 ? '#ef4444' : '#0f172a', padding: '8px 16px', borderRadius: '12px' }}>{appData?.absences?.[n] || 0} GÜN</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
    <div className="grid-mobile-2">
      {students.map(name => {
        const okulDurumu = appData?.daily_status?.[okulDateStr]?.[name];
        const isNotAtYurt = okulDurumu === 'a';
        
        let bgColor = '#ffffff'; let subText = ''; let isCompletedToday = false;
        
        if (currentModule === 'okul') {
            if (okulDurumu) { 
                isCompletedToday = true; 
                bgColor = okulDurumu === 'p' ? '#ecfdf5' : (okulDurumu === 'a' ? '#fef2f2' : '#f1f5f9'); 
                subText = okulDurumu === 'p' ? '✅ Döndü (İşlem Yapıldı)' : (okulDurumu === 'a' ? '❌ Gelmedi (İşlem Yapıldı)' : '✉️ İzinli (İşlem Yapıldı)');
            } else {
                subText = '⏳ Bekliyor';
            }
        }
        else if (currentModule === 'yoklama') { 
            const st = appData?.yoklama_d?.[todayStr]?.[name]?.sessions?.[selectedSession]?.st; 
            if (st) { isCompletedToday = true; subText = '✅ Yoklama Alındı'; }
            if (st === 'p' || st === 't') bgColor = '#ecfdf5'; 
            if (st === 'a') bgColor = '#fef2f2'; 
            if (st === 'l') bgColor = '#fffbeb'; 
        } 
        else if (currentModule === 'telefon') {
            const st = appData?.telefon_d?.[todayStr]?.[name]?.sessions?.gunluk?.st;
            if (st) { isCompletedToday = true; subText = '✅ İşlem Yapıldı'; }
            if (st === 'p' || st === 'e') bgColor = '#ecfdf5';
            if (st === 'a') bgColor = '#fef2f2';
        }
        else if (currentModule === 'yatak') {
            const yt = appData?.yatak_d?.[todayStr]?.[name];
            if (yt && yt.yatak_pts !== undefined && yt.dolap_pts !== undefined) { isCompletedToday = true; subText = '✅ İşlem Yapıldı'; }
            if (yt) bgColor = '#f0f9ff';
        }
        else if (currentModule === 'values_view') { 
            if (appData?.values_edu_d?.[name]?.[todayStr]?.done) { bgColor = '#ecfdf5'; isCompletedToday = true; }
        } 
        else if (currentModule === 'class_view') { 
            const d = appData?.education_d?.[name]; 
            if(d) subText = `Ödev: ${(d.lessons||[]).length} | Kitap: ${d.pages||0} | Soru: ${d.questions||0}`; 
        } 
        else if (currentModule === 'deneme_view') { 
            const net = appData?.exams?.[name]?.deneme?.net; 
            subText = net !== undefined ? `Net: ${parseFloat(net).toFixed(2)}` : 'Girilmedi'; 
        } 
        else if (currentModule === 'yazili_view') { 
            const avg = appData?.exams?.[name]?.yazili?.avg; 
            subText = avg !== undefined ? `Ort: ${parseFloat(avg).toFixed(1)}` : 'Girilmedi'; 
        }
        
        const isEliteStud = isElite(name);
        const has2X = (appData?.active_cards?.[name]?.multiplier?.date === todayStr) || (appData?.settings?.global_event === '2x_xp');
        const streakData = appData?.active_cards?.[name]?.streak;
        const hasStreak = streakData && (streakData.date === todayStr || (streakData.end && streakData.end > Date.now()));
        const isDisabled = isNotAtYurt && currentModule !== 'okul';

        return (
          <div key={name} onClick={() => { 
                if (isDisabled || isCompletedToday) {
                    if (isCompletedToday && currentModule === 'okul') toast(`⚠️ ${name} için bugünün Okul Dönüş işlemi zaten yapılmış!\n\nGünde sadece bir kez işlem yapılabilir.`);
                    return;
                }
                setSelectedStudent(name); 
                if (type === 'isleyis') setModalType('isleyis');
                else if (type === 'egitim_ders') { setEduData({ lessons: appData?.education_d?.[name]?.lessons || [], pages: appData?.education_d?.[name]?.pages || 0, questions: appData?.education_d?.[name]?.questions || 0 }); setModalType('egitim'); }
                else if (type === 'egitim_deneme') { setExamData(appData?.exams?.[name]?.deneme || {}); setModalType('deneme'); }
                else if (type === 'egitim_yazili') { setExamData(appData?.exams?.[name]?.yazili || {}); setModalType('yazili'); }
             }} 
               className="card-hover" style={{ background: isDisabled ? '#e2e8f0' : bgColor, border: isEliteStud && !isDisabled ? '2px solid #d4af37' : 'none', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a', cursor: (isDisabled || isCompletedToday) ? 'not-allowed' : 'pointer', opacity: (isDisabled || isCompletedToday) ? 0.7 : 1, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {isCompletedToday && <span style={{ fontSize: '18px' }} title="Tamamlandı">✅</span>}
                {isDisabled && <span style={{ fontSize: '18px' }} title="Kurumda Yok">🚫</span>}
                {isEliteStud && !isCompletedToday && !isDisabled && <span style={{ fontSize: '18px' }} title="Elit Lig">👑</span>}
                {has2X && <span style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>⚡ 2X</span>}
                {hasStreak && <span style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>🛡️</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', textDecoration: isCompletedToday ? 'line-through' : 'none' }}>{name}</div>
            {isDisabled && <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, marginTop: '5px' }}>Kurumda Değil</div>}
            {subText && <div style={{ fontSize: '12px', color: (isCompletedToday && currentModule === 'okul') ? '#10b981' : '#64748b', marginTop: '8px', fontWeight: 800 }}>{subText}</div>}
          </div>
        );
      })}
    </div>
  )};

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        * { outline: none !important; } button, input, select { border: none !important; outline: none !important; }
        .premium-btn { border-radius: 50px !important; border: none !important; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.08); display: inline-flex; align-items: center; justify-content: center;}
        .premium-btn:hover { filter: brightness(0.95); transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.12); } .premium-btn:active { transform: scale(0.96); }
        .btn-iptal { background: #f1f5f9 !important; color: #64748b !important; padding: 16px 24px; border-radius: 50px !important; font-weight: 800; border: none !important; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-iptal:hover { background: #e2e8f0 !important; color: #0f172a !important; transform: translateY(-2px); } .btn-iptal:active { transform: scale(0.96); }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none !important; } .card-hover:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 35px -5px rgba(0,0,0,0.1) !important; } .card-hover:active { transform: scale(0.98); }
        .elite-input { outline: none !important; border: 2px solid #e2e8f0 !important; transition: all 0.2s; padding: 14px 20px; border-radius: 20px; width: 100%; font-weight: 700; color: #0f172a; background: #f8fafc; }
        .elite-input:focus { border-color: #0d9488 !important; background: #ffffff; box-shadow: 0 0 0 4px rgba(13,148,136,0.1) !important; }
        .clean-scroll::-webkit-scrollbar { width: 6px; } .clean-scroll::-webkit-scrollbar-track { background: transparent; } .clean-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .premium-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .premium-card { background: white; text-align: center; border-radius: 24px; padding: 35px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: center; align-items: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .premium-card .icon { font-size: 48px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .premium-card .label { font-size: 15px; font-weight: 900; color: #0f172a; line-height: 1.3; }
        .grid-mobile-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        @media (max-width: 768px) { .premium-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; } .premium-card { padding: 20px 10px; border-radius: 20px; aspect-ratio: 1; } .premium-card .icon { font-size: 40px; margin-bottom: 10px; } .premium-card .label { font-size: 13px; letter-spacing: 0; } .grid-mobile-2 { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .popIn-anim { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes badgePulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); } }
        .badge-glow { animation: badgePulse 2s infinite; border: 2px solid #d4af37 !important; background: #fffbeb !important; }
      `}</style>

      <input type="file" ref={csvDenemeRef} accept=".csv, .xlsx, .xls" style={{display: 'none'}} onChange={(e) => handleCSVUpload(e, 'deneme')} />
      <input type="file" ref={csvYaziliRef} accept=".csv, .xlsx, .xls" style={{display: 'none'}} onChange={(e) => handleCSVUpload(e, 'yazili')} />

      <div className="popIn-anim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '50px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <button onClick={handleBack} className="premium-btn" style={{ background: '#f1f5f9', color: '#0f172a', padding: '12px 20px', fontWeight: 800 }}>← {currentModule || dashboardView !== 'main' ? 'Geri Dön' : 'Çıkış Yap'}</button>
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0d9488' }}>PERSONEL PANELİ</div>
      </div>

      <div className="fade-in" key={dashboardView + (currentModule || '')}>

        {!currentModule && (
          <div className="premium-grid">
            {dashboardView === 'main' && [
              { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' },
              { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
              { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' },
              { id: 'staff_gameroom', icon: '🎮', label: 'OYUN ODASI DENETİM', bg: '#fef2f2' },
              { id: 'kantin', icon: '🏪', label: 'KANTİN YÖNETİMİ', bg: '#f0fdf4' },
              { id: 'hygiene', icon: '✨', label: 'HİJYEN DENETİM', bg: '#f0f9ff' },
              { id: 'akademi', icon: '🎓', label: 'AKADEMİ SORULARI', bg: '#eff6ff' }
            ].map(mod => (
              <div key={mod.id} onClick={() => {
                  if (mod.id === 'staff_gameroom') setCurrentModule('staff_gameroom');
                  else if (mod.id === 'kantin') setCurrentModule('kantin');
                  else if (mod.id === 'hygiene') setCurrentModule('hygiene');
                  else if (mod.id === 'akademi') setCurrentModule('akademi');
                  else setDashboardView(mod.id);
              }} className="premium-card card-hover" style={{ background: mod.bg || 'white' }}>
                <div className="icon">{mod.icon}</div><div className="label">{mod.label}</div>
              </div>
            ))}
            
            {dashboardView === 'egitim' && [ 
              { id: 'egitim_ders', icon: '📝', label: 'ÖDEV / KİTAP TAKİBİ' }, 
              { id: 'egitim_deneme', icon: '📊', label: 'DENEME SINAVLARI' }, 
              { id: 'egitim_yazili', icon: '💯', label: 'YAZILI HAZIRLIK' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
            
            {dashboardView === 'egitim_ders' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('class_view'); setSelectedSession(cls); }} className="premium-card card-hover"><div className="icon">📝</div><div className="label">{cls}</div></div>))}
            {dashboardView === 'egitim_deneme' && eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('deneme_view'); setSelectedSession(cls); }} className="premium-card card-hover"><div className="icon">📊</div><div className="label">{cls}</div></div>))}
            {dashboardView === 'egitim_yazili' && (
              <>
                {eduClassList.map(cls => (<div key={cls} onClick={() => { setCurrentModule('yazili_view'); setSelectedSession(cls); }} className="premium-card card-hover"><div className="icon">💯</div><div className="label">{cls}</div></div>))}
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><button onClick={() => { if(window.confirm('Tüm sınıfların YAZILI notları sıfırlanacak. Emin misiniz?')) { const updates = {}; roster.forEach(n => updates[`exams/${n}/yazili`] = null); db.ref('mavikent_premium').update(updates); toast('Yazılı notları sıfırlandı!'); } }} className="premium-btn" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '18px', fontSize: '15px' }}>🔄 HAFTALIK YAZILI PERFORMANSLARINI SIFIRLA</button></div>
              </>
            )}

            {dashboardView === 'degerler' && [
              { id: 'degerler_values', icon: '📖', label: 'DEĞERLER EĞİTİMİ' },
              { id: 'degerler_imtihan', icon: '📚', label: 'İMTİHAN HAZIRLIK' },
            ].map(mod => (
              <div key={mod.id} onClick={() => setDashboardView(mod.id)} className="premium-card card-hover">
                <div className="icon">{mod.icon}</div><div className="label">{mod.label}</div>
              </div>
            ))}
            {dashboardView === 'degerler_values' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('values_view'); setSelectedSession(lvl); }} className="premium-card card-hover"><div className="icon">🕌</div><div className="label">{lvl}</div></div>))}
            {dashboardView === 'degerler_imtihan' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('imtihan_view'); setSelectedSession(lvl); setImtihanStudent(null); setImtihanSubject(null); }} className="premium-card card-hover"><div className="icon">📚</div><div className="label">{lvl}</div></div>))}
            
            {dashboardView === 'isleyis' && [ 
              { id: 'okul', icon: '🏫', label: 'Okul Dönüş' },
              { id: 'yoklama', icon: '📋', label: 'Yoklama' }, 
              { id: 'telefon', icon: '📱', label: 'Telefon' }, 
              { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' },
              { id: 'tutanak', icon: '⚖️', label: 'Tutanak / Ceza' },
              { id: 'devamsizlik', icon: '📉', label: 'Devamsızlık' },
              { id: 'istirahat', icon: '🛌', label: 'İstirahat Kontrol', bg: '#f0fdf4' }
            ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover" style={{ background: mod.bg || 'white' }}><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
          </div>
        )}

        {/* --- OYUN ODASI DENETİM MERKEZİ (PERSONEL) --- */}
        {currentModule === 'staff_gameroom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '30px', borderRadius: '24px', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e3a8a', fontWeight: 900 }}>🕵️‍♂️ Oyun Odası Sorumlusu Ata</h3>
                    <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '20px', fontWeight: 600 }}>Seçilen öğrenci, kendi panelinden oyun odası randevularını kontrol edebilir ve denetim formunu doldurabilir.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={appData?.settings?.game_room_controller || ''} onChange={e => {
                            db.ref('mavikent_premium/settings/game_room_controller').set(e.target.value);
                            toast(`Oyun Odası Sorumlusu başarıyla atandı! (${e.target.value})`);
                        }} className="elite-input" style={{ flex: 1 }}>
                            <option value="">Sorumlu Seçin</option>
                            {roster.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontWeight: 900 }}>📋 Canlı Denetim Formu ({todayStrTR})</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Personel olarak oyun odasını bizzat denetleyip raporu sisteme işleyebilirsiniz.</p>
                    
                    <div style={{ marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e3a8a', marginBottom: '10px' }}>1. AŞAMA: DEĞERLENDİRİLECEK RANDEVUYU SEÇ</div>
                        <select className="elite-input" style={{textAlign: 'left'}} value={evalForm.bookingId} onChange={e => {
                            const val = e.target.value;
                            if(!val) return setEvalForm({...evalForm, bookingId: '', student: ''});
                            const [dev, day, slot, stu, time] = val.split('|');
                            setEvalForm({...evalForm, bookingId: val, device: dev, day, slot, student: stu, time});
                        }}>
                            <option value="">Bugünün Aktif Randevularından Seçin...</option>
                            {allBookingsForController.map(b => (
                                <option key={`${b.device}|${b.day}|${b.slotId}`} value={`${b.device}|${b.day}|${b.slotId}|${b.student}|${b.time}`}>
                                    {b.time} | {b.devName} | Oynayan: {String(b.student || '').split(',')[0]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {evalForm.student && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e3a8a', marginBottom: '5px' }}>2. AŞAMA: DURUM TESPİTİ (Evet / Hayır)</div>

                            <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '2px solid #3b82f6', marginBottom: '10px' }}>
                                <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e40af', marginBottom: '12px' }}>Öğrenci randevusuna iştirak etti mi?</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setEvalForm({...evalForm, attended: true})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: evalForm.attended !== false ? '#10b981' : '#e2e8f0', color: evalForm.attended !== false ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer' }}>EVET (Oynadı)</button>
                                    <button onClick={() => setEvalForm({...evalForm, attended: false})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: evalForm.attended === false ? '#ef4444' : '#e2e8f0', color: evalForm.attended === false ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer' }}>HAYIR (İade Yap)</button>
                                </div>
                            </div>

                            {evalForm.attended !== false ? (
                                <>
                                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>1. Cihazlar sağlam bir şekilde teslim edildi mi?</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEvalForm({...evalForm, q1: true})} className="premium-btn" style={{ background: evalForm.q1 ? '#10b981' : '#e2e8f0', color: evalForm.q1 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                            <button onClick={() => setEvalForm({...evalForm, q1: false})} className="premium-btn" style={{ background: !evalForm.q1 ? '#ef4444' : '#e2e8f0', color: !evalForm.q1 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>2. Masa sandalye tertip düzenli bırakıldı mı?</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEvalForm({...evalForm, q2: true})} className="premium-btn" style={{ background: evalForm.q2 ? '#10b981' : '#e2e8f0', color: evalForm.q2 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                            <button onClick={() => setEvalForm({...evalForm, q2: false})} className="premium-btn" style={{ background: !evalForm.q2 ? '#ef4444' : '#e2e8f0', color: !evalForm.q2 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>3. Eğer ilk seans ise oyundan çıkılarak teslim edildi mi?</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEvalForm({...evalForm, q3: true})} className="premium-btn" style={{ background: evalForm.q3 ? '#10b981' : '#e2e8f0', color: evalForm.q3 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                            <button onClick={() => setEvalForm({...evalForm, q3: false})} className="premium-btn" style={{ background: !evalForm.q3 ? '#ef4444' : '#e2e8f0', color: !evalForm.q3 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', flex: 1 }}>4. Eğer son seans ise cihaz tamamen kapatılıp teslim edildi mi?</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEvalForm({...evalForm, q4: true})} className="premium-btn" style={{ background: evalForm.q4 ? '#10b981' : '#e2e8f0', color: evalForm.q4 ? 'white' : '#64748b', padding: '8px 16px' }}>Evet</button>
                                            <button onClick={() => setEvalForm({...evalForm, q4: false})} className="premium-btn" style={{ background: !evalForm.q4 ? '#ef4444' : '#e2e8f0', color: !evalForm.q4 ? 'white' : '#64748b', padding: '8px 16px' }}>Hayır</button>
                                        </div>
                                    </div>

                                    <div style={{ background: evalForm.q5 ? '#fef2f2' : '#f8fafc', padding: '20px', borderRadius: '16px', border: `2px solid ${evalForm.q5 ? '#ef4444' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 900, color: evalForm.q5 ? '#b91c1c' : '#334155' }}>5. Oyun odasına yiyecek veya içecek sokuldu mu?</div>
                                            {evalForm.q5 ? (
                                                <div className="fade-in" style={{ fontSize: '12px', color: '#ef4444', fontWeight: 900, marginTop: '6px', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>⛔ DİKKAT: Gönderildiği an öğrenci 1 Hafta Ban yiyecek!</div>
                                            ) : (
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>Kesinlikle yasaktır, tespiti halinde ağır cezası vardır.</div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEvalForm({...evalForm, q5: true})} className="premium-btn" style={{ background: evalForm.q5 ? '#ef4444' : '#e2e8f0', color: evalForm.q5 ? 'white' : '#64748b', padding: '10px 16px' }}>Evet (İhlal Var)</button>
                                            <button onClick={() => setEvalForm({...evalForm, q5: false})} className="premium-btn" style={{ background: !evalForm.q5 ? '#10b981' : '#e2e8f0', color: !evalForm.q5 ? 'white' : '#64748b', padding: '10px 16px' }}>Hayır (Temiz)</button>
                                        </div>
                                    </div>

                                    {(!evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || evalForm.q5) && (
                                        <div className="fade-in" style={{ marginTop: '15px', background: '#fef2f2', border: '2px dashed #fca5a5', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444', marginBottom: '10px' }}>📸 İHLAL TESPİT EDİLDİ - KANIT FOTOĞRAFI YÜKLE</div>
                                            
                                            <input type="file" id="proofPhotoInputStaff" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                            
                                            {!evalForm.photoUrl ? (
                                                <button onClick={() => document.getElementById('proofPhotoInputStaff').click()} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '16px 20px', fontSize: '14px', width: '100%', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }}>
                                                    📷 Kamerayı Aç veya Galeriden Seç
                                                </button>
                                            ) : (
                                                <div className="fade-in">
                                                    <img src={evalForm.photoUrl} alt="Kanıt" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ef4444', marginBottom: '15px' }} />
                                                    <button onClick={() => setEvalForm({...evalForm, photoUrl: ''})} className="premium-btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5 !important', padding: '10px 16px', fontSize: '13px' }}>🗑️ Fotoğrafı Sil / Yeniden Yükle</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="fade-in" style={{ padding: '20px', background: '#fff1f2', borderRadius: '16px', border: '1px solid #fda4af', color: '#be123c', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                                    ⚠️ "HAYIR" seçildiği için diğer sorular devre dışı bırakıldı. Raporu gönderdiğinizde öğrenciye otomatik M-Coin iadesi yapılacak ve bu seans iptal edilecektir.
                                </div>
                            )}

                            <button onClick={() => {
                                if(!evalForm.student) return toast("Değerlendirilecek randevuyu seçin!");
                                
                                if(evalForm.attended !== false) {
                                    const hasViolation = !evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || evalForm.q5;
                                    if(hasViolation && !evalForm.photoUrl) {
                                        if(!window.confirm("İhlal bildirdiniz ama KANIT FOTOĞRAFI eklemediniz. Yine de kaydetmek istiyor musunuz?")) return;
                                    }
                                }

                                if(window.confirm(`${String(evalForm.student || '').split(',')[0]} için işlem sisteme işlenecek. Onaylıyor musun?`)) {
                                    const updates = {};
                                    const rId = `rep_${Date.now()}`;
                                    
                                    updates[`game_room_reports/${rId}`] = {
                                        controller: 'PERSONEL',
                                        target: evalForm.student, device: evalForm.device, day: evalForm.day, time: evalForm.time,
                                        attended: evalForm.attended !== false,
                                        q1: evalForm.q1, q2: evalForm.q2, q3: evalForm.q3, q4: evalForm.q4, q5: evalForm.q5,
                                        photoUrl: evalForm.photoUrl || '', date: new Date().toLocaleString('tr-TR')
                                    };

                                    if(evalForm.attended !== false) {
                                        if(evalForm.q5) {
                                            const expTime = Date.now() + (7 * 24 * 60 * 60 * 1000); 
                                            const studentArray = String(evalForm.student || '').split(', ');
                                            studentArray.forEach(stu => {
                                                if(stu.trim()) {
                                                    updates[`game_room_bans/${stu.trim()}`] = {
                                                        reason: 'Yiyecek/İçecek İhlali (Personel Tespiti)', photoUrl: evalForm.photoUrl || '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR')
                                                    };
                                                }
                                            });
                                            if (evalForm.device && evalForm.day && evalForm.slot) {
                                                updates[`game_room_appointments/${evalForm.device}/${evalForm.day}/${evalForm.slot}`] = null;
                                            }
                                        }
                                    } else {
                                        updates[`game_room_appointments/${evalForm.device}/${evalForm.day}/${evalForm.slot}`] = null;
                                        
                                        const defaultSlotObj = (GAME_SLOTS[evalForm.device] || []).find(s => s.id === evalForm.slot);
                                        let refundAmt = defaultSlotObj?.price || 0;

                                        const customPrice = appData?.custom_game_slots?.[evalForm.device]?.[evalForm.day]?.[evalForm.slot]?.price;
                                        if (customPrice) refundAmt = Number(customPrice);

                                        updates[`wallet/${evalForm.student}`] = (Number(appData?.wallet?.[evalForm.student]) || 0) + refundAmt;
                                        updates[`transactions/${evalForm.student}/txn_auto_ref_${Date.now()}`] = { 
                                            desc: `Oyun Odası İadesi (Denetim Kaynaklı)`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') 
                                        };

                                        db.ref('mavikent_premium/global_chat').push({ 
                                            s: 'SİSTEM', 
                                            t: `📢 ${String(evalForm.student).split(' ')[0]} adlı öğrenci randevusuna iştirak edemediği için ${refundAmt} M-Coin iadesi yapılmıştır.`, 
                                            ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
                                        });
                                    }
                                    
                                    db.ref('mavikent_premium').update(updates).then(() => {
                                        toast(evalForm.attended !== false ? "✅ Denetim raporu başarıyla kaydedildi!" : "🔄 Randevu iptal edildi ve M-Coin iadesi yapıldı.");
                                        setEvalForm({ bookingId: '', student: '', device: '', day: '', slot: '', time: '', attended: true, q1: true, q2: true, q3: true, q4: true, q5: false, photoUrl: '' });
                                    });
                                }
                            }} className="premium-btn badge-glow" style={{ background: '#0f172a', color: 'white', padding: '20px', width: '100%', marginTop: '15px', fontSize: '16px' }}>{evalForm.attended !== false ? 'RAPORU SİSTEME KAYDET' : 'İADE YAP VE İPTAL ET'}</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- KANTİN YÖNETİMİ --- */}
        {currentModule === 'kantin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* KAMERA EKRANI (OVERLAY MODAL) */}
                {scannerActive && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div className="popIn-anim" style={{ background: 'white', padding: '20px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#0f172a', fontWeight: 900 }}>📷 Barkod Bekleniyor...</h3>
                            <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}></div>
                            <button onClick={() => { 
                                if(window.currentScanner) {
                                    window.currentScanner.stop().then(() => setScannerActive(false)).catch(() => setScannerActive(false));
                                } else setScannerActive(false);
                            }} className="premium-btn" style={{ background: '#ef4444', color: 'white', width: '100%', padding: '15px', marginTop: '15px', fontSize: '16px' }}>KAPAT / İPTAL ET</button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    <button onClick={() => setCanteenView('satis')} className="premium-btn" style={{ flex: 1, padding: '14px', background: canteenView === 'satis' ? '#0f172a' : 'white', color: canteenView === 'satis' ? '#10b981' : '#64748b', fontWeight: 900, whiteSpace: 'nowrap' }}>🛒 Satış Ekranı</button>
                    <button onClick={() => setCanteenView('urun_ekle')} className="premium-btn" style={{ flex: 1, padding: '14px', background: canteenView === 'urun_ekle' ? '#0f172a' : 'white', color: canteenView === 'urun_ekle' ? '#f59e0b' : '#64748b', fontWeight: 900, whiteSpace: 'nowrap' }}>📦 Ürün Ekle</button>
                    <button onClick={() => setCanteenView('yukleme')} className="premium-btn" style={{ flex: 1, padding: '14px', background: canteenView === 'yukleme' ? '#0f172a' : 'white', color: canteenView === 'yukleme' ? '#3b82f6' : '#64748b', fontWeight: 900, whiteSpace: 'nowrap' }}>💰 Bakiye Yükle</button>
                    <button onClick={() => setCanteenView('rapor')} className="premium-btn" style={{ flex: 1, padding: '14px', background: canteenView === 'rapor' ? '#0f172a' : 'white', color: canteenView === 'rapor' ? '#d4af37' : '#64748b', fontWeight: 900, whiteSpace: 'nowrap' }}>📊 Kasa Raporu</button>
                </div>

                {/* 1. SATIŞ EKRANI */}
                {canteenView === 'satis' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '15px' }}>Satışa Ürün Ekle</div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input autoFocus type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} placeholder="Barkod No" className="elite-input" style={{ flex: 1 }} />
                                <button onClick={() => {
                                    if(!barcodeInput.trim()) return;
                                    const prod = appData?.canteen_products?.[barcodeInput.trim()];
                                    if(prod) { setCart([...cart, { id: barcodeInput.trim(), name: prod.name, price: Number(prod.price) }]); setBarcodeInput(''); } 
                                    else { toast("Sistemde bu barkoda ait ürün yok! Önce 'Ürün Ekle' kısmından kaydedin."); }
                                }} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '0 25px' }}>EKLE</button>
                                <button onClick={() => startBarcodeScanner((code) => {
                                    const prod = appData?.canteen_products?.[code];
                                    if(prod) { setCart(prev => [...prev, { id: code, name: prod.name, price: Number(prod.price) }]); } 
                                    else { toast(`Bilinmeyen Barkod: ${code}\nLütfen önce 'Ürün Ekle' menüsünden bu ürünü kaydedin.`); }
                                })} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '0 20px', fontSize: '24px' }} title="Kamera ile Okut">📷</button>
                            </div>
                        </div>

                        {cart.length > 0 && (
                            <div className="fade-in" style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ fontWeight: 900, color: '#0f172a' }}>🛒 Sepet ({cart.length} Ürün)</div>
                                    <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Sepeti Temizle</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                                    {cart.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 700, color: '#334155' }}>{item.name}</div><div style={{ fontWeight: 900, color: '#0f172a' }}>{item.price} ₺</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#ecfdf5', borderRadius: '16px', border: '2px dashed #10b981', marginBottom: '25px' }}>
                                    <div style={{ fontWeight: 900, color: '#047857', fontSize: '18px' }}>TOPLAM TUTAR:</div><div style={{ fontWeight: 900, color: '#047857', fontSize: '28px' }}>{cart.reduce((a,b)=>a+b.price, 0)} ₺</div>
                                </div>

                                {/* ŞIK ÖDEME BLOKLARI */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <select className="elite-input" value={canteenStudent} onChange={e => setCanteenStudent(e.target.value)} style={{ background: canteenStudent ? '#ecfdf5' : '#f8fafc', borderColor: canteenStudent ? '#10b981' : '#e2e8f0', fontWeight: 800 }}>
                                        <option value="">👤 HESAPTAN DÜŞÜLECEKSE ÖĞRENCİ SEÇİN (Nakitse Seçmeyin)</option>
                                        {roster.map(n => <option key={n} value={n}>{n} (Mevcut Bakiye: {appData?.canteen_wallet?.[n] || 0} ₺)</option>)}
                                    </select>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                        {/* NAKİT ÖDEME BLOĞU */}
                                        <div onClick={() => {
                                            const total = cart.reduce((a,b)=>a+b.price, 0);
                                            if(window.confirm(`Nakit kasasına ${total} ₺ eklenecek. Onaylıyor musunuz?`)) {
                                                const updates = {};
                                                updates[`canteen_logs/txn_${Date.now()}`] = { type: 'cash_sale', amount: total, items: cart.map(c=>c.name).join(', '), date: new Date().toLocaleString('tr-TR'), timestamp: Date.now() };
                                                cart.forEach(item => { const cStock = appData?.canteen_products?.[item.id]?.stock || 0; updates[`canteen_products/${item.id}/stock`] = Math.max(0, cStock - 1); });
                                                db.ref('mavikent_premium').update(updates).then(() => { toast('✅ Satış Başarılı! Nakit kasaya eklendi.'); setCart([]); });
                                            }
                                        }} className="card-hover" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white', padding: '25px', borderRadius: '24px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}>
                                            <div style={{ fontSize: '45px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>💵</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>NAKİT ALINDI</div>
                                            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '5px', fontWeight: 600 }}>Tutar Kasaya İşlenir</div>
                                        </div>

                                        {/* HESAPTAN DÜŞ BLOĞU */}
                                        <div onClick={() => {
                                            if(!canteenStudent) return toast('Lütfen yukarıdaki menüden hesabı düşülecek öğrenciyi seçin!');
                                            const total = cart.reduce((a,b)=>a+b.price, 0); const currBalance = Number(appData?.canteen_wallet?.[canteenStudent]) || 0;
                                            if(currBalance < total) { if(!window.confirm(`⚠️ DİKKAT: ${canteenStudent} adlı öğrencinin bakiyesi YETERSİZ (${currBalance} ₺). Yine de hesabı eksiye düşürülsün mü?`)) return; }
                                            const updates = {};
                                            updates[`canteen_wallet/${canteenStudent}`] = currBalance - total; 
                                            updates[`canteen_logs/txn_${Date.now()}`] = { type: 'account_sale', amount: total, student: canteenStudent, items: cart.map(c=>c.name).join(', '), date: new Date().toLocaleString('tr-TR'), timestamp: Date.now() };
                                            cart.forEach(item => { const cStock = appData?.canteen_products?.[item.id]?.stock || 0; updates[`canteen_products/${item.id}/stock`] = Math.max(0, cStock - 1); });
                                            db.ref('mavikent_premium').update(updates).then(() => { toast(`✅ Satış Başarılı! Yeni bakiye: ${currBalance - total} ₺`); setCart([]); setCanteenStudent(''); });
                                        }} className="card-hover" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '25px', borderRadius: '24px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.3)' }}>
                                            <div style={{ fontSize: '45px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>💳</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>HESAPTAN DÜŞ</div>
                                            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '5px', fontWeight: 600 }}>Öğrenci Bakiyesinden Düşer</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. ÜRÜN EKLEME EKRANI */}
                {canteenView === 'urun_ekle' && (
                    <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '20px', fontSize: '18px' }}>📦 Sisteme Yeni Ürün Kaydet</div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} placeholder="Barkod Numarası" className="elite-input" style={{ flex: 1 }} />
                            <button onClick={() => startBarcodeScanner((code) => setNewProduct({...newProduct, barcode: code}))} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '0 20px', fontSize: '15px' }}>📷 Kamera İle Oku</button>
                        </div>
                        
                        <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ürün Adı (Örn: Ülker Çikolatalı Gofret)" className="elite-input" style={{ width: '100%', marginBottom: '15px' }} />
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Fiyatı (₺)" className="elite-input" style={{ flex: 1 }} />
                            <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="Stok Adedi" className="elite-input" style={{ flex: 1 }} />
                        </div>

                        <button onClick={() => {
                            if(!newProduct.barcode || !newProduct.name || !newProduct.price || !newProduct.stock) return toast("Lütfen tüm alanları doldurun!");
                            const updates = {};
                            updates[`canteen_products/${newProduct.barcode}`] = { name: newProduct.name, price: Number(newProduct.price), stock: Number(newProduct.stock) };
                            db.ref('mavikent_premium').update(updates).then(() => {
                                toast("✅ Ürün Başarıyla Kaydedildi!");
                                setNewProduct({ barcode: '', name: '', price: '', stock: '' });
                            });
                        }} className="premium-btn badge-glow" style={{ width: '100%', padding: '20px', background: '#0f172a', color: 'white', fontSize: '16px' }}>ÜRÜNÜ SİSTEME KAYDET</button>
                    </div>
                )}

                {/* 3. BAKİYE YÜKLEME EKRANI */}
                {canteenView === 'yukleme' && (
                    <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '20px', fontSize: '18px' }}>💰 Nakit Bakiye Yükleme</div>
                        <select className="elite-input" value={canteenStudent} onChange={e => setCanteenStudent(e.target.value)} style={{ marginBottom: '15px' }}>
                            <option value="">Öğrenci Seçin</option>
                            {roster.map(n => <option key={n} value={n}>{n} (Mevcut: {appData?.canteen_wallet?.[n] || 0} ₺)</option>)}
                        </select>
                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Yüklenecek Tutar (₺)" className="elite-input" style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 900 }} />
                        <button onClick={() => {
                            if(!canteenStudent || !depositAmount || isNaN(depositAmount) || depositAmount <= 0) return toast('Geçerli bir öğrenci ve tutar girin!');
                            const amt = Number(depositAmount);
                            if(window.confirm(`${canteenStudent} adlı öğrenciye ${amt} ₺ bakiye yüklenecek. Onaylıyor musunuz?`)) {
                                playCoin(); const currBalance = Number(appData?.canteen_wallet?.[canteenStudent]) || 0; const updates = {};
                                updates[`canteen_wallet/${canteenStudent}`] = currBalance + amt; updates[`canteen_logs/txn_${Date.now()}`] = { type: 'deposit', amount: amt, student: canteenStudent, date: new Date().toLocaleString('tr-TR'), timestamp: Date.now() };
                                db.ref('mavikent_premium').update(updates).then(() => { toast(`Bakiye Yüklendi! Yeni Bakiye: ${currBalance + amt} ₺`); setDepositAmount(''); setCanteenStudent(''); });
                            }
                        }} className="premium-btn" style={{ width: '100%', padding: '20px', background: '#3b82f6', color: 'white', fontSize: '16px' }}>BAKİYE YÜKLE</button>
                    </div>
                )}

                {/* 4. KASA RAPORU */}
                {canteenView === 'rapor' && (
                    (() => {
                        const logs = Object.values(appData?.canteen_logs || {}).sort((a,b) => b.timestamp - a.timestamp); const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); const recentLogs = logs.filter(l => l.timestamp >= weekAgo);
                        let totalCashIn = 0; let depositTotal = 0; let cashSaleTotal = 0; let accountSaleTotal = 0;
                        recentLogs.forEach(l => { if(l.type === 'deposit') { depositTotal += Number(l.amount); totalCashIn += Number(l.amount); } else if(l.type === 'cash_sale') { cashSaleTotal += Number(l.amount); totalCashIn += Number(l.amount); } else if(l.type === 'account_sale') { accountSaleTotal += Number(l.amount); } });
                        return (
                            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><div style={{ fontSize: '13px', fontWeight: 800 }}>KASAYA GİREN NAKİT (7 GÜN)</div><div style={{ fontSize: '32px', fontWeight: 900, marginTop: '5px' }}>{totalCashIn} ₺</div></div>
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>BAKİYE YÜKLEMELERİNDEN</div><div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6', marginTop: '5px' }}>{depositTotal} ₺</div></div>
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>PEŞİN SATIŞLARDAN</div><div style={{ fontSize: '24px', fontWeight: 900, color: '#0d9488', marginTop: '5px' }}>{cashSaleTotal} ₺</div></div>
                                    <div style={{ background: '#fffbeb', border: '1px solid #fde047', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309' }}>HESAPTAN SATIŞLAR (ÜRÜN ÇIKIŞI)</div><div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', marginTop: '5px' }}>{accountSaleTotal} ₺</div></div>
                                </div>
                                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                    <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: '15px' }}>📜 Son İşlem Geçmişi</div>
                                    <div className="clean-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {logs.slice(0, 30).map((l, i) => (
                                            <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div><div style={{ fontSize: '13px', fontWeight: 800, color: l.type === 'deposit' ? '#3b82f6' : (l.type === 'cash_sale' ? '#10b981' : '#d97706') }}>{l.type === 'deposit' ? '💰 Bakiye Yükleme' : (l.type === 'cash_sale' ? '💵 Nakit Satış' : '💳 Hesaptan Düşüldü')}</div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{l.date} | {l.student ? `Öğrenci: ${l.student}` : ''} {l.items ? `| Ürünler: ${l.items}` : ''}</div></div>
                                                <div style={{ fontWeight: 900, color: '#0f172a' }}>{l.amount} ₺</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
        )}

        {/* İŞLEYİŞ EKRANLARI */}
        {currentModule === 'yoklama' && !selectedSession && ( 
            <div className="grid-mobile-2">
                {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => ( 
                    <div key={s} onClick={() => setSelectedSession(s)} className="premium-card card-hover"><div className="icon">⏰</div><div className="label">{s}</div></div> 
                ))}
            </div> 
        )}
        
        {currentModule === 'yoklama' && selectedSession && ( 
            <div className="clean-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '25px', paddingBottom: '15px' }}>
                {['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'İzin Dönüşü', 'Ekstra'].map(s => ( 
                    <button key={s} onClick={() => setSelectedSession(s)} className="premium-btn" style={{ padding: '14px 24px', background: selectedSession === s ? '#0f172a' : 'white', color: selectedSession === s ? '#d4af37' : '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>{s}</button> 
                ))}
            </div> 
        )}
        
        {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'tutanak', 'okul', 'devamsizlik'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
        
        {/* EĞİTİM VE DEĞERLER EKRANLARI */}
        {currentModule === 'class_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_ders')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-egitim" onClick={() => downloadReportAsJPG('egitim', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#d4af37', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
             </div>
          </>
        )}
        
        {currentModule === 'deneme_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_deneme')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-deneme" onClick={() => downloadReportAsJPG('deneme', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0d9488', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
                <button onClick={() => downloadCSVTemplate('deneme')} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#10b981', color: 'white', fontSize: '16px', minWidth: '200px' }}>📥 ŞABLON İNDİR (CSV)</button>
                <button onClick={() => csvDenemeRef.current.click()} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0f172a', color: 'white', fontSize: '16px', minWidth: '200px' }}>📤 TOPLU SONUÇ YÜKLE</button>
             </div>
          </>
        )}

        {currentModule === 'yazili_view' && (
          <>
             {renderStudentGrid(getFilteredRoster(selectedSession), 'egitim_yazili')}
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-yazili" onClick={() => downloadReportAsJPG('yazili', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0d9488', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
                <button onClick={() => downloadCSVTemplate('yazili')} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#3b82f6', color: 'white', fontSize: '16px', minWidth: '200px' }}>📥 ŞABLON İNDİR (CSV)</button>
                <button onClick={() => csvYaziliRef.current.click()} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#0f172a', color: 'white', fontSize: '16px', minWidth: '200px' }}>📤 TOPLU SONUÇ YÜKLE</button>
             </div>
          </>
        )}
        
        {currentModule === 'values_view' && (
          <>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px' }}>📖 GÜNLÜK DERS KONUSU</h4>
                <select value={valuesTopic.subject} onChange={e => setValuesTopic({...valuesTopic, subject: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}>
                    <option value="">Ders Seçin</option>{valuesSubjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={valuesTopic.topic} onChange={e => setValuesTopic({...valuesTopic, topic: e.target.value})} placeholder="İşlenen konu vb." className="elite-input" style={{ marginBottom: '16px' }} />
                <button onClick={() => { db.ref(`mavikent_premium/values_log/${selectedSession}/${new Date().toDateString()}`).set(valuesTopic); toast("Konu Kaydedildi"); }} className="premium-btn" style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white', fontSize: '15px' }}>DERSİ YAYINLA</button>
            </div>
            {renderStudentGrid(roster.filter(n => appData?.student_levels?.[n] === selectedSession), 'degerler')}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-degerler" onClick={() => downloadReportAsJPG('degerler', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#d4af37', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
            </div>
          </>
        )}

        {/* İMTİHAN HAZIRLIK */}
        {currentModule === 'imtihan_view' && (() => {
          const levelStudents = roster.filter(n => appData?.student_levels?.[n] === selectedSession);
          const todayStr = new Date().toDateString();
          const levelKey = selectedSession.startsWith('SEVİYE 1') ? 'SEVİYE 1' : selectedSession;
          const subjects = IMTIHAN_SORULAR[levelKey] ? Object.keys(IMTIHAN_SORULAR[levelKey]) : [];
          const progress = appData?.imtihan_progress || {};

          const addCoin = async (studentName, amount, desc) => {
            const snap = await db.ref(`mavikent_premium/wallet/${studentName}`).once('value');
            const cur = snap.val() || 0;
            const ts = Date.now();
            const updates = {};
            updates[`wallet/${studentName}`] = cur + amount;
            updates[`transactions/${studentName}/txn_imtihan_${ts}`] = { desc, amt: amount, date: new Date().toLocaleString('tr-TR') };
            await db.ref('mavikent_premium').update(updates);
          };

          const toggleQuestion = async (q) => {
            const isDone = !!progress?.[imtihanStudent]?.[q.id]?.done;
            if (isDone) { toast('Bu soru zaten işaretlendi'); return; }
            const key = `${imtihanStudent}/${q.id}`;
            await db.ref(`mavikent_premium/imtihan_progress/${key}`).set({ done: true, date: todayStr, subject: imtihanSubject, soru: q.soru, cevap: q.cevap });
            await addCoin(imtihanStudent, 3, `📚 İmtihan Hazırlık: ${q.soru.slice(0, 40)}...`);
            playCoin();
            toast(`✅ +3 M-Coin — ${imtihanStudent}`);
          };

          if (!imtihanStudent) {
            const rankMedals = ['🥇', '🥈', '🥉'];
            const studentStats = levelStudents.map(name => ({ name, total: Object.keys(progress?.[name] || {}).length, today: Object.values(progress?.[name] || {}).filter(v => v.date === todayStr).length }));
            const rankedStudents = [...studentStats].sort((a, b) => b.total - a.total);
            return (
              <div className="fade-in">
                <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '16px' }}>
                  📚 İmtihan Hazırlık — {selectedSession}
                </h4>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Öğrenci grid */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                      {studentStats.map(({ name, total, today }) => (
                        <div key={name} onClick={() => setImtihanStudent(name)} className="premium-card card-hover" style={{ cursor: 'pointer', padding: '14px 8px', textAlign: 'center', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <div style={{ fontSize: '26px' }}>👤</div>
                          <div style={{ fontWeight: 900, fontSize: '11px', color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>{name}</div>
                          <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>✅ {today}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Sıralama listesi */}
                  <div style={{ width: '150px', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🏆 Sıralama</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {rankedStudents.map(({ name, total }, idx) => (
                        <div key={name} style={{ background: idx === 0 ? '#fef9c3' : idx === 1 ? '#f0f9ff' : idx === 2 ? '#fff7ed' : '#f8fafc', borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: idx < 3 ? '16px' : '12px', fontWeight: 900, minWidth: '20px', color: idx >= 3 ? '#94a3b8' : undefined }}>{rankMedals[idx] || `${idx + 1}.`}</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#6366f1' }}>{total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (subjects.length === 0) return (
            <div className="fade-in">
              <button onClick={() => setImtihanStudent(null)} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}>← Geri</button>
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>📭</div>
                <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '8px' }}>{selectedSession} için henüz soru eklenmedi</div>
                <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Bu seviyenin soruları sisteme yüklendiğinde burada görünecek.</div>
              </div>
            </div>
          );

          if (!imtihanSubject) return (
            <div className="fade-in">
              <button onClick={() => setImtihanStudent(null)} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}>← Geri</button>
              <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '16px' }}>
                👤 {imtihanStudent} — Ders Seçin
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                {subjects.map(subj => {
                  const questions = IMTIHAN_SORULAR[levelKey][subj];
                  const done = questions.filter(q => !!progress?.[imtihanStudent]?.[q.id]?.done).length;
                  return (
                    <div key={subj} onClick={() => setImtihanSubject(subj)} className="premium-card card-hover" style={{ cursor: 'pointer', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📖</div>
                      <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>{subj}</div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: done === questions.length ? '#10b981' : '#6366f1' }}>
                        {done} / {questions.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );

          const questions = IMTIHAN_SORULAR[levelKey][imtihanSubject] || [];
          const groupedByKonu = questions.reduce((acc, q) => {
            if (!acc[q.konu]) acc[q.konu] = [];
            acc[q.konu].push(q);
            return acc;
          }, {});

          return (
            <div className="fade-in">
              <button onClick={() => setImtihanSubject(null)} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}>← Geri</button>
              <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '4px' }}>
                📚 {imtihanSubject}
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>
                👤 {imtihanStudent} · {selectedSession} · Tik at = +3 M-Coin
              </p>
              {Object.entries(groupedByKonu).map(([konu, qs]) => (
                <div key={konu} style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 900, fontSize: '15px', color: '#6366f1', marginBottom: '14px', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
                    📌 {konu}
                  </div>
                  {qs.map((q, i) => {
                    const isDone = !!progress?.[imtihanStudent]?.[q.id]?.done;
                    return (
                      <div key={q.id} onClick={() => toggleQuestion(q)} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '14px',
                        marginBottom: i < qs.length - 1 ? '8px' : 0,
                        background: isDone ? '#f0fdf4' : '#f8fafc',
                        border: `1.5px solid ${isDone ? '#86efac' : '#e2e8f0'}`,
                        cursor: isDone ? 'default' : 'pointer', transition: 'all 0.15s',
                        opacity: isDone ? 0.85 : 1
                      }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: isDone ? '#10b981' : 'white', border: `2px solid ${isDone ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                          {isDone && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: isDone ? '#059669' : '#0f172a', lineHeight: 1.4 }}>{q.soru}</div>
                          {isDone && <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>💰 +3 M-Coin · {progress[imtihanStudent][q.id].date}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })()}

      {/* --- HİJYEN DENETİM MERKEZİ --- */}
      {currentModule === 'hygiene' && (() => {
          const allLogs = Object.values(appData?.hygiene_logs || {});
          const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
          const timeAgo = (ts) => {
              if (!ts) return null;
              const m = Math.floor((Date.now() - ts) / 60000);
              if (m < 1) return 'az önce';
              if (m < 60) return `${m} dk önce`;
              const h = Math.floor(m / 60);
              if (h < 24) return `${h} saat önce`;
              return `${Math.floor(h / 24)} gün önce`;
          };
          const lastLogTs = (filterFn) => {
              const f = allLogs.filter(filterFn);
              return f.length ? Math.max(...f.map(l => l.timestamp)) : null;
          };
          const todayAreaCount = (section) =>
              new Set(allLogs.filter(l => l.section === section && l.timestamp >= todayStart).map(l => l.areaName)).size;
          const lastScoreForArea = (areaName) => {
              const f = allLogs.filter(l => l.areaName === areaName).sort((a,b) => b.timestamp - a.timestamp);
              return f.length ? f[0].score : null;
          };

          return (
          <div className="fade-in" style={{ animation: 'fadeIn 0.4s ease-out' }}>

              {/* GERİ BUTONU */}
              {(staffHygSection || staffHygFloor) && (
                  <div style={{ marginBottom: '20px' }}>
                      <button onClick={() => {
                          if (staffHygAreaId) { setStaffHygAreaId(null); setStaffHygScore(5); }
                          else if (staffHygFloor) { setStaffHygFloor(null); setStaffHygAreaId(null); }
                          else { setStaffHygSection(null); setStaffHygFloor(null); setStaffHygAreaId(null); }
                      }} style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                          ← Geri
                      </button>
                  </div>
              )}

              {/* LEVEL 0: ANA EKRAN */}
              {!staffHygSection && (
                  <div className="fade-in">
                      <div style={{ marginBottom: '24px' }}>
                          <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>🏥 Hijyen Denetim Merkezi</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>Denetim türünü seç</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          {[
                              ['rutin',    '🛏️', 'Rutin Kontrol',    'Yatak, dolap, oda düzeni', '#f59e0b', '#b45309', 'linear-gradient(135deg,#fef3c7,#fde68a)'],
                              ['temizlik', '🧹', 'Temizlik Kontrol', 'WC, etüt, koridorlar',     '#10b981', '#065f46', 'linear-gradient(135deg,#d1fae5,#a7f3d0)'],
                          ].map(([key, icon, label, desc, color, dark, grad]) => {
                              const total = ['kat2','kat3','kat4'].reduce((n,fk) => n + Object.keys(appData?.hygiene_floors?.[key]?.[fk]?.areas || {}).length, 0);
                              const today = todayAreaCount(key);
                              const last  = lastLogTs(l => l.section === key);
                              const pct   = total > 0 ? Math.min(100, Math.round(today / total * 100)) : 0;
                              return (
                                  <div key={key} onClick={() => { setStaffHygSection(key); setStaffHygFloor(null); }} className="card-hover"
                                      style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 24px rgba(15,23,42,0.07)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                                      <div style={{ background: grad, padding: '24px 24px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                          <div style={{ fontSize: '44px', lineHeight: 1 }}>{icon}</div>
                                          <div>
                                              <div style={{ fontWeight: 900, fontSize: '18px', color: dark }}>{label}</div>
                                              <div style={{ fontSize: '12px', fontWeight: 600, color: dark + 'aa', marginTop: '2px' }}>{desc}</div>
                                          </div>
                                      </div>
                                      <div style={{ padding: '16px 24px 20px' }}>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px 14px' }}>
                                                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Toplam Alan</div>
                                                  <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a', marginTop: '2px' }}>{total}</div>
                                              </div>
                                              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px 14px' }}>
                                                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Son Denetim</div>
                                                  <div style={{ fontWeight: 700, fontSize: '12px', color: last ? '#0f172a' : '#94a3b8', marginTop: '4px' }}>{last ? timeAgo(last) : 'Kayıt yok'}</div>
                                              </div>
                                          </div>
                                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                              <span>Bugün tamamlanan</span>
                                              <span style={{ fontWeight: 900, color }}>{today}/{total}</span>
                                          </div>
                                          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                                              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: '8px', transition: 'width 0.6s ease' }} />
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      <button onClick={() => setStaffHygSection('history')}
                          style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '14px', borderRadius: '16px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          📜 Denetim Geçmişi
                          <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 900 }}>{allLogs.length}</span>
                      </button>
                  </div>
              )}

              {/* LEVEL 1: KAT SEÇİMİ */}
              {staffHygSection && staffHygSection !== 'history' && !staffHygFloor && (
                  <div className="fade-in">
                      <div style={{ marginBottom: '20px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              {staffHygSection === 'rutin' ? '🛏️ Rutin Kontrol' : '🧹 Temizlik Kontrol'} — Kat seç
                          </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          {[
                              ['kat2','Kat 2','2','#0ea5e9','#0369a1','linear-gradient(135deg,#e0f2fe,#bae6fd)'],
                              ['kat3','Kat 3','3','#8b5cf6','#6d28d9','linear-gradient(135deg,#ede9fe,#ddd6fe)'],
                              ['kat4','Kat 4','4','#10b981','#065f46','linear-gradient(135deg,#d1fae5,#a7f3d0)'],
                          ].map(([key, label, num, color, dark, grad]) => {
                              const areaCount = Object.keys(appData?.hygiene_floors?.[staffHygSection]?.[key]?.areas || {}).length;
                              const last = lastLogTs(l => l.section === staffHygSection && l.floor === key);
                              return (
                                  <div key={key} onClick={() => { setStaffHygFloor(key); setStaffHygAreaId(null); }} className="card-hover"
                                      style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                                      <div style={{ background: grad, padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                          <div>
                                              <div style={{ fontWeight: 900, fontSize: '36px', color: dark, lineHeight: 1 }}>{num}</div>
                                              <div style={{ fontWeight: 900, fontSize: '13px', color: dark, marginTop: '4px', opacity: 0.8 }}>{label}</div>
                                          </div>
                                          <div style={{ fontSize: '28px', opacity: 0.5 }}>🏢</div>
                                      </div>
                                      <div style={{ padding: '12px 20px 16px' }}>
                                          <div style={{ fontWeight: 800, color: color, fontSize: '14px' }}>{areaCount} alan tanımlı</div>
                                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>{last ? `Son: ${timeAgo(last)}` : 'Henüz denetim yok'}</div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              {/* LEVEL 2: KAT ALANLARI */}
              {staffHygSection && staffHygSection !== 'history' && staffHygFloor && (() => {
                  const section = staffHygSection;
                  const floorKey = staffHygFloor;
                  const floorLabel = { kat2: 'Kat 2', kat3: 'Kat 3', kat4: 'Kat 4' }[floorKey];
                  const floorColor = { kat2: '#0ea5e9', kat3: '#8b5cf6', kat4: '#10b981' }[floorKey];
                  const floorAreas = appData?.hygiene_floors?.[section]?.[floorKey]?.areas || {};
                  const selectedArea = staffHygAreaId ? floorAreas[staffHygAreaId] : null;

                  return (
                      <div className="fade-in">
                          <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>🏢 {floorLabel} — {section === 'rutin' ? '🛏️ Rutin' : '🧹 Temizlik'}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: '3px' }}>Denetim yapacağın alana tıkla</div>
                          </div>

                          {Object.keys(floorAreas).length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                  <div style={{ fontSize: '44px', marginBottom: '12px' }}>🏗️</div>
                                  <div style={{ fontWeight: 900, fontSize: '16px', color: '#64748b' }}>Bu kat için henüz alan tanımlanmadı.</div>
                              </div>
                          ) : !staffHygAreaId ? (
                              <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
                                  {Object.entries(floorAreas).map(([areaId, area]) => {
                                      const ti = STAFF_FLOOR_AREA_TYPES[area.type] || STAFF_FLOOR_AREA_TYPES.genel;
                                      const lastScore = lastScoreForArea(area.name);
                                      const done = allLogs.some(l => l.areaName === area.name && l.section === section && l.floor === floorKey && l.timestamp >= todayStart);
                                      return (
                                          <div key={areaId} onClick={done ? undefined : () => { setStaffHygAreaId(areaId); setStaffHygScore(5); }}
                                              style={{ background: done ? '#f8fafc' : 'white', border: `1px solid ${done ? '#e2e8f0' : ti.color + '20'}`, borderRadius: '16px', overflow: 'hidden', cursor: done ? 'default' : 'pointer', boxShadow: '0 2px 12px rgba(15,23,42,0.05)', transition: 'all 0.2s', opacity: done ? 0.55 : 1, pointerEvents: done ? 'none' : 'auto' }}>
                                              <div style={{ height: '4px', background: done ? '#e2e8f0' : `linear-gradient(90deg,${ti.color},${ti.color}66)` }} />
                                              <div style={{ padding: '14px' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                      <span style={{ fontSize: '26px' }}>{ti.icon}</span>
                                                      {done ? (
                                                          <span style={{ background: '#ecfdf5', color: '#10b981', fontSize: '10px', fontWeight: 900, padding: '2px 7px', borderRadius: '8px' }}>✓ Tamam</span>
                                                      ) : lastScore && (
                                                          <span style={{ background: lastScore >= 3 ? '#ecfdf5' : '#fef2f2', color: lastScore >= 3 ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: 900, padding: '2px 7px', borderRadius: '8px' }}>
                                                              {'★'.repeat(lastScore)}
                                                          </span>
                                                      )}
                                                  </div>
                                                  <div style={{ fontWeight: 900, fontSize: '13px', color: done ? '#94a3b8' : '#0f172a', marginBottom: '3px' }}>{area.name}</div>
                                                  <div style={{ fontSize: '11px', fontWeight: 700, color: done ? '#cbd5e1' : ti.color }}>{ti.label}</div>
                                                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '6px' }}>👥 {(area.responsibles || []).length} sorumlu</div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          ) : selectedArea && (() => {
                              const ti = STAFF_FLOOR_AREA_TYPES[selectedArea.type] || STAFF_FLOOR_AREA_TYPES.genel;
                              const responsibles = selectedArea.responsibles || [];
                              const scoreLabels = { 1: 'Çok Kötü', 2: 'Kötü', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' };
                              return (
                                  <div className="fade-in">
                                      <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' }}>
                                          <div style={{ height: '5px', background: `linear-gradient(90deg,${ti.color},${ti.color}66)` }} />
                                          <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{ti.icon}</div>
                                              <div>
                                                  <div style={{ fontWeight: 900, fontSize: '17px', color: '#0f172a' }}>{selectedArea.name}</div>
                                                  <div style={{ fontSize: '12px', fontWeight: 700, color: ti.color, marginTop: '2px' }}>{ti.label}</div>
                                              </div>
                                          </div>
                                      </div>
                                      {responsibles.length > 0 && (
                                          <div style={{ background: 'white', borderRadius: '16px', padding: '14px 18px', marginBottom: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>👥 Sorumlu Öğrenciler</div>
                                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                                  {responsibles.map(r => <span key={r} style={{ background: ti.color + '15', color: ti.color, padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, border: `1px solid ${ti.color}30` }}>{r}</span>)}
                                              </div>
                                          </div>
                                      )}
                                      <div style={{ background: 'white', borderRadius: '20px', padding: '22px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
                                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', marginBottom: '16px' }}>Denetim Puanı</div>
                                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                              {[1,2,3,4,5].map(star => (
                                                  <button key={star} onClick={() => setStaffHygScore(star)}
                                                      style={{ flex: 1, padding: '14px 0', fontSize: '22px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: staffHygScore >= star ? ti.color : '#f8fafc', color: staffHygScore >= star ? '#fff' : '#cbd5e1', transition: 'all 0.18s', boxShadow: staffHygScore >= star ? `0 6px 14px ${ti.color}40` : 'none' }}>★</button>
                                              ))}
                                          </div>
                                          <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 900, color: ti.color, marginBottom: '16px' }}>
                                              {scoreLabels[staffHygScore]} — {getCoinImpact(staffHygScore) >= 0 ? '+' : ''}{getCoinImpact(staffHygScore)} M-Coin × {responsibles.length} kişi
                                          </div>
                                          <button onClick={() => saveStaffFloorInspection(section, floorKey, staffHygAreaId)} disabled={isHygieneSaving}
                                              className="premium-btn badge-glow" style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${ti.color}cc,${ti.color})`, color: 'white', fontWeight: 900, fontSize: '15px', border: 'none', borderRadius: '14px', boxShadow: `0 8px 20px ${ti.color}40` }}>
                                              {isHygieneSaving ? '⏳ İşleniyor...' : '✅ DENETİMİ KAYDET'}
                                          </button>
                                      </div>
                                  </div>
                              );
                          })()}
                      </div>
                  );
              })()}

              {/* GEÇMİŞ */}
              {staffHygSection === 'history' && (
                  <div className="fade-in" style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '18px' }}>📜 Son Denetim Kayıtları</div>
                      <div className="clean-scroll" style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {allLogs.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 700 }}>Kayıt bulunmuyor.</div>
                          ) : (
                              allLogs.sort((a,b) => b.timestamp - a.timestamp).slice(0, 50).map((log, i) => (
                                  <div key={i} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {log.type === 'wc' ? '🚽' : log.type === 'etut' ? '📚' : log.type === 'yatakhane' ? '🛏️' : '🧹'} {log.areaName}
                                              {log.floor && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginLeft: '6px' }}>{log.floor === 'kat2' ? 'K2' : log.floor === 'kat3' ? 'K3' : 'K4'}</span>}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{new Date(log.timestamp).toLocaleString('tr-TR')}</div>
                                      </div>
                                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                          <div style={{ fontWeight: 900, color: log.coinImpact >= 0 ? '#10b981' : '#ef4444', fontSize: '16px', background: log.coinImpact >= 0 ? '#ecfdf5' : '#fef2f2', padding: '3px 10px', borderRadius: '10px', display: 'inline-block' }}>
                                              {log.coinImpact >= 0 ? '+' : ''}{log.coinImpact} M
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '3px' }}>{'★'.repeat(log.score)}</div>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}
          </div>
          );
      })()}

      {/* --- AÇILIR PENCERELER (MODALLAR) --- */}


      {/* --- İSTİRAHAT KONTROL (PERSONEL) --- */}
      {currentModule === 'istirahat' && (() => {
        const allLogs = Object.values(appData?.istirahat_logs || {});
        const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
        const scoreLabels = { 1: 'Çok Kötü', 2: 'Kötü', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' };
        const scoreColors = { 1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#10b981', 5: '#059669' };
        const rooms = (() => {
          const r = {};
          for (let i = 1; i <= 6; i++) {
            const key = `ist_room_${i}`;
            r[key] = appData?.istirahat_rooms?.[key] || { name: `Yatakhane ${i}`, responsibles: [] };
          }
          return r;
        })();
        const lastRatingForRoom = (roomKey) => {
          const logs = allLogs.filter(l => l.roomKey === roomKey).sort((a,b) => b.timestamp - a.timestamp);
          return logs.length ? logs[0] : null;
        };
        return (
          <div className="fade-in" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {staffIstirahatSelectedRoom || staffIstirahatView ? (
              <div style={{ marginBottom: '20px' }}>
                <button onClick={() => { setStaffIstirahatSelectedRoom(null); setStaffIstirahatView(null); setStaffIstirahatScore(5); setStaffIstirahatNote(''); }}
                  style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>← Geri</button>
              </div>
            ) : null}
            {!staffIstirahatSelectedRoom && !staffIstirahatView && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>🛌 İstirahat Kontrol Raporu</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>Kontrol edilecek yatakhaneyi seçin</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setStaffIstirahatView('history')}
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 18px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>📜 Geçmiş</button>
                    <button onClick={staffIstirahatEditMode ? saveStaffIstirahatRooms : openStaffIstirahatEditMode}
                      className="premium-btn" style={{ background: staffIstirahatEditMode ? '#10b981' : '#f1f5f9', color: staffIstirahatEditMode ? 'white' : '#8b5cf6', padding: '10px 18px', fontSize: '13px' }}>
                      {staffIstirahatEditMode ? '💾 Kaydet' : '🛠️ Düzenle'}
                    </button>
                    {staffIstirahatEditMode && (
                      <button onClick={() => setStaffIstirahatEditMode(false)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '10px 16px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>İptal</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {Object.entries(rooms).map(([roomKey, room]) => {
                    const last = lastRatingForRoom(roomKey);
                    const doneToday = allLogs.some(l => l.roomKey === roomKey && l.timestamp >= todayStart);
                    const responsibles = room.responsibles || [];
                    if (staffIstirahatEditMode) {
                      return (
                        <div key={roomKey} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px' }}>
                          <input value={room.name} onChange={e => setTempStaffIstirahatRooms({...tempStaffIstirahatRooms, [roomKey]: {...tempStaffIstirahatRooms[roomKey], name: e.target.value}})}
                            className="elite-input" style={{ marginBottom: '14px', fontWeight: 900, color: '#8b5cf6', width: '100%', boxSizing: 'border-box' }} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {Array.from({ length: 8 }, (_, i) => i).map(slot => (
                              <select key={slot} value={(tempStaffIstirahatRooms[roomKey]?.responsibles || [])[slot] || ''}
                                onChange={e => {
                                  const arr = [...(tempStaffIstirahatRooms[roomKey]?.responsibles || [])];
                                  arr[slot] = e.target.value;
                                  setTempStaffIstirahatRooms({...tempStaffIstirahatRooms, [roomKey]: {...tempStaffIstirahatRooms[roomKey], responsibles: arr.filter(Boolean)}});
                                }}
                                className="elite-input" style={{ padding: '8px', fontSize: '12px', borderRadius: '10px' }}>
                                <option value="">-- Seç --</option>
                                {roster.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={roomKey} onClick={doneToday ? undefined : () => { setStaffIstirahatSelectedRoom(roomKey); setStaffIstirahatScore(5); setStaffIstirahatNote(''); }}
                        className={doneToday ? '' : 'card-hover'}
                        style={{ background: doneToday ? '#f8fafc' : 'white', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '20px', cursor: doneToday ? 'default' : 'pointer', opacity: doneToday ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ fontSize: '32px' }}>🛌</div>
                          {doneToday && <span style={{ background: '#ecfdf5', color: '#10b981', fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '10px' }}>✓ Kontrol Edildi</span>}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '17px', color: doneToday ? '#94a3b8' : '#0f172a', marginBottom: '8px' }}>{room.name}</div>
                        {responsibles.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                            {responsibles.map(r => <span key={r} style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '8px' }}>{r}</span>)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700, marginBottom: '10px' }}>Öğrenci atanmadı</div>
                        )}
                        {last && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#fbbf24', letterSpacing: '2px' }}>{'★'.repeat(last.score)}{'☆'.repeat(5-last.score)}</span>
                            <span>{new Date(last.timestamp).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {staffIstirahatSelectedRoom && !staffIstirahatView && (() => {
              const room = rooms[staffIstirahatSelectedRoom];
              const responsibles = room?.responsibles || [];
              return (
                <div className="fade-in">
                  <div style={{ background: 'white', borderRadius: '32px', padding: '28px', boxShadow: '0 10px 40px rgba(15,23,42,0.04)', border: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', background: '#f0fdf4', borderRadius: '20px', padding: '18px 22px', border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '36px' }}>🛌</span>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a' }}>{room?.name}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{responsibles.length} Öğrenci</div>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '18px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a', marginBottom: '12px' }}>👥 Odadaki Öğrenciler</div>
                      {responsibles.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>Bu odada kayıtlı öğrenci yok.</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {responsibles.map(r => <span key={r} style={{ background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800 }}>{r}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', fontWeight: 900, color: '#0f172a', fontSize: '16px', marginBottom: '20px' }}>İSTİRAHAT KONTROL PUANI</div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => setStaffIstirahatScore(star)}
                            style={{ flex: 1, maxWidth: '72px', padding: '16px 0', fontSize: '28px', borderRadius: '18px', border: 'none', cursor: 'pointer', background: staffIstirahatScore >= star ? scoreColors[star] : '#ffffff', color: staffIstirahatScore >= star ? '#fff' : '#cbd5e1', transition: 'all 0.2s', boxShadow: staffIstirahatScore >= star ? `0 8px 16px ${scoreColors[star]}50` : '0 2px 6px rgba(0,0,0,0.06)' }}>★</button>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 900, color: scoreColors[staffIstirahatScore] }}>
                        {scoreLabels[staffIstirahatScore]} — {responsibles.length} öğrenciye {getCoinImpact(staffIstirahatScore, 'istirahat') >= 0 ? '+' : ''}{getCoinImpact(staffIstirahatScore, 'istirahat')} M-Coin
                      </div>
                    </div>
                    <textarea value={staffIstirahatNote} onChange={e => setStaffIstirahatNote(e.target.value)}
                      placeholder="Not ekle (opsiyonel)..." className="elite-input"
                      style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', marginBottom: '16px', fontSize: '14px' }} />
                    <button onClick={() => saveStaffIstirahatInspection(staffIstirahatSelectedRoom)} disabled={isStaffIstirahatSaving}
                      className="premium-btn badge-glow" style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #10b981cc, #10b981)', color: 'white', fontWeight: 900, fontSize: '17px', border: 'none', boxShadow: '0 12px 24px rgba(16,185,129,0.35)' }}>
                      {isStaffIstirahatSaving ? '⏳ İşleniyor...' : '✅ KONTROLÜ KAYDET'}
                    </button>
                  </div>
                </div>
              );
            })()}
            {staffIstirahatView === 'history' && (
              <div className="fade-in" style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(15,23,42,0.04)', border: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '22px' }}>📜 İstirahat Kontrol Geçmişi</h3>
                  <button onClick={() => { if(window.confirm('Tüm geçmişi silmek istediğine emin misin?')) db.ref('mavikent_premium/istirahat_logs').set(null); }}
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>Geçmişi Temizle</button>
                </div>
                <div className="clean-scroll" style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px' }}>
                  {allLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 700 }}>Henüz kayıt bulunmuyor.</div>
                  ) : (
                    allLogs.sort((a,b) => b.timestamp - a.timestamp).slice(0,60).map((log, i) => (
                      <div key={i} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a', marginBottom: '3px' }}>🛌 {log.roomName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{new Date(log.timestamp).toLocaleString('tr-TR')} • {log.inspector}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 900, color: (log.coinImpact||0) >= 0 ? '#10b981' : '#ef4444', fontSize: '16px', background: (log.coinImpact||0) >= 0 ? '#ecfdf5' : '#fef2f2', padding: '3px 10px', borderRadius: '10px', display: 'inline-block' }}>{(log.coinImpact||0) >= 0 ? '+' : ''}{log.coinImpact} M</div>
                          <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '3px' }}>{'★'.repeat(log.score||0)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '13px', background: '#fde047', color: '#b45309', padding: '6px 14px', borderRadius: '12px', fontWeight: 900, marginBottom: '24px', display: 'inline-block' }}>👑 ELİT LİG BONUSU</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: isElite(selectedStudent) ? '0' : '24px' }}>
              
              {currentModule === 'tutanak' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setTutanakTab('odul')} className="premium-btn" style={{ flex: 1, background: tutanakTab === 'odul' ? '#10b981' : '#f1f5f9', color: tutanakTab === 'odul' ? 'white' : '#64748b', padding: '12px' }}>🎁 Ödül Ver</button>
                        <button onClick={() => setTutanakTab('ceza')} className="premium-btn" style={{ flex: 1, background: tutanakTab === 'ceza' ? '#ef4444' : '#f1f5f9', color: tutanakTab === 'ceza' ? 'white' : '#64748b', padding: '12px' }}>⚖️ Ceza Yaz</button>
                    </div>

                    {tutanakTab === 'odul' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.keys(appData?.reward_cards || {}).length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Kayıtlı ödül yok. Yönetimden ekleyin.</div>
                            ) : (
                                Object.keys(appData?.reward_cards || {}).map(k => {
                                    const card = appData.reward_cards[k];
                                    return (
                                        <button key={k} onClick={() => applyRewardCard(selectedStudent, k)} className="premium-btn" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7 !important', color: '#065f46', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '16px' }}>{card.name}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {card.type === 'mcoin' && `+${card.amount1} M-Coin | +${card.amount2} RP`}
                                                {card.type === 'joker' && `${card.amount1}x Altın Bilet`}
                                                {card.type === 'box' && `${card.amount1}x ${card.amount2 === '1' ? 'Standart' : card.amount2 === '2' ? 'Mega' : 'Elit'} Kutu`}
                                                {card.type === 'discount' && `%${card.amount1} İndirim`}
                                                {card.type === 'bounty' && `Kralın İkramı (${card.amount1} Kişi)`}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {tutanakTab === 'ceza' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.keys(appData?.penalty_cards || {}).length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Kayıtlı ceza yok.</div>
                            ) : (
                                Object.keys(appData?.penalty_cards || {}).map(k => {
                                    const card = appData.penalty_cards[k];
                                    return (
                                        <button key={k} onClick={() => applyPenaltyCard(selectedStudent, k)} className="premium-btn" style={{ background: '#fef2f2', border: '1px solid #fca5a5 !important', color: '#7f1d1d', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '16px' }}>{card.name}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {card.mcoin > 0 && `-${card.mcoin} M-Coin `}
                                                {card.banDays > 0 && ` | ${card.banDays} Gün Ban `}
                                                {card.rp > 0 && ` | -${card.rp} RP `}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
              )}

              {currentModule === 'okul' && (
                <>
                  <button onClick={() => saveData('okul', 'p', pointsConfig.okul_dondu)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🏠 DÖNDÜ (+{pointsConfig.okul_dondu} M)</button>
                  <button onClick={() => saveData('okul', 'a', pointsConfig.okul_gelmedi)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 GELMEDİ ({pointsConfig.okul_gelmedi} M + 📉)</button>
                  <button onClick={() => saveData('okul', 'i', 0)} className="premium-btn" style={{ background: '#64748b', color: 'white', padding: '20px' }}>✉️ İZİNLİ (0 M)</button>
                </>
              )}
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', pointsConfig.yoklama_takkeli)} className="premium-btn" style={{ background: '#d4af37', color: 'white', padding: '20px' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, pointsConfig.yoklama_takkeli, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', pointsConfig.yoklama_geldi)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, pointsConfig.yoklama_geldi, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', pointsConfig.yoklama_gec)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '20px' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, pointsConfig.yoklama_gec, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', pointsConfig.yoklama_gelmedi)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>❌ GELMEDİ ({pointsConfig.yoklama_gelmedi} M, Seri Bozar)</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <><button onClick={() => saveData('telefon', 'p', pointsConfig.telefon_teslim)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>📱 TESLİM (+{getCalculatedPoints(selectedStudent, pointsConfig.telefon_teslim, 'telefon')} M)</button><button onClick={() => saveData('telefon', 'e', pointsConfig.telefon_teslim)} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '20px' }}>📵 TELEFONU YOK (+{getCalculatedPoints(selectedStudent, pointsConfig.telefon_teslim, 'telefon')} M)</button><button onClick={() => saveData('telefon', 'a', pointsConfig.telefon_vermedi)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 VERMEDİ ({pointsConfig.telefon_vermedi} M, Seri Bozar)</button></>
              )}
              {currentModule === 'yatak' && (
                <><button onClick={() => saveData('yatak', 'yatak', pointsConfig.yatak_duzenli)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🛏️ YATAK DÜZENLİ (+{getCalculatedPoints(selectedStudent, pointsConfig.yatak_duzenli, 'yatak')} M)</button><button onClick={() => saveData('yatak', 'yatak', pointsConfig.yatak_bozuk)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🕸️ YATAK BOZUK ({pointsConfig.yatak_bozuk} M, Seri Bozar)</button><button onClick={() => saveData('yatak', 'dolap', pointsConfig.dolap_duzenli)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🚪 DOLAP DÜZENLİ (+{getCalculatedPoints(selectedStudent, pointsConfig.dolap_duzenli, 'yatak')} M)</button><button onClick={() => saveData('yatak', 'dolap', pointsConfig.dolap_bozuk)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🏚️ DOLAP BOZUK ({pointsConfig.dolap_bozuk} M, Seri Bozar)</button></>
              )}
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ marginTop: '10px' }}>İPTAL</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && modalType === 'egitim' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
            <div style={{ fontSize: '14px', color: '#d4af37', fontWeight: 900, marginBottom: '30px', letterSpacing: '1px' }}>{selectedSession} EĞİTİM KOÇLUĞU</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', textAlign: 'left' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.5px' }}>📝 ÖDEV TAKİBİ</div>
                <div className="clean-scroll" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
                  {(mebLessons[selectedSession] || []).map(lesson => {
                    const isChecked = (eduData.lessons || []).includes(lesson);
                    return (
                      <div key={lesson} onClick={() => setEduData(prev => ({...prev, lessons: isChecked ? (prev.lessons || []).filter(l => l !== lesson) : [...(prev.lessons || []), lesson]}))} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: isChecked ? '#ecfdf5' : 'white', borderRadius: '20px', marginBottom: '12px', fontSize: '15px', fontWeight: 800, color: isChecked ? '#047857' : '#334155', border: `2px solid ${isChecked ? '#10b981' : '#e2e8f0'}`, cursor: 'pointer' }}>
                        <span>{lesson}</span><span>{isChecked ? '✓' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', letterSpacing: '0.5px' }}>📖 KİTAP SAYACI (10 S. = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, pages: Math.max(0, (prev.pages || 0) - 10)}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#e2e8f0', color: '#0f172a', fontSize: '28px' }}>-</button>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', width: '80px' }}>{eduData.pages || 0}</div>
                    <button onClick={() => setEduData(prev => ({...prev, pages: (prev.pages || 0) + 10}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#0f172a', color: 'white', fontSize: '28px' }}>+</button>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '30px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '20px', letterSpacing: '0.5px' }}>🧠 SORU SAYACI (10 S. = +1)</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                    <button onClick={() => setEduData(prev => ({...prev, questions: Math.max(0, (prev.questions || 0) - 10)}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#e2e8f0', color: '#0f172a', fontSize: '28px' }}>-</button>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', width: '80px' }}>{eduData.questions || 0}</div>
                    <button onClick={() => setEduData(prev => ({...prev, questions: (prev.questions || 0) + 10}))} className="premium-btn" style={{ width: '60px', height: '60px', background: '#0f172a', color: 'white', fontSize: '28px' }}>+</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '35px' }}>
              <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ flex: 1 }}>İPTAL</button>
              <button onClick={saveEducationData} className="premium-btn" style={{ flex: 2, padding: '20px', background: '#10b981', color: 'white', fontSize: '16px' }}>VERİLERİ KAYDET</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (modalType === 'deneme' || modalType === 'yazili') && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>
              
              <button onClick={() => {
                  if(window.confirm(`${selectedStudent} adlı öğrencinin ${modalType === 'deneme' ? 'Deneme' : 'Yazılı'} geçmişi tamamen silinecek. Onaylıyor musun?`)) {
                      db.ref(`mavikent_premium/exams/${selectedStudent}/${modalType}`).set(null);
                      setExamData({});
                      toast('Geçmiş başarıyla temizlendi!');
                  }
              }} style={{ position: 'absolute', top: '20px', right: '20px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>🗑️ Geçmişi Sil</button>

              <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
              <div style={{ fontSize: '14px', color: '#0d9488', fontWeight: 900, marginBottom: '30px', letterSpacing: '1px' }}>{modalType === 'deneme' ? 'DETAYLI DENEME SINAVI (OPTİK)' : 'YAZILI GİRİŞİ'}</div>
              
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                  {examSubjects.map((sub, idx) => {
                      const currentD = parseFloat(examData[`d_${idx}`]) || 0;
                      const currentY = parseFloat(examData[`y_${idx}`]) || 0;
                      const currentNet = (currentD - (currentY / 3)).toFixed(2);
                      
                      return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: idx !== examSubjects.length-1 ? '16px' : '0' }}>
                          <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', width: '100px', textAlign: 'left' }}>{sub}</span>
                          {modalType === 'deneme' ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input type="number" placeholder="D" value={examData[`d_${idx}`] || ''} onChange={e => setExamData({...examData, [`d_${idx}`]: e.target.value})} className="elite-input" style={{ width: '50px', padding: '10px 0', textAlign: 'center', fontSize: '14px', border: '1px solid #10b981 !important', color: '#047857', background: '#ecfdf5' }} title="Doğru Sayısı" />
                                  <input type="number" placeholder="Y" value={examData[`y_${idx}`] || ''} onChange={e => setExamData({...examData, [`y_${idx}`]: e.target.value})} className="elite-input" style={{ width: '50px', padding: '10px 0', textAlign: 'center', fontSize: '14px', border: '1px solid #ef4444 !important', color: '#b91c1c', background: '#fef2f2' }} title="Yanlış Sayısı" />
                                  <input type="number" placeholder="B" value={examData[`b_${idx}`] || ''} onChange={e => setExamData({...examData, [`b_${idx}`]: e.target.value})} className="elite-input" style={{ width: '50px', padding: '10px 0', textAlign: 'center', fontSize: '14px', border: '1px solid #94a3b8 !important', color: '#475569', background: '#f8fafc' }} title="Boş Sayısı" />
                                  
                                  <div style={{ width: '65px', padding: '10px 0', background: '#0f172a', color: 'white', borderRadius: '12px', fontWeight: 900, fontSize: '14px', textAlign: 'center' }} title="Ders Neti">
                                      {currentNet}
                                  </div>
                              </div>
                          ) : (
                              <input type="number" placeholder="Not" value={examData[`p_${idx}`] || ''} onChange={e => setExamData({...examData, [`p_${idx}`]: e.target.value})} className="elite-input" style={{ width: '90px', padding: '12px 0', textAlign: 'center', fontSize: '16px' }} />
                          )}
                      </div>
                  )})}
              </div>

              {modalType === 'deneme' && (
                  <div style={{ background: '#f0fdfa', border: '2px dashed #0d9488', padding: '15px', borderRadius: '16px', marginBottom: '20px', color: '#0f766e', fontWeight: 900, fontSize: '20px' }}>
                      TOPLAM NET: {
                          examSubjects.reduce((total, _, i) => {
                              const d = parseFloat(examData[`d_${i}`]) || 0;
                              const y = parseFloat(examData[`y_${i}`]) || 0;
                              return total + (d - (y / 3));
                          }, 0).toFixed(2)
                      }
                  </div>
              )}

              <div style={{ textAlign: 'left', fontWeight: '900', fontSize: '14px', color: '#64748b', marginBottom: '10px', paddingLeft: '8px' }}>HEDEF {modalType === 'deneme' ? 'NET' : 'ORTALAMA'}:</div>
              <input type="number" value={examData.target || ''} onChange={e => setExamData({...examData, target: e.target.value})} placeholder="Örn: 85" className="elite-input" style={{ width: '100%', padding: '20px', fontSize: '20px', textAlign: 'center', marginBottom: '35px' }} />

              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => { setSelectedStudent(null); setModalType(null); }} className="btn-iptal" style={{ flex: 1 }}>İPTAL</button>
                <button onClick={() => saveExamData(modalType)} className="premium-btn" style={{ flex: 2, padding: '20px', background: '#0d9488', color: 'white', fontSize: '16px' }}>KAYDET</button>
              </div>
          </div>
        </div>
      )}
      
      {currentModule === 'akademi' && (
        <div className="fade-in">
          <QuizAdmin appData={appData} />
        </div>
      )}

      </div>
    </div>
  );
};

export default StaffScreen;