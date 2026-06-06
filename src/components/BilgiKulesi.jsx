import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { toast } from '../toast';

const QUESTIONS = [
  // Türkiye Coğrafyası
  { q: "Türkiye'nin başkenti hangisidir?", o: ["İstanbul","Ankara","İzmir","Bursa"], a: 1 },
  { q: "Türkiye'nin en büyük gölü hangisidir?", o: ["Tuz Gölü","Burdur Gölü","Van Gölü","Eğirdir Gölü"], a: 2 },
  { q: "Türkiye kaç ülkeyle kara sınırı paylaşır?", o: ["6","7","8","9"], a: 2 },
  { q: "Türkiye'nin en uzun nehri hangisidir?", o: ["Fırat","Dicle","Sakarya","Kızılırmak"], a: 3 },
  { q: "Türkiye'de kaç il bulunmaktadır?", o: ["76","79","81","84"], a: 2 },
  { q: "Türkiye hangi kıtalarda yer alır?", o: ["Sadece Asya","Sadece Avrupa","Asya ve Avrupa","Afrika ve Asya"], a: 2 },
  { q: "Türkiye'nin en kalabalık şehri hangisidir?", o: ["Ankara","İzmir","İstanbul","Bursa"], a: 2 },
  { q: "Hem Avrupa hem Asya'da yer alan şehrimiz hangisidir?", o: ["Ankara","İzmir","Bursa","İstanbul"], a: 3 },
  { q: "Türkiye'nin en yüksek dağı hangisidir?", o: ["Erciyes","Kaçkar","Ağrı","Uludağ"], a: 2 },
  { q: "Marmara Denizi hangi iki boğazla açık denize bağlanır?", o: ["Çanakkale ve Boğaziçi","Hürmüz ve Süveyş","Cebelitarık ve Bosfor","Malakka ve Hürmüz"], a: 0 },
  { q: "Türkiye'de hangi bölgede en fazla yağış görülür?", o: ["İç Anadolu","Doğu Anadolu","Karadeniz","Güneydoğu Anadolu"], a: 2 },
  { q: "Türkiye'nin en batısındaki şehri hangisidir?", o: ["İzmir","Çanakkale","Edirne","Tekirdağ"], a: 2 },

  // Dünya Coğrafyası
  { q: "Dünyanın en yüksek dağı hangisidir?", o: ["K2","Kilimanjaro","Everest","Mont Blanc"], a: 2 },
  { q: "Dünyanın en büyük okyanusu hangisidir?", o: ["Atlantik","Hint","Arktik","Pasifik"], a: 3 },
  { q: "Japonya'nın başkenti neresidir?", o: ["Osaka","Kyoto","Tokyo","Hiroshima"], a: 2 },
  { q: "Nil Nehri hangi kıtada bulunur?", o: ["Asya","Afrika","Avrupa","Okyanusya"], a: 1 },
  { q: "Avustralya'nın başkenti neresidir?", o: ["Sidney","Melbourne","Kanberra","Perth"], a: 2 },
  { q: "Amazon Ormanları hangi kıtada bulunur?", o: ["Afrika","Asya","Güney Amerika","Kuzey Amerika"], a: 2 },
  { q: "Kuzey Kore'nin başkenti neresidir?", o: ["Seul","Pyongyang","Pekin","Tokyo"], a: 1 },
  { q: "Dünyanın en büyük ülkesi hangisidir?", o: ["Kanada","Çin","ABD","Rusya"], a: 3 },
  { q: "Avrupa'nın en uzun nehri hangisidir?", o: ["Tuna","Volga","Ren","Thames"], a: 1 },
  { q: "Dünyanın en büyük çölü hangisidir?", o: ["Sahra","Gobi","Atacama","Antarktika"], a: 3 },
  { q: "En fazla ülkeyle sınır komşusu olan ülke hangisidir?", o: ["Rusya","Çin","Brezilya","Almanya"], a: 1 },
  { q: "Dünyanın en kalabalık ülkesi hangisidir?", o: ["Hindistan","Çin","ABD","Endonezya"], a: 0 },
  { q: "Fransa'nın başkenti neresidir?", o: ["Londra","Berlin","Paris","Madrid"], a: 2 },
  { q: "Mısır hangi kıtada bulunur?", o: ["Asya","Afrika","Avrupa","Okyanusya"], a: 1 },

  // Türk Tarihi
  { q: "Türkiye Cumhuriyeti hangi yılda kurulmuştur?", o: ["1919","1920","1923","1928"], a: 2 },
  { q: "İstanbul'un fethi hangi yılda gerçekleşmiştir?", o: ["1399","1453","1492","1517"], a: 1 },
  { q: "İstanbul'u fetheden Osmanlı padişahı kimdir?", o: ["I. Murat","II. Bayezid","I. Mehmet","II. Mehmet (Fatih)"], a: 3 },
  { q: "Kurtuluş Savaşı hangi yılda başlamıştır?", o: ["1918","1919","1920","1921"], a: 1 },
  { q: "Türk alfabesi hangi yılda kabul edilmiştir?", o: ["1925","1928","1930","1932"], a: 1 },
  { q: "Atatürk hangi şehirde doğmuştur?", o: ["İstanbul","Ankara","Selanik","İzmir"], a: 2 },
  { q: "Türkiye'de kadınlara oy hakkı hangi yılda tanınmıştır?", o: ["1930","1934","1938","1945"], a: 1 },
  { q: "Çanakkale Savaşları hangi yılda yaşanmıştır?", o: ["1912–1913","1915–1916","1918–1919","1919–1920"], a: 1 },
  { q: "Osmanlı Devleti'nin kurucusu kimdir?", o: ["Orhan Bey","Osman Bey","Ertuğrul Bey","Alp Arslan"], a: 1 },
  { q: "Malazgirt Savaşı hangi yılda gerçekleşmiştir?", o: ["1071","1176","1243","1453"], a: 0 },
  { q: "Türkiye'nin ilk cumhurbaşkanı kimdir?", o: ["İsmet İnönü","Celal Bayar","Mustafa Kemal Atatürk","Adnan Menderes"], a: 2 },
  { q: "Türkiye Büyük Millet Meclisi hangi yılda açılmıştır?", o: ["1918","1919","1920","1923"], a: 2 },

  // Dünya Tarihi
  { q: "Mısır piramitleri hangi uygarlık tarafından inşa edilmiştir?", o: ["Romalılar","Yunanlılar","Eski Mısırlılar","Mezopotamyalılar"], a: 2 },
  { q: "Birinci Dünya Savaşı hangi yılda başlamıştır?", o: ["1912","1914","1916","1918"], a: 1 },
  { q: "İkinci Dünya Savaşı hangi yılda sona ermiştir?", o: ["1943","1944","1945","1946"], a: 2 },
  { q: "Amerika kıtasını keşfeden Avrupalı kaşif kimdir?", o: ["Macellan","Vasco da Gama","Kristof Kolomb","Marco Polo"], a: 2 },
  { q: "İlk uyduyu uzaya fırlatan ülke hangisidir?", o: ["ABD","Çin","Sovyetler Birliği","Fransa"], a: 2 },

  // Fen Bilgisi
  { q: "Güneş sistemimizdeki gezegen sayısı kaçtır?", o: ["7","8","9","10"], a: 1 },
  { q: "Suyun kimyasal formülü nedir?", o: ["CO2","O2","H2O","NaCl"], a: 2 },
  { q: "Işık hızı yaklaşık kaçtır?", o: ["100.000 km/s","200.000 km/s","300.000 km/s","400.000 km/s"], a: 2 },
  { q: "Güneşe en yakın gezegen hangisidir?", o: ["Venüs","Mars","Merkür","Dünya"], a: 2 },
  { q: "İnsan vücudunda kaç kemik bulunur?", o: ["186","196","206","216"], a: 2 },
  { q: "Bitkiler fotosentez yaparak hangi gazı üretir?", o: ["Azot","Karbondioksit","Oksijen","Hidrojen"], a: 2 },
  { q: "Ses hangi ortamda yayılamaz?", o: ["Su","Hava","Katı maddeler","Uzay boşluğu"], a: 3 },
  { q: "En hafif element hangisidir?", o: ["Helyum","Hidrojen","Lityum","Oksijen"], a: 1 },
  { q: "Hangi gaz yanan maddeleri söndürür?", o: ["Oksijen","Hidrojen","Azot","Karbondioksit"], a: 3 },
  { q: "Depremler neden oluşur?", o: ["Volkanlar patladığında","Yer kabuğu levhalarının hareketiyle","Ağır yağmurlardan","Şimşek çaktığında"], a: 1 },
  { q: "Dünya kaç saatte bir kendi etrafında döner?", o: ["12","24","36","48"], a: 1 },
  { q: "Demir elementinin sembolü nedir?", o: ["De","Fe","Dm","Ir"], a: 1 },
  { q: "Altın elementinin sembolü nedir?", o: ["Al","Ag","Au","An"], a: 2 },
  { q: "Elmasın Mohs sertlik derecesi kaçtır?", o: ["8","9","10","11"], a: 2 },
  { q: "Ozon tabakası hangi gazdan oluşur?", o: ["Oksijen (O2)","Ozon (O3)","Azot (N2)","Karbondioksit"], a: 1 },
  { q: "Depremlerin şiddetini ölçen alet nedir?", o: ["Termometre","Barometre","Sismograf","Anemometre"], a: 2 },
  { q: "Yerçekimini keşfeden bilim insanı kimdir?", o: ["Einstein","Newton","Galileo","Kepler"], a: 1 },
  { q: "Su kaç derecede kaynar?", o: ["90°C","95°C","100°C","110°C"], a: 2 },
  { q: "Su kaç derecede donar?", o: ["-5°C","0°C","5°C","10°C"], a: 1 },
  { q: "Hava basıncını ölçen alet nedir?", o: ["Termometre","Barometre","Sismograf","Anemometre"], a: 1 },
  { q: "Rüzgar hızını ölçen alet nedir?", o: ["Termometre","Barometre","Sismograf","Anemometre"], a: 3 },
  { q: "Güneş'ten Dünya'ya ışık kaç dakikada ulaşır?", o: ["2 dakika","4 dakika","8 dakika","15 dakika"], a: 2 },
  { q: "Isıyı iyi ileten maddelere ne denir?", o: ["İzolatör","İletken","Yarı iletken","Yalıtkan"], a: 1 },

  // Matematik
  { q: "Bir üçgenin iç açıları toplamı kaç derecedir?", o: ["90°","180°","270°","360°"], a: 1 },
  { q: "π (pi) sayısı yaklaşık kaçtır?", o: ["2,14","3,14","4,14","5,14"], a: 1 },
  { q: "Bir yılda kaç hafta vardır?", o: ["48","50","52","54"], a: 2 },
  { q: "√144 (144'ün karekökü) kaçtır?", o: ["10","11","12","13"], a: 2 },
  { q: "3³ (3 üzeri 3) kaçtır?", o: ["9","18","27","36"], a: 2 },
  { q: "Bir dairenin alanı nasıl hesaplanır?", o: ["π × r","2 × π × r","π × r²","2 × π × r²"], a: 2 },
  { q: "7 × 8 kaçtır?", o: ["54","56","58","64"], a: 1 },
  { q: "Bir kilogramda kaç gram vardır?", o: ["100","500","1000","10000"], a: 2 },
  { q: "Tam sayılarda sıfırın ne olduğu söylenir?", o: ["Pozitif","Negatif","Ne pozitif ne negatif","Belirsiz"], a: 2 },
  { q: "Bir dikdörtgenin çevresi nasıl hesaplanır?", o: ["Uzun × Kısa","2 × (Uzun + Kısa)","Uzun + Kısa","4 × Kenar"], a: 1 },

  // Hayvanlar
  { q: "Hangi hayvan 'ormanın kralı' olarak bilinir?", o: ["Kaplan","Aslan","Fil","Ayı"], a: 1 },
  { q: "En büyük kara hayvanı hangisidir?", o: ["Fil","Gergedan","Hipopotam","Zürafa"], a: 0 },
  { q: "Hangi hayvan en hızlı koşandır?", o: ["Aslan","At","Çita","Leopar"], a: 2 },
  { q: "Balıkların nefes almasını sağlayan organ nedir?", o: ["Akciğer","Solungaç","Deri","Böbrek"], a: 1 },
  { q: "Hangi kuş uçamaz?", o: ["Kartal","Şahin","Deve kuşu","Martı"], a: 2 },
  { q: "Kaç bacağı olan hayvanlar 'böcek' sayılır?", o: ["4","6","8","10"], a: 1 },
  { q: "En büyük deniz memelisi hangisidir?", o: ["Köpek balığı","Yunus","Mavi balina","Fok"], a: 2 },
  { q: "Arıların yaşadığı yere ne denir?", o: ["Yuva","Kovuk","Kovan","İn"], a: 2 },
  { q: "Kelebek hangi canlıdan dönüşür?", o: ["Yumurta → Sinek","Yumurta → Tırtıl","Larva → Yumurta","Tırtıl → Pupa"], a: 3 },
  { q: "Hangi hayvanın boynu en uzundur?", o: ["Fil","Deve","Zürafa","At"], a: 2 },
  { q: "Ahtapot kaç kola sahiptir?", o: ["4","6","8","10"], a: 2 },
  { q: "Hangi böcek bal üretir?", o: ["Kelebek","Arı","Karınca","Sinek"], a: 1 },
  { q: "Göç eden kuşlar kışın genellikle hangi yönlere uçar?", o: ["Kuzey","Güney","Doğu","Batı"], a: 1 },

  // Uzay ve Astronomi
  { q: "Güneş'ten en uzak gezegen hangisidir?", o: ["Uranüs","Satürn","Neptün","Jüpiter"], a: 2 },
  { q: "Güneş sisteminin en büyük gezegeni hangisidir?", o: ["Satürn","Uranüs","Neptün","Jüpiter"], a: 3 },
  { q: "Ay, Dünya'nın etrafını kaç günde bir döner?", o: ["7 günde","14 günde","29-30 günde","365 günde"], a: 2 },
  { q: "Dünya'nın Güneş etrafındaki dönüş süresi kaç gündür?", o: ["300","330","360","365"], a: 3 },
  { q: "Ay'a ilk adım atan astronot kimdir?", o: ["Yuri Gagarin","Buzz Aldrin","Neil Armstrong","John Glenn"], a: 2 },
  { q: "Kuzey Kutup Yıldızı'nın adı nedir?", o: ["Sirius","Polaris","Vega","Arcturus"], a: 1 },
  { q: "Güneş hangi türde bir yıldızdır?", o: ["Dev yıldız","Beyaz cüce","Sarı cüce","Nötron yıldızı"], a: 2 },
  { q: "Satürn'ün en belirgin özelliği nedir?", o: ["Büyük boyutu","Halkaları","Kırmızı rengi","Çok uydusu"], a: 1 },

  // Vücut ve Sağlık
  { q: "Kanı pompalayan organ hangisidir?", o: ["Akciğer","Böbrek","Karaciğer","Kalp"], a: 3 },
  { q: "Hangi vitamin güneş ışığıyla üretilir?", o: ["A vitamini","B vitamini","C vitamini","D vitamini"], a: 3 },
  { q: "Kemik ve dişleri güçlendiren mineral nedir?", o: ["Demir","Kalsiyum","Potasyum","Magnezyum"], a: 1 },
  { q: "İnsülin hormonu hangi organ tarafından üretilir?", o: ["Karaciğer","Böbrek","Pankreas","Mide"], a: 2 },
  { q: "Vücudumuzun en büyük organı hangisidir?", o: ["Kalp","Karaciğer","Akciğer","Deri"], a: 3 },
  { q: "Duyularımızın merkezi olan organ hangisidir?", o: ["Kalp","Akciğer","Beyin","Mide"], a: 2 },
  { q: "Bir insanın ortalama vücut ısısı kaçtır?", o: ["35°C","36,5°C","38°C","39°C"], a: 1 },
  { q: "İnsan kanının rengi neden kırmızıdır?", o: ["Demir içerdiğinden","Su içerdiğinden","Hemoglobin içerdiğinden","Kalsiyum içerdiğinden"], a: 2 },

  // Bitkiler ve Çevre
  { q: "Fotosentez nerede gerçekleşir?", o: ["Kök","Gövde","Yaprak","Çiçek"], a: 2 },
  { q: "Hangi bitki böcek yiyen (etobur) bir bitkidir?", o: ["Gül","Venüs kapanı","Ayçiçeği","Domates"], a: 1 },
  { q: "Küresel ısınmanın en önemli nedeni nedir?", o: ["Orman yangınları","Sera gazı salınımı","Volkanik patlamalar","Güneş aktivitesi"], a: 1 },
  { q: "Ağaçların gövdesindeki halka sayısı neyi gösterir?", o: ["Yüksekliği","Yaşını","Kalınlığını","Sağlığını"], a: 1 },
  { q: "Bitkiler için fotosentezde kullanılan gaz hangisidir?", o: ["Oksijen","Azot","Karbondioksit","Hidrojen"], a: 2 },

  // Genel Kültür ve Spor
  { q: "Mısır piramitlerinin bulunduğu şehir hangisidir?", o: ["Kahire","Giza","Luxor","İskenderiye"], a: 1 },
  { q: "Nobel ödülleri hangi ülkede verilmektedir?", o: ["Danimarka","Finlandiya","İsveç ve Norveç","Hollanda"], a: 2 },
  { q: "Dünyanın en yüksek binası hangisidir?", o: ["Burj Al Arab","Empire State","Burj Khalifa","Shanghai Tower"], a: 2 },
  { q: "Mona Lisa tablosunu kim yapmıştır?", o: ["Michelangelo","Raphael","Leonardo da Vinci","Botticelli"], a: 2 },
  { q: "Futbolda bir takımda kaç oyuncu oynar?", o: ["9","10","11","12"], a: 2 },
  { q: "Olimpiyat Oyunları kaç yılda bir düzenlenir?", o: ["2 yılda bir","4 yılda bir","5 yılda bir","6 yılda bir"], a: 1 },
  { q: "Olimpiyat bayrağındaki çember sayısı kaçtır?", o: ["4","5","6","7"], a: 1 },
  { q: "Türkçe alfabesinde kaç harf bulunur?", o: ["26","27","28","29"], a: 3 },
  { q: "Bir oktavda kaç nota vardır?", o: ["5","7","8","12"], a: 2 },
  { q: "Ampulü icat eden kimdir?", o: ["Tesla","Edison","Franklin","Watt"], a: 1 },
  { q: "Telefonu kim icat etmiştir?", o: ["Thomas Edison","Nikola Tesla","Alexander Graham Bell","Samuel Morse"], a: 2 },
  { q: "BM (Birleşmiş Milletler) kaç ülkeden oluşmaktadır?", o: ["150","170","193","210"], a: 2 },
  { q: "Sakura festiveli hangi ülkeyle özdeşleşmiştir?", o: ["Çin","Japonya","Kore","Vietnam"], a: 1 },
  { q: "Hangi ülkenin bayrağında kırmızı-beyaz ay-yıldız vardır?", o: ["Türkiye","Hindistan","Japonya","Brezilya"], a: 0 },
  { q: "Hangi spor dalında 'grand slam' terimi kullanılır?", o: ["Futbol","Basketbol","Tenis","Voleybol"], a: 2 },
  { q: "Türkiye'de hangi spor en fazla seyirciye sahiptir?", o: ["Basketbol","Futbol","Voleybol","Güreş"], a: 1 },
];

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const todayKey = () => new Date().toISOString().slice(0, 10);
const MAX_DAILY = 2;

