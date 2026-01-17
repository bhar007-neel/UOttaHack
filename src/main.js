const COLS = 10;
const ROWS = 20;
const TILE = 26;
const NEXT_TILE = 13;
const AUTO_DELAY_MS = 2200;
const AUTO_STREAK_LIMIT = 3;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next-pieces");
const nextCtx = nextCanvas.getContext("2d");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const modeLabelEl = document.getElementById("mode-label");
const countdownEl = document.getElementById("countdown");
const suggestionsEl = document.getElementById("suggestions");
const logEl = document.getElementById("log");

const modeButtons = {
  advise: document.getElementById("mode-advise"),
  timed: document.getElementById("mode-timed"),
  autopilot: document.getElementById("mode-autopilot"),
  emergency: document.getElementById("mode-emergency"),
};

const COLORS = {
  I: "#22d3ee",
  O: "#facc15",
  T: "#c084fc",
  S: "#22c55e",
  Z: "#ef4444",
  J: "#38bdf8",
  L: "#f97316",
};

const SHAPES = {
  I: [
    [ [0,1], [1,1], [2,1], [3,1] ],
    [ [2,0], [2,1], [2,2], [2,3] ],
    [ [0,2], [1,2], [2,2], [3,2] ],
    [ [1,0], [1,1], [1,2], [1,3] ],
  ],
  O: [
    [ [1,0], [2,0], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [2,1] ],
  ],
  T: [
    [ [1,0], [0,1], [1,1], [2,1] ],
    [ [1,0], [1,1], [2,1], [1,2] ],
    [ [0,1], [1,1], [2,1], [1,2] ],
    [ [1,0], [0,1], [1,1], [1,2] ],
  ],
  S: [
    [ [1,0], [2,0], [0,1], [1,1] ],
    [ [1,0], [1,1], [2,1], [2,2] ],
    [ [1,1], [2,1], [0,2], [1,2] ],
    [ [0,0], [0,1], [1,1], [1,2] ],
  ],
  Z: [
    [ [0,0], [1,0], [1,1], [2,1] ],
    [ [2,0], [1,1], [2,1], [1,2] ],
    [ [0,1], [1,1], [1,2], [2,2] ],
    [ [1,0], [0,1], [1,1], [0,2] ],
  ],
  J: [
    [ [0,0], [0,1], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [1,2] ],
    [ [0,1], [1,1], [2,1], [2,2] ],
    [ [1,0], [1,1], [0,2], [1,2] ],
  ],
  L: [
    [ [2,0], [0,1], [1,1], [2,1] ],
    [ [1,0], [1,1], [1,2], [2,2] ],
    [ [0,1], [1,1], [2,1], [0,2] ],
    [ [0,0], [1,0], [1,1], [1,2] ],
  ],
};

const PIECE_TYPES = Object.keys(SHAPES);

let board = createBoard();
let current = null;
let queue = [];
let dropTimer = 0;
let dropInterval = 800;
let score = 0;
let lines = 0;
let level = 1;
let suggestions = [];
let mode = "advise";
let autoDeadline = null;
let autoStreak = 0;
let lastFrame = 0;
let gameOver = false;

start();

