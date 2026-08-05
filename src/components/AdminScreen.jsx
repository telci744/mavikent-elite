import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { playClick, playSuccess, playCoin, playCancel, playReward, playPenalty } from '../sounds';
import { toast } from '../toast';
import { burst } from '../confetti';
import { IMTIHAN_SORULAR } from './imtihanSorular';

const DEFAULT_GAME_DEVICES = [{ id: 'ps4', name: 'PS4', icon: '🎮' }, { id: 'ps5', name: 'PS5', icon: '🕹️' }, { id: 'vr', name: 'VR (Sanal Gerçeklik)', icon: '🥽' }, { id: 'pc', name: 'Bilgisayar', icon: '💻' }];
const DEFAULT_GAME_SLOTS = {
    'ps4': [{ id: 'ps4_3', time: '21:00 - 21:30', price: 5 }, { id: 'ps4_4', time: '21:30 - 22:15', price: 8 }],
    'ps5': [{ id: 'ps5_1', time: '21:00 - 21:30', price: 30 }, { id: 'ps5_2', time: '21:30 - 22:15', price: 45 }],
    'vr':  [{ id: 'vr_1', time: '21:00 - 21:30', price: 60 }, { id: 'vr_2', time: '21:30 - 22:15', price: 90 }],
    'pc':  [{ id: 'pc_1', time: '21:00 - 21:30', price: 30 }, { id: 'pc_2', time: '21:30 - 22:15', price: 45 }]
};

