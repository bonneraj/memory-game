const characters = [
  "🐻","🐰","🦊","🐱",
  "🐶","🐸","🐵","🦁",
  "🐼","🐯","🐷","🐮",
  "🦉","🐔","🐧","🐨"
];

const books = [
  "📕","📗","📘","📙",
  "📓","📔","📒","📚",
  "📖","🧾","📜","📄",
  "🗂️","📁","🗃️","📰"
];

const PHASES = {
  waitingForSpin: ["spinning"],
  spinning: ["waitingForGuess"],
  waitingForGuess: ["waitingForFlipBack"],
  waitingForFlipBack: ["waitingForSpin"]
};

// Simple assertion function
function assert(condition, message) {
  if (!condition) {
    console.error("❌ GAME ASSERTION FAILED:", message);
    throw new Error(message);
  }
}

function transitionTo(nextPhase) {
  assert(PHASES[gamePhase].includes(nextPhase), `Illegal transition: ${gamePhase} → ${nextPhase}`);
  gamePhase = nextPhase;
}

let timerInterval = null;
let elapsedSeconds = 0;

const timerEl = document.getElementById("timer");

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedSeconds = 0;
  timerEl.textContent = formatTime(elapsedSeconds);
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    timerEl.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}


let gameState = {
  tiles: [],
  remainingBooks: [],
  selectedTile: null,
  revealedTile: null,
  score: 0
};

let gamePhase = "waitingForSpin";

const boardEl = document.getElementById("board");
const booksEl = document.getElementById("books");
const actionBtn = document.getElementById("action-btn");
const resultEl = document.getElementById("wheel-result");
const scoreEl = document.getElementById("score");

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

/* ================= INIT ================= */
function initGame(tileCount = 16) {
  const shuffledChars = shuffle(characters).slice(0, tileCount);
  const shuffledBooks = shuffle(books).slice(0, tileCount);

  gameState.tiles = shuffledChars.map((char, i) => ({
    character: char,
    book: shuffledBooks[i],
    removed: false
  }));

  gameState.remainingBooks = [...shuffledBooks];
  gameState.score = 0;
  gameState.selectedTile = null;
  gameState.revealedTile = null;
  gamePhase = "waitingForSpin";

  startTimer();

  render();
}

/* ================= RENDER ================= */
function validateState() {
  if (gamePhase === "waitingForGuess") {
    assert(gameState.selectedTile !== null, "Guess phase without selected tile");
  }
  if (gamePhase === "waitingForSpin") {
    assert(gameState.revealedTile === null, "Tile revealed during spin phase");
  }
}

function render() {
  renderBoard();
  renderBookshelf();
  updateActionButton();
  scoreEl.textContent = gameState.score;
  validateState();
}

/* ----- BOARD (DECORATIVE ONLY) ----- */
function renderBoard() {
  boardEl.innerHTML = "";

  gameState.tiles.forEach((tile, i) => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    tileEl.style.pointerEvents = "none";
    tileEl.style.cursor = "default";

    if (tile.removed) tileEl.classList.add("removed");
    if (i === gameState.selectedTile) tileEl.classList.add("selected");

    const inner = document.createElement("div");
    inner.className = "tile-inner";
    if (i === gameState.revealedTile) {
      inner.classList.add("flipped");
      tileEl.classList.add("revealed");
    }

    const front = document.createElement("div");
    front.className = "tile-front";
    front.textContent = tile.character;

    const back = document.createElement("div");
    back.className = "tile-back";
    back.textContent = tile.book;

    inner.append(front, back);
    tileEl.appendChild(inner);
    boardEl.appendChild(tileEl);
  });

  // DEBUG INFO - comment out as necessary
  // document.getElementById("debug").textContent =
  //   `Phase: ${gamePhase}\nSelected: ${gameState.selectedTile}\nRevealed: ${gameState.revealedTile}\nRemaining books: ${gameState.remainingBooks.length}`;
}

/* ----- BOOKSHELF (GUESSING ONLY) ----- */
function renderBookshelf() {
  booksEl.innerHTML = "";

  gameState.remainingBooks.forEach(book => {
    const span = document.createElement("span");
    span.className = "book";
    span.textContent = book;

    if (gamePhase !== "waitingForGuess") {
      span.style.pointerEvents = "none";
      span.style.opacity = "0.4";
    } else {
      span.onclick = () => handleGuess(book);
    }

    booksEl.appendChild(span);
  });
}

/* ================= SINGLE ACTION BUTTON ================= */
function updateActionButton() {
  switch (gamePhase) {
    case "waitingForSpin":
      actionBtn.textContent = "SPIN";
      actionBtn.disabled = false;
      actionBtn.onclick = spinCharacter;
      break;

    case "spinning":
      actionBtn.textContent = "Spinning...";
      actionBtn.disabled = true;
      break;

    case "waitingForGuess":
      actionBtn.textContent = "Make your guess";
      actionBtn.disabled = true; // Guess via bookshelf
      break;

    case "waitingForFlipBack":
      actionBtn.textContent = "Flip Back";
      actionBtn.disabled = false;
      actionBtn.onclick = flipBack;
      break;
  }
}

/* ================= SPIN ================= */
function spinCharacter() {
  assert(gamePhase === "waitingForSpin", "Spin clicked at wrong time");
  transitionTo("spinning");

  gameState.selectedTile = null;

  const available = gameState.tiles
    .map((t,i) => !t.removed ? i : null)
    .filter(i => i !== null);

  let steps = 10;
  let current = null;
  let delay = 30;

  const spin = () => {
    if (current !== null) boardEl.children[current].classList.remove("highlighted");

    current = available[Math.floor(Math.random() * available.length)];
    boardEl.children[current].classList.add("highlighted");

    steps--;
    delay += 10;

    if (steps > 0) setTimeout(spin, delay);
    else {
      gameState.selectedTile = current;
      boardEl.children[current].classList.remove("highlighted");
      boardEl.children[current].classList.add("selected");
      transitionTo("waitingForGuess");
      render();
    }
  };

  spin();
}

/* ================= GUESS ================= */
function handleGuess(bookGuess) {
  assert(gamePhase === "waitingForGuess", "Guess made at wrong time");
  assert(gameState.selectedTile !== null, "No tile selected");

  const tile = gameState.tiles[gameState.selectedTile];
  gameState.revealedTile = gameState.selectedTile;

  if (bookGuess === tile.book) {
    tile.removed = true;
    gameState.score++;
    gameState.remainingBooks = gameState.remainingBooks.filter(b => b !== bookGuess);
  }

  transitionTo("waitingForFlipBack");

  if (gameState.tiles.every(tile => tile.removed)) {
  stopTimer();
  alert(`🎉 You finished! Time: ${formatTime(elapsedSeconds)}`);
}

  render();
}

/* ================= FLIP BACK ================= */
function flipBack() {
  assert(gamePhase === "waitingForFlipBack", "Flip-back at wrong time");

  gameState.revealedTile = null;
  gameState.selectedTile = null;

  transitionTo("waitingForSpin");
  render();
}

initGame();
