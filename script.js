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
// waitingForSpin → waitingForGuess → waitingForFlipBack

const boardEl = document.getElementById("board");
const booksEl = document.getElementById("books");
const spinBtn = document.getElementById("spin-btn");
const flipBackBtn = document.getElementById("flip-back-btn");
const flipBackPanel = document.getElementById("flip-back-panel");
const resultEl = document.getElementById("wheel-result");
const scoreEl = document.getElementById("score");

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function initGame() {
  const shuffledBooks = shuffle(books);
  gameState.tiles = characters.map((char, i) => ({
    character: char,
    book: shuffledBooks[i],
    removed: false
  }));
  gameState.remainingBooks = [...shuffledBooks];
  gamePhase = "waitingForSpin";
  render();
}

/* ===== RENDER ===== */

function render() {
  renderBoard();
  renderBookshelf();
  updateControls();
  scoreEl.textContent = gameState.score;
}

function renderBoard() {
  boardEl.innerHTML = "";
  gameState.tiles.forEach((tile, i) => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    if (tile.removed) tileEl.classList.add("removed");
    if (i === gameState.selectedTile) tileEl.classList.add("selected");

    const inner = document.createElement("div");
    inner.className = "tile-inner";
    if (i === gameState.revealedTile) inner.classList.add("flipped");

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

function renderBookshelf() {
  booksEl.innerHTML = "";
  gameState.remainingBooks.forEach(book => {
    const span = document.createElement("span");
    span.className = "book";
    span.textContent = book;

    if (gamePhase !== "waitingForGuess") {
      span.classList.add("disabled");
    } else {
      span.onclick = () => handleGuess(book);
    }

    booksEl.appendChild(span);
  });
}

function updateControls() {
  spinBtn.disabled = gamePhase !== "waitingForSpin";
  flipBackBtn.disabled = gamePhase !== "waitingForFlipBack";
}

/* ===== SPIN ===== */

spinBtn.onclick = () => {
  if (gamePhase !== "waitingForSpin") return;

  gameState.selectedTile = null;
  resultEl.textContent = "";

  const available = gameState.tiles
    .map((t, i) => (!t.removed ? i : null))
    .filter(i => i !== null);

  let steps = 10;
  let current = null;
  let delay = 40;

  const spin = () => {
    if (current !== null) {
      boardEl.children[current].classList.remove("highlighted");
    }

    current = available[Math.floor(Math.random() * available.length)];
    boardEl.children[current].classList.add("highlighted");

    delay += 12;
    steps--;

    if (steps > 0) {
      setTimeout(spin, delay);
    } else {
      gameState.selectedTile = current;
      resultEl.textContent = `Selected: ${gameState.tiles[current].character}`;
      gamePhase = "waitingForGuess";
      render();
    }
  };

  spin();
};

/* ===== GUESS ===== */

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

  flipBackPanel.classList.remove("hidden");
  gamePhase = "waitingForFlipBack";
  render();
}

/* ===== FLIP BACK ===== */

flipBackBtn.onclick = () => {
  if (gamePhase !== "waitingForFlipBack") return;

  gameState.revealedTile = null;
  gameState.selectedTile = null;
  flipBackPanel.classList.add("hidden");

  gamePhase = "waitingForSpin";
  render();
};

initGame();
