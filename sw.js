// GiÃºp á»©ng dá»¥ng má»Ÿ Ä‘Æ°á»£c khi khÃ´ng cÃ³ máº¡ng: lÆ°u sáºµn toÃ n bá»™ app vÃ  giá»ng Ä‘á»c ngay láº§n Ä‘áº§u.
const CORE = 'toan-tu-duy-v5';
const VOICES = ['aichoi', 'an', 'baydi', 'bong_bot', 'bot', 'cao', 'cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'chao', 'chimden', 'chinhphuc', 'choan', 'chondao', 'chonman', 'chonmau', 'cuahang', 'cuu', 'dai', 'dem', 'dh0', 'dh1', 'dh2', 'dh3', 'dh4', 'dh5', 'diemkhac', 'domino', 'ga_them', 'gau_them', 'giong', 'gop', 'h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'huychuong', 'it', 'keoqua', 'khac', 'khi_bot', 'latso', 'latthe', 'mattim', 'mecung', 'menu', 'meo_bot', 'mua', 'n0', 'n1', 'n10', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'nang', 'ngan', 'nghe', 'nghi', 'ngon', 'nguoc', 'nhanhmat', 'nhe', 'nhieu', 'nho', 'odau', 'ok0', 'ok1', 'ok2', 'phanloai', 'quyluat', 'ruong', 'sai', 'sao1', 'sao2', 'sao3', 'sobe', 'solon', 'sothieu', 'sticker', 'tach', 'thang', 'thap', 'thieu', 'thieuxu', 'tho_them', 'thua', 'timnhom', 'to', 'tomau', 'trum', 'vathinh', 'venha', 'xong0', 'xong1', 'xong2', 'xong3', 'xong4', 'xong5'];
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
