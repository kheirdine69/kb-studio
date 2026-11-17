/* KB Studio : interactions sobres */
(() => {
  const html = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Titres découpés en mots ---------- */
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

  /* ---------- Entrée de page ---------- */
  $(".loader")?.remove();
  const start = () => {
    body.classList.add("ready");
    $$(".hero [data-split], .hero .reveal, .contact-hero [data-split], .contact-hero .reveal").forEach((el) => el.classList.add("in"));
  };
  requestAnimationFrame(() => setTimeout(start, 120));

  /* ---------- Apparitions au défilement ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );
  $$(".reveal, [data-split]").forEach((el) => {
    if (!el.closest(".hero, .contact-hero")) io.observe(el);
  });
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((c, i) => c.style.setProperty("--d", i * 90 + "ms"));
  });

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

  /* ---------- Défilement : barre, navigation, frise ---------- */
  const progress = $(".progress");
  const heroArt = $(".hero-art");
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
    if (heroArt && y < innerHeight * 1.2) heroArt.style.setProperty("--sy", `${(y * -0.1).toFixed(1)}px`);
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
        c.style.setProperty("--d", calm.matches ? "0" : d.toFixed(3));
        c.style.opacity = (1 - a * 0.55).toFixed(3);
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
      cards.forEach((c) => { c.style.opacity = ""; c.style.removeProperty("--d"); });
      bar.style.transform = "";
    };

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

    const layout = () => {
      if (!wide.matches) { unpin(); onSwipe(); return; }
      hs.classList.add("is-pinned");
      const vw = document.documentElement.clientWidth;
      // La carte s'adapte à l'écran : plus grande sur grand moniteur, réduite sur écran court
      const k = Math.max(0.6, Math.min(1.5, (innerHeight - 120) / 640, (vw * 0.8) / 1080));
      hs.style.setProperty("--k", k.toFixed(3));
      track.style.transform = "none";
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
