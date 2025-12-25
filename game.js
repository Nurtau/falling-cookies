// Game State
const gameState = {
    score: 0,
    lives: 3,
    level: 1,
    isPlaying: false,
    cookies: [],
    cookieSpeed: 3,
    spawnRate: 1200,
    lastSpawn: 0,
    gameTime: 0,
    animationFrame: null,
    spawnInterval: null
};

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const finalScoreDisplay = document.getElementById('final-score');
const finalLevelDisplay = document.getElementById('final-level');

// Cookie emojis for variety
const cookieEmojis = ['🍪', '🍪', '🍪', '🍩', '🧁', '🎂'];

// Initialize game
function init() {
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // Prevent scrolling on mobile
    document.body.addEventListener('touchmove', (e) => {
        if (gameState.isPlaying) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Start game
function startGame() {
    // Reset game state
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.isPlaying = true;
    gameState.cookies = [];
    gameState.cookieSpeed = 3;
    gameState.spawnRate = 1200;
    gameState.gameTime = 0;

    // Update UI
    updateScore();
    updateLives();
    updateLevel();

    // Switch screens
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Clear game area
    gameArea.innerHTML = '';

    // Start game loops
    gameState.lastSpawn = Date.now();
    gameLoop();
    startSpawning();
}

// Restart game
function restartGame() {
    startGame();
}

// Main game loop
function gameLoop() {
    if (!gameState.isPlaying) return;

    const currentTime = Date.now();
    gameState.gameTime += 16; // Approximate 60fps

    // Update difficulty every 10 seconds
    updateDifficulty();

    // Update all cookies
    updateCookies();

    gameState.animationFrame = requestAnimationFrame(gameLoop);
}

// Start spawning cookies
function startSpawning() {
    if (gameState.spawnInterval) {
        clearInterval(gameState.spawnInterval);
    }

    gameState.spawnInterval = setInterval(() => {
        if (gameState.isPlaying) {
            spawnCookie();
        }
    }, gameState.spawnRate);
}

// Spawn a new cookie
function spawnCookie() {
    const cookie = document.createElement('div');
    cookie.className = 'cookie';
    cookie.innerHTML = cookieEmojis[Math.floor(Math.random() * cookieEmojis.length)];

    // Random horizontal position
    const maxX = gameArea.offsetWidth - 60;
    const x = Math.random() * maxX;

    cookie.style.left = x + 'px';
    cookie.style.top = '-60px';

    // Cookie data
    const cookieData = {
        element: cookie,
        x: x,
        y: -60,
        speed: gameState.cookieSpeed
    };

    gameState.cookies.push(cookieData);
    gameArea.appendChild(cookie);

    // Add touch/click event
    cookie.addEventListener('touchstart', (e) => {
        e.preventDefault();
        destroyCookie(cookieData);
    });

    cookie.addEventListener('click', (e) => {
        e.preventDefault();
        destroyCookie(cookieData);
    });
}

// Update all cookies
function updateCookies() {
    const trashCanLevel = gameArea.offsetHeight - 270; // Trash can top is 270px from bottom

    for (let i = gameState.cookies.length - 1; i >= 0; i--) {
        const cookie = gameState.cookies[i];

        // Move cookie down
        cookie.y += cookie.speed;
        cookie.element.style.top = cookie.y + 'px';

        // Check if cookie fell into trash can
        if (cookie.y >= trashCanLevel) {
            // Add death/splat animation
            cookie.element.classList.add('splat');

            // Remove cookie after animation
            setTimeout(() => {
                if (cookie.element.parentNode) {
                    cookie.element.parentNode.removeChild(cookie.element);
                }
            }, 300);

            gameState.cookies.splice(i, 1);

            // Lose a life
            loseLife();
        }
    }
}

// Destroy cookie (player tapped it)
function destroyCookie(cookieData) {
    // Find cookie in array
    const index = gameState.cookies.indexOf(cookieData);
    if (index === -1) return; // Already destroyed

    // Add score
    gameState.score += 10;
    updateScore();

    // Show score popup
    showScorePopup(cookieData.x, cookieData.y);

    // Animate cookie destruction
    cookieData.element.classList.add('exploding');

    // Remove cookie after animation
    setTimeout(() => {
        if (cookieData.element.parentNode) {
            cookieData.element.parentNode.removeChild(cookieData.element);
        }
    }, 300);

    // Remove from array
    gameState.cookies.splice(index, 1);
}

// Show score popup
function showScorePopup(x, y) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+10';
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';

    gameArea.appendChild(popup);

    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 1000);
}

// Lose a life
function loseLife() {
    gameState.lives--;
    updateLives();

    // Show breaking heart animation
    showBreakingHeart();

    // Shake screen effect
    gameScreen.style.animation = 'shake 0.3s';
    setTimeout(() => {
        gameScreen.style.animation = '';
    }, 300);

    if (gameState.lives <= 0) {
        gameOver();
    }
}

// Show breaking heart animation
function showBreakingHeart() {
    const heart = document.createElement('div');
    heart.className = 'breaking-heart';
    heart.innerHTML = '💔';

    // Position in center of screen
    heart.style.left = '50%';
    heart.style.top = '50%';

    gameArea.appendChild(heart);

    setTimeout(() => {
        if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
        }
    }, 1000);
}

// Update difficulty based on time
function updateDifficulty() {
    const timeInSeconds = gameState.gameTime / 1000;

    // Increase level every 10 seconds (more frequent difficulty increase)
    const newLevel = Math.floor(timeInSeconds / 10) + 1;

    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        updateLevel();

        // Increase speed more aggressively
        gameState.cookieSpeed = 3 + (gameState.level - 1) * 0.8;

        // Decrease spawn rate more aggressively (spawn more frequently)
        gameState.spawnRate = Math.max(300, 1200 - (gameState.level - 1) * 120);

        // Restart spawning with new rate
        startSpawning();
    }
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = gameState.score;
}

// Update lives display
function updateLives() {
    let heartsHTML = '';
    for (let i = 0; i < gameState.lives; i++) {
        heartsHTML += '<span class="heart">❤️</span>';
    }
    livesDisplay.innerHTML = heartsHTML;
}

// Update level display
function updateLevel() {
    levelDisplay.textContent = gameState.level;
}

// Game Over
function gameOver() {
    gameState.isPlaying = false;

    // Stop spawning
    if (gameState.spawnInterval) {
        clearInterval(gameState.spawnInterval);
    }

    // Stop animation loop
    if (gameState.animationFrame) {
        cancelAnimationFrame(gameState.animationFrame);
    }

    // Clear remaining cookies
    gameState.cookies.forEach(cookie => {
        if (cookie.element.parentNode) {
            cookie.element.parentNode.removeChild(cookie.element);
        }
    });
    gameState.cookies = [];

    // Show game over screen
    finalScoreDisplay.textContent = gameState.score;
    finalLevelDisplay.textContent = gameState.level;

    setTimeout(() => {
        gameScreen.classList.add('hidden');
        gameoverScreen.classList.remove('hidden');
    }, 500);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Start the game
init();
