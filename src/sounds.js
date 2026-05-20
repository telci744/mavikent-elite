// Web Audio API — harici dosya yok, sıfırdan üretilir
let ctx = null;
const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
};

const tone = (freq, dur, type = 'sine', vol = 0.28, delay = 0) => {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch (_) {}
};

// Hafif UI tıklama — checkbox, genel buton
export const playClick = () => {
  tone(900, 0.04, 'sine', 0.12);
};

// Onay / başarı — teslimat onay, kayıt başarılı
export const playSuccess = () => {
  tone(523, 0.1, 'sine', 0.22, 0.0);
  tone(659, 0.1, 'sine', 0.2,  0.1);
  tone(784, 0.18, 'sine', 0.18, 0.22);
};

// Satın alma / market — M-Coin harcama
export const playCoin = () => {
  tone(880,  0.08, 'sine', 0.22, 0.0);
  tone(1100, 0.1,  'sine', 0.2,  0.07);
  tone(1320, 0.14, 'sine', 0.16, 0.16);
};

// Rezervasyon / randevu onay
export const playBooking = () => {
  tone(440, 0.09, 'sine', 0.2, 0.0);
  tone(550, 0.09, 'sine', 0.18, 0.1);
  tone(660, 0.14, 'sine', 0.16, 0.2);
};

// Ödül — pozitif fanfare
export const playReward = () => {
  tone(523,  0.09, 'sine', 0.22, 0.0);
  tone(659,  0.09, 'sine', 0.22, 0.1);
  tone(784,  0.09, 'sine', 0.22, 0.2);
  tone(1047, 0.22, 'sine', 0.2,  0.3);
};

// Ceza — kısa negatif
export const playPenalty = () => {
  tone(280, 0.12, 'sawtooth', 0.18, 0.0);
  tone(200, 0.18, 'sawtooth', 0.14, 0.1);
};

// İptal / red / iade
export const playCancel = () => {
  tone(350, 0.1,  'sine', 0.18, 0.0);
  tone(280, 0.15, 'sine', 0.14, 0.09);
};

// Toggle (checkbox açık/kapalı)
export const playToggle = () => {
  tone(700, 0.05, 'sine', 0.1);
};
