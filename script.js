/* 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?   Mon Mode de Vie 鈥?script.js (rebuild v2)
   Design doc 搂2-搂19 路 All modules integrated
   鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?*/

/* 鈹€鈹€鈹€ Theme Palette (XD 13 themes) 鈹€鈹€鈹€ */
const T = {
  neko:{id:"neko",shell:"#35BFAB",sidebar:"#EDDD62",accent:"#9EE7D1",light:["68 53% 95%","184 23% 26%","64 67% 97%","184 23% 26%","145 48% 91%","184 23% 24%","67 42% 92%","198 9% 49%","166 54% 89%","173 66% 28%","68 28% 82%","150 45% 91%","184 23% 26%","61 70% 94%","173 66% 28%","139 29% 80%"],dark:["184 27% 9%","70 43% 92%","183 23% 13%","70 43% 92%","179 20% 18%","70 43% 92%","181 18% 17%","166 13% 70%","169 30% 20%","162 60% 76%","181 16% 24%","183 25% 11%","70 43% 92%","177 22% 17%","162 60% 76%","181 16% 24%"]},
  graphite:{id:"graphite",shell:"#F5F5F4",sidebar:"#E7E5E4",accent:"#4F46E5",light:["220 14% 96%","224 20% 12%","0 0% 100%","224 20% 12%","220 10% 91%","224 20% 14%","220 10% 92%","220 9% 35%","231 100% 97%","234 48% 30%","220 12% 84%","220 12% 90%","224 20% 12%","0 0% 100%","224 20% 12%","220 10% 81%"],dark:["220 9% 8%","210 20% 96%","220 9% 12%","210 20% 96%","220 8% 16%","210 20% 94%","220 8% 15%","220 8% 68%","232 24% 20%","210 20% 96%","220 8% 18%","220 8% 10%","210 20% 96%","220 8% 15%","210 20% 96%","220 8% 18%"]},
};
const TK = ["background","foreground","card","card-foreground","secondary","secondary-foreground","muted","muted-foreground","accent","accent-foreground","border","sidebar-background","sidebar-foreground","sidebar-accent","sidebar-accent-foreground","sidebar-border"];
const TN = {neko:"Neko",graphite:"Graphite"};

/* 鈹€鈹€鈹€ State 鈹€鈹€鈹€ */
const S = {
  theme:"neko", mode:"light", lang:"zh", module:"home",
  leftOpen:true, rightOpen:true, leftW:252, rightW:268,
  calView:"month", calDate:""
};
const M = ["home","now","journal","album"];

/* 鈹€鈹€鈹€ i18n 鈹€鈹€鈹€ */
const L = {
  zh:{authorPicks:"浣滆€呯簿閫?,smallThoughts:"灏忓阀鎬?,contact:"鑱旂郴鏂瑰紡",contactHint:"鏈変簨璇疯仈绯?,friends:"鍙嬫儏閾炬帴",
      navHome:"Home",navNow:"Now",navJournal:"Journal",navAlbum:"Album",navCloud:"Cloud",
      guideRecent:"鏈€杩戝湪蹇欎粈涔堬紵",guideLiving:"浣犲钩鏃舵€庝箞鐢熸椿锛?,guideTreasures:"甯︽垜鐪嬬湅浣犵弽钘忕殑涓滆タ",guideWander:"鎴戝厛闅忎究閫涢€?,guideAnniversary:"鎴戞兂鍚惉浠婂ぉ鐨勭邯蹇垫棩鑼惰瘽"},
  en:{authorPicks:"Author's Picks",smallThoughts:"Small Thoughts",contact:"Contact",contactHint:"Click to reveal",friends:"Friends",
      navHome:"Home",navNow:"Now",navJournal:"Journal",navAlbum:"Album",navCloud:"Cloud",
      guideRecent:"What have you been up to?",guideLiving:"How do you live?",guideTreasures:"Show me your treasures",guideWander:"I'll just wander",guideAnniversary:"Today's anniversary tea"},
  fr:{authorPicks:"Choix de l'auteur",smallThoughts:"Petites pens茅es",contact:"Contact",contactHint:"Cliquez pour voir",friends:"Amis",
      navHome:"Accueil",navNow:"Maintenant",navJournal:"Journal",navAlbum:"Album",navCloud:"Nuage",
      guideRecent:"Qu'avez-vous fait r茅cemment?",guideLiving:"Comment vivez-vous?",guideTreasures:"Montrez-moi vos tr茅sors",guideWander:"Je vais me promener",guideAnniversary:"Le th茅 d'anniversaire"},
  de:{authorPicks:"Auswahl",smallThoughts:"Gedanken",contact:"Kontakt",contactHint:"Klicken",friends:"Freunde",
      navHome:"Start",navNow:"Jetzt",navJournal:"Tagebuch",navAlbum:"Album",navCloud:"Wolke",
      guideRecent:"Was hast du gemacht?",guideLiving:"Wie lebst du?",guideTreasures:"Zeig mir deine Sch盲tze",guideWander:"Ich schlendere",guideAnniversary:"Jahrestagstee"},
};
function t(key){ return (L[S.lang]||L.zh)[key]||key; }

