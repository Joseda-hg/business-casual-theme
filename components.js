/* Only the gallery interactions live here; the stylesheet has no JS dependency. */
const body = document.body;
const modeButton = document.querySelector('#gallery-theme');
const fontButton = document.querySelector('#gallery-font');
const media = matchMedia('(prefers-color-scheme: dark)');
const palette = { blue: ['#0066cc', '#81b5ff'], violet: ['#7958ce', '#b49cff'], green: ['#168465', '#6cdbb4'], orange: ['#be6830', '#f2aa72'], graphite: ['#414145', '#ceced3'] };
function stored(key, fallback) { try { return localStorage.getItem(`bc-${key}`) || fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(`bc-${key}`, value); } catch { /* Storage may be unavailable. */ } }
let theme = stored('theme', 'system');
const accent = stored('accent', 'graphite');
let font = stored('font', 'system');
if (!['light', 'dark', 'system'].includes(theme)) theme = 'system';
if (!['system', 'manrope'].includes(font)) font = 'system';
function applyFont() {
  if (font === 'manrope') body.dataset.font = 'manrope'; else body.removeAttribute('data-font');
  fontButton.textContent = font === 'manrope' ? 'System font' : 'Manrope font';
  fontButton.setAttribute('aria-label', `Switch to ${font === 'manrope' ? 'system' : 'Manrope'} font`);
}
applyFont();
fontButton.addEventListener('click', () => { font = font === 'system' ? 'manrope' : 'system'; save('font', font); applyFont(); });
function dark() { return theme === 'dark' || (theme === 'system' && media.matches); }
function apply() {
  if (theme === 'system') body.removeAttribute('data-theme'); else body.dataset.theme = theme;
  body.style.setProperty('--bc-accent', (palette[accent] || palette.blue)[dark() ? 1 : 0]);
  modeButton.textContent = dark() ? 'Light mode' : 'Dark mode';
  modeButton.setAttribute('aria-label', `Switch to ${dark() ? 'light' : 'dark'} mode`);
}
apply();
media.addEventListener('change', apply);
modeButton.addEventListener('click', () => { theme = dark() ? 'light' : 'dark'; save('theme', theme); apply(); });

const tabs = [...document.querySelectorAll('.gallery-main .bc-tab')];
function selectTab(tab) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next]); tabs[next].focus();
  });
});
document.querySelectorAll('.bc-segmented > button').forEach(button => button.addEventListener('click', () => {
  button.parentElement.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
const dialog = document.querySelector('#example-dialog');
document.querySelectorAll('[data-open-dialog]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
