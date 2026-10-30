// Inside the buildings: one level screen per building, each with its own centrepiece.
// renderRoom(name, {lv, next, door}) → HTML for #rin. Shared parts: level strip, title, achievement medal, actions, next level.
// Facts only from Ciko (see CLAUDE.md / the brief); no prices, no invented numbers.

const MAIL = 'mailto:rico.jonathan80@gmail.com', CV = `${MAIL}?subject=Your%20CV%2C%20please`, HELLO = `${MAIL}?subject=Let's%20work%20together`;
const ORDER = ['aureyu', 'automations', 'smartkartoffel', 'studio', 'home'];
// videos: [file, title, length, style, views (tile badge), extra (player), proof (the post itself)]
const TOMATINA = 'https://www.instagram.com/reel/DejHEwAN0no/';
const REELS = [['reel-tomatina-part1', 'Tomatina, Part 1', '1:24', 'AI animation', 'Most viewed', '+4K followers', TOMATINA],
  ['reel-google-vs-claude', 'Google or Claude?', '0:50', 'Motion graphic'], ['reel-aureyu-launch', 'Aureyu launch', '0:29', 'SaaS product'],
  ['reel-no-after-effects', 'No After Effects', '0:20', 'Motion graphic'], ['reel-viral-reel-finder', 'Laziest way to go viral', '0:40', 'Motion graphic']];
const STYLES = new Set(REELS.map((x) => x[3])).size;
const hit = (h) => (h ? `<span class="hit">${h.replace(' views', '')}</span>` : '');
const SOCIALS = [['https://www.tiktok.com/@cikojaja', 'TikTok', 'l-tt'], ['https://www.instagram.com/cikojaja', 'Instagram', 'l-ig'],
  ['https://www.youtube.com/@cikojaja', 'YouTube', 'l-yt'], ['https://www.linkedin.com/in/enrico-jonathan-liman-5b45851a0', 'LinkedIn', 'l-li'],
  ['https://github.com/cikojaja', 'GitHub', 'l-gh']];
const socials = () => SOCIALS.map(([u, n, l]) => `<a href="${u}" target="_blank" rel="noopener" aria-label="${n}"><svg aria-hidden="true"><use href="#${l}"/></svg></a>`).join('');

