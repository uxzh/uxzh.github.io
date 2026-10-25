// Light/dark toggle, screenshot zoom and back-to-top button.
// Toggle: the new theme is revealed as a circle that grows out of the
// button, using a same-document view transition (same idea as Magic UI's
// animated theme toggler). The inline script in each page's <head> applies the
// saved theme before first paint, so this file only handles the button.
const root = document.documentElement;
const btn = document.createElement('button');
btn.className = 'theme-toggle';

const sun = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const moon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>';

const saved = () => {
  try { return localStorage.theme } catch (e) {}
};
const render = () => {
  const dark = root.classList.contains('dark');
  btn.innerHTML = dark ? sun : moon;
  btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
};
const apply = dark => {
  root.classList.toggle('dark', dark);
  try { localStorage.theme = dark ? 'dark' : 'light' } catch (e) {}
  render();
};

btn.addEventListener('click', async () => {
  const dark = !root.classList.contains('dark');
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply(dark);
  root.classList.add('theme-switch');
  const transition = document.startViewTransition(() => apply(dark));
  transition.finished.finally(() => root.classList.remove('theme-switch'));
  try { await transition.ready } catch (e) { return }
  const { top, left, width, height } = btn.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
    { duration: 400, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
  );
});

// A prerendered page, or one restored from the back/forward cache, may have
// been rendered before the theme was switched on another page.
const sync = () => {
  const theme = saved();
  root.classList.toggle('dark', theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  render();
};
addEventListener('pageshow', sync);
document.addEventListener('prerenderingchange', sync);

// A prerendered project page played its entrance animation before anyone saw
// it, so replay it when the page is shown.
document.addEventListener('prerenderingchange', () => {
  for (const a of document.getAnimations()) if (a.animationName === 'staggerIn') { a.cancel(); a.play(); }
});

render();
document.body.append(btn);

// Click a screenshot to see it larger in a native <dialog>. Escape, or a click anywhere, closes it.
const zoom = document.createElement('dialog');
zoom.className = 'zoom';
zoom.addEventListener('click', () => zoom.close());
document.body.append(zoom);
for (const img of document.querySelectorAll('figure img')) {
  img.tabIndex = 0;
  const open = () => {
    zoom.innerHTML = `<img src="${img.currentSrc || img.src}" alt="${img.alt.replace(/"/g, '&quot;')}">`;
    zoom.showModal();
  };
  img.addEventListener('click', open);
  img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
}

// Back to top: shows after one screen of scrolling, scrolls up smoothly.
const up = document.createElement('button');
up.className = 'to-top';
up.setAttribute('aria-label', 'Back to top');
up.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
up.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
const onScroll = () => up.classList.toggle('show', scrollY > innerHeight);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
document.body.append(up);