/* 鈹€鈹€鈹€ Chat flow (design doc 搂5) 鈹€鈹€鈹€ */
const CHAT = {
  zh:[
    "鏁呬簨璧蜂簬涓€涓伓鐒剁殑涓嬪崍銆?,
    "鏈嬪弸 Geometry 鍏堣鎴戠湅瑙佷竴涓釜浜虹綉绔欙紝鍙堝甫鎴戣璇?LaTeX 鍜?Overleaf銆?,
    "鎴戜篃鏄粠閭ｉ噷娉ㄦ剰鍒般€屾枃瀛﹀寲缂栫▼銆嶏細绋嬪簭涓嶄粎鎵ц浠诲姟锛屼篃鍙互鎶婃€濊矾瀹屾暣鍦拌鍑烘潵銆?,
    "瀛︽湳涓庢妧鏈父甯稿叡浜繛璐殑鎬濊€冧笌閫昏緫锛屽苟涓嶆槸涓ゆ潯浜掍笉鐩稿共鐨勮矾銆?,
    "绋嬪簭鍛樸€佷綔瀹跺拰璁捐甯堣繖鍑犵韬唤锛屽湪鎴戣韩涓婂苟涓嶅啿绐併€?,
    "鎴戝枩娆㈡湁涓€х殑鍙欎簨锛屽伓灏旀坊涓€鐐瑰彜椋庯紝鍐嶅湪瀹炵敤宸ヤ綔鏃佹斁鍑犳灇灏忚叮鍛炽€?,
    "褰㈠紡鍐嶆紓浜紝涔熻瑁呭緱涓嬬湡姝ｆ湁鎰忎箟銆佹湁浠峰€肩殑鎯虫硶涓庢劅瑙︺€?,
    "鎴戞兂淇濆瓨鑷繁鐨勬晠浜嬨€佽韩杈逛汉鐨勬晠浜嬶紝涔熶繚瀛橀偅浜涙湁瓒ｈ€屾湁浠峰€肩殑鍘嗗彶鏉愭枡銆?,
    "闈掓槬閲屼笉鍚屼汉鐨勫康澶翠細褰兼閬囪锛涚浉閬囨湰韬紝灏卞彲鑳芥敼鍙樺悗鏉ヨ璧扮殑璺€?,
    "绾告湰銆佸叕寮€鍔ㄦ€併€佽亰澶╄褰曪紝鐢氳嚦闅忔墜鍐欎笅鐨勪竴鍙ヨ瘽锛岄兘鍙互鎴愪负璁板繂鐨勫鍣ㄣ€?,
    "鏈夎叮鐨勫唴瀹瑰緢瀹规槗婧滆蛋锛涘綋鏃朵笉璁帮紝鍚庢潵寰€寰€鍙墿涓€涓ā绯婄殑褰卞瓙銆?,
    "鍙涓€浠朵簨瓒冲鏈夎叮涔熸湁浠峰€硷紝鎴戝氨瑙夊緱瀹冨€煎緱琚鐪熻褰曘€?,
    "璁板綍骞朵笉鏄妸鏉ヨ矾淇グ寰楀畬缇庯紱閭ｄ簺涓嶆垚鐔熴€佷笉椤哄埄鐨勯儴鍒嗭紝涔熷簲璇ヨ璇氬疄闈㈠銆?,
    "鎵€浠ヨ繖閲屼細鏈夊皬鐭枃銆佹湱璁帮紝涔熶細鏈夋梾琛屾敾鐣ャ€?,
    "鎴戞媴蹇冭蹇嗗湪鏃堕棿閲岄€愭笎鐮寸锛岃繖涔熸槸鎴戜笉鏂暣鐞嗘潗鏂欑殑鍘熷洜銆?,
    "鍒濅笁浠ュ悗锛屾垜鎱㈡參褰㈡垚浜嗘暣鐞嗚瑷€鍜岀瑪璁扮殑涔犳儻銆?,
    "鍒颁簡 2024 骞达紝鏂扮殑鎶€鑳戒笌涓€娆℃绐佺牬锛屽張鎶婅繖涓範鎯帹鍚戜簡鏇村畬鏁寸殑绯荤粺銆?,
    "鎴戠弽鎯滈偅浜涚粰鎴戝瀹广€佸弽棣堜笌闄即鐨勪紮浼淬€?,
    "鎴戠殑涔﹀崟閲屾湁銆婇瓟鎴掋€嬨€丩inux銆丳ython銆丣ust for Fun 鍜屻€婄紪鐮併€嬨€?,
    "鍊熶功閲岀殑涓€鍙ヨ瘽浣滅粨鍚э細銆屾効涓烘睙姘达紝涓庝綘鍚岃銆傘€?
  ]
};

