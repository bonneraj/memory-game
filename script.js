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
    if (gameState.selectedTile === i) div.classList.add("selected");

    // Inner container for flip animation
    const inner = document.createElement("div");
    inner.className = "tile-inner";
    if (i === gameState.revealedTile || tile.removed) {
      inner.classList.add("flipped");
    }

    // Front face (character)
    const front = document.createElement("div");
    front.className = "tile-front";
    front.textContent = tile.character;

    // Back face (book)
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

// Render interactive bookshelf
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

// Spin wheel
spinBtn.onclick = () => {
  const available = gameState.tiles
    .map((t, i) => ({ t, i }))
    .filter(x => !x.t.removed);

  if (!available.length) return;

  const pick = available[Math.floor(Math.random() * available.length)];
  gameState.selectedTile = pick.i;
  resultEl.textContent = `Selected: ${pick.t.character}`;
  renderBoard();
};

// Handle guess
function handleGuess(bookGuess) {
  if (gameState.selectedTile === null) {
    alert("Spin the wheel first to select a character!");
    return;
  }

  const tile = gameState.tiles[gameState.selectedTile];

  // Reveal the tile immediately
  gameState.revealedTile = gameState.selectedTile;
  renderBoard();

  // Correct guess logic
  if (bookGuess === tile.book) {
    tile.removed = true;
    gameState.score++;
    gameState.remainingBooks = gameState.remainingBooks.filter(b => b !== tile.book);
    scoreEl.textContent = gameState.score;
  }

  // Show Flip Back button
  flipBackPanel.classList.remove("hidden");
}

// Flip back button
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

// Initialize
initGame();
