// Giúp ứng dụng mở được khi không có mạng: lưu sẵn toàn bộ app và giọng đọc ngay lần đầu.
const CORE = 'toan-tu-duy-v8';
const VOICES = [
  'aichoi', 'an', 'b_sang', 'b_toi', 'b_trua', 'baihomnay', 'baydi', 'bong1', 'bong2', 'bong3', 'bong_bot', 'bot', 'buoi', 'cao',
  'cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'chao', 'chimden', 'chinhphuc', 'choan', 'chondao', 'chonman', 'chonmau',
  'cuahang', 'cuu', 'dai', 'dem', 'dh0', 'dh1', 'dh2', 'dh3', 'dh4', 'dh5', 'diemkhac', 'domino', 'ga1', 'ga2',
  'ga3', 'ga_them', 'gau1', 'gau2', 'gau3', 'gau_them', 'giong', 'goiy', 'gop', 'h0', 'h1', 'h2', 'h3', 'h4',
  'h5', 'huychuong', 'it', 'keo1', 'keo2', 'keoqua', 'khac', 'khi1', 'khi2', 'khi3', 'khi_bot', 'latso', 'latthe', 'mattim',
  'mecung', 'menu', 'meo1', 'meo2', 'meo3', 'meo_bot', 'mua', 'n0', 'n1', 'n10', 'n2', 'n3', 'n4', 'n5',
  'n6', 'n7', 'n8', 'n9', 'nang', 'ngan', 'nghe', 'nghi', 'ngon', 'nguoc', 'nhanhmat', 'nhe', 'nhieu', 'nho',
  'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'odau', 'ok0', 'ok1', 'ok2', 'p_duoi', 'p_phai', 'p_trai',
  'p_tren', 'phanloai', 'quyluat', 'ruong', 'sai', 'sao1', 'sao2', 'sao3', 'shop1', 'shop2', 'sobe', 'solon', 'sothieu', 'sticker',
  't_duoi', 't_phai', 't_trai', 't_tren', 'tach', 'tach1', 'tach2', 'thang', 'thap', 'thieu', 'thieuxu', 'tho1', 'tho2', 'tho3',
  'tho_them', 'thu1', 'thu2', 'thua', 'tieptheo', 'timnhom', 'to', 'tomau', 'trum', 'vathinh', 'venha', 'viet1', 'viet2', 'vietlai',
  'vt1', 'vt2', 'vthoi', 'w0', 'w1', 'w10', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9',
  'xong0', 'xong1', 'xong2', 'xong3', 'xong4', 'xong5', 'xongbai',
];
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
  // Ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu.
  // Chỉ lưu bản đầy đủ (mã 200): trình phát âm thanh hay tải từng đoạn (mã 206), loại này không lưu được.
  e.respondWith(fetch(req).then(r => {
    if (r.status === 200) { const copy = r.clone(); caches.open(CORE).then(c => c.put(req, copy)).catch(() => {}); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
