export const TEMIZLIK_FLOORS = [
  { key: 'kat1', label: 'Kat 1' },
  { key: 'kat2', label: 'Kat 2' },
  { key: 'kat3', label: 'Kat 3' },
  { key: 'kat4', label: 'Kat 4' },
  { key: 'kat5', label: 'Kat 5' },
];

export const RUTIN_AREAS = [
  { key: 'etut1', name: 'Etüt 1', type: 'etut' },
  { key: 'etut2', name: 'Etüt 2', type: 'etut' },
  { key: 'etut3', name: 'Etüt 3', type: 'etut' },
  { key: 'etut_ortak', name: 'Etüt Ortak Alan', type: 'etut' },
  { key: 'yatakhane1', name: 'Yatakhane 1', type: 'yatakhane' },
  { key: 'yatakhane2', name: 'Yatakhane 2', type: 'yatakhane' },
  { key: 'yatakhane3', name: 'Yatakhane 3', type: 'yatakhane' },
  { key: 'yatakhane4', name: 'Yatakhane 4', type: 'yatakhane' },
  { key: 'yatakhane5', name: 'Yatakhane 5', type: 'yatakhane' },
  { key: 'yatakhane_ortak', name: 'Yatakhane Ortak Alan', type: 'yatakhane' },
  { key: 'wc1', name: 'WC 1', type: 'wc' },
  { key: 'wc2', name: 'WC 2', type: 'wc' },
  { key: 'wc3', name: 'WC 3', type: 'wc' },
  { key: 'wc4', name: 'WC 4', type: 'wc' },
  { key: 'wc5', name: 'WC 5', type: 'wc' },
  { key: 'wc6', name: 'WC 6', type: 'wc' },
];

export const RUTIN_GROUPS = [
  { type: 'etut', label: 'Etüt Salonları' },
  { type: 'yatakhane', label: 'Yatakhaneler' },
  { type: 'wc', label: 'WC / Tuvaletler' },
];

export const AREA_TYPE_STYLES = {
  wc:        { icon: '🚽', label: 'WC / Tuvalet',   color: '#0ea5e9', bg: '#f0f9ff' },
  etut:      { icon: '📚', label: 'Etüt Salonu',    color: '#8b5cf6', bg: '#faf5ff' },
  yatakhane: { icon: '🛏️', label: 'Yatakhane',      color: '#10b981', bg: '#f0fdf4' },
  genel:     { icon: '🧹', label: 'Genel Temizlik', color: '#f59e0b', bg: '#fffbeb' },
};
