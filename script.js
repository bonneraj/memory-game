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
  waitingForGuess: ["waitingForFlipBack", "waitingForSpinCorrect"],
  waitingForFlipBack: ["waitingForSpin"],
  waitingForSpinCorrect: ["spinning"] // Correct guess goes back to spin
};

// Simple assertion function
function assert(condition, message) {
  if (!condition) {
    console.error("❌ GAME ASSERTION FAILED:", message);
    throw new Error(message);
  }
}

function transitionTo(nextPhase) {
  assert(
    PHASES[gamePhase].includes(nextPhase),
    `Illegal transition: ${gamePhase} → ${nextPhase}`
  );
  gamePhase = nextPhase;
}

// Timer setup
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

// Game state
let gameState = {
  tiles: [],
  remainingBooks: [],
  selectedTile: null,
  revealedTile: null
};

let gamePhase = "waitingForSpin";

const boardEl = document.getElementById("board");
const booksEl = document.getElementById("books");
const actionBtn = document.getElementById("action-btn");

// Shuffle utility
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
  gameState.selectedTile = null;
  gameState.revealedTile = null;
  gamePhase = "waitingForSpin";

  startTimer();
  render();
}

/* ================= RENDER ================= */
function render() {
  renderBoard();
  renderBookshelf();
  updateActionButton();
}

/* ----- BOARD ----- */
function renderBoard() {
  boardEl.innerHTML = "";

  gameState.tiles.forEach((tile, i) => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    tileEl.style.pointerEvents = "none";

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
}

/* ----- BOOKSHELF ----- */
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

/* ----- SINGLE ACTION BUTTON ----- */
function updateActionButton() {
  switch (gamePhase) {
    case "waitingForSpin":
    case "waitingForSpinCorrect":
      actionBtn.textContent = "Spin";
      actionBtn.disabled = false;
      actionBtn.onclick = () => {
        // Remove glow from previously correct tile
        if (gameState.lastGuessCorrect && gameState.selectedTile !== null) {
          const tileEl = boardEl.children[gameState.selectedTile];
          tileEl.classList.remove("correct-glow");
          gameState.lastGuessCorrect = false;
        }
        spinCharacter();
      };
      break;

    case "spinning":
      actionBtn.textContent = "Spinning...";
      actionBtn.disabled = true;
      break;

    case "waitingForGuess":
      actionBtn.textContent = "Make your guess";
      actionBtn.disabled = true;
      break;

    case "waitingForFlipBack":
      actionBtn.textContent = "Flip Card Back";
      actionBtn.disabled = false;
      actionBtn.onclick = flipBack;
      break;
  }
}

/* ================= SPIN ================= */
function spinCharacter() {
  assert(gamePhase === "waitingForSpin" || gamePhase === "waitingForSpinCorrect", "Spin clicked at wrong time");
  transitionTo("spinning");

  gameState.selectedTile = null;

  const available = gameState.tiles
    .map((t, i) => !t.removed ? i : null)
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
    gameState.remainingBooks = gameState.remainingBooks.filter(b => b !== bookGuess);

    // Add green glow on correct guess
    const tileEl = boardEl.children[gameState.selectedTile];
    tileEl.classList.add("correct-glow");

    // Flag to indicate correct guess
    gameState.lastGuessCorrect = true;

    // Set phase to spin directly after correct guess
    transitionTo("waitingForSpinCorrect");

  } else {
    // Incorrect guess: require flip back
    gameState.lastGuessCorrect = false;
    transitionTo("waitingForFlipBack");
  }

  // Check if game completed
  if (gameState.tiles.every(t => t.removed)) {
    stopTimer();
    setTimeout(() => alert(`🎉 You finished! Time: ${formatTime(elapsedSeconds)}`), 200);
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
