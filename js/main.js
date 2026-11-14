import { profile, experience, education, skills, projects } from './data.js';

// ───────────────────────── tiny DOM helper ─────────────────────────
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}
const $ = (id) => document.getElementById(id);
const ext = (url, label, cls = 'btn btn--ghost') => h('a', { class: cls, href: url, target: '_blank', rel: 'noopener' }, label, h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↗'));
const chips = (items, cls = '') => h('ul', { class: 'chips ' + cls }, items.map((t) => h('li', {}, t)));
const planetSwatch = (p) => {
  const [a, b, c] = p.planet.colors;
  return h('span', { class: 'swatch' + (p.planet.rings ? ' swatch--rings' : ''), style: `--a:${a};--b:${b};--c:${c}`, 'aria-hidden': 'true' });
};

// ───────────────────────── static chrome ─────────────────────────
$('brand-mark').textContent = profile.initials;
$('brand-name').textContent = profile.name;
$('brand-title').textContent = profile.title;
$('cv-link').href = profile.cv;
$('hero-eyebrow').textContent = `${profile.title} · ${profile.subtitle}`;
$('hero-name').textContent = profile.name;
$('hero-tagline').textContent = profile.tagline;
$('hero-stats').append(...profile.stats.map((s) => h('li', {}, h('strong', {}, s.value), h('span', {}, s.label))));

const panel = $('panel'), panelBody = $('panel-body'), classic = $('classic'), dock = $('dock');
let scene = null;
let current = null; // id of what the panel shows: 'sun' | 'contact' | 'projects' | project id

// ───────────────────────── content blocks (shared by panel + classic view) ─────────────────────────
function contactLinks() {
  return h('div', { class: 'contact-list' },
    h('a', { class: 'contact-item', href: `mailto:${profile.email}` }, h('span', {}, 'Email'), h('strong', {}, profile.email)),
    h('a', { class: 'contact-item', href: profile.linkedin, target: '_blank', rel: 'noopener' }, h('span', {}, 'LinkedIn'), h('strong', {}, profile.linkedin.replace(/^https?:\/\/(www\.)?/, ''))),
    profile.github && h('a', { class: 'contact-item', href: profile.github, target: '_blank', rel: 'noopener' }, h('span', {}, 'GitHub'), h('strong', {}, profile.github.replace(/^https?:\/\/(www\.)?/, ''))),
    profile.phone && h('a', { class: 'contact-item', href: `tel:${profile.phone.replace(/\s/g, '')}` }, h('span', {}, 'Phone'), h('strong', {}, profile.phone)),
    h('div', { class: 'contact-item' }, h('span', {}, 'Location'), h('strong', {}, profile.location)),
  );
}

function aboutBlock() {
  return h('div', {},
    profile.summary.map((p) => h('p', {}, p)),
    h('ul', { class: 'stats' }, profile.stats.map((s) => h('li', {}, h('strong', {}, s.value), h('span', {}, s.label)))),
    h('h3', {}, 'Languages'),
    h('ul', { class: 'plain' }, profile.languages.map((l) => h('li', {}, h('strong', {}, l.name), ' — ', l.level))),
  );
}

function experienceBlock() {
  return h('ol', { class: 'timeline' }, experience.map((e) => h('li', {},
    h('div', { class: 'timeline__head' }, h('h3', {}, e.role), h('span', { class: 'period' }, e.period)),
    h('p', { class: 'muted' }, h('strong', {}, e.company), ' · ', e.meta),
    h('ul', { class: 'bullets' }, e.points.map((p) => h('li', {}, p))),
  )));
}

function skillsBlock() {
  return h('div', { class: 'skills' }, skills.map((s) => h('section', {}, h('h3', {}, s.group), chips(s.items))));
}

function educationBlock() {
  return h('ol', { class: 'timeline' }, education.map((e) => h('li', {},
    h('div', { class: 'timeline__head' }, h('h3', {}, e.degree), h('span', { class: 'period' }, e.period)),
    h('p', { class: 'muted' }, e.school),
    h('ul', { class: 'bullets' }, e.points.map((p) => h('li', {}, p))),
  )));
}

function mediaBlock(p) {
  if (!p.media || !p.media.length) return null;
  return h('div', { class: 'media' }, p.media.map((m) => {
    if (m.type === 'video') {
      return h('figure', { class: 'media__item media__item--wide' },
        h('video', { src: m.src, poster: m.poster, controls: true, preload: 'metadata', playsinline: true }),
        m.caption && h('figcaption', {}, m.caption));
    }
    if (m.type === 'youtube') {
      return h('figure', { class: 'media__item media__item--wide' },
        h('iframe', { src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.id)}`, title: m.caption || `${p.name} video`, loading: 'lazy', allowfullscreen: true, allow: 'accelerometer; encrypted-media; picture-in-picture' }),
        m.caption && h('figcaption', {}, m.caption));
    }
    return h('figure', { class: 'media__item' },
      h('button', { type: 'button', class: 'media__zoom', onclick: () => openLightbox(m), 'aria-label': `Enlarge: ${m.caption || p.name}` },
        h('img', { src: m.src, alt: m.caption || `${p.name} screenshot`, loading: 'lazy' })),
      m.caption && h('figcaption', {}, m.caption));
  }));
}

function projectBlock(p, { heading = 'h2' } = {}) {
  return h('article', { class: 'project' },
    h('header', { class: 'project__head' },
      planetSwatch(p),
      h('div', {},
        h('p', { class: 'eyebrow' }, `${p.kind} · ${p.org}`),
        h(heading, {}, p.name)),
    ),
    h('p', { class: 'lead' }, p.tagline),
    chips(p.platforms, 'chips--solid'),
    mediaBlock(p),
    h('p', {}, p.description),
    p.highlights.length ? h('ul', { class: 'bullets' }, p.highlights.map((x) => h('li', {}, x))) : null,
    p.subprojects ? h('ul', { class: 'moons' }, p.subprojects.map((s) => h('li', {}, h('strong', {}, s.name), h('span', {}, s.text)))) : null,
    h('h3', {}, 'Tech'),
    chips(p.tech),
    p.links.length ? h('div', { class: 'links' }, p.links.map((l) => ext(l.url, l.label))) : null,
  );
}

// ───────────────────────── panel views ─────────────────────────
const ABOUT_TABS = [
  ['about', 'About', aboutBlock],
  ['experience', 'Experience', experienceBlock],
  ['skills', 'Skills', skillsBlock],
  ['education', 'Education', educationBlock],
];

function renderSun(tab = 'about') {
  const body = h('div', { class: 'tabpane' });
  const tabs = h('div', { class: 'tabs', role: 'tablist' }, ABOUT_TABS.map(([id, label, fn]) =>
    h('button', {
      type: 'button', role: 'tab', class: 'tab', 'data-tab': id,
      onclick: () => { select(id); setDock(id === 'about' ? 'sun' : id); },
    }, label)));
  function select(id) {
    tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    body.replaceChildren(ABOUT_TABS.find((t) => t[0] === id)[2]());
    panelBody.scrollTop = 0;
  }
  panelBody.replaceChildren(
    h('header', { class: 'project__head' },
      h('span', { class: 'swatch swatch--sun', 'aria-hidden': 'true' }),
      h('div', {}, h('p', { class: 'eyebrow' }, `${profile.title} · ${profile.location}`), h('h2', {}, profile.name))),
    h('p', { class: 'lead' }, profile.tagline),
    tabs, body,
    h('div', { class: 'links' },
      h('a', { class: 'btn btn--primary', href: profile.cv, download: true }, 'Download CV'),
      h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => open('contact') }, 'Contact me')),
  );
  select(tab);
}

function renderContact() {
  panelBody.replaceChildren(
    h('header', { class: 'project__head' },
      h('span', { class: 'swatch swatch--comet', 'aria-hidden': 'true' }),
      h('div', {}, h('p', { class: 'eyebrow' }, 'Contact'), h('h2', {}, 'Let’s build something'))),
    h('p', { class: 'lead' }, 'I’m open to senior Flutter and mobile engineering roles — remote or on-site. The fastest way to reach me is email or LinkedIn.'),
    contactLinks(),
    h('div', { class: 'links' },
      h('a', { class: 'btn btn--primary', href: `mailto:${profile.email}?subject=${encodeURIComponent('Hello Mohammad')}` }, 'Send an email'),
      h('a', { class: 'btn btn--ghost', href: profile.cv, download: true }, 'Download CV')),
  );
}

function renderProjectList() {
  panelBody.replaceChildren(
    h('header', { class: 'project__head' },
      h('div', {}, h('p', { class: 'eyebrow' }, `${projects.length} planets`), h('h2', {}, 'Projects'))),
    h('p', { class: 'lead' }, 'Every planet in this system is something I built. Pick one to fly there.'),
    h('ul', { class: 'project-list' }, projects.map((p) => h('li', {},
      h('button', { type: 'button', onclick: () => open(p.id) },
        planetSwatch(p),
        h('span', { class: 'project-list__text' }, h('strong', {}, p.name), h('small', {}, `${p.kind} · ${p.org}`)),
        h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'))))),
  );
}

function renderProject(p) {
  const i = projects.indexOf(p);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  panelBody.replaceChildren(
    projectBlock(p),
    h('nav', { class: 'pager', 'aria-label': 'Other projects' },
      h('button', { type: 'button', onclick: () => open(prev.id) }, h('small', {}, '← Previous'), h('strong', {}, prev.name)),
      h('button', { type: 'button', onclick: () => open(next.id) }, h('small', {}, 'Next →'), h('strong', {}, next.name))),
  );
}

// ───────────────────────── navigation ─────────────────────────
function setDock(id) {
  dock.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.id === id));
}

/** Open a view. id: 'sun' | 'experience' | 'skills' | 'education' | 'projects' | 'contact' | <project id> */
function open(id, { updateHash = true } = {}) {
  const project = projects.find((p) => p.id === id);
  const sunTab = ['experience', 'skills', 'education'].includes(id) ? id : null;
  if (sunTab || id === 'sun') { renderSun(sunTab || 'about'); scene?.focus('sun'); }
  else if (id === 'contact') { renderContact(); scene?.focus('contact'); }
  else if (id === 'projects') { renderProjectList(); scene?.overview(); }
  else if (project) { renderProject(project); scene?.focus(id); }
  else return;
  current = id;
  panelBody.scrollTop = 0;
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  document.body.classList.toggle('is-focused', id !== 'projects');
  scene?.setPanelOpen(true);
  setDock(project ? 'projects' : id);
  if (updateHash) history.replaceState(null, '', '#' + id);
}

function close() {
  current = null;
  panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('panel-open', 'is-focused');
  scene?.setPanelOpen(false);
  scene?.overview();
  setDock(null);
  history.replaceState(null, '', location.pathname + location.search);
}

// dock
[['sun', 'About'], ['experience', 'Experience'], ['skills', 'Skills'], ['projects', 'Projects'], ['contact', 'Contact']]
  .forEach(([id, label]) => dock.append(h('button', { type: 'button', 'data-id': id, onclick: () => (current === id ? close() : open(id)) }, label)));

$('panel-close').addEventListener('click', close);
$('brand').addEventListener('click', (e) => { e.preventDefault(); setClassic(false); close(); });

window.addEventListener('keydown', (e) => {
  if (!$('lightbox').hidden) { if (e.key === 'Escape') closeLightbox(); return; }
  if (e.key === 'Escape' && current) close();
  const i = projects.findIndex((p) => p.id === current);
  if (i >= 0 && e.key === 'ArrowRight') open(projects[(i + 1) % projects.length].id);
  if (i >= 0 && e.key === 'ArrowLeft') open(projects[(i - 1 + projects.length) % projects.length].id);
});

// ───────────────────────── lightbox ─────────────────────────
const lightbox = $('lightbox');
function openLightbox(m) {
  lightbox.querySelector('img').src = m.src;
  lightbox.querySelector('img').alt = m.caption || '';
  lightbox.querySelector('.lightbox__caption').textContent = m.caption || '';
  lightbox.hidden = false;
}
function closeLightbox() { lightbox.hidden = true; lightbox.querySelector('img').removeAttribute('src'); }
lightbox.addEventListener('click', (e) => { if (e.target.tagName !== 'IMG') closeLightbox(); });

// ───────────────────────── classic (plain résumé) view ─────────────────────────
function buildClassic() {
  const section = (title, ...content) => h('section', { class: 'classic__section' }, h('h2', {}, title), ...content);
  classic.replaceChildren(h('div', { class: 'classic__inner' },
    h('header', { class: 'classic__header' },
      h('p', { class: 'eyebrow' }, `${profile.title} · ${profile.subtitle}`),
      h('h1', {}, profile.name),
      h('p', { class: 'lead' }, profile.tagline),
      h('div', { class: 'links' },
        h('a', { class: 'btn btn--primary', href: profile.cv, download: true }, 'Download CV'),
        h('a', { class: 'btn btn--ghost', href: `mailto:${profile.email}` }, 'Email me'),
        ext(profile.linkedin, 'LinkedIn'))),
    section('About', aboutBlock()),
    section('Experience', experienceBlock()),
    section('Projects', h('div', { class: 'classic__projects' }, projects.map((p) => projectBlock(p, { heading: 'h3' })))),
    section('Skills', skillsBlock()),
    section('Education', educationBlock()),
    section('Contact', contactLinks()),
  ));
}

let classicOn = false;
function setClassic(on) {
  if (on === classicOn) return;
  classicOn = on;
  if (on && !classic.firstChild) buildClassic();
  classic.hidden = !on;
  document.body.classList.toggle('classic-open', on);
  $('toggle-classic').textContent = on ? 'Space view' : 'Classic view';
  scene?.setActive(!on);
  if (on) classic.scrollTop = 0;
}
$('toggle-classic').addEventListener('click', () => setClassic(!classicOn));

// ───────────────────────── boot the 3D scene ─────────────────────────
async function boot() {
  try {
    const { createScene } = await import('./scene.js');
    scene = createScene({ canvas: $('scene'), labelLayer: $('labels'), projects, onSelect: (id) => open(id) });
  } catch (err) {
    console.error('3D scene unavailable, falling back to classic view', err);
    document.body.classList.add('no-webgl');
    setClassic(true);
  }
  requestAnimationFrame(() => { performance.mark('scene-ready'); $('loader').classList.add('is-done'); });
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && scene) setTimeout(() => open(hash, { updateHash: false }), 900);
}
boot();
