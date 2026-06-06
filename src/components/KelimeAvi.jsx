import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { toast } from '../toast';

// ─── MEB Müfredatı Kelime Listeleri ──────────────────────────────────────────
const MEB_WORDS = {
  5: [
    { tr: 'Kırmızı', en: 'Red' }, { tr: 'Mavi', en: 'Blue' }, { tr: 'Yeşil', en: 'Green' },
    { tr: 'Sarı', en: 'Yellow' }, { tr: 'Siyah', en: 'Black' }, { tr: 'Beyaz', en: 'White' },
    { tr: 'Turuncu', en: 'Orange' }, { tr: 'Mor', en: 'Purple' }, { tr: 'Pembe', en: 'Pink' },
    { tr: 'Kahverengi', en: 'Brown' }, { tr: 'Gri', en: 'Grey' },
    { tr: 'Kedi', en: 'Cat' }, { tr: 'Köpek', en: 'Dog' }, { tr: 'Kuş', en: 'Bird' },
    { tr: 'Balık', en: 'Fish' }, { tr: 'At', en: 'Horse' }, { tr: 'İnek', en: 'Cow' },
    { tr: 'Tavuk', en: 'Chicken' }, { tr: 'Koyun', en: 'Sheep' }, { tr: 'Aslan', en: 'Lion' },
    { tr: 'Fil', en: 'Elephant' }, { tr: 'Maymun', en: 'Monkey' }, { tr: 'Tavşan', en: 'Rabbit' },
    { tr: 'Kitap', en: 'Book' }, { tr: 'Kalem', en: 'Pencil' }, { tr: 'Masa', en: 'Table' },
    { tr: 'Sandalye', en: 'Chair' }, { tr: 'Okul', en: 'School' }, { tr: 'Öğretmen', en: 'Teacher' },
    { tr: 'Öğrenci', en: 'Student' }, { tr: 'Silgi', en: 'Eraser' }, { tr: 'Defter', en: 'Notebook' },
    { tr: 'Göz', en: 'Eye' }, { tr: 'Kulak', en: 'Ear' }, { tr: 'Burun', en: 'Nose' },
    { tr: 'Ağız', en: 'Mouth' }, { tr: 'El', en: 'Hand' }, { tr: 'Ayak', en: 'Foot' },
    { tr: 'Baş', en: 'Head' }, { tr: 'Omuz', en: 'Shoulder' }, { tr: 'Diz', en: 'Knee' },
    { tr: 'Anne', en: 'Mother' }, { tr: 'Baba', en: 'Father' }, { tr: 'Dede', en: 'Grandfather' },
    { tr: 'Büyükanne', en: 'Grandmother' }, { tr: 'Kardeş', en: 'Brother' }, { tr: 'Kız kardeş', en: 'Sister' },
    { tr: 'Elma', en: 'Apple' }, { tr: 'Ekmek', en: 'Bread' }, { tr: 'Su', en: 'Water' },
    { tr: 'Süt', en: 'Milk' }, { tr: 'Yumurta', en: 'Egg' }, { tr: 'Muz', en: 'Banana' },
    { tr: 'Güneş', en: 'Sun' }, { tr: 'Ay', en: 'Moon' }, { tr: 'Yıldız', en: 'Star' },
    { tr: 'Ağaç', en: 'Tree' }, { tr: 'Çiçek', en: 'Flower' }, { tr: 'Bulut', en: 'Cloud' },
    { tr: 'Büyük', en: 'Big' }, { tr: 'Küçük', en: 'Small' }, { tr: 'Hızlı', en: 'Fast' },
    { tr: 'Yavaş', en: 'Slow' }, { tr: 'Mutlu', en: 'Happy' }, { tr: 'Üzgün', en: 'Sad' },
  ],
  6: [
    { tr: 'Yüzme', en: 'Swimming' }, { tr: 'Koşma', en: 'Running' }, { tr: 'Dans', en: 'Dancing' },
    { tr: 'Okuma', en: 'Reading' }, { tr: 'Resim', en: 'Painting' }, { tr: 'Müzik', en: 'Music' },
    { tr: 'Bisiklet', en: 'Cycling' }, { tr: 'Satranç', en: 'Chess' }, { tr: 'Fotoğraf', en: 'Photography' },
    { tr: 'Futbol', en: 'Football' }, { tr: 'Basketbol', en: 'Basketball' }, { tr: 'Voleybol', en: 'Volleyball' },
    { tr: 'Tenis', en: 'Tennis' }, { tr: 'Jimnastik', en: 'Gymnastics' }, { tr: 'Yüzme', en: 'Swimming' },
    { tr: 'Güneşli', en: 'Sunny' }, { tr: 'Yağmurlu', en: 'Rainy' }, { tr: 'Karlı', en: 'Snowy' },
    { tr: 'Bulutlu', en: 'Cloudy' }, { tr: 'Rüzgarlı', en: 'Windy' }, { tr: 'Sisli', en: 'Foggy' },
    { tr: 'Gömlek', en: 'Shirt' }, { tr: 'Pantolon', en: 'Trousers' }, { tr: 'Elbise', en: 'Dress' },
    { tr: 'Ayakkabı', en: 'Shoes' }, { tr: 'Şapka', en: 'Hat' }, { tr: 'Ceket', en: 'Jacket' },
    { tr: 'Çorap', en: 'Socks' }, { tr: 'Atkı', en: 'Scarf' }, { tr: 'Eldiven', en: 'Gloves' },
    { tr: 'Araba', en: 'Car' }, { tr: 'Otobüs', en: 'Bus' }, { tr: 'Tren', en: 'Train' },
    { tr: 'Uçak', en: 'Airplane' }, { tr: 'Gemi', en: 'Ship' }, { tr: 'Metro', en: 'Metro' },
    { tr: 'Doktor', en: 'Doctor' }, { tr: 'Hastane', en: 'Hospital' }, { tr: 'İlaç', en: 'Medicine' },
    { tr: 'Sağlıklı', en: 'Healthy' }, { tr: 'Hasta', en: 'Sick' }, { tr: 'Diş', en: 'Tooth' },
    { tr: 'Market', en: 'Market' }, { tr: 'Para', en: 'Money' }, { tr: 'Fiyat', en: 'Price' },
    { tr: 'İndirim', en: 'Discount' }, { tr: 'Alışveriş', en: 'Shopping' }, { tr: 'Mağaza', en: 'Store' },
    { tr: 'Sıcak', en: 'Hot' }, { tr: 'Soğuk', en: 'Cold' }, { tr: 'Ilık', en: 'Warm' },
    { tr: 'Hafif', en: 'Light' }, { tr: 'Ağır', en: 'Heavy' }, { tr: 'Uzun', en: 'Tall' },
    { tr: 'Kısa', en: 'Short' }, { tr: 'Güzel', en: 'Beautiful' }, { tr: 'Çirkin', en: 'Ugly' },
  ],
  7: [
    { tr: 'Orman', en: 'Forest' }, { tr: 'Çevre', en: 'Environment' }, { tr: 'Kirlilik', en: 'Pollution' },
    { tr: 'Geri dönüşüm', en: 'Recycling' }, { tr: 'Enerji', en: 'Energy' }, { tr: 'İklim', en: 'Climate' },
    { tr: 'Deprem', en: 'Earthquake' }, { tr: 'Sel', en: 'Flood' }, { tr: 'Volkan', en: 'Volcano' },
    { tr: 'Bilgisayar', en: 'Computer' }, { tr: 'İnternet', en: 'Internet' }, { tr: 'Telefon', en: 'Phone' },
    { tr: 'Uygulama', en: 'Application' }, { tr: 'Robot', en: 'Robot' }, { tr: 'Yazılım', en: 'Software' },
    { tr: 'Seyahat', en: 'Travel' }, { tr: 'Otel', en: 'Hotel' }, { tr: 'Pasaport', en: 'Passport' },
    { tr: 'Harita', en: 'Map' }, { tr: 'Turist', en: 'Tourist' }, { tr: 'Rehber', en: 'Guide' },
    { tr: 'Televizyon', en: 'Television' }, { tr: 'Gazete', en: 'Newspaper' }, { tr: 'Dergi', en: 'Magazine' },
    { tr: 'Film', en: 'Movie' }, { tr: 'Haber', en: 'News' }, { tr: 'Reklam', en: 'Advertisement' },
    { tr: 'Deney', en: 'Experiment' }, { tr: 'Keşif', en: 'Discovery' }, { tr: 'Araştırma', en: 'Research' },
    { tr: 'Müzik', en: 'Music' }, { tr: 'Tiyatro', en: 'Theatre' }, { tr: 'Şiir', en: 'Poetry' },
    { tr: 'Kutlama', en: 'Celebration' }, { tr: 'Festival', en: 'Festival' }, { tr: 'Gelenek', en: 'Tradition' },
    { tr: 'Sergi', en: 'Exhibition' }, { tr: 'Müze', en: 'Museum' }, { tr: 'Kültür', en: 'Culture' },
    { tr: 'Görünüş', en: 'Appearance' }, { tr: 'Kişilik', en: 'Personality' }, { tr: 'Alışkanlık', en: 'Habit' },
    { tr: 'Başarı', en: 'Achievement' }, { tr: 'Zorluk', en: 'Challenge' }, { tr: 'Çözüm', en: 'Solution' },
  ],
  8: [
    { tr: 'Üniversite', en: 'University' }, { tr: 'Mezuniyet', en: 'Graduation' }, { tr: 'Burs', en: 'Scholarship' },
    { tr: 'Eğitim', en: 'Education' }, { tr: 'Meslek', en: 'Career' }, { tr: 'Sertifika', en: 'Certificate' },
    { tr: 'Demokrasi', en: 'Democracy' }, { tr: 'Seçim', en: 'Election' }, { tr: 'Özgürlük', en: 'Freedom' },
    { tr: 'Anayasa', en: 'Constitution' }, { tr: 'Vatandaş', en: 'Citizen' }, { tr: 'Hak', en: 'Right' },
    { tr: 'Küresel', en: 'Global' }, { tr: 'Barış', en: 'Peace' }, { tr: 'Yoksulluk', en: 'Poverty' },
    { tr: 'Sürdürülebilir', en: 'Sustainable' }, { tr: 'Kaynak', en: 'Resource' }, { tr: 'Gelecek', en: 'Future' },
    { tr: 'Kariyer', en: 'Career' }, { tr: 'Liderlik', en: 'Leadership' }, { tr: 'Hedef', en: 'Goal' },
    { tr: 'Strateji', en: 'Strategy' }, { tr: 'Fırsat', en: 'Opportunity' }, { tr: 'Risk', en: 'Risk' },
    { tr: 'Yapay Zeka', en: 'Artificial Intelligence' }, { tr: 'Programlama', en: 'Programming' },
    { tr: 'Veri', en: 'Data' }, { tr: 'Dijital', en: 'Digital' }, { tr: 'İnovasyon', en: 'Innovation' },
    { tr: 'Uzay', en: 'Space' }, { tr: 'Gezegen', en: 'Planet' }, { tr: 'Galaksi', en: 'Galaxy' },
    { tr: 'Kuvvet', en: 'Force' }, { tr: 'Enerji', en: 'Energy' }, { tr: 'Dalga', en: 'Wave' },
    { tr: 'Adalet', en: 'Justice' }, { tr: 'Eşitlik', en: 'Equality' }, { tr: 'Sorumluluk', en: 'Responsibility' },
    { tr: 'Arkadaşlık', en: 'Friendship' }, { tr: 'Güven', en: 'Trust' }, { tr: 'Saygı', en: 'Respect' },
    { tr: 'Empati', en: 'Empathy' }, { tr: 'İletişim', en: 'Communication' }, { tr: 'İşbirliği', en: 'Cooperation' },
  ],
};

