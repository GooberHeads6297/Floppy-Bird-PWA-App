const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const birdImgs = [new Image(), new Image(), new Image()];
birdImgs[0].src = 'images/bird1.png';
birdImgs[1].src = 'images/bird2.png';
birdImgs[2].src = 'images/bird3.png';

const pipeImg = new Image();
pipeImg.src = 'images/pipe.png';

const backgroundImg = new Image();
backgroundImg.src = 'images/background.png';

const groundImg = new Image();
groundImg.src = 'images/ground.png';

const iconImg = new Image();
iconImg.src = 'images/icon1.png';

const buttonUnpressedImg = new Image();
buttonUnpressedImg.src = 'images/ButtonUnpressed.png';

const buttonPressedImg = new Image();
buttonPressedImg.src = 'images/ButtonPressed.png';

const menuLogoImg = new Image();
menuLogoImg.src = 'images/MenuLogo.png';

const mainTotalImages = 10;
const scoreTotalImages = 10;
const totalImages = mainTotalImages + scoreTotalImages;
let imagesLoaded = 0;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop(0);
    }
}

birdImgs.forEach(img => img.onload = checkAllImagesLoaded);
pipeImg.onload = checkAllImagesLoaded;
backgroundImg.onload = checkAllImagesLoaded;
groundImg.onload = checkAllImagesLoaded;
iconImg.onload = checkAllImagesLoaded;
buttonUnpressedImg.onload = checkAllImagesLoaded;
buttonPressedImg.onload = checkAllImagesLoaded;
menuLogoImg.onload = checkAllImagesLoaded;

const numberNames = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const numberImages = {};
numberNames.forEach((name, index) => {
    const img = new Image();
    img.src = `numbers/${name}.png`;
    img.onload = checkAllImagesLoaded;
    img.onerror = () => console.error(`Failed to load numbers/${name}.png`);
    numberImages[index] = img;
});

let score = 0;

const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    gravity: 0.25,
    lift: -5,
    velocity: 0,
    animationIndex: 0,
    animationSpeed: 10,
    frameCount: 0
};

const pipes = [];
const pipeWidth = 70;
const pipeGap = 150;
const pipeSpeed = 3;
const pipeSpawnInterval = 3000;
let lastPipeSpawn = Date.now();
const initialPipeOffset = 150;
const horizontalPipeGap = 400;
let previousPipeHeight = canvas.height / 2;

const ground = {
    x: 0,
    y: canvas.height - 50,
    width: canvas.width,
    height: 50,
    speed: 1
};

let backgroundOffset = 0;
const backgroundSpeed = 0.7;

let gameStarted = false;
let canJump = true;
const jumpCooldown = 100;

function drawBird() {
    bird.frameCount++;
    if (bird.frameCount >= bird.animationSpeed) {
        bird.animationIndex = (bird.animationIndex + 1) % birdImgs.length;
        bird.frameCount = 0;
    }
    const currentBirdImg = birdImgs[bird.animationIndex];
    ctx.drawImage(currentBirdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.save();
        ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.topHeight / 2, pipeWidth, pipe.topHeight);
        ctx.restore();
        ctx.drawImage(pipeImg, pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height - pipe.topHeight - pipeGap);
    });
}

function drawBackground() {
    ctx.drawImage(backgroundImg, -backgroundOffset, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, canvas.width - backgroundOffset, 0, canvas.width, canvas.height);
}

function drawGround() {
    ctx.drawImage(groundImg, ground.x, ground.y, ground.width, ground.height);
    ctx.drawImage(groundImg, ground.x + ground.width, ground.y, ground.width, ground.height);
}

function drawIcon() {
    if (!gameStarted) {
        const iconX = bird.x + bird.width + 20;
        const iconY = bird.y + (bird.height - 40) / 2;
        ctx.drawImage(iconImg, iconX, iconY, 40, 40);
        const buttonX = iconX;
        const buttonY = iconY + 50;
        const currentButtonImg = Math.floor(Date.now() / 500) % 2 === 0 ? buttonUnpressedImg : buttonPressedImg;
        ctx.drawImage(currentButtonImg, buttonX, buttonY, 60, 30);
    }
}

