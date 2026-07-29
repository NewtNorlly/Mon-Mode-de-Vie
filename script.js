/* ═══════════════════════════════════════════════
   Mon Mode de Vie — script.js (rebuild 2026-07-29)
   ═══════════════════════════════════════════════ */

/* ── Theme data (XD palette, 13 themes) ── */
const THEMES = {
  neko:      { id:"neko",      shell:"#35BFAB", sidebar:"#EDDD62", accent:"#9EE7D1", light:["68 53% 95%","184 23% 26%","64 67% 97%","184 23% 26%","145 48% 91%","184 23% 24%","67 42% 92%","198 9% 49%","166 54% 89%","173 66% 28%","68 28% 82%","150 45% 91%","184 23% 26%","61 70% 94%","173 66% 28%","139 29% 80%"], dark:["184 27% 9%","70 43% 92%","183 23% 13%","70 43% 92%","179 20% 18%","70 43% 92%","181 18% 17%","166 13% 70%","169 30% 20%","162 60% 76%","181 16% 24%","183 25% 11%","70 43% 92%","177 22% 17%","162 60% 76%","181 16% 24%"] },
  graphite:  { id:"graphite",  shell:"#F5F5F4", sidebar:"#E7E5E4", accent:"#4F46E5", light:["220 14% 96%","224 20% 12%","0 0% 100%","224 20% 12%","220 10% 91%","224 20% 14%","220 10% 92%","220 9% 35%","231 100% 97%","234 48% 30%","220 12% 84%","220 12% 90%","224 20% 12%","0 0% 100%","224 20% 12%","220 10% 81%"], dark:["220 9% 8%","210 20% 96%","220 9% 12%","210 20% 96%","220 8% 16%","210 20% 94%","220 8% 15%","220 8% 68%","232 24% 20%","210 20% 96%","220 8% 18%","220 8% 10%","210 20% 96%","220 8% 15%","210 20% 96%","220 8% 18%"] },
  citrus:    { id:"citrus",    shell:"#FFFBEB", sidebar:"#FDE68A", accent:"#EA580C", light:["32 100% 97%","22 38% 16%","0 0% 100%","22 38% 16%","35 100% 93%","24 33% 22%","34 100% 94%","25 24% 40%","40 100% 90%","26 56% 20%","35 65% 86%","35 100% 91%","22 38% 16%","0 0% 100%","22 38% 16%","35 52% 82%"], dark:["25 18% 10%","32 100% 96%","24 18% 13%","32 100% 96%","24 17% 18%","32 100% 96%","24 15% 18%","31 22% 74%","25 28% 20%","32 100% 96%","24 14% 21%","25 18% 12%","32 100% 96%","24 16% 18%","32 100% 96%","24 14% 21%"] },
  pixel:     { id:"pixel",     shell:"#FEF3C7", sidebar:"#FDE047", accent:"#E11D48", light:["48 100% 92%","219 43% 12%","53 100% 98%","219 43% 12%","48 94% 78%","219 43% 12%","48 86% 82%","224 17% 27%","351 84% 88%","345 81% 24%","42 71% 35%","48 94% 68%","219 43% 12%","53 100% 98%","219 43% 12%","42 71% 35%"], dark:["230 23% 12%","51 100% 92%","230 23% 16%","51 100% 92%","224 28% 20%","51 100% 92%","224 28% 18%","44 33% 73%","351 63% 24%","51 100% 92%","43 60% 55%","224 31% 18%","51 100% 92%","230 23% 16%","51 100% 92%","43 60% 55%"] },
  tape:      { id:"tape",      shell:"#FAF5EF", sidebar:"#E7DDD4", accent:"#7C3AED", light:["24 24% 95%","16 22% 18%","28 24% 98%","16 22% 18%","26 20% 90%","16 22% 18%","26 18% 91%","18 10% 39%","274 80% 95%","274 44% 28%","25 12% 82%","24 18% 87%","16 22% 18%","28 24% 98%","16 22% 18%","25 12% 78%"], dark:["18 10% 11%","26 26% 94%","18 12% 15%","26 26% 94%","18 10% 18%","26 26% 94%","18 10% 18%","24 10% 70%","274 32% 22%","26 26% 94%","18 9% 22%","18 11% 13%","26 26% 94%","18 10% 18%","26 26% 94%","18 9% 22%"] },
  teal:      { id:"teal",      shell:"#F2FBF8", sidebar:"#CDEFE6", accent:"#006B67", light:["160 53% 97%","198 48% 12%","0 0% 100%","198 48% 12%","166 38% 91%","188 42% 16%","166 34% 92%","187 18% 37%","172 54% 90%","178 80% 19%","166 30% 82%","164 52% 87%","198 48% 12%","166 61% 95%","178 80% 19%","166 30% 78%"], dark:["180 59% 7%","160 36% 94%","178 41% 11%","160 36% 94%","178 28% 16%","160 36% 94%","178 28% 16%","169 18% 70%","178 45% 18%","160 52% 94%","178 22% 21%","180 45% 9%","160 36% 94%","178 29% 15%","160 52% 94%","178 22% 21%"] },
  cloud:     { id:"cloud",     shell:"#F0EEE9", sidebar:"#E7E2D9", accent:"#4E6E81", light:["43 19% 93%","220 16% 16%","40 28% 98%","220 16% 16%","42 18% 89%","220 16% 16%","45 16% 90%","220 7% 42%","204 28% 88%","202 37% 25%","39 13% 80%","39 23% 88%","220 16% 16%","43 19% 95%","202 37% 25%","39 13% 77%"], dark:["40 5% 9%","42 28% 93%","40 6% 13%","42 28% 93%","40 5% 18%","42 28% 93%","40 5% 18%","42 10% 70%","202 20% 24%","42 28% 93%","40 5% 22%","40 5% 11%","42 28% 93%","40 5% 17%","42 28% 93%","40 5% 22%"] },
  damson:    { id:"damson",    shell:"#FBF4F5", sidebar:"#EAD8DD", accent:"#64223C", light:["351 47% 97%","335 32% 15%","0 0% 100%","335 32% 15%","344 28% 91%","335 32% 15%","344 25% 92%","338 12% 39%","337 38% 89%","336 49% 26%","343 20% 82%","343 30% 88%","335 32% 15%","351 47% 97%","336 49% 26%","343 19% 78%"], dark:["332 29% 9%","345 33% 94%","334 25% 13%","345 33% 94%","334 20% 18%","345 33% 94%","334 20% 18%","342 14% 70%","336 32% 22%","345 34% 94%","334 17% 23%","333 28% 11%","345 33% 94%","334 20% 17%","345 34% 94%","334 17% 23%"] },
  fuchsia:   { id:"fuchsia",   shell:"#F8F6FF", sidebar:"#DCE8F7", accent:"#D4148E", light:["253 100% 98%","244 32% 14%","0 0% 100%","244 32% 14%","225 52% 94%","244 32% 14%","225 40% 95%","237 12% 40%","322 74% 92%","322 70% 31%","230 32% 86%","213 63% 92%","244 32% 14%","157 61% 94%","322 70% 31%","220 40% 84%"], dark:["244 33% 9%","240 35% 96%","246 28% 13%","240 35% 96%","244 24% 18%","240 35% 96%","244 24% 18%","239 17% 72%","322 42% 22%","240 35% 96%","244 20% 23%","244 30% 11%","240 35% 96%","246 24% 17%","240 35% 96%","244 20% 23%"] },
  cobalt:    { id:"cobalt",    shell:"#F3F7FF", sidebar:"#D9E7FF", accent:"#2557D6", light:["220 100% 98%","224 40% 14%","0 0% 100%","224 40% 14%","218 52% 93%","224 40% 14%","218 40% 94%","224 14% 40%","223 71% 94%","223 63% 28%","218 34% 86%","218 100% 93%","224 40% 14%","0 0% 100%","223 63% 28%","218 34% 82%"], dark:["225 44% 8%","220 35% 96%","224 38% 12%","220 35% 96%","225 30% 17%","220 35% 96%","225 28% 17%","220 17% 72%","223 44% 22%","220 35% 96%","225 25% 23%","225 40% 10%","220 35% 96%","225 30% 16%","220 35% 96%","225 25% 23%"] },
  terracotta:{ id:"terracotta",shell:"#FFF5ED", sidebar:"#F3D1BE", accent:"#B84A2D", light:["27 100% 96%","16 35% 16%","0 0% 100%","16 35% 16%","22 55% 90%","16 35% 16%","24 42% 91%","17 18% 39%","13 54% 90%","13 61% 28%","22 35% 82%","22 69% 85%","16 35% 16%","27 100% 96%","13 61% 28%","22 35% 77%"], dark:["16 35% 8%","28 46% 94%","16 29% 12%","28 46% 94%","16 24% 17%","28 46% 94%","16 24% 17%","24 16% 70%","13 35% 22%","28 46% 94%","16 20% 22%","16 32% 10%","28 46% 94%","16 24% 16%","28 46% 94%","16 20% 22%"] },
  lavender:  { id:"lavender",  shell:"#FAF7FF", sidebar:"#E7DBFF", accent:"#7C5CFF", light:["262 100% 98%","258 34% 14%","0 0% 100%","258 34% 14%","260 60% 94%","258 34% 14%","260 42% 95%","258 12% 42%","252 100% 94%","252 68% 34%","260 32% 86%","260 100% 93%","258 34% 14%","0 0% 100%","252 68% 34%","260 32% 82%"], dark:["260 35% 9%","262 45% 96%","260 30% 13%","262 45% 96%","260 24% 18%","262 45% 96%","260 24% 18%","260 17% 72%","252 42% 24%","262 45% 96%","260 20% 23%","260 32% 11%","262 45% 96%","260 24% 17%","262 45% 96%","260 20% 23%"] },
  nocturne:  { id:"nocturne",  shell:"#F5F7FB", sidebar:"#D8DEF0", accent:"#0F172A", darkAccent:"#F3B549", light:["220 43% 97%","222 47% 11%","0 0% 100%","222 47% 11%","225 28% 91%","222 47% 11%","225 24% 92%","222 13% 39%","38 85% 90%","222 47% 11%","225 20% 84%","225 44% 89%","222 47% 11%","220 43% 97%","222 47% 11%","225 20% 79%"], dark:["222 47% 7%","44 45% 93%","222 36% 11%","44 45% 93%","222 28% 16%","44 45% 93%","222 28% 16%","222 13% 72%","38 62% 22%","44 45% 93%","222 22% 20%","222 40% 8%","44 45% 93%","222 28% 15%","44 45% 93%","222 22% 20%"] },
};
const THEME_KEYS = ["background","foreground","card","card-foreground","secondary","secondary-foreground","muted","muted-foreground","accent","accent-foreground","border","sidebar-background","sidebar-foreground","sidebar-accent","sidebar-accent-foreground","sidebar-border"];
const THEME_NAMES = { neko:"Neko", graphite:"Graphite", citrus:"Citrus", pixel:"Pixel", tape:"Tape", teal:"Tide", cloud:"Cloud", damson:"Damson", fuchsia:"Fuchsia", cobalt:"Cobalt", terracotta:"Terracotta", lavender:"Lavender", nocturne:"Nocturne" };

