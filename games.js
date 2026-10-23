// Bộ tạo câu hỏi. Mỗi dạng bài có hàm make(L) — L là cấp độ 1..50, càng cao càng khó.
// Câu hỏi trả về: {q: chữ hiển thị, v: tên file giọng đọc (hoặc mảng), html: phần hình minh hoạ,
//                  opts: [{label, ok, say}], layout: 'row' | 'col' | 'bottom' | 'grid', cols}
const R = n => Math.floor(Math.random() * n), pick = a => a[R(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐸', '🐷', '🐮', '🐵', '🐔', '🦆', '🐟', '🦋', '🐞', '🐘', '🦁', '🐯', '🐨', '🐧', '🦒'];
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍐', '🍒', '🍑', '🥝', '🍍'];
const ALL = [...ANIMALS, ...FRUITS];

// Độ khó theo cấp: số lớn nhất (4 → 10) và số đáp án (3 → 4)
const MX = L => Math.min(10, 4 + Math.floor((L - 1) / 7));
const K = L => (L < 12 ? 3 : 4);

// Xếp n hình thành hàng 5 cho bé dễ đếm
const rows = (e, n, cls = '') => `<div class="rows ${cls}">${Array.isArray(e) ? e.map(x => `<span>${x}</span>`).join('') : `<span>${e}</span>`.repeat(n)}</div>`;
const dots = n => `<div class="dots">${'<i></i>'.repeat(n)}</div>`;

function numOpts(n, L, lo = 0, hi = 10) {
  const o = new Set([n]);
  let guard = 0;
  while (o.size < K(L) && guard++ < 100) { const x = n + R(7) - 3; if (x >= lo && x <= hi) o.add(x); }
  return shuffle([...o]).map(x => ({ label: x, ok: x === n, say: 'n' + x }));
}
// Chọn k số khác nhau trong [a,b]
const distinct = (k, a, b) => shuffle(range(a, b)).slice(0, k);

// Hình học vẽ bằng SVG
const SHAPES = ['tròn', 'vuông', 'tam giác', 'chữ nhật', 'ngôi sao', 'trái tim'];
const COLORS = ['#ff7a59', '#4fb3ff', '#7bd16b', '#c08bff', '#ffc83d', '#ff6fa8'];
function shape(t, c, s = 80, rot = 0) {
  const p = {
    0: `<circle cx=40 cy=40 r=34 fill="${c}"/>`,
    1: `<rect x=8 y=8 width=64 height=64 rx=4 fill="${c}"/>`,
    2: `<polygon points="40,6 76,72 4,72" fill="${c}"/>`,
    3: `<rect x=2 y=20 width=76 height=40 rx=4 fill="${c}"/>`,
    4: `<polygon points="40,4 50,30 78,30 55,47 64,75 40,58 16,75 25,47 2,30 30,30" fill="${c}"/>`,
    5: `<path d="M40 72 L10 42 A16 16 0 0 1 40 18 A16 16 0 0 1 70 42 Z" fill="${c}"/>`,
  }[t];
  return `<svg width=${s} height=${s} viewBox="0 0 80 80" style="transform:rotate(${rot}deg)">${p}</svg>`;
}

const GAMES = {
  // ───── Số và Đếm ─────
  dem: { name: 'Đếm số', icon: '🔢', make(L) {
    const n = 1 + R(MX(L)), e = pick(ALL);
    return { q: 'Có bao nhiêu hình? Bé đếm nhé!', v: 'dem', html: rows(e, n), opts: numOpts(n, L, 1) };
  } },
  nhieu: { name: 'Nhiều hơn - Ít hơn', icon: '⚖️', make(L) {
    const mx = MX(L), gap = L < 20 ? 2 : 1;
    let a, b; do { a = 1 + R(mx); b = 1 + R(mx); } while (Math.abs(a - b) < gap);
    const e1 = pick(FRUITS), e2 = pick(ANIMALS), more = Math.random() < .5;
    return { q: more ? 'Nhóm nào NHIỀU hơn?' : 'Nhóm nào ÍT hơn?', v: more ? 'nhieu' : 'it',
      opts: [{ label: rows(e1, a, 'sm'), ok: more ? a > b : a < b }, { label: rows(e2, b, 'sm'), ok: more ? b > a : b < a }] };
  } },
  timnhom: { name: 'Tìm nhóm đúng số', icon: '🎯', make(L) {
    const mx = MX(L), cs = distinct(K(L), 1, mx), n = pick(cs), e = pick(ALL);
    return { q: 'Bé tìm nhóm có ' + n + ' hình', v: ['timnhom', 'n' + n], html: `<div class="bignum">${n}</div>`,
      opts: cs.map(c => ({ label: rows(e, c, 'sm'), ok: c === n })) };
  } },
  sothieu: { name: 'Số còn thiếu', icon: '🔟', make(L) {
    const len = L < 25 ? 4 : 5, st = 1 + R(Math.max(1, Math.min(MX(L), 11) - len + 1));
    let seq = range(st, st + len - 1); if (L >= 35 && Math.random() < .5) seq.reverse();
    const hole = L < 15 ? len - 1 : R(len), ans = seq[hole];
    return { q: 'Số nào còn thiếu nhỉ?', v: 'sothieu',
      html: `<div class="seq">${seq.map((x, i) => `<b class="${i === hole ? 'hole' : ''}">${i === hole ? '?' : x}</b>`).join('')}</div>`,
      opts: numOpts(ans, L, 0, 10) };
  } },
  solon: { name: 'Số lớn - Số bé', icon: '🔝', make(L) {
    const ns = distinct(K(L), 1, MX(L)), big = Math.random() < .5, t = big ? Math.max(...ns) : Math.min(...ns);
    return { q: big ? 'Số nào LỚN nhất?' : 'Số nào BÉ nhất?', v: big ? 'solon' : 'sobe',
      opts: ns.map(x => ({ label: `<div>${x}</div>${L < 20 ? dots(x) : ''}`, ok: x === t, say: 'n' + x })) };
  } },

  // ───── Gộp và Tách ─────
  gop: { name: 'Gộp nhóm', icon: '➕', make(L) {
    const n = 2 + R(MX(L) - 1), a = 1 + R(n - 1), e = pick(FRUITS), e2 = L >= 25 ? pick(FRUITS) : e;
    return { q: 'Gộp hai nhóm lại, được tất cả bao nhiêu?', v: 'gop',
      html: `<div class="pair mid"><div class="box">${rows(e, a, 'sm')}</div><span class="sign">➕</span><div class="box">${rows(e2, n - a, 'sm')}</div></div>`, opts: numOpts(n, L, 1) };
  } },
  bot: { name: 'Bớt đi', icon: '➖', make(L) {
    const n = 2 + R(MX(L) - 1), k = 1 + R(n - 1), e = pick(ANIMALS);
    return { q: 'Bớt đi các bạn bị gạch, còn lại mấy bạn?', v: 'bot',
      html: rows([...Array(n - k).fill(e), ...Array(k).fill(`<s class="gach">${e}</s>`)], 0), opts: numOpts(n - k, L, 0) };
  } },
  tach: { name: 'Tách số', icon: '🏠', make(L) {
    const n = 2 + R(MX(L) - 1), a = 1 + R(n - 1), e = pick(FRUITS);
    return { q: 'Mái nhà là số ' + n + '. Phòng bên kia có mấy quả?', v: 'tach',
      html: `<div class="house"><div class="roof"><b>${n}</b></div><div class="rooms"><div class="box">${rows(e, a, 'sm')}</div><div class="box q">❓</div></div></div>`,
      opts: numOpts(n - a, L, 0) };
  } },
  domino: { name: 'Thẻ domino', icon: '🁫', make(L) {
    const n = 2 + R(MX(L) - 1), a = 1 + R(Math.min(n - 1, 5)), b = n - a;
    return { q: 'Có tất cả bao nhiêu chấm tròn?', v: 'domino', html: `<div class="domino">${dots(a)}<hr>${dots(b)}</div>`, opts: numOpts(n, L, 1) };
  } },
  chimden: { name: 'Chim bay đến', icon: '🐦', make(L) {
    const n = 2 + R(MX(L) - 1), a = 1 + R(n - 1);
    return { q: 'Có mấy chú chim trên cành, thêm mấy chú bay đến. Có tất cả mấy chú?', v: 'chimden',
      html: `<div class="pair mid"><div class="branch">${rows('🐦', a, 'sm')}</div><span class="sign">⬅️</span><div class="flyin">${rows('🐦', n - a, 'sm')}</div></div>`, opts: numOpts(n, L, 1) };
  } },
  baydi: { name: 'Chim bay đi', icon: '🕊️', make(L) {
    const n = 2 + R(MX(L) - 1), k = 1 + R(n - 1);
    return { q: 'Có mấy chú chim bay đi mất. Trên cành còn lại mấy chú?', v: 'baydi',
      html: `<div class="flyaway">${rows('🕊️', k, 'sm')}</div><div class="branch">${rows('🕊️', n - k, 'sm')}</div>`, opts: numOpts(n - k, L, 0) };
  } },

  // ───── So sánh ─────
  dai: { name: 'Dài - Ngắn', icon: '📏', make(L) {
    const k = K(L), spread = L < 15 ? 9 : L < 35 ? 6 : k + 1, us = distinct(k, 2, 1 + spread), lng = Math.random() < .5;
    const t = lng ? Math.max(...us) : Math.min(...us);
    return { q: lng ? 'Sợi dây nào DÀI nhất?' : 'Sợi dây nào NGẮN nhất?', v: lng ? 'dai' : 'ngan', layout: 'col',
      opts: us.map((u, i) => ({ label: `<div class="bar" style="width:${u * 26}px;background:${COLORS[i]}"></div>`, ok: u === t })) };
  } },
  to: { name: 'To - Nhỏ', icon: '🐘', make(L) {
    const step = L < 20 ? 22 : 14, ss = distinct(K(L), 0, 4).map(i => 30 + i * step), e = pick(ANIMALS), big = Math.random() < .5;
    const t = big ? Math.max(...ss) : Math.min(...ss);
    return { q: big ? 'Con nào TO nhất?' : 'Con nào NHỎ nhất?', v: big ? 'to' : 'nho', layout: 'bottom',
      opts: ss.map(x => ({ label: `<span style="font-size:${x}px;line-height:1">${e}</span>`, ok: x === t })) };
  } },
  cao: { name: 'Cao - Thấp', icon: '🏗️', make(L) {
    const hs = distinct(K(L), 1, Math.max(K(L), MX(L))), hi = Math.random() < .5, t = hi ? Math.max(...hs) : Math.min(...hs);
    return { q: hi ? 'Tháp nào CAO nhất?' : 'Tháp nào THẤP nhất?', v: hi ? 'cao' : 'thap', layout: 'bottom',
      opts: hs.map((h, i) => ({ label: `<div class="tower">${`<i style="background:${COLORS[i]}"></i>`.repeat(h)}</div>`, ok: h === t })) };
  } },
  nang: { name: 'Nặng - Nhẹ', icon: '🏋️', make() {
    const P = [['🐘', '🐭'], ['🍉', '🍒'], ['🚚', '🚲'], ['🐻', '🐦'], ['🎃', '🍓'], ['🐄', '🐔'], ['🪨', '🪶'], ['🦛', '🐸'], ['🏠', '⚽']];
    const [h, l] = pick(P), heavy = Math.random() < .5;
    return { q: heavy ? 'Vật nào NẶNG hơn?' : 'Vật nào NHẸ hơn?', v: heavy ? 'nang' : 'nhe',
      opts: shuffle([{ label: h, ok: heavy }, { label: l, ok: !heavy }]) };
  } },

  // ───── Hình khối ─────
  hinh: { name: 'Gọi tên hình', icon: '🔷', make(L) {
    const ts = distinct(K(L) + (L >= 30 ? 1 : 0), 0, 5), t = pick(ts);
    return { q: 'Bé chỉ vào hình ' + SHAPES[t] + ' nhé!', v: 'h' + t,
      opts: ts.map(x => ({ label: shape(x, pick(COLORS), L < 20 ? 80 : 50 + R(40), L >= 25 ? R(4) * 20 : 0), ok: x === t })) };
  } },
  demhinh: { name: 'Đếm hình', icon: '🔺', make(L) {
    const t = R(6), c = 1 + R(Math.min(MX(L), 7)), others = 2 + R(Math.min(8, 3 + Math.floor(L / 6)));
    const items = shuffle([...Array(c).fill(t), ...Array.from({ length: others }, () => { let x; do x = R(6); while (x === t); return x; })]);
    return { q: 'Có bao nhiêu hình ' + SHAPES[t] + '?', v: 'dh' + t,
      html: `<div class="scatter">${items.map(x => shape(x, pick(COLORS), 46, L >= 25 ? R(6) * 15 : 0)).join('')}</div>`, opts: numOpts(c, L, 1) };
  } },
  giong: { name: 'Hình giống mẫu', icon: '🪞', make(L) {
    const t = R(6), c = R(6), o = R(6) === t ? (t + 1) % 6 : R(6) === t ? (t + 2) % 6 : (t + 1 + R(5)) % 6, c2 = (c + 1 + R(5)) % 6;
    const cand = [{ label: shape(t, COLORS[c], 70), ok: true }, { label: shape(t, COLORS[c2], 70), ok: false }, { label: shape(o, COLORS[c], 70), ok: false }, { label: shape(o, COLORS[c2], 70), ok: false }];
    return { q: 'Bé tìm hình giống hệt hình mẫu nhé!', v: 'giong', html: `<div class="sample">${shape(t, COLORS[c], 90)}</div>`,
      opts: shuffle(cand.slice(0, K(L))) };
  } },
  vathinh: { name: 'Đồ vật hình gì', icon: '⚽', make(L) {
    const M = [['⚽', '🍪', '🕐', '🌕', '🍩', '🏀', '🪙'], ['🎁', '🧊', '🎲'], ['🍕', '⛺', '📐', '🔺'], ['📱', '🚪', '📏', '🍫', '📺']];
    const t = R(4), obj = pick(M[t]), ts = shuffle([t, ...shuffle([0, 1, 2, 3].filter(x => x !== t)).slice(0, K(L) - 1)]);
    return { q: 'Đồ vật này có dạng hình gì?', v: 'vathinh', html: `<div class="big">${obj}</div>`,
      opts: ts.map(x => ({ label: shape(x, COLORS[x], 70), ok: x === t, say: 'h' + x })) };
  } },

  // ───── Quan sát ─────
  diemkhac: { name: 'Tìm điểm khác', icon: '👀', make(L) {
    const cols = L < 15 ? 3 : 4, rws = L < 35 ? 3 : 4, n = cols * rws, pool = L < 25 ? ALL : ANIMALS;
    const base = Array.from({ length: n }, () => pick(pool)), k = R(n), b2 = [...base];
    do b2[k] = pick(pool); while (b2[k] === base[k]);
    return { q: 'Tranh bên phải khác ở ô nào? Bé chạm vào ô đó nhé!', v: 'diemkhac', layout: 'grid', cols,
      html: `<div class="grid" style="grid-template-columns:repeat(${cols},1fr)">${base.map(x => `<div class="cell">${x}</div>`).join('')}</div>`,
      opts: b2.map((x, i) => ({ label: x, ok: i === k })) };
  } },
  khac: { name: 'Tìm đồ khác loại', icon: '🔍', make(L) {
    const G = [ANIMALS, FRUITS, ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢', '🚑', '🚜'], ['⚽', '🧸', '🪀', '🎈', '🪁', '🎲'], ['👕', '👗', '👖', '🧦', '🧢', '👟'], ['🥕', '🥦', '🌽', '🍆', '🥔', '🧅'], ['🌹', '🌻', '🌷', '🌼', '🌸']];
    const [a, b] = L < 25 ? shuffle(G.slice(0, 5)) : shuffle(G);
    const items = shuffle(a).slice(0, L < 20 ? 3 : 4), odd = pick(b);
    return { q: 'Đồ vật nào KHÔNG cùng nhóm?', v: 'khac', opts: shuffle([...items.map(x => ({ label: x, ok: false })), { label: odd, ok: true }]) };
  } },
  timdoi: { name: 'Tìm hình giống', icon: '🧐', make(L) {
    const G = [['🐶', '🐕', '🐩', '🦮'], ['🐱', '🐈', '😺', '🐈‍⬛'], ['🍎', '🍏', '🍅', '🍒'], ['🚗', '🚙', '🚕', '🚓'], ['🌸', '🌺', '🌷', '🌼'], ['🐟', '🐠', '🐡', '🐬'], ['🐦', '🐤', '🐥', '🐧'], ['🌝', '🌞', '🌛', '⭐']];
    const g = pick(G), s = pick(g), os = shuffle([s, ...shuffle(g.filter(x => x !== s)).slice(0, K(L) - 1)]);
    return { q: 'Bé tìm hình giống hệt hình mẫu nhé!', v: 'giong', html: `<div class="sample big">${s}</div>`, opts: os.map(x => ({ label: x, ok: x === s })) };
  } },
  thieu: { name: 'Hình bị mất', icon: '🧩', make(L) {
    const k = Math.min(3 + Math.floor(L / 10), 7), items = shuffle(ALL).slice(0, k), miss = pick(items);
    const bottom = items.filter(x => x !== miss), shown = L >= 25 ? shuffle(bottom) : bottom;
    const os = shuffle([miss, ...shuffle(bottom).slice(0, K(L) - 1)]);
    return { q: 'Bức tranh dưới bị mất một hình. Hình nào bị mất?', v: 'thieu',
      html: `<div class="frame">${items.join(' ')}</div><div class="frame">${shown.join(' ')}</div>`, opts: os.map(x => ({ label: x, ok: x === miss })) };
  } },

  // ───── Suy luận ─────
  quyluat: { name: 'Quy luật', icon: '🔁', make(L) {
    const pats = [[0, 1]]; if (L >= 10) pats.push([0, 0, 1], [0, 1, 1]); if (L >= 25) pats.push([0, 1, 2]); if (L >= 40) pats.push([0, 0, 1, 1], [0, 1, 2, 1]);
    const t = pick(pats), p = shuffle(ALL).slice(0, 3), len = t.length * 2 + (L >= 20 ? R(t.length) + 1 : 1);
    const seq = range(0, len - 1).map(i => p[t[i % t.length]]), hole = L < 30 ? len - 1 : R(len), ans = seq[hole];
    const os = shuffle([...new Set([ans, ...shuffle(p.slice(0, Math.max(...t) + 1)), pick(ALL)])].filter((x, i, a) => a.indexOf(x) === i)).slice(0, K(L));
    if (!os.includes(ans)) os[0] = ans;
    return { q: 'Hình còn thiếu là hình gì?', v: 'quyluat',
      html: `<div class="seq em">${seq.map((x, i) => `<b class="${i === hole ? 'hole' : ''}">${i === hole ? '?' : x}</b>`).join('')}</div>`,
      opts: shuffle(os).map(x => ({ label: x, ok: x === ans })) };
  } },
  an: { name: 'Con gì ăn gì', icon: '🥕', make(L) {
    const P = [['🐰', '🥕'], ['🐵', '🍌'], ['🐶', '🦴'], ['🐱', '🐟'], ['🐼', '🎋'], ['🐭', '🧀'], ['🐝', '🌸'], ['🐔', '🌽'], ['🐻', '🍯'], ['🐄', '🌾']];
    const ps = shuffle(P).slice(0, K(L)), t = pick(ps);
    return { q: 'Bạn này thích ăn gì nhỉ?', v: 'an', html: `<div class="big">${t[0]}</div>`, opts: shuffle(ps).map(p => ({ label: p[1], ok: p === t })) };
  } },
  odau: { name: 'Con gì sống ở đâu', icon: '🏡', make(L) {
    const P = [['🐟', '🌊'], ['🐦', '🪺'], ['🐧', '🧊'], ['🐫', '🏜️'], ['🐒', '🌴'], ['🐝', '🌻'], ['🐄', '🌾'], ['🐸', '🪷']];
    const ps = shuffle(P).slice(0, K(L)), t = pick(ps);
    return { q: 'Bạn này sống ở đâu nhỉ?', v: 'odau', html: `<div class="big">${t[0]}</div>`, opts: shuffle(ps).map(p => ({ label: p[1], ok: p === t })) };
  } },
  nguoc: { name: 'Trái ngược', icon: '🔄', make(L) {
    const P = [['☀️', '🌙'], ['🔥', '❄️'], ['😀', '😢'], ['👶', '👴'], ['🐘', '🐭'], ['⬆️', '⬇️'], ['🐢', '🐇'], ['🌕', '🌑']];
    const ps = shuffle(P).slice(0, K(L)), t = pick(ps), flip = Math.random() < .5;
    const show = flip ? t[1] : t[0], ans = flip ? t[0] : t[1];
    const os = shuffle([ans, ...ps.filter(p => p !== t).map(p => pick(p))]);
    return { q: 'Bé tìm hình trái ngược với hình này nhé!', v: 'nguoc', html: `<div class="big">${show}</div>`, opts: os.map(x => ({ label: x, ok: x === ans })) };
  } },
  nghe: { name: 'Nghề nghiệp', icon: '👮', make(L) {
    const P = [['👨‍🚒', '🚒'], ['👮', '🚓'], ['🧑‍⚕️', '🚑'], ['🧑‍🍳', '🍳'], ['🧑‍🌾', '🚜'], ['🧑‍✈️', '✈️'], ['🧑‍🏫', '📚'], ['🧑‍🎨', '🎨']];
    const ps = shuffle(P).slice(0, K(L)), t = pick(ps);
    return { q: 'Cô chú này cần dùng đồ vật gì?', v: 'nghe', html: `<div class="big">${t[0]}</div>`, opts: shuffle(ps).map(p => ({ label: p[1], ok: p === t })) };
  } },
};

const CATS = [
  { name: 'Số và Đếm', icon: '🔢', color: '#ffe0d6', deco: '🎈', games: ['dem', 'nhieu', 'timnhom', 'sothieu', 'solon'], v: 'cat0' },
  { name: 'Gộp và Tách', icon: '🧮', color: '#d6f5ef', deco: '🍎', games: ['gop', 'bot', 'tach', 'domino', 'chimden', 'baydi'], v: 'cat5' },
  { name: 'So sánh', icon: '📏', color: '#d9f0ff', deco: '🐘', games: ['dai', 'to', 'cao', 'nang'], v: 'cat1' },
  { name: 'Hình khối', icon: '🔷', color: '#e3f7d9', deco: '⭐', games: ['hinh', 'demhinh', 'giong', 'vathinh'], v: 'cat2' },
  { name: 'Quan sát', icon: '👀', color: '#fff1c2', deco: '🔍', games: ['diemkhac', 'khac', 'timdoi', 'thieu'], v: 'cat3' },
  { name: 'Suy luận', icon: '🧩', color: '#eedcff', deco: '💡', games: ['quyluat', 'an', 'odau', 'nguoc', 'nghe'], v: 'cat4' },
];

// 10 hòn đảo chinh phục — câu hỏi trộn mọi chủ đề, khó dần
const ISLANDS = [
  ['Đảo Dừa', '🏝️', '🐚'], ['Đảo Dâu Tây', '🍓', '🍬'], ['Đảo Cá Heo', '🐬', '🦪'], ['Đảo Kẹo Ngọt', '🍭', '🧁'], ['Đảo Núi Lửa', '🌋', '💎'],
  ['Đảo Cầu Vồng', '🌈', '🦄'], ['Đảo Băng Tuyết', '❄️', '⛄'], ['Đảo Hoa', '🌸', '🦋'], ['Đảo Lâu Đài', '🏰', '🗝️'], ['Đảo Vương Miện', '👑', '🏆'],
].map(([name, icon, prize], i) => ({ name, icon, prize, L: 3 + i * 5 }));
