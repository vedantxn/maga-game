window.PIPE_GAP_VH = 47;
const MOVE_SPEED = 2.2;
const SPAWN_INTERVAL_MS = 3000;
const PIPE_LIMIT = 10;
const MIN_TOP_H_VH = 10;
const MAX_TOP_H_VH = 60;
let grativy = 0.5;
let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let score_val = document.querySelector('.score_val');
let message = document.getElementById('message');
let score_title = document.querySelector('.score_title');
let backgroundRect = { top: 0, bottom: window.innerHeight };
let pipes = [];
let spawnIntervalId = null;
let score = 0;
let gameState = 'Start';
img.style.display = 'none';
score_title.innerHTML = '';
score_val.innerHTML = '';
window._spawnCount = 0;
let winOverlay = document.getElementById('win-overlay');
let loseOverlay = document.getElementById('lose-overlay');
let winAudio = document.getElementById('win-audio');
let loseAudio = document.getElementById('lose-audio');
let gameAudio = document.getElementById('game-audio');
let startOverlay = document.getElementById('start-overlay');
let startAudio = document.getElementById('start-audio');
let startTimerDiv = document.getElementById('start-timer');
let difficultyChoose = document.getElementById('difficulty-choose');
let easyBtn = document.getElementById('easy-btn');
let hardBtn = document.getElementById('hard-btn');
let easyTick = document.getElementById('easy-tick');
let hardTick = document.getElementById('hard-tick');
let selectedDifficulty = 'easy';

/* Event handling for Enter key */
document.addEventListener('keydown', function (e) {
    if (gameState === 'WinEnd') {
        if (e.key === 'Enter') {
            winAudio.pause();
            winAudio.currentTime = 0;
            winOverlay.style.display = 'none';
            gameState = 'Start';
            showStartMemeThenBegin();
        }
        return;
    }
    if (gameState === 'LoseEnd') {
        if (e.key === 'Enter') {
            loseAudio.pause();
            loseAudio.currentTime = 0;
            loseOverlay.style.display = 'none';
            gameState = 'Start';
            showStartMemeThenBegin();
        }
        return;
    }
    if ((e.key === 'Enter')) {
        if (gameState === 'Start' || gameState === 'End') {
            showStartMemeThenBegin();
        }
    }
    if (e.key === ' ') {
        e.preventDefault();
    }
});

/* Starting meme screen and difficulty select */
function showStartMemeThenBegin() {
    startOverlay.style.display = 'flex';
    startAudio.currentTime = 0;
    startAudio.play();
    difficultyChoose.style.display = 'flex';
    easyTick.style.display = 'none';
    hardTick.style.display = 'none';
    selectedDifficulty = 'easy';
    window.PIPE_GAP_VH = 47;

    easyBtn.onclick = () => {
        selectedDifficulty = 'easy';
        easyTick.style.display = 'inline';
        hardTick.style.display = 'none';
        window.PIPE_GAP_VH = 47;
    };
    hardBtn.onclick = () => {
        selectedDifficulty = 'hard';
        hardTick.style.display = 'inline';
        easyTick.style.display = 'none';
        window.PIPE_GAP_VH = 30;
    };

    let countdown = 5;
    startTimerDiv.textContent = countdown;
    let overlayTimer = setInterval(() => {
        countdown--;
        startTimerDiv.textContent = countdown;
        if (countdown === 0) {
            clearInterval(overlayTimer);
        }
    }, 1000);

    setTimeout(() => {
        startAudio.pause();
        startAudio.currentTime = 0;
        startOverlay.style.display = 'none';
        difficultyChoose.style.display = 'none';
        startGame();
    }, 5000);
}

function startGame() {
    removeAllPipes();
    img.style.display = 'block';
    bird.style.top = '40vh';
    score = 0;
    score_title.innerHTML = 'Score: ';
    score_val.innerHTML = '0/10';
    message.innerHTML = '';
    message.classList.remove('messageStyle');
    gameState = 'Play';
    backgroundRect = { top: 0, bottom: window.innerHeight };
    window._spawnCount = 0;
    winOverlay.style.display = 'none';
    loseOverlay.style.display = 'none';
    winAudio.pause();
    winAudio.currentTime = 0;
    loseAudio.pause();
    loseAudio.currentTime = 0;
    gameAudio.currentTime = 0;
    gameAudio.play();

    spawnPipe();
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(() => {
        if (gameState === 'Play' && score < PIPE_LIMIT) spawnPipe();
    }, SPAWN_INTERVAL_MS);

    requestAnimationFrame(pipeMoveLoop);
    startBird();
}

function removeAllPipes() { pipes.forEach(p => { p.topEl.remove(); p.bottomEl.remove(); }); pipes = []; }