const MEB_REWARD = 10;
const MEB_TIME = 120;
const PAIRS_PER_GAME = 8;

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function buildCards(words) {
  const pairs = shuffle(words).slice(0, PAIRS_PER_GAME);
  const cards = [];
  pairs.forEach((pair, i) => {
    const pairId = `pair_${i}`;
    cards.push({ id: `en_${i}`, pairId, lang: 'en', word: pair.en, flipped: false, matched: false });
    cards.push({ id: `tr_${i}`, pairId, lang: 'tr', word: pair.tr, flipped: false, matched: false });
  });
  return shuffle(cards);
}

const KelimeAvi = ({ studentName, appData, onBack }) => {
  const [view, setView] = useState('list');
  const [sets, setSets] = useState({});
  const [plays, setPlays] = useState({});
  const [isMebGame, setIsMebGame] = useState(false);
  const [activeSetId, setActiveSetId] = useState(null);
  const [activeSetTitle, setActiveSetTitle] = useState('');
  const [cards, setCards] = useState([]);
  const [firstSel, setFirstSel] = useState(null);
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MEB_TIME);
  const [totalTime, setTotalTime] = useState(MEB_TIME);
  const [gameReward, setGameReward] = useState(0);
  const [gameResult, setGameResult] = useState({ matched: 0, total: 0, reward: 0, attempts: 0 });
  const timerRef = useRef(null);
  const timeLeftRef = useRef(MEB_TIME);
  const matchedRef = useRef(0);
  const totalPairsRef = useRef(PAIRS_PER_GAME);

  const studentGrade = parseInt(appData?.student_classes?.[studentName]) || 5;

  useEffect(() => {
    const ref = db.ref('mavikent_premium/kelime_avi_sets');
    ref.on('value', s => setSets(s.val() || {}));
    return () => ref.off();
  }, []);

  useEffect(() => {
    if (!studentName) return;
    const ref = db.ref(`mavikent_premium/kelime_avi_plays/${studentName}`);
    ref.on('value', s => setPlays(s.val() || {}));
    return () => ref.off();
  }, [studentName]);

  useEffect(() => {
    if (view !== 'game') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 0) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [view, activeSetId, isMebGame]); // eslint-disable-line

  const handleTimeUp = useCallback(() => {
    clearInterval(timerRef.current);
    endGame(timeLeftRef.current, matchedRef.current);
  }, []); // eslint-disable-line

  const startGame = (setId, setData) => {
    const words = Array.isArray(setData.words) ? setData.words : Object.values(setData.words || {});
    const gameCards = buildCards(words);
    setCards(gameCards);
    setFirstSel(null);
    setChecking(false);
    setAttempts(0);
    setMatchedCount(0);
    matchedRef.current = 0;
    totalPairsRef.current = gameCards.length / 2;
    setActiveSetId(setId);
    setActiveSetTitle(setData.title || 'Kelime Avı');
    setIsMebGame(false);
    const tl = Number(setData.time_limit) || MEB_TIME;
    setTimeLeft(tl);
    setTotalTime(tl);
    setGameReward(Number(setData.total_reward) || 0);
    timeLeftRef.current = tl;
    setView('game');
  };

  const startMebGame = () => {
    const mebWords = MEB_WORDS[studentGrade] || MEB_WORDS[5];
    const gameCards = buildCards(mebWords);
    setCards(gameCards);
    setFirstSel(null);
    setChecking(false);
    setAttempts(0);
    setMatchedCount(0);
    matchedRef.current = 0;
    totalPairsRef.current = gameCards.length / 2;
    setActiveSetId('meb');
    setActiveSetTitle(`${studentGrade}. Sınıf MEB Müfredatı`);
    setIsMebGame(true);
    setTimeLeft(MEB_TIME);
    setTotalTime(MEB_TIME);
    setGameReward(MEB_REWARD);
    timeLeftRef.current = MEB_TIME;
    setView('game');
  };

  const endGame = (remaining, matched) => {
    clearInterval(timerRef.current);
    const total = totalPairsRef.current;
    const reward = isMebGame
      ? (matched === total ? MEB_REWARD : Math.round((matched / total) * MEB_REWARD))
      : Math.round(Math.max(0, remaining) / totalTime * gameReward * (matched / total));
    const earned = Math.max(reward, matched > 0 ? 2 : 0);

    if (!isMebGame && activeSetId) {
      db.ref(`mavikent_premium/kelime_avi_plays/${studentName}/${activeSetId}`).set({
        completed: true,
        reward_earned: earned,
        date: new Date().toLocaleDateString('tr-TR'),
      });
    }

    if (earned > 0) {
      const bal = Number(appData?.wallet?.[studentName] || 0);
      const ts = Date.now();
      db.ref('mavikent_premium').update({
        [`wallet/${studentName}`]: bal + earned,
        [`transactions/${studentName}/txn_ka_${ts}`]: {
          desc: `🃏 Kelime Eşleştirme: ${activeSetTitle}`,
          amt: earned,
          date: new Date().toLocaleString('tr-TR'),
        },
      });
    }

    setGameResult({ matched, total, reward: earned, attempts });
    setView('result');
  };

  const handleCardClick = useCallback((card) => {
    if (checking || card.flipped || card.matched) return;

    const flippedCard = { ...card, flipped: true };
    setCards(prev => prev.map(c => c.id === card.id ? flippedCard : c));

    if (firstSel === null) {
      setFirstSel(card.id);
    } else {
      const first = cards.find(c => c.id === firstSel);
      if (!first) { setFirstSel(card.id); return; }

      setChecking(true);
      setAttempts(prev => prev + 1);

      if (first.pairId === card.pairId) {
        // Match!
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c =>
              c.id === firstSel || c.id === card.id ? { ...c, flipped: true, matched: true } : c
            );
            const newMatchedCount = updated.filter(c => c.matched).length / 2;
            matchedRef.current = newMatchedCount;
            setMatchedCount(newMatchedCount);
            if (newMatchedCount >= totalPairsRef.current) {
              clearInterval(timerRef.current);
              setTimeout(() => endGame(timeLeftRef.current, newMatchedCount), 300);
            }
            return updated;
          });
          setFirstSel(null);
          setChecking(false);
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstSel || c.id === card.id ? { ...c, flipped: false } : c
          ));
          setFirstSel(null);
          setChecking(false);
        }, 1000);
      }
    }
  }, [checking, firstSel, cards]); // eslint-disable-line

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const timerColor = timeLeft < 30 ? '#ef4444' : timeLeft < 60 ? '#f59e0b' : '#10b981';

  const cardSize = Math.min(78, Math.floor((Math.min(window.innerWidth, 430) - 40 - 24) / 4));

  // ─── LIST VIEW ─────────────────────────────────────────────
  if (view === 'list') {
    const customSets = Object.entries(sets).filter(([, s]) => s.active && parseInt(s.grade) === studentGrade);
    return (
      <div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontWeight: 700, color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', padding: 0 }}>
          ← Akademi'ye Dön
        </button>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ fontSize: '52px', marginBottom: '6px' }}>🃏</div>
          <h2 style={{ fontWeight: 900, fontSize: '24px', color: '#0f172a', margin: '0 0 6px' }}>Kelime Eşleştirme</h2>
          <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', padding: '4px 14px', fontSize: '13px', fontWeight: 700 }}>
            {studentGrade}. Sınıf
          </span>
        </div>

        {/* MEB Müfredatı — sınırsız */}
        <div
          onClick={startMebGame}
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: '22px', padding: '20px', marginBottom: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(109,40,217,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '36px' }}>🎓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '16px', color: 'white' }}>MEB Müfredatı</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>
                {studentGrade}. Sınıf kelimelerinden 8 çift — her seferinde farklı!
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>♾ Sınırsız</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>⏱ 2 dk</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>🪙 Max {MEB_REWARD}</span>
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '22px' }}>›</span>
          </div>
        </div>

        {/* Öğretmen Setleri */}
        {customSets.length > 0 && (
          <>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', margin: '20px 0 10px' }}>ÖĞRETMEN SETLERİ</div>
            {customSets.map(([id, s]) => {
              const done = !!plays[id]?.completed;
              const words = Array.isArray(s.words) ? s.words : Object.values(s.words || {});
              return (
                <div key={id} style={{ background: 'white', borderRadius: '18px', padding: '18px', border: `2px solid ${done ? '#bbf7d0' : '#f1f5f9'}`, boxShadow: '0 4px 14px rgba(0,0,0,0.04)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>{s.title || 'İsimsiz Set'}</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#64748b', padding: '2px 9px', borderRadius: '9px', fontWeight: 600 }}>⏱ {formatTime(s.time_limit || MEB_TIME)}</span>
                        <span style={{ fontSize: '12px', background: '#fffbeb', color: '#d97706', padding: '2px 9px', borderRadius: '9px', fontWeight: 600 }}>🪙 Max {s.total_reward}</span>
                        <span style={{ fontSize: '12px', background: '#eff6ff', color: '#3b82f6', padding: '2px 9px', borderRadius: '9px', fontWeight: 600 }}>{words.length} kelime</span>
                      </div>
                    </div>
                    {done ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px' }}>✅</div>
                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800 }}>+{plays[id].reward_earned}</div>
                      </div>
                    ) : (
                      <button onClick={() => startGame(id, s)}
                        style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Oyna ▶
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {customSets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '16px', color: '#94a3b8', fontWeight: 700, fontSize: '14px' }}>
            Öğretmenin henüz özel set eklememiş.<br />MEB Müfredatı ile pratik yapabilirsin!
          </div>
        )}
      </div>
    );
  }

  // ─── GAME VIEW ─────────────────────────────────────────────
  if (view === 'game') {
    const totalPairs = cards.length / 2;
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeSetTitle}</div>
          <div style={{ fontWeight: 900, fontSize: '22px', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{matchedCount}/{totalPairs}</div>
        </div>

        {/* İlerleme */}
        <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '5px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ width: `${(matchedCount / totalPairs) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: '999px', transition: 'width 0.3s' }} />
        </div>

        {/* Kart Açıklaması */}
        <div style={{ textAlign: 'center', marginBottom: '14px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          🔵 İngilizce kartı ile 🟢 Türkçe kartını eşleştir
        </div>

        {/* Kart Izgara — 4x4 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(4, ${cardSize}px)`,
          gap: '7px',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          {cards.map(card => {
            const isSelected = card.id === firstSel && !card.matched;
            return (
              <div
                key={card.id}
                style={{ width: cardSize, height: cardSize + 8, perspective: '700px', cursor: card.matched || card.flipped ? 'default' : 'pointer' }}
                onClick={() => handleCardClick(card)}>
                {/* 3D flip container */}
                <div style={{
                  width: '100%', height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
                  transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>
                  {/* Ön yüz (kapalı) */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    background: isSelected ? '#1e40af' : '#1e3a8a',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isSelected ? '2px solid #93c5fd' : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: isSelected ? '0 0 12px rgba(96,165,250,0.5)' : '0 3px 8px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '8px' }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ width: 8, height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }} />
                      ))}
                    </div>
                  </div>
                  {/* Arka yüz (açık) */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: card.matched
                      ? '#dcfce7'
                      : card.lang === 'en'
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                        : 'linear-gradient(135deg, #059669, #047857)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '5px',
                    border: card.matched ? '2px solid #86efac' : 'none',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                  }}>
                    <span style={{
                      fontWeight: 900,
                      fontSize: card.word.length > 10 ? 9 : card.word.length > 7 ? 11 : 13,
                      color: card.matched ? '#15803d' : 'white',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                    }}>
                      {card.matched ? '✓' : (card.lang === 'en' ? '🇬🇧' : '🇹🇷')}{' '}{card.word}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deneme sayısı */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          Deneme: {attempts}
        </div>
      </div>
    );
  }

  // ─── RESULT VIEW ────────────────────────────────────────────
  if (view === 'result') {
    const perfect = gameResult.matched === gameResult.total;
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '72px', marginBottom: '12px' }}>{perfect ? '🎯' : gameResult.matched >= gameResult.total / 2 ? '👍' : '💪'}</div>
        <h2 style={{ fontWeight: 900, fontSize: '26px', color: '#0f172a', margin: '0 0 6px' }}>
          {perfect ? 'Mükemmel!' : gameResult.matched > 0 ? 'İyi İş!' : 'Süre Doldu!'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px', fontWeight: 600 }}>
          {gameResult.matched}/{gameResult.total} çift eşleştirildi · {gameResult.attempts} deneme
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Eşleştirilen', value: `${gameResult.matched}/${gameResult.total}`, color: '#8b5cf6', icon: '🃏' },
            { label: 'Kazanılan', value: `+${gameResult.reward} M-Coin`, color: '#f59e0b', icon: '🪙' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setView('list')}
          style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(109,40,217,0.3)' }}>
          {isMebGame ? 'Tekrar Oyna ↩' : 'Set Listesine Dön'}
        </button>
        {isMebGame && (
          <button onClick={startMebGame}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 14px rgba(59,130,246,0.25)' }}>
            🔄 Yeni Kelimelerle Oyna
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default KelimeAvi;