function start() {
  refillQueue();
  spawnPiece();
  bindControls();
  selectMode("advise");
  requestAnimationFrame(loop);
  logEvent("Game", "Started session");
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function refillQueue() {
  while (queue.length < 5) {
    const shuffled = [...PIECE_TYPES].sort(() => Math.random() - 0.5);
    queue.push(...shuffled);
  }
}

function spawnPiece() {
  refillQueue();
  const type = queue.shift();
  current = {
    type,
    rotation: 0,
    x: 3,
    y: 0,
  };
  if (collides(board, current)) {
    gameOver = true;
    logEvent("Game", "Top out detected, restart page to play again.");
  }
  updateSuggestions();
  resetAutoTimer();
}

function bindControls() {
  document.addEventListener("keydown", (e) => {
    if (gameOver) return;
    if (e.code === "ArrowLeft") move(-1);
    if (e.code === "ArrowRight") move(1);
    if (e.code === "ArrowUp") rotate();
    if (e.code === "ArrowDown") {
      if (mode === "autopilot" && suggestions[0]) {
        applySuggestion(suggestions[0]);
        logEvent("Autopilot", "Placed best move via down arrow");
      } else {
        softDrop();
      }
    }
    if (e.code === "Space") hardDrop();
    if (e.code === "KeyA") selectMode("advise");
    if (e.code === "KeyS") selectMode("timed");
    if (e.code === "KeyE") selectMode("autopilot");
    if (e.code === "KeyD") emergencyDrop();
  });

  Object.entries(modeButtons).forEach(([key, btn]) => {
    btn.addEventListener("click", () => selectMode(key));
  });
}

function selectMode(next) {
  mode = next;
  Object.entries(modeButtons).forEach(([key, btn]) => {
    btn.classList.toggle("active", key === next);
  });
  modeLabelEl.textContent = modeLabel(mode);
  logEvent("Mode", `Switched to ${modeLabel(mode)}`);
  resetAutoTimer();
}

function loop(timestamp) {
  const delta = timestamp - lastFrame;
  lastFrame = timestamp;

  if (!gameOver) {
    dropTimer += delta;
    if (dropTimer > dropInterval) {
      dropTimer = 0;
      softDrop();
    }
    maybeAutoPlace(timestamp);
  }

  draw();
  requestAnimationFrame(loop);
}

function move(dir) {
  const next = { ...current, x: current.x + dir };
  if (!collides(board, next)) {
    current = next;
    humanAction();
  }
}

function rotate() {
  const next = { ...current, rotation: (current.rotation + 1) % 4 };
  if (!collides(board, next)) {
    current = next;
    humanAction();
  }
}

function softDrop() {
  const next = { ...current, y: current.y + 1 };
  if (!collides(board, next)) {
    current = next;
    return;
  }
  lockPiece();
}

function hardDrop() {
  while (!collides(board, { ...current, y: current.y + 1 })) {
    current.y += 1;
  }
  lockPiece();
  humanAction();
}

function emergencyDrop() {
  if (mode !== "emergency") selectMode("emergency");
  const best = suggestions[0];
  if (best) {
    applySuggestion(best);
    logEvent("Assist", "Emergency drop executed (best survival move)");
  }
  resetAutoTimer(true);
}

function humanAction() {
  autoStreak = 0;
  resetAutoTimer();
}

function lockPiece() {
  merge(board, current);
  const cleared = clearLines(board);
  if (cleared > 0) logEvent("Lines", `Cleared ${cleared} line${cleared > 1 ? "s" : ""}`);
  lines += cleared;
  score += calcScore(cleared);
  level = Math.floor(lines / 10) + 1;
  dropInterval = Math.max(200, 800 - (level - 1) * 60);
  spawnPiece();
  dropTimer = 0;
}

function calcScore(cleared) {
  if (cleared === 1) return 100 * level;
  if (cleared === 2) return 300 * level;
  if (cleared === 3) return 500 * level;
  if (cleared >= 4) return 800 * level;
  return 0;
}

function collides(state, piece) {
  return SHAPES[piece.type][piece.rotation].some(([dx, dy]) => {
    const x = piece.x + dx;
    const y = piece.y + dy;
    return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && state[y][x]);
  });
}

function merge(state, piece) {
  SHAPES[piece.type][piece.rotation].forEach(([dx, dy]) => {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y >= 0) state[y][x] = piece.type;
  });
}

function clearLines(state) {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (state[y].every(Boolean)) {
      state.splice(y, 1);
      state.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }
  return cleared;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard(board);
  drawGhost(current);
  drawPiece(current);
  drawNextPieces();
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
  updateCountdown();
}

function drawBoard(state) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = state[y][x];
      ctx.fillStyle = cell ? COLORS[cell] : "#0b1224";
      ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
    }
  }
}

function drawPiece(piece) {
  ctx.fillStyle = COLORS[piece.type];
  SHAPES[piece.type][piece.rotation].forEach(([dx, dy]) => {
    const x = (piece.x + dx) * TILE;
    const y = (piece.y + dy) * TILE;
    ctx.fillRect(x, y, TILE - 1, TILE - 1);
  });
}

function drawGhost(piece) {
  const best = suggestions[0];
  const target = best && mode !== "advise" ? best : getLandingGhost(piece);
  if (!target) return;
  ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
  SHAPES[target.type][target.rotation].forEach(([dx, dy]) => {
    const x = (target.x + dx) * TILE;
    const y = (target.y + dy) * TILE;
    ctx.fillRect(x, y, TILE - 1, TILE - 1);
  });
}

function getLandingGhost(piece) {
  let ghost = { ...piece };
  while (!collides(board, { ...ghost, y: ghost.y + 1 })) ghost.y++;
  return ghost;
}

function maybeAutoPlace(timestamp) {
  if (mode !== "timed" || !autoDeadline) return;
  if (autoStreak >= AUTO_STREAK_LIMIT) {
    countdownEl.textContent = "manual";
    return;
  }
  if (timestamp >= autoDeadline && suggestions[0]) {
    applySuggestion(suggestions[0]);
    autoStreak++;
    logEvent("Assist", `Auto-placed best move (streak ${autoStreak})`);
    resetAutoTimer(true);
  }
}

function applySuggestion(sug) {
  current = { type: sug.type, rotation: sug.rotation, x: sug.x, y: sug.y };
  lockPiece();
}

function resetAutoTimer(skip = false) {
  if (mode !== "timed" || skip) {
    autoDeadline = null;
    return;
  }
  autoDeadline = performance.now() + AUTO_DELAY_MS;
}

