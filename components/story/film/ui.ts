/**
 * THE SCREENS: what the people in the film see, drawn on canvases in the
 * site's own type (Inter) and colours. A phone (the customer's), a laptop
 * (the owner's), and the same screens lifted off them as cards in the air.
 * Every screen is a pure drawing of a small state; the card redraws only
 * when that state changes (cards.ts).
 *
 * Everything here is fictional and illustrative: the business is "Your
 * Business", the customer Sam, the other customers first names only, email
 * addresses at the reserved example domains, no phone numbers.
 */

export type Ctx = CanvasRenderingContext2D;

export const C = {
  paper: "#f6f5f2",
  white: "#ffffff",
  ink: "#0a0b10",
  ink2: "#3a3c44",
  mute: "#80838b",
  line: "#e6e4df",
  line2: "#d9d6cf",
  wash: "#efeeea",
  indigo: "#5b3df0",
  indigoL: "#ebe7fe",
  amber: "#e4812f",
  amberL: "#fdf0e3",
  red: "#d0453b",
  redL: "#fbe9e7",
  green: "#2f8f5b",
  greenL: "#e5f3ea",
  dark: "#14151a",
  dark2: "#22242b",
};

let FAM = "Inter, system-ui, sans-serif";
/** Read the page's Inter (next/font names it) once fonts are in. */
export function initFonts(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-inter").trim();
  if (v) FAM = `${v}, system-ui, sans-serif`;
  return document.fonts.ready.then(() => undefined);
}

export function font(ctx: Ctx, size: number, weight = 400) {
  ctx.font = `${weight} ${size}px ${FAM}`;
}

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill?: string | null, stroke?: string | null, lw = 1) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

