// GiÃºp á»©ng dá»¥ng má»Ÿ Ä‘Æ°á»£c khi khÃ´ng cÃ³ máº¡ng: lÆ°u sáºµn toÃ n bá»™ app vÃ  giá»ng Ä‘á»c ngay láº§n Ä‘áº§u.
const CORE = 'toan-tu-duy-v7';
const VOICES = ['aichoi', 'an', 'baydi', 'bong1', 'bong2', 'bong3', 'bong_bot', 'bot', 'cao', 'cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'chao', 'chimden', 'chinhphuc', 'choan', 'chondao', 'chonman', 'chonmau', 'cuahang', 'cuu', 'dai', 'dem', 'dh0', 'dh1', 'dh2', 'dh3', 'dh4', 'dh5', 'diemkhac', 'domino', 'ga1', 'ga2', 'ga3', 'ga_them', 'gau1', 'gau2', 'gau3', 'gau_them', 'giong', 'gop', 'h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'huychuong', 'it', 'keo1', 'keo2', 'keoqua', 'khac', 'khi1', 'khi2', 'khi3', 'khi_bot', 'latso', 'latthe', 'mattim', 'mecung', 'menu', 'meo1', 'meo2', 'meo3', 'meo_bot', 'mua', 'n0', 'n1', 'n10', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'nang', 'ngan', 'nghe', 'nghi', 'ngon', 'nguoc', 'nhanhmat', 'nhe', 'nhieu', 'nho', 'odau', 'ok0', 'ok1', 'ok2', 'phanloai', 'quyluat', 'ruong', 'sai', 'sao1', 'sao2', 'sao3', 'shop1', 'shop2', 'sobe', 'solon', 'sothieu', 'sticker', 'tach', 'tach1', 'tach2', 'thang', 'thap', 'thieu', 'thieuxu', 'tho1', 'tho2', 'tho3', 'tho_them', 'thua', 'timnhom', 'to', 'tomau', 'trum', 'vathinh', 'venha', 'w0', 'w1', 'w10', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'xong0', 'xong1', 'xong2', 'xong3', 'xong4', 'xong5'];
const FILES = ['./', 'index.html', 'games.js', 'app.js', 'nhac.js', 'manifest.json', 'icon-192.png', 'icon-512.png', ...VOICES.map(v => 'giong/' + v + '.mp3')];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Æ¯u tiÃªn báº£n má»›i trÃªn máº¡ng, máº¥t máº¡ng thÃ¬ dÃ¹ng báº£n Ä‘Ã£ lÆ°u.
  e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CORE).then(c => c.put(req, copy)); } return r; }).catch(() => caches.match(req)));
});
