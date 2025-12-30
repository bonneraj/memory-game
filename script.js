const characters = [
  "🐻", "🐰", "🦊", "🐱",
  "🐶", "🐸", "🐵", "🦁",
  "🐼", "🐯", "🐷", "🐮",
  "🦉", "🐔", "🐧", "🐨"
];

const books = [
  "📕", "📗", "📘", "📙",
  "📓", "📔", "📒", "📚",
  "📖", "🧾", "📜", "📄",
  "🗂️", "📁", "🗃️", "📰"
];

let gameState = {
  tiles: [],
  remainingBooks: [],
  score: 0,
  selectedTile: null,
  revealedTile: null
};

// DOM elements
const boardEl = document.getElementById("board");
const booksEl = document.getElementById("books");
const spinBtn = document.getElementById("spin-btn");
const resultEl = document.getElementById("wheel-result");
const scoreEl = document.getElementById("score");
const flipBackPanel = document.getElementById("flip-back-panel");
const flipBackBtn = document.getElementById("flip-back-btn");

// Shuffle helper
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Initialize game
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
  renderBoard();
  renderBookshelf();
  scoreEl.textContent = gameState.score;
  resultEl.textContent = "";
  flipBackPanel.classList.add("hidden");
}

// Render board
function renderBoard() {
  boardEl.innerHTML = "";
  gameState.tiles.forEach((tile, i) => {
    const div = document.createElement("div");
    div.className = "tile";
    if (tile.removed) div.classList.add("removed");
    if (i === gameState.revealedTile) div.classList.add("revealed");
    if (i === gameState.selectedTile) div.classList.add("selected");

    const inner = document.createElement("div");
    inner.className = "tile-inner";
    if (i === gameState.revealedTile || tile.removed) inner.classList.add("flipped");

    const front = document.createElement("div");
    front.className = "tile-front";
    front.textContent = tile.character;

    const back = document.createElement("div");
    back.className = "tile-back";
    back.textContent = tile.book;

    inner.appendChild(front);
    inner.appendChild(back);
    div.appendChild(inner);

    if (!tile.removed) div.onclick = () => onTileClick(i);

    boardEl.appendChild(div);
  });
}

// Render bookshelf
function renderBookshelf() {
  booksEl.innerHTML = "";
  gameState.remainingBooks.forEach(book => {
    const span = document.createElement("span");
    span.className = "book";
    span.textContent = book;
    span.onclick = () => handleGuess(book);
    booksEl.appendChild(span);
  });
}

// Spin with deceleration and clearing previous selection
spinBtn.onclick = () => {
  const availableIndices = gameState.tiles
    .map((t, i) => ({ t, i }))
    .filter(x => !x.t.removed)
    .map(x => x.i);

  if (!availableIndices.length) return;

  // Clear previous selection
  if (gameState.selectedTile !== null) {
    boardEl.children[gameState.selectedTile].classList.remove("selected");
    gameState.selectedTile = null;
    resultEl.textContent = "";
  }

  let iteration = 0;
  let current = null;
  const totalIterations = 15; // fewer steps for faster spin
  let intervalTime = 50; // fast start

  const spinStep = () => {
    if (current !== null) boardEl.children[current].classList.remove("highlighted");

    current = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    boardEl.children[current].classList.add("highlighted");

    iteration++;
    intervalTime = Math.min(150, 50 + iteration * 10); // gradual deceleration

    if (iteration < totalIterations) {
      setTimeout(spinStep, intervalTime);
    } else {
      gameState.selectedTile = current;
      boardEl.children[current].classList.add("selected"); // prominent final highlight
      resultEl.textContent = `Selected: ${gameState.tiles[current].character}`;
    }
  };

  spinStep();
};

// Handle guess
function handleGuess(bookGuess) {
  if (gameState.selectedTile === null) {
    alert("Spin to select a character first!");
    return;
  }

  const tile = gameState.tiles[gameState.selectedTile];

  gameState.revealedTile = gameState.selectedTile;
  renderBoard();

  if (bookGuess === tile.book) {
    tile.removed = true;
    gameState.score++;
    gameState.remainingBooks = gameState.remainingBooks.filter(b => b !== tile.book);
    scoreEl.textContent = gameState.score;
  }

  flipBackPanel.classList.remove("hidden");
}

// Flip back
flipBackBtn.onclick = () => {
  gameState.revealedTile = null;
  gameState.selectedTile = null;
  renderBoard();
  renderBookshelf();
  flipBackPanel.classList.add("hidden");
};

// Tile click placeholder
function onTileClick(tileIndex) {
  console.log("Tile clicked:", tileIndex);
}

// Initialize game
initGame();
