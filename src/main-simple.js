const COLS = 10;
const ROWS = 20;
const TILE = 26;
const NEXT_TILE = 13;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next-pieces");
const nextCtx = nextCanvas.getContext("2d");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");

const gameOverOverlay = document.getElementById("game-over-overlay");
const retryBtn = document.getElementById("retry-btn");
const finalScoreEl = document.getElementById("final-score");
const finalLinesEl = document.getElementById("final-lines");
const finalLevelEl = document.getElementById("final-level");

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
let lastFrame = 0;
let gameOver = false;

start();

function start() {
  refillQueue();
  spawnPiece();
  bindControls();
  requestAnimationFrame(loop);
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
    showGameOver();
  }
  updateNextPiece();
}

function bindControls() {
  document.addEventListener("keydown", (e) => {
    // Prevent default browser actions for game keys
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code)) {
      e.preventDefault();
    }
    // Ignore auto-repeating keydown events
    if (e.repeat) return;
    if (gameOver) return;
    
    if (e.code === "ArrowLeft") move(-1);
    if (e.code === "ArrowRight") move(1);
    if (e.code === "ArrowUp") rotate();
    if (e.code === "ArrowDown") softDrop();
    if (e.code === "Space") hardDrop();
  });

  retryBtn.addEventListener("click", () => {
    resetGame();
  });
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
  }

  draw();
  requestAnimationFrame(loop);
}

function move(dir) {
  const next = { ...current, x: current.x + dir };
  if (!collides(board, next)) {
    current = next;
  }
}

function rotate() {
  const next = { ...current, rotation: (current.rotation + 1) % 4 };
  if (!collides(board, next)) {
    current = next;
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
}

function lockPiece() {
  merge(board, current);
  const cleared = clearLines(board);
  if (cleared > 0) {
    lines += cleared;
    score += calcScore(cleared);
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(200, 800 - (level - 1) * 60);
  }
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
  if (!piece) return;
  ctx.fillStyle = COLORS[piece.type];
  SHAPES[piece.type][piece.rotation].forEach(([dx, dy]) => {
    const x = (piece.x + dx) * TILE;
    const y = (piece.y + dy) * TILE;
    ctx.fillRect(x, y, TILE - 1, TILE - 1);
  });
}

function drawGhost(piece) {
  if (!piece) return;
  const ghost = { ...piece };
  while (!collides(board, { ...ghost, y: ghost.y + 1 })) ghost.y++;
  ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
  SHAPES[ghost.type][ghost.rotation].forEach(([dx, dy]) => {
    const x = (ghost.x + dx) * TILE;
    const y = (ghost.y + dy) * TILE;
    ctx.fillRect(x, y, TILE - 1, TILE - 1);
  });
}

function updateNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (queue.length === 0) return;
  const type = queue[0];
  const color = COLORS[type];
  nextCtx.fillStyle = color;
  const shape = SHAPES[type][0];
  const yOffset = 30;
  shape.forEach(([dx, dy]) => {
    nextCtx.fillRect(dx * NEXT_TILE + 13, yOffset + dy * NEXT_TILE, NEXT_TILE - 1, NEXT_TILE - 1);
  });
  nextCtx.fillStyle = "rgba(255, 255, 255, 0.15)";
  nextCtx.font = "11px Space Grotesk";
  nextCtx.fillText(type, 8, yOffset + 45);
}

function drawNextPieces() {
  updateNextPiece();
}

function resetGame() {
  board = createBoard();
  current = null;
  queue = [];
  dropTimer = 0;
  dropInterval = 800;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  gameOverOverlay.classList.add("hidden");
  start();
}

function showGameOver() {
  finalScoreEl.textContent = score;
  finalLinesEl.textContent = lines;
  finalLevelEl.textContent = level;
  gameOverOverlay.classList.remove("hidden");
}