/* ── State ── */
const STORAGE = { theme:"mmv-theme", mode:"mmv-mode", language:"mmv-lang", module:"mmv-module", leftOpen:"mmv-left", rightOpen:"mmv-right", leftWidth:"mmv-lw", rightWidth:"mmv-rw", calendarView:"mmv-cal-view", calendarDate:"mmv-cal-date" };
const MODULES = ["home","now","journal","album"];
const state = {
  theme: "neko", mode: "light", language: "zh", module: "home",
  leftOpen: true, rightOpen: true, leftWidth: 252, rightWidth: 268,
  calendarView: "month", calendarDate: ""
};

/* ── DOM refs ── */
const appShell = document.getElementById("appShell");
const mainStage = document.getElementById("mainStage");
const cloudMenu = document.getElementById("cloudMenu");
const cloudToggle = document.getElementById("cloudToggle");
const leftToggle = document.getElementById("leftToggle");
const rightToggle = document.getElementById("rightToggle");
const mobileScrim = document.getElementById("mobileScrim");
let mmvCalendar = null;

/* ── Theme ── */
function applyTheme() {
  const t = THEMES[state.theme] || THEMES.neko;
  state.theme = t.id;
  const v = t[state.mode];
  THEME_KEYS.forEach((k,i) => document.documentElement.style.setProperty(`--${k}`, v[i]));
  document.documentElement.dataset.theme = t.id;
  document.documentElement.dataset.mode = state.mode;
  document.querySelectorAll("[data-mode-choice]").forEach(b => b.classList.toggle("is-selected", b.dataset.modeChoice === state.mode));
}

