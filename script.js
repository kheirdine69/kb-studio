/* Kheir-dine Bennour — Portfolio : animations et interactions */
(() => {
  const html = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Découpage des titres en mots ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = document.createElement("span");
            w.className = "w";
            const wi = document.createElement("span");
            wi.className = "wi";
            wi.style.setProperty("--i", i++);
            wi.textContent = part;
            w.append(wi);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Écran de chargement ---------- */
  const loader = $(".loader");
  const start = () => {
    body.classList.add("ready");
    $$(".hero [data-split], .hero .reveal, .contact-hero [data-split], .contact-hero .reveal").forEach((el) => el.classList.add("in"));
  };
  if (loader) {
    const bar = $(".loader-bar i", loader);
    const count = $(".loader-count", loader);
    const seen = sessionStorage.getItem("kb-seen");
    const dur = reduce || seen ? 250 : 1300;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      bar.style.width = e * 100 + "%";
      count.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else {
        sessionStorage.setItem("kb-seen", "1");
        loader.classList.add("done");
        setTimeout(start, 250);
        setTimeout(() => loader.remove(), 1200);
      }
    };
    requestAnimationFrame(tick);
  } else start();

  /* ---------- Apparitions au défilement ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );
  $$(".reveal, [data-split], .terminal").forEach((el) => {
    if (!el.closest(".hero, .contact-hero")) io.observe(el);
  });
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((c, i) => c.style.setProperty("--d", i * 90 + "ms"));
  });
  $$(".term-body div").forEach((l, i) => l.style.setProperty("--i", i));

  /* ---------- Compteurs ---------- */
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target;
    const to = +el.dataset.count;
    const pre = el.dataset.prefix || "";
    const suf = el.dataset.suffix || "";
    if (reduce) { el.textContent = pre + to + suf; return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      el.textContent = pre + Math.round((1 - Math.pow(1 - p, 4)) * to) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  /* ---------- Texte tapé ---------- */
  const typed = $(".typed");
  if (typed) {
    const words = JSON.parse(typed.dataset.words);
    if (reduce) typed.textContent = words[0];
    else {
      let w = 0, c = 0, del = false;
      const loop = () => {
        const word = words[w];
        c += del ? -1 : 1;
        typed.textContent = word.slice(0, c);
        let wait = del ? 32 : 68;
        if (!del && c === word.length) { del = true; wait = 1700; }
        else if (del && c === 0) { del = false; w = (w + 1) % words.length; wait = 320; }
        setTimeout(loop, wait);
      };
      setTimeout(loop, 1900);
    }
  }

  /* ---------- Défilement : barre, navigation, frise ---------- */
  const progress = $(".progress");
  const nav = $(".nav");
  const timeline = $(".timeline");
  const sections = $$("section[id]");
  const links = $$(".nav-links a[href*='#']");
  let lastY = 0, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = html.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle("hide", y > lastY && y > 500 && !body.classList.contains("menu-open"));
      lastY = y;
    }
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = (innerHeight * 0.7 - r.top) / r.height;
      timeline.style.setProperty("--p", Math.max(0, Math.min(1, p)));
    }
    let current = "";
    sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    links.forEach((a) => a.classList.toggle("active", a.hash === "#" + current));
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Galerie de projets : défilement horizontal piloté par le scroll ---------- */
  const hs = $("#hs");
  if (hs) {
    const track = $(".hs-track", hs);
    const cards = $$(".hs-card", hs);
    const bar = $(".hs-bar i", hs);
    const steps = $$(".hs-steps button", hs);
    const wide = matchMedia("(min-width: 1001px)");
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    let max = 0;
    let travel = 1;
    let xs = [];
    let active = -1;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      steps.forEach((b, j) => {
        b.classList.toggle("on", j === i);
        b.setAttribute("aria-current", j === i ? "true" : "false");
      });
    };

    const update = () => {
      if (!hs.classList.contains("is-pinned")) return;
      const p = Math.min(1, Math.max(0, -hs.getBoundingClientRect().top / travel));
      track.style.transform = `translate3d(${-p * max}px,0,0)`;
      bar.style.transform = `scaleX(${0.08 + p * 0.92})`;
      const vw = document.documentElement.clientWidth;
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = (r.left + r.width / 2 - vw / 2) / vw;
        const a = Math.min(1, Math.abs(d));
        c.style.setProperty("--d", d.toFixed(3));
        if (calm.matches) {
          c.style.opacity = (1 - a * 0.5).toFixed(3);
        } else {
          c.style.opacity = (1 - a * 0.65).toFixed(3);
          c.style.transform = `scale(${(1 - a * 0.09).toFixed(3)}) rotateY(${(-d * 10).toFixed(2)}deg)`;
          c.style.filter = a > 0.03 ? `blur(${(a * 3).toFixed(2)}px)` : "";
        }
        if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
      });
      setActive(best);
    };

    const unpin = () => {
      hs.classList.remove("is-pinned");
      hs.style.height = "";
      hs.style.removeProperty("--k");
      track.style.transform = "";
      track.style.paddingLeft = track.style.paddingRight = "";
      cards.forEach((c) => {
        c.style.opacity = ""; c.style.transform = ""; c.style.filter = ""; c.style.removeProperty("--d");
      });
      bar.style.transform = "";
    };

    const layout = () => {
      if (!wide.matches) { unpin(); onSwipe(); return; }
      hs.classList.add("is-pinned");
      const vw = document.documentElement.clientWidth;
      // La carte s'adapte à l'écran : plus grande sur grand moniteur, réduite sur écran court
      const k = Math.max(0.6, Math.min(1.5, (innerHeight - 120) / 640, (vw * 0.8) / 1080));
      hs.style.setProperty("--k", k.toFixed(3));
      track.style.transform = "none";
      cards.forEach((c) => { c.style.transform = "none"; c.style.filter = ""; });
      track.style.paddingLeft = track.style.paddingRight = "0px";
      const rects = cards.map((c) => c.getBoundingClientRect());
      const pad = Math.max(24, (vw - rects[0].width) / 2);   // la carte active est centrée
      track.style.paddingLeft = track.style.paddingRight = `${pad}px`;
      xs = rects.map((r) => r.left - rects[0].left);
      max = xs[xs.length - 1];
      travel = Math.max(1, max + innerHeight * 0.25);
      hs.style.height = `${innerHeight + travel}px`;
      update();
    };

    // Mobile / tablette : le compteur suit la carte visible
    function onSwipe() {
      if (hs.classList.contains("is-pinned")) return;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (dist < bd) { bd = dist; best = i; }
      });
      setActive(best);
      bar.style.transform = `scaleX(${(best + 1) / cards.length})`;
    }

    steps.forEach((b, i) => b.addEventListener("click", () => {
      if (hs.classList.contains("is-pinned")) {
        const top = hs.getBoundingClientRect().top + scrollY;
        const p = max ? xs[i] / max : 0;
        scrollTo({ top: top + p * travel, behavior: calm.matches ? "auto" : "smooth" });
      } else {
        const c = cards[i];
        track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
      }
    }));

    addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    addEventListener("resize", layout);
    wide.addEventListener("change", layout);
    calm.addEventListener("change", layout);
    track.addEventListener("scroll", onSwipe, { passive: true });
    layout();
    addEventListener("load", layout);
  }

  /* ---------- Défilement infini des clients (bandeaux) ---------- */
  const buildMarquee = (mq) => {
    const track = $(".mq-track", mq);
    const set = $(".mq-set", track);
    const orig = $$(":scope > :not([data-clone])", set);
    $$("[data-clone]", set).forEach((n) => n.remove());
    $$(".mq-set[data-clone]", track).forEach((n) => n.remove());
    let guard = 0;
    while (set.getBoundingClientRect().width < document.documentElement.clientWidth * 1.15 && guard++ < 24) {
      orig.forEach((n) => {
        const c = n.cloneNode(true);
        c.setAttribute("data-clone", "");
        c.setAttribute("aria-hidden", "true");
        set.append(c);
      });
    }
    const dup = set.cloneNode(true);
    dup.setAttribute("data-clone", "");
    dup.setAttribute("aria-hidden", "true");
    track.append(dup);
  };
  const marquees = $$(".mq");
  marquees.forEach(buildMarquee);
  let mqTimer;
  addEventListener("resize", () => {
    clearTimeout(mqTimer);
    mqTimer = setTimeout(() => marquees.forEach(buildMarquee), 250);
  });

  /* ---------- Menu mobile ---------- */
  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
    });
    $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => body.classList.remove("menu-open")));
  }

  /* ---------- Curseur, cartes inclinées, boutons magnétiques ---------- */
  if (fine && !reduce) {
    const dot = $(".cursor-dot");
    const ring = $(".cursor-ring");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      body.classList.add("has-cursor");
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    const follow = () => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(follow);
    };
    follow();
    document.addEventListener("mouseover", (e) => {
      ring.classList.toggle("hover", !!e.target.closest("a, button, .card, .c-card, input, textarea, select"));
    });

    $$(".card, .c-card").forEach((card) => {
      const tilt = card.classList.contains("card");
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
        if (tilt) card.style.transform = `rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { if (tilt) card.style.transform = ""; });
    });

    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.28}px, ${y * 0.4}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    const orbit = $(".orbit");
    if (orbit) addEventListener("mousemove", (e) => {
      orbit.style.transform = `translate(${(e.clientX / innerWidth - 0.5) * -40}px, ${(e.clientY / innerHeight - 0.5) * -40}px)`;
    });
  }

  /* ---------- Constellation de particules ---------- */
  const canvas = $("#particles");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    const colors = ["139,92,255", "43,228,240", "255,79,208", "255,255,255"];
    let W, H, dpr, pts = [];
    const mouse = { x: -9999, y: -9999 };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.round((W * H) / 15000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.5, c: colors[(Math.random() * colors.length) | 0],
      }));
    };
    resize();
    addEventListener("resize", resize);
    addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    addEventListener("mouseout", () => { mouse.x = mouse.y = -9999; });
    const LINK = 135;
    const draw = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        for (const p of pts) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 26000) {
            const f = (1 - d2 / 26000) * 0.6;
            const d = Math.sqrt(d2) || 1;
            p.vx += (dx / d) * f * 0.12; p.vy += (dy / d) * f * 0.12;
          }
          p.vx *= 0.985; p.vy *= 0.985;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp < 0.12) { p.vx += (Math.random() - 0.5) * 0.05; p.vy += (Math.random() - 0.5) * 0.05; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
          if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fillStyle = `rgba(${p.c},0.85)`;
          ctx.fill();
        }
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          for (let j = i + 1; j < pts.length; j++) {
            const b = pts[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = dx * dx + dy * dy;
            if (d < LINK * LINK) {
              ctx.strokeStyle = `rgba(${a.c},${(1 - Math.sqrt(d) / LINK) * 0.22})`;
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          const mdx = a.x - mouse.x, mdy = a.y - mouse.y;
          const md = mdx * mdx + mdy * mdy;
          if (md < 40000) {
            ctx.strokeStyle = `rgba(43,228,240,${(1 - Math.sqrt(md) / 200) * 0.45})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Contact : copier + formulaire ---------- */
  $$(".copy").forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = "Copié ✓";
        btn.classList.add("ok");
      } catch {
        btn.textContent = btn.dataset.copy;
      }
      setTimeout(() => { btn.textContent = label; btn.classList.remove("ok"); }, 1800);
    });
  });

  const form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = `Projet ${d.get("type")} — ${d.get("nom")}`;
      const lines = [
        d.get("message"),
        "",
        "—",
        d.get("nom"),
        d.get("email"),
        d.get("tel") ? "Tél. : " + d.get("tel") : "",
      ].filter((l, i) => i < 3 || l);
      location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      const hint = $(".form-hint", form);
      if (hint) hint.textContent = "Votre messagerie s'ouvre avec le message prêt à envoyer.";
    });
  }

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