const ROOMS = {
  aureyu: {
    kind: 'inbox', name: 'Aureyu', type: 'My app for Windows + Mac', icon: 'aureyu-mark.svg', poster: 'poster-aureyu.jpg',
    tag: 'WhatsApp, Telegram and Signal <span class="nb">in <em>one</em> inbox.</span>',
    lede: 'It translates every chat live and suggests replies. Talk to anyone, in their language.',
    win: [50, '+', 'users in the first week'],
    medals: [['i-live', 'Live now'], ['logos:l-wa,l-tg,l-sg', '3 apps in 1'], ['claude', 'Built with Claude']],
    go: ['https://aureyu.com', 'Visit aureyu.com', 'i-ext'], alt: ['#trailer', 'Trailer', 'i-play', '0:29'],
    video: 'reel-aureyu-launch', len: '0:29',
    list: 'Unlocked features',
    feats: [['i-inbox', 'One inbox', 'WhatsApp, Telegram and Signal together.'], ['i-lang', 'Live translation', 'Every chat, in your language.'],
      ['i-reply', 'Reply ideas', 'It suggests what to answer.'], ['i-pc', 'Windows + Mac', 'Runs on your computer.']],
    // the demo: real lines from the Aureyu launch film
    msgs: [['C', 'Cindy Xu', 'l-wa', 'WhatsApp', '你好，请问我的包裹什么时候到？', 'Hi, when will my package arrive?'],
      ['M', 'Marco Rossi', 'l-tg', 'Telegram', 'Perfetto, a domani!', 'Perfect, see you tomorrow!'],
      ['A', 'Ayşe Demir', 'l-sg', 'Signal', 'Fiyat listesini gönderir misin?', 'Can you send the price list?']],
    reply: ['Sure, here is the price list.', 'Sends in Turkish: Tabii, işte fiyat listesi.'],
  },
  automations: {
    kind: 'film', name: 'Automations', type: 'My AI agent', icon: '#i-bot', poster: 'poster-robert.jpg',
    tag: 'My AI agent runs my <em>day</em>.',
    lede: 'It reads Claude news, reminds me, ships client changes, tracks my money and trains my German. All in Telegram.',
    win: [10, '', 'jobs, all in Telegram'],
    medals: [['i-bot', 'One AI agent'], ['logos:l-tg', 'Lives in Telegram'], ['claude', 'Built with Claude']],
    go: ['#trailer', 'Watch with sound', 'i-play'], alt: ['#feats', 'How it works', 'i-list'],
    video: 'reel-agent-day', len: '0:31', // the film is the centrepiece: one day, five jobs (made in code, _video/agent-day)
    list: 'How it works',
    feats: [['i-clock', '1 · Something happens', 'A time, a client message, or me.'], ['i-send', '2 · It lands in Telegram', 'One app for everything.'],
      ['i-bot', '3 · Agent + Claude work', 'They sort it, write it, fix it.'], ['i-ok', '4 · I tap once', 'Done. Push live. Start call.']],
  },
  smartkartoffel: {
    kind: 'fix', name: 'SmartKartoffel', type: 'AI app to learn German', icon: 'smartkartoffel-icon.png', poster: 'poster-smartkartoffel.jpg',
    tag: 'Type wrong, learn <em>right.</em>',
    lede: 'Write any German sentence. It fixes it and explains why. I built it with Claude, without coding experience.',
    win: [2, '', 'weeks to build, without coding experience'],
    medals: [['i-live', 'Live now'], ['i-clock', 'Built in 2 weeks'], ['claude', 'Built with Claude']],
    go: ['https://smartkartoffel.com', 'Visit smartkartoffel.com', 'i-ext'], alt: ['#feats', 'Features', 'i-list'],
    list: 'Unlocked features',
    feats: [['i-edit', 'Fix my German', 'Corrections with the reason why.'], ['i-book', 'Word deep dive', 'Article, plural, examples.'],
      ['i-camera', 'Photo to word', 'Point the camera, get the German word.'], ['i-mic', 'Voice input', 'Speak German, it corrects you.']],
  },
  studio: {
    kind: 'title', name: 'Video studio', type: 'Videos I make', icon: '#i-film', poster: 'reel-tomatina-part1.jpg',
    tag: 'AI animation, motion graphics, <em>product films.</em>',
    lede: 'I plan the video, Claude helps me write it as code, I check every cut. No After Effects.',
    win: ['700K', 'views in 1 day', 'Tomatina, Part 1 · +4K followers on Instagram'],
    go: ['#trailer', 'Play the trailer', 'i-play'], alt: ['#feats', 'All episodes', 'i-list'],
    video: 'reel-google-vs-claude', len: '0:50',
  },
  home: {
    kind: 'profile', name: 'My home', title: 'Enrico<br>Jonathan<br>Liman', type: 'AI Automation Builder', icon: 'avatar.jpg', poster: 'avatar.jpg',
    tag: 'I build AI that gives you <em>time</em> back.',
    lede: 'I turn slow, repeated work into AI helpers, apps and videos. My story is below.',
    go: [CV, 'Download CV', 'i-down'], alt: [HELLO, 'Email me', 'i-mail'],
    image: 'me.jpg',
    info: [['Hamburg', 'Germany, remote OK'], ['Open to', 'a full-time job or freelance projects'], ['3 languages', 'Indonesian, English, German'], ['I reply myself', 'usually within 24 h']], // player info, like the top of a CV
    cards: [['i-send', 'Ships fast', 'First version first. Then I make it better.'], ['i-food', 'Calm under pressure', 'Busy kitchen shifts: fast, clean, on time.'], // strengths, like on a CV (the job titles live on the ropes)
      ['i-film', 'Creative', 'My videos, my logo, this website. Made with Claude.'], ['i-book', 'Self-taught', 'No school for it: YouTube and Claude, every day.'],
      ['i-spark', 'Problem solver', 'I spot the step that wastes time and hand it to AI.'], ['i-team', 'Team player', 'I build tools my team uses every day.'],
      ['i-ok', 'Honest', 'Real numbers only. Everything here is real.'], ['i-search', 'Curious', 'I try new AI tools all the time.']],
    story: [['Bandung', 'Where I come from, in Indonesia.'], ['250 € and a ticket', 'I came to Germany in 2023 with just that.'],
      ['4 a.m. builder', 'Long chef shifts. I build before work, every day.'],
      ['First app live', 'SmartKartoffel, my German app. No coding background.'], ['Now', 'AI agents, apps and videos. 6 client builds so far.']],
  },
};