function buildThemeGrid() {
  const g = document.getElementById("themeGrid");
  if (!g) return;
  g.replaceChildren();
  Object.values(THEMES).forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "theme-choice";
    btn.dataset.themeChoice = t.id;
    const sw = document.createElement("span"); sw.className = "theme-swatch";
    [t.shell, t.sidebar, t.darkAccent || t.accent].forEach(c => { const s = document.createElement("i"); s.style.background = c; sw.append(s); });
    const lb = document.createElement("span"); lb.textContent = THEME_NAMES[t.id];
    btn.append(sw, lb);
    btn.onclick = () => { state.theme = t.id; localStorage.setItem(STORAGE.theme, t.id); applyTheme(); };
    g.append(btn);
  });
}

/* ── Language ── */
const COPY = {
  zh: { authorPicks:"作者精选", smallThoughts:"小巧思", contact:"联系方式", contactHint:"有事请联系", friends:"友情链接" },
  en: { authorPicks:"Author's Picks", smallThoughts:"Small Thoughts", contact:"Contact", contactHint:"Click to reveal", friends:"Friends" },
  fr: { authorPicks:"Choix de l'auteur", smallThoughts:"Petites pensées", contact:"Contact", contactHint:"Cliquez pour voir", friends:"Amis" },
  de: { authorPicks:"Auswahl des Autors", smallThoughts:"Kleine Gedanken", contact:"Kontakt", contactHint:"Klicken zum Anzeigen", friends:"Freunde" },
};
function applyLanguage() {
  const c = COPY[state.language] || COPY.zh;
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : state.language;
  document.querySelectorAll("[data-i18n]").forEach(n => { if (c[n.dataset.i18n]) n.textContent = c[n.dataset.i18n]; });
}

