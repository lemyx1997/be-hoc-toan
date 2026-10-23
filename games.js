// Bộ tạo câu hỏi. Mỗi dạng bài có hàm make(L) — L là cấp độ 1..50, càng cao càng khó.
// Câu hỏi trả về: {q: chữ hiển thị, v: tên file giọng đọc (hoặc mảng), html: phần hình minh hoạ,
//                  opts: [{label, ok, say}], layout: 'row' | 'col' | 'bottom' | 'grid', cols}
const R = n => Math.floor(Math.random() * n), pick = a => a[R(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐸', '🐷', '🐮', '🐵', '🐔', '🦆', '🐟', '🦋', '🐞', '🐘', '🦁', '🐯', '🐨', '🐧', '🦒'];
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍐', '🍒', '🍑', '🥝', '🍍'];
const ALL = [...ANIMALS, ...FRUITS];
const FOODS = [['🐰', '🥕'], ['🐵', '🍌'], ['🐶', '🦴'], ['🐱', '🐟'], ['🐼', '🎋'], ['🐭', '🧀'], ['🐝', '🌸'], ['🐔', '🌽'], ['🐻', '🍯'], ['🐄', '🌾']];
const HOMES = [['🐟', '🌊'], ['🐦', '🪺'], ['🐧', '🧊'], ['🐫', '🏜️'], ['🐒', '🌴'], ['🐝', '🌻'], ['🐄', '🌾'], ['🐸', '🪷']];

// Độ khó theo cấp: số lớn nhất (4 → 10) và số đáp án (3 → 4)
const MX = L => Math.min(10, 4 + Math.floor((L - 1) / 7));
const NK = L => (L < 12 ? 3 : 4);

// Xếp n hình thành hàng 5 cho bé dễ đếm
const rows = (e, n, cls = '') => `<div class="rows ${cls}">${(Array.isArray(e) ? e : Array(n).fill(e)).map((x, i) => `<span style="--i:${i}">${x}</span>`).join('')}</div>`;
const dots = n => `<div class="dots">${'<i></i>'.repeat(n)}</div>`;

function numOpts(n, L, lo = 0, hi = 10) {
  const o = new Set([n]);
  let guard = 0;
  while (o.size < NK(L) && guard++ < 100) { const x = n + R(7) - 3; if (x >= lo && x <= hi) o.add(x); }
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
    const mx = MX(L), cs = distinct(NK(L), 1, mx), n = pick(cs), e = pick(ALL);
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
    const ns = distinct(NK(L), 1, MX(L)), big = Math.random() < .5, t = big ? Math.max(...ns) : Math.min(...ns);
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
    const k = NK(L), spread = L < 15 ? 9 : L < 35 ? 6 : k + 1, us = distinct(k, 2, 1 + spread), lng = Math.random() < .5;
    const t = lng ? Math.max(...us) : Math.min(...us);
    return { q: lng ? 'Sợi dây nào DÀI nhất?' : 'Sợi dây nào NGẮN nhất?', v: lng ? 'dai' : 'ngan', layout: 'col',
      opts: us.map((u, i) => ({ label: `<div class="bar" style="width:${u * 26}px;background:${COLORS[i]}"></div>`, ok: u === t })) };
  } },
  to: { name: 'To - Nhỏ', icon: '🐘', make(L) {
    const step = L < 20 ? 22 : 14, ss = distinct(NK(L), 0, 4).map(i => 30 + i * step), e = pick(ANIMALS), big = Math.random() < .5;
    const t = big ? Math.max(...ss) : Math.min(...ss);
    return { q: big ? 'Con nào TO nhất?' : 'Con nào NHỎ nhất?', v: big ? 'to' : 'nho', layout: 'bottom',
      opts: ss.map(x => ({ label: `<span style="font-size:${x}px;line-height:1">${e}</span>`, ok: x === t })) };
  } },
  cao: { name: 'Cao - Thấp', icon: '🏗️', make(L) {
    const hs = distinct(NK(L), 1, Math.max(NK(L), MX(L))), hi = Math.random() < .5, t = hi ? Math.max(...hs) : Math.min(...hs);
    return { q: hi ? 'Tháp nào CAO nhất?' : 'Tháp nào THẤP nhất?', v: hi ? 'cao' : 'thap', layout: 'bottom',
      opts: hs.map((h, i) => ({ label: `<div class="tower">${range(1, h).map(j => `<i style="background:${COLORS[i]};--i:${h - j}"></i>`).join('')}</div>`, ok: h === t })) };
  } },
  nang: { name: 'Nặng - Nhẹ', icon: '🏋️', make() {
    const P = [['🐘', '🐭'], ['🍉', '🍒'], ['🚚', '🚲'], ['🐻', '🐦'], ['🎃', '🍓'], ['🐄', '🐔'], ['🪨', '🪶'], ['🦛', '🐸'], ['🏠', '⚽']];
    const [h, l] = pick(P), heavy = Math.random() < .5;
    return { q: heavy ? 'Vật nào NẶNG hơn?' : 'Vật nào NHẸ hơn?', v: heavy ? 'nang' : 'nhe',
      opts: shuffle([{ label: h, ok: heavy }, { label: l, ok: !heavy }]) };
  } },

  // ───── Hình khối ─────
  hinh: { name: 'Gọi tên hình', icon: '🔷', make(L) {
    const ts = distinct(NK(L) + (L >= 30 ? 1 : 0), 0, 5), t = pick(ts);
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
      opts: shuffle(cand.slice(0, NK(L))) };
  } },
  vathinh: { name: 'Đồ vật hình gì', icon: '⚽', make(L) {
    const M = [['⚽', '🍪', '🕐', '🌕', '🍩', '🏀', '🪙'], ['🎁', '🧊', '🎲'], ['🍕', '⛺', '📐', '🔺'], ['📱', '🚪', '📏', '🍫', '📺']];
    const t = R(4), obj = pick(M[t]), ts = shuffle([t, ...shuffle([0, 1, 2, 3].filter(x => x !== t)).slice(0, NK(L) - 1)]);
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
    const g = pick(G), s = pick(g), os = shuffle([s, ...shuffle(g.filter(x => x !== s)).slice(0, NK(L) - 1)]);
    return { q: 'Bé tìm hình giống hệt hình mẫu nhé!', v: 'giong', html: `<div class="sample big">${s}</div>`, opts: os.map(x => ({ label: x, ok: x === s })) };
  } },
  thieu: { name: 'Hình bị mất', icon: '🧩', make(L) {
    const k = Math.min(3 + Math.floor(L / 10), 7), items = shuffle(ALL).slice(0, k), miss = pick(items);
    const bottom = items.filter(x => x !== miss), shown = L >= 25 ? shuffle(bottom) : bottom;
    const os = shuffle([miss, ...shuffle(bottom).slice(0, NK(L) - 1)]);
    return { q: 'Bức tranh dưới bị mất một hình. Hình nào bị mất?', v: 'thieu',
      html: `<div class="frame">${items.join(' ')}</div><div class="frame">${shown.join(' ')}</div>`, opts: os.map(x => ({ label: x, ok: x === miss })) };
  } },

  // ───── Suy luận ─────
  quyluat: { name: 'Quy luật', icon: '🔁', make(L) {
    const pats = [[0, 1]]; if (L >= 10) pats.push([0, 0, 1], [0, 1, 1]); if (L >= 25) pats.push([0, 1, 2]); if (L >= 40) pats.push([0, 0, 1, 1], [0, 1, 2, 1]);
    const t = pick(pats), p = shuffle(ALL).slice(0, 3), len = t.length * 2 + (L >= 20 ? R(t.length) + 1 : 1);
    const seq = range(0, len - 1).map(i => p[t[i % t.length]]), hole = L < 30 ? len - 1 : R(len), ans = seq[hole];
    const os = shuffle([...new Set([ans, ...shuffle(p.slice(0, Math.max(...t) + 1)), pick(ALL)])].filter((x, i, a) => a.indexOf(x) === i)).slice(0, NK(L));
    if (!os.includes(ans)) os[0] = ans;
    return { q: 'Hình còn thiếu là hình gì?', v: 'quyluat',
      html: `<div class="seq em">${seq.map((x, i) => `<b class="${i === hole ? 'hole' : ''}">${i === hole ? '?' : x}</b>`).join('')}</div>`,
      opts: shuffle(os).map(x => ({ label: x, ok: x === ans })) };
  } },
  an: { name: 'Con gì ăn gì', icon: '🥕', make(L) {
    const ps = shuffle(FOODS).slice(0, NK(L)), t = pick(ps);
    return { q: 'Bạn này thích ăn gì nhỉ?', v: 'an', html: `<div class="big">${t[0]}</div>`, opts: shuffle(ps).map(p => ({ label: p[1], ok: p === t })) };
  } },
  odau: { name: 'Con gì sống ở đâu', icon: '🏡', make(L) {
    const ps = shuffle(HOMES).slice(0, NK(L)), t = pick(ps);
    return { q: 'Bạn này sống ở đâu nhỉ?', v: 'odau', html: `<div class="big">${t[0]}</div>`, opts: shuffle(ps).map(p => ({ label: p[1], ok: p === t })) };
  } },
  nguoc: { name: 'Trái ngược', icon: '🔄', make(L) {
    const P = [['☀️', '🌙'], ['🔥', '❄️'], ['😀', '😢'], ['👶', '👴'], ['🐘', '🐭'], ['⬆️', '⬇️'], ['🐢', '🐇'], ['🌕', '🌑']];
    const ps = shuffle(P).slice(0, NK(L)), t = pick(ps), flip = Math.random() < .5;
    const show = flip ? t[1] : t[0], ans = flip ? t[0] : t[1];
    const os = shuffle([ans, ...ps.filter(p => p !== t).map(p => pick(p))]);
    return { q: 'Bé tìm hình trái ngược với hình này nhé!', v: 'nguoc', html: `<div class="big">${show}</div>`, opts: os.map(x => ({ label: x, ok: x === ans })) };
  } },
  nghe: { name: 'Nghề nghiệp', icon: '👮', make(L) {
    const P = [['👨‍🚒', '🚒'], ['👮', '🚓'], ['🧑‍⚕️', '🚑'], ['🧑‍🍳', '🍳'], ['🧑‍🌾', '🚜'], ['🧑‍✈️', '✈️'], ['🧑‍🏫', '📚'], ['🧑‍🎨', '🎨']];
    const ps = shuffle(P).slice(0, NK(L)), t = pick(ps);
    return { q: 'Cô chú này cần dùng đồ vật gì?', v: 'nghe', html: `<div class="big">${t[0]}</div>`, opts: shuffle(ps).map(p => ({ label: p[1], ok: p === t })) };
  } },
};

