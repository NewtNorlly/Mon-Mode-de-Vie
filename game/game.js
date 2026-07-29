// Portions of the runner mechanics are adapted from Chromium's offline runner.
// Upstream copyright notices remain with the preserved original source files.
// Use is governed by the BSD-style license preserved at
// ../third_party/chromium-runner-reference/LICENSE.

const COPY = {
  zh: {
    title: "纸上漫游",
    idle: "点击画面或按空格开始",
    running: "空格、↑ 或点击起跳",
    over: "撞上书堆了，歇一会儿。",
    score: "步数",
    start: "开始漫游",
    restart: "再走一程",
    canvas: "纸上漫游：跳过书堆的无尽跑酷小游戏",
  },
  en: {
    title: "Paper Run",
    idle: "Click the scene or press Space to begin",
    running: "Press Space, ↑, or click to jump",
    over: "A book pile stopped the walk. Take a breath.",
    score: "Steps",
    start: "Begin the walk",
    restart: "Walk once more",
    canvas: "Paper Run: an endless game about jumping over book piles",
  },
  fr: {
    title: "Course de papier",
    idle: "Cliquez sur la scène ou appuyez sur Espace",
    running: "Espace, ↑ ou un clic pour sauter",
    over: "Une pile de livres interrompt la promenade. Soufflons un peu.",
    score: "Pas",
    start: "Commencer la promenade",
    restart: "Reprendre le chemin",
    canvas: "Course de papier : jeu sans fin au-dessus de piles de livres",
  },
  de: {
    title: "Papierlauf",
    idle: "Zum Starten ins Bild klicken oder die Leertaste drücken",
    running: "Mit Leertaste, ↑ oder Klick springen",
    over: "Ein Bücherstapel beendet den Weg. Kurz durchatmen.",
    score: "Schritte",
    start: "Den Weg beginnen",
    restart: "Noch einmal losgehen",
    canvas: "Papierlauf: ein Endlosspiel über Bücherstapel hinweg",
  },
};

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const actionButton = document.querySelector("#gameAction");
const gameStage = document.querySelector("#gameStage");
const hint = document.querySelector("#gameHint");
const scoreLabel = document.querySelector("#scoreLabel");
const scoreOutput = document.querySelector("#score");
const overlay = document.querySelector("#gameOverlay");
const gameOverText = document.querySelector("#gameOverText");
const config = {
  acceleration: 3.4,
  bookHeight: 8,
  firstObstacleDelay: 1.12,
  gravity: 1450,
  jumpVelocity: -400,
  landingRecovery: 0.42,
  maxGapSeconds: 1.75,
  minGapSeconds: 1.32,
  spawnLead: 14,
};

const world = {
  width: 240,
  height: 176,
  ground: 148,
};

const player = {
  x: 24,
  y: 110,
  width: 32,
  height: 38,
  velocityY: 0,
  grounded: true,
};

const state = {
  phase: "idle",
  language: "zh",
  score: 0,
  distance: 0,
  speed: 0,
  speedLimit: 0,
  nextGap: 0,
  obstacles: [],
  lastFrame: performance.now(),
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  parentActive: true,
  colors: {
    background: "hsl(43 19% 93%)",
    foreground: "hsl(220 16% 16%)",
    card: "hsl(40 28% 98%)",
    secondary: "hsl(42 18% 89%)",
    muted: "hsl(220 7% 42%)",
    accent: "hsl(204 28% 88%)",
    accentForeground: "hsl(202 37% 25%)",
    border: "hsl(39 13% 80%)",
    story: "hsl(18 48% 54%)",
  },
};

function copy() {
  return COPY[state.language] || COPY.zh;
}

function applyLanguage() {
  const text = copy();
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : state.language;
  document.title = text.title;
  scoreLabel.textContent = text.score;
  canvas.setAttribute("aria-label", text.canvas);
  gameOverText.textContent = text.over;

  if (state.phase === "running") {
    hint.textContent = text.running;
  } else if (state.phase === "over") {
    hint.textContent = text.over;
  } else {
    hint.textContent = text.idle;
  }
  actionButton.textContent = state.phase === "idle" ? text.start : text.restart;
}