/* ── Module switching ── */
function switchModule(name) {
  if (!MODULES.includes(name)) return;
  state.module = name;
  appShell.dataset.module = name;
  document.querySelectorAll("[data-view]").forEach(v => { v.hidden = v.dataset.view !== name; v.classList.toggle("is-active", v.dataset.view === name); });
  document.querySelectorAll(".nav-item[data-module]").forEach(b => { const a = b.dataset.module === name; b.classList.toggle("is-active", a); if (a) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  if (mainStage) mainStage.scrollTop = 0;
  if (name === "now") { requestAnimationFrame(() => { ensureCalendar(); }); }
}
document.querySelectorAll("[data-module]").forEach(b => b.onclick = () => switchModule(b.dataset.module));

/* ── Side panels ── */
function applyPanels() {
  appShell.dataset.leftOpen = String(state.leftOpen);
  appShell.dataset.rightOpen = String(state.rightOpen);
  appShell.style.setProperty("--left-width", `${state.leftWidth}px`);
  appShell.style.setProperty("--right-width", `${state.rightWidth}px`);
  leftToggle.setAttribute("aria-expanded", String(state.leftOpen));
  rightToggle.setAttribute("aria-expanded", String(state.rightOpen));
}
leftToggle.onclick = () => { state.leftOpen = !state.leftOpen; applyPanels(); };
rightToggle.onclick = () => { state.rightOpen = !state.rightOpen; applyPanels(); };

/* ── Cloud menu ── */
function openCloud() { cloudMenu.hidden = false; cloudToggle.setAttribute("aria-expanded","true"); }
function closeCloud() { cloudMenu.hidden = true; cloudToggle.setAttribute("aria-expanded","false"); }
cloudToggle.onclick = () => cloudMenu.hidden ? openCloud() : closeCloud();
document.getElementById("cloudClose").onclick = () => closeCloud();
document.addEventListener("pointerdown", e => { if (!cloudMenu.hidden && !cloudMenu.contains(e.target) && !cloudToggle.contains(e.target)) closeCloud(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !cloudMenu.hidden) closeCloud(); });
document.querySelectorAll("[data-mode-choice]").forEach(b => b.onclick = () => { state.mode = b.dataset.modeChoice; localStorage.setItem(STORAGE.mode, state.mode); applyTheme(); });
document.querySelectorAll("[data-language]").forEach(b => b.onclick = () => { state.language = b.dataset.language; localStorage.setItem(STORAGE.language, state.language); applyLanguage(); });

/* ── Contact toggle ── */
document.getElementById("contactToggle")?.addEventListener("click", function() {
  const s = this.querySelector("small");
  if (!s) return;
  const expanded = this.classList.toggle("is-expanded");
  s.textContent = expanded ? "newtnorlly@outlook.com" : ((COPY[state.language]||COPY.zh).contactHint||"");
});

/* ── Envelope ── */
document.getElementById("envelopeToggle").onclick = function() {
  const l = document.getElementById("authorLetter");
  l.hidden = !l.hidden;
  this.setAttribute("aria-expanded", String(!l.hidden));
};
document.getElementById("letterClose").onclick = function() {
  document.getElementById("authorLetter").hidden = true;
  document.getElementById("envelopeToggle").setAttribute("aria-expanded","false");
};

/* ── Chat ── */
const CHAT_FLOW = {
  zh: {
    intro: ["故事起于一个偶然的下午：一个转瞬即逝的念头，让我想把散落的经历真正留下。","朋友 Geometry 先让我看见一个个人网站，又带我认识 LaTeX 和 Overleaf；知识、文字、排版与技术就这样接到了一起。","我也是从那里注意到"文学化编程"：程序不仅执行任务，也可以把思路完整地说出来。","学术与技术常常共享连贯的思考与逻辑，并不是两条互不相干的路。","所以，程序员、作家和设计师这几种身份，在我身上并不冲突。","我喜欢有个性的叙事，偶尔添一点古风，再在实用工作旁放几枚像"贴纸"一样的小趣味。","不过，形式再漂亮，也要装得下真正有意义、有价值的想法与感触。","我想保存自己的故事、身边人的故事，也保存那些有趣而有价值的历史材料。","我总觉得，青春里不同人的念头会彼此遇见；相遇本身，就可能改变后来要走的路。","纸本、公开动态、聊天记录，甚至随手写下的一句话，都可以成为记忆的容器。","因为有趣的内容很容易溜走；当时不记，后来往往只剩一个模糊的影子。","只要一件事足够有趣、也有价值，我就觉得它值得被认真记录。","记录并不是把来路修饰得完美；那些不成熟、不顺利的部分，也应该被诚实面对。","所以这里会有小短文、札记，也会有旅行攻略——不同形式，替不同的生活片段找到位置。","我担心记忆在时间里逐渐破碎，这也是我不断整理材料的原因。","初三以后，我慢慢形成了整理语言和笔记的习惯，让零散信息重新变得可读。","到了 2024 年，新的技能与一次次突破，又把这个习惯推向了更完整的系统。","我珍惜那些给我宽容、反馈与陪伴的伙伴；许多方向，并不是我独自找到的。","我的书单里也有《魔戒》、Linux、Python、Just for Fun 和《编码》；文学与计算机一直并排生长。","借书里的一句话作结吧："愿为江水，与你同行。"这不是写完的自传，只是我们认识彼此的开头。"],
    greeting: "第一次见面，想先聊哪件事？"
  },
  en: {
    intro: ["The story began on an accidental afternoon..."],
    greeting: "Since we have just met, what shall we talk about first?"
  }
};

let chatStep = 0, chatActive = false;
const guideOptions = document.getElementById("guideOptions");
const chatThread = document.getElementById("chatThread");

function appendHostMsg(text) {
  const art = document.createElement("article");
  art.className = "chat-message chat-message--host";
  art.innerHTML = `<img class="chat-avatar" src="./assets/avatars/host-mooncat.png" alt="" width="96" height="96"><div class="chat-message__content"><span class="chat-name">NewtNorlly</span><div class="chat-bubble"><p>${text}</p></div></div>`;
  chatThread.append(art);
  chatStep++;
}

function showGuideOptions() {
  guideOptions.hidden = false;
  chatThread.append(guideOptions);
  guideOptions.scrollIntoView({ behavior:"smooth", block:"nearest" });
}

document.querySelectorAll("[data-guide]").forEach(btn => {
  btn.onclick = function() {
    const guide = this.dataset.guide;
    if (guide === "recent" || guide === "living") switchModule("now");
    else if (guide === "treasures") switchModule("album");
    else if (guide === "wander") switchModule("journal");
    else if (guide === "anniversary") {
      appendHostMsg("我翻到了一页旧日记，今天正好是它的纪念日。");
      appendHostMsg("七月的倒数第三天。在三舅家吃完午饭，我坐在窗边翻德语变位表。阳光把百叶窗的影子切成整齐的条纹。橘猫不知什么时候蜷在了旁边的椅子上。");
      appendHostMsg("以上就是今天的纪念日茶话了。");
    }
  };
});

function initChat() {
  if (chatActive) return;
  chatActive = true;
  const flow = CHAT_FLOW[state.language] || CHAT_FLOW.zh;
  guideOptions.hidden = true;
  // Show first message immediately
  appendHostMsg(flow.intro[0]);
  // Load rest with a small delay for feel
  let i = 1;
  function next() {
    if (i >= flow.intro.length) {
      appendHostMsg(flow.greeting);
      showGuideOptions();
      return;
    }
    appendHostMsg(flow.intro[i]);
    i++;
    setTimeout(next, 120);
  }
  setTimeout(next, 400);
}

// Update date display
function updateDate() {
  const now = new Date();
  const d = document.getElementById("todayDay");
  const m = document.getElementById("todayMonth");
  if (d) d.textContent = String(now.getDate()).padStart(2,"0");
  if (m) m.textContent = new Intl.DateTimeFormat("en-US",{month:"short"}).format(now).toUpperCase().replace(".","");
}
updateDate();

/* ── Calendar ── */
const CAL_VIEWS = ["year","month","week","day"];
function ensureCalendar() {
  const el = document.getElementById("calendarRoot");
  if (!el || mmvCalendar) return;
  try {
    if (!window.tui?.Calendar) { showCalFallback(); return; }
    mmvCalendar = new window.tui.Calendar(el, {
      defaultView:"month", usageStatistics:false, isReadOnly:true,
      taskView:false, scheduleView:["allday","time"],
      calendars: [{ id:"mmv-personal", name:"MMV", color:"#fff", bgColor:"hsl(var(--accent-foreground))", borderColor:"hsl(var(--accent-foreground))" }]
    });
    const schedules = (window.MMV_CALENDAR_SCHEDULES||[]).map(s => ({ id:s.id, calendarId:"mmv-personal", title:s.title, start:s.start, end:s.end, category:"time", isReadOnly:true }));
    mmvCalendar.createSchedules(schedules, true);
    mmvCalendar.setDate(new Date());
    document.getElementById("calendarPeriod").textContent = `${new Date().getFullYear()}年${new Date().getMonth()+1}月`;
  } catch(e) { showCalFallback(); }
}
function showCalFallback() {
  document.getElementById("calendarViewport").hidden = true;
  document.getElementById("calendarFallback").hidden = false;
}
document.getElementById("calendarDateJump").onchange = function() {
  if (mmvCalendar && this.value) { mmvCalendar.setDate(this.value); mmvCalendar.render(true); }
};
document.querySelectorAll("[data-calendar-view]").forEach(b => b.onclick = function() {
  document.querySelectorAll("[data-calendar-view]").forEach(x => x.classList.remove("is-selected"));
  this.classList.add("is-selected");
  if (mmvCalendar && CAL_VIEWS.includes(this.dataset.calendarView)) { mmvCalendar.changeView(this.dataset.calendarView, true); }
});

/* ── Init ── */
function init() {
  // Restore preferences
  const st = localStorage.getItem(STORAGE.theme);
  if (st && THEMES[st]) state.theme = st;
  const sm = localStorage.getItem(STORAGE.mode);
  if (sm === "dark") state.mode = "dark";
  const sl = localStorage.getItem(STORAGE.language);
  if (COPY[sl]) state.language = sl;
  state.leftOpen = localStorage.getItem(STORAGE.leftOpen) !== "false";
  state.rightOpen = localStorage.getItem(STORAGE.rightOpen) !== "false";

  buildThemeGrid();
  applyTheme();
  applyLanguage();
  applyPanels();
  initChat();
}
init();