function updateCountdown() {
  if (mode !== "timed" || !autoDeadline) {
    countdownEl.textContent = "-";
    return;
  }
  const ms = Math.max(0, autoDeadline - performance.now());
  countdownEl.textContent = (ms / 1000).toFixed(1) + "s";
}

function updateSuggestions() {
  suggestions = rankMoves(board, current);
  renderSuggestions();
}

function rankMoves(state, piece) {
  const moves = [];
  for (let rot = 0; rot < 4; rot++) {
    const shape = SHAPES[piece.type][rot];
    const minX = -Math.min(...shape.map(([dx]) => dx));
    const maxX = COLS - Math.max(...shape.map(([dx]) => dx)) - 1;
    for (let x = minX; x <= maxX; x++) {
      const landing = dropToCollision(state, piece.type, rot, x);
      if (!landing) continue;
      const simulated = simulatePlacement(state, landing);
      const score = evaluate(simulated);
      moves.push({ ...landing, score, lines: simulated.lines, risk: simulated.risk });
    }
  }
  moves.sort((a, b) => b.score - a.score);
  return moves.slice(0, 3);
}

function dropToCollision(state, type, rotation, x) {
  let y = -2;
  let test = { type, rotation, x, y };
  while (!collides(state, { ...test, y: test.y + 1 })) {
    test.y += 1;
  }
  if (test.y < 0) return null;
  return test;
}

function simulatePlacement(state, piece) {
  const cloned = state.map((row) => [...row]);
  merge(cloned, piece);
  const linesCleared = clearLines(cloned);
  const features = getFeatures(cloned);
  return { ...features, lines: linesCleared };
}

function getFeatures(state) {
  let holes = 0;
  let aggregateHeight = 0;
  let bumpiness = 0;
  let maxHeight = 0;
  const heights = [];

  for (let x = 0; x < COLS; x++) {
    let y = 0;
    while (y < ROWS && !state[y][x]) y++;
    const h = ROWS - y;
    heights.push(h);
    aggregateHeight += h;
    maxHeight = Math.max(maxHeight, h);
    for (; y < ROWS; y++) {
      if (!state[y][x]) holes++;
    }
  }

  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }

  const risk = maxHeight / ROWS;
  return { holes, aggregateHeight, bumpiness, maxHeight, risk };
}

function evaluate(sim) {
  // Weighted heuristic favoring survival and clears.
  const { holes, aggregateHeight, bumpiness, lines, maxHeight } = sim;
  const score =
    lines * 8 -
    holes * 4 -
    aggregateHeight * 0.5 -
    bumpiness * 0.6 -
    maxHeight * 0.3;
  return score;
}

function renderSuggestions() {
  suggestionsEl.innerHTML = "";
  suggestions.forEach((sug, idx) => {
    const li = document.createElement("li");
    li.className = "suggestion";
    const badge = document.createElement("span");
    badge.className = `badge ${riskLabel(sug.risk)}`;
    badge.textContent = labelForRisk(sug.risk);
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = `${idx + 1}. ${sug.type} @ x${sug.x} r${sug.rotation}`;
    const info = document.createElement("span");
    info.textContent = `score ${sug.score.toFixed(1)} · lines ${sug.lines}`;
    li.appendChild(label);
    li.appendChild(badge);
    li.appendChild(info);
    suggestionsEl.appendChild(li);
  });
}

function riskLabel(risk) {
  if (risk < 0.35) return "safe";
  if (risk < 0.6) return "neutral";
  return "risky";
}

function labelForRisk(risk) {
  if (risk < 0.35) return "Safe";
  if (risk < 0.6) return "Neutral";
  return "Risky";
}

function modeLabel(key) {
  if (key === "advise") return "Advise-only";
  if (key === "timed") return "Timed assist";
  if (key === "autopilot") return "Autopilot";
  return "Emergency drop";
}

function drawNextPieces() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  let yOffset = 8;
  for (let i = 0; i < Math.min(4, queue.length); i++) {
    const type = queue[i];
    const color = COLORS[type];
    nextCtx.fillStyle = color;
    const shape = SHAPES[type][0];
    shape.forEach(([dx, dy]) => {
      nextCtx.fillRect(dx * NEXT_TILE + 13, yOffset + dy * NEXT_TILE, NEXT_TILE - 1, NEXT_TILE - 1);
    });
    nextCtx.fillStyle = "rgba(255, 255, 255, 0.15)";
    nextCtx.font = "11px Space Grotesk";
    nextCtx.fillText(type, 8, yOffset + 45);
    yOffset += 60;
  }
}

function logEvent(channel, message) {
  const entry = document.createElement("p");
  entry.className = "log-entry";
  entry.innerHTML = `<strong>${channel}:</strong> ${message}`;
  logEl.prepend(entry);
  while (logEl.childNodes.length > 30) logEl.removeChild(logEl.lastChild);
}
