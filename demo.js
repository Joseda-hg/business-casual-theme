/* Demo interactions; the reusable CSS theme does not require JavaScript. */
const root = document.body;
const app = document.querySelector('#app');
const media = window.matchMedia('(prefers-color-scheme: dark)');
const accents = {
  blue: ['#0066cc', '#81b5ff'],
  violet: ['#7958ce', '#b49cff'],
  green: ['#168465', '#6cdbb4'],
  orange: ['#be6830', '#f2aa72'],
  graphite: ['#414145', '#ceced3']
};

function preference(key, fallback) {
  try { return localStorage.getItem(`bc-${key}`) || fallback; } catch { return fallback; }
}
function savePreference(key, value) {
  try { localStorage.setItem(`bc-${key}`, value); } catch { /* Private storage may be unavailable. */ }
}

let theme = preference('theme', 'system');
let accent = preference('accent', 'graphite');
let font = preference('font', 'system');
if (!['light', 'dark', 'system'].includes(theme)) theme = 'system';
if (!Object.hasOwn(accents, accent)) accent = 'blue';
if (!['system', 'manrope'].includes(font)) font = 'system';

function applyFont() {
  if (font === 'manrope') root.dataset.font = 'manrope';
  else root.removeAttribute('data-font');
  document.querySelector('#font-toggle').setAttribute('aria-label', font === 'manrope' ? 'Switch to system font' : 'Switch to Manrope font');
  document.querySelector('#font-toggle').setAttribute('title', font === 'manrope' ? 'Using Manrope · switch to system font' : 'Using system font · switch to Manrope');
}
applyFont();
document.querySelector('#font-toggle').addEventListener('click', () => {
  font = font === 'system' ? 'manrope' : 'system';
  savePreference('font', font);
  applyFont();
});

function isDark() { return theme === 'dark' || (theme === 'system' && media.matches); }
function applyAppearance() {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = theme;
  root.style.setProperty('--bc-accent', accents[accent][isDark() ? 1 : 0]);
  document.querySelectorAll('[data-theme-choice]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)); });
  document.querySelectorAll('[data-accent]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.accent === accent)); });
  const icon = document.querySelector('#theme-toggle use');
  icon.setAttribute('href', isDark() ? '#i-sun' : '#i-moon');
  document.querySelector('#theme-toggle').setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]').content = isDark() ? '#151517' : '#ffffff';
}
applyAppearance();
media.addEventListener('change', applyAppearance);
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
  theme = button.dataset.themeChoice;
  savePreference('theme', theme);
  applyAppearance();
}));
document.querySelectorAll('[data-accent]').forEach(button => button.addEventListener('click', () => {
  accent = button.dataset.accent;
  savePreference('accent', accent);
  applyAppearance();
}));
document.querySelector('#theme-toggle').addEventListener('click', () => {
  theme = isDark() ? 'light' : 'dark';
  savePreference('theme', theme);
  applyAppearance();
});

function setMenu(open) {
  app.classList.toggle('menu-open', open);
  const toggle = document.querySelector('#menu-toggle');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
document.querySelector('#menu-toggle').addEventListener('click', () => setMenu(!app.classList.contains('menu-open')));
document.querySelector('#sidebar-backdrop').addEventListener('click', () => setMenu(false));
document.querySelectorAll('.sidebar a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

const tabs = [...document.querySelectorAll('[data-filter]')];
const grid = document.querySelector('#workspace-grid');
const search = document.querySelector('#workspace-search');
let filter = 'all';
function filterWorkspaces() {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  grid.querySelectorAll('.workspace-card').forEach(card => {
    const show = (filter === 'all' || card.dataset.status === filter) && card.dataset.name.toLocaleLowerCase().includes(query);
    card.hidden = !show;
    if (show) visible++;
  });
  document.querySelector('#empty-state').hidden = visible !== 0;
}
tabs.forEach((tab, index) => {
  tab.tabIndex = index === 0 ? 0 : -1;
  tab.addEventListener('click', () => {
    filter = tab.dataset.filter;
    tabs.forEach(other => { const selected = other === tab; other.setAttribute('aria-selected', String(selected)); other.tabIndex = selected ? 0 : -1; });
    filterWorkspaces();
  });
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); tabs[next].click();
  });
});
search.addEventListener('input', filterWorkspaces);

const dialog = document.querySelector('#workspace-dialog');
const form = document.querySelector('#workspace-form');
document.querySelector('#new-workspace').addEventListener('click', () => dialog.showModal());
form.addEventListener('submit', event => {
  event.preventDefault();
  if (event.submitter?.value !== 'create') { dialog.close(); return; }
  const name = form.elements.name.value.trim();
  if (!name) { form.elements.name.focus(); return; }
  const description = form.elements.description.value.trim() || 'A new place for your best work.';
  const card = document.createElement('article');
  card.className = 'bc-card workspace-card';
  card.dataset.status = 'active';
  card.dataset.name = name;
  // User-provided text is inserted as text nodes, never HTML.
  card.innerHTML = '<div class="workspace-top"><span class="workspace-icon"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><use href="#i-folder"/></svg></span><span class="bc-badge bc-badge--accent"><span class="bc-dot"></span> Active</span></div><h3 class="bc-h3"></h3><p></p><div class="workspace-footer"><span class="avatar-stack"><span class="bc-avatar bc-avatar--accent">AC</span></span><span class="bc-caption">0 projects</span></div>';
  card.querySelector('h3').textContent = name;
  card.querySelector('p').textContent = description;
  grid.prepend(card);
  document.querySelector('#workspace-count').textContent = String(grid.children.length).padStart(2, '0');
  tabs[0].click();
  search.value = '';
  filterWorkspaces();
  form.reset();
  dialog.close();
  document.querySelector('#workspaces').scrollIntoView({ behavior: 'smooth' });
});