const AdminScreen = ({ appData, goBackToRoles }) => {
  const [dashboardView, setDashboardView] = useState('main'); 
  const [currentModule, setCurrentModule] = useState(null); 
  
  const [hygieneForm, setHygieneForm] = useState({ areaId: '', score: 5, note: '' });
  const [generalCleaningList, setGeneralCleaningList] = useState({}); 
  const [isHygieneSaving, setIsHygieneSaving] = useState(false);
  const [wcEditMode, setWcEditMode] = useState(false);
  const [tempWcData, setTempWcData] = useState({});
  const [roomEditMode, setRoomEditMode] = useState(false);
  const [tempRoomData, setTempRoomData] = useState({});
  const [roomForm, setRoomForm] = useState({ areaId: '', score: 5, note: '' });

  const [adminHygSection, setAdminHygSection] = useState(null);
  const [adminHygFloor, setAdminHygFloor] = useState(null);
  const [adminHygAreaId, setAdminHygAreaId] = useState(null);
  const [adminHygScore, setAdminHygScore] = useState(5);
  const [adminHygEditMode, setAdminHygEditMode] = useState(false);
  const [adminHygNewArea, setAdminHygNewArea] = useState({ name: '', type: 'genel' });
  const [hygSearchStudent, setHygSearchStudent] = useState('');

  const [istirahatSelectedRoom, setIstirahatSelectedRoom] = useState(null);
  const [istirahatScore, setIstirahatScore] = useState(5);
  const [isIstirahatSaving, setIsIstirahatSaving] = useState(false);
  const [istirahatNote, setIstirahatNote] = useState('');
  const [istirahatView, setIstirahatView] = useState(null);
  const [istirahatEditMode, setIstirahatEditMode] = useState(false);
  const [tempIstirahatRooms, setTempIstirahatRooms] = useState({});

  const [corporateIdentity, setCorporateIdentity] = useState({
    logoUrl: appData?.settings?.corporate_logo_url || '',
  });

  const [adminSettingsView, setAdminSettingsView] = useState(null);
  const [pointsModal, setPointsModal] = useState(null);
  const [pointsDraft, setPointsDraft] = useState({});
  const [studentModal, setStudentModal] = useState(null);
  const [studentEdit, setStudentEdit] = useState({});
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  const [pointsConfig, setPointsConfig] = useState({
    okul_dondu: appData?.settings?.points_config?.okul_dondu ?? 10,
    okul_gelmedi: appData?.settings?.points_config?.okul_gelmedi ?? -20,
    yoklama_takkeli: appData?.settings?.points_config?.yoklama_takkeli ?? 3,
    yoklama_geldi: appData?.settings?.points_config?.yoklama_geldi ?? 2,
    yoklama_gec: appData?.settings?.points_config?.yoklama_gec ?? 1,
    yoklama_gelmedi: appData?.settings?.points_config?.yoklama_gelmedi ?? -3,
    telefon_teslim: appData?.settings?.points_config?.telefon_teslim ?? 2,
    telefon_vermedi: appData?.settings?.points_config?.telefon_vermedi ?? 0,
    yatak_duzenli: appData?.settings?.points_config?.yatak_duzenli ?? 1,
    yatak_bozuk: appData?.settings?.points_config?.yatak_bozuk ?? 0,
    dolap_duzenli: appData?.settings?.points_config?.dolap_duzenli ?? 1,
    dolap_bozuk: appData?.settings?.points_config?.dolap_bozuk ?? 0,
    hygiene_star_5: appData?.settings?.points_config?.hygiene_star_5 ?? 30,
    hygiene_star_4: appData?.settings?.points_config?.hygiene_star_4 ?? 20,
    hygiene_star_3: appData?.settings?.points_config?.hygiene_star_3 ?? 10,
    hygiene_star_2: appData?.settings?.points_config?.hygiene_star_2 ?? -30,
    hygiene_star_1: appData?.settings?.points_config?.hygiene_star_1 ?? -60,
    istirahat_star_5: appData?.settings?.points_config?.istirahat_star_5 ?? 30,
    istirahat_star_4: appData?.settings?.points_config?.istirahat_star_4 ?? 20,
    istirahat_star_3: appData?.settings?.points_config?.istirahat_star_3 ?? 10,
    istirahat_star_2: appData?.settings?.points_config?.istirahat_star_2 ?? -30,
    istirahat_star_1: appData?.settings?.points_config?.istirahat_star_1 ?? -60,
  });

  const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 500;
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/png');
              setCorporateIdentity({ logoUrl: dataUrl });
          };
      };
  };

  const [pinInputs, setPinInputs] = useState({
      admin_pin: appData?.settings?.admin_pin || '1507',
      staff_pin: appData?.settings?.staff_pin || '1234',
  });

  const saveCorporateIdentity = async () => {
      if (corporateIdentity.logoUrl) {
          try { await db.ref('mavikent_premium/settings/corporate_logo_url').set(corporateIdentity.logoUrl); toast("✅ Kurumsal kimlik başarıyla güncellendi!"); } catch (e) { toast("Hata oluştu: " + e.message); }
      } else {
          if (window.confirm("Logo kaldırılacak, emin misiniz?")) { await db.ref('mavikent_premium/settings/corporate_logo_url').remove(); toast("✅ Logo başarıyla kaldırıldı!"); }
      }
  };

  const savePins = async () => {
      if (!pinInputs.admin_pin || !pinInputs.staff_pin) return toast("❌ Şifre alanları boş bırakılamaz!");
      try {
          await db.ref('mavikent_premium/settings').update({ admin_pin: pinInputs.admin_pin, staff_pin: pinInputs.staff_pin });
          toast("✅ Şifreler başarıyla güncellendi!");
      } catch (e) { toast("Hata oluştu: " + e.message); }
  };

  const savePointsConfig = async () => {
      try {
          await db.ref('mavikent_premium/settings/points_config').set(pointsConfig);
          toast("✅ Puan yapılandırması başarıyla güncellendi!");
      } catch (e) {
          toast("Hata oluştu: " + e.message);
      }
  };

  const POINTS_CATEGORIES = [
    { id: 'okul', icon: '🏫', label: 'Okul Devam', desc: 'Okula geliş/devamsızlık', color: '#3b82f6', bg: '#eff6ff',
      items: [{ key: 'okul_dondu', label: 'Okuldan Döndü', icon: '✅' }, { key: 'okul_gelmedi', label: 'Okula Gelmedi', icon: '🚫' }] },
    { id: 'telefon', icon: '📱', label: 'Telefon Teslim', desc: 'Sabah telefon kontrolü', color: '#f59e0b', bg: '#fffbeb',
      items: [{ key: 'telefon_teslim', label: 'Teslim Etti', icon: '✅' }, { key: 'telefon_vermedi', label: 'Vermedi', icon: '❌' }] },
    { id: 'yoklama', icon: '🕌', label: 'Yoklama', desc: 'Namaz yoklaması', color: '#10b981', bg: '#f0fdf4',
      items: [{ key: 'yoklama_takkeli', label: 'Takkeli', icon: '👳‍♂️' }, { key: 'yoklama_geldi', label: 'Geldi', icon: '✅' }, { key: 'yoklama_gec', label: 'Geç', icon: '⏳' }, { key: 'yoklama_gelmedi', label: 'Gelmedi', icon: '❌' }] },
    { id: 'yatak', icon: '🛏️', label: 'Yatak & Dolap', desc: 'Sabah oda düzeni', color: '#8b5cf6', bg: '#faf5ff',
      items: [{ key: 'yatak_duzenli', label: 'Yatak Düzenli', icon: '✅' }, { key: 'yatak_bozuk', label: 'Yatak Bozuk', icon: '❌' }, { key: 'dolap_duzenli', label: 'Dolap Düzenli', icon: '✅' }, { key: 'dolap_bozuk', label: 'Dolap Bozuk', icon: '❌' }] },
    { id: 'hygiene_stars', icon: '🧹', label: 'Hijyen Denetimi', desc: 'Yıldız puanları → M-Coin', color: '#06b6d4', bg: '#ecfeff',
      items: [{ key: 'hygiene_star_5', label: '5 Yıldız ⭐⭐⭐⭐⭐', icon: '⭐' }, { key: 'hygiene_star_4', label: '4 Yıldız ⭐⭐⭐⭐', icon: '⭐' }, { key: 'hygiene_star_3', label: '3 Yıldız ⭐⭐⭐', icon: '⭐' }, { key: 'hygiene_star_2', label: '2 Yıldız ⭐⭐', icon: '⭐' }, { key: 'hygiene_star_1', label: '1 Yıldız ⭐', icon: '⭐' }] },
    { id: 'istirahat_stars', icon: '🛌', label: 'İstirahat Denetimi', desc: 'Yıldız puanları → M-Coin', color: '#10b981', bg: '#f0fdf4',
      items: [{ key: 'istirahat_star_5', label: '5 Yıldız ⭐⭐⭐⭐⭐', icon: '⭐' }, { key: 'istirahat_star_4', label: '4 Yıldız ⭐⭐⭐⭐', icon: '⭐' }, { key: 'istirahat_star_3', label: '3 Yıldız ⭐⭐⭐', icon: '⭐' }, { key: 'istirahat_star_2', label: '2 Yıldız ⭐⭐', icon: '⭐' }, { key: 'istirahat_star_1', label: '1 Yıldız ⭐', icon: '⭐' }] },
  ];

  const openPointsModal = (catId) => {
    const cat = POINTS_CATEGORIES.find(c => c.id === catId);
    const draft = {};
    cat.items.forEach(item => { draft[item.key] = String(pointsConfig[item.key]); });
    setPointsDraft(draft);
    setPointsModal(catId);
  };

  const savePointsModal = async () => {
    const updates = {};
    Object.entries(pointsDraft).forEach(([key, val]) => { updates[key] = parseInt(val) || 0; });
    const newConfig = { ...pointsConfig, ...updates };
    setPointsConfig(newConfig);
    setPointsModal(null);
    try {
      await db.ref('mavikent_premium/settings/points_config').set(newConfig);
      toast("✅ Puan yapılandırması güncellendi!");
    } catch (e) { toast("Hata oluştu: " + e.message); }
  };

  // Kayıtlı görev yerlerini veritabanından çekip listeye doldurur
  useEffect(() => {
    if (appData?.hygiene_assignments) {
      const savedTasks = {};
      Object.entries(appData.hygiene_assignments).forEach(([name, area]) => {
        // Sadece hala listede (roster) olan öğrencileri getirir
        if (roster.includes(name)) {
          savedTasks[name] = { area: area, score: (generalCleaningList[name]?.score || 0) };
        }
      });
      setGeneralCleaningList(prev => ({ ...prev, ...savedTasks }));
    }
  }, [appData?.hygiene_assignments, appData?.roster]);

  const getCoinImpact = (score, type = 'hygiene') => {
      const prefix = type === 'istirahat' ? 'istirahat_star_' : 'hygiene_star_';
      const defaults = { 5: 30, 4: 20, 3: 10, 2: -30, 1: -60 };
      const val = pointsConfig[`${prefix}${score}`];
      return val !== undefined ? val : (defaults[score] ?? 0);
  };

  const autoAssignRecoveryMission = async (studentName) => {
      const existing = appData?.kurtarma_gorevleri?.[studentName];
      if (existing && existing.status !== 'tamamlandi') {
          if (existing.status === 'reddedildi' && existing.rejected_at && Date.now() - existing.rejected_at < 12 * 60 * 60 * 1000) return;
          if (existing.status !== 'reddedildi') return;
      }
      const starReward = { 1: 80, 2: 60, 3: 40, 4: 20 };
      const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
      const failedAreas = Object.values(appData?.hygiene_logs || {})
          .filter(l => l.timestamp >= todayStart && l.score < 5 && (l.responsibles || []).includes(studentName))
          .map(l => ({ name: l.areaName, type: l.type || 'genel', score: l.score, reward: starReward[l.score] || 20 }));
      let missionAreas = failedAreas;
      let totalReward = missionAreas.reduce((s, a) => s + a.reward, 0);
      // Denetim yoksa → sorumlu alanlarından birini 40 coin ile ata
      if (missionAreas.length === 0) {
          const floors = appData?.hygiene_floors || {};
          const responsible = [];
          ['rutin','temizlik'].forEach(sec => {
              ['kat2','kat3','kat4'].forEach(fl => {
                  Object.entries(floors[sec]?.[fl]?.areas || {}).forEach(([,a]) => {
                      if ((a.responsibles || []).includes(studentName)) responsible.push({ name: a.name, type: a.type || 'genel', reward: 40 });
                  });
              });
          });
          missionAreas = responsible.slice(0, 1);
          totalReward = 40;
      }
      if (missionAreas.length === 0) { missionAreas = [{ name: 'Genel Temizlik Görevi', type: 'genel', reward: 40 }]; totalReward = 40; }
      await db.ref(`mavikent_premium/kurtarma_gorevleri/${studentName}`).set({
          status: 'bekliyor',
          assigned_at: Date.now(),
          reward_coins: totalReward,
          areas: missionAreas,
      });
  };

  const FLOOR_AREA_TYPES = {
      wc:        { icon: '🚽', label: 'WC / Tuvalet',   color: '#0ea5e9', bg: '#f0f9ff' },
      etut:      { icon: '📚', label: 'Etüt Salonu',    color: '#8b5cf6', bg: '#faf5ff' },
      yatakhane: { icon: '🛏️', label: 'Yatakhane',      color: '#10b981', bg: '#f0fdf4' },
      genel:     { icon: '🧹', label: 'Genel Temizlik', color: '#f59e0b', bg: '#fffbeb' },
  };

  const saveAdminFloorInspection = async (section, floorKey, areaId) => {
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
      const coinImpact = getCoinImpact(adminHygScore);
      const updates = {};
      const logId = `floor_${Date.now()}`;
      const sectionLabel = section === 'rutin' ? 'Rutin' : 'Temizlik';
      updates[`hygiene_logs/${logId}`] = {
          areaName: area.name, score: adminHygScore,
          responsibles, timestamp: Date.now(), inspector: 'Yönetici',
          coinImpact, type: area.type, floor: floorKey, section,
      };
      responsibles.forEach(name => {
          updates[`wallet/${name}`] = (Number(appData?.wallet?.[name]) || 0) + coinImpact;
          updates[`transactions/${name}/txn_${logId}`] = {
              desc: `${area.name} ${sectionLabel} Denetimi`, amt: coinImpact,
              date: new Date().toLocaleString('tr-TR'),
          };
      });
      try {
          await db.ref('mavikent_premium').update(updates);
          for (const sid of responsibles) {
              const newBal = (Number(appData?.wallet?.[sid]) || 0) + coinImpact;
              if (newBal < 50) autoAssignRecoveryMission(sid);
          }
          toast(`✅ ${area.name} denetimi kaydedildi!`);
          setAdminHygScore(5);
          setAdminHygAreaId(null);
      } catch(e) { toast('Hata!'); } finally { setIsHygieneSaving(false); }
  };

  const addAdminFloorArea = async (section, floorKey) => {
      if (!adminHygNewArea.name.trim()) return toast('Alan adı girin!');
      const areaId = `area_${Date.now()}`;
      await db.ref(`mavikent_premium/hygiene_floors/${section}/${floorKey}/areas/${areaId}`).set({
          name: adminHygNewArea.name.trim(),
          type: adminHygNewArea.type,
          responsibles: [],
      });
      toast('✅ Alan eklendi!');
      setAdminHygNewArea({ name: '', type: 'genel' });
  };

  const deleteAdminFloorArea = async (section, floorKey, areaId, areaName) => {
      if (!window.confirm(`"${areaName}" alanını silmek istediğine emin misin?`)) return;
      await db.ref(`mavikent_premium/hygiene_floors/${section}/${floorKey}/areas/${areaId}`).remove();
      if (adminHygAreaId === areaId) setAdminHygAreaId(null);
      toast('Alan silindi.');
  };

  const updateAreaResponsibles = async (section, floorKey, areaId, newResponsibles) => {
      await db.ref(`mavikent_premium/hygiene_floors/${section}/${floorKey}/areas/${areaId}/responsibles`).set(newResponsibles.filter(Boolean));
  };

  const saveInspection = async () => {
      if(!hygieneForm.areaId) return toast("Lütfen bir alan seçin!");
      setIsHygieneSaving(true);
      const area = appData.hygiene_areas?.[hygieneForm.areaId];
      const responsibles = area?.responsibles || [];
      const coinImpact = getCoinImpact(hygieneForm.score);
      const updates = {};
      const logId = `hyg_${Date.now()}`;
      
      updates[`hygiene_logs/${logId}`] = {
          ...hygieneForm, areaName: area?.name || 'Bilinmeyen Alan',
          responsibles: responsibles, timestamp: Date.now(),
          inspector: "Yönetici", coinImpact, type: 'wc'
      };

      responsibles.forEach(studentId => {
          updates[`wallet/${studentId}`] = (Number(appData?.wallet?.[studentId]) || 0) + coinImpact;
          updates[`transactions/${studentId}/txn_hyg_${Date.now()}`] = { 
              desc: `${area?.name || 'Alan'} WC Denetimi`, amt: coinImpact, date: new Date().toLocaleString('tr-TR') 
          };
      });

      try {
          await db.ref('mavikent_premium').update(updates);
          for (const sid of responsibles) {
              const newBal = (Number(appData?.wallet?.[sid]) || 0) + coinImpact;
              if (newBal < 50) autoAssignRecoveryMission(sid);
          }
          toast(`✅ Denetim kaydedildi! ${coinImpact > 0 ? '+' : ''}${coinImpact} M-Coin yansıtıldı.`);
          setHygieneForm({ areaId: '', score: 5, note: '' });
      } catch (e) { toast("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
  };

  // SADECE TEMİZLİK GÖREV YERLERİNİ KAYDEDER (PUAN VERMEZ)
  const saveCleaningTasks = async () => {
    const tasks = {};
    Object.entries(generalCleaningList).forEach(([name, data]) => {
      if (data.area) tasks[name] = data.area;
    });
    try {
      await db.ref('mavikent_premium/hygiene_assignments').set(tasks);
      toast("✅ Temizlik görev yerleri başarıyla kaydedildi!");
    } catch (e) { toast("Hata oluştu!"); }
  };

  const openWcEditMode = () => {
      const initial = {};
      for(let i=1; i<=6; i++) {
          const key = `wc_${i}`;
          const existingRoster = appData?.hygiene_areas?.[key]?.responsibles || [];
          const validStudents = existingRoster.filter(s => roster.includes(s)); 
          initial[key] = { name: `${i} Numaralı Tuvalet`, type: 'wc', responsibles: validStudents };
      }
      setTempWcData(initial);
      setWcEditMode(true);
  };

  const saveWcAssignments = async () => {
      try {
          await db.ref('mavikent_premium/hygiene_areas').update(tempWcData);
          toast("✅ WC Nöbetçileri Kaydedildi!");
          setWcEditMode(false);
      } catch(e) { toast("Hata!"); }
  };

  const getRoomCoinImpact = (score) => {
      if (score === 5) return 50;
      if (score === 4) return 40;
      if (score === 3) return 30;
      if (score === 2) return -10;
      if (score === 1) return -20;
      return 0;
  };

  const openRoomEditMode = () => {
      const initial = {};
      for(let i=1; i<=10; i++) {
          const key = `room_${i}`;
          const existing = appData?.room_areas?.[key] || { name: `${i}. Oda`, responsibles: [] };
          const validStudents = (existing.responsibles || []).filter(s => roster.includes(s));
          initial[key] = { ...existing, responsibles: validStudents };
      }
      setTempRoomData(initial);
      setRoomEditMode(true);
  };

  const saveRoomAssignments = async () => {
      try {
          await db.ref('mavikent_premium/room_areas').update(tempRoomData);
          toast("✅ Oda İsimleri ve Öğrencileri Kaydedildi!");
          setRoomEditMode(false);
      } catch(e) { toast("Hata!"); }
  };

  const saveRoomInspection = async () => {
      if(!roomForm.areaId) return toast("Lütfen bir oda seçin!");
      setIsHygieneSaving(true);
      const area = appData.room_areas?.[roomForm.areaId];
      const responsibles = area?.responsibles || [];
      const coinImpact = getRoomCoinImpact(roomForm.score);
      const updates = {};
      const logId = `room_${Date.now()}`;
      
      updates[`hygiene_logs/${logId}`] = {
          ...roomForm, areaName: area?.name || 'Bilinmeyen Oda',
          responsibles: responsibles, timestamp: Date.now(),
          inspector: "Yönetici", coinImpact, type: 'room'
      };

      responsibles.forEach(studentId => {
          updates[`wallet/${studentId}`] = (Number(appData?.wallet?.[studentId]) || 0) + coinImpact;
          updates[`transactions/${studentId}/txn_room_${Date.now()}_${Math.floor(Math.random()*1000)}`] = { 
              desc: `${area?.name || 'Oda'} Denetimi`, amt: coinImpact, date: new Date().toLocaleString('tr-TR') 
          };
      });

      try {
          await db.ref('mavikent_premium').update(updates);
          for (const sid of responsibles) {
              const newBal = (Number(appData?.wallet?.[sid]) || 0) + coinImpact;
              if (newBal < 50) autoAssignRecoveryMission(sid);
          }
          toast(`✅ Oda denetimi kaydedildi! Odadaki öğrencilere ${coinImpact > 0 ? '+' : ''}${coinImpact} M-Coin yansıtıldı.`);
          setRoomForm({ areaId: '', score: 5, note: '' });
      } catch (e) { toast("Hata oluştu!"); } finally { setIsHygieneSaving(false); }
  };

  const openIstirahatEditMode = () => {
      const initial = {};
      for (let i = 1; i <= 6; i++) {
          const key = `ist_room_${i}`;
          const existing = appData?.istirahat_rooms?.[key] || { name: `Yatakhane ${i}`, responsibles: [] };
          initial[key] = { ...existing, responsibles: (existing.responsibles || []).filter(s => roster.includes(s)) };
      }
      setTempIstirahatRooms(initial);
      setIstirahatEditMode(true);
  };

  const saveIstirahatRooms = async () => {
      try {
          await db.ref('mavikent_premium/istirahat_rooms').set(tempIstirahatRooms);
          toast('✅ Yatakhaneler kaydedildi!');
          setIstirahatEditMode(false);
      } catch(e) { toast('Hata!'); }
  };

  const saveIstirahatInspection = async (roomKey) => {
      const room = appData?.istirahat_rooms?.[roomKey] || { name: `Yatakhane ${roomKey.replace('ist_room_','')}`, responsibles: [] };
      const responsibles = room.responsibles || [];
      if (responsibles.length === 0) return toast('Bu odada kayıtlı öğrenci yok!');
      setIsIstirahatSaving(true);
      const coinImpact = getCoinImpact(istirahatScore);
      const updates = {};
      const logId = `ist_${Date.now()}`;
      updates[`istirahat_logs/${logId}`] = {
          roomName: room.name, roomKey,
          responsibles, score: istirahatScore, note: istirahatNote,
          timestamp: Date.now(), inspector: 'Yönetici', coinImpact,
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
          for (const sid of responsibles) {
              const newBal = (Number(appData?.wallet?.[sid]) || 0) + coinImpact;
              if (newBal < 50) autoAssignRecoveryMission(sid);
          }
          toast(`✅ ${room.name} kontrolü kaydedildi!`);
          setIstirahatSelectedRoom(null);
          setIstirahatScore(5);
          setIstirahatNote('');
      } catch(e) { toast('Hata!'); } finally { setIsIstirahatSaving(false); }
  };

  const [selectedSession, setSelectedSession] = useState(''); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null); 

  const [eduData, setEduData] = useState({ lessons: [], pages: 0, questions: 0 });
  const [examData, setExamData] = useState({}); 
  const [valuesTopic, setValuesTopic] = useState({ subject: '', topic: '' });
  const [imtihanStudent, setImtihanStudent] = useState(null);
  const [imtihanSubject, setImtihanSubject] = useState(null);
  const [deliveryTab, setDeliveryTab] = useState('wait'); 

  const [settingsInputs, setSettingsInputs] = useState({ 
      news_ticker: appData?.settings?.news_ticker || '', ann1: appData?.settings?.ann1 || '', ann2: appData?.settings?.ann2 || '', 
      active_theme: appData?.settings?.active_theme || 'default', admin_pin: appData?.settings?.admin_pin || '1507', staff_pin: appData?.settings?.staff_pin || '1234' 
  });
  
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', icon: '📦', type: 'normal', stock: '' });
  const [bundleSelection, setBundleSelection] = useState([]);
  const [editProductKey, setEditProductKey] = useState(null); 
  
  const [newAdminClan, setNewAdminClan] = useState({ name: '', tag: '', icon: '🛡️', leader: '' });
  const [newGiftCode, setNewGiftCode] = useState({ code: '', type: 'mcoin', val: '', uses: '1' });
  const [newGroupBuy, setNewGroupBuy] = useState({ name: '', totalCost: '', maxP: '', icon: '🤝' });
  const [adminChatInput, setAdminChatInput] = useState(''); 

  const [banInput, setBanInput] = useState({ student: '', duration: '1', reason: '', photoUrl: '' });
  const [newPenaltyCard, setNewPenaltyCard] = useState({ name: '', mcoin: 0, banDays: 0, rp: 0 });
  const [newRewardCard, setNewRewardCard] = useState({ name: '', type: 'mcoin', amount1: '', amount2: '' });
  const [tutanakTab, setTutanakTab] = useState('odul');
  const [rewardCardModal, setRewardCardModal] = useState(false);
  const [penaltyCardModal, setPenaltyCardModal] = useState(false);
  const [newTourney, setNewTourney] = useState({ name: '', game: 'FIFA 24', fee: '', p1: '', p2: '', p3: '', device: 'ps5' });

  const handleCreatePenaltyCard = () => {
      if (!newPenaltyCard.name) return toast("Ceza adı zorunludur!");
      const cId = `penalty_${Date.now()}`;
      db.ref(`mavikent_premium/penalty_cards/${cId}`).set({
          name: newPenaltyCard.name,
          mcoin: parseInt(newPenaltyCard.mcoin) || 0,
          banDays: parseInt(newPenaltyCard.banDays) || 0,
          rp: parseInt(newPenaltyCard.rp) || 0
      });
      toast("✅ Ceza Kartı sisteme eklendi!");
      setNewPenaltyCard({ name: '', mcoin: 0, banDays: 0, rp: 0 });
  };

  const handleCreateRewardCard = () => {
      if (!newRewardCard.name) return toast("Ödül adı zorunludur!");
      const cId = `reward_${Date.now()}`;
      db.ref(`mavikent_premium/reward_cards/${cId}`).set({
          name: newRewardCard.name,
          type: newRewardCard.type,
          amount1: newRewardCard.amount1,
          amount2: newRewardCard.amount2
      });
      toast("✅ Ödül Kartı sisteme eklendi!");
      setNewRewardCard({ name: '', type: 'mcoin', amount1: '', amount2: '' });
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
  const [tourneyDaysMap, setTourneyDaysMap] = useState({}); 
  const [newCustomSlot, setNewCustomSlot] = useState({ device: 'ps4', day: 'Pazartesi', time: '', price: '' });
  const [editingCustomSlot, setEditingCustomSlot] = useState(null);
  const [customSlotDraft, setCustomSlotDraft] = useState({ time: '', price: '' });
  const [deviceForm, setDeviceForm] = useState({ name: '', icon: '🎮' });
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [deviceEditDraft, setDeviceEditDraft] = useState({ name: '', icon: '' });
  const [defaultSlotDevice, setDefaultSlotDevice] = useState('ps4');
  const [newDefaultSlot, setNewDefaultSlot] = useState({ time: '', price: '' });
  const [editingDefaultSlot, setEditingDefaultSlot] = useState(null);
  const [defaultSlotDraft, setDefaultSlotDraft] = useState({ time: '', price: '' });

  const csvDenemeRef = useRef(null); const csvYaziliRef = useRef(null);

  const classList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"];
  const eduClassList = ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "ELİT", "STANDART"];
  const levelList = ["SEVİYE 1/A", "SEVİYE 1/B", "SEVİYE 2"];
  const examSubjects = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din Kültürü"];
  
  const rawRoster = appData?.roster || [];
  const roster = Array.isArray(rawRoster) ? rawRoster : Object.values(rawRoster || {});
  const isElite = (name) => appData?.student_tiers?.[name] === 'elite';

  const pointsConfigFromDB = appData?.settings?.points_config || {
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

  const mebLessons = { "5. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], "6. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Bilişim", "Beden", "🚫 YOK"], "7. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], "8. Sınıf": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din", "Teknoloji", "Beden", "🚫 YOK"], "ELİT": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"], "STANDART": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal/İnkılap", "İngilizce", "Din", "Paragraf S.", "Problem Ç.", "🚫 YOK"] };
  const valuesSubjectsList = ["K.Kerim", "İlmihal", "Siyer-i Nebi", "Adabı Muaşeret", "Tecvid"];
  const collectionTypes = [{ id: 'AKILLI SAAT', label: 'Akıllı Saat', icon: '⌚' }, { id: 'FORMA', label: 'Forma', icon: '👕' }, { id: 'KRAMPON', label: 'Krampon', icon: '👟' }, { id: 'ÇİKOLATA EVİM', label: 'Çikolata Evim', icon: '🍫' }, { id: 'KÜNEFE', label: 'Künefe', icon: '🍮' }, { id: 'NEŞELİ BALIK', label: 'Neşeli Balık', icon: '🐟' }, { id: 'PİZZA', label: 'Pizza', icon: '🍕' }, { id: 'FUTBOL TOPU', label: 'Futbol Topu', icon: '⚽' }];
  const exactCollections = collectionTypes.map(c => c.id);

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

  useEffect(() => {
      if (!appData || appData?.settings?.game_devices) return;
      const seedDevices = {};
      DEFAULT_GAME_DEVICES.forEach(d => { seedDevices[d.id] = { name: d.name, icon: d.icon }; });
      const seedSlots = {};
      Object.entries(DEFAULT_GAME_SLOTS).forEach(([devId, slots]) => {
          seedSlots[devId] = {};
          slots.forEach(s => { seedSlots[devId][s.id] = { time: s.time, price: s.price }; });
      });
      db.ref('mavikent_premium/settings').update({ game_devices: seedDevices, game_slots: seedSlots });
  }, [appData, appData?.settings?.game_devices]);

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  const handleAddCustomSlot = () => {
      if(!newCustomSlot.time || !newCustomSlot.price) return toast("Saat ve Fiyat girin!");
      const slotId = `custom_${Date.now()}`;
      db.ref(`mavikent_premium/custom_game_slots/${newCustomSlot.device}/${newCustomSlot.day}/${slotId}`).set({
          time: newCustomSlot.time, price: parseInt(newCustomSlot.price)
      });
      toast("✅ Özel seans eklendi!");
      setNewCustomSlot({...newCustomSlot, time: ''});
  };

  const handleSaveCustomSlotEdit = (devId, dayName, slotId) => {
      if (!customSlotDraft.time || !customSlotDraft.price) return toast("Saat ve Fiyat girin!");
      db.ref(`mavikent_premium/custom_game_slots/${devId}/${dayName}/${slotId}`).update({
          time: customSlotDraft.time, price: parseInt(customSlotDraft.price)
      });
      toast("✅ Özel seans güncellendi!");
      setEditingCustomSlot(null);
  };

  const slugifyDeviceId = (s) => String(s).toLowerCase().trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const handleAddDevice = () => {
      if (!deviceForm.name.trim()) return toast("Cihaz adı girin!");
      const id = slugifyDeviceId(deviceForm.name) || `dev_${Date.now()}`;
      if (GAME_DEVICES.some(d => d.id === id)) return toast("Bu isimde bir cihaz zaten var!");
      db.ref(`mavikent_premium/settings/game_devices/${id}`).set({ name: deviceForm.name.trim(), icon: deviceForm.icon || '🎮' });
      toast("✅ Cihaz eklendi!");
      setDeviceForm({ name: '', icon: '🎮' });
  };

  const handleSaveDeviceEdit = (id) => {
      if (!deviceEditDraft.name.trim()) return toast("Cihaz adı boş olamaz!");
      db.ref(`mavikent_premium/settings/game_devices/${id}`).update({ name: deviceEditDraft.name.trim(), icon: deviceEditDraft.icon || '🎮' });
      toast("✅ Cihaz güncellendi!");
      setEditingDeviceId(null);
  };

  const handleDeleteDevice = (id, name) => {
      if (!window.confirm(`"${name}" cihazını ve tüm varsayılan seanslarını silmek istediğine emin misin?`)) return;
      db.ref(`mavikent_premium/settings/game_devices/${id}`).remove();
      db.ref(`mavikent_premium/settings/game_slots/${id}`).remove();
      toast("🗑️ Cihaz silindi.");
  };

  const handleAddDefaultSlot = () => {
      if (!newDefaultSlot.time || !newDefaultSlot.price) return toast("Saat ve Fiyat girin!");
      const slotId = `slot_${Date.now()}`;
      db.ref(`mavikent_premium/settings/game_slots/${defaultSlotDevice}/${slotId}`).set({ time: newDefaultSlot.time, price: parseInt(newDefaultSlot.price) });
      toast("✅ Seans eklendi!");
      setNewDefaultSlot({ time: '', price: '' });
  };

  const handleSaveDefaultSlotEdit = (deviceId, slotId) => {
      if (!defaultSlotDraft.time || !defaultSlotDraft.price) return toast("Saat ve Fiyat girin!");
      db.ref(`mavikent_premium/settings/game_slots/${deviceId}/${slotId}`).update({ time: defaultSlotDraft.time, price: parseInt(defaultSlotDraft.price) });
      toast("✅ Seans güncellendi!");
      setEditingDefaultSlot(null);
  };

  const handleDeleteDefaultSlot = (deviceId, slotId, time) => {
      if (!window.confirm(`${time} seansını silmek istediğine emin misin?`)) return;
      db.ref(`mavikent_premium/settings/game_slots/${deviceId}/${slotId}`).remove();
  };

  const handleAdminPhotoUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          const img = new Image(); img.src = event.target.result;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              let scaleSize = 800 / img.width; if (img.height > img.width) scaleSize = 800 / img.height; 
              canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              setBanInput({ ...banInput, photoUrl: canvas.toDataURL('image/jpeg', 0.6) });
          };
      };
  };

  useEffect(() => {
      if (!appData || !roster.length) return;
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() >= 19) {
          const todayStr = now.toDateString();
          if (appData?.settings?.last_ticket_dist !== todayStr) {
              const updates = {}; roster.forEach(n => { updates[`tickets/${n}`] = (Number(appData?.tickets?.[n]) || 0) + 1; });
              updates[`settings/last_ticket_dist`] = todayStr; db.ref('mavikent_premium').update(updates);
          }
      }
  }, [appData, roster]);

  const getFilteredRoster = (session) => { 
      if(session === 'ELİT') return roster.filter(n => isElite(n)); 
      if(session === 'STANDART') return roster.filter(n => !isElite(n)); 
      return roster.filter(n => appData?.student_classes?.[n] === session); 
  };

  const handleBack = () => {
    if (currentModule && (modalType || selectedStudent)) { setModalType(null); setSelectedStudent(null); return; }
    if (currentModule === 'yoklama' && selectedSession) { setSelectedSession(''); return; }
    if (currentModule === 'admin_settings' && adminSettingsView) { setAdminSettingsView(null); return; }
    if (currentModule === 'imtihan_view') {
      if (imtihanSubject) { setImtihanSubject(null); return; }
      if (imtihanStudent) { setImtihanStudent(null); return; }
      setCurrentModule(null); setSelectedSession(''); return;
    }
    if (currentModule) { setCurrentModule(null); setSelectedSession(''); setAdminSettingsView(null); return; }
    if (dashboardView !== 'main') {
      if (dashboardView.startsWith('egitim_')) { setDashboardView('egitim'); return; }
      if (dashboardView.startsWith('degerler_')) { setDashboardView('degerler'); return; }
      setDashboardView('main'); return;
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
    const isPersonal2X = appData?.active_cards?.[name]?.multiplier?.date === new Date().toDateString();
    let total = basePts > 0 ? basePts + bns + eliteMulti : basePts;
    if ((isPersonal2X || appData?.settings?.global_event === '2x_xp') && total > 0 && type !== 'kanaat') total *= 2;
    return total;
  };

const saveData = (type, status, basePts) => {
    if (!selectedStudent) return;

    // KURAL 2: Öğrenci kurumda yoksa ödül/ceza puanı (Yoklama ve Okul hariç) verilemez!
    const todayStr = new Date().toDateString();
    const okulDateStr = new Date().getHours() < 15 ? new Date(Date.now() - 86400000).toDateString() : new Date().toDateString();
    if (appData?.daily_status?.[okulDateStr]?.[selectedStudent] === 'a' && type !== 'okul' && type !== 'yoklama') {
        return toast(`⚠️ ${selectedStudent} adlı öğrenci bugün kurumda değil (İzinli/Gelmedi). Puan işlemi yapılamaz.`);
    }

    const finalPts = getCalculatedPoints(selectedStudent, basePts, type);
    const updates = {};
    const isFail = status === 'a' || status === 'l' || (type === 'yatak' && basePts === 0) || (type === 'telefon' && status === 'a');
    
    if (isFail) {
        const strk = appData?.active_cards?.[selectedStudent]?.streak;
        if (strk && (strk.date === todayStr || (strk.end && strk.end > Date.now()))) { 
            toast(`🛡️ ${selectedStudent} SERİ KORUMA KALKANI kullandı!`); updates[`active_cards/${selectedStudent}/streak`] = null; 
        } else { updates[`streaks/${selectedStudent}`] = 0; updates[`daily_flags/${selectedStudent}/broken`] = true; }
    }
    
    if (finalPts !== 0) { 
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalPts; 
        updates[`xp/${selectedStudent}`] = Math.max(0, (Number(appData?.xp?.[selectedStudent]) || 0) + (basePts * 10)); 
        const tId = `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        let desc = type === 'kanaat' ? 'Yönetici Kanaat Notu' : (type === 'yoklama' ? 'Yoklama Puanı' : (type === 'telefon' ? 'Telefon Teslim' : (type === 'okul' ? 'Okul Dönüş Yoklaması' : 'Yatak/Dolap')));
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
    else if (type === 'kanaat') updates[`kanaat_w/${selectedStudent}`] = (Number(appData?.kanaat_w?.[selectedStudent]) || 0) + finalPts;
    else if (type === 'yatak') updates[`yatak_d/${todayStr}/${selectedStudent}/${status}_pts`] = finalPts; 
    
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null);
  };
const saveEducationData = () => {
    const todayStr = new Date().toDateString();
    const oldData = appData?.education_d?.[selectedStudent] || {}; 
    let earnedPoints = 0;
    const validNew = (eduData.lessons || []).filter(hw => !hw.includes("YOK")); 
    const validOld = (oldData.lessons || []).filter(hw => !hw.includes("YOK"));
    
    if (validOld.length === 0 && validNew.length > 0) earnedPoints += 2;
    if ((eduData.pages || 0) > (oldData.pages || 0)) earnedPoints += Math.floor((eduData.pages || 0) / 10) - Math.floor((oldData.pages || 0) / 10);
    if ((eduData.questions || 0) > (oldData.questions || 0)) earnedPoints += Math.floor((eduData.questions || 0) / 10) - Math.floor((oldData.questions || 0) / 10);
    
    // --- HAFTALIK BİRİKTİRME MOTORU (Cmt 16:00 Sıfırlamalı) ---
    const now = new Date(); const pivot = new Date(now);
    pivot.setDate(now.getDate() - (now.getDay() + 1) % 7); pivot.setHours(16, 0, 0, 0);
    if (now < pivot) pivot.setDate(pivot.getDate() - 7);
    const weekId = `week_${pivot.getTime()}`;

    let qDelta = 0; let pDelta = 0;
    if (oldData.date === todayStr) { // Eğer bugün içinde 2. kez düzeltme yapılıyorsa sadece farkı al
        qDelta = (eduData.questions || 0) - (oldData.questions || 0);
        pDelta = (eduData.pages || 0) - (oldData.pages || 0);
    } else { // İlk defa giriliyorsa hepsini al
        qDelta = (eduData.questions || 0);
        pDelta = (eduData.pages || 0);
    }

    const currentWeeklyQ = appData?.weekly_stats?.[weekId]?.[selectedStudent]?.questions || 0;
    const currentWeeklyP = appData?.weekly_stats?.[weekId]?.[selectedStudent]?.pages || 0;

    const updates = {}; 
    updates[`education_d/${selectedStudent}`] = { ...eduData, date: todayStr };
    updates[`weekly_stats/${weekId}/${selectedStudent}/questions`] = Math.max(0, currentWeeklyQ + qDelta);
    updates[`weekly_stats/${weekId}/${selectedStudent}/pages`] = Math.max(0, currentWeeklyP + pDelta);

    if (earnedPoints > 0) {
        const finalM = getCalculatedPoints(selectedStudent, earnedPoints, 'egitim');
        updates[`wallet/${selectedStudent}`] = (Number(appData?.wallet?.[selectedStudent]) || 0) + finalM;
        updates[`season_score/${selectedStudent}`] = (Number(appData?.season_score?.[selectedStudent]) || 0) + (earnedPoints + (isElite(selectedStudent) ? 2 : 0));
        updates[`xp/${selectedStudent}`] = (Number(appData?.xp?.[selectedStudent]) || 0) + (earnedPoints * 10);
        updates[`transactions/${selectedStudent}/txn_${Date.now()}`] = { desc: 'Günlük Eğitim Başarısı', amt: finalM, date: new Date().toLocaleString('tr-TR') };
    }
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null); toast("✅ Eğitim Kaydedildi ve Haftalık Panoya İşlendi!");
  };

  const saveExamData = (type) => {
    const updates = {};
    if (type === 'deneme') {
        let totalNet = 0; let subjectsData = {};
        for(let i=0; i<examSubjects.length; i++) { 
            const d = parseFloat(examData[`d_${i}`]) || 0; const y = parseFloat(examData[`y_${i}`]) || 0; const b = parseFloat(examData[`b_${i}`]) || 0;
            const net = d - (y/3); totalNet += net; subjectsData[i] = { d, y, b, net };
        }
        updates[`exams/${selectedStudent}/deneme`] = { subjects: subjectsData, net: totalNet, target: parseFloat(examData.target) || 0, date: new Date().toDateString() };
    } else if (type === 'yazili') {
        let total = 0; let count = 0; let writeData = {};
        for(let i=0; i<examSubjects.length; i++) { 
            const val = examData[`p_${i}`]; 
            if(val !== undefined && val !== '') { total += parseFloat(val); count++; writeData[`p_${i}`] = parseFloat(val); } 
        }
        updates[`exams/${selectedStudent}/yazili`] = { ...writeData, avg: count > 0 ? (total / count) : 0, target: parseFloat(examData.target) || 0, date: new Date().toDateString() };
    }
    db.ref('mavikent_premium').update(updates); setSelectedStudent(null); setModalType(null); toast(`${type.toUpperCase()} Kaydedildi!`);
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
      const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `Mavikent_${selectedSession}_${type}_Sablon.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCSVUpload = (e, type) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return toast("⚠️ Lütfen Excel'de dosyanızı doldurduktan sonra 'Farklı Kaydet' diyerek 'CSV (Virgülle ayrılmış)' formatında kaydedip sisteme yükleyin.");
      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target.result; const rows = text.split(/\r?\n/).map(row => row.split(/[,;]/));
          const updates = {}; let matchCount = 0; const normalize = (str) => String(str).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
          for (let i = 1; i < rows.length; i++) { 
              const cols = rows[i]; if (cols.length < 2) continue; 
              const matchedStudent = roster.find(n => normalize(n) === normalize(cols[0]));
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
          if (Object.keys(updates).length > 0) { db.ref('mavikent_premium').update(updates); toast(`✅ Başarılı! ${matchCount} öğrencinin verisi aktarıldı.`); } else { toast('⚠️ Hata: İsimler eşleşmedi.'); }
          e.target.value = null; 
      };
      reader.readAsText(file, 'UTF-8');
  };

  const loadHtml2Canvas = async () => {
      if (window.html2canvas) return window.html2canvas;
      return new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; script.onload = () => resolve(window.html2canvas); document.head.appendChild(script); });
  };

  const downloadReportAsJPG = async (type, className) => {
      const btnId = `btn-jpg-${type}`; const originalText = document.getElementById(btnId).innerText; document.getElementById(btnId).innerText = "⏳ Hazırlanıyor...";
      const html2canvas = await loadHtml2Canvas(); const container = document.createElement('div');
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

  const handleAddProduct = () => {
    playClick();
    if (!newProduct.name || !newProduct.price) return toast("İsim ve fiyat zorunludur!");
    const productData = { n: newProduct.name, p: parseInt(newProduct.price), i: newProduct.icon, type: newProduct.type, stock: newProduct.stock !== '' ? parseInt(newProduct.stock) : 999 };
    if (newProduct.type === 'bundle') { if (bundleSelection.length === 0) return toast("Lütfen paket içine eklenecek ürünleri seçin!"); productData.bundleItems = bundleSelection; }
    if (editProductKey) { db.ref(`mavikent_premium/market_products/${editProductKey}`).update(productData); setEditProductKey(null); } 
    else { db.ref('mavikent_premium/market_products').push(productData); }
    setNewProduct({ name: '', price: '', icon: '📦', type: 'normal', stock: '' }); setBundleSelection([]);
  };
  
  const editProduct = (key, prod) => { setNewProduct({ name: prod.n, price: prod.p, icon: prod.i, type: prod.type || 'normal', stock: prod.stock !== undefined ? prod.stock : '' }); setBundleSelection(prod.bundleItems || []); setEditProductKey(key); window.scrollTo(0,0); };

  const handleCreateGroupBuy = () => {
      const tc = parseInt(newGroupBuy.totalCost); const mp = parseInt(newGroupBuy.maxP);
      if(!newGroupBuy.name || isNaN(tc) || isNaN(mp)) return toast("Tüm alanları doldurun!");
      db.ref('mavikent_premium/group_buys').push({ n: newGroupBuy.name, i: newGroupBuy.icon, tc: tc, mp: mp, pp: Math.ceil(tc/mp), participants: [], active: true, date: new Date().toLocaleDateString('tr-TR') });
      toast("🤝 İmece başlatıldı!"); setNewGroupBuy({ name: '', totalCost: '', maxP: '', icon: '🤝' });
  };

  const handleStartAuction = () => {
      const item = document.getElementById('aucItem').value; const price = parseInt(document.getElementById('aucPrice').value);
      if(!item || !price) return toast("İhale ürünü ve başlangıç fiyatı zorunludur!");
      db.ref('mavikent_premium/auction').set({ item: item, minBid: price, currentBid: price, highestBidder: null, active: true });
      toast("🔨 İhale başlatıldı! Öğrenciler artık teklif verebilir."); document.getElementById('aucItem').value = ''; document.getElementById('aucPrice').value = '';
  };

  const handleEndAuction = () => {
      if(!window.confirm("İhaleyi bitirmek istediğine emin misin?")) return;
      const auc = appData?.auction;
      if (auc && auc.highestBidder) { playSuccess(); db.ref('mavikent_premium/deliveries').push({ s: auc.highestBidder, i: `${auc.item} (İhale Kazancı)`, st: 'wait', type: 'normal', val: auc.item, date: new Date().toLocaleDateString('tr-TR') }); toast(`🏆 İhale bitti! ${auc.highestBidder} kazandı.`); } else { toast("İhaleye kimse teklif vermedi."); }
      db.ref('mavikent_premium/auction').set(null);
  };

  const handleAdminCreateClan = () => {
      if(!newAdminClan.name || !newAdminClan.tag || !newAdminClan.leader) return toast("Klan adı, TAG ve lider zorunludur!");
      const cId = `clan_${Date.now()}`;
      db.ref(`mavikent_premium/clans/${cId}`).set({ name: newAdminClan.name.toUpperCase(), tag: newAdminClan.tag.toUpperCase(), icon: newAdminClan.icon, desc: 'Yönetici tarafından kuruldu.', leader: newAdminClan.leader, members: [newAdminClan.leader] });
      toast("Klan başarıyla oluşturuldu."); setNewAdminClan({ name: '', tag: '', icon: '🛡️', leader: '' });
  };

  const handleAdminDeleteClan = (cId) => {
      if(!window.confirm("Bu klanı silmek istediğine emin misin?")) return;
      const clan = appData?.clans?.[cId];
      if(clan && clan.members) { const updates = {}; updates[`clans/${cId}`] = null; clan.members.forEach(m => { updates[`clan_war_participants/${m}`] = null; }); db.ref('mavikent_premium').update(updates); toast("Klan temizlendi."); }
  };

  // EKSİK 1: KLAN SAVAŞINI BİTİRME VE ÖDÜL DAĞITIMI
  const handleEndClanWar = () => {
      if (!window.confirm("Klan savaşını bitirip kazanan klana 60'ar M-Coin ödül dağıtmak istiyor musunuz?")) return;
      let highestScore = -1; let winnerClanId = null;
      Object.keys(appData?.clans || {}).forEach(cId => {
          const clan = appData.clans[cId]; let warScore = 0;
          (clan.members || []).forEach(m => { if (appData?.clan_war_participants?.[m]) { warScore += Number(appData?.season_score?.[m] || 0); } });
          if (warScore > highestScore) { highestScore = warScore; winnerClanId = cId; }
      });
      if (!winnerClanId || highestScore === 0) return toast("Savaşa katılan klan veya puan yok.");
      
      const winnerClan = appData.clans[winnerClanId]; const updates = {};
      (winnerClan.members || []).forEach(m => {
          if (appData?.clan_war_participants?.[m]) { updates[`wallet/${m}`] = (Number(appData?.wallet?.[m]) || 0) + 60; updates[`transactions/${m}/txn_cw_${Date.now()}`] = { desc: '🏆 Klan Savaşı Şampiyonluğu', amt: 60, date: new Date().toLocaleString('tr-TR') }; }
      });
      updates['clan_war_participants'] = null;
      db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🏆 HAFTANIN KLAN SAVAŞI ŞAMPİYONU: ${winnerClan.name}! Katılan üyelere 60 M-Coin yatırıldı.`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      db.ref('mavikent_premium').update(updates); toast(`✅ Savaş bitti! Şampiyon: ${winnerClan.name} (${highestScore} Puan)`);
  };
  // EKSİK 3: YÖNETİCİ SOHBET MESAJI GÖNDERİMİ
  const sendAdminChat = () => {
      if (!adminChatInput.trim()) return;
      db.ref('mavikent_premium/global_chat').push({ s: 'YÖNETİCİ', t: adminChatInput, ts: Date.now(), type: 'admin', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
      setAdminChatInput('');
  };

  // EKSİK 4: TESLİMAT ONAYLARI VE KOLEKSİYON YÖNETİMİ
  const handleApproveDelivery = (k, item) => {
      if (!window.confirm(`${item.n || item.i} teslimatını onaylıyor musun?`)) return;
      const updates = {}; const iName = String(item.n || item.i || '').toUpperCase();
      const isDigital = item.type === 'multiplier' || item.type === 'streak' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ");
      if (isDigital) {
          if (item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ")) { updates[`tickets/${item.s}`] = (Number(appData?.tickets?.[item.s]) || 0) + 1; }
          else if (item.type === 'multiplier') { updates[`active_cards/${item.s}/multiplier`] = { date: new Date().toDateString(), val: "2X" }; }
          else if (item.type === 'streak') { const today = new Date(); let nextSat = new Date(); nextSat.setDate(today.getDate() + 6); nextSat.setHours(15, 0, 0, 0); updates[`active_cards/${item.s}/streak`] = { val: "aktif", date: new Date().toDateString(), end: nextSat.getTime() }; }
      }
      updates[`deliveries/${k}/st`] = 'done'; playSuccess(); burst(); db.ref('mavikent_premium').update(updates); toast("✅ Onaylandı!");
  };

  const handleDeliverCollection = (student, cName, keys) => {
      if (!window.confirm(`${student} için ${cName} koleksiyon ödülünü (500 M-Coin) vermek istiyor musunuz?`)) return;
      const updates = {}; keys.forEach(k => { updates[`deliveries/${k}/st`] = 'done'; });
      updates[`wallet/${student}`] = (Number(appData?.wallet?.[student]) || 0) + 500;
      updates[`transactions/${student}/txn_col_${Date.now()}`] = { desc: `🏆 Koleksiyon Ödülü (${cName})`, amt: 500, date: new Date().toLocaleString('tr-TR') };
      playSuccess(); burst(); db.ref('mavikent_premium').update(updates); toast("✅ Ödül yatırıldı!");
  };

  const handleCancelCollection = (student, keys, items, withRefund) => {
      if (!window.confirm(withRefund ? "Bu koleksiyon parçalarını iptal edip iade yapmak istiyor musunuz?" : "İADESİZ silmek istiyor musunuz?")) return;
      const updates = {}; let totalRefund = 0;
      keys.forEach((k, idx) => {
          updates[`deliveries/${k}`] = null;
          if (withRefund) {
              const it = items[idx]; const iName = String(it.n || it.i || ''); let refundAmt = 0;
              if (iName.includes('(Çekiliş)')) refundAmt = 20; else if (iName.includes('(Kazı Kazan)')) refundAmt = 15;
              else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === iName); if (prod && prod.p) refundAmt = Number(prod.p); }
              totalRefund += refundAmt;
          }
      });
      if (withRefund && totalRefund > 0) {
          updates[`wallet/${student}`] = (Number(appData?.wallet?.[student]) || 0) + totalRefund;
          updates[`transactions/${student}/txn_ref_col_${Date.now()}`] = { desc: `Toplu İade (Koleksiyon)`, amt: totalRefund, date: new Date().toLocaleString('tr-TR') };
      }
      playCancel(); db.ref('mavikent_premium').update(updates); toast(withRefund ? `✅ İade yapıldı: ${totalRefund} M` : "🗑️ Silindi.");
  };

  const handleBulkDeliveryAction = (action) => {
      const waitingKeys = Object.keys(appData?.deliveries || {}).filter(k => appData.deliveries[k].st === 'wait');
      if (waitingKeys.length === 0) return toast("Bekleyen teslimat yok.");
      const updates = {};
      
      if (action === 'approve') {
          if(!window.confirm(`Görünen tüm teslimatları onaylamak istediğine emin misin?`)) return;
          waitingKeys.forEach(k => {
              const item = appData.deliveries[k]; const iName = String(item.n || item.i || '').toUpperCase();
              const isDigital = item.type === 'multiplier' || item.type === 'streak' || item.type === 'avatar' || item.type === 'title' || item.type === 'frame' || item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ");
              if (isDigital) {
                  if (item.type === 'ticket' || iName.includes("BİLET") || iName.includes("ÇEKİLİŞ")) { updates[`tickets/${item.s}`] = (Number(appData?.tickets?.[item.s]) || 0) + 1; } 
                  else if (item.type === 'multiplier') { updates[`active_cards/${item.s}/multiplier`] = { date: new Date().toDateString(), val: "2X" }; } 
                  else if (item.type === 'streak') { const today = new Date(); let nextSat = new Date(); nextSat.setDate(today.getDate() + 6); nextSat.setHours(15, 0, 0, 0); updates[`active_cards/${item.s}/streak`] = { val: "aktif", date: new Date().toDateString(), end: nextSat.getTime() }; } 
              }
              updates[`deliveries/${k}/st`] = 'done';
          });
          playSuccess(); burst(); db.ref('mavikent_premium').update(updates); toast(`✅ Toplu onaylandı!`);
      } 
      else if (action === 'refund') {
          if(!window.confirm(`Tüm bekleyen siparişleri iptal edip ücretlerini iade etmek istediğine emin misin?`)) return;
          let localWallets = {};
          waitingKeys.forEach(k => {
              const item = appData.deliveries[k]; let refundAmt = 0; const itemName = String(item.n || item.i || '');
              if (itemName.includes('(Çekiliş)')) refundAmt = 20; else if (itemName.includes('(Kazı Kazan)')) refundAmt = 15; 
              else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === itemName); if (prod && prod.p) refundAmt = Number(prod.p); }
              updates[`deliveries/${k}`] = null;
              if (refundAmt > 0) {
                  if (localWallets[item.s] === undefined) localWallets[item.s] = Number(appData?.wallet?.[item.s] || 0);
                  localWallets[item.s] += refundAmt; updates[`wallet/${item.s}`] = localWallets[item.s];
                  updates[`transactions/${item.s}/txn_${Date.now()}_${Math.floor(Math.random()*1000)}`] = { desc: `Toplu İade: ${itemName}`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') };
              }
          });
          playCancel(); db.ref('mavikent_premium').update(updates); toast(`💰 İadeler tamamlandı!`);
      }
      else if (action === 'delete') {
          if(!window.confirm(`Tüm bekleyen siparişleri İADESİZ olarak silmek istediğine emin misin?`)) return;
          waitingKeys.forEach(k => updates[`deliveries/${k}`] = null); playCancel(); db.ref('mavikent_premium').update(updates); toast(`🗑️ Teslimatlar silindi.`);
      }
  };

  const handleCancelDelivery = (k, item, withRefund) => {
      if (!window.confirm(withRefund ? "İptal edip iade yapmak istediğinize emin misiniz?" : "İadesiz SİLMEK istediğinize emin misiniz?")) return;
      const updates = {}; updates[`deliveries/${k}`] = null;
      if (withRefund) {
          let refundAmt = 0; const iName = String(item.n || item.i || '');
          if (iName.includes('(Çekiliş)')) refundAmt = 20; else if (iName.includes('(Kazı Kazan)')) refundAmt = 15;
          else { const prod = Object.values(appData?.market_products || {}).find(p => p.n === iName); if (prod && prod.p) refundAmt = Number(prod.p); }
          
          playCancel();
          if (refundAmt > 0) {
              updates[`wallet/${item.s}`] = (Number(appData?.wallet?.[item.s]) || 0) + refundAmt;
              updates[`transactions/${item.s}/txn_ref_${Date.now()}`] = { desc: `İade: ${iName}`, amt: refundAmt, date: new Date().toLocaleString('tr-TR') };
              toast(`✅ İade edildi: ${refundAmt} M`);
          } else { toast(`✅ İptal edildi. (Sabit bedel bulunamadı)`); }
      } else { toast("🗑️ Kalıcı olarak silindi."); }
      db.ref('mavikent_premium').update(updates);
  };

  const applyBan = () => {
      if (!banInput.student || !banInput.reason) return toast("Öğrenci ve Ceza Sebebi zorunludur!");
      let expTime = 0;
      if (banInput.duration === '1') expTime = Date.now() + (1 * 24 * 60 * 60 * 1000);
      else if (banInput.duration === '3') expTime = Date.now() + (3 * 24 * 60 * 60 * 1000);
      else if (banInput.duration === '7') expTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      else expTime = Date.now() + (365 * 24 * 60 * 60 * 1000); 

      const updates = {};
      updates[`game_room_bans/${banInput.student}`] = { reason: banInput.reason, photoUrl: banInput.photoUrl || '', expiry: expTime, date: new Date().toLocaleDateString('tr-TR') };

      Object.keys(appData?.game_room_appointments || {}).forEach(device => {
          Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
              Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                  if (appData.game_room_appointments[device][day][slotId] === banInput.student) { updates[`game_room_appointments/${device}/${day}/${slotId}`] = null; }
              });
          });
      });
      db.ref('mavikent_premium').update(updates); toast(`⛔ ${banInput.student} adlı öğrenciye başarıyla ceza kesildi ve aktif randevuları iptal edildi!`);
      setBanInput({ student: '', duration: '1', reason: '', photoUrl: '' });
  };

  const removeBan = (student) => {
      if(window.confirm(`${student} adlı öğrencinin yasağını kaldırmak istiyor musun?`)) { db.ref(`mavikent_premium/game_room_bans/${student}`).remove(); toast("Yasak kaldırıldı."); }
  };

  const toggleTourneyDay = (tId, day) => {
      setTourneyDaysMap(prev => {
          const current = prev[tId] || [];
          if(current.includes(day)) return {...prev, [tId]: current.filter(d => d !== day)};
          return {...prev, [tId]: [...current, day]};
      });
  };

  const generateFixture = (tId, tourneyData) => {
      const selectedDays = tourneyDaysMap[tId] || [];
      if (selectedDays.length === 0) return toast("Lütfen maçların oynanacağı günleri (Aşağıdaki Butonlardan) seçin!");
      const players = [...(tourneyData.participants || [])];
      if (players.length < 2) return toast("Fikstür oluşturmak için en az 2 kişi gerekli!");
      if (!window.confirm(`Fikstür çekilecek ve seçtiğiniz günlerin (Akşam) seansları bu turnuva için kilitlenecektir. Onaylıyor musun?`)) return;

      players.sort(() => Math.random() - 0.5);
      let fixturePlayers = [...players];
      if (fixturePlayers.length % 2 !== 0) fixturePlayers.push("BAY");

      const numPlayers = fixturePlayers.length;
      const numRounds = numPlayers - 1;
      const matches = {}; let matchIdx = 0;

      const devSlotsObj = GAME_SLOTS[tourneyData.device] || [];
      const eveningSlots = devSlotsObj.filter(s => parseInt(s.time.split(':')[0]) >= 20);

      if (eveningSlots.length === 0) return toast("Bu cihaz için akşam seansı bulunamadı!");

      let currentWeek = 1; let currentDayIdx = 0; let currentSlotIdx = 0;
      let updates = {}; let lockedCount = 0;

      for (let round = 0; round < numRounds; round++) {
          for (let i = 0; i < numPlayers / 2; i++) {
              const home = fixturePlayers[i];
              const away = fixturePlayers[numPlayers - 1 - i];

              if (home !== "BAY" && away !== "BAY") {
                  const targetDay = selectedDays[currentDayIdx];
                  const targetSlot = eveningSlots[currentSlotIdx];

                  matches[`m_${matchIdx}`] = { p1: home, p2: away, played: false, s1: 0, s2: 0, week: currentWeek, day: targetDay, slotId: targetSlot.id, time: targetSlot.time };
                  updates[`game_room_appointments/${tourneyData.device}/${targetDay}/${targetSlot.id}`] = `🏆 TURNUVA: ${tourneyData.name}`;
                  lockedCount++; matchIdx++; currentSlotIdx++;

                  if (currentSlotIdx >= eveningSlots.length) {
                      currentSlotIdx = 0; currentDayIdx++;
                      if (currentDayIdx >= selectedDays.length) { currentDayIdx = 0; currentWeek++; }
                  }
              }
          }
          fixturePlayers.splice(1, 0, fixturePlayers.pop());
      }

      const standings = {}; players.forEach(p => { standings[p] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; });

      updates[`tournaments/${tId}/status`] = 'active';
      updates[`tournaments/${tId}/fixture`] = matches;
      updates[`tournaments/${tId}/standings`] = standings;
      db.ref('mavikent_premium').update(updates); toast(`✅ Fikstür başarıyla oluşturuldu! Toplam ${lockedCount} seans turnuva için kilitlendi.`);
  };

  const handleCreateTournament = () => {
      if (!newTourney.name || !newTourney.fee || !newTourney.p1) return toast("Turnuva Adı, Giriş Ücreti ve 1. Ödülü zorunludur!");
      const tId = `tourney_${Date.now()}`;
      const updates = {};
      updates[`tournaments/${tId}`] = {
          name: newTourney.name, game: newTourney.game, device: newTourney.device, fee: parseInt(newTourney.fee),
          p1: parseInt(newTourney.p1), p2: parseInt(newTourney.p2) || 0, p3: parseInt(newTourney.p3) || 0,
          participants: [], status: 'open', date: new Date().toLocaleDateString('tr-TR')
      };
      db.ref('mavikent_premium').update(updates);
      toast("🏆 Turnuva başarıyla oluşturuldu! Öğrenciler katılım sağlayabilir.");
      setNewTourney({ name: '', game: 'FIFA 24', fee: '', p1: '', p2: '', p3: '', device: 'ps5' });
  };

  const handleEndTournament = (tId, tourneyData) => {
      const parts = tourneyData.participants || [];
      if (parts.length === 0) return toast("Turnuvada katılımcı yok!");
      let msg = "🏆 ŞAMPİYONU SEÇİN:\n\n";
      parts.forEach((p, i) => { msg += `${i + 1}- ${p}\n`; });
      msg += "\nŞampiyonun numarasını girin:";
      const res = prompt(msg);
      if (!res) return;
      const idx = parseInt(res) - 1;
      if (isNaN(idx) || idx < 0 || idx >= parts.length) return toast("Geçersiz bir numara girdiniz.");
      
      const winner = parts[idx];
      const prize = parseInt(tourneyData.p1); 
      
      if (window.confirm(`👑 ŞAMPİYON: ${winner}\n💰 KAZANCI: ${prize} M-Coin\n\nOnaylıyor musunuz?`)) {
          const updates = {};
          const currentWallet = Number(appData?.wallet?.[winner]) || 0;
          updates[`wallet/${winner}`] = currentWallet + prize;
          updates[`transactions/${winner}/txn_tourneywin_${Date.now()}`] = { desc: `🏆 Turnuva Şampiyonu: ${tourneyData.name}`, amt: prize, date: new Date().toLocaleString('tr-TR') };
          updates[`tournaments/${tId}`] = null;
          
          Object.keys(appData?.game_room_appointments || {}).forEach(device => {
              Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
                  Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                      const sName = appData.game_room_appointments[device][day][slotId];
                      if (String(sName).includes(`TURNUVA: ${tourneyData.name}`)) { updates[`game_room_appointments/${device}/${day}/${slotId}`] = null; }
                  });
              });
          });
          
          db.ref('mavikent_premium/global_chat').push({ s: 'SİSTEM', t: `🏆 ${tourneyData.name} Turnuvasının Şampiyonu ${winner.split(' ')[0]} oldu ve ${prize} M-Coin kazandı! Tebrikler! 🎉`, ts: Date.now(), type: 'system', date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) });
          db.ref('mavikent_premium').update(updates); toast(`🎉 İşlem tamam! Şampiyon ilan edildi, oyun odası saatleri açıldı ve ödül yatırıldı.`);
      }
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
        const isNotAtYurt = okulDurumu === 'a'; // Okula gelmediyse tüm modüllerde kilitlenir

        let bgColor = '#ffffff'; let subText = ''; let isCompletedToday = false;

        if (currentModule === 'okul') {
            // Admin: status gösterilir ama tıklanabilir kalır (düzeltme yapılabilsin)
            if (okulDurumu) {
                bgColor = okulDurumu === 'p' ? '#ecfdf5' : (okulDurumu === 'a' ? '#fef2f2' : '#f1f5f9');
                subText = okulDurumu === 'p' ? '✅ Döndü' : (okulDurumu === 'a' ? '❌ Gelmedi' : '✉️ İzinli');
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
        .elite-input:focus { border-color: #3b82f6 !important; background: #ffffff; box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important; }
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
      `}</style>

      <input type="file" ref={csvDenemeRef} accept=".csv, .xlsx, .xls" style={{display: 'none'}} onChange={(e) => handleCSVUpload(e, 'deneme')} />
      <input type="file" ref={csvYaziliRef} accept=".csv, .xlsx, .xls" style={{display: 'none'}} onChange={(e) => handleCSVUpload(e, 'yazili')} />

      <div className="popIn-anim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '50px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <button onClick={handleBack} className="premium-btn" style={{ background: '#f1f5f9', color: '#0f172a', padding: '12px 20px', fontWeight: 800 }}>← {currentModule || dashboardView !== 'main' ? 'Geri Dön' : 'Çıkış Yap'}</button>
        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>YÖNETİCİ PANELİ</div>
      </div>

      <div className="fade-in" key={dashboardView + (currentModule || '')}>

        {!currentModule && (
          <div className="premium-grid">
{dashboardView === 'main' && [
              { id: 'isleyis', icon: '⚙️', label: 'YURT İŞLEYİŞ' },
              { id: 'egitim', icon: '📚', label: 'EĞİTİM KONTROL' },
              { id: 'degerler', icon: '🕌', label: 'DAHİLİ DERS & DEĞERLER' },
              { id: 'hygiene', icon: '✨', label: 'HİJYEN DENETİM', bg: '#f0fdf4' },
              { id: 'turnuva', icon: '🎮', label: 'OYUN ODASI & TURNUVA' },
              { id: 'yonetim', icon: '👑', label: 'SİSTEM YÖNETİMİ' }
            ].map(mod => (
              <div key={mod.id} onClick={() => {
                  if (mod.id === 'hygiene') setCurrentModule(mod.id);
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

{dashboardView === 'turnuva' && [
                { id: 'admin_ban', icon: '🕵️‍♂️', label: 'Oyun Odası Denetim Merkezi' },
                { id: 'admin_turnuva', icon: '🏆', label: 'Turnuva Organizasyonu' },
                { id: 'admin_custom_slot', icon: '⏰', label: 'Seans Düzenle' }
            ].map(mod => (
                <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
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
            
            {dashboardView === 'yonetim' && [ 
              { id: 'admin_students', icon: '👥', label: 'ÖĞRENCİ / BİLET' }, 
              { id: 'admin_discipline', icon: '📜', label: 'DİSİPLİN KURULU' },
              { id: 'admin_market', icon: '🛒', label: 'MARKET' }, 
              { id: 'admin_teslimat', icon: '📦', label: 'TESLİMAT' }, 
              { id: 'admin_lig', icon: '🏆', label: 'ELİT LİG' }, 
              { id: 'admin_clans', icon: '🚩', label: 'KLANLAR' }, 
              { id: 'admin_codes', icon: '🎟️', label: 'KODLAR' },
              { id: 'admin_chat', icon: '💬', label: 'SOHBET YÖNETİMİ' }, 
              { id: 'admin_settings', icon: '🏢', label: 'KURUMSAL KİMLİK' } 
            ].map(mod => (
              <div key={mod.id} onClick={() => setCurrentModule(mod.id)} className="premium-card card-hover"><div className="icon">{mod.icon}</div><div className="label">{mod.label}</div></div>
            ))}
          </div>
        )}

        {/* --- OYUN ODASI DENETİM MERKEZİ --- */}
        {currentModule === 'admin_ban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '30px', borderRadius: '24px', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e3a8a', fontWeight: 900 }}>🕵️‍♂️ Oyun Odası Sorumlusu & Yönetim</h3>
                    <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '20px', fontWeight: 600 }}>Seçilen öğrenci, oyun odası randevularını kontrol edebilir. Ayrıca buradan tüm randevuları manuel olarak sıfırlayabilirsiniz.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={appData?.settings?.game_room_controller || ''} onChange={e => {
                            db.ref('mavikent_premium/settings/game_room_controller').set(e.target.value);
                            toast(`Oyun Odası Sorumlusu başarıyla atandı! (${e.target.value})`);
                        }} className="elite-input" style={{ flex: 1 }}>
                            <option value="">Sorumlu Seçin</option>
                            {roster.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <button onClick={() => {
                        if(window.confirm('Tüm oyun odası randevuları ŞU AN tamamen temizlenecek. Emin misiniz?')) {
                            const newAppointments = {};
                            
                            // 1. Oynanmamış tüm turnuva maçlarını bul ve yeni tertemiz seans tablosuna yerleştir (2. Hafta, 3. Hafta vb.)
                            Object.keys(appData?.tournaments || {}).forEach(tId => {
                                const t = appData.tournaments[tId];
                                if (t.status === 'active' && t.fixture) {
                                    Object.values(t.fixture).forEach(m => {
                                        if (!m.played && m.day && m.slotId) {
                                            if (!newAppointments[t.device]) newAppointments[t.device] = {};
                                            if (!newAppointments[t.device][m.day]) newAppointments[t.device][m.day] = {};
                                            newAppointments[t.device][m.day][m.slotId] = `🏆 TURNUVA: ${t.name}`;
                                        }
                                    });
                                }
                            });

                            const updates = {};
                            // 2. game_room_appointments tablosunu sadece turnuva maçları olacak şekilde tamamen ez
                            updates['game_room_appointments'] = Object.keys(newAppointments).length > 0 ? newAppointments : null;

                            db.ref('mavikent_premium').update(updates).then(() => {
                                db.ref('mavikent_premium/global_chat').push({ 
                                    s: 'YÖNETİCİ', 
                                    t: '📢 Oyun Odası randevuları sıfırlandı! (Sıradaki lig maçları seanslara otomatik kilitlendi)', 
                                    ts: Date.now(), 
                                    type: 'admin', 
                                    date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
                                });
                                toast('Sistem sıfırlandı! Oynanmamış tüm turnuva maçları (sıradaki haftalar) otomatik olarak oyun odasını kapattı.');
                            }).catch(err => toast("Hata oluştu: " + err.message));
                        }
                    }} className="premium-btn" style={{ width: '100%', background: '#f59e0b', color: 'white', padding: '16px', marginTop: '15px' }}>
                        🎮 TÜM RANDEVULARI ŞİMDİ SIFIRLA
                    </button>
                </div>

                <div style={{ background: '#fef2f2', padding: '30px', borderRadius: '24px', border: '1px solid #fecaca' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#991b1b', fontWeight: 900 }}>⚖️ Haftalık Randevu Limiti (Ambargo Engelleme)</h3>
                    <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '20px', fontWeight: 600 }}>Bazı öğrenciler tüm hafta boyunca aynı cihazın tüm seanslarını satın alıp diğer öğrencilerin oynamasını engelleyebiliyor. Buradan bir öğrencinin, aynı cihazdan haftada en fazla kaç seans alabileceğini sınırlayabilirsiniz. Ayrıca limit aktifken öğrenciler art arda iki gün aynı cihazdan seans alamaz, bir gün ara vermek zorunda kalır. 0 = sınırsız.</p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="number" min="0" defaultValue={appData?.settings?.game_room_weekly_limit || 0}
                            onBlur={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                db.ref('mavikent_premium/settings/game_room_weekly_limit').set(val);
                                toast(val > 0 ? `✅ Haftalık limit ${val} seans olarak ayarlandı!` : '✅ Haftalık limit kaldırıldı (sınırsız).');
                            }}
                            className="elite-input" style={{ flex: 1 }} placeholder="Örn: 2" />
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b' }}>seans / cihaz / hafta</div>
                    </div>
                </div>

                {/* --- YENİ EKLENEN: AKTİF RANDEVULAR VE İADE YÖNETİMİ --- */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🔄 Randevu İptal & İade Yönetimi</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', fontWeight: 600 }}>Cihaz arızası gibi durumlarda öğrencinin randevusunu iptal edip ücretini (M-Coin) anında iade edebilirsiniz.</p>
                    <div className="clean-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {(() => {
                            const appointments = [];
                            Object.keys(appData?.game_room_appointments || {}).forEach(device => {
                                Object.keys(appData.game_room_appointments[device] || {}).forEach(day => {
                                    Object.keys(appData.game_room_appointments[device][day] || {}).forEach(slotId => {
                                        const student = appData.game_room_appointments[device][day][slotId];
                                        // Turnuva maçlarını listeye dahil etme, sadece normal randevular görünsün
                                        if (student && !String(student).includes("TURNUVA")) { 
                                            appointments.push({ device, day, slotId, student });
                                        }
                                    });
                                });
                            });

                            if (appointments.length === 0) return <div style={{color:'#64748b', fontSize:'13px', fontWeight:600}}>Şu an alınmış aktif randevu bulunmuyor.</div>;

                            return appointments.map((app, idx) => {
                                const devObj = GAME_DEVICES.find(d => d.id === app.device);
                                const devName = devObj ? devObj.name : app.device.toUpperCase();
                                const slotObj = (GAME_SLOTS[app.device] || []).find(s => s.id === app.slotId);
                                const timeStr = slotObj ? slotObj.time : 'Özel Seans';

                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{app.student}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>{devName} • {app.day} • {timeStr}</div>
                                        </div>
                                        <button onClick={() => {
                                            // Tahmini fiyat belirleme
                                            let suggestedPrice = slotObj?.price || 0;

                                            // Eğer özel bir seans ise onun fiyatını bul
                                            const customSlot = appData?.custom_game_slots?.[app.device]?.[app.day]?.[app.slotId];
                                            if (customSlot && customSlot.price) suggestedPrice = Number(customSlot.price);

                                            // Yöneticiye iade edilecek miktarı sor (Tahmini fiyatı otomatik getirir)
                                            const overridePrice = prompt(`${app.student} adlı öğrenciye ne kadar M-Coin iade edilecek?`, suggestedPrice);
                                            if (overridePrice === null) return; 
                                            const finalPrice = parseInt(overridePrice) || 0;

                                            if (window.confirm(`${app.student} adlı öğrencinin randevusu silinip hesabına ${finalPrice} M-Coin iade edilecek. Onaylıyor musunuz?`)) {
                                                const updates = {};
                                                
                                                // 1. Randevuyu boşa çıkar
                                                updates[`game_room_appointments/${app.device}/${app.day}/${app.slotId}`] = null;
                                                
                                                // 2. Bakiyeyi iade et ve loglara yaz
                                                if (finalPrice > 0) {
                                                    updates[`wallet/${app.student}`] = (Number(appData?.wallet?.[app.student]) || 0) + finalPrice;
                                                    updates[`transactions/${app.student}/txn_refund_${Date.now()}`] = { 
                                                        desc: `Randevu İadesi (${devName})`, 
                                                        amt: finalPrice, 
                                                        date: new Date().toLocaleString('tr-TR') 
                                                    };
                                                }

                                                // 3. Değişiklikleri kaydet ve anons geç
                                                db.ref('mavikent_premium').update(updates).then(() => {
                                                    db.ref('mavikent_premium/global_chat').push({ 
                                                        s: 'SİSTEM', 
                                                        t: `📢 ${String(app.student).split(' ')[0]} adlı öğrencinin ${devName} randevusu teknik sebeplerle iptal edilmiş ve ücreti anında iade edilmiştir.`, 
                                                        ts: Date.now(), 
                                                        type: 'system', 
                                                        date: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
                                                    });
                                                    toast("✅ Randevu başarıyla iptal edildi ve iade sağlandı.");
                                                });
                                            }
                                        }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '8px 16px', fontSize: '12px' }}>
                                            🔄 İptal & İade
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>📋 Gelen Kontrol Raporları</h3>
                    <div className="clean-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {Object.keys(appData?.game_room_reports || {}).length === 0 ? <div style={{color:'#64748b', fontSize:'13px', fontWeight:600}}>Henüz rapor bulunmuyor.</div> : (
                           Object.keys(appData.game_room_reports).reverse().map(k => {
                               const rep = appData.game_room_reports[k];
                               return (
                                   <div key={k} style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                       <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                           <span>🎮 {rep.target}</span>
                                           <span style={{fontSize:'11px', color:'#64748b'}}>{rep.date}</span>
                                       </div>
                                       <div style={{ fontSize: '12px', color: '#334155', marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                           <div>Sağlam Teslim: {rep.q1 ? '✅' : '❌'}</div>
                                           <div>Tertip Düzen: {rep.q2 ? '✅' : '❌'}</div>
                                           <div>Oyundan Çıkıldı: {rep.q3 ? '✅' : '❌'}</div>
                                           <div>Cihaz Kapatıldı: {rep.q4 ? '✅' : '❌'}</div>
                                       </div>
                                       <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 800 }}>
                                           Yiyecek/İçecek İhlali: {rep.q5 ? <span style={{color:'#ef4444'}}>EVET ⛔ (1 Hafta Ban)</span> : <span style={{color:'#10b981'}}>HAYIR ✅</span>}
                                       </div>
                                       {rep.photoUrl && (
                                           <div style={{ marginTop: '10px' }}>
                                              <img src={rep.photoUrl} alt="İhlal Kanıtı" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ef4444', cursor: 'pointer' }} onClick={() => window.open(rep.photoUrl, '_blank')} />
                                              <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800 }}>📸 Kanıt Fotoğrafı</div>
                                           </div>
                                       )}
                                       <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>Denetleyen: {rep.controller}</div>
                                   </div>
                               )
                           })
                        )}
                    </div>
                </div>

                <div style={{ background: '#fef2f2', padding: '30px', borderRadius: '24px', border: '1px solid #fca5a5' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#b91c1c', fontWeight: 900 }}>⛔ Manuel Ceza Ver</h3>
                    <select value={banInput.student} onChange={e => setBanInput({...banInput, student: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}>
                        <option value="">Öğrenci Seçin</option>
                        {roster.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select value={banInput.duration} onChange={e => setBanInput({...banInput, duration: e.target.value})} className="elite-input" style={{ marginBottom: '12px' }}>
                        <option value="1">1 Gün Uzaklaştırma</option>
                        <option value="3">3 Gün Uzaklaştırma</option>
                        <option value="7">1 Hafta Uzaklaştırma</option>
                        <option value="999">Süresiz Kapatma</option>
                    </select>
                    <input type="text" value={banInput.reason} onChange={e => setBanInput({...banInput, reason: e.target.value})} placeholder="Ceza Sebebi" className="elite-input" style={{ marginBottom: '15px' }} />
                    
                    <input type="file" id="adminPhotoInput" accept="image/*" capture="environment" onChange={handleAdminPhotoUpload} style={{ display: 'none' }} />
                    
                    {!banInput.photoUrl ? (
                        <button onClick={() => document.getElementById('adminPhotoInput').click()} className="premium-btn" style={{ background: '#fca5a5', color: '#7f1d1d', padding: '12px', fontSize: '13px', width: '100%', marginBottom: '20px' }}>
                            📷 İsteğe Bağlı: Kanıt Çek / Yükle
                        </button>
                    ) : (
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <img src={banInput.photoUrl} alt="Kanıt" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ef4444', marginBottom: '10px' }} />
                            <button onClick={() => setBanInput({...banInput, photoUrl: ''})} className="premium-btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5 !important', padding: '8px 16px', fontSize: '12px' }}>🗑️ Fotoğrafı Sil</button>
                        </div>
                    )}
                    <button onClick={applyBan} className="premium-btn" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '16px' }}>CEZAYI UYGULA</button>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🚫 Cezalı Öğrenciler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.keys(appData?.game_room_bans || {}).length === 0 && <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 700 }}>Şu an cezalı öğrenci bulunmuyor.</div>}
                        {Object.keys(appData?.game_room_bans || {}).map(student => {
                            const ban = appData.game_room_bans[student];
                            const isExpired = Date.now() > ban.expiry;
                            if (isExpired) return null; 
                            
                            const remainingDays = Math.ceil((ban.expiry - Date.now()) / (1000 * 60 * 60 * 24));
                            const banText = remainingDays > 300 ? 'SÜRESİZ' : `${remainingDays} Gün Kaldı`;

                            return (
                                <div key={student} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 900, color: '#ef4444', fontSize: '15px', marginBottom: '4px' }}>{student}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Sebep: {ban.reason}</div>
                                        {ban.photoUrl && (
                                            <div style={{ marginTop: '8px', cursor: 'pointer' }} onClick={() => window.open(ban.photoUrl, '_blank')}>
                                                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 800, background: '#eff6ff', padding: '4px 8px', borderRadius: '6px' }}>📸 Kanıtı Gör</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', background: '#fef2f2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontWeight: 900, marginBottom: '8px' }}>{banText}</div>
                                        <button onClick={() => removeBan(student)} className="premium-btn" style={{ background: 'white', border: '1px solid #e2e8f0 !important', color: '#64748b', padding: '6px 12px', fontSize: '11px' }}>Kaldır</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

{/* --- SEANS DÜZENLE MERKEZİ --- */}
        {currentModule === 'admin_custom_slot' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* 0. CİHAZ YÖNETİMİ */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🎮 Cihazlar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                        {GAME_DEVICES.map(dev => (
                            <div key={dev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '10px', flexWrap: 'wrap' }}>
                                {editingDeviceId === dev.id ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '220px' }}>
                                            <input type="text" value={deviceEditDraft.icon} onChange={e => setDeviceEditDraft({...deviceEditDraft, icon: e.target.value})} className="elite-input" style={{ width: '60px', textAlign: 'center' }} />
                                            <input type="text" value={deviceEditDraft.name} onChange={e => setDeviceEditDraft({...deviceEditDraft, name: e.target.value})} className="elite-input" style={{ flex: 1 }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleSaveDeviceEdit(dev.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>✅ Kaydet</button>
                                            <button onClick={() => setEditingDeviceId(null)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>İptal</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{dev.icon} {dev.name} <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '12px' }}>({dev.id})</span></div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { setEditingDeviceId(dev.id); setDeviceEditDraft({ name: dev.name, icon: dev.icon }); }} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>✏️ Düzenle</button>
                                            <button onClick={() => handleDeleteDevice(dev.id, dev.name)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>🗑️ Sil</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: '10px' }}>
                        <input type="text" placeholder="🎮" value={deviceForm.icon} onChange={e => setDeviceForm({...deviceForm, icon: e.target.value})} className="elite-input" style={{ textAlign: 'center' }} />
                        <input type="text" placeholder="Yeni Cihaz Adı (Örn: Switch)" value={deviceForm.name} onChange={e => setDeviceForm({...deviceForm, name: e.target.value})} className="elite-input" />
                        <button onClick={handleAddDevice} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '0 20px', fontWeight: 900, border: 'none' }}>+ Cihaz Ekle</button>
                    </div>
                </div>

                {/* 1. VARSAYILAN (HAFTALIK SABİT) SEANSLAR */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontWeight: 900 }}>⏰ Varsayılan Seans Saatleri</h3>
                    <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Bu seanslar seçilen cihaz için haftanın her günü geçerlidir. Saatini, fiyatını değiştirebilir, yenisini ekleyip silebilirsin.</p>

                    <select value={defaultSlotDevice} onChange={e => setDefaultSlotDevice(e.target.value)} className="elite-input" style={{ marginBottom: '15px', maxWidth: '260px' }}>
                        {GAME_DEVICES.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                    </select>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                        {(GAME_SLOTS[defaultSlotDevice] || []).length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, border: '2px dashed #e2e8f0', borderRadius: '15px' }}>Bu cihaz için henüz seans tanımlı değil.</div>
                        )}
                        {(GAME_SLOTS[defaultSlotDevice] || []).map(slot => {
                            const isEditing = editingDefaultSlot?.deviceId === defaultSlotDevice && editingDefaultSlot?.slotId === slot.id;
                            return (
                                <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '10px', flexWrap: 'wrap' }}>
                                    {isEditing ? (
                                        <>
                                            <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '220px' }}>
                                                <input type="text" value={defaultSlotDraft.time} onChange={e => setDefaultSlotDraft({...defaultSlotDraft, time: e.target.value})} className="elite-input" style={{ flex: 2 }} placeholder="Saat (Örn: 21:00 - 21:30)" />
                                                <input type="number" value={defaultSlotDraft.price} onChange={e => setDefaultSlotDraft({...defaultSlotDraft, price: e.target.value})} className="elite-input" style={{ flex: 1 }} placeholder="Fiyat" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleSaveDefaultSlotEdit(defaultSlotDevice, slot.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>✅ Kaydet</button>
                                                <button onClick={() => setEditingDefaultSlot(null)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>İptal</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>🕒 {slot.time}</div>
                                                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>{slot.price} M-Coin</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => { setEditingDefaultSlot({ deviceId: defaultSlotDevice, slotId: slot.id }); setDefaultSlotDraft({ time: slot.time, price: slot.price }); }} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>✏️ Düzenle</button>
                                                <button onClick={() => handleDeleteDefaultSlot(defaultSlotDevice, slot.id, slot.time)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>🗑️ Sil</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <input type="text" placeholder="Saat (Örn: 10:00 - 11:00)" value={newDefaultSlot.time} onChange={e => setNewDefaultSlot({...newDefaultSlot, time: e.target.value})} className="elite-input" />
                        <input type="number" placeholder="Fiyat (M-Coin)" value={newDefaultSlot.price} onChange={e => setNewDefaultSlot({...newDefaultSlot, price: e.target.value})} className="elite-input" />
                        <button onClick={handleAddDefaultSlot} className="premium-btn" style={{ background: '#0f172a', color: 'white', padding: '16px', fontWeight: 900, border: 'none' }}>+ Seans Ekle</button>
                    </div>
                </div>

                {/* 2. ÖZEL (GÜNE ÖZGÜ) SEANS EKLEME FORMU */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontWeight: 900 }}>⏰ Yeni Özel Seans Ekle</h3>
                    <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sadece seçtiğin güne özel, tek seferlik ekstra seans eklemek için kullan.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <select value={newCustomSlot.device} onChange={e => setNewCustomSlot({...newCustomSlot, device: e.target.value})} className="elite-input">
                            {GAME_DEVICES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={newCustomSlot.day} onChange={e => setNewCustomSlot({...newCustomSlot, day: e.target.value})} className="elite-input">
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="text" placeholder="Saat (Örn: 10:00 - 11:00)" value={newCustomSlot.time} onChange={e => setNewCustomSlot({...newCustomSlot, time: e.target.value})} className="elite-input" />
                        <input type="number" placeholder="Fiyat (M-Coin)" value={newCustomSlot.price} onChange={e => setNewCustomSlot({...newCustomSlot, price: e.target.value})} className="elite-input" />
                        <button onClick={handleAddCustomSlot} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '16px', fontWeight: 900, border: 'none' }}>YAYINLA</button>
                    </div>
                </div>

                {/* 3. TÜM ÖZEL SEANSLARIN LİSTESİ (GLOBAL GÖRÜNÜM) */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 900 }}>🌐 Aktif Tüm Özel Seanslar</h3>
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                            Toplam: {Object.values(appData?.custom_game_slots || {}).reduce((acc, dev) => acc + Object.values(dev || {}).reduce((acc2, day) => acc2 + Object.keys(day || {}).length, 0), 0)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(() => {
                            const allSlots = [];
                            Object.entries(appData?.custom_game_slots || {}).forEach(([devId, days]) => {
                                Object.entries(days || {}).forEach(([dayName, slots]) => {
                                    Object.entries(slots || {}).forEach(([slotId, slotData]) => {
                                        allSlots.push({ devId, dayName, slotId, ...slotData });
                                    });
                                });
                            });

                            if (allSlots.length === 0) {
                                return <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, border: '2px dashed #e2e8f0', borderRadius: '15px' }}>Henüz hiçbir özel seans eklenmemiş.</div>;
                            }

                            return allSlots.sort((a, b) => DAYS.indexOf(a.dayName) - DAYS.indexOf(b.dayName)).map((item) => {
                                const isEditing = editingCustomSlot?.devId === item.devId && editingCustomSlot?.dayName === item.dayName && editingCustomSlot?.slotId === item.slotId;
                                return (
                                <div key={item.slotId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', gap: '10px', flexWrap: 'wrap' }}>
                                    {isEditing ? (
                                        <>
                                            <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px', alignItems: 'center' }}>
                                                <div style={{ background: '#0f172a', color: '#d4af37', padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center', minWidth: '85px' }}>
                                                    {item.dayName.toUpperCase()}
                                                </div>
                                                <input type="text" value={customSlotDraft.time} onChange={e => setCustomSlotDraft({...customSlotDraft, time: e.target.value})} className="elite-input" style={{ flex: 2 }} placeholder="Saat" />
                                                <input type="number" value={customSlotDraft.price} onChange={e => setCustomSlotDraft({...customSlotDraft, price: e.target.value})} className="elite-input" style={{ flex: 1 }} placeholder="Fiyat" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleSaveCustomSlotEdit(item.devId, item.dayName, item.slotId)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>✅ Kaydet</button>
                                                <button onClick={() => setEditingCustomSlot(null)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>İptal</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ background: '#0f172a', color: '#d4af37', padding: '8px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, textAlign: 'center', minWidth: '85px' }}>
                                                    {item.dayName.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{item.time} <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>({item.devId.toUpperCase()})</span></div>
                                                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>{item.price} M-Coin</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => { setEditingCustomSlot({ devId: item.devId, dayName: item.dayName, slotId: item.slotId }); setCustomSlotDraft({ time: item.time, price: item.price }); }} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>✏️ Düzenle</button>
                                                <button onClick={() => {
                                                    if(window.confirm(`${item.dayName} günü ${item.time} seansını silmek istediğine emin misin?`)) {
                                                        db.ref(`mavikent_premium/custom_game_slots/${item.devId}/${item.dayName}/${item.slotId}`).remove();
                                                    }
                                                }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>🗑️ SİL</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )});
                        })()}
                    </div>
                </div>
            </div>
        )}

        {/* --- TURNUVA YÖNETİMİ --- */}
        {currentModule === 'admin_turnuva' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 20px rgba(59,130,246,0.3)' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🏆 Yeni Turnuva (Lig) Başlat</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Turnuva başladığında sistem otomatik fikstür çeker ve maçları seçtiğiniz günlerin akşamlarına dağıtır.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <input type="text" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} placeholder="Turnuva Adı (Örn: FIFA Kış Ligi)" className="elite-input" style={{ gridColumn: '1 / -1' }} />
                        
                        <select value={newTourney.device} onChange={e => setNewTourney({...newTourney, device: e.target.value})} className="elite-input">
                            {GAME_DEVICES.map(d => <option key={d.id} value={d.id}>Oynanacak Cihaz: {d.name}</option>)}
                        </select>
                        <input type="text" value={newTourney.game} onChange={e => setNewTourney({...newTourney, game: e.target.value})} placeholder="Oyun (Örn: FC 24)" className="elite-input" />
                        <input type="number" value={newTourney.fee} onChange={e => setNewTourney({...newTourney, fee: e.target.value})} placeholder="Giriş Ücreti (M)" className="elite-input" />
                        
                        <input type="number" value={newTourney.p1} onChange={e => setNewTourney({...newTourney, p1: e.target.value})} placeholder="🥇 1. Ödülü (M)" className="elite-input" style={{ borderColor: '#fcd34d' }} />
                        <input type="number" value={newTourney.p2} onChange={e => setNewTourney({...newTourney, p2: e.target.value})} placeholder="🥈 2. Ödülü (M)" className="elite-input" style={{ borderColor: '#cbd5e1' }} />
                        <input type="number" value={newTourney.p3} onChange={e => setNewTourney({...newTourney, p3: e.target.value})} placeholder="🥉 3. Ödülü (M)" className="elite-input" style={{ borderColor: '#b45309' }} />
                        
                        <button onClick={handleCreateTournament} className="premium-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', gridColumn: '1 / -1', padding: '16px', marginTop: '10px' }}>TURNUVAYI İLANA AÇ</button>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontWeight: 900 }}>🎮 Aktif Turnuvalar ve Fikstür</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.keys(appData?.tournaments || {}).length === 0 && <div style={{ color: '#64748b', fontWeight: 700 }}>Henüz oluşturulmuş turnuva yok.</div>}
                        
                        {Object.keys(appData?.tournaments || {}).reverse().map(tId => {
                            const t = appData.tournaments[tId];
                            const parts = t.participants || [];
                            const isLocked = t.status === 'active';
                            const selectedDaysArray = tourneyDaysMap[tId] || [];

                            return (
                                <div key={tId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>{t.name} <span style={{fontSize: '12px', background: isLocked ? '#ecfdf5' : '#fffbeb', color: isLocked ? '#10b981' : '#d97706', padding: '4px 8px', borderRadius: '8px', marginLeft: '8px', verticalAlign: 'middle'}}>{isLocked ? 'Oynanıyor (Fikstür Çekildi)' : 'Kayıt Aşamasında'}</span></div>
                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{t.game} • {String(t.device).toUpperCase()} • Ödüller: 🥇{t.p1}M | 🥈{t.p2}M | 🥉{t.p3}M</div>
                                        </div>
                                        <button onClick={() => { if(window.confirm('Bu turnuvayı tamamen iptal edip SİLMEK istediğine emin misin?')) db.ref(`mavikent_premium/tournaments/${tId}`).remove(); }} className="premium-btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 16px', fontSize: '12px' }}>İptal Et/Sil</button>
                                    </div>

                                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Kayıtlı Oyuncular ({parts.length} Kişi)</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                            {parts.length === 0 ? <div style={{ fontSize: '12px', color: '#94a3b8' }}>Kayıt yok.</div> : parts.map((p, i) => (
                                                <div key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>{String(p).split(' ')[0]}</div>
                                            ))}
                                        </div>

                                        {!isLocked && parts.length >= 2 && (
                                            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', marginBottom: '10px' }}>📅 Maçların Oynanacağı Günleri Seçin:</div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                                    {DAYS.map(day => {
                                                        const isSel = selectedDaysArray.includes(day);
                                                        return (
                                                            <button key={day} onClick={() => toggleTourneyDay(tId, day)} className="profile-btn" style={{ background: isSel ? '#3b82f6' : '#f1f5f9', color: isSel ? 'white' : '#64748b', padding: '8px 16px', fontSize: '12px', border: `1px solid ${isSel ? '#2563eb' : '#e2e8f0'}` }}>
                                                                {day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <button onClick={() => generateFixture(tId, t)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '12px 20px', width: '100%', fontSize: '14px' }}>
                                                    ⚔️ SEÇİLİ GÜNLERE OTOMATİK FİKSTÜR ÇEK VE BAŞLAT
                                                </button>
                                            </div>
                                        )}
                                        
                                        {isLocked && (
                                            <div style={{ marginTop: '15px' }}>
                                                <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 800, fontSize: '13px', marginBottom: '10px' }}>✅ Lig fikstürü çekildi, maçlar oynanıyor. (Sorumlu skorları giriyor)</div>
                                                <button onClick={() => handleEndTournament(tId, t)} className="premium-btn badge-glow" style={{ background: '#d4af37', color: '#0f172a', padding: '12px 20px', width: '100%', fontSize: '14px' }}>
                                                    🏆 TURNUVAYI BİTİR VE ŞAMPİYONLARA ÖDÜLLERİ DAĞIT
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* SOHBET KONTROL MERKEZİ */}
        {currentModule === 'admin_chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '15px' }}>💬 Canlı Meydan Kontrolü</h4>
                  <div className="clean-scroll" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', height: '300px', overflowY: 'auto', padding: '15px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.keys(appData?.global_chat || {}).length === 0 ? <div style={{ textAlign: 'center', color: '#64748b' }}>Sohbet boş.</div> : (
                          Object.keys(appData.global_chat).map(k => {
                              const msg = appData.global_chat[k];
                              return (
                                  <div key={k} style={{ background: 'white', padding: '12px 15px', borderRadius: '12px', borderLeft: `4px solid ${msg.type==='admin' ? '#ef4444' : '#3b82f6'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                          <div style={{ fontSize: '12px', fontWeight: 900, color: msg.type==='admin' ? '#ef4444' : '#0f172a' }}>{msg.s} <span style={{color:'#94a3b8', fontWeight:600}}>- {msg.date}</span></div>
                                          <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>{msg.t}</div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                          <button onClick={() => { if(window.confirm('Mesaj silinsin mi?')) db.ref(`mavikent_premium/global_chat/${k}`).remove(); }} className="premium-btn" style={{ background: '#f1f5f9', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>Sil</button>
                                          {msg.type !== 'admin' && msg.type !== 'system' && <button onClick={() => { if(window.confirm(`${msg.s} adlı öğrenciyi sohbetten banlamak istiyor musun?`)) db.ref(`mavikent_premium/banned_chat/${msg.s}`).set(true); }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '12px' }}>Banla</button>}
                                      </div>
                                  </div>
                              )
                          })
                      )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" value={adminChatInput} onChange={e => setAdminChatInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') sendAdminChat(); }} placeholder="Tüm yurda duyuru/mesaj at..." className="elite-input" style={{ flex: 1 }} />
                      <button onClick={sendAdminChat} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '0 20px', fontWeight: 900 }}>YÖNETİCİ MESAJI</button>
                  </div>
               </div>
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
            const key = `${imtihanStudent}/${q.id}`;
            if (isDone) {
              await db.ref(`mavikent_premium/imtihan_progress/${key}`).remove();
              const snap = await db.ref(`mavikent_premium/wallet/${imtihanStudent}`).once('value');
              const cur = snap.val() || 0;
              await db.ref(`mavikent_premium/wallet/${imtihanStudent}`).set(Math.max(0, cur - 3));
              toast(`↩️ Düzeltildi — ${imtihanStudent}`);
            } else {
              await db.ref(`mavikent_premium/imtihan_progress/${key}`).set({ done: true, date: todayStr, subject: imtihanSubject, soru: q.soru, cevap: q.cevap });
              await addCoin(imtihanStudent, 3, `📚 İmtihan Hazırlık: ${q.soru.slice(0, 40)}...`);
              playCoin();
              toast(`✅ +3 M-Coin — ${imtihanStudent}`);
            }
          };

          // Öğrenci seçilmemişse liste göster
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

          // Bu seviye için soru yoksa bilgi mesajı göster
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

          // Konu seçilmemişse ders listesi göster
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

          // Sorular listesi
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
                        cursor: 'pointer', transition: 'all 0.15s',
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

        {/* HEDİYE KODU MERKEZİ */}
        {currentModule === 'admin_codes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 20px rgba(16,185,129,0.3)' }}>
                 <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🎁 Hediye Kodu Üret</h3>
                 <p style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Öğrencilere M-Coin veya süreli indirim sağlayan şifreler oluşturun.</p>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <input type="text" value={newGiftCode.code} onChange={e => setNewGiftCode({...newGiftCode, code: e.target.value})} placeholder="Kod Adı (Örn: BAYRAM50)" className="elite-input" style={{ textTransform: 'uppercase' }} />
                    <select value={newGiftCode.type} onChange={e => setNewGiftCode({...newGiftCode, type: e.target.value})} className="elite-input">
                        <option value="mcoin">🪙 M-Coin Ver</option>
                        <option value="discount">🔥 % İndirim Ver (7 Gün)</option>
                    </select>
                    <input type="number" value={newGiftCode.val} onChange={e => setNewGiftCode({...newGiftCode, val: e.target.value})} placeholder="Miktar / Yüzde" className="elite-input" />
                    <input type="number" value={newGiftCode.uses} onChange={e => setNewGiftCode({...newGiftCode, uses: e.target.value})} placeholder="Kaç Kez Kullanılabilir?" className="elite-input" />
                    <button onClick={() => {
                        if (!newGiftCode.code || !newGiftCode.val) return toast("Tüm alanları doldurun!");
                        db.ref(`mavikent_premium/gift_codes/${newGiftCode.code.toUpperCase().trim()}`).set({
                            type: newGiftCode.type, val: parseInt(newGiftCode.val), uses: parseInt(newGiftCode.uses), usedBy: {}
                        });
                        toast("Kod başarıyla oluşturuldu!"); setNewGiftCode({ code: '', type: 'mcoin', val: '', uses: '1' });
                    }} className="premium-btn" style={{ background: '#0f172a', color: 'white', gridColumn: '1 / -1', padding: '16px' }}>KODU YAYINLA</button>
                 </div>
             </div>

             <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '15px' }}>📋 Üretilmiş Tüm Kodlar ve Kullanım Durumu</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.keys(appData?.gift_codes || {}).length === 0 && <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '14px' }}>Henüz kod üretilmedi.</div>}
                    {Object.keys(appData?.gift_codes || {}).map(k => {
                        const code = appData.gift_codes[k];
                        const usedCount = Object.keys(code.usedBy || {}).length;
                        const remaining = (code.uses || 1) - usedCount;
                        const isFinished = remaining <= 0;
                        return (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isFinished ? '#fef2f2' : '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: `1px solid ${isFinished ? '#fca5a5' : '#e2e8f0'}` }}>
                                <div>
                                   <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', letterSpacing: '1px' }}>{k}</div>
                                   <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                                       {code.type === 'mcoin' ? `🪙 ${code.val} M-Coin` : `🔥 %${code.val} İndirim`}
                                   </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                   <div style={{ fontSize: '14px', fontWeight: 900, color: isFinished ? '#ef4444' : '#10b981' }}>{usedCount} / {code.uses || 1} KULLANILDI</div>
                                   <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, background: '#e2e8f0', padding: '2px 8px', borderRadius: '8px' }}>{Math.max(0, remaining)} ADET KALDI</div>
                                </div>
                                <button onClick={() => { if(window.confirm("Bu kod tamamen silinsin mi?")) db.ref(`mavikent_premium/gift_codes/${k}`).remove(); }} className="premium-btn" style={{ background: '#f1f5f9', color: '#ef4444', padding: '10px 15px' }}>🗑️ SİL</button>
                            </div>
                        )
                    })}
                 </div>
             </div>
          </div>
        )}

        {/* DİSİPLİN VE ÖDÜL YÖNETİMİ */}
        {currentModule === 'admin_discipline' && (() => {
          const rewardCards = appData?.reward_cards || {};
          const penaltyCards = appData?.penalty_cards || {};
          const rewardCount = Object.keys(rewardCards).length;
          const penaltyCount = Object.keys(penaltyCards).length;
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* HERO BANNER */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '32px', borderRadius: '28px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 10px 40px rgba(15,23,42,0.2)' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>📜 Disiplin Kurulu</h3>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, opacity: 0.7 }}>Ödül ve ceza kartlarını yönet, uygula.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setNewRewardCard({ name: '', type: 'mcoin', amount1: '', amount2: '' }); setRewardCardModal(true); }} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '14px 22px', fontWeight: 900 }}>🎁 Ödül Ekle</button>
                <button onClick={() => { setNewPenaltyCard({ name: '', mcoin: 0, banDays: 0, rp: 0 }); setPenaltyCardModal(true); }} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '14px 22px', fontWeight: 900 }}>📜 Ceza Ekle</button>
              </div>
            </div>

            {/* STATS BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Ödül Kartı',  value: rewardCount,                icon: '🎁', color: '#10b981', bg: '#ecfdf5' },
                { label: 'Ceza Kartı',  value: penaltyCount,               icon: '📜', color: '#ef4444', bg: '#fef2f2' },
                { label: 'Toplam Kart', value: rewardCount + penaltyCount, icon: '📊', color: '#3b82f6', bg: '#eff6ff' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: '20px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${stat.color}20` }}>
                  <div style={{ fontSize: '28px' }}>{stat.icon}</div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2 KOLON */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              <div style={{ background: 'white', padding: '28px', borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', background: '#ecfdf5', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🎁</div>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>Ödül Kartları</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{rewardCount} tanımlı kart</div>
                    </div>
                  </div>
                  <button onClick={() => { setNewRewardCard({ name: '', type: 'mcoin', amount1: '', amount2: '' }); setRewardCardModal(true); }} className="premium-btn" style={{ background: '#ecfdf5', color: '#059669', padding: '10px 18px', fontWeight: 900, fontSize: '13px' }}>+ Ekle</button>
                </div>
                {rewardCount === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎁</div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Henüz ödül kartı oluşturulmadı.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(rewardCards).map(([id, card]) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f0fdf4', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid #bbf7d0' }}>
                        <div style={{ width: '38px', height: '38px', background: '#d1fae5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎁</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, color: '#065f46', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                          <div style={{ fontSize: '11px', color: '#059669', fontWeight: 800, marginTop: '2px' }}>{card.type?.toUpperCase()}</div>
                        </div>
                        <button onClick={() => { if(window.confirm('Ödülü silmek istediğine emin misin?')) db.ref(`mavikent_premium/reward_cards/${id}`).remove(); }} style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: 'white', padding: '28px', borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', background: '#fef2f2', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📜</div>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>Ceza Kartları</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{penaltyCount} tanımlı kart</div>
                    </div>
                  </div>
                  <button onClick={() => { setNewPenaltyCard({ name: '', mcoin: 0, banDays: 0, rp: 0 }); setPenaltyCardModal(true); }} className="premium-btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 18px', fontWeight: 900, fontSize: '13px' }}>+ Ekle</button>
                </div>
                {penaltyCount === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📜</div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Henüz ceza kartı oluşturulmadı.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(penaltyCards).map(([k, card]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff5f5', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid #fca5a5' }}>
                        <div style={{ width: '38px', height: '38px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📜</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, color: '#7f1d1d', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {card.mcoin > 0 && <span>-{card.mcoin} M-Coin</span>}
                            {card.banDays > 0 && <span>{card.banDays}g Ban</span>}
                            {card.rp > 0 && <span>-{card.rp} RP</span>}
                          </div>
                        </div>
                        <button onClick={() => { if(window.confirm('Bu ceza kartı tamamen silinsin mi?')) db.ref(`mavikent_premium/penalty_cards/${k}`).remove(); }} className="premium-btn" style={{ background: 'white', color: '#ef4444', padding: '6px 12px', border: '1px solid #fca5a5', flexShrink: 0 }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ÖDÜL KARTI OLUŞTURMA MODALİ */}
            {rewardCardModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setRewardCardModal(false)}>
                <div style={{ background: 'white', borderRadius: '28px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#0f172a', fontSize: '20px' }}>🎁 Yeni Ödül Kartı</h3>
                  <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Öğrencilere atanacak dijital ödülleri tanımlayın.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="text" placeholder="Ödül Adı (Örn: Haftanın Yıldızı)" value={newRewardCard.name} onChange={e => setNewRewardCard({...newRewardCard, name: e.target.value})} className="elite-input" />
                    <select value={newRewardCard.type} onChange={e => setNewRewardCard({...newRewardCard, type: e.target.value, amount1: '', amount2: ''})} className="elite-input" style={{ fontWeight: 900, color: '#0f172a' }}>
                      <option value="mcoin">💰 Doğrudan M-Coin & RP Yükle</option>
                      <option value="joker">🎫 Altın Bilet (Oyun Odası Jokeri)</option>
                      <option value="box">📦 Kutu Açma Bileti (Standart/Mega/Elit)</option>
                      <option value="discount">📉 Oyun Odası İndirim Kuponu</option>
                      <option value="bounty">🤝 Kralın İkramı (Arkadaşlarına Para Gönder)</option>
                    </select>
                    {newRewardCard.type === 'mcoin' && (<><input type="number" placeholder="M-Coin Miktarı" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" /><input type="number" placeholder="RP Miktarı" value={newRewardCard.amount2} onChange={e => setNewRewardCard({...newRewardCard, amount2: e.target.value})} className="elite-input" /></>)}
                    {newRewardCard.type === 'joker' && (<input type="number" placeholder="Kaç Adet Bilet Verilecek?" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />)}
                    {newRewardCard.type === 'box' && (<><input type="number" placeholder="Açılış Hakkı Adedi" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" /><select value={newRewardCard.amount2} onChange={e => setNewRewardCard({...newRewardCard, amount2: e.target.value})} className="elite-input"><option value="">Kutu Tipi Seçin</option><option value="1">Standart Kutu</option><option value="2">Mega Kutu</option><option value="3">Elit Kutu</option></select></>)}
                    {newRewardCard.type === 'discount' && (<input type="number" placeholder="İndirim Yüzdesi (Örn: 50)" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" />)}
                    {newRewardCard.type === 'bounty' && (<><input type="number" placeholder="Kaç Kişiye?" value={newRewardCard.amount1} onChange={e => setNewRewardCard({...newRewardCard, amount1: e.target.value})} className="elite-input" /><input type="number" placeholder="Kişi Başı M-Coin?" value={newRewardCard.amount2} onChange={e => setNewRewardCard({...newRewardCard, amount2: e.target.value})} className="elite-input" /></>)}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button onClick={() => setRewardCardModal(false)} className="premium-btn" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '16px' }}>İptal</button>
                    <button onClick={() => { handleCreateRewardCard(); setRewardCardModal(false); }} className="premium-btn" style={{ flex: 2, background: '#0f172a', color: 'white', padding: '16px' }}>ÖDÜL KARTINI SİSTEME EKLE</button>
                  </div>
                </div>
              </div>
            )}

            {/* CEZA KARTI OLUŞTURMA MODALİ */}
            {penaltyCardModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setPenaltyCardModal(false)}>
                <div style={{ background: 'white', borderRadius: '28px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#0f172a', fontSize: '20px' }}>📜 Yeni Ceza Kartı</h3>
                  <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Standart ihlal ve ceza kurallarını tanımlayın.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="text" value={newPenaltyCard.name} onChange={e => setNewPenaltyCard({...newPenaltyCard, name: e.target.value})} placeholder="Ceza Adı (Örn: İzinsiz Dışarı Çıkma)" className="elite-input" />
                    <input type="number" value={newPenaltyCard.mcoin} onChange={e => setNewPenaltyCard({...newPenaltyCard, mcoin: e.target.value})} placeholder="M-Coin Kesintisi (Örn: 100)" className="elite-input" />
                    <input type="number" value={newPenaltyCard.banDays} onChange={e => setNewPenaltyCard({...newPenaltyCard, banDays: e.target.value})} placeholder="Oyun Odası Ban (Gün)" className="elite-input" />
                    <input type="number" value={newPenaltyCard.rp} onChange={e => setNewPenaltyCard({...newPenaltyCard, rp: e.target.value})} placeholder="RP Kesintisi (Örn: 5)" className="elite-input" />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button onClick={() => setPenaltyCardModal(false)} className="premium-btn" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '16px' }}>İptal</button>
                    <button onClick={() => { handleCreatePenaltyCard(); setPenaltyCardModal(false); }} className="premium-btn" style={{ flex: 2, background: '#0f172a', color: 'white', padding: '16px' }}>CEZA KARTINI SİSTEME EKLE</button>
                  </div>
                </div>
              </div>
            )}

          </div>
          );
        })()}


          {/* ÖĞRENCİ YÖNETİMİ */}
        {currentModule === 'admin_students' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && newStudentName) { db.ref('mavikent_premium/roster').set([...roster, newStudentName.trim()]); setNewStudentName(''); }}} placeholder="Yeni Öğrenci Adı Soyadı" className="elite-input" style={{ flex: 1 }} />
              <button onClick={() => { if(newStudentName) { db.ref('mavikent_premium/roster').set([...roster, newStudentName.trim()]); setNewStudentName(''); }}} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '0 24px' }}>EKLE</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {roster.map(name => {
                const coins = appData?.wallet?.[name] || 0;
                const sinif = appData?.student_classes?.[name] || '';
                const elite = isElite(name);
                return (
                  <div key={name} onClick={() => {
                    const creds = appData?.student_credentials?.[name] || {};
                    setStudentEdit({ username: creds.username || '', password: creds.password || '', recoveryPin: creds.recoveryPin || '', sinif, mcoin: String(coins) });
                    setShowStudentPassword(false);
                    setStudentModal(name);
                  }} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: elite ? '2px solid #d4af37' : '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>{elite ? '👑' : '🎓'}</div>
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px', marginBottom: '6px', lineHeight: 1.3 }}>{name}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6' }}>🪙 {coins} M-Coin</div>
                    {sinif && <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>{sinif}</div>}
                  </div>
                );
              })}
            </div>

            {studentModal && (() => {
              const name = studentModal;
              return (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setStudentModal(null)}>
                  <div style={{ background: 'white', borderRadius: '28px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ width: '52px', height: '52px', background: isElite(name) ? '#fffbeb' : '#eff6ff', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{isElite(name) ? '👑' : '🎓'}</div>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '20px' }}>{name}</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>🪙 {appData?.wallet?.[name] || 0} M-Coin</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>KULLANICI ADI</div>
                        <input type="text" value={studentEdit.username} onChange={e => setStudentEdit({...studentEdit, username: e.target.value})} className="elite-input" placeholder="Kullanıcı adı" style={{ padding: '12px' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>ŞİFRE</div>
                        <div style={{ position: 'relative' }}>
                          <input type={showStudentPassword ? 'text' : 'password'} value={studentEdit.password} onChange={e => setStudentEdit({...studentEdit, password: e.target.value})} className="elite-input" placeholder="Şifre" style={{ padding: '12px', paddingRight: '44px', width: '100%', boxSizing: 'border-box' }} />
                          <button onClick={() => setShowStudentPassword(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b', padding: '4px', lineHeight: 1 }} title={showStudentPassword ? 'Gizle' : 'Göster'}>
                            {showStudentPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>SINIF</div>
                        <select value={studentEdit.sinif} onChange={e => setStudentEdit({...studentEdit, sinif: e.target.value})} className="elite-input" style={{ padding: '12px' }}>
                          <option value="">Seç</option>{classList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>KURTARMA PIN</div>
                        <input type="text" maxLength="4" value={studentEdit.recoveryPin} onChange={e => setStudentEdit({...studentEdit, recoveryPin: e.target.value})} className="elite-input" placeholder="4 haneli PIN" style={{ padding: '12px', letterSpacing: '4px', textAlign: 'center' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>M-COİN BAKİYESİ</div>
                      <input type="text" inputMode="numeric" value={studentEdit.mcoin} onChange={e => { const r = e.target.value; if(r === '' || r === '-' || /^-?\d*$/.test(r)) setStudentEdit({...studentEdit, mcoin: r}); }} className="elite-input" placeholder="Bakiye" style={{ padding: '12px', fontWeight: 900, fontSize: '18px', textAlign: 'center', color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => { if(window.confirm(`${name} silinsin mi?`)) { db.ref('mavikent_premium/roster').set(roster.filter(n => n !== name)); setStudentModal(null); }}} className="premium-btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '14px 16px' }}>🗑️</button>
                      <button onClick={() => setStudentModal(null)} className="premium-btn" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '14px' }}>İptal</button>
                      <button onClick={() => {
                        const updates = {};
                        updates[`student_credentials/${name}/username`] = studentEdit.username;
                        updates[`student_credentials/${name}/password`] = studentEdit.password;
                        if(studentEdit.recoveryPin) updates[`student_credentials/${name}/recoveryPin`] = studentEdit.recoveryPin;
                        if(studentEdit.sinif) updates[`student_classes/${name}`] = studentEdit.sinif;
                        const newCoins = parseInt(studentEdit.mcoin) || 0;
                        const oldCoins = appData?.wallet?.[name] || 0;
                        updates[`wallet/${name}`] = newCoins;
                        if(newCoins !== oldCoins) updates[`transactions/${name}/txn_admin_${Date.now()}`] = { desc: 'Yönetici Bakiye Düzenlemesi', amt: newCoins - oldCoins, date: new Date().toLocaleString('tr-TR') };
                        db.ref('mavikent_premium').update(updates);
                        toast('✅ Öğrenci bilgileri güncellendi!');
                        setStudentModal(null);
                      }} className="premium-btn" style={{ flex: 2, background: '#0f172a', color: 'white', padding: '14px', fontWeight: 900 }}>💾 KAYDET</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* MARKET YÖNETİMİ */}
        {currentModule === 'admin_market' && (() => {
          const products = appData?.market_products || {};
          const productKeys = Object.keys(products);
          const totalProducts = productKeys.length;
          const outOfStock = productKeys.filter(k => products[k].stock === 0).length;
          const inStock = totalProducts - outOfStock;

          const typeConfig = {
            normal:     { label: 'Normal',      color: '#64748b', bg: '#f1f5f9' },
            ticket:     { label: 'Çekiliş',     color: '#7c3aed', bg: '#f5f3ff' },
            bundle:     { label: 'Paket',       color: '#0369a1', bg: '#e0f2fe' },
            gift:       { label: 'Hediye',      color: '#be185d', bg: '#fce7f3' },
            avatar:     { label: 'Avatar',      color: '#0f766e', bg: '#ccfbf1' },
            multiplier: { label: '2X Kart',     color: '#b45309', bg: '#fef3c7' },
            streak:     { label: 'Kalkan',      color: '#15803d', bg: '#dcfce7' },
            title:      { label: 'Ünvan',       color: '#9333ea', bg: '#f3e8ff' },
            frame:      { label: 'Çerçeve',     color: '#c2410c', bg: '#fff7ed' },
          };

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ÖZET STATS BARI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Toplam Ürün', value: totalProducts, icon: '📦', color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Stokta Var',  value: inStock,       icon: '✅', color: '#10b981', bg: '#ecfdf5' },
                { label: 'Tükendi',     value: outOfStock,    icon: '🚫', color: '#ef4444', bg: '#fef2f2' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: '20px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${stat.color}20` }}>
                  <div style={{ fontSize: '28px' }}>{stat.icon}</div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ANA 2 SÜTUN: FORM + ARAÇLAR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

              {/* SOL: ÜRÜN EKLEME / GÜNCELLEME FORMU */}
              <div style={{ background: 'white', padding: '32px', borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: editProductKey ? '#fff7ed' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    {editProductKey ? '✏️' : '➕'}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{editProductKey ? 'Ürünü Güncelle' : 'Yeni Ürün Ekle'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tüm alanları doldurun</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ürün Adı" className="elite-input" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" placeholder="Fiyat (M-Coin)" className="elite-input" />
                    <input value={newProduct.icon} onChange={e => setNewProduct({...newProduct, icon: e.target.value})} placeholder="Emoji 📦" className="elite-input" style={{ textAlign: 'center', fontSize: '20px' }} />
                  </div>
                  <input value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} type="number" placeholder="Stok Adedi (Boş bırakın = Sınırsız)" className="elite-input" />
                  <select value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} className="elite-input">
                    <option value="normal">🍔 Normal Ürün</option>
                    <option value="ticket">🎟️ Çekiliş Bileti</option>
                    <option value="bundle">🎁 Paket (Bundle)</option>
                    <option value="gift">🎁 Hediye Ürünü</option>
                    <option value="avatar">👤 Profil Avatarı</option>
                    <option value="multiplier">⚡ 2X Puan Kartı</option>
                    <option value="streak">🛡️ Seri Kalkanı</option>
                    <option value="title">🎖️ Profil Ünvanı</option>
                    <option value="frame">🖼️ Avatar Çerçevesi</option>
                  </select>
                </div>

                {newProduct.type === 'bundle' && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1', marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Paket İçeriğini Seçin:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {productKeys.filter(k => products[k].type !== 'bundle').map(k => {
                        const p = products[k]; const isSelected = bundleSelection.includes(p.n);
                        return (
                          <div key={k} onClick={() => setBundleSelection(isSelected ? bundleSelection.filter(n => n !== p.n) : [...bundleSelection, p.n])}
                            style={{ background: isSelected ? '#10b981' : '#f1f5f9', color: isSelected ? 'white' : '#64748b', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                            {p.i} {p.n}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={handleAddProduct} className="premium-btn" style={{ flex: 1, background: editProductKey ? '#f59e0b' : '#10b981', color: 'white', padding: '16px', fontSize: '15px', fontWeight: 900 }}>
                    {editProductKey ? '💾 GÜNCELLE' : '➕ ÜRÜN EKLE'}
                  </button>
                  {editProductKey && (
                    <button onClick={() => { setEditProductKey(null); setNewProduct({ name: '', price: '', icon: '📦', type: 'normal', stock: '' }); setBundleSelection([]); }}
                      className="btn-iptal" style={{ padding: '16px 20px' }}>İPTAL</button>
                  )}
                </div>
              </div>

              {/* SAĞ: İHALE + İMECE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* İHALE PANELİ */}
                <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)', padding: '28px', borderRadius: '28px', border: '1px solid #fde68a', boxShadow: '0 8px 24px rgba(251,191,36,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px' }}>🔨</div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: '#b45309' }}>Haftalık İhale</div>
                      <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Açık Artırma Sistemi</div>
                    </div>
                    {appData?.auction?.active && (
                      <div style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 900 }}>CANLI</div>
                    )}
                  </div>
                  {appData?.auction?.active ? (
                    <div>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{appData.auction.item}</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#b45309', marginTop: '6px' }}>{appData.auction.currentBid} M-Coin</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>En yüksek teklif: {appData.auction.highestBidder || 'Henüz teklif yok'}</div>
                      </div>
                      <button onClick={handleEndAuction} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '14px', width: '100%', fontWeight: 900 }}>İHALEYİ BİTİR & TESLİM ET</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input type="text" id="aucItem" placeholder="İhale Ürünü (Örn: Sınırsız Ev İzni)" className="elite-input" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                        <input type="number" id="aucPrice" placeholder="Başlangıç Fiyatı (M)" className="elite-input" />
                        <button onClick={handleStartAuction} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '16px 20px', fontWeight: 900 }}>BAŞLAT</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* İMECE PANELİ */}
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)', padding: '28px', borderRadius: '28px', border: '1px solid #bfdbfe', boxShadow: '0 8px 24px rgba(59,130,246,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px' }}>🤝</div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: '#1e40af' }}>İmece (Ortak Alım)</div>
                      <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>Toplu fon sistemi</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="text" value={newGroupBuy.name} onChange={e => setNewGroupBuy({...newGroupBuy, name: e.target.value})} placeholder="Örn: Tüm Yurda Çiğköfte" className="elite-input" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input type="number" value={newGroupBuy.totalCost} onChange={e => setNewGroupBuy({...newGroupBuy, totalCost: e.target.value})} placeholder="Toplam Maliyet (M)" className="elite-input" />
                      <input type="number" value={newGroupBuy.maxP} onChange={e => setNewGroupBuy({...newGroupBuy, maxP: e.target.value})} placeholder="Kaç Kişi?" className="elite-input" />
                    </div>
                    <button onClick={handleCreateGroupBuy} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '14px', fontWeight: 900 }}>İMECE BAŞLAT</button>
                  </div>
                </div>

              </div>
            </div>

            {/* ÜRÜN KATALOĞU */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>Ürün Kataloğu</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{totalProducts} ürün listeleniyor</div>
                </div>
              </div>

              {productKeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>Henüz ürün eklenmemiş</div>
                  <div style={{ fontSize: '13px', marginTop: '6px' }}>Soldaki formu kullanarak ilk ürünü ekleyin.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {productKeys.map(key => {
                    const p = products[key];
                    const isOutOfStock = p.stock === 0;
                    const stockText = p.stock !== undefined ? (p.stock > 0 ? `${p.stock} adet` : 'TÜKENDİ') : 'Sınırsız';
                    const tConf = typeConfig[p.type] || typeConfig.normal;
                    return (
                      <div key={key} style={{
                        background: isOutOfStock ? '#fef2f2' : '#fafafa',
                        borderRadius: '20px',
                        border: `1.5px solid ${isOutOfStock ? '#fca5a5' : '#e2e8f0'}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {isOutOfStock && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>TÜKENDİ</div>
                        )}

                        {/* ÜRÜN İKONU */}
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                          {p.i}
                        </div>

                        {/* ÜRÜN BİLGİSİ */}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>{p.n}</div>
                          {p.type === 'bundle' && p.bundleItems?.length > 0 && (
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{p.bundleItems.join(', ')}</div>
                          )}
                        </div>

                        {/* ETIKETLER */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <div style={{ background: tConf.bg, color: tConf.color, padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800 }}>{tConf.label}</div>
                          <div style={{ background: isOutOfStock ? '#fef2f2' : '#ecfdf5', color: isOutOfStock ? '#ef4444' : '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800 }}>{stockText}</div>
                        </div>

                        {/* FİYAT + AKSIYONLAR */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>{p.p} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>M</span></div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => editProduct(key, p)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px', fontWeight: 800, transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                              onMouseOver={e => { e.currentTarget.style.background='#3b82f6'; e.currentTarget.style.color='white'; }} onMouseOut={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#3b82f6'; }}>
                              ✏️
                            </button>
                            <button onClick={() => { if(window.confirm(`"${p.n}" silinsin mi?`)) db.ref(`mavikent_premium/market_products/${key}`).remove(); }}
                              style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px', fontWeight: 800, transition: 'all 0.2s' }}
                              onMouseOver={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='white'; }} onMouseOut={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'; }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
          );
        })()}

        {/* TESLİMAT YÖNETİMİ (3'LÜ BİRİKTİRME DESTEKLİ) */}
        {currentModule === 'admin_teslimat' && (() => {
            const allDeliveries = Object.keys(appData?.deliveries || {}).map(k => ({ key: k, ...appData.deliveries[k] })).reverse();
            const waitDeliveries = allDeliveries.filter(d => d.st === 'wait');
            const doneDeliveries = allDeliveries.filter(d => d.st === 'done');

            const studentGroups = {};
            waitDeliveries.forEach(d => {
                if (!studentGroups[d.s]) {
                    studentGroups[d.s] = { normal: [], collections: {} };
                }
                const itemNameUpper = String(d.i || d.n).toUpperCase();
                const matchedCollection = exactCollections.find(cId => itemNameUpper.includes(cId));
                
                if (matchedCollection) {
                    if (!studentGroups[d.s].collections[matchedCollection]) studentGroups[d.s].collections[matchedCollection] = [];
                    studentGroups[d.s].collections[matchedCollection].push(d);
                } else {
                    studentGroups[d.s].normal.push(d);
                }
            });

            return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)', padding: '32px', borderRadius: '28px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 10px 40px rgba(3,105,161,0.25)' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>📦 Teslimat Merkezi</h3>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, opacity: 0.7 }}>Market siparişlerini yönet ve onayla.</p>
              </div>
              {waitDeliveries.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleBulkDeliveryAction('approve')} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '12px 20px', fontWeight: 900 }}>✅ Tümünü Onayla</button>
                  <button onClick={() => handleBulkDeliveryAction('refund')} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '12px 20px', fontWeight: 900 }}>💰 İadeli İptal</button>
                  <button onClick={() => handleBulkDeliveryAction('delete')} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '12px 20px', fontWeight: 900 }}>🗑️ Tümünü Sil</button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Bekleyen',       value: waitDeliveries.length,  icon: '⏳', color: '#f59e0b', bg: '#fefce8' },
                { label: 'Teslim Edildi',  value: doneDeliveries.length,  icon: '✅', color: '#10b981', bg: '#ecfdf5' },
                { label: 'Toplam Sipariş', value: allDeliveries.length,   icon: '📦', color: '#3b82f6', bg: '#eff6ff' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: '20px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${stat.color}20` }}>
                  <div style={{ fontSize: '28px' }}>{stat.icon}</div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', padding: '28px', borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                 <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                   <button onClick={() => setDeliveryTab('wait')} className="premium-btn" style={{ flex: 1, padding: '16px', background: deliveryTab === 'wait' ? '#0f172a' : '#f1f5f9', color: deliveryTab === 'wait' ? 'white' : '#64748b', fontSize: '15px' }}>BEKLEYENLER ({waitDeliveries.length})</button>
                   <button onClick={() => setDeliveryTab('done')} className="premium-btn" style={{ flex: 1, padding: '16px', background: deliveryTab === 'done' ? '#10b981' : '#f1f5f9', color: deliveryTab === 'done' ? 'white' : '#64748b', fontSize: '15px' }}>ONAYLANMIŞ ({doneDeliveries.length})</button>
                 </div>

                 {deliveryTab === 'wait' ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                         {Object.keys(studentGroups).length === 0 ? (
                             <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: 700 }}>Bekleyen sipariş yok.</div>
                         ) : (
                             Object.keys(studentGroups).map(student => {
                                 const { normal, collections } = studentGroups[student];
                                 return (
                                     <div key={student} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                         <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                             <span style={{ fontSize: '24px' }}>👤</span> {student}
                                         </div>

                                         {/* ÖZEL KOLEKSİYON (3'LÜ) ÜRÜNLERİ */}
                                         {Object.keys(collections).map(cName => {
                                             const items = collections[cName];
                                             const count = items.length;
                                             const isReady = count >= 3;
                                             const cObj = collectionTypes.find(c => c.id === cName) || { icon: '🎁' };
                                             
                                             return (
                                                 <div key={cName} style={{ background: isReady ? '#ecfdf5' : '#fffbeb', border: `1px solid ${isReady ? '#10b981' : '#f59e0b'}`, borderRadius: '16px', padding: '15px', marginBottom: '10px' }}>
                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                         <div style={{ fontWeight: 900, color: isReady ? '#047857' : '#b45309', fontSize: '15px' }}>{cObj.icon} {cName} ({count}/3)</div>
                                                         {isReady ? (
                                                             <button onClick={() => handleDeliverCollection(student, cName, items.map(i=>i.key))} className="premium-btn badge-glow" style={{ background: '#10b981', color: 'white', padding: '8px 16px', fontSize: '12px' }}>🏆 ÖDÜLÜ VER</button>
                                                         ) : (
                                                             <div style={{ display: 'flex', gap: '5px' }}>
                                                                 <button onClick={() => handleCancelCollection(student, items.map(i=>i.key), items, true)} className="premium-btn" style={{ background: 'white', color: '#f59e0b', border: '1px solid #fcd34d !important', padding: '6px 12px', fontSize: '11px' }}>İade</button>
                                                                 <button onClick={() => handleCancelCollection(student, items.map(i=>i.key), items, false)} className="premium-btn" style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5 !important', padding: '6px 12px', fontSize: '11px' }}>Sil</button>
                                                             </div>
                                                         )}
                                                     </div>
                                                     <div style={{ display: 'flex', gap: '6px' }}>
                                                         {[1,2,3].map(i => (<div key={i} style={{ flex: 1, height: '8px', borderRadius: '4px', background: i <= count ? (isReady ? '#10b981' : '#f59e0b') : '#e2e8f0' }}></div>))}
                                                     </div>
                                                 </div>
                                             )
                                         })}

                                         {/* NORMAL ÜRÜNLER (TOST, İZİN VS) */}
                                         {normal.map(ord => {
                                             const isLottery = ord.i && ord.i.includes("(Çekiliş)");
                                             const isScratch = ord.i && ord.i.includes("(Kazı Kazan)");
                                             const isBox = ord.n && ord.n.includes("(Kutudan)");
                                             let badgeText = isLottery ? '🎰 ÇEKİLİŞ' : isScratch ? '🪙 KAZI KAZAN' : isBox ? '🎁 KUTU' : '🛍️ MARKET';
                                             let badgeColor = isLottery ? '#8b5cf6' : isScratch ? '#059669' : isBox ? '#f59e0b' : '#3b82f6';
                                             
                                             return (
                                                 <div key={ord.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '12px', borderLeft: `4px solid ${badgeColor}`, marginBottom: '8px' }}>
                                                     <div>
                                                         <div style={{ fontWeight: 800, fontSize: '14px', color: '#334155', marginBottom: '4px' }}>{ord.i || ord.n}</div>
                                                         <span style={{ background: badgeColor, color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{badgeText}</span>
                                                     </div>
                                                     <div style={{ display: 'flex', gap: '5px' }}>
                                                         <button onClick={() => handleApproveDelivery(ord.key, ord)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '6px 12px', fontSize: '12px' }}>✅ Ver</button>
                                                         <button onClick={() => handleCancelDelivery(ord.key, ord, true)} className="premium-btn" style={{ background: '#f1f5f9', color: '#f59e0b', padding: '6px 12px', fontSize: '12px' }}>💰 İade</button>
                                                         <button onClick={() => handleCancelDelivery(ord.key, ord, false)} className="premium-btn" style={{ background: '#f1f5f9', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>🗑️ Sil</button>
                                                     </div>
                                                 </div>
                                             )
                                         })}
                                     </div>
                                 )
                             })
                         )}
                     </div>
                 ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                         {doneDeliveries.map(item => (
                             <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '16px', borderLeft: '4px solid #10b981', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                 <div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>{item.s}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{item.i || item.n} <span style={{fontSize:'11px', color:'#94a3b8'}}>({item.date})</span></div>
                                 </div>
                                 <button onClick={() => db.ref(`mavikent_premium/deliveries/${item.key}/st`).set('wait')} className="premium-btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '8px 15px', fontSize: '12px' }}>Geri Al</button>
                             </div>
                         ))}
                         {doneDeliveries.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontWeight: 700 }}>Geçmiş işlem bulunmuyor.</div>}
                     </div>
                 )}
            </div>
          </div>
            );
        })()}

        {/* LİG YÖNETİMİ */}
        {currentModule === 'admin_lig' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fffbeb', border: '2px solid #fde047', padding: '30px', borderRadius: '24px' }}>
               <h4 style={{ color: '#b45309', marginTop: 0, fontWeight: 900, fontSize: '18px' }}>👑 ELİT LİG (Terfi Alanlar)</h4>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                 {roster.filter(isElite).map(n => <div key={n} onClick={() => db.ref(`mavikent_premium/student_tiers/${n}`).set('standard')} className="premium-hover" style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, color:'#92400e', cursor: 'pointer' }}>{n} 👑</div>)}
               </div>
            </div>
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
               <h4 style={{ color: '#0f172a', marginTop: 0, fontWeight: 900, fontSize: '18px' }}>🎯 STANDART LİG (Adaylar)</h4>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                 {roster.filter(n => !isElite(n)).map(n => <div key={n} onClick={() => db.ref(`mavikent_premium/student_tiers/${n}`).set('elite')} className="premium-hover" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, color:'#334155', cursor: 'pointer' }}>{n} ⬆️</div>)}
               </div>
            </div>
          </div>
        )}

        {/* KLAN YÖNETİMİ */}
        {currentModule === 'admin_clans' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', padding: '30px', borderRadius: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(245,158,11,0.3)', flexWrap: 'wrap', gap: '15px' }}>
                 <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 900 }}>🚩 KLAN YÖNETİMİ</h3>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Savaşı bitir ve şampiyon klana 60'ar M-Coin dağıt.</p>
                 </div>
                 <button onClick={handleEndClanWar} className="premium-btn" style={{ background: 'white', color: '#b45309', padding: '16px 24px', fontWeight: 900 }}>🏆 SAVAŞI BİTİR & ÖDÜL DAĞIT</button>
              </div>

              <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                 <h4 style={{ marginTop: 0, color: '#0f172a', fontWeight: 900, fontSize: '18px', marginBottom: '20px' }}>➕ Yeni Klan Oluştur</h4>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <input type="text" value={newAdminClan.icon} onChange={e => setNewAdminClan({...newAdminClan, icon: e.target.value})} placeholder="🛡️" className="elite-input" style={{ width: '70px', textAlign: 'center' }} maxLength="2" />
                    <input type="text" value={newAdminClan.name} onChange={e => setNewAdminClan({...newAdminClan, name: e.target.value})} placeholder="Klan Adı" className="elite-input" />
                    <input type="text" value={newAdminClan.tag} onChange={e => setNewAdminClan({...newAdminClan, tag: e.target.value})} placeholder="TAG (Örn: BJK)" className="elite-input" />
                    <select value={newAdminClan.leader} onChange={e => setNewAdminClan({...newAdminClan, leader: e.target.value})} className="elite-input">
                        <option value="">Lider Seç</option>{roster.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button onClick={handleAdminCreateClan} className="premium-btn" style={{ background: '#3b82f6', color: 'white' }}>KUR</button>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                 {Object.keys(appData?.clans || {}).length === 0 && <div style={{ color: '#64748b', fontWeight: 700, padding: '20px' }}>Sistemde aktif klan bulunmuyor.</div>}
                 {Object.keys(appData?.clans || {}).map((cId) => {
                    const c = appData.clans[cId];
                    let warScore = 0;
                    (c.members || []).forEach(m => { if(appData?.clan_war_participants?.[m]) warScore += Number(appData?.season_score?.[m] || 0); });
                    return (
                        <div key={cId} style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '30px' }}>{c.icon}</span><div><div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{c.name} <span style={{fontSize:'12px', background:'#f1f5f9', padding:'2px 6px', borderRadius:'6px'}}>{c.tag}</span></div><div style={{fontSize:'12px', color:'#64748b', fontWeight:700}}>Savaş Puanı: {warScore}</div></div></div>
                              <button onClick={() => handleAdminDeleteClan(cId)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '10px 16px', fontSize: '12px' }}>SİL</button>
                           </div>
                           <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', fontWeight: 600, background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                              <span style={{ color: '#0f172a', fontWeight: 800 }}>Üyeler:</span> {(c.members || []).join(', ') || 'Yok'}
                           </div>
                        </div>
                    )
                 })}
              </div>
           </div>
        )}

        {/* KURUMSAL KİMLİK */}
        {currentModule === 'admin_settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {!adminSettingsView ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div onClick={() => setAdminSettingsView('kimlik')} className="card-hover" style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
                            <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>Kimlik & Şifreler</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Yönetici ve personel Şifrelerini düzenle.</p>
                        </div>
                        <div onClick={() => setAdminSettingsView('points')} className="card-hover" style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
                            <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>Puanlama Yapılandırması</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Puan değerlerini kategorilere göre ayarla.</p>
                        </div>
                        <div onClick={() => setAdminSettingsView('logo')} className="card-hover" style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏢</div>
                            <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>Kurumsal Logo</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Kurumun logosunu yükle veya güncelle.</p>
                        </div>
                    </div>
                ) : adminSettingsView === 'kimlik' ? (
                    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
                            <h3 style={{ margin: '0 0 6px 0', fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>Kimlik & Şifreler</h3>
                            <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Yönetici ve personel giriş Şifrelerini güncelleyin.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1.5px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.5px' }}>🔑 YÖNETİCİ ŞİFRESİ</div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, marginBottom: '10px', textAlign: 'center' }}>Mevcut: {appData?.settings?.admin_pin || '1507'}</div>
                                <input type="text" value={pinInputs.admin_pin} onChange={e => setPinInputs({...pinInputs, admin_pin: e.target.value})} className="elite-input" placeholder="Yeni yönetici şifresi" style={{ textAlign: 'center', fontWeight: 900, fontSize: '18px', letterSpacing: '4px' }} />
                            </div>
                            <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1.5px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: 900, color: '#64748b', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.5px' }}>🔐 PERSONEL ŞİFRESİ</div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, marginBottom: '10px', textAlign: 'center' }}>Mevcut: {appData?.settings?.staff_pin || '1234'}</div>
                                <input type="text" value={pinInputs.staff_pin} onChange={e => setPinInputs({...pinInputs, staff_pin: e.target.value})} className="elite-input" placeholder="Yeni personel şifresi" style={{ textAlign: 'center', fontWeight: 900, fontSize: '18px', letterSpacing: '4px' }} />
                            </div>
                        </div>
                        <button onClick={savePins} className="premium-btn" style={{ width: '100%', background: '#0f172a', color: 'white', padding: '18px', fontSize: '16px' }}>🔒 ŞİFRELERİ GÜNCELLE</button>

                        {/* Kayıtlı Hızlı Giriş Cihazları */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1.5px solid #e2e8f0', marginTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '20px' }}>🪪</span>
                                <div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>Kayıtlı Hızlı Giriş Cihazları</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Windows Hello / Biyometrik ile giriş yetkisi verilen cihazlar</div>
                                </div>
                            </div>
                            {Object.keys(appData?.settings?.trusted_devices || {}).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                                    Henüz kayıtlı cihaz yok
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Object.entries(appData?.settings?.trusted_devices || {}).map(([id, device]) => (
                                        <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', background: device.role === 'admin' ? '#fffbeb' : '#f0fdfa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                    {device.role === 'admin' ? '👑' : '👔'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{device.deviceName}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                                        {device.role === 'admin' ? 'Yönetici' : 'Personel'} · {device.registeredAt}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Bu cihazın hızlı giriş yetkisini kaldırmak istiyor musunuz?')) {
                                                        await db.ref(`mavikent_premium/settings/trusted_devices/${id}`).remove();
                                                        toast('✅ Cihaz listeden kaldırıldı.');
                                                    }
                                                }}
                                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}
                                            >
                                                Kaldır
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : adminSettingsView === 'points' ? (
                    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚖️</div>
                            <h3 style={{ margin: '0 0 6px 0', fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>Puanlama Yapılandırması</h3>
                            <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Düzenlemek istediğin kategoriye tıkla.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {POINTS_CATEGORIES.map(cat => (
                                <div key={cat.id} onClick={() => openPointsModal(cat.id)} className="card-hover"
                                    style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1.5px solid ${cat.bg}`, cursor: 'pointer', transition: 'all 0.3s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', background: cat.bg, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{cat.icon}</div>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>{cat.label}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{cat.desc}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {cat.items.map(item => {
                                            const val = pointsConfig[item.key];
                                            const isPos = Number(val) > 0;
                                            const isNeg = Number(val) < 0;
                                            return (
                                                <div key={item.key} style={{ background: isPos ? '#ecfdf5' : isNeg ? '#fef2f2' : '#f8fafc', border: `1px solid ${isPos ? '#6ee7b7' : isNeg ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px', padding: '4px 10px', fontSize: '13px', fontWeight: 800, color: isPos ? '#047857' : isNeg ? '#b91c1c' : '#64748b' }}>
                                                    {item.icon} {isPos ? '+' : ''}{val}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* MODAL */}
                        {pointsModal && (() => {
                            const cat = POINTS_CATEGORIES.find(c => c.id === pointsModal);
                            return (
                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setPointsModal(null)}>
                                    <div style={{ background: 'white', borderRadius: '28px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                                            <div style={{ width: '52px', height: '52px', background: cat.bg, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{cat.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '20px' }}>{cat.label}</div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{cat.desc}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: cat.items.length > 2 ? '1fr 1fr' : '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                            {cat.items.map(item => {
                                                const val = pointsDraft[item.key] ?? '';
                                                const numVal = parseFloat(val);
                                                const isPos = numVal > 0;
                                                const isNeg = numVal < 0;
                                                return (
                                                    <div key={item.key} style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                                            <span style={{ fontWeight: 800, color: '#334155', fontSize: '13px' }}>{item.label}</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={val}
                                                            onChange={e => {
                                                                const raw = e.target.value;
                                                                if (raw === '' || raw === '-' || /^-?\d*$/.test(raw)) {
                                                                    setPointsDraft({ ...pointsDraft, [item.key]: raw });
                                                                }
                                                            }}
                                                            className="elite-input"
                                                            style={{ textAlign: 'center', fontWeight: 900, fontSize: '22px', padding: '12px', color: isPos ? '#047857' : isNeg ? '#b91c1c' : '#0f172a' }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button onClick={() => setPointsModal(null)} className="premium-btn" style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '16px' }}>İptal</button>
                                            <button onClick={savePointsModal} className="premium-btn" style={{ flex: 2, background: '#0f172a', color: 'white', padding: '16px', fontWeight: 900 }}>💾 KAYDET</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : adminSettingsView === 'logo' ? (
                    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏢</div>
                            <h3 style={{ margin: '0 0 6px 0', fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>Kurumsal Logo</h3>
                            <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Giriş ekranı ve panellerde görünecek logonuzu yükleyin.</p>
                        </div>
                        <div style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1.5px solid #e2e8f0', marginBottom: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', marginBottom: '16px', letterSpacing: '0.5px' }}>MEVCUT LOGO</div>
                            {appData?.settings?.corporate_logo_url ? (
                                <img src={appData.settings.corporate_logo_url} alt="Logo" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px' }} />
                            ) : (
                                <div style={{ padding: '30px', color: '#94a3b8', fontSize: '14px', fontWeight: 700 }}>Henüz logo yüklenmedi.</div>
                            )}
                        </div>
                        <div style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', marginBottom: '16px', letterSpacing: '0.5px' }}>YENİ LOGO SEÇ</div>
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '28px', cursor: 'pointer', background: '#f8fafc' }}>
                                <div style={{ fontSize: '36px' }}>📁</div>
                                <div style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>Dosya seç veya buraya sürükle</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>PNG, JPG, SVG</div>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            </label>
                            {corporateIdentity.logoUrl && (
                                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '10px' }}>Önizleme</div>
                                    <img src={corporateIdentity.logoUrl} alt="Önizleme" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {appData?.settings?.corporate_logo_url && (
                                <button onClick={async () => { if(window.confirm('Logo kaldırılacak, emin misiniz?')) { await db.ref('mavikent_premium/settings/corporate_logo_url').remove(); setCorporateIdentity({ logoUrl: '' }); toast('Logo kaldırıldı!'); } }} className="premium-btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '16px 20px', fontWeight: 900 }}>🗑️ Kaldır</button>
                            )}
                            <button onClick={async () => { if(!corporateIdentity.logoUrl) return toast('Önce bir dosya seçin.'); try { await db.ref('mavikent_premium/settings/corporate_logo_url').set(corporateIdentity.logoUrl); setCorporateIdentity({ logoUrl: '' }); toast('Logo güncellendi!'); } catch(e) { toast('Hata: ' + e.message); } }} className="premium-btn" style={{ flex: 1, background: '#0f172a', color: 'white', padding: '16px', fontSize: '15px', fontWeight: 900 }}>🏢 LOGOYU KAYDET</button>
                        </div>
                    </div>
                ) : null}
            </div>
        )}

      </div> 
{/* --- HİJYEN DENETİM MERKEZİ --- */}
        {currentModule === 'hygiene' && (() => {
            const FLOORS = [
                { key: 'kat2', label: 'Kat 2', icon: '2️⃣', color: '#0ea5e9', bg: '#e0f2fe' },
                { key: 'kat3', label: 'Kat 3', icon: '3️⃣', color: '#8b5cf6', bg: '#ede9fe' },
                { key: 'kat4', label: 'Kat 4', icon: '4️⃣', color: '#10b981', bg: '#d1fae5' },
            ];
            const allLogs    = Object.values(appData?.hygiene_logs || {});
            const todayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
            const missions   = appData?.kurtarma_gorevleri || {};
            const mEntries   = Object.entries(missions);
            const pendingM   = mEntries.filter(([,m]) => m.status === 'talep_edildi');
            const waitingM   = mEntries.filter(([,m]) => m.status === 'bekliyor');
            const doneM      = mEntries.filter(([,m]) => m.status === 'tamamlandi').slice(0,10);

            const rutinTotal  = FLOORS.reduce((t,f) => t + Object.keys(appData?.hygiene_floors?.rutin?.[f.key]?.areas||{}).length, 0);
            const temizTotal  = FLOORS.reduce((t,f) => t + Object.keys(appData?.hygiene_floors?.temizlik?.[f.key]?.areas||{}).length, 0);
            const rutinToday  = allLogs.filter(l => l.section === 'rutin'    && l.timestamp >= todayStart).length;
            const temizToday  = allLogs.filter(l => l.section === 'temizlik' && l.timestamp >= todayStart).length;
            const totalToday  = rutinToday + temizToday;
            const totalAll    = rutinTotal + temizTotal;
            const totalPct    = totalAll > 0 ? Math.round(totalToday / totalAll * 100) : 0;

            // Her öğrencinin sistemde (varsa) hangi tek alana atanmış olduğunu tutar
            const allAssignments = new Map();
            FLOORS.forEach(f => {
                ['rutin', 'temizlik'].forEach(sec => {
                    Object.entries(appData?.hygiene_floors?.[sec]?.[f.key]?.areas || {}).forEach(([areaId, a]) => {
                        (a.responsibles || []).forEach(r => {
                            if (!allAssignments.has(r)) {
                                allAssignments.set(r, { section: sec, floorKey: f.key, floorLabel: f.label, sectionLabel: sec === 'rutin' ? 'Rutin' : 'Temizlik', areaId, areaName: a.name, currentResponsibles: a.responsibles || [] });
                            }
                        });
                    });
                });
            });
            const unassignStudent = (name) => {
                const info = allAssignments.get(name);
                if (!info) return;
                updateAreaResponsibles(info.section, info.floorKey, info.areaId, info.currentResponsibles.filter(r => r !== name));
                toast(`✅ ${name} görevden çıkarıldı.`);
                setHygSearchStudent('');
            };

            const approveMission = async (name) => {
                const m = missions[name]; if (!m) return;
                const reward = m.reward_coins || 40;
                const upd = {};
                upd[`wallet/${name}`] = (Number(appData?.wallet?.[name])||0) + reward;
                upd[`transactions/${name}/txn_rec_${Date.now()}`] = { desc: 'Kurtarma Görevi Tamamlandı', amt: reward, date: new Date().toLocaleString('tr-TR') };
                upd[`kurtarma_gorevleri/${name}/status`] = 'tamamlandi';
                upd[`kurtarma_gorevleri/${name}/completed_at`] = Date.now();
                await db.ref('mavikent_premium').update(upd);
                toast(`✅ ${name} onaylandı! +${reward} M-Coin`);
            };
            const rejectMission = async (name) => {
                await db.ref(`mavikent_premium/kurtarma_gorevleri/${name}`).update({ status: 'reddedildi', rejected_at: Date.now() });
                toast('Görev reddedildi. Öğrenci 12 saat sonra tekrar alabilir.');
            };

            // Her kat + bölüm (grup) kendi JPG'sini ayrı ayrı indirebilsin
            const downloadHygieneGroupAsJPG = async (section, floorKey) => {
                const floor = FLOORS.find(f => f.key === floorKey);
                const secLabel = section === 'rutin' ? 'Rutin Kontrol' : 'Temizlik Kontrol';
                const btnId = `btn-jpg-hijyen-${section}-${floorKey}`;
                const btnEl = document.getElementById(btnId);
                const originalText = btnEl ? btnEl.innerText : '';
                if (btnEl) btnEl.innerText = '⏳ Hazırlanıyor...';
                const html2canvas = await loadHtml2Canvas();
                const container = document.createElement('div');
                container.style.cssText = "position:absolute;left:-9999px;top:0;width:900px;background:#ffffff;padding:40px;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;";

                const areas = appData?.hygiene_floors?.[section]?.[floorKey]?.areas || {};
                let rows = ''; let rowIdx = 0;
                Object.values(areas).forEach(area => {
                    const atype = FLOOR_AREA_TYPES[area.type] || FLOOR_AREA_TYPES.genel;
                    const responsibles = (area.responsibles || []).join(', ') || '—';
                    rows += `<tr style="background:${rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                        <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:800;">${atype.icon} ${area.name}</td>
                        <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#10b981;">${responsibles}</td>
                    </tr>`;
                    rowIdx++;
                });

                const tableHTML = `<table style="width:100%;border-collapse:collapse;text-align:left;margin-top:20px;">
                    <tr style="background:#0f172a;color:white;">
                        <th style="padding:14px;border-radius:12px 0 0 0;">Alan</th>
                        <th style="padding:14px;border-radius:0 12px 0 0;">Sorumlu Öğrenciler</th>
                    </tr>
                    ${rows || `<tr><td colspan="2" style="padding:30px;text-align:center;color:#94a3b8;">Henüz alan eklenmemiş</td></tr>`}
                </table>`;

                container.innerHTML = `<div style="background:linear-gradient(135deg, #0f172a, #1e293b);padding:30px;border-radius:24px;display:flex;justify-content:space-between;align-items:center;color:white;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div><h1 style="margin:0;font-size:36px;font-weight:900;letter-spacing:-1px;">MAVİKENT <span style="color:#d4af37;">ELITE</span></h1><h2 style="margin:5px 0 0 0;font-size:18px;color:#cbd5e1;font-weight:700;">${secLabel} — ${floor?.label || floorKey}</h2></div><div style="text-align:right;"><div style="font-size:16px;font-weight:600;color:#cbd5e1;">Tarih</div><div style="font-size:22px;font-weight:800;color:#d4af37;">${new Date().toLocaleDateString('tr-TR')}</div></div></div>${tableHTML}`;
                document.body.appendChild(container);

                try {
                    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                    const link = document.createElement('a');
                    link.download = `Mavikent_${secLabel.replace(/\s+/g,'_')}_${floor?.label?.replace(/\s+/g,'_') || floorKey}_${new Date().toISOString().slice(0,10)}.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                } catch (e) { console.error(e); }
                finally {
                    document.body.removeChild(container);
                    if (btnEl) btnEl.innerText = originalText;
                }
            };

            // ── Level 3: Puanlama formu ──
            if (adminHygSection && adminHygSection !== 'gorevler' && adminHygFloor && adminHygAreaId) {
                const area  = appData?.hygiene_floors?.[adminHygSection]?.[adminHygFloor]?.areas?.[adminHygAreaId];
                const atype = FLOOR_AREA_TYPES[area?.type] || FLOOR_AREA_TYPES.genel;
                const sColor = adminHygSection === 'rutin' ? '#0ea5e9' : '#10b981';
                return (
                    <div className="fade-in" style={{ background: 'white', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(15,23,42,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 28px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <button onClick={() => setAdminHygAreaId(null)} style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: '12px', padding: '9px 16px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>← Geri</button>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: atype.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{atype.icon}</div>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '17px', color: '#0f172a' }}>{area?.name}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>{(area?.responsibles||[]).join(', ') || 'Sorumlu atanmamış'}</div>
                            </div>
                        </div>
                        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Temizlik Puanı</div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }}>
                                {[1,2,3,4,5].map(n => (
                                    <button key={n} onClick={() => setAdminHygScore(n)} style={{ width: '60px', height: '60px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '26px', background: adminHygScore >= n ? atype.color : '#f1f5f9', color: adminHygScore >= n ? 'white' : '#cbd5e1', fontWeight: 900, transition: 'all 0.15s', transform: adminHygScore >= n ? 'scale(1.1)' : 'scale(1)', boxShadow: adminHygScore >= n ? `0 6px 20px ${atype.color}50` : 'none' }}>★</button>
                                ))}
                            </div>
                            <div style={{ display: 'inline-block', padding: '14px 36px', background: adminHygScore >= 4 ? '#ecfdf5' : adminHygScore <= 2 ? '#fef2f2' : '#fffbeb', borderRadius: '20px', marginBottom: '28px' }}>
                                <span style={{ fontWeight: 900, fontSize: '22px', color: adminHygScore >= 4 ? '#059669' : adminHygScore <= 2 ? '#dc2626' : '#d97706' }}>
                                    {getCoinImpact(adminHygScore) >= 0 ? '+' : ''}{getCoinImpact(adminHygScore)} M-Coin
                                </span>
                            </div>
                            <br />
                            <button onClick={() => saveAdminFloorInspection(adminHygSection, adminHygFloor, adminHygAreaId)} className="premium-btn" style={{ padding: '18px 52px', background: atype.color, color: 'white', fontWeight: 900, fontSize: '16px', border: 'none', boxShadow: `0 8px 28px ${atype.color}50` }}>✅ Kaydet</button>
                        </div>
                    </div>
                );
            }

            // ── Level 2: Alan grid ──
            if (adminHygSection && adminHygSection !== 'gorevler' && adminHygFloor) {
                const floorData    = appData?.hygiene_floors?.[adminHygSection]?.[adminHygFloor] || {};
                const areaEntries  = Object.entries(floorData.areas || {});
                const todayLogs    = allLogs.filter(l => l.section === adminHygSection && l.floor === adminHygFloor && l.timestamp >= todayStart);
                const scoredIds    = new Set(todayLogs.map(l => l.areaId));
                const floorMeta    = FLOORS.find(f => f.key === adminHygFloor);
                const sColor       = adminHygSection === 'rutin' ? '#0ea5e9' : '#10b981';
                const sLabel       = adminHygSection === 'rutin' ? 'Rutin Kontrol' : 'Temizlik Kontrol';

                // Bir öğrenci sistemde toplamda sadece TEK bir alana sorumlu olabilir (kat/bölüm fark etmez)
                const occupiedElsewhere = allAssignments;
                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={() => { setAdminHygFloor(null); setAdminHygEditMode(false); }} style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: '14px', padding: '10px 18px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>← Geri</button>
                                <span style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>{sLabel} — {floorMeta?.label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button id={`btn-jpg-hijyen-${adminHygSection}-${adminHygFloor}`} onClick={() => downloadHygieneGroupAsJPG(adminHygSection, adminHygFloor)} style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#0f172a', borderRadius: '14px', padding: '10px 18px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>
                                    📸 JPG İndir
                                </button>
                                <button onClick={() => setAdminHygEditMode(e => !e)} style={{ background: adminHygEditMode ? sColor : 'white', color: adminHygEditMode ? 'white' : sColor, border: `1.5px solid ${sColor}40`, borderRadius: '14px', padding: '10px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>
                                    👥 {adminHygEditMode ? 'Atama Modu Açık' : 'Öğrenci Ataması'}
                                </button>
                            </div>
                        </div>
                        {areaEntries.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '24px', padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Henüz alan eklenmemiş</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                                {areaEntries.map(([areaId, area]) => {
                                    const atype  = FLOOR_AREA_TYPES[area.type] || FLOOR_AREA_TYPES.genel;
                                    const isDone = scoredIds.has(areaId);
                                    if (adminHygEditMode) {
                                        return (
                                            <div key={areaId} style={{ background: 'white', borderRadius: '20px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15,23,42,0.04)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: atype.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{atype.icon}</div>
                                                    <span style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a' }}>{area.name}</span>
                                                </div>
                                                {(area.responsibles||[]).map((r,i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '6px 10px', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{r}</span>
                                                        <button onClick={() => updateAreaResponsibles(adminHygSection, adminHygFloor, areaId, area.responsibles.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>
                                                    </div>
                                                ))}
                                                <select onChange={(e) => { if(e.target.value){ updateAreaResponsibles(adminHygSection, adminHygFloor, areaId, [...(area.responsibles||[]), e.target.value]); e.target.value=''; }}} style={{ width: '100%', marginTop: '8px', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                                                    <option value="">+ Öğrenci Ekle</option>
                                                    {roster.filter(st => !(area.responsibles||[]).includes(st) && !occupiedElsewhere.has(st)).map(st => <option key={st} value={st}>{st}</option>)}
                                                </select>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={areaId} onClick={() => { setAdminHygAreaId(areaId); setAdminHygScore(5); }} style={{ background: isDone ? '#ecfdf5' : 'white', border: `2px solid ${isDone ? '#6ee7b7' : '#f1f5f9'}`, borderRadius: '20px', padding: '22px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: isDone ? '0 4px 16px rgba(16,185,129,0.12)' : '0 2px 10px rgba(15,23,42,0.05)' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: isDone ? '#d1fae5' : atype.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '12px' }}>{isDone ? '✅' : atype.icon}</div>
                                            <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '5px' }}>{area.name}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{(area.responsibles||[]).join(', ')||'Sorumlu yok'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {adminHygEditMode && (
                            <div style={{ marginTop: '16px', background: '#f0f9ff', borderRadius: '20px', padding: '18px 20px', border: '1.5px dashed #0ea5e9' }}>
                                <div style={{ fontWeight: 900, fontSize: '13px', color: '#0ea5e9', marginBottom: '12px' }}>+ Yeni Alan Ekle</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <input value={adminHygNewArea.name} onChange={e => setAdminHygNewArea({...adminHygNewArea, name: e.target.value})} placeholder="Alan adı" className="elite-input" style={{ flex: 1, minWidth: '140px', padding: '10px 14px', fontSize: '13px' }} />
                                    <select value={adminHygNewArea.type} onChange={e => setAdminHygNewArea({...adminHygNewArea, type: e.target.value})} style={{ padding: '10px 12px', borderRadius: '14px', border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: '13px', color: '#0f172a', cursor: 'pointer' }}>
                                        {Object.entries(FLOOR_AREA_TYPES).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                                    </select>
                                    <button onClick={() => addAdminFloorArea(adminHygSection, adminHygFloor)} className="premium-btn" style={{ background: sColor, color: 'white', padding: '10px 20px', fontWeight: 900, fontSize: '13px', border: 'none' }}>+ Ekle</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            // ── Level 1: Kat grid ──
            if (adminHygSection && adminHygSection !== 'gorevler') {
                const sColor  = adminHygSection === 'rutin' ? '#0ea5e9' : '#10b981';
                const sBg     = adminHygSection === 'rutin' ? '#f0f9ff' : '#f0fdf4';
                const sLabel  = adminHygSection === 'rutin' ? 'Rutin Kontrol' : 'Temizlik Kontrol';
                const sFloors = appData?.hygiene_floors?.[adminHygSection] || {};
                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <button onClick={() => { setAdminHygSection(null); setAdminHygFloor(null); setAdminHygAreaId(null); }} style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b', borderRadius: '14px', padding: '10px 18px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>← Geri</button>
                            <span style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a' }}>{sLabel}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {FLOORS.map(floor => {
                                const areaCnt  = Object.keys(sFloors[floor.key]?.areas||{}).length;
                                const todayCnt = allLogs.filter(l => l.section === adminHygSection && l.floor === floor.key && l.timestamp >= todayStart).length;
                                const pct = areaCnt > 0 ? Math.round(todayCnt/areaCnt*100) : 0;
                                return (
                                    <div key={floor.key} onClick={() => setAdminHygFloor(floor.key)} style={{ background: 'white', borderRadius: '24px', padding: '28px 20px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: `1px solid ${floor.bg}`, transition: 'all 0.15s' }} className="card-hover">
                                        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: floor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>{floor.icon}</div>
                                        <div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', marginBottom: '4px' }}>{floor.label}</div>
                                        <div style={{ fontSize: '32px', fontWeight: 900, color: floor.color, marginBottom: '4px' }}>{areaCnt}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '14px' }}>toplam alan</div>
                                        <div style={{ background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', height: '6px', marginBottom: '6px' }}>
                                            <div style={{ height: '100%', width: pct+'%', background: floor.color, borderRadius: '10px', transition: 'width 0.3s' }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{todayCnt}/{areaCnt} tamamlandı</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // ── Kurtarma Görevleri drill-down ──
            if (adminHygSection === 'gorevler') {
                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <button onClick={() => setAdminHygSection(null)} style={{ background: 'white', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: '14px', padding: '10px 18px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>← Geri</button>
                            <span style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a' }}>🚨 Kurtarma Görevleri</span>
                        </div>
                        {mEntries.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '24px', padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Aktif kurtarma görevi yok</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {pendingM.length > 0 && (
                                    <div style={{ background: 'white', borderRadius: '24px', padding: '22px', border: '1px solid #fca5a5' }}>
                                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#dc2626', marginBottom: '14px' }}>🔔 Onay Bekleyen ({pendingM.length})</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {pendingM.map(([name, m]) => (
                                                <div key={name} style={{ background: '#fef2f2', borderRadius: '16px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#0f172a', marginBottom: '5px' }}>👤 {name}</div>
                                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '5px' }}>{(m.areas||[]).map((a,i) => <span key={i} style={{ background: 'white', color: '#b91c1c', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>{a.name}</span>)}</div>
                                                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Ödül: +{m.reward_coins} M-Coin</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => approveMission(name)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '9px 16px', fontSize: '13px', fontWeight: 900, border: 'none' }}>✅ Onayla</button>
                                                        <button onClick={() => rejectMission(name)} style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', padding: '9px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>❌</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {waitingM.length > 0 && (
                                    <div style={{ background: 'white', borderRadius: '24px', padding: '22px', border: '1px solid #fde68a' }}>
                                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#d97706', marginBottom: '12px' }}>⏳ Devam Ediyor ({waitingM.length})</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '8px' }}>
                                            {waitingM.map(([name, m]) => (
                                                <div key={name} style={{ background: '#fffbeb', borderRadius: '12px', padding: '12px 14px', border: '1px solid #fde68a' }}>
                                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '13px' }}>👤 {name}</div>
                                                    <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, marginTop: '3px' }}>+{m.reward_coins} M-Coin</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {doneM.length > 0 && (
                                    <div style={{ background: 'white', borderRadius: '24px', padding: '22px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#059669', marginBottom: '12px' }}>✅ Son Tamamlananlar</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '8px' }}>
                                            {doneM.map(([name, m]) => (
                                                <div key={name} style={{ background: '#f0fdf4', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 800, color: '#065f46', fontSize: '13px' }}>✅ {name}</span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>+{m.reward_coins} M</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            }

            // ── Ana ekran: Hero + 3 kart (AÇIK RENK) ──
            return (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* HERO CARD - açık tema */}
                    <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 60%, #f0fdf4 100%)', borderRadius: '28px', padding: '32px', boxShadow: '0 4px 24px rgba(14,165,233,0.1)', border: '1px solid #bae6fd', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)' }} />
                        <div style={{ position: 'absolute', bottom: '-20px', left: '20%', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />
                        <div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>Yönetici Bakışı</div>
                        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '52px', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '6px' }}>{totalToday}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Bugün Tamamlanan Alanlar</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '160px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Toplam Progress</span>
                                    <span style={{ fontSize: '14px', color: '#0ea5e9', fontWeight: 900 }}>{totalPct}%</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '12px', overflow: 'hidden', height: '10px' }}>
                                    <div style={{ height: '100%', width: totalPct+'%', background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', borderRadius: '12px', transition: 'width 0.5s ease', boxShadow: '0 2px 8px rgba(14,165,233,0.4)' }} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginTop: '6px' }}>{totalToday} / {totalAll} alan tamamlandı</div>
                            </div>
                        </div>
                    </div>

                    {/* ÖĞRENCİ NEREDE GÖREVLİ ARAMA */}
                    <div style={{ background: 'white', borderRadius: '24px', padding: '22px 26px', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>🔍 Öğrenci Nerede Görevli?</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '14px' }}>Bir öğrenciyi başka bir alana atamak için önce mevcut görevinden çıkarman gerekir.</div>
                        <select value={hygSearchStudent} onChange={e => setHygSearchStudent(e.target.value)} className="elite-input" style={{ maxWidth: '320px' }}>
                            <option value="">Öğrenci seçin...</option>
                            {roster.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                        {hygSearchStudent && (() => {
                            const info = allAssignments.get(hygSearchStudent);
                            if (!info) return <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 800, color: '#10b981' }}>✅ {hygSearchStudent} şu an hiçbir alana atanmamış — istediğiniz yere ekleyebilirsiniz.</div>;
                            return (
                                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#f8fafc', borderRadius: '14px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                                        <b>{hygSearchStudent}</b> şu an: {info.floorLabel}, {info.sectionLabel} — {info.areaName}
                                    </div>
                                    <button onClick={() => unassignStudent(hygSearchStudent)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '9px 16px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>Görevden Çıkar</button>
                                </div>
                            );
                        })()}
                    </div>

                    {/* 3 KART - açık tema */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        {/* Rutin Kontrol */}
                        <div onClick={() => { setAdminHygSection('rutin'); setAdminHygFloor(null); setAdminHygAreaId(null); }} style={{ background: 'white', borderRadius: '24px', padding: '28px 22px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(14,165,233,0.1)', border: '1px solid #e0f2fe', transition: 'all 0.15s' }} className="card-hover">
                            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px', boxShadow: '0 6px 20px rgba(14,165,233,0.35)' }}>🛏️</div>
                            <div style={{ fontWeight: 900, fontSize: '17px', color: '#0f172a', marginBottom: '6px' }}>Rutin Kontrol</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0ea5e9', marginBottom: '2px' }}>{rutinTotal}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Aktif Rutin Alan</div>
                        </div>

                        {/* Temizlik Kontrol */}
                        <div onClick={() => { setAdminHygSection('temizlik'); setAdminHygFloor(null); setAdminHygAreaId(null); }} style={{ background: 'white', borderRadius: '24px', padding: '28px 22px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.1)', border: '1px solid #d1fae5', transition: 'all 0.15s' }} className="card-hover">
                            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>🧹</div>
                            <div style={{ fontWeight: 900, fontSize: '17px', color: '#0f172a', marginBottom: '6px' }}>Temizlik Kontrol</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981', marginBottom: '2px' }}>{temizTotal}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Temizlik Alanı</div>
                        </div>

                        {/* Kurtarma Görevleri */}
                        <div onClick={() => setAdminHygSection('gorevler')} style={{ background: 'white', borderRadius: '24px', padding: '28px 22px', cursor: 'pointer', boxShadow: pendingM.length > 0 ? '0 4px 20px rgba(239,68,68,0.15)' : '0 4px 20px rgba(15,23,42,0.06)', border: pendingM.length > 0 ? '1px solid #fca5a5' : '1px solid #f1f5f9', transition: 'all 0.15s', position: 'relative' }} className="card-hover">
                            {pendingM.length > 0 && <div style={{ position: 'absolute', top: '14px', right: '14px', background: '#ef4444', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 900 }}>{pendingM.length}</div>}
                            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px', boxShadow: '0 6px 20px rgba(239,68,68,0.35)' }}>🚨</div>
                            <div style={{ fontWeight: 900, fontSize: '17px', color: '#0f172a', marginBottom: '6px' }}>Görev Kartları</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#ef4444', marginBottom: '2px' }}>{mEntries.length}</div>
                            <div style={{ fontSize: '12px', color: pendingM.length > 0 ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>{pendingM.length > 0 ? `${pendingM.length} Onay Bekliyor` : 'Görev Bekliyor'}</div>
                        </div>
                    </div>
                </div>
            );
        })()}

            {/* --- İSTİRAHAT KONTROL --- */}
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
            {istirahatSelectedRoom || istirahatView ? (
              <div style={{ marginBottom: '20px' }}>
                <button onClick={() => { setIstirahatSelectedRoom(null); setIstirahatView(null); setIstirahatScore(5); setIstirahatNote(''); }}
                  style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>← Geri</button>
              </div>
            ) : null}

            {/* ANA EKRAN: YATAKHANE LİSTESİ */}
            {!istirahatSelectedRoom && !istirahatView && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a' }}>🛌 İstirahat Kontrol Raporu</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>Kontrol edilecek yatakhaneyi seçin</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIstirahatView('history')}
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 18px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                      📜 Geçmiş
                    </button>
                    <button onClick={istirahatEditMode ? saveIstirahatRooms : openIstirahatEditMode}
                      className="premium-btn" style={{ background: istirahatEditMode ? '#10b981' : '#f1f5f9', color: istirahatEditMode ? 'white' : '#8b5cf6', padding: '10px 18px', fontSize: '13px' }}>
                      {istirahatEditMode ? '💾 Kaydet' : '🛠️ Düzenle'}
                    </button>
                    {istirahatEditMode && (
                      <button onClick={() => setIstirahatEditMode(false)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '10px 16px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>İptal</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {Object.entries(rooms).map(([roomKey, room]) => {
                    const last = lastRatingForRoom(roomKey);
                    const doneToday = allLogs.some(l => l.roomKey === roomKey && l.timestamp >= todayStart);
                    const responsibles = room.responsibles || [];
                    if (istirahatEditMode) {
                      return (
                        <div key={roomKey} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                          <input value={room.name} onChange={e => setTempIstirahatRooms({...tempIstirahatRooms, [roomKey]: {...tempIstirahatRooms[roomKey], name: e.target.value}})}
                            className="elite-input" style={{ marginBottom: '14px', fontWeight: 900, color: '#8b5cf6', borderColor: '#ede9fe', background: '#faf5ff', width: '100%', boxSizing: 'border-box' }} />
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>Öğrenciler</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {Array.from({ length: 8 }, (_, i) => i).map(slot => (
                              <select key={slot}
                                value={(tempIstirahatRooms[roomKey]?.responsibles || [])[slot] || ''}
                                onChange={e => {
                                  const arr = [...(tempIstirahatRooms[roomKey]?.responsibles || [])];
                                  arr[slot] = e.target.value;
                                  setTempIstirahatRooms({...tempIstirahatRooms, [roomKey]: {...tempIstirahatRooms[roomKey], responsibles: arr.filter(Boolean)}});
                                }}
                                className="elite-input" style={{ padding: '8px', fontSize: '12px', borderRadius: '10px', background: 'white' }}>
                                <option value="">-- Seç --</option>
                                {roster.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={roomKey} onClick={doneToday ? undefined : () => { setIstirahatSelectedRoom(roomKey); setIstirahatScore(5); setIstirahatNote(''); }}
                        className={doneToday ? '' : 'card-hover'}
                        style={{ background: doneToday ? '#f8fafc' : 'white', border: `2px solid ${doneToday ? '#e2e8f0' : '#e2e8f0'}`, borderRadius: '24px', padding: '20px', cursor: doneToday ? 'default' : 'pointer', opacity: doneToday ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ fontSize: '32px' }}>🛌</div>
                          {doneToday && <span style={{ background: '#ecfdf5', color: '#10b981', fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '10px' }}>✓ Kontrol Edildi</span>}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '17px', color: doneToday ? '#94a3b8' : '#0f172a', marginBottom: '8px' }}>{room.name}</div>
                        {responsibles.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                            {responsibles.map(r => (
                              <span key={r} style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '8px' }}>{r}</span>
                            ))}
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

            {/* PUAN VERME */}
            {istirahatSelectedRoom && !istirahatView && (() => {
              const room = rooms[istirahatSelectedRoom];
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
                          <button key={star} onClick={() => setIstirahatScore(star)}
                            style={{ flex: 1, maxWidth: '72px', padding: '16px 0', fontSize: '28px', borderRadius: '18px', border: 'none', cursor: 'pointer', background: istirahatScore >= star ? scoreColors[star] : '#ffffff', color: istirahatScore >= star ? '#fff' : '#cbd5e1', transition: 'all 0.2s', boxShadow: istirahatScore >= star ? `0 8px 16px ${scoreColors[star]}50` : '0 2px 6px rgba(0,0,0,0.06)' }}>★</button>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 900, color: scoreColors[istirahatScore] }}>
                        {scoreLabels[istirahatScore]} — {responsibles.length} öğrenciye {getCoinImpact(istirahatScore, 'istirahat') >= 0 ? '+' : ''}{getCoinImpact(istirahatScore, 'istirahat')} M-Coin
                      </div>
                    </div>
                    <textarea value={istirahatNote} onChange={e => setIstirahatNote(e.target.value)}
                      placeholder="Not ekle (opsiyonel)..." className="elite-input"
                      style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', marginBottom: '16px', fontSize: '14px' }} />
                    <button onClick={() => saveIstirahatInspection(istirahatSelectedRoom)} disabled={isIstirahatSaving}
                      className="premium-btn badge-glow" style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #10b981cc, #10b981)', color: 'white', fontWeight: 900, fontSize: '17px', border: 'none', boxShadow: '0 12px 24px rgba(16,185,129,0.35)' }}>
                      {isIstirahatSaving ? '⏳ İşleniyor...' : '✅ KONTROLÜ KAYDET'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* GEÇMİŞ */}
            {istirahatView === 'history' && (
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
                      <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>🛌 {log.roomName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{(log.responsibles||[]).join(', ') || 'Kişi Yok'}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginTop: '4px' }}>{new Date(log.timestamp).toLocaleString('tr-TR')} • {log.inspector}</div>
                          {log.note && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>{log.note}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: (log.coinImpact||0) >= 0 ? '#10b981' : '#ef4444', fontSize: '18px', background: (log.coinImpact||0) >= 0 ? '#ecfdf5' : '#fef2f2', padding: '4px 12px', borderRadius: '12px', display: 'inline-block' }}>{(log.coinImpact||0) >= 0 ? '+' : ''}{log.coinImpact} M</div>
                          <div style={{ fontSize: '13px', color: '#fbbf24', marginTop: '6px', letterSpacing: '2px' }}>{'★'.repeat(log.score||0)}</div>
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

      {/* --- EKSİK KALAN MODALLAR (YOKLAMA, EĞİTİM, SINAV VB.) --- */}
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
                  <button onClick={() => saveData('okul', 'p', pointsConfigFromDB.okul_dondu)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🏠 DÖNDÜ (+{pointsConfigFromDB.okul_dondu} M)</button>
                  <button onClick={() => saveData('okul', 'a', pointsConfigFromDB.okul_gelmedi)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 GELMEDİ ({pointsConfigFromDB.okul_gelmedi} M + 📉)</button>
                  <button onClick={() => saveData('okul', 'i', 0)} className="premium-btn" style={{ background: '#64748b', color: 'white', padding: '20px' }}>✉️ İZİNLİ (0 M)</button>
                </>
              )}
              {currentModule === 'yoklama' && (
                <>
                  <button onClick={() => saveData('yoklama', 't', pointsConfigFromDB.yoklama_takkeli)} className="premium-btn" style={{ background: '#d4af37', color: 'white', padding: '20px' }}>👳‍♂️ TAKKELİ (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.yoklama_takkeli, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'p', pointsConfigFromDB.yoklama_geldi)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>✅ GELDİ (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.yoklama_geldi, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'l', pointsConfigFromDB.yoklama_gec)} className="premium-btn" style={{ background: '#f59e0b', color: 'white', padding: '20px' }}>⏳ GEÇ (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.yoklama_gec, 'yoklama')} M)</button>
                  <button onClick={() => saveData('yoklama', 'a', pointsConfigFromDB.yoklama_gelmedi)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>❌ GELMEDİ ({pointsConfigFromDB.yoklama_gelmedi} M, Seri Bozar)</button>
                </>
              )}
              {currentModule === 'telefon' && (
                <><button onClick={() => saveData('telefon', 'p', pointsConfigFromDB.telefon_teslim)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>📱 TESLİM (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.telefon_teslim, 'telefon')} M)</button><button onClick={() => saveData('telefon', 'e', pointsConfigFromDB.telefon_teslim)} className="premium-btn" style={{ background: '#3b82f6', color: 'white', padding: '20px' }}>📵 TELEFONU YOK (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.telefon_teslim, 'telefon')} M)</button><button onClick={() => saveData('telefon', 'a', pointsConfigFromDB.telefon_vermedi)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🚫 VERMEDİ ({pointsConfigFromDB.telefon_vermedi} M, Seri Bozar)</button></>
              )}
              {currentModule === 'yatak' && (
                <><button onClick={() => saveData('yatak', 'yatak', pointsConfigFromDB.yatak_duzenli)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🛏️ YATAK DÜZENLİ (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.yatak_duzenli, 'yatak')} M)</button><button onClick={() => saveData('yatak', 'yatak', pointsConfigFromDB.yatak_bozuk)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🕸️ YATAK BOZUK ({pointsConfigFromDB.yatak_bozuk} M, Seri Bozar)</button><button onClick={() => saveData('yatak', 'dolap', pointsConfigFromDB.dolap_duzenli)} className="premium-btn" style={{ background: '#10b981', color: 'white', padding: '20px' }}>🚪 DOLAP DÜZENLİ (+{getCalculatedPoints(selectedStudent, pointsConfigFromDB.dolap_duzenli, 'yatak')} M)</button><button onClick={() => saveData('yatak', 'dolap', pointsConfigFromDB.dolap_bozuk)} className="premium-btn" style={{ background: '#ef4444', color: 'white', padding: '20px' }}>🏚️ DOLAP BOZUK ({pointsConfigFromDB.dolap_bozuk} M, Seri Bozar)</button></>
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

    </div>
  );
};

export default AdminScreen;