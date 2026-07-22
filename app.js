// NOIR — Client-side instrument
// Modular ES6. No frameworks. No bloat.

import { IBANValidator } from './validator.js';

/* ---------- Particle field ---------- */
const ParticleField = (() => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return { init() {} };
    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let rafId = null;
    let w = 0, h = 0;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.width  = window.innerWidth  * dpr;
        h = canvas.height = window.innerHeight * dpr;
        canvas.style.width  = window.innerWidth  + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);
    }

    function seed() {
        const count = prefersReduced ? 0 : Math.floor((window.innerWidth * window.innerHeight) / 22000);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 1.2 + 0.3,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            a: Math.random() * 0.5 + 0.2,
            hue: Math.random() < 0.15 ? 42 : 0, // occasional gold particle
        }));
    }

    function tick() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (const p of particles) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = window.innerWidth;
            if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight;
            if (p.y > window.innerHeight) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            if (p.hue) {
                ctx.fillStyle = `hsla(${p.hue}, 55%, 65%, ${p.a})`;
            } else {
                ctx.fillStyle = `rgba(244, 241, 234, ${p.a * 0.5})`;
            }
            ctx.fill();
        }
        rafId = requestAnimationFrame(tick);
    }

    return {
        init() {
            resize(); seed(); tick();
            window.addEventListener('resize', () => { resize(); seed(); });
        },
        stop() { cancelAnimationFrame(rafId); }
    };
})();

/* ---------- Navigation ---------- */
const Nav = (() => {
    const nav   = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    const links  = document.querySelector('.nav-links');

    function onScroll() {
        if (window.scrollY > 40) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    }

    function bind() {
        window.addEventListener('scroll', onScroll, { passive: true });
        toggle?.addEventListener('click', () => {
            const open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        links?.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                links.classList.remove('open');
                toggle?.setAttribute('aria-expanded', 'false');
            });
        });
    }

    return { bind };
})();

/* ---------- Validator UI ---------- */
const ValidatorUI = (() => {
    const form      = document.getElementById('validator-form');
    const input     = document.getElementById('iban-input');
    const feedback  = document.getElementById('validator-feedback');
    const statLen   = document.getElementById('stat-length');
    const statCtry  = document.getElementById('stat-country');
    const statChk   = document.getElementById('stat-checksum');
    const chips     = document.querySelectorAll('.chip[data-iban]');

    const COUNTRY_NAMES = {
        GB: 'United Kingdom', SA: 'Saudi Arabia', DE: 'Germany',
        FR: 'France', CH: 'Switzerland', IT: 'Italy', ES: 'Spain',
        NL: 'Netherlands', BE: 'Belgium', AT: 'Austria', IE: 'Ireland',
        PT: 'Portugal', PL: 'Poland', SE: 'Sweden', NO: 'Norway',
        DK: 'Denmark', FI: 'Finland', JP: 'Japan', AE: 'UAE',
        US: 'United States', CA: 'Canada', AU: 'Australia',
    };

    function setFeedback(text, state = 'idle') {
        feedback.textContent = text;
        feedback.dataset.state = state;
    }

    function renderStats(iban) {
        const clean = iban.replace(/\s/g, '').toUpperCase();
        statLen.textContent  = clean.length;
        statCtry.textContent = clean.length >= 2 ? (COUNTRY_NAMES[clean.slice(0, 2)] || clean.slice(0, 2)) : '—';
        statChk.textContent  = clean.length >= 4 ? clean.slice(2, 4) : '—';
    }

    function validate(raw) {
        const result = IBANValidator.validate(raw);
        renderStats(raw);
        if (!raw || !raw.trim()) {
            setFeedback('Awaiting input…', 'idle');
            return;
        }
        if (result.valid) {
            setFeedback(`✓ Authenticated · ${COUNTRY_NAMES[result.country] || result.country}`, 'valid');
        } else {
            setFeedback(`✗ ${result.reason}`, 'invalid');
        }
    }

    function bind() {
        input.addEventListener('input', e => validate(e.target.value));
        form.addEventListener('submit', e => {
            e.preventDefault();
            validate(input.value);
        });
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                input.value = chip.dataset.iban;
                input.focus();
                validate(input.value);
            });
        });
    }

    return { bind };
})();

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
    ParticleField.init();
    Nav.bind();
    ValidatorUI.bind();
});