type TextOpt = { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; track?: number };
export function text(ctx: Ctx, s: string, x: number, y: number, o: TextOpt = {}) {
  font(ctx, o.size ?? 14, o.weight ?? 400);
  ctx.fillStyle = o.color ?? C.ink;
  ctx.textAlign = o.align ?? "left";
  ctx.textBaseline = o.base ?? "alphabetic";
  if (o.track) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.track}px`;
  ctx.fillText(s, x, y);
  if (o.track) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  return ctx.measureText(s).width;
}

/** Wrap text into lines no wider than w; draw them from (x, y). Returns the height used. */
export function wrap(ctx: Ctx, s: string, x: number, y: number, w: number, lh: number, o: TextOpt = {}, maxLines = 99) {
  font(ctx, o.size ?? 14, o.weight ?? 400);
  const words = s.split(" ");
  let line = "";
  let n = 0;
  const out: string[] = [];
  for (const word of words) {
    const t = line ? `${line} ${word}` : word;
    if (ctx.measureText(t).width > w && line) {
      out.push(line);
      line = word;
    } else line = t;
  }
  if (line) out.push(line);
  for (const l of out.slice(0, maxLines)) {
    text(ctx, l, x, y + n * lh, o);
    n++;
  }
  return n * lh;
}

export function circle(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function avatar(ctx: Ctx, x: number, y: number, r: number, letters: string, bg: string, fg = "#fff") {
  circle(ctx, x, y, r, bg);
  text(ctx, letters, x, y + r * 0.36, { size: r * 0.95, weight: 600, color: fg, align: "center" });
}

export function button(ctx: Ctx, x: number, y: number, w: number, h: number, label: string, kind: "primary" | "ghost" | "soft" | "done" = "primary", size = 15) {
  const fill = kind === "primary" ? C.indigo : kind === "done" ? C.green : kind === "soft" ? C.indigoL : C.white;
  const fg = kind === "primary" || kind === "done" ? "#fff" : kind === "soft" ? C.indigo : C.ink;
  rr(ctx, x, y, w, h, h / 2, fill, kind === "ghost" ? C.line2 : null, 1.5);
  text(ctx, label, x + w / 2, y + h / 2 + size * 0.36, { size, weight: 600, color: fg, align: "center" });
}

export function check(ctx: Ctx, x: number, y: number, s: number, color: string, lw = 2.5) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y);
  ctx.lineTo(x - s * 0.12, y + s * 0.38);
  ctx.lineTo(x + s * 0.55, y - s * 0.4);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function star(ctx: Ctx, x: number, y: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr2 = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function spinner(ctx: Ctx, x: number, y: number, r: number, t: number, color = C.mute) {
  ctx.lineCap = "round";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.floor(t * 12) * ((Math.PI * 2) / 12);
    ctx.globalAlpha = 0.15 + 0.85 * (i / 11);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.strokeStyle = color;
    ctx.lineWidth = r * 0.18;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** A thin icon: an envelope. */
export function envelope(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, lw = 2) {
  rr(ctx, x, y, w, h, 3, null, color, lw);
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 3);
  ctx.lineTo(x + w / 2, y + h * 0.58);
  ctx.lineTo(x + w - 2, y + 3);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** The typed share of a string: n characters, and a caret if still typing. */
export function typed(s: string, n: number, caret: boolean) {
  const k = Math.max(0, Math.min(s.length, Math.floor(n)));
  return s.slice(0, k) + (caret && k < s.length ? "|" : "");
}

/* ------------------------------------------------------------------ */
/* PHONE (390 x 844 points, drawn at 2x)                                */
/* ------------------------------------------------------------------ */

export const PHONE = { w: 390, h: 844, s: 1.3 };

function statusBar(ctx: Ctx, time: string, dark = false) {
  const col = dark ? "#fff" : C.ink;
  text(ctx, time, 38, 34, { size: 16, weight: 600, color: col });
  // Signal, wifi, battery.
  for (let i = 0; i < 4; i++) rr(ctx, 290 + i * 6, 30 - i * 3, 4, 6 + i * 3, 1, col);
  ctx.beginPath();
  ctx.arc(325, 32, 8, -Math.PI * 0.78, -Math.PI * 0.22);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  rr(ctx, 340, 21, 24, 12, 3.5, null, col, 1.4);
  rr(ctx, 342, 23, 17, 8, 2, col);
}

function browserBar(ctx: Ctx, url: string, progress: number) {
  rr(ctx, 16, 54, 358, 40, 12, C.wash);
  text(ctx, url, 195, 79, { size: 15, color: C.ink2, align: "center" });
  if (progress > 0 && progress < 1) {
    ctx.fillStyle = C.indigo;
    ctx.fillRect(16, 96, 358 * progress, 3);
  }
}

/** Search results, our business among them; `tap` 0..1 a press on it. */
export function phoneSearch(ctx: Ctx, s: { time: string; tap: number; q: string }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  rr(ctx, 16, 56, 358, 46, 23, C.wash);
  ctx.beginPath();
  ctx.arc(42, 79, 7, 0, Math.PI * 2);
  ctx.strokeStyle = C.mute;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(47, 84);
  ctx.lineTo(53, 90);
  ctx.stroke();
  text(ctx, s.q, 62, 85, { size: 16, color: C.ink });
  const rows: [string, string, string, number][] = [
    ["Your Business", "Decks, fences and outdoor living", "4.8", 1],
    ["Coastline Outdoor", "Landscaping and decks", "4.4", 0],
    ["Deck and Fence Co.", "Builders in your area", "4.1", 0],
    ["Timber Works", "Renovations and decks", "4.6", 0],
  ];
  let y = 130;
  for (const [name, line, rating, ours] of rows) {
    const press = ours ? s.tap : 0;
    if (press > 0) rr(ctx, 10, y - 8, 370, 112, 16, `rgba(91,61,240,${0.08 * press})`);
    rr(ctx, 22, y + 4, 64, 64, 14, ours ? C.indigoL : C.wash);
    if (ours) {
      // A tiny deck: three boards.
      for (let i = 0; i < 3; i++) rr(ctx, 32, y + 22 + i * 11, 44, 7, 2, C.indigo);
    }
    text(ctx, name, 100, y + 24, { size: 17, weight: 600, color: C.ink });
    text(ctx, line, 100, y + 46, { size: 14, color: C.mute });
    star(ctx, 107, y + 64, 6, "#f2b33d");
    text(ctx, rating, 118, y + 69, { size: 13, weight: 600, color: C.ink2 });
    text(ctx, ours ? "Open until 5pm" : "Closed", 152, y + 69, { size: 13, color: ours ? C.green : C.mute });
    ctx.fillStyle = C.line;
    ctx.fillRect(22, y + 96, 352, 1);
    y += 112;
  }
}

/**
 * THE OLD WEBSITE, loading: `t` seconds since the tap. Blank, then the
 * header, then a hero image that takes its time, a pop-up, a wall of text,
 * and at the very bottom a small "Contact us". `scroll` 0..1 down the page.
 */
export function phoneSlowSite(ctx: Ctx, s: { time: string; t: number; scroll: number; popup: number; spin?: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  const prog = s.t < 0.2 ? 0 : Math.min(0.97, 1 - Math.exp(-s.t / 3.2));
  browserBar(ctx, "yourbusiness.example", s.t > 6.2 ? 1 : prog);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 100, PHONE.w, PHONE.h - 100);
  ctx.clip();
  if (s.t < 2.4) {
    // Nothing yet but white, and a spinner.
    spinner(ctx, 195, 440, 18, (s.spin ?? s.t * 12) / 12);
    text(ctx, `${Math.max(0, s.t).toFixed(1)} s`, 195, 492, { size: 14, color: C.mute, align: "center" });
  } else {
    const oy = 100 - s.scroll * 1400;
    // Header: a heavy bar, a logo in caps, a hamburger.
    ctx.fillStyle = "#2b2d33";
    ctx.fillRect(0, oy, PHONE.w, 64);
    text(ctx, "YOUR BUSINESS LTD", 20, oy + 40, { size: 17, weight: 700, color: "#fff", track: 1.5 });
    for (let i = 0; i < 3; i++) ctx.fillRect(338, oy + 24 + i * 8, 28, 3);
    // The hero image: grey, then "loading", then, after 5.5 s, a picture of a deck.
    const img = s.t > 5.6 ? 1 : 0;
    ctx.fillStyle = img ? "#c9b394" : "#e5e4e1";
    ctx.fillRect(0, oy + 64, PHONE.w, 300);
    if (!img) {
      spinner(ctx, 195, oy + 214, 14, (s.spin ?? s.t * 12) / 12, "#a5a6ab");
    } else {
      // A simple drawn photo: sky, a deck in perspective, a rail.
      const g = ctx.createLinearGradient(0, oy + 64, 0, oy + 364);
      g.addColorStop(0, "#bcd2e6");
      g.addColorStop(0.55, "#e9eef2");
      g.addColorStop(0.56, "#b88f62");
      g.addColorStop(1, "#8f6a44");
      ctx.fillStyle = g;
      ctx.fillRect(0, oy + 64, PHONE.w, 300);
      ctx.strokeStyle = "rgba(60,40,20,0.35)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(195 + (i - 4) * 18, oy + 230);
        ctx.lineTo(195 + (i - 4) * 70, oy + 364);
        ctx.stroke();
      }
    }
    // A wall of words.
    let y = oy + 400;
    text(ctx, "Welcome to our website!", 20, y, { size: 22, weight: 700, color: C.ink });
    y += 34;
    const blurb =
      "We are a family owned and operated business established many years ago. We pride ourselves on quality workmanship and customer service. We offer a wide range of services including decks, fences, pergolas, retaining walls, renovations, maintenance and much more. Please browse our website to find out more about what we do. Thank you for visiting.";
    y += wrap(ctx, blurb, 20, y, 350, 22, { size: 15, color: C.ink2 });
    y += 24;
    for (const h of ["Our Services", "Gallery", "Testimonials", "About Us", "News"]) {
      rr(ctx, 20, y, 350, 52, 4, C.wash);
      text(ctx, h, 36, y + 32, { size: 16, weight: 600, color: C.ink2 });
      text(ctx, "+", 350, y + 33, { size: 20, color: C.mute, align: "right" });
      y += 62;
    }
    y += 20;
    text(ctx, "Contact us", 20, y, { size: 12, color: "#3d6fd1" });
    ctx.fillStyle = "#3d6fd1";
    ctx.fillRect(20, y + 3, 60, 1);
    text(ctx, "© Your Business Ltd. All rights reserved.", 20, y + 26, { size: 11, color: C.mute });
  }
  ctx.restore();
  // The pop-up nobody asked for.
  if (s.popup > 0) {
    ctx.globalAlpha = s.popup;
    ctx.fillStyle = "rgba(10,11,16,0.45)";
    ctx.fillRect(0, 100, PHONE.w, PHONE.h - 100);
    rr(ctx, 30, 300, 330, 230, 14, C.white);
    text(ctx, "Sign up to our newsletter!", 195, 350, { size: 19, weight: 700, color: C.ink, align: "center" });
    text(ctx, "Get news and offers straight", 195, 382, { size: 15, color: C.ink2, align: "center" });
    text(ctx, "to your inbox.", 195, 403, { size: 15, color: C.ink2, align: "center" });
    rr(ctx, 56, 428, 278, 42, 6, C.wash);
    text(ctx, "Email address", 70, 455, { size: 14, color: C.mute });
    text(ctx, "No thanks", 195, 505, { size: 13, color: C.mute, align: "center" });
    text(ctx, "×", 340, 326, { size: 22, color: C.mute, align: "center" });
    ctx.globalAlpha = 1;
  }
}

/** The old contact form: many fields; the message typed out; then "sent". */
export function phoneOldForm(ctx: Ctx, s: { time: string; typed: number; sent: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  browserBar(ctx, "yourbusiness.example/contact", 0);
  text(ctx, "Contact Us", 20, 148, { size: 24, weight: 700, color: C.ink });
  text(ctx, "Fill in the form and we will get back to you.", 20, 174, { size: 14, color: C.mute });
  const fields: [string, string][] = [
    ["First name *", "Sam"],
    ["Email *", "sam@example.com"],
    ["Address", ""],
    ["How did you hear about us? *", "Search"],
  ];
  let y = 196;
  for (const [l, v] of fields) {
    text(ctx, l, 20, y + 16, { size: 13, weight: 600, color: C.ink2 });
    rr(ctx, 20, y + 24, 350, 40, 4, C.white, C.line2, 1.2);
    text(ctx, v, 32, y + 50, { size: 15, color: C.ink });
    y += 76;
  }
  text(ctx, "Message *", 20, y + 16, { size: 13, weight: 600, color: C.ink2 });
  rr(ctx, 20, y + 24, 350, 150, 4, C.white, s.sent > 0 ? C.line2 : C.indigo, s.sent > 0 ? 1.2 : 2);
  const msg = "Hi, could I get a quote for a new deck out the back? About 20 square metres. Thanks, Sam";
  wrap(ctx, typed(msg, s.typed, s.sent <= 0), 32, y + 50, 326, 22, { size: 15, color: C.ink });
  y += 190;
  // A checkbox to tick, and the button.
  rr(ctx, 20, y, 20, 20, 3, C.white, C.line2, 1.5);
  check(ctx, 30, y + 10, 12, C.ink2, 2);
  text(ctx, "I am not a robot", 50, y + 15, { size: 14, color: C.ink2 });
  y += 40;
  rr(ctx, 20, y, 350, 48, 4, s.sent > 0 ? C.green : "#2b2d33");
  text(ctx, s.sent > 0 ? "Sent" : "SUBMIT", 195, y + 30, { size: 15, weight: 700, color: "#fff", align: "center", track: 1 });
  if (s.sent > 0.4) {
    rr(ctx, 20, y + 64, 350, 56, 8, C.greenL);
    text(ctx, "Thank you. We will be in touch.", 195, y + 98, { size: 15, color: C.green, align: "center" });
  }
}

/** Waiting: the mail app's sent box, the time moving, nothing back. `checks` pulses a pull to refresh. */
export function phoneWaiting(ctx: Ctx, s: { time: string; refresh: number; sentAt: string; replyAt?: string; replyFrom?: string }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  text(ctx, "Inbox", 20, 100, { size: 32, weight: 700, color: C.ink });
  if (s.refresh > 0) spinner(ctx, 195, 132, 10, s.refresh * 3);
  let y = 150;
  if (s.replyAt) {
    rr(ctx, 10, y - 4, 370, 96, 14, C.indigoL);
    circle(ctx, 24, y + 22, 5, C.indigo);
    text(ctx, s.replyFrom ?? "Your Business", 38, y + 26, { size: 17, weight: 700, color: C.ink });
    text(ctx, s.replyAt, 370, y + 26, { size: 14, color: C.mute, align: "right" });
    text(ctx, "Re: Quote for a new deck", 38, y + 50, { size: 15, weight: 600, color: C.ink2 });
    text(ctx, "Hi Sam, sorry for the slow reply…", 38, y + 74, { size: 15, color: C.mute });
    y += 108;
  }
  const rows: [string, string, string][] = [
    ["Kindy newsletter", "Term four dates", "6:10pm"],
    ["Power company", "Your bill is ready", "4:22pm"],
    ["Sports club", "Training moved to Thursday", "1:05pm"],
    ["Online order", "Your parcel is on its way", "11:41am"],
  ];
  for (const [a, b, c] of rows) {
    text(ctx, a, 38, y + 26, { size: 17, weight: 600, color: C.ink });
    text(ctx, c, 370, y + 26, { size: 14, color: C.mute, align: "right" });
    text(ctx, b, 38, y + 50, { size: 15, color: C.mute });
    ctx.fillStyle = C.line;
    ctx.fillRect(38, y + 80, 340, 1);
    y += 92;
  }
  // The sent message, waiting.
  rr(ctx, 16, 690, 358, 110, 16, C.wash);
  text(ctx, "Sent", 34, 720, { size: 13, weight: 600, color: C.mute, track: 0.5 });
  text(ctx, s.sentAt, 356, 720, { size: 13, color: C.mute, align: "right" });
  text(ctx, "Quote for a new deck", 34, 748, { size: 16, weight: 600, color: C.ink });
  text(ctx, s.replyAt ? "Reply received" : "No reply yet", 34, 776, { size: 14, color: s.replyAt ? C.indigo : C.amber });
}

/** THE NEW WEBSITE: there at once, one clear button; `form` 0..1 the quote form opening, filling, sent. */
export function phoneFastSite(ctx: Ctx, s: { time: string; form: number; fill: number; sent: number; tap: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  browserBar(ctx, "yourbusiness.example", 0);
  if (s.form <= 0) {
    // Hero: a photo, the line, the button.
    const g = ctx.createLinearGradient(0, 104, 0, 424);
    g.addColorStop(0, "#d6e3ee");
    g.addColorStop(0.5, "#eef2f4");
    g.addColorStop(0.51, "#c49b6c");
    g.addColorStop(1, "#9c774f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 104, PHONE.w, 320);
    ctx.strokeStyle = "rgba(70,45,20,0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 11; i++) {
      ctx.beginPath();
      ctx.moveTo(195 + (i - 5) * 14, 268);
      ctx.lineTo(195 + (i - 5) * 66, 424);
      ctx.stroke();
    }
    text(ctx, "Decks built for", 22, 476, { size: 30, weight: 600, color: C.ink });
    text(ctx, "the way you live.", 22, 512, { size: 30, weight: 600, color: C.ink });
    text(ctx, "Free measure-up. Fixed-price quotes.", 22, 546, { size: 16, color: C.ink2 });
    const b = 1 - s.tap * 0.04;
    ctx.save();
    ctx.translate(195, 616);
    ctx.scale(b, b);
    button(ctx, -173, -30, 346, 60, "Get a free quote", "primary", 18);
    ctx.restore();
    for (const [i, l] of ["Measure-up within two days", "Photos and price in writing", "Local, licensed and insured"].entries()) {
      check(ctx, 32, 690 + i * 34, 14, C.indigo, 2.4);
      text(ctx, l, 50, 696 + i * 34, { size: 15, color: C.ink2 });
    }
    return;
  }
  // The quote form: three questions and a photo.
  text(ctx, "Get a free quote", 22, 150, { size: 26, weight: 600, color: C.ink });
  text(ctx, "Takes about a minute.", 22, 178, { size: 15, color: C.mute });
  const f = s.fill;
  const field = (y: number, label: string, value: string, k: number) => {
    text(ctx, label, 22, y, { size: 13, weight: 600, color: C.ink2 });
    rr(ctx, 22, y + 10, 346, 50, 12, C.white, k > 0 && k < 1 ? C.indigo : C.line2, k > 0 && k < 1 ? 2 : 1.2);
    text(ctx, typed(value, value.length * k, k > 0 && k < 1), 38, y + 42, { size: 16, color: C.ink });
  };
  rr(ctx, 22, 206, 346, 50, 12, C.indigoL);
  text(ctx, "New deck", 38, 238, { size: 16, weight: 600, color: C.indigo });
  text(ctx, "What do you need?", 22, 200, { size: 13, weight: 600, color: C.ink2 });
  field(290, "Roughly how big?", "About 20 square metres", Math.min(1, f * 3));
  field(380, "Your name", "Sam", Math.min(1, Math.max(0, f * 3 - 1)));
  field(470, "Email", "sam@example.com", Math.min(1, Math.max(0, f * 3 - 2)));
  text(ctx, "Photos (optional)", 22, 560, { size: 13, weight: 600, color: C.ink2 });
  rr(ctx, 22, 570, 96, 96, 12, f > 0.5 ? "#a39a8c" : C.wash);
  if (f > 0.5) {
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(22, 590 + i * 14);
      ctx.lineTo(118, 584 + i * 14);
      ctx.stroke();
    }
  }
  rr(ctx, 128, 570, 96, 96, 12, null, C.line2, 1.5);
  text(ctx, "+", 176, 628, { size: 28, color: C.mute, align: "center" });
  if (s.sent > 0) button(ctx, 22, 700, 346, 58, "Sent. We’ll reply in a moment.", "done", 16);
  else button(ctx, 22, 700, 346, 58, "Send", "primary", 17);
}

/** A message from the business: the auto reply with times to pick, or any thread. */
export function phoneReply(ctx: Ctx, s: { time: string; at: string; picked: number; show: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  text(ctx, "‹ Inbox", 18, 78, { size: 17, color: C.indigo });
  text(ctx, "Re: A new deck", 22, 132, { size: 24, weight: 600, color: C.ink });
  avatar(ctx, 44, 186, 22, "YB", C.indigo);
  text(ctx, "Your Business", 78, 182, { size: 16, weight: 600, color: C.ink });
  text(ctx, `to Sam · ${s.at}`, 78, 204, { size: 14, color: C.mute });
  const body = [
    "Hi Sam, thanks for getting in touch about a new deck.",
    "To give you a fixed price we’d like to measure up. It takes about 30 minutes and it’s free. Here are the next times we can come:",
  ];
  let y = 252;
  for (const p of body) {
    y += wrap(ctx, p, 22, y, 346, 24, { size: 16, color: C.ink2 }) + 14;
  }
  const times = ["Tue 9:00am", "Wed 2:00pm", "Thu 4:30pm"];
  times.forEach((t, i) => {
    const on = s.picked > 0 && i === 1;
    rr(ctx, 22, y + i * 62, 346, 50, 12, on ? C.indigo : C.white, on ? null : C.line2, 1.5);
    text(ctx, t, 44, y + i * 62 + 32, { size: 16, weight: 600, color: on ? "#fff" : C.ink });
    if (on) check(ctx, 340, y + i * 62 + 25, 16, "#fff", 2.6);
  });
  y += 200;
  if (s.picked > 0.5) {
    rr(ctx, 22, y, 346, 70, 14, C.greenL);
    text(ctx, "Booked: Wednesday, 2:00pm", 44, y + 30, { size: 16, weight: 600, color: C.green });
    text(ctx, "We’ll text you the day before.", 44, y + 54, { size: 14, color: C.green });
  } else wrap(ctx, "Or reply with a time that suits you. Questions about the job are welcome too.", 22, y + 4, 346, 22, { size: 15, color: C.mute });
  void s.show;
}

/** A document to agree to on the phone: the quote ("Accept") or the invoice ("Pay"). */
export function phoneDoc(ctx: Ctx, s: { time: string; kind: "quote" | "invoice"; done: number }) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  const q = s.kind === "quote";
  text(ctx, q ? "Quote" : "Invoice", 22, 112, { size: 15, weight: 600, color: C.mute, track: 0.5 });
  text(ctx, q ? "Your new deck" : "Your new deck", 22, 148, { size: 28, weight: 600, color: C.ink });
  rr(ctx, 16, 176, 358, 330, 16, C.white);
  const items: [string, string][] = q
    ? [
        ["Remove the old deck", "$650"],
        ["New deck, 20 m², pine", "$7,400"],
        ["Steps and planter box", "$900"],
      ]
    : [
        ["New deck, 20 m², as quoted", "$8,950"],
        ["Paid so far", "$0"],
      ];
  let y = 216;
  for (const [a, b] of items) {
    text(ctx, a, 36, y, { size: 15, color: C.ink2 });
    text(ctx, b, 354, y, { size: 15, weight: 600, color: C.ink, align: "right" });
    ctx.fillStyle = C.line;
    ctx.fillRect(36, y + 18, 318, 1);
    y += 46;
  }
  text(ctx, "Total incl. GST", 36, 470, { size: 15, weight: 600, color: C.ink });
  text(ctx, "$8,950", 354, 472, { size: 24, weight: 700, color: C.ink, align: "right" });
  text(ctx, q ? "Measured on Wednesday · Photos attached" : "Due in 7 days · Pay by card or bank", 22, 540, { size: 14, color: C.mute });
  if (s.done > 0) button(ctx, 22, 700, 346, 58, q ? "Accepted. Thank you!" : "Paid. Thank you!", "done", 17);
  else button(ctx, 22, 700, 346, 58, q ? "Accept quote" : "Pay $8,950", "primary", 17);
}

/** "How did we do?": five stars filling; then thanks. */
export function phoneReview(ctx: Ctx, s: { time: string; stars: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  avatar(ctx, 195, 210, 38, "YB", C.indigo);
  text(ctx, "Thanks, Sam.", 195, 300, { size: 28, weight: 600, color: C.ink, align: "center" });
  text(ctx, "How did we do with your deck?", 195, 336, { size: 17, color: C.ink2, align: "center" });
  for (let i = 0; i < 5; i++) {
    const on = s.stars > i + 0.5;
    const k = Math.max(0, Math.min(1, s.stars - i));
    const r = 22 + 4 * Math.sin(Math.min(1, k) * Math.PI);
    star(ctx, 195 + (i - 2) * 58, 410, r, on ? "#f2b33d" : C.wash, on ? undefined : C.line2);
  }
  if (s.stars >= 5) {
    rr(ctx, 30, 470, 330, 110, 14, C.wash);
    wrap(ctx, "“Tidy, on time, and they kept us posted the whole way. Love the new deck.”", 50, 506, 290, 24, { size: 16, color: C.ink2 });
    button(ctx, 30, 610, 330, 56, "Post review", "primary", 17);
  }
}

/** The follow-up a year on: a reminder, and a button to book. */
export function phoneFollow(ctx: Ctx, s: { time: string; booked: number; tap: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  text(ctx, "‹ Inbox", 18, 78, { size: 17, color: C.indigo });
  text(ctx, "A year on: your deck", 22, 132, { size: 24, weight: 600, color: C.ink });
  avatar(ctx, 44, 186, 22, "YB", C.indigo);
  text(ctx, "Your Business", 78, 182, { size: 16, weight: 600, color: C.ink });
  text(ctx, "to Sam · 9:00am", 78, 204, { size: 14, color: C.mute });
  let y = 254;
  y += wrap(ctx, "Hi Sam, it’s a year since we built your deck. Pine looks its best with an oil every year, before summer.", 22, y, 346, 24, { size: 16, color: C.ink2 }) + 14;
  y += wrap(ctx, "Want us to come and do it? It takes a morning.", 22, y, 346, 24, { size: 16, color: C.ink2 }) + 30;
  const b = 1 - s.tap * 0.04;
  ctx.save();
  ctx.translate(195, y + 29);
  ctx.scale(b, b);
  if (s.booked > 0) button(ctx, -173, -29, 346, 58, "Booked: Saturday, 9:00am", "done", 17);
  else button(ctx, -173, -29, 346, 58, "Book a time", "primary", 17);
  ctx.restore();
}

/** The competitor's search a year on (the old way): "deck oil near me". */
export function phoneSearchLater(ctx: Ctx, s: { time: string; tap: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PHONE.w, PHONE.h);
  statusBar(ctx, s.time);
  rr(ctx, 16, 56, 358, 46, 23, C.wash);
  text(ctx, "deck oiling near me", 62, 85, { size: 16, color: C.ink });
  const rows: [string, string, number][] = [
    ["Coastline Outdoor", "Deck oiling and repairs", 1],
    ["Deck and Fence Co.", "Builders in your area", 0],
    ["Timber Works", "Renovations and decks", 0],
  ];
  let y = 130;
  for (const [name, line, first] of rows) {
    if (first && s.tap > 0) rr(ctx, 10, y - 8, 370, 112, 16, `rgba(228,129,47,${0.1 * s.tap})`);
    rr(ctx, 22, y + 4, 64, 64, 14, C.wash);
    text(ctx, name, 100, y + 24, { size: 17, weight: 600, color: C.ink });
    text(ctx, line, 100, y + 46, { size: 14, color: C.mute });
    text(ctx, first ? "Sponsored" : "", 100, y + 69, { size: 13, color: C.mute });
    ctx.fillStyle = C.line;
    ctx.fillRect(22, y + 96, 352, 1);
    y += 112;
  }
  rr(ctx, 22, y + 10, 346, 80, 14, C.wash);
  wrap(ctx, "What was the name of the people who built it…?", 40, y + 44, 310, 22, { size: 15, color: C.mute });
}

/* ------------------------------------------------------------------ */
/* LAPTOP / CARDS (1280 x 800 points, drawn at 1x)                      */
/* ------------------------------------------------------------------ */

export const DESK = { w: 1280, h: 800, s: 1 };

export type Mail = { from: string; subject: string; at: string; kind: "lead" | "sam" | "noise"; lost?: boolean; flag?: boolean };

/** The night's mail, in the order it lands (the old way). */
export const NIGHT_MAIL: Mail[] = [
  { from: "Sam", subject: "Quote for a new deck?", at: "7:40pm", kind: "sam" },
  { from: "Timber supplier", subject: "Price changes from 1 November", at: "7:52pm", kind: "noise" },
  { from: "Bank", subject: "Your statement is ready", at: "8:15pm", kind: "noise" },
  { from: "Mei", subject: "Fence quote, are you free this week?", at: "8:31pm", kind: "lead", lost: true },
  { from: "Trade newsletter", subject: "Five decking trends for summer", at: "9:02pm", kind: "noise" },
  { from: "Jono", subject: "Re: bathroom timing", at: "9:40pm", kind: "noise" },
  { from: "Accounts", subject: "Invoice 0311 is overdue", at: "10:05pm", kind: "noise" },
  { from: "Priya", subject: "Can you build a pergola?", at: "10:48pm", kind: "lead", lost: true },
  { from: "Hardware store", subject: "Your order has shipped", at: "11:22pm", kind: "noise" },
  { from: "Council", subject: "Building consent update", at: "11:58pm", kind: "noise" },
  { from: "Webinar", subject: "Last chance to register", at: "12:30am", kind: "noise" },
  { from: "Tom", subject: "Quote please: retaining wall", at: "1:14am", kind: "lead", lost: true },
  { from: "Supplier", subject: "October statement", at: "2:02am", kind: "noise" },
  { from: "Phone company", subject: "Your bill is ready", at: "3:40am", kind: "noise" },
  { from: "Hemi", subject: "Deck repair, how soon could you come?", at: "5:55am", kind: "lead", lost: true },
  { from: "Insurance", subject: "Your renewal is coming up", at: "6:20am", kind: "noise" },
  { from: "Grace", subject: "Decking quote for a new build", at: "6:48am", kind: "lead", lost: true },
  { from: "Trade newsletter", subject: "Weekend sale on fixings", at: "7:05am", kind: "noise" },
  { from: "Bank", subject: "Payment received", at: "7:30am", kind: "noise" },
  { from: "Liam", subject: "Following up on my enquiry", at: "8:02am", kind: "lead", lost: true },
  { from: "Supplier", subject: "Your delivery is booked for Thursday", at: "8:40am", kind: "noise" },
  { from: "Ana", subject: "Are you taking on new jobs?", at: "8:55am", kind: "lead", lost: true },
];

/**
 * One email as a strip (the inbox column): drawn into a row of an atlas.
 * `state`: 0 unread, 1 read, 2 gone cold (the customer went elsewhere).
 */
export function mailStrip(ctx: Ctx, x: number, y: number, w: number, h: number, m: Mail, state: number) {
  const cold = state === 2;
  const sam = m.kind === "sam";
  rr(ctx, x + 2, y + 2, w - 4, h - 4, 14, cold ? "#eceae6" : sam ? "#fff6ec" : C.white, sam ? "#f0b98a" : null, 3);
  const k = h / 80;
  if (!cold && state === 0) circle(ctx, x + 26 * k, y + h / 2, 7 * k, sam ? C.amber : m.kind === "lead" ? C.indigo : "#b9bbc1");
  const col = cold ? "#a5a7ad" : C.ink;
  text(ctx, m.from, x + 48 * k, y + 34 * k, { size: 22 * k, weight: state === 0 ? 700 : 500, color: col });
  text(ctx, m.at, x + w - 24 * k, y + 34 * k, { size: 19 * k, color: cold ? "#b5b7bc" : C.mute, align: "right" });
  text(ctx, m.subject, x + 48 * k, y + 62 * k, { size: 19 * k, color: cold ? "#b5b7bc" : C.ink2 });
  if (cold) text(ctx, "Went elsewhere", x + w - 24 * k, y + 62 * k, { size: 17 * k, weight: 600, color: C.red, align: "right" });
}

/** The laptop's mail client (the inbox and the open message). */
export function deskInbox(ctx: Ctx, s: { unread: number; open: number; typed: number; time: string; sent: number }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, DESK.w, DESK.h);
  // Sidebar.
  ctx.fillStyle = "#f3f2ef";
  ctx.fillRect(0, 0, 230, DESK.h);
  text(ctx, "Mail", 28, 54, { size: 22, weight: 700, color: C.ink });
  const side: [string, string][] = [
    ["Inbox", String(s.unread)],
    ["Sent", ""],
    ["Drafts", "3"],
    ["Quotes", ""],
    ["Invoices", ""],
  ];
  side.forEach(([l, n], i) => {
    if (i === 0) rr(ctx, 14, 82, 202, 40, 10, "#e6e4df");
    text(ctx, l, 30, 108 + i * 46, { size: 17, weight: i === 0 ? 600 : 400, color: C.ink2 });
    if (n) text(ctx, n, 200, 108 + i * 46, { size: 15, weight: 600, color: i === 0 ? C.amber : C.mute, align: "right" });
  });
  // The list.
  ctx.fillStyle = C.line;
  ctx.fillRect(230, 0, 1, DESK.h);
  ctx.fillRect(620, 0, 1, DESK.h);
  text(ctx, "Inbox", 254, 54, { size: 22, weight: 700, color: C.ink });
  text(ctx, `${s.unread} unread`, 596, 54, { size: 15, color: C.amber, align: "right" });
  const list = NIGHT_MAIL.slice().reverse();
  list.slice(0, 9).forEach((m, i) => {
    const y = 80 + i * 78;
    mailStrip(ctx, 236, y, 378, 76, m, m.lost ? 2 : 0);
  });
  // The open message, the reply being typed.
  if (s.open > 0) {
    text(ctx, "Quote for a new deck?", 652, 70, { size: 24, weight: 600, color: C.ink });
    avatar(ctx, 672, 120, 20, "S", C.amber);
    text(ctx, "Sam", 702, 116, { size: 16, weight: 600, color: C.ink });
    text(ctx, "sam@example.com · yesterday, 7:40pm", 702, 138, { size: 14, color: C.mute });
    wrap(ctx, "Hi, could I get a quote for a new deck out the back? About 20 square metres. Thanks, Sam", 652, 186, 590, 26, { size: 17, color: C.ink2 });
    rr(ctx, 652, 290, 596, 230, 12, C.white, s.sent > 0 ? C.line : C.indigo, 2);
    const reply = "Hi Sam, sorry for the slow reply. Happy to quote. When suits for us to come and measure up? Cheers";
    wrap(ctx, typed(reply, s.typed, s.sent <= 0), 672, 326, 556, 26, { size: 17, color: C.ink });
    if (s.sent > 0) button(ctx, 652, 540, 160, 46, "Sent 9:13am", "done", 15);
    else button(ctx, 652, 540, 120, 46, "Send", "primary", 15);
  }
}

/** THE SPREADSHEET: the jobs, a row for Sam typed in cell by cell (`typed` counts characters across the row). */
export const SHEET_ROWS: string[][] = [
  ["12 Oct", "Aroha", "aroha@example.com", "Fence", "$3,200", "Paid"],
  ["14 Oct", "Jono", "jono@example.net", "Bathroom", "$11,400", "Waiting"],
  ["15 Oct", "Kiri", "kiri@exmaple.com", "Fence", "$2,800", "No reply"],
  ["17 Oct", "Ben", "ben@example.org", "Retaining", "not sent", ""],
  ["18 Oct", "Lucy", "lucy@example.com", "Pergola", "$6,100", "Waiting"],
  ["19 Oct", "Ravi", "ravi@example.net", "Repair", "$900", "Paid"],
  ["21 Oct", "Nina", "nina@example.com", "Deck", "not sent", ""],
  ["22 Oct", "Oscar", "oscar@example.org", "Deck", "$9,300", "Waiting"],
];
/** The rows that go cold in the admin (their customers hear nothing, or never get the quote). */
export const SHEET_COLD = [2, 3, 6];
export const SAM_ROW = ["24 Oct", "Sam", "sam@example.com", "Deck, 20 m²", "$8,950", "Quoted"];

export function sheet(ctx: Ctx, s: { typed: number; paid: number; scroll: number; lost: number; extra: number; highlight: number; cold?: number; status?: string }) {
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, DESK.w, DESK.h);
  // Toolbar.
  ctx.fillStyle = "#f3f2ef";
  ctx.fillRect(0, 0, DESK.w, 64);
  text(ctx, "Jobs 2026.xlsx", 28, 40, { size: 20, weight: 600, color: C.ink });
  text(ctx, "Saved", 1250, 40, { size: 15, color: C.mute, align: "right" });
  const cols = [0, 110, 250, 520, 720, 880, 1040, DESK.w];
  const head = ["Date", "Name", "Email", "Job", "Quote", "Status"];
  ctx.fillStyle = "#faf9f7";
  ctx.fillRect(0, 64, DESK.w, 46);
  head.forEach((h, i) => text(ctx, h, cols[i] + 16, 94, { size: 15, weight: 600, color: C.mute }));
  ctx.fillStyle = C.line2;
  ctx.fillRect(0, 110, DESK.w, 1);
  for (let i = 1; i < cols.length - 1; i++) ctx.fillRect(cols[i], 64, 1, DESK.h);
  const rowH = 54;
  // Rows above Sam's (newer jobs land on top as time goes on: `extra` of them).
  const filler = ["Kate", "Rob", "Nikau", "Leah", "Sione", "Ruth", "Ben", "Mia", "Ari", "Zoe", "Tama", "Eve"];
  const rows: string[][] = [];
  for (let i = 0; i < Math.floor(s.extra); i++) rows.push([`${(i % 27) + 1} ${["Nov", "Dec", "Jan", "Feb", "Mar"][Math.floor(i / 3) % 5]}`, filler[i % filler.length], `${filler[i % filler.length].toLowerCase()}@example.com`, ["Deck", "Fence", "Pergola", "Repair"][i % 4], `$${(2 + (i * 7) % 9) * 1000 + 450}`, i % 3 === 0 ? "Paid" : "Waiting"]);
  rows.reverse();
  const samIdx = rows.length;
  rows.push(SAM_ROW);
  rows.push(...SHEET_ROWS.slice().reverse());
  const y0 = 110 - s.scroll * rowH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 111, DESK.w, DESK.h - 111);
  ctx.clip();
  rows.forEach((r, i) => {
    const y = y0 + i * rowH;
    if (y > DESK.h || y + rowH < 110) return;
    const sam = i === samIdx;
    if (sam && s.highlight > 0) {
      ctx.fillStyle = `rgba(228,129,47,${0.12 * s.highlight})`;
      ctx.fillRect(0, y, DESK.w, rowH);
    }
    let left = sam ? s.typed : 999;
    const coldIdx = i - samIdx - 1;
    const coldK = !sam && coldIdx >= 0 && SHEET_COLD.includes(SHEET_ROWS.length - 1 - coldIdx) ? Math.max(0, Math.min(1, (s.cold ?? 0) * 3 - SHEET_COLD.indexOf(SHEET_ROWS.length - 1 - coldIdx))) : 0;
    if (coldK > 0) {
      ctx.fillStyle = `rgba(236,234,230,${coldK})`;
      ctx.fillRect(0, y, DESK.w, rowH);
    }
    ctx.globalAlpha = 1 - coldK * 0.55;
    r.forEach((v, j) => {
      let val = v;
      if (sam) {
        if (j === 5) val = s.paid > 0 ? "Paid" : s.status && left > 0 ? s.status : left > 0 ? v : "";
      }
      if (coldK > 0.5 && j === 5) val = "Went elsewhere";
      if (sam) {
        const n = Math.min(v.length, Math.max(0, left));
        if (j !== 5) val = v.slice(0, n);
        left -= v.length;
      }
      const isStatus = j === 5;
      const isNot = v === "not sent";
      const typo = v.includes("exmaple");
      if (isStatus && val) {
        const c = val === "Paid" ? [C.greenL, C.green] : val === "No reply" || val === "Went elsewhere" ? [C.redL, C.red] : val === "Quoted" ? [C.amberL, C.amber] : val === "Accepted" ? [C.indigoL, C.indigo] : [C.wash, C.ink2];
        const bw = val === "Went elsewhere" ? 150 : 110;
        rr(ctx, cols[j] + 12, y + 12, bw, 30, 15, c[0]);
        text(ctx, val, cols[j] + 12 + bw / 2, y + 33, { size: 14, weight: 600, color: c[1], align: "center" });
      } else text(ctx, val, cols[j] + 16, y + 34, { size: 15, color: isNot ? C.amber : typo ? C.red : sam ? C.ink : C.ink2, weight: sam ? 600 : 400 });
      if (typo && s.lost > 0) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let xx = cols[j] + 16; xx < cols[j] + 200; xx += 6) ctx.lineTo(xx, y + 40 + ((xx / 6) % 2) * 3);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.line;
    ctx.fillRect(0, y + rowH, DESK.w, 1);
  });
  ctx.restore();
}

/** A job waiting on the owner (the 11:47pm clutter). */
export function pending(ctx: Ctx, s: { tag: string; title: string; line: string; tone: "amber" | "red" | "ink" }) {
  const W = DESK.w;
  const H = DESK.h;
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);
  const tone = s.tone === "red" ? [C.redL, C.red] : s.tone === "amber" ? [C.amberL, C.amber] : [C.wash, C.ink2];
  rr(ctx, 64, 64, 300, 64, 32, tone[0]);
  text(ctx, s.tag, 214, 106, { size: 26, weight: 700, color: tone[1], align: "center" });
  text(ctx, s.title, 64, 260, { size: 64, weight: 700, color: C.ink });
  wrap(ctx, s.line, 64, 340, W - 128, 50, { size: 38, color: C.ink2 });
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = C.wash;
    ctx.fillRect(64, 480 + i * 56, W - 128 - (i % 2) * 260, 22);
  }
  void H;
}

/** A document card: the quote or the invoice, typed out (old) or filled at once (new). */
export function docCard(ctx: Ctx, s: { kind: "quote" | "invoice"; typed: number; stamp: number; auto: boolean; sent: number }) {
  const W = DESK.w;
  const H = DESK.h;
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);
  const q = s.kind === "quote";
  text(ctx, q ? "QUOTE" : "INVOICE", 64, 96, { size: 40, weight: 700, color: C.ink, track: 3 });
  text(ctx, q ? "Q-1042" : "INV-0318", 64, 132, { size: 18, color: C.mute });
  text(ctx, "Your Business", W - 64, 84, { size: 22, weight: 700, color: C.ink, align: "right" });
  text(ctx, "hello@yourbusiness.example", W - 64, 112, { size: 16, color: C.mute, align: "right" });
  ctx.fillStyle = C.line;
  ctx.fillRect(64, 160, W - 128, 2);
  // The customer's details: typed letter by letter (old) or there already (new).
  const lines: [string, string][] = [
    ["Prepared for", "Sam"],
    ["Email", "sam@example.com"],
    ["Job", "New deck, about 20 m², out the back"],
  ];
  let left = s.auto ? 999 : s.typed;
  let y = 214;
  for (const [l, v] of lines) {
    text(ctx, l, 64, y, { size: 17, color: C.mute });
    const n = Math.max(0, Math.min(v.length, left));
    left -= v.length;
    const caret = !s.auto && n > 0 && n < v.length;
    text(ctx, v.slice(0, n) + (caret ? "|" : ""), 280, y, { size: 19, weight: 600, color: C.ink });
    if (!s.auto && n === 0 && left < 0) {
      rr(ctx, 278, y - 22, 260, 30, 4, null, C.line2, 1.5);
    }
    y += 46;
  }
  ctx.fillStyle = C.line;
  ctx.fillRect(64, y, W - 128, 1);
  y += 46;
  const items: [string, string][] = q
    ? [
        ["Remove the old deck", "$650.00"],
        ["New deck, 20 m², treated pine", "$7,400.00"],
        ["Steps and planter box", "$900.00"],
      ]
    : [["New deck, as quoted (Q-1042)", "$8,950.00"]];
  const show = s.auto ? 99 : Math.max(0, Math.floor((s.typed - 60) / 18));
  items.slice(0, show).forEach(([a, b]) => {
    text(ctx, a, 64, y, { size: 19, color: C.ink2 });
    text(ctx, b, W - 64, y, { size: 19, weight: 600, color: C.ink, align: "right" });
    y += 44;
  });
  if (show >= items.length || s.auto) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(W - 420, y, 356, 2);
    text(ctx, "Total incl. GST", W - 420, y + 44, { size: 19, weight: 600, color: C.ink });
    text(ctx, "$8,950.00", W - 64, y + 46, { size: 30, weight: 700, color: C.ink, align: "right" });
  }
  if (s.auto) {
    rr(ctx, 64, H - 112, 360, 52, 26, C.indigoL);
    text(ctx, "Filled in from Sam’s enquiry", 244, H - 79, { size: 17, weight: 600, color: C.indigo, align: "center" });
  }
  if (s.sent > 0) {
    rr(ctx, W - 300, H - 112, 236, 52, 26, s.auto ? C.indigo : C.ink);
    text(ctx, q ? "Quote sent" : "Invoice sent", W - 182, H - 79, { size: 17, weight: 600, color: "#fff", align: "center" });
  }
  if (s.stamp > 0) {
    // PAID: an ink stamp (old) or a tick and a time (new).
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.stamp * 1.4);
    if (s.auto) {
      rr(ctx, W - 420, 200, 356, 92, 18, C.greenL);
      check(ctx, W - 380, 246, 26, C.green, 4);
      text(ctx, "Paid online", W - 346, 240, { size: 24, weight: 700, color: C.green });
      text(ctx, "Thursday, 2:14pm", W - 346, 270, { size: 17, color: C.green });
    } else {
      ctx.translate(W - 240, 250);
      ctx.rotate(-0.18);
      const sc = 1 + 0.6 * (1 - Math.min(1, s.stamp * 3));
      ctx.scale(sc, sc);
      rr(ctx, -150, -52, 300, 104, 12, null, C.red, 7);
      text(ctx, "PAID", 0, 26, { size: 70, weight: 800, color: C.red, align: "center", track: 6 });
    }
    ctx.restore();
  }
}

/** THE CALENDAR (the owner's week): jobs in grey, bookings as they land in indigo. */
export type Booking = { day: number; h: number; len: number; label: string; who: string; at: number; auto?: boolean };
export function calendar(ctx: Ctx, s: { bookings: Booking[]; now: number; week: string }) {
  const W = DESK.w;
  const H = DESK.h;
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);
  text(ctx, s.week, 40, 64, { size: 26, weight: 700, color: C.ink });
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const x0 = 110;
  const dw = (W - x0 - 30) / 5;
  const y0 = 120;
  const hh = (H - y0 - 20) / 10;
  days.forEach((d, i) => text(ctx, d, x0 + dw * i + 14, 104, { size: 16, weight: 600, color: C.mute }));
  for (let h = 0; h <= 10; h++) {
    ctx.fillStyle = C.line;
    ctx.fillRect(x0, y0 + h * hh, W - x0 - 30, 1);
    if (h < 10) text(ctx, `${((7 + h) % 12) + 1}${7 + h + 1 < 12 ? "am" : "pm"}`, x0 - 16, y0 + h * hh + 6, { size: 13, color: C.mute, align: "right" });
  }
  for (let i = 0; i <= 5; i++) ctx.fillRect(x0 + dw * i, y0, 1, H - y0 - 20);
  for (const b of s.bookings) {
    const k = Math.max(0, Math.min(1, (s.now - b.at) / 0.12));
    if (k <= 0) continue;
    const x = x0 + dw * b.day + 6;
    const y = y0 + (b.h - 8) * hh + 3;
    const fresh = b.auto ? 1 : 0;
    ctx.save();
    ctx.globalAlpha = k;
    rr(ctx, x, y, dw - 12, b.len * hh - 6, 10, fresh ? C.indigo : "#e3e1dc");
    text(ctx, b.label, x + 14, y + 26, { size: 15, weight: 600, color: fresh ? "#fff" : C.ink2 });
    text(ctx, b.who, x + 14, y + 48, { size: 14, color: fresh ? "rgba(255,255,255,0.8)" : C.mute });
    ctx.restore();
  }
}

/** The assistant's handover: a question it can't answer, put in front of the owner for the morning. */
export function handover(ctx: Ctx, s: { show: number }) {
  const W = DESK.w;
  const H = DESK.h;
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 48, 48, 260, 46, 23, C.amberL);
  text(ctx, "Over to you", 178, 79, { size: 19, weight: 700, color: C.amber, align: "center" });
  text(ctx, "Aroha · 3:12am", 48, 156, { size: 22, weight: 600, color: C.ink });
  wrap(ctx, "“Do I need council consent for a deck that’s over a metre off the ground?”", 48, 206, W - 96, 36, { size: 26, color: C.ink2 });
  ctx.fillStyle = C.line;
  ctx.fillRect(48, 330, W - 96, 1);
  text(ctx, "The assistant replied:", 48, 380, { size: 18, weight: 600, color: C.mute });
  wrap(ctx, "“Good question. That depends on your site, so I’ve passed it to the team. You’ll hear back by 10am. Meanwhile, here are times for a free measure-up.”", 48, 420, W - 96, 32, { size: 22, color: C.ink2 });
  void s.show;
}

/** The owner's day, at six: what was handled. */
export function today(ctx: Ctx, s: { n: number }) {
  const W = DESK.w;
  const H = DESK.h;
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);
  text(ctx, "Today", 56, 92, { size: 40, weight: 700, color: C.ink });
  text(ctx, "Nothing is waiting on you.", 56, 136, { size: 22, color: C.green });
  const rows: [string, string][] = [
    ["Enquiries answered", "6"],
    ["Measure-ups booked", "3"],
    ["Quotes accepted", "2"],
    ["Invoices paid", "2"],
    ["Reviews", "1"],
  ];
  rows.forEach(([a, b], i) => {
    const y = 210 + i * 104;
    const k = Math.max(0, Math.min(1, s.n - i));
    ctx.globalAlpha = 0.25 + 0.75 * k;
    rr(ctx, 56, y, W - 112, 84, 16, C.paper);
    text(ctx, a, 88, y + 52, { size: 24, color: C.ink2 });
    text(ctx, b, W - 92, y + 56, { size: 38, weight: 700, color: C.indigo, align: "right" });
    ctx.globalAlpha = 1;
  });
  void H;
}

/** A label on a node of the new system (Website, Reply, Booking, Quote, Invoice, Follow-up). */
export function nodeLabel(ctx: Ctx, w: number, h: number, title: string, line: string, icon: number) {
  ctx.clearRect(0, 0, w, h);
  rr(ctx, 4, 4, w - 8, h - 8, 28, "rgba(255,255,255,0.96)");
  rr(ctx, 26, 26, h - 52, h - 52, 18, C.indigoL);
  const cx = 26 + (h - 52) / 2;
  const cy = h / 2;
  ctx.strokeStyle = C.indigo;
  ctx.fillStyle = C.indigo;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const r = (h - 52) * 0.26;
  ctx.beginPath();
  if (icon === 0) {
    rr(ctx, cx - r, cy - r * 0.8, r * 2, r * 1.6, 6, null, C.indigo, 4);
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.35);
    ctx.lineTo(cx + r, cy - r * 0.35);
    ctx.stroke();
  } else if (icon === 1) {
    envelope(ctx, cx - r, cy - r * 0.7, r * 2, r * 1.4, C.indigo, 4);
  } else if (icon === 2) {
    rr(ctx, cx - r, cy - r * 0.8, r * 2, r * 1.7, 6, null, C.indigo, 4);
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.3);
    ctx.lineTo(cx + r, cy - r * 0.3);
    ctx.stroke();
    ctx.fillRect(cx - r * 0.5, cy + r * 0.1, r * 0.4, r * 0.4);
  } else if (icon === 3 || icon === 4) {
    ctx.moveTo(cx - r * 0.75, cy - r);
    ctx.lineTo(cx + r * 0.45, cy - r);
    ctx.lineTo(cx + r * 0.75, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.75, cy + r);
    ctx.lineTo(cx - r * 0.75, cy + r);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.4, cy - r * 0.2);
    ctx.moveTo(cx - r * 0.4, cy + r * 0.25);
    ctx.lineTo(cx + r * 0.2, cy + r * 0.25);
    ctx.stroke();
    if (icon === 4) {
      ctx.beginPath();
      ctx.arc(cx + r * 0.7, cy + r * 0.8, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.stroke();
      text(ctx, "$", cx + r * 0.7, cy + r * 0.98, { size: r * 0.6, weight: 700, color: C.indigo, align: "center" });
    }
  } else {
    ctx.arc(cx, cy, r, -0.3, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.95, cy - r * 0.6);
    ctx.lineTo(cx + r * 1.02, cy - r * 0.02);
    ctx.lineTo(cx + r * 0.45, cy - r * 0.15);
    ctx.stroke();
  }
  text(ctx, title, h + 6, h / 2 - 4, { size: h * 0.25, weight: 700, color: C.ink });
  text(ctx, line, h + 6, h / 2 + h * 0.22, { size: h * 0.16, color: C.mute });
}