// ───── Câu chuyện có nhân vật (nhân vật vui khi bé đúng, gãi đầu khi bé sai) ─────
const STORY_ADD = [['🐰', '🥕', 'tho_them', 'Thỏ con có {a} củ cà rốt, mẹ cho thêm {b} củ. Thỏ có tất cả mấy củ?'],
  ['🐻', '🍯', 'gau_them', 'Gấu có {a} hũ mật, bạn tặng thêm {b} hũ. Gấu có tất cả mấy hũ?'],
  ['🐔', '🐥', 'ga_them', 'Gà mẹ có {a} gà con, thêm {b} chú chạy tới. Có tất cả mấy gà con?']];
const STORY_SUB = [['🐱', '🐟', 'meo_bot', 'Mèo có {a} con cá, mèo ăn mất {b} con. Mèo còn lại mấy con cá?'],
  ['🐵', '🍌', 'khi_bot', 'Khỉ có {a} quả chuối, khỉ cho bạn {b} quả. Khỉ còn lại mấy quả?'],
  ['👧', '🎈', 'bong_bot', 'Bé có {a} quả bóng bay, bay mất {b} quả. Bé còn lại mấy quả?']];
const fill = (t, a, b) => t.replace('{a}', a).replace('{b}', b);

// Phân loại: mỗi nhóm có "ngôi nhà" riêng
const SORTS = [{ name: 'Trái cây', icon: '🧺', items: FRUITS }, { name: 'Con vật', icon: '🏡', items: ANIMALS },
  { name: 'Xe cộ', icon: '🚦', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢', '🚑', '🚜'] }, { name: 'Đồ chơi', icon: '🎁', items: ['⚽', '🧸', '🪀', '🎈', '🪁', '🎲'] },
  { name: 'Rau củ', icon: '🥗', items: ['🥕', '🥦', '🌽', '🍆', '🥔', '🧅'] }, { name: 'Quần áo', icon: '👚', items: ['👕', '👗', '👖', '🧦', '🧢', '👟'] }];

// Tranh tô màu theo số (mỗi chữ số là một màu)
const ARTS = [
  { name: 'Trái tim', g: ['1111111', '1221221', '2222222', '2222222', '1222221', '1122211', '1112111'], c: { 1: '#d9f0ff', 2: '#ff5c9a' } },
  { name: 'Cây xanh', g: ['1122211', '1222221', '2222222', '1222221', '1113111', '1113111', '4444444'], c: { 1: '#d9f0ff', 2: '#5cc85c', 3: '#a0522d', 4: '#9be27a' } },
  { name: 'Ngôi nhà', g: ['1112111', '1122211', '1222221', '2222222', '1333331', '1343331', '1343331'], c: { 1: '#d9f0ff', 2: '#ff7a59', 3: '#ffd36e', 4: '#8b5a2b' } },
  { name: 'Bông hoa', g: ['1112111', '1123211', '1222221', '1123211', '1114111', '1144411', '1114111'], c: { 1: '#fff3c4', 2: '#ff6fa8', 3: '#ffc83d', 4: '#5cc85c' } },
  { name: 'Cây nấm', g: ['1122211', '1232321', '2222222', '1144411', '1144411', '1144411', '5555555'], c: { 1: '#e8f6ff', 2: '#e5484d', 3: '#ffffff', 4: '#f5deb3', 5: '#9be27a' } },
  { name: 'Ông mặt trời', g: ['2112112', '1122211', '1222221', '2222222', '1222221', '1122211', '2112112'], c: { 1: '#bfe9ff', 2: '#ffc83d' } },
];

Object.assign(GAMES, {
  // Đếm nhanh: hình hiện ra rồi biến mất
  nhanhmat: { name: 'Nhanh mắt', icon: '⚡', make(L) {
    const n = 1 + R(MX(L)), e = pick(ALL);
    return { q: 'Nhìn thật nhanh! Có bao nhiêu hình?', v: 'nhanhmat', html: rows(e, n), flash: L < 15 ? 3000 : L < 35 ? 2200 : 1500, opts: numOpts(n, L, 1) };
  } },
  chuyencong: { name: 'Chuyện thêm', icon: '📖', make(L) {
    const [ch, it, v, t] = pick(STORY_ADD), n = 2 + R(MX(L) - 1), a = 1 + R(n - 1), b = n - a;
    return { q: fill(t, a, b), v, html: `<div class="story"><span class="char">${ch}</span><div class="box">${rows(it, a, 'sm')}</div><span class="sign">➕</span><div class="box flyin">${rows(it, b, 'sm')}</div></div>`, opts: numOpts(n, L, 1) };
  } },
  chuyentru: { name: 'Chuyện bớt', icon: '📕', make(L) {
    const [ch, it, v, t] = pick(STORY_SUB), n = 2 + R(MX(L) - 1), b = 1 + R(n - 1);
    return { q: fill(t, n, b), v, html: `<div class="story"><span class="char">${ch}</span><div class="box">${rows([...Array(n - b).fill(it), ...Array(b).fill(`<s class="gach">${it}</s>`)], 0, 'sm')}</div></div>`, opts: numOpts(n - b, L, 0) };
  } },
  // Kéo thả
  keoqua: { name: 'Kéo quả vào giỏ', icon: '🧺', special: 1, make(L) {
    const n = 1 + R(MX(L));
    return { kind: 'dragcount', q: 'Kéo vào giỏ đúng ' + n + ' quả rồi bấm Xong nhé!', v: 'keoqua', n, piece: pick(FRUITS), total: Math.min(n + 1 + R(3), 12) };
  } },
  choan: { name: 'Cho thú ăn', icon: '🍽️', special: 1, make(L) {
    const ps = shuffle(FOODS).slice(0, L < 15 ? 2 : L < 35 ? 3 : 4);
    return { kind: 'dragmatch', q: 'Bé kéo thức ăn đến cho các bạn nhé!', v: 'choan', zones: ps.map(p => p[0]), pieces: shuffle(ps.map((p, i) => ({ to: i, label: p[1] }))) };
  } },
  venha: { name: 'Đưa bạn về nhà', icon: '🏠', special: 1, make(L) {
    const ps = shuffle(HOMES).slice(0, L < 15 ? 2 : L < 35 ? 3 : 4);
    return { kind: 'dragmatch', q: 'Bé kéo các bạn về đúng nhà nhé!', v: 'venha', zones: ps.map(p => p[1]), pieces: shuffle(ps.map((p, i) => ({ to: i, label: p[0] }))) };
  } },
  phanloai: { name: 'Phân loại', icon: '🗂️', special: 1, make(L) {
    const gs = shuffle(L < 25 ? SORTS.slice(0, 4) : SORTS).slice(0, L < 35 ? 2 : 3), per = L < 20 ? 2 : 3;
    return { kind: 'dragmatch', q: 'Bé kéo mỗi đồ vật vào đúng nhóm nhé!', v: 'phanloai', zones: gs.map(g => `${g.icon}<small>${g.name}</small>`),
      pieces: shuffle(gs.flatMap((g, i) => shuffle(g.items).slice(0, per).map(x => ({ to: i, label: x })))) };
  } },
  // Lật thẻ trí nhớ
  latthe: { name: 'Lật thẻ', icon: '🃏', special: 1, make(L) {
    const p = L < 15 ? 3 : L < 35 ? 4 : 6, es = shuffle(ALL).slice(0, p);
    return { kind: 'memory', q: 'Bé lật tìm hai thẻ giống nhau nhé!', v: 'latthe', cols: p === 3 ? 3 : 4, cards: shuffle(es.flatMap(x => [{ k: x, label: x }, { k: x, label: x }])) };
  } },
  latso: { name: 'Lật thẻ số', icon: '🎴', special: 1, make(L) {
    const p = L < 15 ? 3 : L < 35 ? 4 : 5, vs = distinct(p, 1, MX(L)), e = pick(ALL);
    return { kind: 'memory', q: 'Bé lật tìm thẻ số và thẻ hình bằng nhau nhé!', v: 'latso', cols: p === 3 ? 3 : p === 4 ? 4 : 5,
      cards: shuffle(vs.flatMap(v => [{ k: v, label: `<b class="num">${v}</b>` }, { k: v, label: rows(e, v, 'xs') }])) };
  } },
  // Mê cung số: đi 1 → 2 → 3… tới nhà
  mecung: { name: 'Mê cung số', icon: '🌀', special: 1, make(L) {
    const size = L < 20 ? 4 : 5, N = Math.min(10, 4 + Math.floor(L / 8));
    let path = null;
    for (let t = 0; t < 300 && !path; t++) {
      const p = [[R(size), R(size)]], seen = new Set([p[0] + '']);
      while (p.length < N) {
        const [r, c] = p[p.length - 1];
        const nb = shuffle([[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < size && b < size && !seen.has(a + ',' + b));
        if (!nb.length) break; p.push(nb[0]); seen.add(nb[0] + '');
      }
      if (p.length === N) path = p;
    }
    const cells = Array.from({ length: size * size }, () => ({ v: null, path: -1 }));
    path.forEach(([r, c], i) => { cells[r * size + c] = { v: i + 1, path: i }; });
    // Ô phụ: không được tạo ra lối đi sai (không đặt số "kế tiếp" cạnh đường đi)
    cells.forEach((cell, idx) => {
      if (cell.path >= 0) return;
      const r = Math.floor(idx / size), c = idx % size, bad = new Set();
      [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].forEach(([a, b]) => { if (a >= 0 && b >= 0 && a < size && b < size) { const n = cells[a * size + b]; if (n.path >= 0) bad.add(n.v + 1); } });
      const ok = range(1, N).filter(x => !bad.has(x)); cell.v = ok.length && Math.random() < .8 ? pick(ok) : null;
    });
    return { kind: 'maze', q: 'Đi theo số 1, 2, 3… đưa bạn về nhà nhé!', v: 'mecung', size, N, cells, animal: pick(ANIMALS) };
  } },
  // Tô màu theo số
  tomau: { name: 'Tô màu theo số', icon: '🖍️', special: 1, make(L) {
    const pool = L < 15 ? ARTS.filter(a => Object.keys(a.c).length <= 3) : ARTS;
    return { kind: 'paint', q: 'Chọn màu theo số rồi tô vào ô có số đó nhé!', v: 'tomau', art: pick(pool) };
  } },
  // Cửa hàng nhỏ: trả đúng số xu
  cuahang: { name: 'Cửa hàng nhỏ', icon: '🛒', special: 1, make(L) {
    const n = 2 + R(MX(L) - 1), item = pick(['🧸', '🍭', '🎈', '🍦', '🚗', '📚', '🪀', '🍩', '🧃', '🪁']);
    const coins = L < 20 ? Array(Math.min(n + 2 + R(3), 12)).fill(1) : L < 35 ? [...Array(4).fill(1), ...Array(4).fill(2)] : [1, 1, 1, 2, 2, 2, 5, 5];
    return { kind: 'shop', q: 'Món đồ giá ' + n + ' xu. Bé trả đúng ' + n + ' xu nhé!', v: 'cuahang', n, item, coins: shuffle(coins) };
  } },
});

const CATS = [
  { name: 'Số và Đếm', icon: '🔢', color: '#ffe0ec', deco: '🎈', games: ['dem', 'nhieu', 'timnhom', 'sothieu', 'solon', 'nhanhmat', 'keoqua', 'latso', 'mecung'], v: 'cat0' },
  { name: 'Gộp và Tách', icon: '🧮', color: '#fbdcf0', deco: '🍎', games: ['gop', 'bot', 'tach', 'domino', 'chimden', 'baydi', 'chuyencong', 'chuyentru', 'cuahang'], v: 'cat5' },
  { name: 'So sánh', icon: '📏', color: '#f3e0ff', deco: '🐘', games: ['dai', 'to', 'cao', 'nang'], v: 'cat1' },
  { name: 'Hình khối', icon: '🔷', color: '#ffd9e6', deco: '⭐', games: ['hinh', 'demhinh', 'giong', 'vathinh', 'tomau'], v: 'cat2' },
  { name: 'Quan sát', icon: '👀', color: '#ffe6f2', deco: '🔍', games: ['diemkhac', 'khac', 'timdoi', 'thieu', 'latthe', 'phanloai'], v: 'cat3' },
  { name: 'Suy luận', icon: '🧩', color: '#ecdcff', deco: '💡', games: ['quyluat', 'an', 'odau', 'nguoc', 'nghe', 'choan', 'venha'], v: 'cat4' },
];
const CAT_OF = {}; CATS.forEach((c, i) => c.games.forEach(g => { CAT_OF[g] = i; }));

// 10 hòn đảo chinh phục — câu hỏi trộn mọi chủ đề, khó dần; câu cuối là trùm, thắng thì giải cứu một bạn
const ISLANDS = [
  ['Đảo Dừa', '🏝️', '🐚', '🦀', 'Cua Khổng Lồ', '🐢'], ['Đảo Dâu Tây', '🍓', '🍬', '🐙', 'Bạch Tuộc Tím', '🐠'], ['Đảo Cá Heo', '🐬', '🦪', '🦈', 'Cá Mập Răng Sún', '🐳'],
  ['Đảo Kẹo Ngọt', '🍭', '🧁', '👾', 'Quái Vật Kẹo', '🐰'], ['Đảo Núi Lửa', '🌋', '💎', '🐲', 'Rồng Lửa', '🐥'], ['Đảo Cầu Vồng', '🌈', '🦄', '👻', 'Ma Mây', '🦄'],
  ['Đảo Băng Tuyết', '❄️', '⛄', '🦣', 'Voi Ma Mút', '🐧'], ['Đảo Hoa', '🌸', '🦋', '🐝', 'Ong Chúa', '🦋'], ['Đảo Lâu Đài', '🏰', '🗝️', '🧌', 'Yêu Tinh', '🐱'], ['Đảo Vương Miện', '👑', '🏆', '🦖', 'Khủng Long', '🦁'],
].map(([name, icon, prize, boss, bossName, friend], i) => ({ name, icon, prize, boss, bossName, friend, L: 3 + i * 5 }));

// Thẻ sưu tầm con vật
const STICKERS = [['🐶', 'Cún con'], ['🐱', 'Mèo'], ['🐭', 'Chuột'], ['🐹', 'Hamster'], ['🐰', 'Thỏ'], ['🦊', 'Cáo'], ['🐻', 'Gấu'], ['🐼', 'Gấu trúc'],
  ['🐨', 'Gấu túi'], ['🐯', 'Hổ'], ['🦁', 'Sư tử'], ['🐮', 'Bò'], ['🐷', 'Heo'], ['🐸', 'Ếch'], ['🐵', 'Khỉ'], ['🐔', 'Gà'], ['🐧', 'Cánh cụt'], ['🐦', 'Chim'],
  ['🐤', 'Gà con'], ['🦆', 'Vịt'], ['🦉', 'Cú'], ['🦄', 'Kỳ lân'], ['🐝', 'Ong'], ['🐛', 'Sâu'], ['🦋', 'Bướm'], ['🐌', 'Ốc sên'], ['🐞', 'Bọ rùa'], ['🐢', 'Rùa'],
  ['🐍', 'Rắn'], ['🦖', 'Khủng long'], ['🐙', 'Bạch tuộc'], ['🦑', 'Mực'], ['🦀', 'Cua'], ['🐠', 'Cá vàng'], ['🐬', 'Cá heo'], ['🐳', 'Cá voi'], ['🦈', 'Cá mập'],
  ['🐊', 'Cá sấu'], ['🦓', 'Ngựa vằn'], ['🦒', 'Hươu cao cổ'], ['🐘', 'Voi'], ['🦛', 'Hà mã'], ['🐪', 'Lạc đà'], ['🦘', 'Chuột túi'], ['🦩', 'Hồng hạc'], ['🦚', 'Công'],
  ['🦜', 'Vẹt'], ['🐿️', 'Sóc']];

// Cửa hàng của bạn Cú (trả bằng xu 🪙 kiếm được khi học)
const SHOP = {
  hat: [['no', '🎀', 'Nơ hồng', 8], ['hoa', '🌸', 'Cài hoa', 8], ['luoi', '🧢', 'Mũ lưỡi trai', 10], ['kinh', '🕶️', 'Kính râm', 12], ['aothuat', '🎩', 'Mũ ảo thuật', 15], ['tn', '🎓', 'Mũ tốt nghiệp', 20], ['vm', '👑', 'Vương miện', 30]],
  decor: [['bong', '⚽', 'Quả bóng', 5], ['dieu', '🪁', 'Con diều', 8], ['cay', '🪴', 'Chậu cây', 8], ['gau', '🧸', 'Gấu bông', 10], ['tranh', '🖼️', 'Bức tranh', 10], ['giuong', '🛏️', 'Giường ngủ', 15],
    ['cauvong', '🌈', 'Cầu vồng', 15], ['beca', '🐠', 'Bể cá', 18], ['tau', '🚂', 'Tàu hoả', 20], ['ngua', '🎠', 'Ngựa gỗ', 20], ['dan', '🎹', 'Đàn piano', 25], ['laudai', '🏰', 'Lâu đài', 30]],
  food: [['banh', '🍪', 'Bánh quy', 2], ['dau', '🍓', 'Dâu tây', 2], ['kem', '🧁', 'Bánh kem', 3]],
};
