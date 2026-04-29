import React, { useState, useRef } from 'react';
import { db } from '../firebase';

const StaffScreen = ({ appData, goBackToRoles }) => {
  const [dashboardView, setDashboardView] = useState('main'); 
  const [currentModule, setCurrentModule] = useState(null); 
  
  const [hygieneTab, setHygieneTab] = useState('wc'); 
  const [hygieneForm, setHygieneForm] = useState({ areaId: '', score: 5, note: '' });
  const [generalCleaningList, setGeneralCleaningList] = useState({}); 
  const [isHygieneSaving, setIsHygieneSaving] = useState(false);

  const getCoinImpact = (score) => {
      if (score === 5) return 30;
      if (score === 4) return 20;
      if (score === 3) return 10;
      if (score === 2) return -30;
      if (score === 1) return -60;
      return 0;
  };

  const saveInspection = async () => {
      if(!hygieneForm.areaId) return alert("Lütfen bir alan seçin!");
      setIsHygieneSaving(true);
      
      const area = appData.hygiene_areas?.[hygieneForm.areaId];
      const responsibles = area?.responsibles || [];
      const coinImpact = getCoinImpact(hygieneForm.score);

      const updates = {};
      const logId = `hyg_${Date.now()}`;
      
      updates[`hygiene_logs/${logId}`] = {
          ...hygieneForm,
          areaName: area?.name || 'Bilinmeyen Alan',
          responsibles: responsibles,
          timestamp: Date.now(),
          inspector: "Personel",
          coinImpact,
          type: 'wc'
      };

      responsibles.forEach(studentId => {
          updates[`wallet/${studentId}`] = (Number(appData?.wallet?.[studentId]) || 0) + coinImpact;
          updates[`transactions/${studentId}/txn_hyg_${Date.now()}_${Math.floor(Math.random()*1000)}`] = { 
              desc: `${area?.name || 'Alan'} WC Denetimi (Personel)`, 
              amt: coinImpact, 
              date: new Date().toLocaleString('tr-TR') 
          };
      });

      try {
          await db.ref('mavikent_premium').update(updates);
          alert(`✅ Denetim kaydedildi! ${coinImpact > 0 ? '+' : ''}${coinImpact} M-Coin yansıtıldı.`);
          setHygieneForm({ areaId: '', score: 5, note: '' });
      } catch (e) { console.error(e); alert("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
  };

  const [selectedSession, setSelectedSession] = useState(''); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null); 

  const [eduData, setEduData] = useState({ lessons: [], pages: 0, questions: 0 });
  const [examData, setExamData] = useState({}); 
  const [valuesTopic, setValuesTopic] = useState({ subject: '', topic: '' });

  // KANTİN STATELERİ
  const [canteenView, setCanteenView] = useState('satis');
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [canteenStudent, setCanteenStudent] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [newProduct, setNewProduct] = useState({ barcode: '', name: '', price: '', stock: '' });

  // OYUN ODASI KONTROL İÇİN YENİ EKLENEN STATELER
  const [evalForm, setEvalForm] = useState({ 
      bookingId: '', student: '', device: '', day: '', slot: '', time: '', 
      attended: true, 
      q1: true, q2: true, q3: true, q4: true, q5: false, photoUrl: '' 
  });
  const csvDenemeRef = useRef(null);
  const csvYaziliRef = useRef(null);

  const classList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"];
  const eduClassList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "ELİT", "STANDART"];
  const levelList = ["SEVİYE 1/A", "SEVİYE 1/B", "SEVİYE 2"];
  const examSubjects = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din Kültürü"];
  
  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});
  const isElite = (name) => appData?.student_tiers?.[name] === 'elite';

  const mebLessons = { 
      "5. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], 
      "6. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], 
      "7. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], 
      "8. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], 
      "ELİT": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"], 
      "STANDART": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"] 
  };
  const valuesSubjectsList = ["K.Kerim", "İlmihal", "Siyer-i Nebi", "Adabı Muaşeret", "Tecvid"];

  // OYUN ODASI SABİTLERİ
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const GAME_DEVICES = [{ id: 'ps4', name: 'PS4' }, { id: 'ps5', name: 'PS5' }, { id: 'vr', name: 'VR' }, { id: 'pc', name: 'Bilgisayar' }];
  const GAME_SLOTS = {
      'ps4': [{ id: 'ps4_1', time: '15:45 - 16:15' }, { id: 'ps4_2', time: '16:15 - 16:45' }, { id: 'ps4_3', time: '21:00 - 21:30' }, { id: 'ps4_4', time: '21:30 - 22:15' }],
      'ps5': [{ id: 'ps5_1', time: '21:00 - 21:30' }, { id: 'ps5_2', time: '21:30 - 22:15' }],
      'vr':  [{ id: 'vr_1', time: '21:00 - 21:30' }, { id: 'vr_2', time: '21:30 - 22:15' }],
      'pc':  [{ id: 'pc_1', time: '21:00 - 21:30' }, { id: 'pc_2', time: '21:30 - 22:15' }]
  };

  const now = new Date();
  const liveDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todayStrTR = DAYS[liveDayIdx] || 'Pazartesi';

  // BUGÜNÜN RANDEVULARINI ÇEKME MANTIĞI
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
      if(!evalForm.student) return alert("Değerlendirilecek randevuyu seçin!");
      
      if(evalForm.attended) {
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
              
              let refundAmt = 0;
              if (evalForm.device === 'ps5') refundAmt = 30;
              else if (evalForm.device === 'ps4') refundAmt = 20;
              else if (evalForm.device === 'vr') refundAmt = 40;
              else if (evalForm.device === 'pc') refundAmt = 30;

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
              alert(evalForm.attended ? "✅ Denetim raporu kaydedildi!" : "🔄 Randevu iptal edildi ve M-Coin iadesi yapıldı.");
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
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); return; } 
    if (dashboardView !== 'main') { 
        if (dashboardView.startsWith('egitim_')) setDashboardView('egitim'); 
        else setDashboardView('main'); 
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
    const finalPts = getCalculatedPoints(selectedStudent, basePts, type);
    const updates = {};
    const isFail = status === 'a' || status === 'l' || (type === 'yatak' && basePts === 0) || (type === 'telefon' && status === 'a');
    
    if (isFail) {
        const streakData = appData?.active_cards?.[selectedStudent]?.streak;
        const hasStreakSaver = streakData && (streakData.date === new Date().toDateString() || (streakData.end && streakData.end > Date.now()));
        if (hasStreakSaver) { 
            alert(`🛡️ ${selectedStudent} SERİ KORUMA KALKANI kullandı! Eksi aldı ama serisi bozulmadı.`); 
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
        let descText = type === 'kanaat' ? 'Personel Kanaat Notu' : (type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : 'Yatak/Dolap Düzeni'));
        updates[`transactions/${selectedStudent}/${tId}`] = { desc: descText, amt: finalPts, date: new Date().toLocaleString('tr-TR') };
    }
    
    if (type === 'yoklama') updates[`yoklama_d/${selectedStudent}/sessions/${selectedSession}`] = { st: status, pts: finalPts };
    else if (type === 'telefon') updates[`telefon_d/${selectedStudent}/sessions/gunluk`] = { st: status, pts: finalPts };
    else if (type === 'kanaat') updates[`kanaat_w/${selectedStudent}`] = (Number(appData?.kanaat_w?.[selectedStudent]) || 0) + finalPts;
    else if (type === 'yatak') updates[`yatak_d/${selectedStudent}/${status}_pts`] = finalPts; 
    
    db.ref('mavikent_premium').update(updates); 
    setSelectedStudent(null); 
    setModalType(null);
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
    setSelectedStudent(null); setModalType(null); alert("Eğitim Verileri Güncellendi!");
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
    setSelectedStudent(null); setModalType(null); alert(`${type.toUpperCase()} Kaydedildi!`);
  };

  const downloadCSVTemplate = (type) => {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
      if (type === 'deneme') {
          csvContent += "Ogrenci_Adi,Turkce_D,Turkce_Y,Turkce_B,Matematik_D,Matematik_Y,Matematik_B,Fen_D,Fen_Y,Fen_B,Sosyal_D,Sosyal_Y,Sosyal_B,Ingilizce_D,Ingilizce_Y,Ingilizce_B,Din_D,Din_Y,Din_B,Hedef_Net\n";
          getFilteredRoster(selectedSession).forEach(name => { csvContent += `${name},0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n`; });
      } else if (type === 'yazili') {
          csvContent += "Ogrenci_Adi,Turkce,Matematik,Fen,Sosyal,Ingilizce,Din,Hedef_Ortalama\n";
          getFilteredRoster(selectedSession).forEach(name => { csvContent += `${name},0,0,0,0,0,0,0\n`; });
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Mavikent_${selectedSession}_${type}_Sablon.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCSVUpload = (e, type) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          alert("⚠️ Lütfen Excel'de dosyanızı doldurduktan sonra 'Farklı Kaydet' diyerek 'CSV (Virgülle ayrılmış)' formatında kaydedip sisteme yükleyin.");
          e.target.value = null; return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target.result;
          const rows = text.split(/\r?\n/).map(row => row.split(/[,;]/));
          const updates = {}; let matchCount = 0;
          const normalize = (str) => String(str).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
          
          for (let i = 1; i < rows.length; i++) { 
              const cols = rows[i];
              if (cols.length < 2) continue; 
              const rawName = cols[0];
              const matchedStudent = roster.find(n => normalize(n) === normalize(rawName));
              if (matchedStudent) {
                  matchCount++;
                  if (type === 'deneme') {
                      let totalNet = 0; let subjectsData = {};
                      for (let j = 0; j < 6; j++) {
                          const d = parseFloat(cols[1 + j*3]) || 0; const y = parseFloat(cols[2 + j*3]) || 0; const b = parseFloat(cols[3 + j*3]) || 0;
                          const net = d - (y/3); totalNet += net; subjectsData[j] = { d, y, b, net };
                      }
                      updates[`exams/${matchedStudent}/deneme`] = { subjects: subjectsData, net: totalNet, target: parseFloat(cols[19]) || 0, date: new Date().toDateString() };
                  } else if (type === 'yazili') {
                      let total = 0; let count = 0; let writeData = {};
                      for (let j = 0; j < 6; j++) {
                          const val = cols[1 + j];
                          if (val !== undefined && val !== '' && !isNaN(parseFloat(val))) { total += parseFloat(val); count++; writeData[`p_${j}`] = parseFloat(val); }
                      }
                      updates[`exams/${matchedStudent}/yazili`] = { ...writeData, avg: count > 0 ? (total / count) : 0, target: parseFloat(cols[7]) || 0, date: new Date().toDateString() };
                  }
              }
          }
          if (Object.keys(updates).length > 0) { db.ref('mavikent_premium').update(updates); alert(`✅ Başarılı! ${matchCount} öğrencinin sınav verisi aktarıldı.`); } 
          else { alert('⚠️ Hata: İsimler eşleşmedi.'); }
          e.target.value = null; 
      };
      reader.readAsText(file, 'UTF-8');
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
              // iPhone'un (iOS Safari) hata vermemesi için advanced (odak) zorlamasını kaldırdık
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
              alert("Kamera başlatılamadı veya izin verilmedi.");
              setScannerActive(false);
          });
      }, 300);
  };

  const renderStudentGrid = (students, type) => (
    <div className="grid-mobile-2">
      {students.map(name => {
        let bgColor = '#ffffff'; let subText = '';
        
        if (currentModule === 'yoklama') { 
            const st = appData?.yoklama_d?.[name]?.sessions?.[selectedSession]?.st; 
            if (st === 'p' || st === 't') bgColor = '#ecfdf5'; 
            if (st === 'a') bgColor = '#fef2f2'; 
            if (st === 'l') bgColor = '#fffbeb'; 
        } 
        else if (currentModule === 'values_view') { 
            if (appData?.values_edu_d?.[name]?.[new Date().toDateString()]?.done) bgColor = '#ecfdf5'; 
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
        const has2X = (appData?.active_cards?.[name]?.multiplier?.date === new Date().toDateString()) || (appData?.settings?.global_event === '2x_xp');
        const streakData = appData?.active_cards?.[name]?.streak;
        const hasStreak = streakData && (streakData.date === new Date().toDateString() || (streakData.end && streakData.end > Date.now()));

        return (
          <div key={name} onClick={() => { 
                setSelectedStudent(name); 
                if (type === 'isleyis') setModalType('isleyis');
                else if (type === 'egitim_ders') { setEduData({ lessons: appData?.education_d?.[name]?.lessons || [], pages: appData?.education_d?.[name]?.pages || 0, questions: appData?.education_d?.[name]?.questions || 0 }); setModalType('egitim'); }
                else if (type === 'egitim_deneme') { setExamData(appData?.exams?.[name]?.deneme || {}); setModalType('deneme'); }
                else if (type === 'egitim_yazili') { setExamData(appData?.exams?.[name]?.yazili || {}); setModalType('yazili'); }
             }} 
               className="card-hover" style={{ background: bgColor, border: isEliteStud ? '2px solid #d4af37' : 'none', padding: '24px 16px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#0f172a', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {isEliteStud && <span style={{ fontSize: '18px' }} title="Elit Lig">👑</span>}
                {has2X && <span style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>⚡ 2X AKTİF</span>}
                {hasStreak && <span style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>🛡️ KORUMA</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>{name}</div>
            {subText && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>{subText}</div>}
          </div>
        );
      })}
    </div>
  );

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
              { id: 'hygiene', icon: '✨', label: 'HİJYEN DENETİM', bg: '#f0f9ff' }
            ].map(mod => (
              <div key={mod.id} onClick={() => {
                  if (mod.id === 'staff_gameroom') setCurrentModule('staff_gameroom');
                  else if (mod.id === 'kantin') setCurrentModule('kantin');
                  else if (mod.id === 'hygiene') setCurrentModule('hygiene');
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
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><button onClick={() => { if(window.confirm('Tüm sınıfların YAZILI notları sıfırlanacak. Emin misiniz?')) { const updates = {}; roster.forEach(n => updates[`exams/${n}/yazili`] = null); db.ref('mavikent_premium').update(updates); alert('Yazılı notları sıfırlandı!'); } }} className="premium-btn" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '18px', fontSize: '15px' }}>🔄 HAFTALIK YAZILI PERFORMANSLARINI SIFIRLA</button></div>
              </>
            )}

            {dashboardView === 'degerler' && levelList.map(lvl => (<div key={lvl} onClick={() => { setCurrentModule('values_view'); setSelectedSession(lvl); }} className="premium-card card-hover"><div className="icon">🕌</div><div className="label">{lvl}</div></div>))}
            
            {dashboardView === 'isleyis' && [ 
              { id: 'yoklama', icon: '📋', label: 'Yoklama' }, 
              { id: 'telefon', icon: '📱', label: 'Telefon' }, 
              { id: 'yatak', icon: '🛏️', label: 'Yatak / Dolap' }, 
              { id: 'kanaat', icon: '✍️', label: 'Kanaat Notu' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
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
                            alert(`Oyun Odası Sorumlusu başarıyla atandı! (${e.target.value})`);
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
                                if(!evalForm.student) return alert("Değerlendirilecek randevuyu seçin!");
                                
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
                                        
                                        let refundAmt = 0;
                                        if (evalForm.device === 'ps5') refundAmt = 30;
                                        else if (evalForm.device === 'ps4') refundAmt = 20;
                                        else if (evalForm.device === 'vr') refundAmt = 40;
                                        else if (evalForm.device === 'pc') refundAmt = 30;

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
                                        alert(evalForm.attended !== false ? "✅ Denetim raporu başarıyla kaydedildi!" : "🔄 Randevu iptal edildi ve M-Coin iadesi yapıldı.");
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
                                    else { alert("Sistemde bu barkoda ait ürün yok! Önce 'Ürün Ekle' kısmından kaydedin."); }
                                }} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '0 25px' }}>EKLE</button>
                                <button onClick={() => startBarcodeScanner((code) => {
                                    const prod = appData?.canteen_products?.[code];
                                    if(prod) { setCart(prev => [...prev, { id: code, name: prod.name, price: Number(prod.price) }]); } 
                                    else { alert(`Bilinmeyen Barkod: ${code}\nLütfen önce 'Ürün Ekle' menüsünden bu ürünü kaydedin.`); }
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
                                                db.ref('mavikent_premium').update(updates).then(() => { alert('✅ Satış Başarılı! Nakit kasaya eklendi.'); setCart([]); });
                                            }
                                        }} className="card-hover" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white', padding: '25px', borderRadius: '24px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}>
                                            <div style={{ fontSize: '45px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>💵</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>NAKİT ALINDI</div>
                                            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '5px', fontWeight: 600 }}>Tutar Kasaya İşlenir</div>
                                        </div>

                                        {/* HESAPTAN DÜŞ BLOĞU */}
                                        <div onClick={() => {
                                            if(!canteenStudent) return alert('Lütfen yukarıdaki menüden hesabı düşülecek öğrenciyi seçin!');
                                            const total = cart.reduce((a,b)=>a+b.price, 0); const currBalance = Number(appData?.canteen_wallet?.[canteenStudent]) || 0;
                                            if(currBalance < total) { if(!window.confirm(`⚠️ DİKKAT: ${canteenStudent} adlı öğrencinin bakiyesi YETERSİZ (${currBalance} ₺). Yine de hesabı eksiye düşürülsün mü?`)) return; }
                                            const updates = {};
                                            updates[`canteen_wallet/${canteenStudent}`] = currBalance - total; 
                                            updates[`canteen_logs/txn_${Date.now()}`] = { type: 'account_sale', amount: total, student: canteenStudent, items: cart.map(c=>c.name).join(', '), date: new Date().toLocaleString('tr-TR'), timestamp: Date.now() };
                                            cart.forEach(item => { const cStock = appData?.canteen_products?.[item.id]?.stock || 0; updates[`canteen_products/${item.id}/stock`] = Math.max(0, cStock - 1); });
                                            db.ref('mavikent_premium').update(updates).then(() => { alert(`✅ Satış Başarılı! Yeni bakiye: ${currBalance - total} ₺`); setCart([]); setCanteenStudent(''); });
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
                            if(!newProduct.barcode || !newProduct.name || !newProduct.price || !newProduct.stock) return alert("Lütfen tüm alanları doldurun!");
                            const updates = {};
                            updates[`canteen_products/${newProduct.barcode}`] = { name: newProduct.name, price: Number(newProduct.price), stock: Number(newProduct.stock) };
                            db.ref('mavikent_premium').update(updates).then(() => {
                                alert("✅ Ürün Başarıyla Kaydedildi!");
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
                            if(!canteenStudent || !depositAmount || isNaN(depositAmount) || depositAmount <= 0) return alert('Geçerli bir öğrenci ve tutar girin!');
                            const amt = Number(depositAmount);
                            if(window.confirm(`${canteenStudent} adlı öğrenciye ${amt} ₺ bakiye yüklenecek. Onaylıyor musunuz?`)) {
                                const currBalance = Number(appData?.canteen_wallet?.[canteenStudent]) || 0; const updates = {};
                                updates[`canteen_wallet/${canteenStudent}`] = currBalance + amt; updates[`canteen_logs/txn_${Date.now()}`] = { type: 'deposit', amount: amt, student: canteenStudent, date: new Date().toLocaleString('tr-TR'), timestamp: Date.now() };
                                db.ref('mavikent_premium').update(updates).then(() => { alert(`Bakiye Yüklendi! Yeni Bakiye: ${currBalance + amt} ₺`); setDepositAmount(''); setCanteenStudent(''); });
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
        
        {((currentModule === 'yoklama' && selectedSession) || ['telefon', 'yatak', 'kanaat'].includes(currentModule)) && renderStudentGrid(roster, 'isleyis')}
        
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
                <button onClick={() => { db.ref(`mavikent_premium/values_log/${selectedSession}/${new Date().toDateString()}`).set(valuesTopic); alert("Konu Kaydedildi"); }} className="premium-btn" style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white', fontSize: '15px' }}>DERSİ YAYINLA</button>
            </div>
            {renderStudentGrid(roster.filter(n => appData?.student_levels?.[n] === selectedSession), 'degerler')}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button id="btn-jpg-degerler" onClick={() => downloadReportAsJPG('degerler', selectedSession)} className="premium-btn" style={{ flex: 1, padding: '18px', background: '#d4af37', color: 'white', fontSize: '16px', minWidth: '200px' }}>📸 VELİ BİLGİLENDİRME (JPG İNDİR)</button>
            </div>
          </>
        )}

      </div> 
{/* --- HİJYEN DENETİM MERKEZİ --- */}
        {currentModule === 'hygiene' && (
          <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
            {/* ÜST SEKME MENÜSÜ */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <button onClick={() => setHygieneTab('wc')} style={{ flex: 1, padding: '14px', borderRadius: '20px', border: 'none', background: hygieneTab === 'wc' ? '#0ea5e9' : 'transparent', color: hygieneTab === 'wc' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>🚽 WC Paneli</button>
                <button onClick={() => setHygieneTab('general')} style={{ flex: 1, padding: '14px', borderRadius: '20px', border: 'none', background: hygieneTab === 'general' ? '#10b981' : 'transparent', color: hygieneTab === 'general' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>🧹 Temizlik Kontrol</button>
                <button onClick={() => setHygieneTab('history')} style={{ flex: 1, padding: '14px', borderRadius: '20px', border: 'none', background: hygieneTab === 'history' ? '#f59e0b' : 'transparent', color: hygieneTab === 'history' ? 'white' : '#64748b', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>📜 Geçmiş</button>
                <button onClick={() => setCurrentModule(null)} style={{ padding: '12px 20px', borderRadius: '20px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 900, cursor: 'pointer' }}>🔙</button>
            </div>

            {/* 1. PANEL: WC DENETİM */}
            {hygieneTab === 'wc' && (
                <div className="fade-in">
                    <div style={{ background: '#ffffff', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)' }}>
                        <div style={{ marginBottom: '25px', borderBottom: '2px dashed #f1f5f9', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>🚽 WC Zimmet & Denetim</h3>
                        </div>

                        <label style={{ display: 'block', fontWeight: 900, marginBottom: '10px', color: '#64748b', fontSize: '13px' }}>TUVALET SEÇİN:</label>
                        <select 
                            value={hygieneForm.areaId} 
                            onChange={(e) => setHygieneForm({...hygieneForm, areaId: e.target.value})}
                            className="elite-input" style={{ marginBottom: '25px', width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: 700 }}
                        >
                            <option value="">-- Denetlenecek WC Seçin --</option>
                            {Object.entries(appData?.hygiene_areas || {}).filter(([k, v]) => v.type === 'wc').map(([key, area]) => (
                                <option key={key} value={key}>{area.name} ({area.responsibles?.length || 0} Kişi)</option>
                            ))}
                        </select>

                        <label style={{ display: 'block', fontWeight: 900, marginBottom: '10px', color: '#64748b', fontSize: '13px' }}>TEMİZLİK DURUMU:</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star}
                                    onClick={() => setHygieneForm({...hygieneForm, score: star})}
                                    style={{ 
                                        flex: 1, padding: '20px 0', fontSize: '28px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                        background: hygieneForm.score >= star ? '#fbbf24' : '#f8fafc',
                                        color: hygieneForm.score >= star ? '#fff' : '#cbd5e1',
                                        transition: '0.2s'
                                    }}
                                >★</button>
                            ))}
                        </div>

                        <button 
                            onClick={saveInspection} 
                            disabled={isHygieneSaving}
                            className="premium-btn" 
                            style={{ width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: '#0ea5e9', color: 'white', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}
                        >
                            {isHygieneSaving ? '⏳ İşleniyor...' : '✅ WC DENETİMİNİ KAYDET'}
                        </button>

                        {/* ANLIK ZİMMET LİSTESİ ÖNİZLEME */}
                        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            {Object.entries(appData?.hygiene_areas || {}).filter(([k, v]) => v.type === 'wc').map(([key, area]) => (
                                <div key={key} style={{ background: '#f8fafc', padding: '12px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 900, fontSize: '12px', color: '#0ea5e9', marginBottom: '5px' }}>{area.name}</div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{(area.responsibles || []).join(', ')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PANEL: TEMİZLİK KONTROL (ÖĞRENCİ LİSTESİ) */}
            {hygieneTab === 'general' && (
                <div className="fade-in">
                    <div style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)' }}>
                        <div style={{ marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>🧹 Günlük Temizlik Kontrolü</h3>
                            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '5px' }}>Tüm öğrencilerin görev alanlarını girin ve puanlayın.</p>
                        </div>

                        <div className="clean-scroll" style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '25px', paddingRight: '5px' }}>
                            {(Object.keys(appData?.students || {})).map(student => (
                                <div key={student} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', background: generalCleaningList[student]?.score ? '#f8fafc' : 'transparent', borderRadius: '15px', marginBottom: '5px' }}>
                                    <div style={{ flex: '1 1 120px', fontWeight: 900, fontSize: '14px', color: '#0f172a' }}>{student}</div>
                                    
                                    <input 
                                        placeholder="Temizlik Alanı (Örn: Mescid)" 
                                        value={generalCleaningList[student]?.area || ''}
                                        onChange={(e) => setGeneralCleaningList({...generalCleaningList, [student]: {...(generalCleaningList[student] || {}), area: e.target.value}})}
                                        className="elite-input" style={{ flex: '2 1 180px', padding: '12px 15px', fontSize: '13px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    />
                                    
                                    <div style={{ flex: '1 1 180px', display: 'flex', gap: '4px' }}>
                                        {[1,2,3,4,5].map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => setGeneralCleaningList({...generalCleaningList, [student]: {...(generalCleaningList[student] || {}), score: s}})} 
                                                style={{ 
                                                    flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                                    background: (generalCleaningList[student]?.score || 0) >= s ? '#10b981' : '#f1f5f9', 
                                                    color: (generalCleaningList[student]?.score || 0) >= s ? 'white' : '#cbd5e1', 
                                                    fontSize: '14px', transition: '0.2s'
                                                }}
                                            >★</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={async () => {
                                const entries = Object.entries(generalCleaningList).filter(([name, data]) => data.area && data.score);
                                if(entries.length === 0) return alert("En az bir öğrenci için alan ve puan girmelisiniz!");
                                if(!window.confirm(`${entries.length} öğrencinin puanı kaydedilecek. Onaylıyor musun?`)) return;
                                
                                setIsHygieneSaving(true);
                                const updates = {};
                                const now = Date.now();
                                
                                entries.forEach(([student, data]) => {
                                    const impact = getCoinImpact(data.score);
                                    const logId = `gen_${student}_${now}`;
                                    
                                    updates[`hygiene_logs/${logId}`] = { 
                                        student, areaName: data.area, score: data.score, 
                                        timestamp: now, coinImpact: impact, type: 'general', inspector: 'Personel' 
                                    };
                                    updates[`wallet/${student}`] = (Number(appData?.wallet?.[student]) || 0) + impact;
                                    updates[`transactions/${student}/txn_${logId}`] = { 
                                        desc: `${data.area} Temizlik Kontrolü`, 
                                        amt: impact, 
                                        date: new Date().toLocaleString('tr-TR') 
                                    };
                                });

                                try {
                                    await db.ref('mavikent_premium').update(updates);
                                    alert("✅ Günlük temizlik kontrolleri kaydedildi ve M-Coin'ler dağıtıldı!");
                                    setGeneralCleaningList({}); 
                                } catch (e) { alert("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
                            }} 
                            disabled={isHygieneSaving}
                            className="premium-btn" 
                            style={{ width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: '#10b981', color: 'white', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}
                        >
                            {isHygieneSaving ? '⏳ Toplu Kayıt Yapılıyor...' : '🚀 TÜMÜNÜ KAYDET VE M-COIN DAĞIT'}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. PANEL: GEÇMİŞ (LOGLAR) */}
            {hygieneTab === 'history' && (
                <div className="fade-in">
                    <div style={{ background: 'white', padding: '30px', borderRadius: '32px', boxShadow: '0 15px 40px -10px rgba(15,23,42,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900 }}>📜 Son Denetim Kayıtları</h3>
                        </div>
                        
                        <div className="clean-scroll" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {Object.values(appData?.hygiene_logs || {}).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 700 }}>Henüz kayıt bulunmuyor.</div>
                            ) : (
                                Object.values(appData.hygiene_logs).sort((a,b) => b.timestamp - a.timestamp).slice(0, 50).map((log, i) => (
                                    <div key={i} style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a' }}>{log.areaName}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '3px' }}>
                                                {log.student || log.responsibles?.join(', ')} • {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 900, color: log.coinImpact >= 0 ? '#10b981' : '#ef4444', fontSize: '15px' }}>
                                                {log.coinImpact >= 0 ? '+' : ''}{log.coinImpact} M
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '2px' }}>{'★'.repeat(log.score)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}
      {/* --- AÇILIR PENCERELER (MODALLAR) --- */}
      {selectedStudent && modalType === 'isleyis' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px' }}>{selectedStudent}</h3>
            {isElite(selectedStudent) && <div style={{ fontSize: '13px', background: '#fde047', color: '#b45309', padding: '6px 14px', borderRadius: '12px', fontWeight: 900, marginBottom: '24px', display: 'inline-block' }}>👑 ELİT LİG BONUSU</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: isElite(selectedStudent) ? '0' : '24px' }}>
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', 3)} className="premium-btn" style={{ background: '#d4af37', color: 'white', padding: '20px' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, 3, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, 2, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', 1)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '20px' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, 1, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>❌ GELMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <>
                  <button onClick={() => saveData('telefon', 'p', 2)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>📱 TESLİM (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'e', 2)} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '20px' }}>📵 TELEFONU YOK (+{getCalculatedPoints(selectedStudent, 2, 'telefon')} M)</button>
                  <button onClick={() => saveData('telefon', 'a', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 VERMEDİ (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'yatak' && (
                <>
                  <button onClick={() => saveData('yatak', 'yatak', 1)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🛏️ YATAK DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'yatak', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🕸️ YATAK BOZUK (Seri Bozar)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 1)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🚪 DOLAP DÜZENLİ (+{getCalculatedPoints(selectedStudent, 1, 'yatak')} M)</button>
                  <button onClick={() => saveData('yatak', 'dolap', 0)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🏚️ DOLAP BOZUK (Seri Bozar)</button>
                </>
              )}
              {currentModule === 'kanaat' && (
                <>
                  <input id="kanaatInput" type="number" placeholder="Puan (Örn: 10 veya -5)" className="elite-input" style={{ padding: '20px', fontSize: '20px', textAlign: 'center', marginBottom: '16px' }} />
                  <button onClick={() => saveData('kanaat', 'k', parseInt(document.getElementById('kanaatInput').value) || 0)} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '20px', width: '100%' }}>KAYDET</button>
                </>
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
                     alert('Geçmiş başarıyla temizlendi!');
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

    </div>
  );
};

export default StaffScreen;