const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

/* ---------- 1. Mobile menu ---------- */
const menuBtn = $('#menu-toggle');
const navLinks = $('#nav-links');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuBtn.textContent = open ? '✕' : '☰';
}
menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
$$('a', navLinks).forEach(link => link.addEventListener('click', () => setMenu(false)));

/* ---------- 2. Dark / light theme ---------- */
const root = document.documentElement;
const themeBtn = $('#theme-toggle');

function setTheme(theme) {
  root.dataset.theme = theme;
  themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('theme', theme); } catch (e) { /* storage blocked: ignore */ }
}
let saved = null;
try { saved = localStorage.getItem('theme'); } catch (e) { /* ignore */ }
setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

/* ---------- 3. Typing effect in the hero ---------- */
const words = ['clear dashboards.', 'useful insights.', 'fast, responsive pages.'];
const typingEl = $('#typing');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let w = 0, c = 0, deleting = false;

function type() {
  const word = words[w];
  c += deleting ? -1 : 1;
  typingEl.textContent = word.slice(0, c);
  let delay = deleting ? 40 : 85;
  if (!deleting && c === word.length) { deleting = true; delay = 1600; }
  else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
  setTimeout(type, delay);
}
if (reduceMotion) typingEl.textContent = words[0]; else type();

/* ---------- 4. Skill bars + reveal on scroll ---------- */
$$('.skill-group, .project, .about-text, form').forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    $$('.bar-track i', entry.target).forEach(bar => { bar.style.width = bar.dataset.level + '%'; });
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => observer.observe(el));

// Highlight the nav link of the section in view
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      $$('.nav-links a:not(.nav-cta)').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => sectionObserver.observe(s));

/* ---------- 5. Project filter ---------- */
const filterBtns = $$('.filter');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.toggle('active', b === btn));
    $$('.project').forEach(card => {
      const show = btn.dataset.filter === 'all' || card.dataset.category === btn.dataset.filter;
      card.classList.toggle('hide', !show);
    });
  });
});

/* ---------- 6. Image lightbox ---------- */
const lightbox = $('#lightbox');
const lightboxImg = $('img', lightbox);
let lastThumb = null;

function closeLightbox() {
  lightbox.hidden = true;
  if (lastThumb) lastThumb.focus();
}
$$('.thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    lastThumb = thumb;
    lightboxImg.src = thumb.dataset.full;
    lightboxImg.alt = $('img', thumb).alt;
    lightbox.hidden = false;
    $('.lightbox-close', lightbox).focus();
  });
});
lightbox.addEventListener('click', e => { if (e.target !== lightboxImg) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

/* ---------- 7. Contact form validation ---------- */
const form = $('#contact-form');
const status = $('#form-status');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Returns an error message, or '' if the field is valid
function validate(field) {
  const value = field.value.trim();
  if (!value) return 'This field is required.';
  if (field.name === 'name' && value.length < 2) return 'Enter at least 2 characters.';
  if (field.name === 'email' && !emailPattern.test(value)) return 'Enter a valid email, like name@example.com.';
  if (field.name === 'message' && value.length < 10) return 'Write at least 10 characters.';
  return '';
}
function showError(field) {
  const msg = validate(field);
  field.parentElement.classList.toggle('invalid', Boolean(msg));
  $('.error', field.parentElement).textContent = msg;
  return !msg;
}

$$('input, textarea', form).forEach(field => {
  field.addEventListener('blur', () => showError(field));
  field.addEventListener('input', () => { if (field.parentElement.classList.contains('invalid')) showError(field); });
});

form.addEventListener('submit', e => {
  e.preventDefault();
  status.className = 'form-status';
  const fields = $$('input, textarea', form);
  const allValid = fields.map(showError).every(Boolean);
  if (!allValid) {
    status.textContent = 'Please fix the highlighted fields and send again.';
    fields.find(f => validate(f))?.focus();
    return;
  }
  // Static site has no backend: connect Formspree or Netlify Forms here when deploying.
  status.textContent = 'Message sent. Thank you, I will reply soon.';
  status.classList.add('ok');
  form.reset();
});

/* ---------- Footer year ---------- */
$('#year').textContent = new Date().getFullYear();

/* ---------- 8. Scroll progress bar + back-to-top ---------- */
// JS writes a number to the --progress CSS variable; style.css turns it into a bar width.
const toTop = $('#to-top');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  root.style.setProperty('--progress', max > 0 ? (scrollY / max).toFixed(3) : 0);
  toTop.hidden = scrollY < 600;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));