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
    selectedTile: null
  };
  
  const boardEl = document.getElementById("board");
  const booksEl = document.getElementById("books");
  const spinBtn = document.getElementById("spin-btn");
  const resultEl = document.getElementById("wheel-result");
  const guessPanel = document.getElementById("guess-panel");
  const guessOptions = document.getElementById("guess-options");
  const scoreEl = document.getElementById("score");
  
  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }
  
  function initGame() {
    const shuffledBooks = shuffle(books);
    gameState.tiles = characters.map((char, i) => ({
      character: char,
      book: shuffledBooks[i],
      removed: false
    }));
    gameState.remainingBooks = [...shuffledBooks];
    renderBoard();
    renderBookshelf();
  }
  
  function renderBoard() {
    boardEl.innerHTML = "";
    gameState.tiles.forEach((tile, i) => {
      const div = document.createElement("div");
      div.className = "tile" + (tile.removed ? " removed" : "");
      div.textContent = tile.character;
      boardEl.appendChild(div);
    });
  }
  
  function renderBookshelf() {
    booksEl.innerHTML = "";
    gameState.remainingBooks.forEach(book => {
      const span = document.createElement("span");
      span.className = "book";
      span.textContent = book;
      booksEl.appendChild(span);
    });
  }
  
  spinBtn.onclick = () => {
    const available = gameState.tiles
      .map((t, i) => ({ t, i }))
      .filter(x => !x.t.removed);
  
    if (!available.length) return;
  
    const pick = available[Math.floor(Math.random() * available.length)];
    gameState.selectedTile = pick.i;
  
    resultEl.textContent = `Selected: ${pick.t.character}`;
    showGuessOptions();
  };
  
  function showGuessOptions() {
    guessPanel.classList.remove("hidden");
    guessOptions.innerHTML = "";
  
    gameState.remainingBooks.forEach(book => {
      const btn = document.createElement("button");
      btn.textContent = book;
      btn.onclick = () => handleGuess(book);
      guessOptions.appendChild(btn);
    });
  }
  
  function handleGuess(bookGuess) {
    const tile = gameState.tiles[gameState.selectedTile];
  
    if (bookGuess === tile.book) {
      tile.removed = true;
      gameState.score++;
      gameState.remainingBooks =
        gameState.remainingBooks.filter(b => b !== tile.book);
      scoreEl.textContent = gameState.score;
    }
  
    gameState.selectedTile = null;
    guessPanel.classList.add("hidden");
    renderBoard();
    renderBookshelf();
  }
  
  initGame();
  