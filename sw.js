// Giúp ứng dụng mở được khi không có mạng: lưu sẵn toàn bộ app và giọng đọc ngay lần đầu.
const CORE = 'toan-tu-duy-v1';
const VOICES = ['menu', 'chao', 'chonman', 'chondao', 'chinhphuc', 'mattim', 'thang', 'thua', 'sai', 'huychuong', 'ok0', 'ok1', 'ok2', 'sao1', 'sao2', 'sao3',
  'cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'dem', 'nhieu', 'it', 'timnhom', 'sothieu', 'solon', 'sobe', 'gop', 'bot', 'tach', 'domino', 'chimden', 'baydi',
  'dai', 'ngan', 'to', 'nho', 'cao', 'thap', 'nang', 'nhe', 'h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'dh0', 'dh1', 'dh2', 'dh3', 'dh4', 'dh5', 'giong', 'vathinh',
  'diemkhac', 'khac', 'thieu', 'quyluat', 'an', 'odau', 'nguoc', 'nghe', 'n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
const FILES = ['./', 'index.html', 'games.js', 'nhac.js', 'manifest.json', 'icon-192.png', 'icon-512.png', ...VOICES.map(v => 'giong/' + v + '.mp3')];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu.
  e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CORE).then(c => c.put(req, copy)); } return r; }).catch(() => caches.match(req)));
});
