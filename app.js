// Phần điều khiển của app: hồ sơ, màn chơi, chinh phục, phần thưởng, khu bố mẹ.
const APP_VER = 7; // tăng cùng tên bộ nhớ trong sw.js mỗi lần cập nhật
let pendingReload = false; // có bản mới, chờ bé về trang chủ rồi tải lại
const app = document.getElementById('app'), $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('sv');

// ───── Dữ liệu lưu trên máy: nhiều hồ sơ, mỗi bé một tiến độ riêng ─────
function newKid(profile) {
  return { profile, prog: {}, isles: {}, time: {}, medals: {}, stickers: {}, rescued: {}, coins: 0, items: {}, hat: null, fed: 0, stats: {}, chest: '' };
}
let DB = { cur: null, kids: {}, music: true, limit: 0, restUntil: 0 };
try {
  const d = JSON.parse(localStorage.getItem('ttd') || 'null');
  if (d) Object.assign(DB, d);
  else { // chuyển dữ liệu từ bản cũ (1 hồ sơ)
    const old = JSON.parse(localStorage.getItem('btd') || 'null');
    if (old && old.profile) { const id = 'k' + Date.now(); DB.kids[id] = Object.assign(newKid(old.profile), { prog: old.prog || {}, isles: old.isles || {}, time: old.time || {}, medals: old.medals || {} }); DB.cur = id; DB.music = old.music !== false; }
  }
} catch (e) {}
for (const id in DB.kids) DB.kids[id] = Object.assign(newKid(DB.kids[id].profile), DB.kids[id]);
let K = DB.kids[DB.cur] || null;
const save = () => { try { localStorage.setItem('ttd', JSON.stringify(DB)); } catch (e) {} };

const catProg = c => K.prog[c] || (K.prog[c] = {});
const passed = () => Object.values(K.prog).reduce((s, p) => s + Object.keys(p).length, 0);
const totalStars = () => Object.values(K.prog).reduce((s, p) => s + Object.values(p).reduce((a, b) => a + b, 0), 0) + Object.keys(K.isles).length * 3;
const threeStars = () => Object.values(K.prog).reduce((s, p) => s + Object.values(p).filter(x => x === 3).length, 0);
const todaySecs = () => K.time[today()] || 0;
const totalSecs = () => Object.values(K.time).reduce((a, b) => a + b, 0);
function streak() { let n = 0; const d = new Date(); while ((K.time[d.toLocaleDateString('sv')] || 0) >= 60) { n++; d.setDate(d.getDate() - 1); } return n; }
const mins = s => s < 3600 ? Math.floor(s / 60) + ' phút' : Math.floor(s / 3600) + ' giờ ' + Math.floor(s % 3600 / 60) + ' phút';

// ───── Huy chương ─────
const MEDALS = [
  ['m1', '🥉', 'Qua màn đầu tiên', () => passed() >= 1], ['m10', '🥈', 'Qua 10 màn', () => passed() >= 10],
  ['m50', '🥇', 'Qua 50 màn', () => passed() >= 50], ['m150', '🏆', 'Qua 150 màn', () => passed() >= 150],
  ['s3', '🌟', 'Màn 3 sao đầu tiên', () => threeStars() >= 1], ['s10', '💫', '10 màn 3 sao', () => threeStars() >= 10],
  ['st100', '⭐', 'Gom 100 ngôi sao', () => totalStars() >= 100],
  ['all', '🌈', 'Chơi đủ 6 chủ đề', () => CATS.every((c, i) => Object.keys(catProg(i)).length > 0)],
  ['cat', '👑', 'Hoàn thành 1 chủ đề', () => CATS.some((c, i) => Object.keys(catProg(i)).length >= 50)],
  ['i1', '🏝️', 'Chinh phục hòn đảo đầu', () => Object.keys(K.isles).length >= 1], ['i10', '🗺️', 'Chinh phục cả 10 đảo', () => Object.keys(K.isles).length >= 10],
  ['r3', '🦸', 'Giải cứu 3 bạn', () => Object.keys(K.rescued).length >= 3],
  ['k10', '🎴', 'Sưu tầm 10 thẻ', () => Object.keys(K.stickers).length >= 10], ['k30', '📒', 'Sưu tầm 30 thẻ', () => Object.keys(K.stickers).length >= 30],
  ['buy', '🛍️', 'Mua món đồ đầu tiên', () => Object.keys(K.items).length >= 1], ['feed', '🍪', 'Cho Cú ăn 10 lần', () => K.fed >= 10],
  ['t15', '⏰', 'Học 15 phút trong ngày', () => todaySecs() >= 900], ['t60', '📚', 'Tổng cộng 1 giờ học', () => totalSecs() >= 3600],
  ['d3', '🔥', 'Học 3 ngày liền', () => streak() >= 3],
];
function checkMedals() {
  const got = [];
  for (const [id, ic, name, test] of MEDALS) if (!K.medals[id] && test()) { K.medals[id] = today(); got.push([ic, name]); }
  if (got.length) { save(); sleep(1200).then(waitIdle).then(() => { toast(got[0][0], 'Huy chương mới!<br>' + got[0][1]); say('huychuong'); confetti(40); }); }
}

// ───── Thanh trên ─────
const avHTML = a => a && a.startsWith('data:') ? `<img src="${a}" alt="">` : (a || '🐣');
const hatOf = () => { const h = SHOP.hat.find(x => x[0] === K.hat); return h ? h[1] : ''; };
function refreshHead() {
  if (!K) return;
  $('hav').innerHTML = avHTML(K.profile.avatar);
  $('hname').textContent = K.profile.name;
  $('htime').textContent = Math.floor(todaySecs() / 60) + "'";
  $('hstar').textContent = totalStars();
  $('hcoin').textContent = K.coins;
  $('hmusic').textContent = DB.music ? '🎵' : '🔇';
  $('mhat').textContent = hatOf();
}
function setBack(fn) { const b = $('back'); b.style.visibility = fn ? 'visible' : 'hidden'; b.onclick = fn; }