function applyTheme(colors, mode) {
  if (colors) state.colors = { ...state.colors, ...colors };
  document.documentElement.dataset.mode = mode === "dark" ? "dark" : "light";
  const root = document.documentElement.style;
  root.setProperty("--game-background", state.colors.background);
  root.setProperty("--game-foreground", state.colors.foreground);
  root.setProperty("--game-card", state.colors.card);
  root.setProperty("--game-secondary", state.colors.secondary);
  root.setProperty("--game-muted", state.colors.muted);
  root.setProperty("--game-accent", state.colors.accent);
  root.setProperty("--game-accent-foreground", state.colors.accentForeground);
  root.setProperty("--game-border", state.colors.border);
  root.setProperty("--game-story", state.colors.story);
  draw(performance.now());
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function speedProfile() {
  const initial = clamp(world.width * 0.64 + 90, 185, 245);
  return {
    initial,
    limit: Math.min(335, initial * 1.35),
  };
}

function fitCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const previousGround = world.ground;
  const altitude = Math.max(0, previousGround - (player.y + player.height));
  const width = Math.max(120, Math.round(bounds.width));
  const height = Math.max(150, Math.round(bounds.height));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  world.width = width;
  world.height = height;
  world.ground = world.height - 27;
  player.x = clamp(Math.round(world.width * 0.12), 16, 30);
  canvas.width = Math.round(world.width * ratio);
  canvas.height = Math.round(world.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (state.phase !== "running" || player.grounded) {
    player.y = world.ground - player.height;
    player.grounded = true;
  } else {
    player.y = Math.min(world.ground - player.height, world.ground - player.height - altitude);
  }
  const profile = speedProfile();
  state.speedLimit = profile.limit;
  if (state.phase === "running") state.speed = Math.min(state.speed, state.speedLimit);
  draw(performance.now());
}

function resetGame() {
  const profile = speedProfile();
  state.score = 0;
  state.distance = 0;
  state.speed = profile.initial;
  state.speedLimit = profile.limit;
  state.nextGap = state.speed * config.firstObstacleDelay;
  state.obstacles = [];
  player.y = world.ground - player.height;
  player.velocityY = 0;
  player.grounded = true;
  scoreOutput.textContent = "000";
}

function startGame() {
  resetGame();
  state.phase = "running";
  overlay.hidden = true;
  hint.textContent = copy().running;
  actionButton.textContent = copy().restart;
  state.lastFrame = performance.now();
  canvas.focus({ preventScroll: true });
}

function endGame() {
  state.phase = "over";
  overlay.hidden = false;
  hint.textContent = copy().over;
  actionButton.textContent = copy().restart;
}

function jump() {
  if (state.phase === "idle" || state.phase === "over") {
    startGame();
    return;
  }
  if (!player.grounded) return;
  player.velocityY = config.jumpVelocity;
  player.grounded = false;
}

function spawnObstacle() {
  const levels = 2 + Math.floor(Math.random() * 3);
  const maximumWidth = clamp(Math.round(world.width * 0.15), 24, 34);
  const width = 22 + Math.floor(Math.random() * (maximumWidth - 21));
  state.obstacles.push({
    x: world.width + config.spawnLead,
    width,
    height: levels * config.bookHeight,
    levels,
    tone: Math.random() > 0.5,
  });

  const difficulty = clamp(state.score / 320, 0, 1);
  const shortestGap = config.minGapSeconds - difficulty * 0.2;
  const longestGap = config.maxGapSeconds - difficulty * 0.28;
  const airborneTime = (Math.abs(config.jumpVelocity) * 2) / config.gravity;
  const physicallySafeGap = airborneTime + config.landingRecovery;
  const randomGap = shortestGap + Math.random() * (longestGap - shortestGap);
  state.nextGap = width + state.speed * Math.max(physicallySafeGap, randomGap);
}

function overlaps(obstacle) {
  const paddingX = 6;
  const paddingY = 5;
  const playerLeft = player.x + paddingX;
  const playerRight = player.x + player.width - paddingX;
  const playerTop = player.y + paddingY;
  const playerBottom = player.y + player.height - 3;
  const obstacleTop = world.ground - obstacle.height;
  return (
    playerRight > obstacle.x + 3 &&
    playerLeft < obstacle.x + obstacle.width - 3 &&
    playerBottom > obstacleTop + 2 &&
    playerTop < world.ground
  );
}

function update(deltaMs) {
  const deltaSeconds = Math.min(deltaMs, 34) / 1000;
  state.speed = Math.min(state.speedLimit, state.speed + config.acceleration * deltaSeconds);
  const travel = state.speed * deltaSeconds;
  state.distance += travel;
  state.nextGap -= travel;

  if (state.nextGap <= 0) spawnObstacle();
  state.obstacles.forEach((obstacle) => {
    obstacle.x -= travel;
  });
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -12);

  if (!player.grounded) {
    player.velocityY += config.gravity * deltaSeconds;
    player.y += player.velocityY * deltaSeconds;
    if (player.y + player.height >= world.ground) {
      player.y = world.ground - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }
  }

  if (state.obstacles.some(overlaps)) {
    endGame();
    return;
  }

  state.score = Math.floor(state.distance / 10);
  scoreOutput.textContent = String(state.score).padStart(3, "0");
}

