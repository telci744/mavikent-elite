// Emoji prefix'e göre otomatik tip tespiti
const detectType = (msg) => {
  const m = String(msg);
  if (m.startsWith('❌') || m.includes('Hata') || m.includes('hata') || m.includes('yetersiz') || m.includes('banlı') || m.includes('bulunamadı')) return 'error';
  if (m.startsWith('⚠️')) return 'warning';
  if (m.startsWith('💰') || m.startsWith('🪙') || m.includes('İade') || m.startsWith('🔄')) return 'coin';
  if (m.startsWith('🎁') || m.startsWith('🏆') || m.includes('Ödül') || m.includes('ödül') || m.includes('Kazandın')) return 'reward';
  if (m.startsWith('🎮') || m.startsWith('🚀') || m.startsWith('🎟️') || m.includes('Rezervasyon') || m.includes('rezerv')) return 'booking';
  return 'success';
};

export const toast = (message) => {
  window.dispatchEvent(new CustomEvent('mavikent-toast', {
    detail: { message: String(message), type: detectType(message), id: Date.now() + Math.random() }
  }));
};
