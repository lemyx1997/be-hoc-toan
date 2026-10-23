// Nhạc nền tự chơi bằng "đàn ảo" của trình duyệt — không cần file nhạc, không cần mạng.
// Các bản cổ điển (Beethoven, Brahms, dân ca) đều đã hết bản quyền.
(function () {
  let ctx = null, master = null, reverb = null, timer = null, current = null, volume = 0.5;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0;
      // Tiếng vang nhẹ cho âm thanh êm, tròn.
      reverb = ctx.createConvolver();
      const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      reverb.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.35;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
      master.connect(lp); lp.connect(ctx.destination); lp.connect(reverb); reverb.connect(wet); wet.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(n) {
    const m = /^([A-G][#b]?)(\d)$/.exec(n);
    return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
  }

  // Các "nhạc cụ" mềm mại
  function play(note, t, dur, inst = 'piano', vel = 1) {
    const f = typeof note === 'number' ? note : freq(note);
    const g = ctx.createGain(); g.connect(master);
    const oscs = [];
    const add = (type, mult, amp) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = f * mult; og.gain.value = amp;
      o.connect(og).connect(g); oscs.push(o);
    };
    let a = 0.01, rel = Math.min(1.6, dur * 1.2), peak = 0.22 * vel;
    if (inst === 'piano') { add('triangle', 1, 1); add('sine', 2, 0.25); add('sine', 3, 0.06); }
    else if (inst === 'box') { add('sine', 1, 1); add('sine', 4, 0.18); add('sine', 2.01, 0.1); rel = 1.4; peak = 0.18 * vel; }
    else if (inst === 'pad') { add('sine', 1, 1); add('triangle', 1.003, 0.4); add('sine', 0.5, 0.3); a = dur * 0.4; rel = dur * 0.8; peak = 0.09 * vel; }
    else if (inst === 'bass') { add('sine', 1, 1); add('triangle', 2, 0.15); peak = 0.2 * vel; }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (inst === 'pad') g.gain.setValueAtTime(peak, t + dur);
    else g.gain.exponentialRampToValueAtTime(peak * 0.35, t + Math.max(a + 0.02, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
    oscs.forEach(o => { o.start(t); o.stop(t + dur + rel + 0.05); });
  }

  // Ghép nốt theo thứ tự: "E5 1, D#5 1, r 2" -> [{n, at, d}]
  function seq(str, unit) {
    let at = 0; const out = [];
    for (const part of str.split(',')) {
      const [n, len] = part.trim().split(/\s+/); if (!n) continue;
      const d = parseFloat(len) * unit;
      if (n !== 'r') out.push({ n, at, d });
      at += d;
    }
    return { notes: out, length: at };
  }
  // Một bản nhạc có nhiều bè; lặp lại mãi.
  function song(unit, voices, gap = 1.2) {
    const parts = voices.map(([str, inst, vel]) => ({ ...seq(str, unit), inst, vel }));
    const length = Math.max(...parts.map(p => p.length)) + gap;
    return { length, events: parts.flatMap(p => p.notes.map(x => ({ ...x, inst: p.inst, vel: p.vel }))) };
  }

  // ---------- Kho nhạc ----------
  const FUR_ELISE = song(0.19, [
    ['E5 1,D#5 1,E5 1,D#5 1,E5 1,B4 1,D5 1,C5 1,A4 3,C4 1,E4 1,A4 1,B4 3,E4 1,G#4 1,B4 1,C5 3,E4 1,' +
     'E5 1,D#5 1,E5 1,D#5 1,E5 1,B4 1,D5 1,C5 1,A4 3,C4 1,E4 1,A4 1,B4 3,E4 1,C5 1,B4 1,A4 6', 'piano', 1],
    ['r 8,A2 1,E3 1,A3 1,r 3,E2 1,E3 1,G#3 1,r 3,A2 1,E3 1,A3 1,r 9,A2 1,E3 1,A3 1,r 3,E2 1,E3 1,G#3 1,r 3,A2 1,E3 1,A3 4', 'piano', 0.6]
  ]);
  const ODE_TO_JOY = song(0.5, [
    ['E4 1,E4 1,F4 1,G4 1,G4 1,F4 1,E4 1,D4 1,C4 1,C4 1,D4 1,E4 1,E4 1.5,D4 .5,D4 2,' +
     'E4 1,E4 1,F4 1,G4 1,G4 1,F4 1,E4 1,D4 1,C4 1,C4 1,D4 1,E4 1,D4 1.5,C4 .5,C4 2,' +
     'D4 1,D4 1,E4 1,C4 1,D4 1,E4 .5,F4 .5,E4 1,C4 1,D4 1,E4 .5,F4 .5,E4 1,D4 1,C4 1,D4 1,G3 2,' +
     'E4 1,E4 1,F4 1,G4 1,G4 1,F4 1,E4 1,D4 1,C4 1,C4 1,D4 1,E4 1,D4 1.5,C4 .5,C4 2', 'piano', 1],
    ['C3 4,G2 4,C3 4,G2 4,C3 4,G2 4,C3 4,G2 2,C3 2,G2 4,C3 4,G2 4,C3 2,G2 2,C3 4,G2 4,C3 4,G2 2,C3 2', 'bass', 0.7]
  ]);
  const arp = (a, b, c, times) => Array(times).fill(`${a} 1,${b} 1,${c} 1`).join(',');
  const MOONLIGHT = song(0.24, [
    [[arp('G#3', 'C#4', 'E4', 8), arp('A3', 'C#4', 'E4', 2), arp('A3', 'D4', 'F#4', 2),
      arp('G#3', 'C4', 'F#4', 1), arp('G#3', 'C#4', 'E4', 1), arp('G#3', 'C#4', 'D#4', 1), arp('F#3', 'C4', 'D#4', 1),
      arp('E3', 'G#3', 'C#4', 4)].join(','), 'piano', 0.7],
    ['C#3 12,B2 12,A2 6,F#2 6,G#2 12,C#3 12', 'bass', 0.6]
  ], 0.6);
  const LULLABY = song(0.42, [
    ['E4 .5,E4 .5,G4 2,E4 .5,E4 .5,G4 2,E4 .5,G4 .5,C5 1,B4 1.5,A4 .5,A4 1,G4 1,D4 .5,E4 .5,F4 1,D4 1,D4 .5,E4 .5,F4 2,' +
     'D4 .5,F4 .5,B4 .5,A4 .5,G4 1,B4 1,C5 3,C4 .5,C4 .5,C5 2,A4 .5,F4 .5,G4 2,E4 .5,C4 .5,F4 1,G4 1,A4 1,G4 2,' +
     'C4 .5,C4 .5,C5 2,A4 .5,F4 .5,G4 2,E4 .5,C4 .5,F4 1,E4 1,D4 1,C4 3', 'box', 1],
    ['C3 3,C3 3,C3 3,G2 3,G2 3,G2 3,C3 3,F2 3,C3 3,C3 3,G2 3,C3 3', 'pad', 1]
  ], 1.5);
  const TWINKLE = song(0.42, [
    ['C4 1,C4 1,G4 1,G4 1,A4 1,A4 1,G4 2,F4 1,F4 1,E4 1,E4 1,D4 1,D4 1,C4 2,' +
     'G4 1,G4 1,F4 1,F4 1,E4 1,E4 1,D4 2,G4 1,G4 1,F4 1,F4 1,E4 1,E4 1,D4 2,' +
     'C4 1,C4 1,G4 1,G4 1,A4 1,A4 1,G4 2,F4 1,F4 1,E4 1,E4 1,D4 1,D4 1,C4 2', 'box', 1],
    ['C3 4,F2 2,C3 2,F2 2,C3 2,G2 2,C3 2,C3 2,G2 2,C3 2,G2 2,C3 2,G2 2,C3 2,G2 2,C3 4,F2 2,C3 2,F2 2,C3 2,G2 2,C3 2', 'pad', 1]
  ]);

  // Nhạc tự sáng tác ngẫu nhiên — không bao giờ lặp lại y hệt.
  function generative(kind) {
    const scale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
    const chords = kind === 'relax'
      ? [['C3', 'G3', 'E4', 'B4'], ['A2', 'E3', 'C4', 'G4'], ['F2', 'C3', 'A3', 'E4'], ['G2', 'D3', 'B3', 'D4']]
      : [['C3', 'G3', 'E4'], ['F3', 'C4', 'A4'], ['A2', 'E3', 'C4'], ['G2', 'D3', 'B3']];
    let idx = 4, bar = 0;
    return {
      length: kind === 'relax' ? 6.4 : 3.2,
      make() {
        const ev = [], ch = chords[bar++ % chords.length];
        if (kind === 'relax') {
          ch.forEach(n => ev.push({ n, at: 0, d: 5.6, inst: 'pad', vel: 1 }));
          for (let k = 0; k < 4; k++) if (Math.random() < 0.7) {
            idx = Math.max(0, Math.min(scale.length - 1, idx + Math.floor(Math.random() * 5) - 2));
            ev.push({ n: scale[idx], at: k * 1.6 + Math.random() * 0.3, d: 1.2, inst: 'box', vel: 0.6 });
          }
        } else {
          ev.push({ n: ch[0], at: 0, d: 1.5, inst: 'bass', vel: 0.6 });
          ch.slice(1).forEach(n => ev.push({ n, at: 0, d: 2.8, inst: 'pad', vel: 0.8 }));
          for (let k = 0; k < 8; k++) if (Math.random() < 0.8) {
            idx = Math.max(0, Math.min(scale.length - 1, idx + Math.floor(Math.random() * 5) - 2));
            ev.push({ n: scale[idx], at: k * 0.4, d: 0.35, inst: 'box', vel: 0.9 });
          }
        }
        return ev;
      }
    };
  }

  const TRACKS = [
    { id: 'sangtao', group: 'Sáng tạo', name: 'Hộp nhạc sáng tạo', ico: '🎠', src: () => generative('play') },
    { id: 'ngoisao', group: 'Sáng tạo', name: 'Lấp lánh ngôi sao', ico: '⭐', src: () => TWINKLE },
    { id: 'thugian', group: 'Thư giãn', name: 'Mây trôi thư giãn', ico: '☁️', src: () => generative('relax') },
    { id: 'ru', group: 'Thư giãn', name: 'Khúc ru (Brahms)', ico: '🌙', src: () => LULLABY },
    { id: 'elise', group: 'Beethoven', name: 'Für Elise', ico: '🎹', src: () => FUR_ELISE },
    { id: 'hoanca', group: 'Beethoven', name: 'Khúc hoan ca', ico: '🎉', src: () => ODE_TO_JOY },
    { id: 'anhtrang', group: 'Beethoven', name: 'Sonata Ánh trăng', ico: '🌕', src: () => MOONLIGHT }
  ];

  function start(id) {
    stop(true);
    const tr = TRACKS.find(t => t.id === id) || TRACKS[0];
    current = tr.id;
    getCtx();
    const src = tr.src();
    let next = ctx.currentTime + 0.3;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
    // Lên lịch trước từng đoạn nhạc để phát liền mạch.
    const tick = () => {
      while (next < ctx.currentTime + 1.5) {
        const events = src.make ? src.make() : src.events;
        for (const e of events) play(e.n, next + e.at, e.d, e.inst, e.vel);
        next += src.length;
      }
    };
    tick(); timer = setInterval(tick, 400);
  }
  function stop(quick) {
    clearInterval(timer); timer = null; current = null;
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + (quick ? 0.2 : 0.8));
    // Ngắt hẳn các nốt đã xếp lịch bằng cách thay đường ra mới.
    const old = master;
    setTimeout(() => { try { old.disconnect(); } catch {} }, quick ? 250 : 900);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(lp); lp.connect(ctx.destination); lp.connect(reverb);
  }
  function setVolume(v) {
    volume = v;
    if (ctx && current) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(v, ctx.currentTime, 0.1); }
  }

  window.NhacNen = { TRACKS, start, stop, setVolume, getCtx, playing: () => current };
})();
