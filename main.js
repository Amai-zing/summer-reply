/* サマーリプライ 特設サイトの動き
   ・config.js の設定をページに入れる  ・上のバー  ・登場人物のタブと表情  ・画像を大きく見る  ・会話の例の動き */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const SITE = window.SITE || {};
  // 編集モード：このパソコンの開発用サーバーで、URL に ?edit を付けて開いたときだけ（公開したサイトでは動かない）
  const editing = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('edit');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || editing;

  /* ---------- 設定を入れる（空の項目は出さない） ---------- */
  const show = (sel, fn) => $$(sel).forEach(el => { el.hidden = false; fn && fn(el); });
  if (SITE.downloadUrl) {
    $$('.js-dl').forEach(a => {
      a.href = SITE.downloadUrl;
      a.removeAttribute('aria-disabled');
      a.querySelector('span').textContent = '無料ダウンロード';
    });
  } else {
    $$('.js-dl').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  }
  if (SITE.release) {
    show('.js-release', el => (el.textContent = '公開日：' + SITE.release));
    show('.js-release-hero', el => (el.textContent = '・ ' + SITE.release + ' 公開'));
  }
  if (SITE.author) {
    show('.js-author-row');
    $$('.js-author, .js-author-copy').forEach(el => (el.textContent = SITE.author));
  }
  if (SITE.x) show('.js-x', li => (li.querySelector('a').href = SITE.x));
  if (SITE.note) show('.js-note', li => (li.querySelector('a').href = SITE.note));
  if (SITE.contact) {
    const c = SITE.contact;
    show('.js-contact', li => (li.querySelector('a').href = /^https?:/.test(c) ? c : 'mailto:' + c));
  }
  if (SITE.endingMusic) $$('.js-ending-music').forEach(el => (el.textContent = '／エンディングの曲：' + SITE.endingMusic));

  /* ---------- トップの3人：絵の読みこみがすんだら、順番に出す（CSS の is-ready） ---------- */
  const heroChara = $('#heroChara');
  if (heroChara) {
    const show = () => heroChara.classList.add('is-ready');
    Promise.all($$('img', heroChara).map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}))).then(show);
    setTimeout(show, 3000); // 読みこみが遅いときも、3秒で出しはじめる
  }

  /* ---------- トップの光の粒（右側＝3人のまわりに多め） ---------- */
  const sparkles = $('.hero-sparkles');
  if (sparkles && !calm) {
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('i');
      const r = Math.random;
      s.style.left = (32 + r() * 66).toFixed(1) + '%';
      s.style.top = (6 + r() * 80).toFixed(1) + '%';
      s.style.setProperty('--s', (3 + r() * 6).toFixed(1) + 'px');
      s.style.setProperty('--d', (4 + r() * 5).toFixed(1) + 's');
      s.style.setProperty('--dl', (-r() * 8).toFixed(1) + 's');
      sparkles.appendChild(s);
    }
  }

  /* ---------- いちばん奥の背景：いま画面のまん中にいちばん近い見出しの帯の絵にする ---------- */
  // 帯と帯のあいだ（帯が見えていない所）で入れかわるので、帯の中で絵が切りかわるのは見えない
  const scenes = $$('.scene');
  const bands = $$('.band');
  addEventListener('load', () => scenes.forEach(s => { s.style.backgroundImage = `url(${s.dataset.bg})`; }));
  let sceneNow = 0, sceneTick = false;
  const pickScene = () => {
    sceneTick = false;
    const mid = innerHeight / 2;
    let best = null, dist = Infinity;
    for (const b of bands) {
      const r = b.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < dist) { dist = d; best = b; }
    }
    const n = best ? +best.dataset.scene : 0;
    if (n !== sceneNow && scenes[n]) {
      scenes[sceneNow].classList.remove('is-on');
      scenes[n].classList.add('is-on');
      sceneNow = n;
    }
  };
  addEventListener('scroll', () => { if (!sceneTick) { sceneTick = true; requestAnimationFrame(pickScene); } }, { passive: true });
  pickScene();

  /* ---------- 上のバー：トップを過ぎたら紙の色に ---------- */
  const bar = $('#bar');
  const onScroll = () => bar.classList.toggle('is-solid', scrollY > innerHeight * 0.5);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 登場人物のタブ ---------- */
  const tabs = $$('[role="tab"]');
  const select = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length];
      select(n); n.focus();
    });
  });

  /* ---------- 表情を変える ---------- */
  $$('.faces').forEach(box => {
    const img = box.parentElement.querySelector('.cp-img');
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      $$('button', box).forEach(x => x.setAttribute('aria-pressed', x === b));
      img.src = b.dataset.face;
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    });
  });
  // 表情の絵を先に読んでおく（切り替えたときにちらつかないように）
  addEventListener('load', () => $$('.faces button').forEach(b => { new Image().src = b.dataset.face; }));

  /* ---------- 画像を大きく見る ---------- */
  const lb = $('#lb');
  const shots = $$('.shot');
  let cur = 0;
  const open = i => {
    cur = (i + shots.length) % shots.length;
    const s = shots[cur];
    $('img', lb).src = s.dataset.full;
    $('img', lb).alt = s.querySelector('img').alt;
    $('figcaption', lb).textContent = s.dataset.cap || '';
    if (!lb.open) lb.showModal();
  };
  shots.forEach((s, i) => s.addEventListener('click', () => open(i)));
  $('.lb-prev', lb).addEventListener('click', () => open(cur - 1));
  $('.lb-next', lb).addEventListener('click', () => open(cur + 1));
  $('.lb-close', lb).addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') open(cur - 1);
    if (e.key === 'ArrowRight') open(cur + 1);
  });

  /* ---------- 会話の例：入力欄に書いて送る → ヒロインが返す ---------- */
  const demo = $('#talkDemo');
  const lines = $$('.td-log li', demo);
  const typing = $('.td-typing', demo);
  const input = $('.td-input', demo);
  const showLine = li => { li.textContent = li.dataset.line; li.classList.add('is-on'); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const play = async () => {
    for (const li of lines) {
      if (li.classList.contains('td-me')) {
        for (const ch of li.dataset.line) { typing.textContent += ch; await wait(70); }
        await wait(350);
        input.classList.add('is-send');
        await wait(250);
        input.classList.remove('is-send');
        typing.textContent = '';
        showLine(li);
      } else {
        await wait(700);
        showLine(li);
        await wait(900);
      }
    }
  };
  if (calm || !('IntersectionObserver' in window)) {
    lines.forEach(showLine);
  } else {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); play(); }
    }, { threshold: 0.4 });
    io.observe(demo);
  }

  /* ---------- 見えたら動く所（data-reveal に is-in を付ける。ハンコ・AI の所） ---------- */
  const reveals = $$('[data-reveal]');
  if (calm || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else {
    const ro = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
    }), { threshold: 0.35 });
    reveals.forEach(el => ro.observe(el));
  }

  /* ---------- 編集モード（tools/site-edit.js を読む） ---------- */
  if (editing) {
    const s = document.createElement('script');
    s.src = '/tools/site-edit.js';
    document.body.appendChild(s);
  }
})();