/* Pipe Generation: weighted, gap controlled by difficulty */
function spawnPipe() {
    if (gameState !== 'Play' || score >= PIPE_LIMIT) return;
    if (window._spawnCount >= PIPE_LIMIT) return;
    window._spawnCount++;
    let baseMin = 14, baseMax = 46, hardChance = 0.18, gap = window.PIPE_GAP_VH;
    let variation = Math.random();
    let topH;
    if (variation > hardChance) {
        topH = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
    } else {
        topH = (Math.random() < 0.5)
            ? Math.floor(Math.random() * 13) + MIN_TOP_H_VH
            : Math.floor(Math.random() * 13) + (MAX_TOP_H_VH - 13);
    }
    topH = Math.max(MIN_TOP_H_VH, Math.min(MAX_TOP_H_VH, topH));
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe_sprite pipe_top';
    topPipe.style.height = topH + 'vh';
    topPipe.style.left = '100vw';
    topPipe.dataset.pairId = window._spawnCount;
    const bottomTop = topH + gap;
    const bottomHeight = Math.max(6, 100 - bottomTop);
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe_sprite pipe_bottom';
    bottomPipe.style.height = bottomHeight + 'vh';
    bottomPipe.style.left = '100vw';
    bottomPipe.dataset.pairId = window._spawnCount;
    bottomPipe.dataset.increaseScore = '1';
    document.body.appendChild(topPipe);
    document.body.appendChild(bottomPipe);
    pipes.push({ topEl: topPipe, bottomEl: bottomPipe, pairId: window._spawnCount, passed: false });
}

function pipeMoveLoop() {
    if (gameState !== 'Play') return;
    let birdProps = bird.getBoundingClientRect();
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pair = pipes[i];
        const topEl = pair.topEl;
        const bottomEl = pair.bottomEl;
        const topRect = topEl.getBoundingClientRect();
        const bottomRect = bottomEl.getBoundingClientRect();
        const newLeftTop = topRect.left - MOVE_SPEED;
        topEl.style.left = newLeftTop + 'px';
        bottomEl.style.left = newLeftTop + 'px';
        if (newLeftTop + topRect.width < -50) {
            topEl.remove();
            bottomEl.remove();
            pipes.splice(i, 1);
            continue;
        }
        if (rectsOverlap(birdProps, topRect) || rectsOverlap(birdProps, bottomRect)) {
            endGame(false);
            return;
        }
        if (!pair.passed) {
            const pairRight = bottomRect.left + bottomRect.width;
            if (pairRight < birdProps.left) {
                pair.passed = true;
                score += 1;
                score_val.innerHTML = score + '/10';
                if (score === PIPE_LIMIT) {
                    // WIN: after crossing 10th pipe, finish after 1 second
                    setTimeout(triggerWinOverlay, 1000);
                }
            }
        }
    }
    requestAnimationFrame(pipeMoveLoop);
}

function startBird() {
    let bird_dy = 0;
    document.onkeydown = function (e) {
        if (gameState !== 'Play') return;
        if (e.key == 'ArrowUp' || e.key == ' ') {
            bird_dy = -7.6;
        }
    };
    function applyGravity() {
        if (gameState !== 'Play') return;
        bird_dy = bird_dy + grativy;
        let newTop = bird.offsetTop + bird_dy;
        if (newTop <= 0) {
            newTop = 0;
            bird_dy = 0;
        }
        if (newTop + bird.offsetHeight >= backgroundRect.bottom) {
            endGame(false);
            return;
        }
        bird.style.top = newTop + 'px';
        requestAnimationFrame(applyGravity);
    }
    requestAnimationFrame(applyGravity);
}

function rectsOverlap(r1, r2) {
    return !(r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top);
}

function triggerWinOverlay() {
    gameState = 'WinEnd';
    bird.style.display = 'none';
    pipes.forEach(p => { p.topEl.remove(); p.bottomEl.remove(); });
    winOverlay.style.display = 'flex';
    gameAudio.pause();
    gameAudio.currentTime = 0;
    winAudio.currentTime = 0;
    winAudio.play();
}

function endGame(won) {
    gameState = won ? 'End' : 'LoseEnd';
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    img.style.display = 'none';
    gameAudio.pause();
    gameAudio.currentTime = 0;

    if (won) {
        message.classList.add('messageStyle');
        message.innerHTML = 'Congratulations! You cleared all pipes!<br>Press Enter to play again';
    } else {
        loseOverlay.style.display = 'flex';
        loseAudio.currentTime = 0;
        loseAudio.play();
    }
    window._spawnCount = 0;
}

window.addEventListener('resize', () => {
    backgroundRect = { top: 0, bottom: window.innerHeight };
});
