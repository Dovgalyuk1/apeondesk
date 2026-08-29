/* ==========================================================================
   $DESK — ApeOnDesk
   Fill in CONFIG once the token is minted / socials go live — every link,
   copy button and live stat on the page reads from this object.
   ========================================================================== */

const CONFIG = {
  CA: "", // e.g. "3fH9...pump" — leave empty to show "NOT MINTED YET"
  CHART_URL: "", // Dexscreener / pump.fun chart link
  BUY_URL: "", // Jupiter / Raydium / pump.fun buy link
  X_URL: "", // https://x.com/apeondesk
  TELEGRAM_URL: "", // https://t.me/apeondesk
};

/* ---------------- Boot screen ---------------- */

const bootLines = [
  "ACCESSING OTC LIBRARY TERMINAL...",
  "CARD CATALOG: LOCATED",
  "LOADING BOOK...",
  "DESK STATUS: OCCUPIED",
  "",
  "  $DESK PROTOCOL v1.0",
  "  ApeOnDesk — he put the phone down.",
  "",
  "READY.",
];

function typeBoot() {
  const el = document.getElementById("boot-text");
  if (!el) return;
  let out = "";
  let line = 0, char = 0;

  function step() {
    if (line >= bootLines.length) return;
    const current = bootLines[line];
    if (char <= current.length) {
      out = bootLines.slice(0, line).join("\n") + (line > 0 ? "\n" : "") + current.slice(0, char);
      el.textContent = out;
      char++;
      setTimeout(step, current.length === 0 ? 60 : 14);
    } else {
      line++;
      char = 0;
      setTimeout(step, 90);
    }
  }
  step();
}

function hideBoot() {
  const boot = document.getElementById("boot-screen");
  if (!boot || boot.classList.contains("hidden")) return;
  boot.classList.add("hidden");
  document.removeEventListener("keydown", hideBoot);
  boot.removeEventListener("click", hideBoot);
}

(function initBoot() {
  typeBoot();
  const boot = document.getElementById("boot-screen");
  if (!boot) return;
  boot.addEventListener("click", hideBoot);
  document.addEventListener("keydown", hideBoot);
  setTimeout(hideBoot, 4500);
})();

/* ---------------- Ticker ---------------- */

(function initTicker() {
  const track = document.getElementById("ticker-track");
  if (!track) return;
  const items = [
    "0% TAX",
    "LIQUIDITY BURNED",
    "CONTRACT RENOUNCED",
    "HE PUT THE PHONE DOWN",
    "NOW HE RUNS THE BOOK",
    "$FONE → $DESK",
    "EVERY DESK KEEPS ITS OWN LEDGER",
    "SILENCE IN THE READING ROOM",
    "$DESK",
  ];
  const html = items.map((t) => `<span>${t}</span>`).join('<span style="opacity:.4"> · </span>');
  track.innerHTML = html + '<span style="opacity:.4"> · </span>' + html;
})();

/* ---------------- Nav burger ---------------- */

(function initNav() {
  const burger = document.getElementById("nav-burger");
  const links = document.getElementById("nav-links");
  if (!burger || !links) return;
  burger.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
})();

/* ---------------- Toast ---------------- */

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------------- Placeholder links ---------------- */

document.querySelectorAll("[data-link]").forEach((el) => {
  el.addEventListener("click", (e) => {
    const key = el.getAttribute("data-link");
    const url = CONFIG[key];
    if (url) {
      window.open(url, "_blank", "noopener");
    } else {
      e.preventDefault();
      showToast("Coming soon — link goes live at launch");
    }
  });
});

/* ---------------- CA copy ---------------- */

function wireCopy(valueId, buttonId) {
  const valueEl = document.getElementById(valueId);
  const btn = document.getElementById(buttonId);
  if (!valueEl || !btn) return;
  valueEl.textContent = CONFIG.CA || "NOT MINTED YET";
  btn.addEventListener("click", async () => {
    if (!CONFIG.CA) {
      showToast("No contract yet — check back at launch");
      return;
    }
    try {
      await navigator.clipboard.writeText(CONFIG.CA);
      showToast("Contract address copied");
    } catch (err) {
      showToast("Copy failed — select the address manually");
    }
  });
}

wireCopy("ca-value", "ca-copy");
wireCopy("ca-value-footer", "ca-copy-footer");

/* ---------------- Sound toggle (simple synth beeps, off by default) ---------------- */

let audioCtx = null;
let soundOn = false;

function beep(freq = 440, duration = 0.06, type = "square", gain = 0.03) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    /* audio unsupported — fail silently */
  }
}

(function initSound() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    soundOn = !soundOn;
    btn.textContent = soundOn ? "🔊" : "🔇";
    if (soundOn) beep(660, 0.08, "square", 0.04);
  });
  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", () => beep(420, 0.04, "square", 0.02));
  });
})();

/* ---------------- Live stats (DexScreener) or simulated fallback ---------------- */

function formatUsd(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "N/A";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  if (n >= 1) return "$" + n.toFixed(2);
  return "$" + n.toPrecision(3);
}

function setStat(field, value) {
  document.querySelectorAll(`[data-field="${field}"]`).forEach((el) => (el.textContent = value));
}

async function fetchLive() {
  if (!CONFIG.CA) {
    // No contract yet — leave the simulated placeholder numbers running.
    runSimulatedStats();
    return;
  }
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CA}`);
    const data = await res.json();
    const pair = data && data.pairs && data.pairs[0];
    if (!pair) throw new Error("no pair found");

    setStat("price", pair.priceUsd ? "$" + Number(pair.priceUsd).toPrecision(4) : "N/A");
    setStat("mcap", pair.fdv ? formatUsd(pair.fdv) : "N/A");
    setStat("liquidity", pair.liquidity && pair.liquidity.usd ? formatUsd(pair.liquidity.usd) : "N/A");
    setStat("volume", pair.volume && pair.volume.h24 ? formatUsd(pair.volume.h24) : "N/A");

    const note = document.getElementById("catalog-note");
    if (note) note.textContent = "Live from DexScreener. Updates every 30s.";
  } catch (err) {
    const note = document.getElementById("catalog-note");
    if (note) note.textContent = "Couldn't reach DexScreener right now — showing last known / placeholder values.";
    runSimulatedStats();
  }
}

let simStarted = false;
function runSimulatedStats() {
  if (simStarted) return;
  simStarted = true;
  // Purely cosmetic placeholder numbers, clearly labeled as simulated in the
  // note under the card catalog — swap CONFIG.CA once minted for real data.
  setStat("desks", "128");
  let quiet = ["SILENT", "SILENT", "SILENT", "1 WHISPER"];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % quiet.length;
    setStat("quiet", quiet[i]);
  }, 4000);
}

fetchLive();
if (CONFIG.CA) {
  setInterval(fetchLive, 30000);
}