const icn = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const HEX = 'M48 6 89.6 30v48L48 102 6.4 78V30z';
const blank = (href) => (href.startsWith('http') ? ' target="_blank" rel="noopener"' : '');

const level = (lv) => `<div class="lvl rr" style="--i:0"><span>Level <b>${lv}</b> of 5</span><span class="pips" aria-hidden="true">${ORDER.map((_, i) => `<i class="${i + 1 === lv ? 'on' : ''}"></i>`).join('')}</span></div>`;
const badge = (r, cls = 'app') => (r.icon[0] === '#' ? `<span class="${cls} app-g">${icn(r.icon.slice(1))}</span>` : `<img class="${cls}" src="media/${r.icon}" alt="">`);
const ident = (r) => `<div class="id rr" style="--i:1">${badge(r)}<div><h2 id="r-title" style="--len:${(r.title || r.name).length}">${r.title || r.name}</h2><p class="type">${r.type}</p></div></div>`;
const words = (r, i = 2) => `<p class="tag rr" style="--i:${i}">${r.tag}</p><p class="lede rr" style="--i:${i + 1}">${r.lede}</p>`;

function medal([m, label], j) {
  const inner = m === 'claude' ? '<span class="mascot" data-cell="3.5"></span>'
    : m.startsWith('logos:') ? `<span class="logos${m.includes(',') ? '' : ' one'}">${m.slice(6).split(',').map((l) => `<svg aria-hidden="true"><use href="#${l}"/></svg>`).join('')}</span>` : icn(m);
  return `<li style="--j:${j}"><span class="hx"><svg viewBox="0 0 96 108" aria-hidden="true"><path class="hx-o" d="${HEX}"/></svg>${inner}</span><span>${label}</span></li>`;
}
const achievement = (r, i = 4) => `<div class="ach tick rr" style="--i:${i}">
  <div class="a-top"><span class="mb"><svg viewBox="0 0 96 108" aria-hidden="true"><path d="${HEX}" fill="url(#gMetal)" stroke="url(#gMetal)" stroke-width="6" stroke-linejoin="round"/>
    <path d="M48 15 81.8 34.5v39L48 93 14.2 73.5v-39z" fill="none" stroke="#3B2608" stroke-opacity=".3" stroke-width="1.5"/>
    <g clip-path="url(#cHex)"><rect class="sheen" x="-50" y="-10" width="28" height="128" fill="#fff" opacity=".5"/></g><use class="tro" href="#i-trophy" x="27" y="32" width="42" height="42"/></svg>
    <svg class="mring" viewBox="0 0 96 108" aria-hidden="true"><path d="${HEX}" fill="none" stroke="#C9923E" stroke-width="2"/></svg></span>
    <p class="a-t"><small>Achievement unlocked</small><b class="num" style="--n:${r.win[0]}" data-s="${r.win[1]}" aria-hidden="true"></b><span class="sr">${r.win[0]}${r.win[1]} </span><span>${r.win[2]}</span></p></div>
  ${r.medals ? `<ul class="medals">${r.medals.map(medal).join('')}</ul>` : ''}</div>`;

