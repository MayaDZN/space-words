const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("start-screen");
const settingsScreen = document.getElementById("settings-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startButton = document.getElementById("start-button");
const settingsButton = document.getElementById("settings-button");
const saveSettingsButton = document.getElementById("save-settings");
const restartButton = document.getElementById("restart-button");
const scoreValue = document.getElementById("score-value");
const livesValue = document.getElementById("lives-value");
const wordValue = document.getElementById("word-value");
const levelDisplay = document.createElement("div");
levelDisplay.id = "level-display";
levelDisplay.style.display = "none";
document.body.appendChild(levelDisplay);

canvas.width = 800;
canvas.height = 600;

// Add these new constants at the top of the file
const pauseButton = document.createElement("button");
pauseButton.textContent = "Pause";
pauseButton.id = "pause-button";
document.body.appendChild(pauseButton);

// Add this to the gameState object
const gameState = {
  score: 0,
  lives: 5,
  currentWord: "",
  targetWord: "",
  collectedLetters: "",
  gameOver: false,
  volume: 50,
  difficulty: "easy",
  backgroundX: 0,
  level: 1,
  levelDisplayTimer: null,
  isPaused: false
};

const player = {
  x: 100,
  y: 300,
  width: 80,
  height: 40,
  speed: 5,
  velocityY: 0,
  velocityX: 0,
  minSpeed: 5,
  maxSpeed: 10
};

const letters = [];
const backgroundSpeed = 2;
let spacecraftImage;

const wordDatabase = {
  easy: [
    "cat",
    "dog",
    "sun",
    "moon",
    "star",
    "hat",
    "ball",
    "tree",
    "fish",
    "bird",
    "book",
    "car",
    "house",
    "apple",
    "bear"
  ],
  medium: [
    "elephant",
    "giraffe",
    "rainbow",
    "planet",
    "ocean",
    "mountain",
    "butterfly",
    "dinosaur",
    "computer",
    "bicycle",
    "library",
    "telescope",
    "calendar",
    "umbrella",
    "playground"
  ],
  hard: [
    "photosynthesis",
    "civilization",
    "electromagnetic",
    "revolutionary",
    "biodiversity",
    "entrepreneurship",
    "extraterrestrial",
    "nanotechnology",
    "sustainability",
    "archaeology",
    "biotechnology",
    "cryptocurrency",
    "astrophysics",
    "paleontology",
    "metamorphosis"
  ]
};

const backgroundMusic = document.getElementById("background-music");

function loadAssets() {
  spacecraftImage = new Image();
  spacecraftImage.src = "assets/spacecraft.png";
  backgroundMusic.volume = gameState.volume / 100;
}

function drawBackground() {
  // Create a gradient for a more space-like background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#000033");
  gradient.addColorStop(1, "#000066");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  ctx.fillStyle = "white";
  stars.forEach((star) => {
    star.x = (star.x - backgroundSpeed * star.speed) % canvas.width;
    if (star.x < 0) star.x = canvas.width;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  ctx.drawImage(
    spacecraftImage,
    player.x,
    player.y,
    player.width,
    player.height
  );
}

function updatePlayer() {
  player.y += player.velocityY;
  player.speed = Math.max(
    player.minSpeed,
    Math.min(player.maxSpeed, player.speed + player.velocityX * 0.1)
  );

  // Keep player within canvas bounds
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
  player.x = Math.max(
    0,
    Math.min(canvas.width / 2, player.x + player.velocityX)
  );
}

function handleKeyDown(e) {
  if (e.key === "ArrowUp") {
    player.velocityY = -player.speed;
  } else if (e.key === "ArrowDown") {
    player.velocityY = player.speed;
  } else if (e.key === "ArrowLeft") {
    player.velocityX = -2;
  } else if (e.key === "ArrowRight") {
    player.velocityX = 2;
  }
}

function handleKeyUp(e) {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    player.velocityY = 0;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.velocityX = 0;
  }
}

function createLetter() {
  const letter = {
    x: canvas.width,
    y: Math.random() * (canvas.height - 30),
    text: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    width: 30,
    height: 30
  };
  letters.push(letter);
}

function drawLetters() {
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 24px Orbitron";
  letters.forEach((letter) => {
    ctx.fillText(letter.text, letter.x, letter.y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeText(letter.text, letter.x, letter.y);
  });
}

function updateLetters() {
  for (let i = letters.length - 1; i >= 0; i--) {
    letters[i].x -= backgroundSpeed;
    if (letters[i].x + letters[i].width < 0) {
      letters.splice(i, 1);
    }
  }
}

function checkCollision() {
  for (let i = letters.length - 1; i >= 0; i--) {
    const letter = letters[i];
    if (
      player.x < letter.x + letter.width &&
      player.x + player.width > letter.x &&
      player.y < letter.y + letter.height &&
      player.y + player.height > letter.y
    ) {
      // Collision detected
      if (
        letter.text === gameState.targetWord[gameState.collectedLetters.length]
      ) {
        gameState.collectedLetters += letter.text;
        gameState.score += 10;

        if (gameState.collectedLetters === gameState.targetWord) {
          // Word completed
          gameState.level++;
          displayLevelText();
          startNewWord();
        } else {
          createLetterSet(); // Generate a new set of letters
        }
      } else {
        gameState.lives--;
        gameState.score -= 5;
        if (gameState.lives <= 0 || gameState.score < 0) {
          endGame();
        } else {
          createLetterSet(); // Generate a new set of letters after losing a life
        }
      }
      updateHUD();
      break; // Exit the loop after handling a collision
    }
  }
}

function gameLoop() {
  if (!gameState.isPaused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameState.backgroundX -= backgroundSpeed;
    if (gameState.backgroundX <= -canvas.width) {
      gameState.backgroundX = 0;
    }

    drawBackground();
    updatePlayer();
    drawPlayer();
    updateLetters();
    drawLetters();
    checkCollision();

    // Check if we need to create a new letter set
    if (letters.length === 0) {
      createLetterSet();
    }

    if (gameState.lives <= 0 || gameState.score < 0) {
      endGame();
    }
  }

  if (!gameState.gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  gameState.score = 0;
  gameState.gameOver = false;
  gameState.isPaused = false;
  gameState.level = 1;

  // Set lives based on difficulty
  switch (gameState.difficulty) {
    case "easy":
      gameState.lives = 5;
      break;
    case "medium":
      gameState.lives = 3;
      break;
    case "hard":
      gameState.lives = 1;
      break;
  }

  startNewWord();

  startScreen.classList.add("hidden");
  settingsScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseButton.style.display = "block";
  updateHUD();
  gameLoop();
  backgroundMusic.play();
}

function endGame() {
  gameState.gameOver = true;
  document.getElementById("final-score").textContent = gameState.score;
  gameOverScreen.classList.remove("hidden");
  pauseButton.style.display = "none";
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function updateHUD() {
  scoreValue.textContent = gameState.score;
  livesValue.textContent = gameState.lives;
  let displayWord = gameState.targetWord
    .split("")
    .map((letter, index) =>
      index < gameState.collectedLetters.length ? letter : "_"
    )
    .join("");
  wordValue.textContent = displayWord;
}

function openSettings() {
  startScreen.classList.add("hidden");
  settingsScreen.classList.remove("hidden");
}

function saveSettings() {
  gameState.volume = document.getElementById("volume").value;
  gameState.difficulty = document.getElementById("difficulty").value;
  backgroundMusic.volume = gameState.volume / 100;

  // Adjust lives based on difficulty
  switch (gameState.difficulty) {
    case "easy":
      gameState.lives = 5;
      break;
    case "medium":
      gameState.lives = 3;
      break;
    case "hard":
      gameState.lives = 1;
      break;
  }

  settingsScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  updateHUD(); // Update the HUD to reflect the new number of lives
}

startButton.addEventListener("click", startGame);
settingsButton.addEventListener("click", openSettings);
saveSettingsButton.addEventListener("click", saveSettings);
restartButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

// Load assets and initialize the game
loadAssets();
startScreen.classList.remove("hidden");

function createLetterSet() {
  letters.length = 0; // Clear existing letters

  // Add the correct next letter
  const nextLetterIndex = gameState.collectedLetters.length;
  if (nextLetterIndex < gameState.targetWord.length) {
    const correctLetter = {
      x: canvas.width,
      y: Math.random() * (canvas.height - 30),
      text: gameState.targetWord[nextLetterIndex],
      width: 30,
      height: 30
    };
    letters.push(correctLetter);
  }

  // Add two incorrect letters
  for (let i = 0; i < 2; i++) {
    let incorrectLetter;
    do {
      incorrectLetter = String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      );
    } while (incorrectLetter === gameState.targetWord[nextLetterIndex]);

    letters.push({
      x: canvas.width + (i + 1) * 100, // Space out the letters
      y: Math.random() * (canvas.height - 30),
      text: incorrectLetter,
      width: 30,
      height: 30
    });
  }

  // Shuffle the letters array to randomize their order
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
}

function startNewWord() {
  const wordList = wordDatabase[gameState.difficulty];
  gameState.targetWord =
    wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
  gameState.collectedLetters = gameState.targetWord[0];
  letters.length = 0;
  createLetterSet();
}

function displayLevelText() {
  levelDisplay.textContent = `Level ${gameState.level}`;
  levelDisplay.style.display = "block";

  // Clear any existing timer
  if (gameState.levelDisplayTimer) {
    clearTimeout(gameState.levelDisplayTimer);
  }

  // Set a new timer to hide the level display after 2 seconds
  gameState.levelDisplayTimer = setTimeout(() => {
    levelDisplay.style.display = "none";
  }, 2000);
}

const style = document.createElement("style");
style.textContent = `
  #level-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
`;
document.head.appendChild(style);

// Add this new constant for stars
const stars = Array(100)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.5
  }));

// Add this new function
function togglePause() {
  gameState.isPaused = !gameState.isPaused;
  pauseButton.textContent = gameState.isPaused ? "Resume" : "Pause";

  if (gameState.isPaused) {
    backgroundMusic.pause();
  } else {
    backgroundMusic.play();
  }
}

// Add these event listeners at the bottom of the file
pauseButton.addEventListener("click", togglePause);

const settingsButtonGameover = document.getElementById(
  "settings-button-gameover"
);

settingsButtonGameover.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  settingsScreen.classList.remove("hidden");
});