// ───── Đồng hồ học + giới hạn thời gian liên tục ─────
let studying = false, tick = 0, session = 0, restT = null;
setInterval(() => {
  if (!K || !studying || document.visibilityState !== 'visible') return;
  K.time[today()] = todaySecs() + 1; session++;
  if (++tick % 10 === 0) { save(); refreshHead(); }
  if (tick % 60 === 0) checkMedals();
  if (DB.limit && session >= DB.limit * 60 && run && run.st && run.st.done) { DB.restUntil = Date.now() + 5 * 60000; session = 0; save(); showRest(); }
}, 1000);
const resting = () => DB.restUntil && DB.restUntil > Date.now();
function showRest() {
  studying = false; setBack(null); say('nghi');
  app.innerHTML = `<div class="done panel"><div class="big">😴🦉</div>Bé học giỏi lắm rồi!<br>Mình nghỉ mắt một chút nhé
    <div class="rcd" id="rcd"></div><div class="small">👀 Nhìn ra xa cửa sổ · 🤸 Vươn vai · 💧 Uống nước</div><br>
    <button class="btn alt" onclick="gate(()=>{DB.restUntil=0;save();home()})">🔓 Bố mẹ mở khoá</button></div>`;
  const upd = () => {
    if (!$('rcd')) { clearInterval(restT); return; }
    if (!resting()) { clearInterval(restT); DB.restUntil = 0; save(); home(); return; }
    const s = Math.ceil((DB.restUntil - Date.now()) / 1000); $('rcd').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  clearInterval(restT); restT = setInterval(upd, 1000); upd();
}

// ───── Âm thanh: giọng đọc thu sẵn, giọng bố mẹ, nhạc nền ─────
// Dùng MỘT máy phát cho cả app: điện thoại cho phép máy phát đã từng phát sau một lần chạm,
// còn máy phát mới tạo ra có thể bị chặn (khi đó câu khen bị bỏ qua).
// say() trả về một lời hứa: xong khi đã đọc hết (hoặc bị câu khác chen ngang)
const voice = new Audio(); voice.preload = 'auto';
let vq = [], voiceDone = null, vtok = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function say(k) {
  vq = (Array.isArray(k) ? k : [k]).filter(Boolean); voice.pause(); vtok++;
  if (voiceDone) { const d = voiceDone; voiceDone = null; d(); }
  const tok = vtok;
  return new Promise(res => { voiceDone = res; playNext(tok); });
}
// Chờ đến khi máy đọc xong câu đang đọc (tối đa 10 giây)
async function waitIdle() { for (let t = 0; voiceDone && t < 50; t++) await sleep(200); }
function playNext(tok) {
  if (tok !== vtok) return;
  const k = vq.shift();
  if (!k) { duck(false); const d = voiceDone; voiceDone = null; if (d) d(); return; }
  duck(true);
  const next = () => playNext(tok);
  voice.onended = next; voice.onerror = next;
  voice.src = k.startsWith('blob:') ? k : 'giong/' + k + '.mp3'; voice.muted = false;
  // AbortError = bị câu mới chen ngang (bỏ qua); lỗi khác = trình duyệt chặn → đọc đoạn sau
  voice.play().catch(e => { if (e.name !== 'AbortError') next(); });
}
// Lần chạm đầu tiên: "mở khoá" máy phát để các câu đọc sau đó không bị điện thoại chặn
addEventListener('pointerdown', function unlock() {
  removeEventListener('pointerdown', unlock);
  if (!voice.src) {
    voice.src = 'giong/w0.mp3'; voice.muted = true;
    const done = () => { if (voice.src.endsWith('/w0.mp3')) voice.pause(); voice.muted = false; };
    voice.play().then(done, done);
  }
});
function duck(on) { if (window.NhacNen && DB.music) NhacNen.setVolume(on ? .08 : .22); }
function beep(ok, soft) {
  try { const c = NhacNen.getCtx(), t = c.currentTime;
    (ok ? (soft ? [880] : [660, 880, 1320]) : [220, 180]).forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(.12, t + i * .09); g.gain.exponentialRampToValueAtTime(.001, t + i * .09 + .25); o.start(t + i * .09); o.stop(t + i * .09 + .3); });
  } catch (e) {}
}
let musicOn = false;
function startMusic() { if (DB.music && !musicOn && window.NhacNen) { NhacNen.start('sangtao'); NhacNen.setVolume(.22); musicOn = true; } }
function toggleMusic() { DB.music = !DB.music; save(); refreshHead(); if (DB.music) { musicOn = false; startMusic(); } else { NhacNen.stop(); musicOn = false; } }
addEventListener('pointerdown', startMusic);