function drawPaperCat(timestamp) {
  const x = player.x;
  const y = player.y;
  const runningFrame =
    state.phase === "running" && !state.reducedMotion ? Math.floor(timestamp / 110) % 2 : 0;

  context.save();
  context.translate(x, y);
  context.scale(player.width / 36, player.height / 42);
  context.fillStyle = state.colors.accentForeground;
  context.strokeStyle = state.colors.foreground;
  context.lineWidth = 1.5;

  context.beginPath();
  context.moveTo(4, 18);
  context.lineTo(0, 11);
  context.lineTo(9, 15);
  context.lineTo(28, 15);
  context.lineTo(31, 33);
  context.lineTo(8, 33);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.rect(19, 5, 16, 16);
  context.moveTo(20, 5);
  context.lineTo(23, 0);
  context.lineTo(26, 5);
  context.moveTo(29, 5);
  context.lineTo(33, 0);
  context.lineTo(34, 6);
  context.fill();
  context.stroke();

  context.fillStyle = state.colors.card;
  context.fillRect(30, 10, 2.5, 2.5);

  context.fillStyle = state.colors.accentForeground;
  const leftLeg = runningFrame ? 7 : 10;
  const rightLeg = runningFrame ? 23 : 20;
  context.fillRect(leftLeg, 32, 5, 9);
  context.fillRect(rightLeg, 32, 5, 9);
  context.restore();
}

function drawBookPile(obstacle) {
  const top = world.ground - obstacle.height;
  for (let index = 0; index < obstacle.levels; index += 1) {
    const bookY = world.ground - (index + 1) * config.bookHeight;
    const inset = index % 2 === 0 ? 0 : 2;
    context.fillStyle = (index + Number(obstacle.tone)) % 2 === 0 ? state.colors.story : state.colors.accent;
    context.strokeStyle = state.colors.foreground;
    context.lineWidth = 1;
    context.fillRect(obstacle.x + inset, bookY, obstacle.width - inset, 6);
    context.strokeRect(obstacle.x + inset, bookY, obstacle.width - inset, 6);
    context.beginPath();
    context.moveTo(obstacle.x + inset + 4, bookY + 2);
    context.lineTo(obstacle.x + obstacle.width - 3, bookY + 2);
    context.stroke();
  }
  context.fillStyle = state.colors.foreground;
  context.fillRect(obstacle.x + 1, top - 1, Math.max(7, obstacle.width * 0.32), 1);
}

function drawCloud(x, y, scale = 1) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.strokeStyle = state.colors.border;
  context.lineWidth = 1.2;
  context.beginPath();
  context.arc(13, 11, 7, Math.PI, Math.PI * 2);
  context.arc(22, 8, 9, Math.PI, Math.PI * 2);
  context.arc(32, 12, 6, Math.PI, Math.PI * 2);
  context.moveTo(6, 12);
  context.lineTo(38, 12);
  context.stroke();
  context.restore();
}

function draw(timestamp = performance.now()) {
  context.clearRect(0, 0, world.width, world.height);
  context.fillStyle = state.colors.card;
  context.fillRect(0, 0, world.width, world.height);

  context.strokeStyle = state.colors.border;
  context.lineWidth = 1;
  for (let y = 24; y < world.ground; y += 24) {
    context.globalAlpha = 0.28;
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(world.width, y + 0.5);
    context.stroke();
  }
  context.globalAlpha = 1;

  const cloudDrift = state.reducedMotion ? 0 : (state.distance * 0.08) % (world.width + 80);
  drawCloud(world.width - cloudDrift, 27, 0.82);
  drawCloud((world.width * 0.42 - cloudDrift * 0.55 + world.width + 80) % (world.width + 80) - 40, 58, 0.56);

  context.strokeStyle = state.colors.foreground;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(0, world.ground + 0.5);
  context.lineTo(world.width, world.ground + 0.5);
  context.stroke();

  state.obstacles.forEach(drawBookPile);
  drawPaperCat(timestamp);
}

function loop(timestamp) {
  const delta = timestamp - state.lastFrame;
  state.lastFrame = timestamp;
  if (state.phase === "running" && state.parentActive && !document.hidden) update(delta);
  draw(timestamp);
  requestAnimationFrame(loop);
}

actionButton.addEventListener("click", startGame);

gameStage.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  jump();
});

canvas.addEventListener("keydown", (event) => {
  if (!["Space", "ArrowUp"].includes(event.code) || event.repeat) return;
  event.preventDefault();
  jump();
});

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  const payload = event.data;
  if (!payload || payload.type !== "mmv:game-preferences") return;
  state.language = COPY[payload.language] ? payload.language : "zh";
  state.reducedMotion = Boolean(payload.reducedMotion);
  state.parentActive = payload.active !== false;
  state.lastFrame = performance.now();
  applyLanguage();
  applyTheme(payload.colors, payload.mode);
});

document.addEventListener("visibilitychange", () => {
  state.lastFrame = performance.now();
});

new ResizeObserver(fitCanvas).observe(canvas);
resetGame();
applyLanguage();
fitCanvas();
requestAnimationFrame(loop);
window.parent.postMessage({ type: "mmv:game-ready" }, "*");