function drawMenuLogo() {
    if (!gameStarted) {
        const logoX = (canvas.width - 200) / 2;
        const logoY = 30;
        ctx.drawImage(menuLogoImg, logoX, logoY, 200, 100);
    }
}

function drawScore() {
    if (imagesLoaded < totalImages) return;
    if (!gameStarted) return; //enables score after game starts
    const scoreStr = score.toString();
    const digitWidth = 45;
    const digitSpacing = 2;
    const totalWidth = scoreStr.length * (digitWidth + digitSpacing) - digitSpacing;
    let x = (canvas.width - totalWidth) / 2;
    for (let i = 0; i < scoreStr.length; i++) {
        const digit = parseInt(scoreStr[i]);
        ctx.drawImage(numberImages[digit], x, 20, digitWidth, digitWidth);
        x += digitWidth + digitSpacing;
    }
}

function updateBird(deltaTime) {
    if (gameStarted) {
        bird.velocity += bird.gravity * deltaTime;
        bird.y += bird.velocity * deltaTime;
        if (bird.y + bird.height > ground.y) {
            bird.y = ground.y - bird.height;
            bird.velocity = 0;
        } else if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }
    }
}

function updatePipes(deltaTime) {
    if (gameStarted) {
        pipes.forEach(pipe => {
            pipe.x -= pipeSpeed * deltaTime;
            if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
                pipe.passed = true;
                score++;
            }
        });
        if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
            pipes.shift();
        }
        if (Date.now() - lastPipeSpawn > pipeSpawnInterval) {
            const maxChange = 90;
            const newTopHeight = previousPipeHeight + (Math.random() * maxChange * 2 - maxChange);
            const clampedHeight = Math.max(50, Math.min(newTopHeight, canvas.height - pipeGap - 100));
            pipes.push({ x: canvas.width + initialPipeOffset + canvas.width * 0.5, topHeight: clampedHeight, passed: false });
            previousPipeHeight = clampedHeight;
            lastPipeSpawn = Date.now();
        }
        if (pipes.length > 1) {
            pipes[pipes.length - 1].x = pipes[pipes.length - 2].x + horizontalPipeGap;
        }
    }
}

function updateGround(deltaTime) {
    ground.x -= ground.speed * deltaTime;
    if (ground.x <= -ground.width) {
        ground.x = 0;
    }
}

function updateBackground(deltaTime) {
    backgroundOffset += backgroundSpeed * deltaTime;
    if (backgroundOffset >= canvas.width) {
        backgroundOffset = 0;
    }
}

function detectCollisions() {
    if (gameStarted) {
        pipes.forEach(pipe => {
            if (
                bird.x < pipe.x + pipeWidth &&
                bird.x + bird.width > pipe.x &&
                (bird.y < pipe.topHeight || bird.y + bird.height > pipe.topHeight + pipeGap)
            ) {
                resetGame();
            }
        });
        if (bird.y + bird.height >= ground.y) {
            resetGame();
        }
    }
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    lastPipeSpawn = Date.now();
    previousPipeHeight = canvas.height / 2;
    gameStarted = false;
    score = 0;
}

let lastTime = 0;
const targetFrameTime = 1000 / 60;

function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / targetFrameTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPipes();
    drawGround();
    drawBird();
    drawIcon();
    drawMenuLogo();
    drawScore();
    updateBird(deltaTime);
    updatePipes(deltaTime);
    updateGround(deltaTime);
    updateBackground(deltaTime);
    detectCollisions();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
requestAnimationFrame(gameLoop);
function jump() {
    if (!gameStarted) {
        gameStarted = true;
    }
    bird.velocity = bird.lift;
    canJump = false;
    setTimeout(() => canJump = true, jumpCooldown);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && canJump) {
        jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (canJump) {
        jump();
    }
});
