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
const gameOverBorderImg = new Image();
gameOverBorderImg.src = 'images/gameOverBorder.png';
const restartUnpressedImg = new Image();
restartUnpressedImg.src = 'images/restartUnpressed.png';
const restartPressedImg = new Image();
restartPressedImg.src = 'images/restartPressed.png';
const featherImg = new Image();
featherImg.src = 'images/feather.png';
const mainTotalImages = 10;
const scoreTotalImages = 10;
const totalImages = mainTotalImages + scoreTotalImages + 4;
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
gameOverBorderImg.onload = checkAllImagesLoaded;
restartUnpressedImg.onload = checkAllImagesLoaded;
restartPressedImg.onload = checkAllImagesLoaded;
featherImg.onload = checkAllImagesLoaded;
const numberNames = ["zero","one","two","three","four","five","six","seven","eight","nine"];
const numberImages = {};
numberNames.forEach((name,index) => {
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
  frameCount: 0,
  resting: false
};
const pipes = [];
const pipeWidth = 70;
const pipeGap = 150;
const pipeSpeed = 6;
const pipeSpawnInterval = 3000;
const pipeSpawnOffset = 100;
const horizontalPipeGap = 150;
let lastPipeSpawn = Date.now();
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
let gameOverMenuActive = false;
let restartButtonPressed = false;
let gameOverTime = 0;
let feathers = [];
function getGameOverUIPositions() {
  let borderScale = Math.min((canvas.width * 0.8) / gameOverBorderImg.width, (canvas.height * 0.8) / gameOverBorderImg.height);
  let borderWidth = gameOverBorderImg.width * borderScale;
  let borderHeight = gameOverBorderImg.height * borderScale;
  let borderX = (canvas.width - borderWidth) / 2;
  let borderY = (canvas.height - borderHeight) / 2;
  let buttonScale = Math.min((canvas.width * 0.3) / restartUnpressedImg.width, (canvas.height * 0.2) / restartUnpressedImg.height);
  let buttonWidth = restartUnpressedImg.width * buttonScale;
  let buttonHeight = restartUnpressedImg.height * buttonScale;
  let buttonX = (canvas.width - buttonWidth) / 2;
  let buttonY = borderY + borderHeight - buttonHeight - 10;
  if (buttonY < borderY) {
    buttonY = borderY + 10;
  }
  return { borderX, borderY, borderWidth, borderHeight, buttonX, buttonY, buttonWidth, buttonHeight };
}
function rectIntersect(r1, r2) {
  return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
         r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
}
function drawBird() {
  bird.frameCount++;
  if (bird.frameCount >= bird.animationSpeed && !bird.resting) {
    bird.animationIndex = (bird.animationIndex + 1) % birdImgs.length;
    bird.frameCount = 0;
  }
  const currentBirdImg = birdImgs[bird.animationIndex];
  if (gameOverMenuActive && typeof bird.vx !== 'undefined' && !bird.resting) {
    let angle = Math.atan2(bird.vy, bird.vx);
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(angle);
    ctx.drawImage(currentBirdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
  } else {
    ctx.drawImage(currentBirdImg, bird.x, bird.y, bird.width, bird.height);
  }
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
  if (!gameStarted) return;
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
  if (gameStarted && !gameOverMenuActive) {
    bird.velocity += bird.gravity * deltaTime;
    bird.y += bird.velocity * deltaTime;
    if (bird.y + bird.height > ground.y) {
      bird.y = ground.y - bird.height;
      bird.velocity = 0;
    } else if (bird.y < 0) {
      bird.y = 0;
      bird.velocity = 0;
    }
  } else if (gameStarted && gameOverMenuActive && !bird.resting) {
    if (Date.now() - gameOverTime > 3000) {
      bird.resting = true;
      bird.vx = 0;
      bird.vy = 0;
    } else {
      if (typeof bird.vx === 'undefined') {
        bird.vx = (Math.random() - 0.5) * 10;
        bird.vy = bird.velocity;
      }
      bird.vy += bird.gravity * deltaTime;
      bird.vx += (Math.random() - 0.5) * 0.5;
      bird.vy += (Math.random() - 0.5) * 0.5;
      const damping = 0.98;
      bird.vx *= damping;
      bird.vy *= damping;
      bird.x += bird.vx * deltaTime;
      bird.y += bird.vy * deltaTime;
      if (bird.x < 0) {
        bird.x = 0;
        bird.vx = -bird.vx * 0.7;
      }
      if (bird.x + bird.width > canvas.width) {
        bird.x = canvas.width - bird.width;
        bird.vx = -bird.vx * 0.7;
      }
      if (bird.y < 0) {
        bird.y = 0;
        bird.vy = -bird.vy * 0.7;
      }
      if (bird.y + bird.height > ground.y) {
        bird.y = ground.y - bird.height;
        if (Math.abs(bird.vy) < 1) {
          bird.vy = 0;
          bird.vx = 0;
          bird.resting = true;
        } else {
          bird.vy = -bird.vy * 0.7;
        }
      }
      pipes.forEach(pipe => {
        let topPipe = { x: pipe.x, y: 0, width: pipeWidth, height: pipe.topHeight };
        let bottomPipe = { x: pipe.x, y: pipe.topHeight + pipeGap, width: pipeWidth, height: canvas.height - pipe.topHeight - pipeGap };
        if (bird.x < topPipe.x + topPipe.width && bird.x + bird.width > topPipe.x && bird.y < topPipe.y + topPipe.height && bird.y + bird.height > topPipe.y) {
          resolveCollision(bird, topPipe);
        }
        if (bird.x < bottomPipe.x + bottomPipe.width && bird.x + bird.width > bottomPipe.x && bird.y < bottomPipe.y + bottomPipe.height && bird.y + bird.height > bottomPipe.y) {
          resolveCollision(bird, bottomPipe);
        }
      });
    }
  }
}
function resolveCollision(b, r) {
  let overlapX = 0;
  let overlapY = 0;
  if (b.x + b.width / 2 < r.x + r.width / 2) {
    overlapX = (b.x + b.width) - r.x;
  } else {
    overlapX = b.x - (r.x + r.width);
  }
  if (b.y + b.height / 2 < r.y + r.height / 2) {
    overlapY = (b.y + b.height) - r.y;
  } else {
    overlapY = b.y - (r.y + r.height);
  }
  if (Math.abs(overlapX) < Math.abs(overlapY)) {
    b.x -= overlapX;
    b.vx = -b.vx;
  } else {
    b.y -= overlapY;
    b.vy = -b.vy;
  }
}
function updatePipes(deltaTime) {
  if (gameStarted && !gameOverMenuActive) {
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
      let groupSize = Math.random() < 0.5 ? 3 : 1;
      const maxChange = 90;
      const newTopHeight = previousPipeHeight + (Math.random() * maxChange * 2 - maxChange);
      const clampedHeight = Math.max(50, Math.min(newTopHeight, canvas.height - pipeGap - 100));
      let lastPipeX = pipes.length > 0 ? pipes[pipes.length - 1].x : canvas.width;
      let groupStartX = Math.max(canvas.width + pipeSpawnOffset, lastPipeX + horizontalPipeGap);
      for (let i = 0; i < groupSize; i++) {
        pipes.push({ x: groupStartX + i * horizontalPipeGap, topHeight: clampedHeight, passed: false });
      }
      previousPipeHeight = clampedHeight;
      lastPipeSpawn = Date.now();
    }
  }
}
function updateGround(deltaTime) {
  if (!gameOverMenuActive) {
    ground.x -= ground.speed * deltaTime;
    if (ground.x <= -ground.width) {
      ground.x = 0;
    }
  }
}
function updateBackground(deltaTime) {
  if (!gameOverMenuActive) {
    backgroundOffset += backgroundSpeed * deltaTime;
    if (backgroundOffset >= canvas.width) {
      backgroundOffset = 0;
    }
  }
}
function updateFeathers(deltaTime) {
  const featherGravity = 1.0;
  feathers.forEach(f => {
    f.vy += featherGravity * deltaTime;
    f.y += f.vy * deltaTime;
    if (f.y + 16 > ground.y) {
      f.y = ground.y - 16;
      f.vy = 0;
    }
    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      const topRect = { x: pipe.x, y: 0, width: pipeWidth, height: pipe.topHeight };
      const bottomRect = { x: pipe.x, y: pipe.topHeight + pipeGap, width: pipeWidth, height: canvas.height - pipe.topHeight - pipeGap };
      const featherRect = { x: f.x, y: f.y, width: 16, height: 16 };
      if (rectIntersect(featherRect, topRect)) {
        f.y = topRect.y + topRect.height;
        f.vy = 0;
      }
      if (rectIntersect(featherRect, bottomRect)) {
        f.y = bottomRect.y - 16;
        f.vy = 0;
      }
    }
  });
}
function drawFeathers() {
  feathers.forEach(f => {
    ctx.drawImage(featherImg, f.x, f.y, 16, 16);
  });
}
function createFeathers() {
  for (let i = 0; i < 3; i++) {
    let offsetX = Math.random() * bird.width;
    let offsetY = Math.random() * bird.height;
    feathers.push({ x: bird.x + offsetX, y: bird.y + offsetY, vy: 3.0 });
  }
}
function detectCollisions() {
  if (gameStarted && !gameOverMenuActive) {
    for (let i = 0; i < pipes.length; i++) {
      if (
        bird.x < pipes[i].x + pipeWidth &&
        bird.x + bird.width > pipes[i].x &&
        (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].topHeight + pipeGap)
      ) {
        gameOverMenuActive = true;
        if (!gameOverTime) {
          gameOverTime = Date.now();
          createFeathers();
        }
        break;
      }
    }
    if (!gameOverMenuActive && bird.y + bird.height >= ground.y) {
      gameOverMenuActive = true;
      if (!gameOverTime) {
        gameOverTime = Date.now();
        createFeathers();
      }
    }
  }
}
function resetGame() {
  bird.x = 50;
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  delete bird.vx;
  delete bird.vy;
  bird.resting = false;
  pipes.length = 0;
  feathers = [];
  lastPipeSpawn = Date.now();
  previousPipeHeight = canvas.height / 2;
  gameStarted = false;
  score = 0;
  gameOverTime = 0;
}
function showGameOverMenu() {
  let pos = getGameOverUIPositions();
  ctx.drawImage(gameOverBorderImg, pos.borderX, pos.borderY, pos.borderWidth, pos.borderHeight);
  if (restartButtonPressed) {
    ctx.drawImage(restartPressedImg, pos.buttonX, pos.buttonY, pos.buttonWidth, pos.buttonHeight);
  } else {
    ctx.drawImage(restartUnpressedImg, pos.buttonX, pos.buttonY, pos.buttonWidth, pos.buttonHeight);
  }
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
  if (gameOverMenuActive) {
    updateFeathers(deltaTime);
    drawFeathers();
  }
  if (!gameOverMenuActive) {
    updateBird(deltaTime);
    updatePipes(deltaTime);
    updateGround(deltaTime);
    updateBackground(deltaTime);
    detectCollisions();
  } else {
    updateBird(deltaTime);
    showGameOverMenu();
  }
  requestAnimationFrame(gameLoop);
}
document.addEventListener('keydown', (e) => {
  if (gameOverMenuActive) return;
  if (e.code === 'Space' && canJump) {
    jump();
  }
});
canvas.addEventListener('click', (e) => {
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  if (gameOverMenuActive) {
    let pos = getGameOverUIPositions();
    if (x >= pos.buttonX && x <= pos.buttonX + pos.buttonWidth && y >= pos.buttonY && y <= pos.buttonY + pos.buttonHeight) {
      restartButtonPressed = true;
      setTimeout(() => {
        restartButtonPressed = false;
        gameOverMenuActive = false;
        resetGame();
      }, 200);
    }
  } else {
    if (canJump) {
      jump();
    }
  }
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameOverMenuActive) {
    let touch = e.touches[0];
    let rect = canvas.getBoundingClientRect();
    let x = touch.clientX - rect.left;
    let y = touch.clientY - rect.top;
    let pos = getGameOverUIPositions();
    if (x >= pos.buttonX && x <= pos.buttonX + pos.buttonWidth && y >= pos.buttonY && y <= pos.buttonY + pos.buttonHeight) {
      restartButtonPressed = true;
      setTimeout(() => {
        restartButtonPressed = false;
        gameOverMenuActive = false;
        resetGame();
      }, 200);
    }
  } else if (canJump) {
    jump();
  }
});
function jump() {
  if (!gameStarted) {
    gameStarted = true;
  }
  if (!gameOverMenuActive) {
    bird.velocity = bird.lift;
  }
  canJump = false;
  setTimeout(() => canJump = true, jumpCooldown);
}
requestAnimationFrame(gameLoop);
requestAnimationFrame(gameLoop);