let chatStep = 0, chatRunning = false;
const hostAvatar = "./assets/avatars/host-mooncat.png";

function hostMsg(text) {
  const a = document.createElement("article");
  a.className = "chat-message chat-message--host";
  a.innerHTML = `<img class="chat-avatar" src="${hostAvatar}" alt="" width="96" height="96"><div class="chat-message__content"><span class="chat-name">NewtNorlly</span><div class="chat-bubble"><p>${text}</p></div></div>`;
  document.getElementById("chatThread").append(a);
}

function showContinue() {
  const d = document.createElement("div");
  d.className = "chat-continue";
  const b = document.createElement("button");
  b.className = "chat-choice"; b.textContent = "缁х画 鈫?;
  b.onclick = nextMsg;
  d.append(b);
  document.getElementById("chatThread").append(d);
}

function showChoices() {
  const g = document.getElementById("guideOptions");
  g.hidden = false;
  document.getElementById("chatThread").append(g);
  document.querySelectorAll("#guideOptions [data-guide]").forEach(b => {
    b.textContent = t("guide"+b.dataset.guide.charAt(0).toUpperCase()+b.dataset.guide.slice(1));
  });
}

function nextMsg() {
  const flow = CHAT[S.lang] || CHAT.zh;
  document.querySelector(".chat-continue")?.remove();
  if (chatStep < flow.length) {
    hostMsg(flow[chatStep]); chatStep++;
    if (chatStep < flow.length) showContinue();
    else { hostMsg("绗竴娆¤闈紝鎯冲厛鑱婂摢浠朵簨锛?); showChoices(); }
  }
}

function initChat() {
  if (chatRunning) return;
  chatRunning = true;
  document.getElementById("guideOptions").hidden = true;
  hostMsg(CHAT[S.lang]?.[0] || CHAT.zh[0]);
  chatStep = 1;
  showContinue();
}

/* 鈹€鈹€鈹€ Guide handlers 鈹€鈹€鈹€ */
document.querySelectorAll("#guideOptions [data-guide]").forEach(b => {
  b.onclick = function() {
    const g = this.dataset.guide;
    if (g === "recent" || g === "living") switchTo("now");
    else if (g === "treasures") switchTo("album");
    else if (g === "wander") switchTo("journal");
    else if (g === "anniversary") {
      hostMsg("鎴戠炕鍒颁簡涓€椤垫棫鏃ヨ锛屼粖澶╂濂芥槸瀹冪殑绾康鏃ャ€?);
      hostMsg("涓冩湀鐨勫€掓暟绗笁澶┿€傚湪涓夎垍瀹跺悆瀹屽崍楗紝鎴戝潗鍦ㄧ獥杈圭炕寰疯鍙樹綅琛ㄣ€傞槼鍏夋妸鐧惧彾绐楃殑褰卞瓙鍒囨垚鏁撮綈鐨勬潯绾广€傛鐚笉鐭ヤ粈涔堟椂鍊欒湻鍦ㄤ簡鏃佽竟鐨勬瀛愪笂銆?);
      hostMsg("浠ヤ笂灏辨槸浠婂ぉ鐨勭邯蹇垫棩鑼惰瘽浜嗐€?);
    }
  };
});

/* 鈹€鈹€鈹€ Module switching 鈹€鈹€鈹€ */
function switchTo(name) {
  if (!M.includes(name)) return;
  S.module = name;
  document.getElementById("appShell").dataset.module = name;
  document.querySelectorAll("[data-view]").forEach(v => { v.hidden = v.dataset.view !== name; v.classList.toggle("is-active", v.dataset.view === name); });
  document.querySelectorAll(".nav-item[data-module]").forEach(b => { const a = b.dataset.module === name; b.classList.toggle("is-active",a); if (a) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  document.getElementById("mainStage").scrollTop = 0;
  if (name === "now") setTimeout(initCal, 100);
}
document.querySelectorAll("[data-module]").forEach(b => b.onclick = () => switchTo(b.dataset.module));

/* 鈹€鈹€鈹€ Theme 鈹€鈹€鈹€ */
function applyTheme() {
  const th = T[S.theme] || T.neko;
  const v = th[S.mode];
  TK.forEach((k,i) => document.documentElement.style.setProperty("--"+k, v[i]));
  document.documentElement.dataset.theme = th.id;
  document.documentElement.dataset.mode = S.mode;
}
function buildThemeGrid() {
  const g = document.getElementById("themeGrid"); if (!g) return;
  g.textContent = "";
  Object.values(T).forEach(th => {
    const b = document.createElement("button"); b.className = "theme-choice"; b.type = "button";
    b.dataset.themeChoice = th.id;
    const sw = document.createElement("span"); sw.className = "theme-swatch";
    [th.shell, th.sidebar, th.accent].forEach(c => { const s = document.createElement("i"); s.style.background = c; sw.append(s); });
    b.append(sw, document.createTextNode(TN[th.id]||th.id));
    b.onclick = () => { S.theme = th.id; localStorage.setItem("mmv-theme",th.id); applyTheme(); };
    g.append(b);
  });
}

/* 鈹€鈹€鈹€ Language 鈹€鈹€鈹€ */
function applyLang() {
  document.documentElement.lang = S.lang==="zh"?"zh-CN":S.lang;
  document.querySelectorAll("[data-i18n]").forEach(n => { if(L[S.lang]?.[n.dataset.i18n]) n.textContent = L[S.lang][n.dataset.i18n]; });
}
document.querySelectorAll("[data-mode-choice]").forEach(b => b.onclick = () => { S.mode = b.dataset.modeChoice; localStorage.setItem("mmv-mode",S.mode); applyTheme(); });
document.querySelectorAll("[data-language]").forEach(b => b.onclick = () => { S.lang = b.dataset.language; localStorage.setItem("mmv-lang",S.lang); applyLang(); });

/* 鈹€鈹€鈹€ Panels 鈹€鈹€鈹€ */
function applyPanels() {
  const sh = document.getElementById("appShell");
  sh.dataset.leftOpen = String(S.leftOpen);
  sh.dataset.rightOpen = String(S.rightOpen);
  sh.style.setProperty("--left-width", S.leftW+"px");
  sh.style.setProperty("--right-width", S.rightW+"px");
}
document.getElementById("leftToggle").onclick = () => { S.leftOpen = !S.leftOpen; applyPanels(); };
document.getElementById("rightToggle").onclick = () => { S.rightOpen = !S.rightOpen; applyPanels(); };
function isMobile() { return window.innerWidth < 840; }
document.getElementById("mobileScrim").onclick = () => { S.leftOpen = S.rightOpen = false; applyPanels(); };

/* 鈹€鈹€鈹€ Cloud 鈹€鈹€鈹€ */
const cm = document.getElementById("cloudMenu"), ct = document.getElementById("cloudToggle");
function openCloud() { cm.hidden = false; ct.setAttribute("aria-expanded","true"); }
function closeCloud() { cm.hidden = true; ct.setAttribute("aria-expanded","false"); }
ct.onclick = () => cm.hidden ? openCloud() : closeCloud();
document.getElementById("cloudClose").onclick = () => closeCloud();
document.addEventListener("pointerdown", e => { if (!cm.hidden && !cm.contains(e.target) && !ct.contains(e.target)) closeCloud(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !cm.hidden) { closeCloud(); e.preventDefault(); } });

/* 鈹€鈹€鈹€ Contact toggle 鈹€鈹€鈹€ */
document.getElementById("contactToggle")?.addEventListener("click", function() {
  const s = this.querySelector("small");
  if (!s) return;
  const x = this.classList.toggle("is-expanded");
  s.textContent = x ? "newtnorlly@outlook.com" : t("contactHint");
});

/* 鈹€鈹€鈹€ Envelope 鈹€鈹€鈹€ */
document.getElementById("envelopeToggle").onclick = function() {
  const l = document.getElementById("authorLetter");
  l.hidden = !l.hidden;
  this.setAttribute("aria-expanded", String(!l.hidden));
};
document.getElementById("letterClose").onclick = function() {
  document.getElementById("authorLetter").hidden = true;
  document.getElementById("envelopeToggle").setAttribute("aria-expanded","false");
};

/* 鈹€鈹€鈹€ Calendar (design doc 搂6) 鈹€鈹€鈹€ */
let cal = null;
function initCal() {
  const el = document.getElementById("calendarRoot");
  if (!el || cal) return;
  try {
    if (!window.tui?.Calendar) { document.getElementById("calendarFallback").hidden = false; return; }
    cal = new window.tui.Calendar(el, {
      defaultView:"month", usageStatistics:false, isReadOnly:true,
      taskView:false, scheduleView:["allday","time"],
      calendars:[
        {id:"mmv-eat",name:"鍚?,color:"#fff",bgColor:"hsla(20,80%,58%,0.30)",borderColor:"hsl(20,70%,48%)"},
        {id:"mmv-study",name:"瀛?,color:"#fff",bgColor:"hsla(255,45%,58%,0.28)",borderColor:"hsl(255,35%,48%)"},
        {id:"mmv-teach",name:"鏁?,color:"#fff",bgColor:"hsla(165,50%,52%,0.30)",borderColor:"hsl(165,40%,42%)"},
        {id:"mmv-play",name:"鐜?,color:"#fff",bgColor:"hsla(340,50%,56%,0.28)",borderColor:"hsl(340,45%,46%)"},
        {id:"mmv-make",name:"鍋?,color:"#fff",bgColor:"hsla(270,38%,54%,0.28)",borderColor:"hsl(270,30%,44%)"},
        {id:"mmv-rest",name:"姝?,color:"#fff",bgColor:"hsla(200,30%,56%,0.24)",borderColor:"hsl(200,25%,48%)"}
      ]
    });
    const sched = (window.MMV_CALENDAR_SCHEDULES||[]).map(s => ({
      id:s.id, calendarId:s.calendarId||"mmv-rest", title:s.title,
      start:s.start, end:s.end, category:"time", isReadOnly:true
    }));
    cal.createSchedules(sched, true);
    cal.setDate(new Date());
    document.getElementById("calendarPeriod").textContent = `${new Date().getFullYear()}骞?{new Date().getMonth()+1}鏈坄;
  } catch(e) { document.getElementById("calendarFallback").hidden = false; }
}
document.getElementById("calendarDateJump").onchange = function() {
  if (cal && this.value) { cal.setDate(this.value); cal.render(true); }
};
document.querySelectorAll("[data-calendar-view]").forEach(b => b.onclick = function() {
  document.querySelectorAll("[data-calendar-view]").forEach(x => x.classList.remove("is-selected"));
  this.classList.add("is-selected");
  if (cal) cal.changeView(this.dataset.calendarView, true);
});

/* 鈹€鈹€鈹€ Init 鈹€鈹€鈹€ */
(function() {
  const st = localStorage.getItem("mmv-theme"); if (st && T[st]) S.theme = st;
  const sm = localStorage.getItem("mmv-mode"); if (sm === "dark") S.mode = "dark";
  const sl = localStorage.getItem("mmv-lang"); if (L[sl]) S.lang = sl;
  S.leftOpen = localStorage.getItem("mmv-left") !== "false";
  S.rightOpen = localStorage.getItem("mmv-right") !== "false";

  buildThemeGrid();
  applyTheme();
  applyLang();
  applyPanels();
  initChat();

  const now = new Date();
  document.getElementById("todayDay").textContent = String(now.getDate()).padStart(2,"0");
  document.getElementById("todayMonth").textContent = new Intl.DateTimeFormat("en-US",{month:"short"}).format(now).toUpperCase().replace(".","");
})();
