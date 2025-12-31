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

function render() {
  renderBoard();
  renderBookshelf();
  updateControls();
  scoreEl.textContent = gameState.score;
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

/* ----- BUTTON STATES ----- */

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
  if (gamePhase !== "waitingForSpin") return;

  gamePhase = "spinning";
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

      gamePhase = "waitingForGuess";
      render();
    }
  };

  spin();
};

/* ================= GUESS ================= */

function handleGuess(bookGuess) {
  if (gamePhase !== "waitingForGuess") return;

  const tile = gameState.tiles[gameState.selectedTile];
  gameState.revealedTile = gameState.selectedTile;

  if (bookGuess === tile.book) {
    tile.removed = true;
    gameState.score++;
    gameState.remainingBooks =
      gameState.remainingBooks.filter(b => b !== bookGuess);
  }

  gamePhase = "waitingForFlipBack";
  render();
}

/* ================= FLIP BACK ================= */

flipBackBtn.onclick = () => {
  if (gamePhase !== "waitingForFlipBack") return;

  gameState.revealedTile = null;
  gameState.selectedTile = null;

  gamePhase = "waitingForSpin";
  render();
};

initGame();