// Giọng khen của bố mẹ: lưu trong bộ nhớ trình duyệt (IndexedDB)
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('ttd', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips', { autoIncrement: true }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function clipOp(mode, fn) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('clips', mode), req = fn(tx.objectStore('clips')); tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error); }); }
let praise = [];
async function loadPraise() {
  try { const keys = await clipOp('readonly', s => s.getAllKeys()), vals = await clipOp('readonly', s => s.getAll());
    praise.forEach(p => URL.revokeObjectURL(p.url)); praise = keys.map((k, i) => ({ k, url: URL.createObjectURL(vals[i]) }));
  } catch (e) { praise = []; }
}
const praiseKey = () => praise.length && Math.random() < .5 ? pick(praise).url : 'ok' + R(3);

// ───── Hiệu ứng ─────
function confetti(n = 24) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'confetti';
    s.textContent = pick(['🎉', '⭐', '🎈', '💖', '✨', '🌟', '🍬']);
    s.style.left = R(100) + 'vw'; s.style.animationDelay = (Math.random() * .5) + 's'; s.style.fontSize = 20 + R(24) + 'px';
    document.body.appendChild(s); setTimeout(() => s.remove(), 2600);
  }
}
function burst(el, icons = ['⭐', '✨', '💖', '🌟']) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span'); s.className = 'burst'; s.textContent = pick(icons);
    const a = i / 10 * Math.PI * 2; s.style.left = r.left + r.width / 2 - 13 + 'px'; s.style.top = r.top + r.height / 2 - 13 + 'px';
    s.style.setProperty('--dx', Math.cos(a) * 90 + 'px'); s.style.setProperty('--dy', Math.sin(a) * 90 + 'px');
    document.body.appendChild(s); setTimeout(() => s.remove(), 900);
  }
}
function hearts(el) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 5; i++) { const s = document.createElement('span'); s.className = 'heart'; s.textContent = '💖'; s.style.left = r.left + R(Math.max(10, r.width)) + 'px'; s.style.top = r.top + 'px'; s.style.animationDelay = i * .12 + 's'; document.body.appendChild(s); setTimeout(() => s.remove(), 2000); }
}
function toast(ic, html, ms = 2400) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span class="ic">${ic}</span>${html}`; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
let bubT;
function talk(txt) { const b = $('bubble'); b.textContent = txt; b.classList.add('show'); clearTimeout(bubT); bubT = setTimeout(() => b.classList.remove('show'), 2200); }
function react(cls) { const m = $('mascot'); m.classList.remove('happy', 'sad'); void m.offsetWidth; m.classList.add(cls); document.querySelectorAll('.char').forEach(c => { c.classList.remove('happy', 'sad'); void c.offsetWidth; c.classList.add(cls); }); }
function cheerUp() { react('happy'); talk(pick(['Bé giỏi lắm! 💪', 'Cố lên nào! 🌟', 'Mình cùng học nhé! 📚', 'Yêu bé nhiều! 💖'])); }
(function decorate() {
  const bg = $('bg'), add = (cls, txt, css) => { const s = document.createElement('span'); s.className = cls; s.textContent = txt; Object.assign(s.style, css); bg.appendChild(s); };
  [8, 22, 40, 60].forEach((top, i) => add('cloud', '☁️', { top: top + '%', animationDuration: 40 + i * 12 + 's', animationDelay: -i * 11 + 's' }));
  ['🎈', '🎈', '🪁', '🎈'].forEach((t, i) => add('balloon', t, { left: 6 + i * 26 + '%', animationDuration: 18 + i * 5 + 's', animationDelay: -i * 6 + 's' }));
  for (let i = 0; i < 10; i++) add('twinkle', pick(['✨', '⭐', '💫']), { left: R(96) + '%', top: R(80) + '%', animationDelay: Math.random() * 2.4 + 's' });
})();

// ───── Hồ sơ của bé (nhiều bé) ─────
const AVATARS = ['🐣', '🐰', '🐻', '🐼', '🦊', '🐱', '🐶', '🐯', '🦁', '🐸', '🐵', '🦄', '🐧', '🐨', '👧', '👦'];
let draftAv, editId;
function showPick() {
  studying = false; setBack(null); say('aichoi');
  app.innerHTML = `<div class="brand"><img src="icon-192.png" alt="">Toán Tư Duy</div><div class="title">Hôm nay bạn nào chơi nhỉ? 👇</div>
  <div class="menu">${Object.entries(DB.kids).map(([id, k], i) => `<button class="tile" style="animation-delay:${i * .07}s" onclick="useKid('${id}')"><div class="av avbig" style="width:90px;height:90px;font-size:60px;margin:0">${avHTML(k.profile.avatar)}</div>${k.profile.name}</button>`).join('')}
  <button class="tile" onclick="showProfile('new')"><span class="ic">➕</span>Thêm bé</button></div>`;
}
function useKid(id) { DB.cur = id; K = DB.kids[id]; session = 0; save(); refreshHead(); home(); }
function showProfile(id) {
  if (!K && id !== 'new') id = 'new';
  studying = false; editId = id || DB.cur;
  const isNew = editId === 'new', p = isNew ? { name: '', avatar: '🐣' } : DB.kids[editId].profile; draftAv = p.avatar;
  setBack(K ? (Object.keys(DB.kids).length > 1 && isNew ? showPick : home) : null);
  app.innerHTML = `<div class="title">${isNew ? '👋 Chào bé! Bé tên là gì?' : '👤 Hồ sơ của bé'}</div>
  <div class="panel" style="text-align:center">
    <div class="av avbig" id="pav">${avHTML(draftAv)}</div>
    <input type="text" id="pname" maxlength="20" placeholder="Nhập tên bé" value="${(p.name || '').replace(/"/g, '&quot;')}">
    <div class="small" style="margin-top:12px">Chọn ảnh đại diện</div>
    <div class="avs">${AVATARS.map(a => `<button onclick="pickAv('${a}')">${a}</button>`).join('')}</div>
    <label class="btn alt" style="display:inline-block">📷 Dùng ảnh của bé<input type="file" accept="image/*" hidden onchange="upAv(this)"></label>
    <button class="btn" onclick="saveProfile()">✅ Lưu</button>
    ${isNew ? '' : `<button class="btn alt" onclick="showPick()">👥 Đổi bé / Thêm bé</button>`}
  </div>
  ${isNew ? '' : `<div class="panel"><div class="title" style="font-size:22px">📊 Thành tích</div><div class="stats">
    <div>Hôm nay học<b>${mins(todaySecs())}</b></div><div>Tổng thời gian<b>${mins(totalSecs())}</b></div>
    <div>Học liền<b>${streak()} ngày 🔥</b></div><div>Màn đã qua<b>${passed()}</b></div>
    <div>Ngôi sao<b>${totalStars()} ⭐</b></div><div>Huy chương<b>${Object.keys(K.medals).length}/${MEDALS.length} 🏅</b></div>
    <div>Thẻ sưu tầm<b>${Object.keys(K.stickers).length}/${STICKERS.length} 🎴</b></div><div>Đảo chinh phục<b>${Object.keys(K.isles).length}/10 🏝️</b></div></div></div>`}`;
}
function pickAv(a) { draftAv = a; $('pav').innerHTML = avHTML(a); }
function upAv(inp) {
  const f = inp.files[0]; if (!f) return;
  const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'); c.width = c.height = 200; const s = Math.min(img.width, img.height);
    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 200, 200);
    pickAv(c.toDataURL('image/jpeg', .85)); URL.revokeObjectURL(img.src);
  }; img.src = URL.createObjectURL(f);
}
function saveProfile() {
  const prof = { name: $('pname').value.trim() || 'Bé', avatar: draftAv };
  if (editId === 'new') { const id = 'k' + Date.now(); DB.kids[id] = newKid(prof); DB.cur = id; K = DB.kids[id]; session = 0; }
  else DB.kids[editId].profile = prof;
  save(); refreshHead(); say('chao'); home();
}

// ───── Trang chủ ─────
const chestReady = () => todaySecs() >= 600 && K.chest !== today();
function home() {
  if (pendingReload) { location.reload(); return; }
  if (resting()) return showRest();
  studying = false; setBack(null); refreshHead();
  const won = Object.keys(K.isles).length, left = Math.max(0, Math.ceil((600 - todaySecs()) / 60));
  app.innerHTML = `<div class="brand"><img src="icon-192.png" alt="">Toán Tư Duy</div>
  <div class="title">Chào ${K.profile.name}! Hôm nay học gì nào? 👇</div>
  ${installBox()}
  <div class="quick">
    <button class="qb ${chestReady() ? 'glow' : ''}" onclick="openChest()"><span class="ic">🎁</span>${K.chest === today() ? 'Đã mở' : chestReady() ? 'Mở quà!' : 'Còn ' + left + ' phút'}</button>
    <button class="qb" style="animation-delay:.05s" onclick="showAlbum()"><span class="ic">🎴</span>Thẻ sưu tầm<span class="dot">${Object.keys(K.stickers).length}</span></button>
    <button class="qb" style="animation-delay:.1s" onclick="showRoom()"><span class="ic">🏠</span>Phòng của bé</button>
    <button class="qb" style="animation-delay:.15s" onclick="showMedals()"><span class="ic">🏅</span>Huy chương<span class="dot">${Object.keys(K.medals).length}</span></button>
    <button class="qb" style="animation-delay:.2s" onclick="gate(()=>showParent('report'))"><span class="ic">👨‍👩‍👧</span>Bố mẹ</button>
  </div>
  <button class="bigbtn" onclick="showIsles()"><span class="ic">🗺️</span><span style="text-align:left">Chinh phục 10 hòn đảo<br><span style="font-size:16px;font-weight:600">Đã chinh phục ${won}/10 đảo 🏝️ · Đánh bại trùm, giải cứu bạn!</span></span></button>
  <div class="menu">${CATS.map((c, i) => { const n = Object.keys(catProg(i)).length;
    return `<button class="tile" style="background:${c.color};animation-delay:${i * .07}s" onclick="showLevels(${i})"><span class="deco">${c.deco}</span><span class="ic">${c.icon}</span>${c.name}<div class="pbar"><i style="width:${n * 2}%"></i></div><span class="small">${n}/50 màn</span></button>`; }).join('')}</div>
  <div class="small" style="text-align:center;margin-top:18px">Phiên bản ${APP_VER}</div>`;
}

// ───── Cài ứng dụng lên điện thoại ─────
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if ($('instbox')) $('instbox').outerHTML = installBox(); });
addEventListener('appinstalled', () => { installEvt = null; const b = $('instbox'); if (b) b.remove(); toast('📲', 'Đã cài xong! Tìm biểu tượng số 10 trên màn hình nhé.'); });
const standalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
const inApp = () => /Zalo|FBAN|FBAV|FB_IAV|Instagram|Line\/|TikTok|; wv\)/i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
function installBox() {
  if (standalone()) return '';
  const url = location.href.replace(/^https:\/\//, '');
  let body;
  if (inApp() && /Android/i.test(navigator.userAgent)) body = `Bạn đang mở trong Zalo/Facebook nên chưa cài được.<br><a class="btn" href="intent://${url}#Intent;scheme=https;package=com.android.chrome;end">🌐 Mở bằng Chrome</a>`;
  else if (inApp()) body = 'Bạn đang mở trong Zalo/Facebook. Bấm dấu ⋯ góc trên → <b>Mở bằng trình duyệt</b> (Safari) rồi cài.';
  else if (installEvt) body = `<button class="btn" onclick="doInstall()">📲 Cài ứng dụng</button>`;
  else if (isIOS()) body = 'Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên ⬆️) → <b>Thêm vào MH chính</b>.';
  else body = 'Bấm dấu <b>⋮</b> góc trên bên phải Chrome → <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.';
  return `<div class="panel install" id="instbox"><img src="icon-192.png" alt=""><div>Cài <b>Toán Tư Duy</b> lên máy để bé mở nhanh, không cần mạng<br>${body}</div></div>`;
}
async function doInstall() { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; }

// ───── Bản đồ 50 màn ─────
function showLevels(ci) {
  if (resting()) return showRest();
  studying = false; setBack(home);
  const c = CATS[ci], p = catProg(ci), open = Object.keys(p).length + 1;
  app.innerHTML = `<div class="title">${c.icon} ${c.name} <span class="small">· ${Object.values(p).reduce((a, b) => a + b, 0)} ⭐</span></div>
  <div class="small" style="text-align:center;margin:-6px 0 12px">${c.games.map(g => GAMES[g].icon + ' ' + GAMES[g].name).join(' · ')}</div>
  <div class="levels">${range(1, 50).map(L => { const st = p[L];
    if (L > open) return `<button class="lv lock" disabled>🔒</button>`;
    return `<button class="lv ${L === open ? 'now' : ''}" style="background:${st ? c.color : ''};animation-delay:${Math.min(L, 20) * .02}s" onclick="playLevel(${ci},${L})">${L}<small>${st ? '⭐'.repeat(st) : ''}</small></button>`; }).join('')}</div>`;
  say(c.v);
}

// ───── Một lượt chơi 10 câu (màn hoặc đảo) ─────
let run;
function makeQuestions(keys, L) {
  const pool = []; while (pool.length < 10) pool.push(...shuffle(keys));
  return pool.slice(0, 10).map(k => Object.assign(GAMES[k].make(L), { key: k }));
}
function playLevel(ci, L) {
  if (resting()) return showRest();
  run = { mode: 'level', ci, L, qs: makeQuestions(CATS[ci].games, L), i: 0, right: 0 };
  setBack(() => showLevels(ci)); studying = true; showQ();
}
function playIsle(ii) {
  if (resting()) return showRest();
  const all = CATS.flatMap(c => c.games), I = ISLANDS[ii];
  const qs = makeQuestions(all, I.L), plain = all.filter(k => !GAMES[k].special), bk = pick(plain);
  qs[9] = Object.assign(GAMES[bk].make(I.L), { key: bk, boss: true }); // câu 10: trùm cuối
  run = { mode: 'isle', ii, L: I.L, qs, i: 0, right: 0, hearts: 3 };
  run.intro = 'chinhphuc'; setBack(showIsles); studying = true; showQ();
}
function noteStat(key, ok) { const s = K.stats[key] || (K.stats[key] = { n: 0, ok: 0 }); s.n++; if (ok) s.ok++; }

function showQ() {
  const it = run.qs[run.i], st = run.st = { wrong: 0, done: false };
  const I = ISLANDS[run.ii];
  const head = run.mode === 'isle'
    ? `<div class="path">${range(0, 9).map(i => `<span class="stone ${i < run.i ? 'done' : ''}">${i === run.i ? `<span class="me av">${avHTML(K.profile.avatar)}</span>` : ''}</span>`).join('')}<span style="font-size:34px">🎁</span></div>
       <div class="qhead"><span class="hearts" id="hearts"></span><span class="sp"></span><b>${I.icon} ${I.name}</b></div>
       ${it.boss ? `<div class="boss" id="boss"><span class="bi">${I.boss}</span><div>Trùm cuối: ${I.bossName}!<br><span style="font-weight:600;font-size:15px">Trả lời đúng để giải cứu bạn ${I.friend}</span></div></div>` : ''}`
    : `<div class="qhead"><b>Màn ${run.L}</b><div class="qbar"><i style="width:${run.i * 10}%"></i></div><b>${run.i + 1}/10</b></div>`;
  app.innerHTML = head + `<div class="q"><button class="speak" id="sp">🔊</button><span>${it.q}</span></div>
    <div style="text-align:center;margin:-8px 0 10px"><span class="gname">${GAMES[it.key].icon} ${GAMES[it.key].name}</span></div><div id="body"></div>`;
  showHearts();
  $('sp').onclick = () => say(it.v);
  // Lời giới thiệu (vào đảo, gặp trùm) đọc liền trước câu hỏi, không bị cắt
  const intro = run.intro; run.intro = null;
  setTimeout(() => say([intro, it.boss ? 'trum' : null, ...[].concat(it.v)]), 250);
  const ctx = {
    st,
    wrong() {
      if (st.done) return;
      st.wrong++; beep(0); react('sad'); talk('Thử lại nhé! 💪');
      if (run.mode === 'isle' && st.wrong === 1) {
        run.hearts--; showHearts();
        if (run.hearts <= 0) {
          st.done = true; noteStat(it.key, false);
          const myRun = run; setTimeout(() => { if (run === myRun && $('body')) finish(true); }, 900); return;
        }
        setTimeout(() => say('mattim'), 400);
      } else setTimeout(() => say('sai'), 400);
    },
    win(sayKey) {
      if (st.done) return;
      st.done = true; beep(1); confetti(); react('happy');
      noteStat(it.key, !st.wrong); if (!st.wrong) run.right++;
      const stage = app.querySelector('.stage'); if (stage) stage.classList.add('win');
      talk(pick(['Giỏi quá! 🎉', 'Đúng rồi! 🌟', 'Tuyệt vời! 👏', 'Bé thật thông minh! 🧠']));
      // Đợi đọc xong lời khen rồi mới sang câu mới (tối đa 10 giây phòng khi âm thanh bị kẹt)
      const myRun = run, myI = run.i, t0 = Date.now();
      let spoken;
      if (it.boss) {
        $('boss').classList.add('beat'); K.rescued[run.ii] = 1;
        spoken = sleep(700).then(() => { toast(I.friend, 'Bé đã giải cứu bạn!', 2200); confetti(40); return say('cuu'); });
      } else spoken = sleep(150).then(() => say([sayKey, praiseKey()]));
      Promise.race([spoken, sleep(10000)]).then(() => setTimeout(() => {
        if (run !== myRun || run.i !== myI || !$('body')) return; // bé đã bấm quay lại
        run.i++; run.i >= 10 ? finish() : showQ();
      }, Math.max(400, 1500 - (Date.now() - t0))));
    },
  };
  (RENDER[it.kind] || renderChoice)(it, $('body'), ctx);
}
function showHearts() { const h = $('hearts'); if (h && run.mode === 'isle') h.textContent = '❤️'.repeat(run.hearts) + '🤍'.repeat(3 - run.hearts); }

// Chạm từng hình để đếm: hình sáng lên và máy đọc số
function tapCount(root) {
  let c = 0;
  root.querySelectorAll('.stage .rows span').forEach(s => {
    if (s.querySelector('.gach') || s.classList.contains('gach')) return;
    s.onclick = () => { if (s.classList.contains('counted')) return; c++; s.classList.add('counted'); s.dataset.n = c; say('n' + Math.min(c, 10)); };
  });
}

// Kéo một đồ vật bằng tay (chuột hoặc ngón tay); thả vào ".zone"
function draggable(el, onDrop, onTap) {
  el.onpointerdown = e => {
    if (run.st.done) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY; let moved = false;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    const mv = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 6) { moved = true; el.classList.add('dragging'); }
      if (moved) {
        el.style.transform = `translate(${dx}px,${dy}px) scale(1.15)`;
        document.querySelectorAll('.zone.hot').forEach(z => z.classList.remove('hot'));
        el.style.visibility = 'hidden'; const t = document.elementFromPoint(ev.clientX, ev.clientY); el.style.visibility = '';
        const z = t && t.closest('.zone'); if (z) z.classList.add('hot');
      }
    };
    const up = ev => {
      el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.classList.remove('dragging'); el.style.transform = '';
      document.querySelectorAll('.zone.hot').forEach(z => z.classList.remove('hot'));
      if (!moved) { if (onTap) onTap(); return; }
      el.style.visibility = 'hidden'; const t = document.elementFromPoint(ev.clientX, ev.clientY); el.style.visibility = '';
      if (!onDrop(t && t.closest('.zone'))) { el.classList.add('back'); setTimeout(() => el.classList.remove('back'), 400); }
    };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
}

// ───── Cách hiển thị từng kiểu câu hỏi ─────
function renderChoice(it, body, ctx) {
  const grid = it.layout === 'grid';
  body.innerHTML = grid
    ? `<div class="stage"><div class="pair">${it.html}<div class="grid" id="opts" style="grid-template-columns:repeat(${it.cols},1fr)"></div></div></div>`
    : `${it.html ? `<div class="stage" id="stage">${it.html}</div>` : ''}<div class="opts ${it.layout || ''}" id="opts"></div>`;
  if (!it.flash) tapCount(body);
  if (it.flash) {
    const s = $('stage'), o = $('opts'); o.style.visibility = 'hidden';
    setTimeout(() => { if (!s.isConnected) return; s.innerHTML = '<div class="big">🙈</div>'; o.style.visibility = 'visible'; }, it.flash);
  }
  const btns = it.opts.map((o, idx) => {
    const b = document.createElement('button'); b.className = grid ? 'cell' : 'opt'; b.innerHTML = o.label;
    if (!grid) b.style.animationDelay = idx * .07 + 's';
    b.onclick = () => {
      if (ctx.st.done) return;
      if (o.ok) { b.classList.add('ok'); burst(b); ctx.win(o.say); }
      else {
        b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450);
        ctx.wrong();
        if (ctx.st.wrong >= 2) btns[it.opts.findIndex(x => x.ok)].classList.add('hint');
      }
    };
    $('opts').appendChild(b); return b;
  });
}
const RENDER = {
  dragcount(it, body, ctx) {
    body.innerHTML = `<div class="stage"><div class="dragwrap"><div class="zone basket" id="bk"><div class="zl">🧺 ${it.n}</div><div class="slot" id="bkin"></div></div><div class="pile" id="pile"></div></div></div>
      <div class="opts"><button class="btn" id="done">✅ Xong</button></div>`;
    const pile = $('pile'), bkin = $('bkin');
    const count = () => bkin.children.length;
    for (let i = 0; i < it.total; i++) {
      const p = document.createElement('span'); p.className = 'piece'; p.textContent = it.piece; pile.appendChild(p);
      draggable(p, z => {
        if (!z || z.id !== 'bk' || p.parentNode === bkin) return false;
        bkin.appendChild(p); beep(1, true); say('n' + Math.min(count(), 10)); return true;
      }, () => { if (p.parentNode === bkin) { pile.appendChild(p); say('n' + count()); } });
    }
    $('done').onclick = () => { if (count() === it.n) { burst($('bk')); ctx.win('n' + it.n); } else ctx.wrong(); };
  },
  dragmatch(it, body, ctx) {
    body.innerHTML = `<div class="stage"><div class="zones">${it.zones.map((z, i) => `<div class="zone" data-id="${i}"><div class="zl">${z}</div><div class="slot"></div></div>`).join('')}</div><div class="pile" id="pile"></div></div>`;
    let placed = 0;
    it.pieces.forEach(pc => {
      const p = document.createElement('span'); p.className = 'piece'; p.textContent = pc.label; $('pile').appendChild(p);
      draggable(p, z => {
        if (!z) return false;
        if (+z.dataset.id === pc.to) {
          z.querySelector('.slot').appendChild(p); p.onpointerdown = null; beep(1, true); hearts(z);
          if (++placed === it.pieces.length) ctx.win(); return true;
        }
        ctx.wrong(); return false;
      });
    });
  },
  memory(it, body, ctx) {
    body.innerHTML = `<div class="stage"><div class="cards" id="cards" style="grid-template-columns:repeat(${it.cols},auto)"></div></div>`;
    let open = [], matched = 0, busy = false;
    it.cards.forEach(cd => {
      const b = document.createElement('button'); b.className = 'card'; b.innerHTML = `<span class="back">❓</span><span class="face">${cd.label}</span>`;
      b.onclick = () => {
        if (busy || ctx.st.done || b.classList.contains('flip')) return;
        b.classList.add('flip'); open.push([b, cd]);
        if (typeof cd.k === 'number' && /num/.test(cd.label)) say('n' + cd.k);
        if (open.length < 2) return;
        const [[b1, c1], [b2, c2]] = open; open = [];
        if (c1.k === c2.k) { b1.classList.add('match'); b2.classList.add('match'); beep(1, true); burst(b2); if (++matched * 2 === it.cards.length) setTimeout(() => ctx.win(), 300); }
        else { busy = true; setTimeout(() => { b1.classList.remove('flip'); b2.classList.remove('flip'); busy = false; }, 900); }
      };
      $('cards').appendChild(b);
    });
  },
  maze(it, body, ctx) {
    body.innerHTML = `<div class="stage mazest"><div class="maze" id="maze" style="--n:${it.size}"></div></div>`;
    let cur = 0;
    const btns = it.cells.map((c, i) => {
      const b = document.createElement('button'); b.className = 'mz' + (c.path === it.N - 1 ? ' home' : '') + (c.path === 0 ? ' walk' : '');
      b.innerHTML = c.v == null ? '🌳' : c.v; if (c.path === 0) b.innerHTML += `<span class="an">${it.animal}</span>`;
      if (c.path === it.N - 1) b.innerHTML += '<span class="hm">🏠</span>';
      b.onclick = () => {
        if (ctx.st.done || c.path === 0 || b.classList.contains('walk')) return;
        if (c.path === cur + 1) {
          cur++; b.classList.add('walk'); const a = app.querySelector('.mz .an'); if (a) a.remove();
          b.innerHTML += `<span class="an">${it.animal}</span>`; say('n' + c.v); beep(1, true);
          if (cur === it.N - 1) { burst(b, ['🏠', '⭐', '💖']); ctx.win(); }
        } else { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450); ctx.wrong(); }
      };
      $('maze').appendChild(b); return b;
    });
  },
  paint(it, body, ctx) {
    const g = it.art.g, H = g.length, W = g[0].length, digits = Object.keys(it.art.c);
    body.innerHTML = `<div class="stage"><div class="paint" id="paint" style="grid-template-columns:repeat(${W},auto)"></div>
      <div class="pals">${digits.map(d => `<button class="pal" data-d="${d}" style="background:${it.art.c[d]}">${d}</button>`).join('')}</div></div>`;
    let sel = null, left = W * H;
    app.querySelectorAll('.pal').forEach(p => p.onclick = () => { app.querySelectorAll('.pal').forEach(x => x.classList.remove('sel')); p.classList.add('sel'); sel = p.dataset.d; beep(1, true); });
    const cells = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const d = g[r][c], b = document.createElement('button'); b.className = 'px'; b.textContent = d; cells.push(b);
      b.onclick = () => {
        if (ctx.st.done || b.classList.contains('done')) return;
        if (!sel) { talk('Chọn màu trước nhé! 🎨'); say('chonmau'); return; }
        if (sel !== d) { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450); ctx.wrong(); return; }
        // tô cả vùng liền nhau cùng số
        const stack = [[r, c]], seen = new Set();
        while (stack.length) {
          const [y, x] = stack.pop(), k = y * W + x;
          if (y < 0 || x < 0 || y >= H || x >= W || seen.has(k) || g[y][x] !== d) continue;
          seen.add(k); if (!cells[k].classList.contains('done')) { cells[k].classList.add('done'); cells[k].style.background = it.art.c[d]; left--; }
          stack.push([y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1]);
        }
        beep(1, true);
        if (left === 0) { burst($('paint'), ['🎨', '🌈', '⭐']); ctx.win(); }
      };
      $('paint').appendChild(b);
    }
  },
  shop(it, body, ctx) {
    body.innerHTML = `<div class="stage"><div class="shopq"><span class="big" style="font-size:80px">${it.item}</span><span class="tag">🏷️ ${it.n} xu</span></div>
      <div class="small" style="margin:8px 0 4px">Quầy trả tiền (chạm xu để đặt vào / lấy ra)</div><div class="tray" id="tray"></div>
      <div class="small" style="margin:10px 0 4px">Ví của bé 👛</div><div class="pile" id="wallet"></div></div>
      <div class="opts"><button class="btn" id="pay">💰 Trả tiền</button></div>`;
    it.coins.forEach(v => {
      const b = document.createElement('button'); b.className = 'coin c' + v; b.textContent = v; b.dataset.v = v;
      b.onclick = () => { if (ctx.st.done) return; (b.parentNode.id === 'wallet' ? $('tray') : $('wallet')).appendChild(b); beep(1, true); };
      $('wallet').appendChild(b);
    });
    $('pay').onclick = () => {
      const sum = [...$('tray').children].reduce((s, b) => s + +b.dataset.v, 0);
      if (sum === it.n) { burst($('tray'), ['🪙', '⭐', '🛍️']); ctx.win('n' + it.n); } else ctx.wrong();
    };
  },
};

// ───── Kết thúc lượt: sao, xu, thẻ sưu tầm ─────
function giveSticker() {
  const miss = STICKERS.filter(s => !K.stickers[s[0]]), s = miss.length ? pick(miss) : pick(STICKERS);
  K.stickers[s[0]] = (K.stickers[s[0]] || 0) + 1; return s;
}
function finish(lost) {
  studying = false;
  const st = run.right >= 9 ? 3 : run.right >= 6 ? 2 : 1;
  if (run.mode === 'level') {
    const p = catProg(run.ci); p[run.L] = Math.max(p[run.L] || 0, st); K.coins += st;
    const stk = st >= 2 ? giveSticker() : null; save();
    app.innerHTML = `<div class="done panel"><div class="big">🏆</div>Hoàn thành màn ${run.L}!<br>Bé làm đúng ngay ${run.right}/10 câu
      <div class="starrow">${range(1, 3).map(i => `<span style="animation-delay:${i * .3}s">${i <= st ? '⭐' : '☆'}</span>`).join('')}</div>
      <div>+${st} 🪙 xu</div>
      ${stk ? `<div class="reveal"><span class="ic">${stk[0]}</span>Thẻ mới: ${stk[1]}</div>` : '<div class="small">Được 2 sao trở lên sẽ nhận thẻ con vật 🎴</div>'}<br>
      ${run.L < 50 ? `<button class="btn" onclick="playLevel(${run.ci},${run.L + 1})">Màn tiếp ▶️</button>` : ''}
      <button class="btn alt" onclick="playLevel(${run.ci},${run.L})">🔁 Chơi lại</button><button class="btn alt" onclick="showLevels(${run.ci})">🗺️ Chọn màn</button></div>`;
    say(stk ? ['sao' + st, 'sticker'] : 'sao' + st); confetti(50);
  } else if (lost) {
    save();
    app.innerHTML = `<div class="done panel"><div class="big">🥺</div>Hết trái tim rồi!<br>Mình thử lại nhé, bé sẽ làm được!<br>
      <button class="btn" onclick="playIsle(${run.ii})">🔁 Thử lại</button><button class="btn alt" onclick="showIsles()">🗺️ Bản đồ đảo</button></div>`;
    say('thua');
  } else {
    const I = ISLANDS[run.ii]; K.isles[run.ii] = 1; K.coins += 5; save();
    app.innerHTML = `<div class="done panel"><div class="big">${I.prize}</div>Bé đã chinh phục ${I.name}!<br>Nhận kho báu ${I.prize} và +5 🪙
      <div class="reveal"><span class="ic">${I.friend}</span>Bạn được giải cứu</div><div class="starrow">${'❤️'.repeat(run.hearts)}</div>
      ${run.ii < 9 ? `<button class="btn" onclick="playIsle(${run.ii + 1})">Đảo tiếp theo ⛵</button>` : ''}<button class="btn alt" onclick="showIsles()">🗺️ Bản đồ đảo</button></div>`;
    say('thang'); confetti(70);
  }
  refreshHead(); checkMedals();
}

// ───── Bản đồ chinh phục ─────
function showIsles() {
  if (resting()) return showRest();
  studying = false; setBack(home);
  const open = Object.keys(K.isles).length;
  app.innerHTML = `<div class="title">🗺️ Chinh phục 10 hòn đảo ⛵</div><div class="small" style="text-align:center;margin-bottom:12px">Mỗi đảo 10 câu trộn mọi chủ đề · Có 3 trái tim ❤️ · Câu cuối gặp trùm, thắng sẽ giải cứu một bạn!</div>
  <div class="isles">${ISLANDS.map((I, i) => { const won = K.isles[i], lock = i > open;
    return `<button class="isle ${won ? 'won' : ''} ${lock ? 'lock' : ''}" style="animation-delay:${i * .06}s" ${lock ? 'disabled' : `onclick="playIsle(${i})"`}>
      <span class="ic">${lock ? '🔒' : I.icon}</span><span style="flex:1;text-align:left">${I.name}<br><span class="small">${won ? 'Đã cứu ' + I.friend + ' · kho báu ' + I.prize : lock ? 'Chưa mở' : 'Trùm: ' + I.boss + ' ' + I.bossName}</span></span>${won ? '🚩' : ''}</button>`; }).join('')}</div>`;
  say('chondao');
}

// ───── Huy chương, thẻ sưu tầm, rương quà ─────
function showMedals() {
  studying = false; setBack(home);
  app.innerHTML = `<div class="title">🏅 Huy chương của ${K.profile.name}</div><div class="medals">${MEDALS.map(([id, ic, name]) =>
    `<div class="medal ${K.medals[id] ? '' : 'lock'}"><span class="ic">${ic}</span>${name}${K.medals[id] ? '' : '<br>🔒'}</div>`).join('')}</div>`;
}
function showAlbum() {
  studying = false; setBack(home);
  const have = Object.keys(K.stickers).length;
  app.innerHTML = `<div class="title">🎴 Thẻ sưu tầm <span class="small">${have}/${STICKERS.length}</span></div>
  <div class="small" style="text-align:center;margin:-6px 0 12px">Qua màn được 2 sao trở lên là có thẻ mới. Rương quà mỗi ngày cũng có thể có thẻ!</div>
  <div class="album">${STICKERS.map(([e, n]) => { const c = K.stickers[e];
    return `<div class="stk ${c ? '' : 'no'}"><span class="ic">${e}</span>${c ? n : '???'}${c > 1 ? `<span class="cnt">×${c}</span>` : ''}</div>`; }).join('')}</div>
  <div class="title" style="font-size:22px;margin-top:20px">🦸 Các bạn đã giải cứu</div>
  <div class="album">${ISLANDS.map((I, i) => `<div class="stk ${K.rescued[i] ? '' : 'no'}"><span class="ic">${I.friend}</span>${K.rescued[i] ? I.name : '???'}</div>`).join('')}</div>`;
}
function openChest() {
  if (K.chest === today()) { toast('🎁', 'Hôm nay bé đã mở quà rồi.<br>Mai quay lại nhé!'); return; }
  if (!chestReady()) { toast('⏱', `Học thêm ${Math.ceil((600 - todaySecs()) / 60)} phút nữa để mở quà nhé!`); return; }
  K.chest = today(); say('ruong');
  let html;
  if (Math.random() < .5) { const s = giveSticker(); html = `<div class="reveal"><span class="ic">${s[0]}</span>Thẻ mới: ${s[1]}</div>`; }
  else { const c = 5 + R(11); K.coins += c; html = `<div class="reveal"><span class="ic">🪙</span>+${c} xu</div>`; }
  save(); refreshHead(); confetti(50);
  app.innerHTML = `<div class="done panel"><div class="big">🎁</div>Quà hôm nay của ${K.profile.name}!<br>${html}<br><button class="btn" onclick="home()">Tuyệt quá! 🏠</button></div>`;
  checkMedals();
}

// ───── Phòng của bé + cửa hàng của bạn Cú ─────
const ROOM_SPOTS = [[8, 66], [80, 64], [20, 80], [68, 82], [40, 84], [86, 40], [6, 40], [55, 66], [28, 64], [74, 18], [30, 14], [90, 84]];
function showRoom() {
  if (!K) return;
  studying = false; setBack(home);
  const decor = SHOP.decor.filter(d => K.items[d[0]]);
  app.innerHTML = `<div class="title">🏠 Phòng của ${K.profile.name}</div>
  <div class="room" id="room"><span class="win">🪟</span>${decor.map((d, i) => `<span class="it" style="left:${ROOM_SPOTS[i][0]}%;top:${ROOM_SPOTS[i][1]}%;animation-delay:${i * .05}s">${d[1]}</span>`).join('')}
    <span class="owl" id="owl" onclick="react('happy');hearts(this)"><span class="hat">${hatOf()}</span>🦉</span></div>
  <div class="panel" style="text-align:center"><b>Cho bạn Cú ăn</b> <span class="small">(bé có ${K.coins} 🪙)</span><br>
    ${SHOP.food.map(f => `<button class="btn alt" style="font-size:18px" onclick="feed('${f[0]}')">${f[1]} ${f[3]} 🪙</button>`).join('')}</div>
  <div class="tabs"><button class="on" onclick="showShop('hat')">🛒 Mua mũ cho Cú</button><button class="on" onclick="showShop('decor')">🛒 Mua đồ trang trí</button></div>
  ${decor.length ? '' : '<div class="small" style="text-align:center">Phòng còn trống. Học để có xu 🪙 rồi mua đồ trang trí nhé!</div>'}`;
}
function feed(id) {
  const f = SHOP.food.find(x => x[0] === id);
  if (K.coins < f[3]) { say('thieuxu'); toast('🪙', 'Chưa đủ xu rồi!<br>Học thêm để có xu nhé'); return; }
  K.coins -= f[3]; K.fed++; save(); refreshHead(); say('ngon'); hearts($('owl')); react('happy');
  toast(f[1], 'Ngon quá! Cảm ơn bé!', 1400); setTimeout(() => { if ($('room')) showRoom(); }, 1500); checkMedals();
}
function showShop(tab) {
  studying = false; setBack(showRoom);
  app.innerHTML = `<div class="title">🛒 Cửa hàng <span class="small">· Bé có ${K.coins} 🪙</span></div>
  <div class="tabs"><button class="${tab === 'hat' ? 'on' : ''}" onclick="showShop('hat')">🎩 Mũ cho Cú</button><button class="${tab === 'decor' ? 'on' : ''}" onclick="showShop('decor')">🪴 Đồ trang trí</button></div>
  <div class="shopgrid">${SHOP[tab].map(([id, ic, name, price]) => {
    const own = K.items[id], wear = K.hat === id;
    const btn = own ? (tab === 'hat' ? `<button class="${wear ? 'have' : ''}" onclick="wearHat('${id}')">${wear ? '✅ Đang đội' : '🎩 Đội'}</button>` : `<button class="have">✅ Đã có</button>`)
      : `<button onclick="buy('${tab}','${id}')">${price} 🪙</button>`;
    return `<div class="si"><span class="ic">${ic}</span>${name}<br>${btn}</div>`; }).join('')}</div>`;
}
function buy(tab, id) {
  const it = SHOP[tab].find(x => x[0] === id);
  if (K.coins < it[3]) { say('thieuxu'); toast('🪙', 'Chưa đủ xu rồi!<br>Học thêm để có xu nhé'); return; }
  K.coins -= it[3]; K.items[id] = 1; if (tab === 'hat') K.hat = id;
  save(); refreshHead(); say('mua'); confetti(30); toast(it[1], 'Bé đã mua ' + it[2] + '!', 1500); showShop(tab); checkMedals();
}
function wearHat(id) { K.hat = K.hat === id ? null : id; save(); refreshHead(); showShop('hat'); react('happy'); }

// ───── Khu dành cho bố mẹ ─────
function gate(cb) {
  const a = 5 + R(5), b = 3 + R(6), m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="panel" style="text-align:center"><div class="title" style="font-size:22px">👨‍👩‍👧 Dành cho bố mẹ</div>
    Trả lời phép tính: <b style="font-size:26px">${a} + ${b} = ?</b><br><input type="text" inputmode="numeric" id="gin" style="margin:12px 0;width:140px"><br>
    <button class="btn" id="gok">Vào</button><button class="btn alt" id="gno">Huỷ</button></div>`;
  document.body.appendChild(m); $('gin').focus();
  $('gno').onclick = () => m.remove();
  const go = () => { if (+$('gin').value === a + b) { m.remove(); cb(); } else { $('gin').value = ''; $('gin').placeholder = 'Chưa đúng'; } };
  $('gok').onclick = go; $('gin').onkeydown = e => { if (e.key === 'Enter') go(); };
}
function showParent(tab) {
  studying = false; setBack(home);
  const T = [['report', '📊 Báo cáo'], ['time', '⏰ Thời gian'], ['voice', '🎤 Giọng bố mẹ'], ['kids', '👥 Hồ sơ']];
  app.innerHTML = `<div class="title">👨‍👩‍👧 Góc bố mẹ</div><div class="tabs">${T.map(([k, n]) => `<button class="${k === tab ? 'on' : ''}" onclick="showParent('${k}')">${n}</button>`).join('')}</div><div id="pbody"></div>`;
  ({ report: parentReport, time: parentTime, voice: parentVoice, kids: parentKids })[tab]($('pbody'));
}
function parentReport(el) {
  const days = range(0, 6).reverse().map(i => { const d = new Date(); d.setDate(d.getDate() - i); return d; });
  const secs = days.map(d => K.time[d.toLocaleDateString('sv')] || 0), mx = Math.max(60, ...secs);
  const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const catAcc = CATS.map((c, i) => { let n = 0, ok = 0; c.games.forEach(g => { const s = K.stats[g]; if (s) { n += s.n; ok += s.ok; } }); return { c, n, p: n ? Math.round(ok / n * 100) : null }; });
  const games = Object.entries(K.stats).filter(([, s]) => s.n >= 3).map(([g, s]) => ({ g, p: Math.round(s.ok / s.n * 100), n: s.n }));
  const weak = [...games].sort((a, b) => a.p - b.p).slice(0, 3), strong = [...games].sort((a, b) => b.p - a.p).slice(0, 3);
  const totalN = Object.values(K.stats).reduce((s, x) => s + x.n, 0), totalOk = Object.values(K.stats).reduce((s, x) => s + x.ok, 0);
  const color = p => p >= 80 ? '#3cb371' : p >= 60 ? '#ffc83d' : '#ff7a59';
  const gname = g => GAMES[g] ? GAMES[g].icon + ' ' + GAMES[g].name : g;
  el.innerHTML = `<div class="panel"><b>Bé ${K.profile.name}</b><div class="stats" style="margin-top:8px">
    <div>Hôm nay<b>${mins(todaySecs())}</b></div><div>Tổng thời gian<b>${mins(totalSecs())}</b></div><div>Câu đã làm<b>${totalN}</b></div>
    <div>Đúng ngay lần đầu<b>${totalN ? Math.round(totalOk / totalN * 100) : 0}%</b></div><div>Màn đã qua<b>${passed()}/300</b></div><div>Học liền<b>${streak()} ngày</b></div></div></div>
  <div class="panel"><b>⏱ Thời gian học 7 ngày qua (phút)</b><div class="chart" style="margin-top:10px">${days.map((d, i) =>
    `<div>${Math.round(secs[i] / 60)}<i style="height:${secs[i] / mx * 100}%"></i>${wd[d.getDay()]}</div>`).join('')}</div></div>
  <div class="panel"><b>🎯 Tỉ lệ đúng ngay lần đầu theo chủ đề</b>${catAcc.map(a => `<div class="acc"><span class="t">${a.c.icon} ${a.c.name}</span>
    <span class="b"><i style="width:${a.p || 0}%;background:${color(a.p || 0)}"></i></span><span style="width:70px;text-align:right">${a.p == null ? 'chưa học' : a.p + '%'}</span></div>`).join('')}</div>
  <div class="panel"><b>💡 Gợi ý cho bố mẹ</b><br>
    ${games.length ? `<div style="margin-top:8px">😊 Bé làm tốt: ${strong.map(x => `<b>${gname(x.g)}</b> (${x.p}%)`).join(', ')}</div>
    <div style="margin-top:6px">🤔 Bé cần luyện thêm: ${weak.map(x => `<b>${gname(x.g)}</b> (${x.p}%)`).join(', ')}</div>
    <div class="small" style="margin-top:6px">Bố mẹ có thể chơi cùng bé những dạng cần luyện, hoặc hỏi bé bằng đồ vật thật trong nhà.</div>`
    : '<div class="small">Bé làm thêm vài màn để có đủ dữ liệu nhé.</div>'}</div>`;
}
function parentTime(el) {
  el.innerHTML = `<div class="panel" style="text-align:center"><b>Giới hạn thời gian chơi liên tục</b>
    <div class="small" style="margin:6px 0 10px">Hết giờ, bạn Cú sẽ nhắc bé nghỉ mắt 5 phút. Trong lúc nghỉ, app khoá lại; bố mẹ có thể mở khoá bằng phép tính.</div>
    ${[0, 15, 20, 30, 45].map(m => `<button class="btn ${DB.limit === m ? '' : 'alt'}" onclick="DB.limit=${m};save();showParent('time')">${m ? m + ' phút' : 'Không giới hạn'}</button>`).join('')}</div>`;
}
async function parentVoice(el) {
  await loadPraise();
  el.innerHTML = `<div class="panel" style="text-align:center"><b>🎤 Thu giọng khen của bố mẹ</b>
    <div class="small" style="margin:6px 0 10px">Ví dụ: "Con giỏi quá!", "Mẹ yêu con!". Mỗi câu tối đa 5 giây, thu được 5 câu. Khi bé làm đúng, app sẽ thỉnh thoảng phát giọng của bố mẹ.</div>
    ${praise.length < 5 ? `<button class="btn" id="recb" onclick="record(this)">⏺ Bấm để thu</button>` : '<div class="small">Đã đủ 5 câu. Xoá bớt để thu câu mới.</div>'}
    <div style="margin-top:12px;text-align:left">${praise.map((p, i) => `<div class="clip">🗣️ Câu ${i + 1}<span class="sp"></span><button class="btn alt" style="font-size:16px;padding:6px 12px" onclick="say('${p.url}')">▶️ Nghe</button><button class="btn" style="font-size:16px;padding:6px 12px" onclick="delClip(${p.k})">🗑️</button></div>`).join('')}</div></div>`;
}
async function record(btn) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), mr = new MediaRecorder(stream), chunks = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = async () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(chunks, { type: mr.mimeType }); await clipOp('readwrite', s => s.add(blob)); showParent('voice'); };
    if (window.NhacNen) NhacNen.setVolume(0);
    mr.start(); btn.textContent = '⏹ Đang thu… bấm để dừng'; btn.onclick = () => mr.state === 'recording' && mr.stop();
    setTimeout(() => mr.state === 'recording' && mr.stop(), 5000);
  } catch (e) { toast('🎤', 'Không mở được micro.<br>Hãy cho phép app dùng micro nhé.'); }
}
async function delClip(k) { await clipOp('readwrite', s => s.delete(k)); showParent('voice'); }
function parentKids(el) {
  el.innerHTML = `<div class="panel">${Object.entries(DB.kids).map(([id, k]) => `<div class="clip"><span class="av">${avHTML(k.profile.avatar)}</span><b>${k.profile.name}</b>${id === DB.cur ? ' <span class="small">(đang chơi)</span>' : ''}<span class="sp"></span>
    <button class="btn alt" style="font-size:16px;padding:6px 12px" onclick="useKid('${id}')">Chọn</button>
    ${Object.keys(DB.kids).length > 1 ? `<button class="btn" style="font-size:16px;padding:6px 12px" onclick="delKid('${id}')">🗑️</button>` : ''}</div>`).join('')}
    <div style="text-align:center;margin-top:10px"><button class="btn" onclick="showProfile('new')">➕ Thêm bé</button></div></div>`;
}
function delKid(id) {
  if (!confirm('Xoá hồ sơ của ' + DB.kids[id].profile.name + '? Toàn bộ tiến độ của bé sẽ mất.')) return;
  delete DB.kids[id];
  if (DB.cur === id) { DB.cur = Object.keys(DB.kids)[0]; K = DB.kids[DB.cur]; }
  save(); refreshHead(); showParent('kids');
}

// ───── Khởi động ─────
loadPraise();
refreshHead();
if (!K) showProfile('new');
else if (resting()) showRest();
else if (Object.keys(DB.kids).length > 1) showPick();
else home();
// Có bản mới: tự tải lại khi bé không đang làm bài (đang làm thì đợi về trang chủ)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js');
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadSW) return; if (studying) pendingReload = true; else location.reload(); });
}
