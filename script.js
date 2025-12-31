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

// Simple assertion function for game state validation
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

let gameState = {
  tiles: [],
  remainingBooks: [],
  selectedTile: null,
  revealedTile: null,
  score: 0
};

let gamePhase = "waitingForSpin";
// waitingForSpin → spinning → waitingForGuess → waitingForFlipBack

const boardEl = document.getElementById("board");
const booksEl = document.getElementById("books");
const spinBtn = document.getElementById("spin-btn");
const flipBackBtn = document.getElementById("flip-back-btn");
const flipBackPanel = document.getElementById("flip-back-panel");
const resultEl = document.getElementById("wheel-result");
const scoreEl = document.getElementById("score");

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

/* ================= INIT ================= */

function initGame() {
  const shuffledBooks = shuffle(books);

  gameState.tiles = characters.map((char, i) => ({
    character: char,
    book: shuffledBooks[i],
    removed: false
  }));

  gameState.remainingBooks = [...shuffledBooks];
  gameState.score = 0;
  gameState.selectedTile = null;
  gameState.revealedTile = null;
  gamePhase = "waitingForSpin";

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
  updateControls();
  validateControls();
  scoreEl.textContent = gameState.score;
  validateState();
}


/* ----- BOARD (DECORATIVE ONLY) ----- */

function renderBoard() {
  boardEl.innerHTML = "";

  gameState.tiles.forEach((tile, i) => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";

    // Decorative only — no clicks
    tileEl.style.pointerEvents = "none";
    tileEl.style.cursor = "default";

    tileEl.onclick = () => {
      assert(false, "Tile click detected – tiles should not be interactive");
    };

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

    // Toggle debug info - comment out when fully deployed
    document.getElementById("debug").textContent =
      `Phase: ${gamePhase}
    Selected: ${gameState.selectedTile}
    Revealed: ${gameState.revealedTile}
    Remaining books: ${gameState.remainingBooks.length}`;
  });
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
      assert(gamePhase === "waitingForGuess", "Book clicked outside guess phase");
      span.onclick = () => handleGuess(book);
    }

    booksEl.appendChild(span);
  });
}

/* ----- BUTTON STATES ----- */
function validateControls() {
  assert(
    spinBtn.disabled === (gamePhase !== "waitingForSpin"),
    "Spin button desynced from phase"
  );
}

function updateControls() {
  spinBtn.disabled = gamePhase !== "waitingForSpin";
  flipBackBtn.disabled = gamePhase !== "waitingForFlipBack";

  flipBackPanel.classList.toggle(
    "hidden",
    gamePhase !== "waitingForFlipBack"
  );
}

/* ================= SPIN ================= */

spinBtn.onclick = () => {
  assert(gamePhase === "waitingForSpin", "Spin clicked at wrong time");
  transitionTo("spinning");

  gameState.selectedTile = null;
  resultEl.textContent = "";

  const available = gameState.tiles
    .map((t, i) => (!t.removed ? i : null))
    .filter(i => i !== null);

  let steps = 10;
  let current = null;
  let delay = 30;

  const spin = () => {
    if (current !== null) {
      boardEl.children[current].classList.remove("highlighted");
    }

    current = available[Math.floor(Math.random() * available.length)];
    boardEl.children[current].classList.add("highlighted");

    steps--;
    delay += 10;

    if (steps > 0) {
      setTimeout(spin, delay);
    } else {
      gameState.selectedTile = current;
      boardEl.children[current].classList.remove("highlighted");
      boardEl.children[current].classList.add("selected");

      resultEl.textContent =
        `Selected: ${gameState.tiles[current].character}`;

      transitionTo("waitingForGuess");
      render();
    }
  };

  spin();
};

/* ================= GUESS ================= */

function handleGuess(bookGuess) {
  assert(gamePhase === "waitingForGuess", "Guess made at wrong time");
  assert(gameState.selectedTile !== null, "No tile selected");

  const tile = gameState.tiles[gameState.selectedTile];
  gameState.revealedTile = gameState.selectedTile;

  if (bookGuess === tile.book) {
    tile.removed = true;
    gameState.score++;
    gameState.remainingBooks =
      gameState.remainingBooks.filter(b => b !== bookGuess);
  }

  transitionTo("waitingForFlipBack");
  render();
}

/* ================= FLIP BACK ================= */

flipBackBtn.onclick = () => {
  assert(gamePhase === "waitingForFlipBack", "Flip-back at wrong time");

  gameState.revealedTile = null;
  gameState.selectedTile = null;

  transitionTo("waitingForSpin");
  render();
};

initGame();