function actions(r, next, i = 5) {
  const a = (x, cls) => `<a class="rb ${cls}" href="${x[0]}"${blank(x[0])}>${x[2] && x[2] !== 'i-ext' ? icn(x[2]) : ''}${x[1]}${x[3] ? `<small>${x[3]}</small>` : ''}${x[2] === 'i-ext' ? icn('i-ext') : ''}</a>`;
  return `<div class="acts rr" style="--i:${i}">${a(r.go, 'b-gold')}${r.alt ? a(r.alt, 'b-dim ph-only') : ''}<button class="rb b-white dk-only" type="button" data-next>${next.title}${icn('i-arrow')}</button></div>`;
}
const trailer = (r) => `<button class="trailer" type="button" data-v="${r.video}" style="background-image:url(media/${r.video}.jpg)" aria-label="Play the trailer, ${r.len}"><span class="tlabel">Trailer</span><span class="tplay"><i>${icn('i-play')}</i>Watch the trailer<small>${r.len}</small></span></button>`;
const feats = (r) => `<div class="sh"><h3>${r.list}</h3><span>${r.feats.length} of ${r.feats.length}</span></div>
  <ul class="feats">${r.feats.map(([i, t, d], j) => `<li class="ft" style="--j:${j}">${icn(i)}${icn('i-ok', 'ic ok')}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>`;
const ending = (next, door) => `<button class="next" type="button" data-next><img src="media/${next.img}" alt=""><span class="nx"><small>${next.small}</small><b>${next.title}</b><span class="nd">${next.sub}</span></span>${icn('i-arrow')}</button>
  <button class="r-back" type="button" data-back>${door ? 'Back to island' : 'Back'}</button>`;

// ---- centrepieces
const inbox = (r) => `<div class="demo inbox" aria-label="Aureyu demo: chats from 3 apps, translated live">
  <div class="win"><div class="wbar"><img src="media/aureyu-mark.svg" alt="">Inbox<span class="srcs">${['l-wa', 'l-tg', 'l-sg'].map((l) => `<svg aria-hidden="true"><use href="#${l}"/></svg>`).join('')}</span><span class="tog">Translate<i></i></span></div>
  <ul class="msgs">${r.msgs.map(([a, who, l, app, og, tr], i) => `<li class="msg" style="--t:${(.7 + i * .55).toFixed(2)}s"><span class="av">${a}</span><div><p class="who">${who}<span class="appn"><svg aria-hidden="true"><use href="#${l}"/></svg>${app}</span></p>
    <p class="og">${og}</p><p class="tr">${icn('i-lang')}<span>${tr}</span></p></div></li>`).join('')}</ul>
  <div class="reply"><div><small>${icn('i-spark')}Reply idea</small><p class="ri">${r.reply[0]}</p><p class="rtx">${r.reply[1]}</p></div><span class="send">${icn('i-send')}</span></div></div></div>`;

const film = (r) => `<button class="trailer film" type="button" data-v="${r.video}" aria-label="Play with sound, ${r.len}"><video src="media/${r.video}.mp4" poster="media/${r.video}.jpg" muted loop playsinline autoplay></video>
  <span class="tplay"><i>${icn('i-play')}</i>Watch with sound<small>${r.len}</small></span></button>`;

// SmartKartoffel: the chat from smartkartoffel.com, a wrong sentence fixed, then a word explained
const DE = '<svg class="de" viewBox="0 0 5 3" aria-hidden="true"><path fill="#000" d="M0 0h5v1H0z"/><path fill="#D00" d="M0 1h5v1H0z"/><path fill="#FFCE00" d="M0 2h5v1H0z"/></svg>';
const fixer = () => `<div class="demo sk" aria-label="SmartKartoffel demo: a German sentence fixed, then a word explained">
  <div class="skw"><div class="skh"><img src="media/smartkartoffel-icon.png" alt=""><span>SmartKartoffel<small>Always here</small></span></div>
  <ul class="skb"><li class="u" style="--t:.6s">Ich bin gehe zum Supermarkt</li>
    <li class="a" style="--t:1.3s"><span class="chip">${icn('i-edit')}Fixed</span><p class="cor"><s>Ich bin gehe</s> → <b>Ich gehe</b></p>
      <p>${icn('i-ok')}“bin” + infinitive only in perfect tense. Here: simple present.</p><p class="say">${icn('i-mic')}Ich gehe zum Supermarkt.</p>
      <p class="sm">Other ways: “Ich fahre zum Supermarkt” / “Ich laufe zum Supermarkt”</p></li>
    <li class="u" style="--t:3.2s">Tired</li>
    <li class="a" style="--t:3.9s"><span class="chip">${DE}word</span><p class="say">${DE}müde <span>— tired, exhausted</span></p>
      <p>${icn('i-book')}Adjective, no article needed</p><p class="say">${icn('i-edit')}Ich bin heute so müde.</p>
      <p class="sm">I am so tired today. · Also: “erschöpft” (exhausted)</p></li></ul>
  <div class="skin"><span>${icn('i-mic')}Type German, a word, or your language…</span><i>${icn('i-camera')}</i><b>${icn('i-send')}</b></div></div>
  <span class="fl f1">${icn('i-ok')}Grammar fixed!</span><span class="fl f2">${icn('i-mic')}Voice input</span><span class="fl f3">${icn('i-camera')}Photo → Word</span></div>`;

function renderRoom(name, { lv, next, door }) {
  const r = ROOMS[name];
  if (r.kind === 'title') { // Video studio: the trailer is the room, the reels are the episodes
    return `<section class="bill"><div class="bbd" style="background-image:url(media/${r.video}.jpg)"></div>
      <div class="info">${level(lv)}<div class="logo rr" style="--i:1"><span class="app app-g">${icn('i-film')}</span><h2 id="r-title">VIDEO STUDIO</h2></div>
      <p class="meta rr" style="--i:2"><span>${STYLES} styles</span><span class="box">${REELS.length} VIDEOS</span><span class="mascot" data-cell="2.6"></span>Claude</p>
      ${words(r, 3)}${actions(r, next, 5)}</div>
      <button class="trailer btr" type="button" data-v="${r.video}" style="background-image:url(media/${r.video}.jpg)" aria-label="Play the trailer, ${r.len}"><span class="tplay"><i>${icn('i-play')}</i>Trailer<small>${r.len}</small></span></button></section>
    <section class="eps rr" style="--i:6" id="feats"><div class="sh"><h3>Episodes</h3><span>${REELS.length} videos · ${STYLES} styles</span></div>
      <ol>${REELS.map(([f, t, d, c, h], i) => `<li><button class="ep trailer" type="button" data-v="${f}" style="background-image:url(media/${f}.jpg)"><span class="epn">${String(i + 1).padStart(2, '0')}</span><span class="epl">${icn('i-play')}</span><span class="cat">${c}</span>${hit(h)}<b>${t}</b><small>${d}</small></button></li>`).join('')}</ol></section>
    <section class="big rr" style="--i:7"><span class="n">${r.win[0]}</span><span class="c">${r.win[1]}<small>${r.win[2]}</small><a class="proof" href="${TOMATINA}" target="_blank" rel="noopener">See the post${icn('i-ext')}</a></span></section>
    ${ending(next, door)}`;
  }
  if (r.kind === 'profile') { // My home: a player profile
    return `<section class="prof">
      <div class="pwho rr" style="--i:1"><div class="duo"><img class="toon" src="media/hero-tall.jpg" alt="Enrico as a 3D character"><img class="real" src="media/${r.image}" alt="Enrico"></div>
        <p class="cls"><span>Player</span>${icn('i-pin')}Bandung → Hamburg</p></div>
      <div class="side">${level(lv)}<div class="id rr" style="--i:2"><div><h2 id="r-title" style="--len:${Math.max(...r.title.split('<br>').map((w) => w.length))}">${r.title}</h2><p class="type">${r.type}</p></div></div>${words(r, 3)}
        <ul class="stats info rr" style="--i:5">${r.info.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join('')}</ul>
        ${actions(r, next, 6)}<p class="soc rr" style="--i:7">${socials()}</p></div></section>
    <section class="deck rr" style="--i:7"><div class="sh"><h3>My strengths</h3><span>${r.cards.length} cards</span></div>
      <div class="hand">${r.cards.map(([i, t, d], j) => `<article class="cd" style="--k:${j - (r.cards.length - 1) / 2};--z:${9 - Math.ceil(Math.abs(j - (r.cards.length - 1) / 2))}"><div><span class="no"><span>${String(j + 1).padStart(2, '0')}/${String(r.cards.length).padStart(2, '0')}</span><span>Strength</span></span><span class="art">${icn(i)}</span><b>${t}</b><p>${d}</p><span class="rar">Gold</span><i class="holo"></i></div></article>`).join('')}</div></section>
    <section class="story rr" style="--i:8"><div class="sh"><h3>My story</h3><span>Level 1 → ${r.story.length}</span></div>
      <ol class="lvls">${r.story.map(([t, d], j) => `<li style="--j:${j}"><small>Level ${j + 1}</small><b>${t}</b><p>${d}</p></li>`).join('')}</ol></section>
    ${ending(next, door)}`;
  }
  const centre = r.kind === 'inbox' ? inbox(r) : r.kind === 'film' ? film(r) : fixer(r);
  return `<section class="lcard">${level(lv)}${ident(r)}${words(r)}${achievement(r)}${actions(r, next)}</section>
    <section class="stage2 rr" style="--i:3">${centre}</section>
    <section class="s-ft rr" style="--i:6" id="feats">${feats(r)}</section>
    ${r.video && r.kind !== 'film' ? `<section class="s-tr rr" style="--i:7" id="trailer">${trailer(r)}</section>` : ''}
    ${ending(next, door)}`;
}
