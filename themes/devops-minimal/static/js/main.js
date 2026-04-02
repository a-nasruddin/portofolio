/* ═══════════════════════════════════════
   PARTICLE NETWORK BACKGROUND
═══════════════════════════════════════ */
class ParticleNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.count = window.innerWidth < 768 ? 40 : 75;
    this.maxDist = 130;
    this.resize();
    this.init();
    this.animate();
    window.addEventListener('resize', () => { this.resize(); this.init(); });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = Array.from({ length: this.count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.4,
      o: Math.random() * 0.4 + 0.15,
    }));
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const W = this.canvas.width, H = this.canvas.height;

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 212, 255, ${p.o})`;
      this.ctx.fill();
    });

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i], b = this.particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.maxDist) {
          const alpha = (1 - dist / this.maxDist) * 0.12;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.stroke();
        }
      }
    }
    requestAnimationFrame(() => this.animate());
  }
}

/* ═══════════════════════════════════════
   TYPING ANIMATION
═══════════════════════════════════════ */
class TypeWriter {
  constructor(el, texts, speed = 85) {
    this.el = el;
    this.texts = texts;
    this.speed = speed;
    this.idx = 0;
    this.char = 0;
    this.del = false;
    this.run();
  }

  run() {
    const current = this.texts[this.idx];
    if (this.del) {
      this.el.textContent = current.substring(0, this.char - 1);
      this.char--;
    } else {
      this.el.textContent = current.substring(0, this.char + 1);
      this.char++;
    }

    let delay = this.speed;
    if (!this.del && this.char === current.length) {
      delay = 2200;
      this.del = true;
    } else if (this.del && this.char === 0) {
      this.del = false;
      this.idx = (this.idx + 1) % this.texts.length;
      delay = 500;
    } else if (this.del) {
      delay = this.speed / 2;
    }
    setTimeout(() => this.run(), delay);
  }
}

/* ═══════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Particle background
  const canvas = document.getElementById('bg-canvas');
  if (canvas) new ParticleNetwork(canvas);

  // Typing animation
  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    try {
      const roles = JSON.parse(typingEl.dataset.roles || '[]');
      if (roles.length) new TypeWriter(typingEl, roles);
    } catch (e) { /* ignore parse errors */ }
  }

  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu toggle
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('navbar-nav');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('open'))
    );
  }

  // Intersection Observer — fade-in sections
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.08 }
  );
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
});