const BilgiKulesi = ({ studentName, appData, onBack }) => {
  const [view, setView] = useState('lobby');
  const [qs, setQs] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [floor, setFloor] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [dailyPlays, setDailyPlays] = useState(0);
  const [leaderboard, setLeaderboard] = useState({});
  const [settings, setSettings] = useState({ milestone_reward: 5, final_reward: 25 });
  const [totalCoins, setTotalCoins] = useState(0);
  const [gameResult, setGameResult] = useState({ floor: 0, coins: 0 });
  const answerLocked = useRef(false);

  useEffect(() => {
    const r1 = db.ref('mavikent_premium/bilgi_kulesi_settings');
    r1.on('value', s => { if (s.val()) setSettings(s.val()); });
    const r2 = db.ref('mavikent_premium/bilgi_kulesi_leaderboard');
    r2.on('value', s => setLeaderboard(s.val() || {}));
    const r3 = db.ref(`mavikent_premium/bilgi_kulesi_daily/${todayKey()}/${studentName}`);
    r3.on('value', s => setDailyPlays(s.val() || 0));
    return () => { r1.off(); r2.off(); r3.off(); };
  }, [studentName]);

  const startGame = async () => {
    if (dailyPlays >= MAX_DAILY) {
      toast('Bugünkü 2 hakkını kullandın! Yarın tekrar gel. 🌙');
      return;
    }
    await db.ref(`mavikent_premium/bilgi_kulesi_daily/${todayKey()}/${studentName}`).set(dailyPlays + 1);
    setQs(shuffle(QUESTIONS));
    setQIdx(0);
    setLives(3);
    setFloor(0);
    setSelected(null);
    setShowAnswer(false);
    setTotalCoins(0);
    answerLocked.current = false;
    setView('game');
  };

  const finishGame = (finalFloor, earnedSoFar) => {
    const bonus = Number(settings.final_reward || 25);
    const grand = earnedSoFar + bonus;
    if (bonus > 0) {
      const bal = Number(appData?.wallet?.[studentName] || 0);
      const ts = Date.now();
      db.ref('mavikent_premium').update({
        [`wallet/${studentName}`]: bal + bonus,
        [`transactions/${studentName}/txn_bk_end_${ts}`]: {
          desc: `🏰 Bilgi Kulesi: ${finalFloor} kat`,
          amt: bonus,
          date: new Date().toLocaleString('tr-TR'),
        },
      });
    }
    const curMax = leaderboard[studentName]?.maxFloor || 0;
    if (finalFloor > curMax) {
      db.ref(`mavikent_premium/bilgi_kulesi_leaderboard/${studentName}`).set({
        maxFloor: finalFloor,
        date: new Date().toLocaleDateString('tr-TR'),
      });
    }
    setGameResult({ floor: finalFloor, coins: grand });
    setView('result');
  };

  const handleAnswer = (idx) => {
    if (answerLocked.current) return;
    answerLocked.current = true;
    setSelected(idx);
    setShowAnswer(true);

    const q = qs[qIdx % qs.length];
    const correct = idx === q.a;

    if (correct) {
      const newFloor = floor + 1;
      let addedCoins = 0;
      if (newFloor % 5 === 0) {
        addedCoins = Number(settings.milestone_reward || 5);
        const bal = Number(appData?.wallet?.[studentName] || 0);
        const ts = Date.now();
        db.ref('mavikent_premium').update({
          [`wallet/${studentName}`]: bal + addedCoins,
          [`transactions/${studentName}/txn_bk_m_${ts}`]: {
            desc: `🏰 Bilgi Kulesi ${newFloor}. kat ödülü`,
            amt: addedCoins,
            date: new Date().toLocaleString('tr-TR'),
          },
        });
        toast(`🏆 ${newFloor}. kata ulaştın! +${addedCoins} M-Coin!`);
      }
      const newCoins = totalCoins + addedCoins;
      setTimeout(() => {
        setFloor(newFloor);
        setTotalCoins(newCoins);
        setSelected(null);
        setShowAnswer(false);
        setQIdx(prev => prev + 1);
        answerLocked.current = false;
      }, 1200);
    } else {
      const newLives = lives - 1;
      setTimeout(() => {
        if (newLives <= 0) {
          finishGame(floor, totalCoins);
        } else {
          setLives(newLives);
          setSelected(null);
          setShowAnswer(false);
          setQIdx(prev => prev + 1);
          answerLocked.current = false;
        }
      }, 1500);
    }
  };

  // ─── LOBBY ───────────────────────────────────────────────
  if (view === 'lobby') {
    const sorted = Object.entries(leaderboard)
      .sort((a, b) => (b[1].maxFloor || 0) - (a[1].maxFloor || 0))
      .slice(0, 10);
    const playsLeft = MAX_DAILY - dailyPlays;
    return (
      <div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontWeight: 700, color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', padding: 0 }}>
          ← Akademi'ye Dön
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏰</div>
          <h2 style={{ fontWeight: 900, fontSize: '26px', color: '#0f172a', margin: '0 0 8px' }}>Bilgi Kulesi</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            Her doğru cevap seni bir kat yukarı çıkarır.<br />3 yanlış yaparsan kule yıkılır!
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Günlük Hak', value: `${playsLeft}/${MAX_DAILY}`, icon: '🎮', color: playsLeft > 0 ? '#3b82f6' : '#ef4444' },
            { label: 'Rekorun', value: `${leaderboard[studentName]?.maxFloor || 0} kat`, icon: '🏆', color: '#f59e0b' },
            { label: 'Her 5 Katta', value: `+${settings.milestone_reward} 🪙`, icon: '⭐', color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '18px', padding: '14px 10px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '15px', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={startGame}
          disabled={playsLeft <= 0}
          style={{
            width: '100%', padding: '20px',
            background: playsLeft <= 0 ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: playsLeft <= 0 ? '#94a3b8' : 'white',
            border: 'none', borderRadius: '22px', fontWeight: 900, fontSize: '17px',
            cursor: playsLeft <= 0 ? 'not-allowed' : 'pointer',
            boxShadow: playsLeft <= 0 ? 'none' : '0 8px 24px rgba(59,130,246,0.35)',
            marginBottom: '28px', transition: 'all 0.2s',
          }}>
          {playsLeft <= 0 ? '⏰ Bugünlük Bitti — Yarın Tekrar Gel' : '🚀 KULEYE TIRMANDIRMAYA BAŞLA'}
        </button>

        {sorted.length > 0 && (
          <>
            <h3 style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', margin: '0 0 12px' }}>🏆 En İyi Tırmanışlar</h3>
            <div style={{ background: 'white', borderRadius: '20px', padding: '8px 16px', border: '1px solid #f1f5f9' }}>
              {sorted.map(([name, rec], idx) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: idx < sorted.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: '28px', fontWeight: 900, color: ['#f59e0b','#94a3b8','#cd7f32'][idx] || '#cbd5e1', fontSize: '16px' }}>{idx + 1}.</div>
                  <div style={{ flex: 1, fontWeight: 800, fontSize: '14px', color: name === studentName ? '#3b82f6' : '#0f172a' }}>
                    {name}{name === studentName ? ' (Sen)' : ''}
                  </div>
                  <div style={{ fontWeight: 900, color: '#f59e0b', fontSize: '14px' }}>{rec.maxFloor} kat</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── OYUN ─────────────────────────────────────────────────
  if (view === 'game') {
    const q = qs[qIdx % qs.length];
    const nextMilestone = 5 - (floor % 5 === 0 && floor > 0 ? 0 : floor % 5);
    return (
      <div>
        {/* Header: Canlar + Kat + Coin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(i => (
              <span key={i} style={{ fontSize: '22px', filter: i <= lives ? 'none' : 'grayscale(1)', opacity: i <= lives ? 1 : 0.3 }}>❤️</span>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '24px', color: '#0f172a' }}>{floor}. Kat</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {floor % 5 === 0 && floor > 0 ? '⭐ Ödül aldın!' : `${nextMilestone} soruda ödül`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#f59e0b' }}>+{totalCoins} 🪙</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>bu oyunda</div>
          </div>
        </div>

        {/* 🏰 Kule Animasyonu */}
        <style>{`
          @keyframes bkNewFloor {
            from { transform: translateY(-18px) scaleY(0.4); opacity: 0; }
            to   { transform: translateY(0)     scaleY(1);   opacity: 1; }
          }
          @keyframes bkMilestone {
            0%,100% { box-shadow: 0 0 6px rgba(245,158,11,0.4); }
            50%      { box-shadow: 0 0 18px rgba(245,158,11,0.9); }
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '108px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Çatı */}
            {floor > 0 && (
              <div style={{ width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent', borderBottom: '20px solid #2563eb', marginBottom: '1px' }} />
            )}
            {floor === 0 && (
              <div style={{ fontSize: '26px', marginBottom: '4px', opacity: 0.25 }}>🏚️</div>
            )}
            {/* Katlar — en yenisi üstte */}
            {Array.from({ length: Math.min(floor, 6) }, (_, i) => {
              const floorNum = floor - i;
              const isNewest = i === 0;
              const isMilestone = floorNum % 5 === 0;
              return (
                <div
                  key={floorNum}
                  style={{
                    width: '60px', height: '14px',
                    background: isMilestone
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : `hsl(${215 + i * 14}, 72%, ${62 - i * 6}%)`,
                    borderRadius: '3px', margin: '1.5px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    animation: isNewest ? 'bkNewFloor 0.42s cubic-bezier(0.34,1.56,0.64,1)' : isMilestone ? 'bkMilestone 1.2s ease infinite' : 'none',
                  }}>
                  {[0,1,2].map(w => <div key={w} style={{ width: '5px', height: '7px', background: 'rgba(255,255,255,0.45)', borderRadius: '1px' }} />)}
                </div>
              );
            })}
            {/* Zemin */}
            <div style={{ width: '68px', height: '4px', background: '#1e293b', borderRadius: '2px 2px 0 0' }} />
          </div>
        </div>

        {/* Milestone ilerleme çubuğu */}
        <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '5px', marginBottom: '14px', overflow: 'hidden' }}>
          <div style={{ width: `${((floor % 5) / 5) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '999px', transition: 'width 0.4s' }} />
        </div>

        {/* Soru */}
        <div style={{ background: 'white', borderRadius: '22px', padding: '24px 20px', marginBottom: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '17px', color: '#0f172a', textAlign: 'center', lineHeight: 1.6 }}>{q.q}</p>
        </div>

        {/* Seçenekler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {q.o.map((opt, idx) => {
            let bg = 'white';
            let color = '#0f172a';
            let border = '2px solid #e2e8f0';
            let shadow = '0 2px 8px rgba(0,0,0,0.04)';
            if (showAnswer) {
              if (idx === q.a) { bg = '#dcfce7'; color = '#15803d'; border = '2px solid #86efac'; shadow = 'none'; }
              else if (idx === selected) { bg = '#fee2e2'; color = '#dc2626'; border = '2px solid #fca5a5'; shadow = 'none'; }
              else { bg = '#f8fafc'; color = '#94a3b8'; }
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selected !== null}
                style={{ background: bg, color, border, borderRadius: '16px', padding: '14px 10px', fontWeight: 800, fontSize: '14px', cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center', lineHeight: 1.4, boxShadow: shadow }}>
                <span style={{ display: 'block', fontSize: '10px', color: showAnswer ? 'inherit' : '#94a3b8', marginBottom: '4px', fontWeight: 700, opacity: 0.7 }}>{['A', 'B', 'C', 'D'][idx]}</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SONUÇ ────────────────────────────────────────────────
  if (view === 'result') {
    const isRecord = gameResult.floor >= (leaderboard[studentName]?.maxFloor || 0);
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '72px', marginBottom: '12px' }}>{gameResult.floor >= 20 ? '🏆' : gameResult.floor >= 10 ? '🎉' : '💪'}</div>
        <h2 style={{ fontWeight: 900, fontSize: '26px', color: '#0f172a', margin: '0 0 8px' }}>Oyun Bitti!</h2>
        {isRecord && gameResult.floor > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', borderRadius: '12px', padding: '8px 20px', display: 'inline-block', fontWeight: 900, fontSize: '13px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
            🌟 Yeni Rekor!
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '20px 0 28px' }}>
          {[
            { label: 'Ulaşılan Kat', value: `${gameResult.floor}`, unit: 'kat', color: '#3b82f6', icon: '🏗️' },
            { label: 'Kazanılan', value: `+${gameResult.coins}`, unit: 'M-Coin', color: '#f59e0b', icon: '🪙' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: '20px', padding: '22px 16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '30px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '24px', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setView('lobby')}
          style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(59,130,246,0.3)' }}>
          Lobiye Dön
        </button>
      </div>
    );
  }

  return null;
};

export default BilgiKulesi;
