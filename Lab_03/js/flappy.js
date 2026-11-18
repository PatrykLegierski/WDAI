document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const gameOverPanel = document.getElementById('gameover-panel');
    const recordBanner = document.getElementById('record-banner');
    const finalScoreEl = document.getElementById('final-score');
    const bestScoreEl = document.getElementById('best-score');
    const leaderboardList = document.getElementById('leaderboard-list');
    const restartBtn = document.getElementById('restart-btn');

    // 1. ŁADOWANIE GRAFIK I DŹWIĘKÓW

    const loadImage = (src) => {
        const img = new Image();
        img.src = src;
        return img;
    };

    const sprites = {
        bg: loadImage('assets/Flappy Bird/background-day.png'),
        base: loadImage('assets/Flappy Bird/base.png'),
        pipe: loadImage('assets/Flappy Bird/pipe-green.png'),
        bird: [
            loadImage('assets/Flappy Bird/yellowbird-upflap.png'),
            loadImage('assets/Flappy Bird/yellowbird-midflap.png'),
            loadImage('assets/Flappy Bird/yellowbird-downflap.png'),
            loadImage('assets/Flappy Bird/yellowbird-midflap.png')
        ],
        message: loadImage('assets/UI/message.png'),
        gameover: loadImage('assets/UI/gameover.png'),
        numbers: Array.from({ length: 10 }, (_, i) => loadImage(`assets/UI/Numbers/${i}.png`))
    };

    const sounds = {
        wing: new Audio('assets/Sound Efects/wing.wav'),
        point: new Audio('assets/Sound Efects/point.wav'),
        hit: new Audio('assets/Sound Efects/hit.wav'),
        die: new Audio('assets/Sound Efects/die.wav'),
        swoosh: new Audio('assets/Sound Efects/swoosh.wav')
    };

    const playSound = (sound) => {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    };

    let musicInterval = null;
    let audioCtx = null;

    const startBackgroundMusic = () => {
        if (musicInterval) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtx) audioCtx = new AudioContextClass();

        const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
        let step = 0;
        musicInterval = setInterval(() => {
            if (gameState !== 'PLAYING') return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = notes[step % notes.length];
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
            step++;
        }, 320);
    };

    //// 2. STAN GRY, FIZYKA I LOCALSTORAGE

    const STORAGE_KEY = 'flappy_top5_scores';
    const GROUND_HEIGHT = 100;
    const GROUND_Y = canvas.height - GROUND_HEIGHT;

    let gameState = 'READY'; // 'READY' | 'PLAYING' | 'DYING' | 'RECORD_SPIN' | 'GAMEOVER'
    let score = 0;
    let isNewRecord = false;
    let spinTimeLeft = 0;
    let lastTimestamp = 0;
    let baseOffsetX = 0;

    // Parametry ptaka
    const bird = {
        x: 80,
        y: 260,
        width: 38,
        height: 27,
        velocity: 0,
        gravity: 0.36,
        jumpStrength: -7.0,
        rotation: 0,
        frameIndex: 1,
        frameTimer: 0
    };

    let pipes = [];
    let boosts = [];
    let enemies = [];
    let spawnTimer = 0;

    let ghostTimer = 0;       // Czas przenikania
    let fastForwardTimer = 0;

    const getTopScores = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    };

    const saveScoreToTop5 = (newScore) => {
        const scores = getTopScores();
        const previousBest = scores.length > 0 ? scores[0] : 0;
        const beatRecord = newScore > previousBest && newScore > 0;

        if (newScore > 0) {
            scores.push(newScore);
            scores.sort((a, b) => b - a);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 5)));
        }
        return beatRecord;
    };

    // 3. ZARZĄDZANIE ZDARZENIAMI

    const handleKeyDown = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            triggerFlap();
        }
    };

    const handleCanvasClick = () => {
        triggerFlap();
    };

    const bindControls = () => {
        window.addEventListener('keydown', handleKeyDown);
        canvas.addEventListener('click', handleCanvasClick);
    };

    const unbindControls = () => {
        window.removeEventListener('keydown', handleKeyDown);
        canvas.removeEventListener('click', handleCanvasClick);
    };

    const triggerFlap = () => {
        if (gameState === 'READY') {
            gameState = 'PLAYING';
            playSound(sounds.swoosh);
            startBackgroundMusic();
            bird.velocity = bird.jumpStrength;
            playSound(sounds.wing);
        } else if (gameState === 'PLAYING') {
            bird.velocity = bird.jumpStrength;
            playSound(sounds.wing);
        }
    };

    // 4. GENEROWANIE RUR, BOOSTÓW I LATAJĄCYCH PRZESZKÓD

    const spawnObstacleSet = () => {
        const gapHeight = 145;
        const minTopHeight = 70;
        const maxTopHeight = GROUND_Y - gapHeight - 70;
        const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;

        pipes.push({
            x: canvas.width + 20,
            width: 60,
            topHeight: topHeight,
            bottomY: topHeight + gapHeight,
            passed: false
        });

        // Co drugą przeszkodę losujemy boost w środku przerwy
        if (Math.random() < 0.45) {
            const type = Math.random() < 0.5 ? 'GHOST' : 'FAST';
            boosts.push({
                x: canvas.width + 50,
                y: topHeight + gapHeight / 2,
                radius: 13,
                type: type
            });
        }

        // Od 3 punktów mogą pojawiać się dodatkowe latające przeszkody
        if (score >= 3 && Math.random() < 0.4) {
            enemies.push({
                x: canvas.width + 180,
                y: Math.floor(Math.random() * (GROUND_Y - 120)) + 60,
                width: 34,
                height: 24,
                speed: 4.2
            });
        }
    };

    const triggerCrash = () => {
        if (gameState !== 'PLAYING') return;
        gameState = 'DYING';
        unbindControls(); // Odpinamy sterowanie na czas spadania
        playSound(sounds.hit);
        setTimeout(() => playSound(sounds.die), 180);
        bird.velocity = 2;
    };

    const finishRun = () => {
        isNewRecord = saveScoreToTop5(score);
        if (isNewRecord) {
            gameState = 'RECORD_SPIN';
            spinTimeLeft = 3.0; // 3 sekundy animacji obrotu przy pobiciu rekordu
            bird.y = canvas.height / 2 - 40;
            bird.rotation = 0;
        } else {
            showGameOverScreen();
        }
    };

    const showGameOverScreen = () => {
        gameState = 'GAMEOVER';
        const topScores = getTopScores();
        finalScoreEl.textContent = score;
        bestScoreEl.textContent = topScores.length > 0 ? topScores[0] : score;
        recordBanner.hidden = !isNewRecord;

        leaderboardList.innerHTML = '';
        if (topScores.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Brak zapisanych wyników';
            leaderboardList.appendChild(li);
        } else {
            topScores.forEach((val) => {
                const li = document.createElement('li');
                li.textContent = `${val} pkt`;
                leaderboardList.appendChild(li);
            });
        }

        gameOverPanel.hidden = false;
    };

    const resetGame = () => {
        unbindControls();
        gameOverPanel.hidden = true;
        recordBanner.hidden = true;
        score = 0;
        isNewRecord = false;
        pipes = [];
        boosts = [];
        enemies = [];
        spawnTimer = 0;
        ghostTimer = 0;
        fastForwardTimer = 0;

        bird.y = 260;
        bird.velocity = 0;
        bird.rotation = 0;
        gameState = 'READY';
        bindControls();
    };

    restartBtn.addEventListener('click', resetGame);

    // 5. AKTUALIZACJA LOGIKI (FIZYKA + KOLIZJE)

    const update = (dt) => {
        // Animacja skrzydeł ptaka
        if (gameState === 'READY' || gameState === 'PLAYING' || gameState === 'RECORD_SPIN') {
            bird.frameTimer += dt;
            if (bird.frameTimer >= 0.11) {
                bird.frameIndex = (bird.frameIndex + 1) % sprites.bird.length;
                bird.frameTimer = 0;
            }
        }

        // Przesuwanie podłoża
        if (gameState === 'READY' || gameState === 'PLAYING') {
            const scrollSpeed = fastForwardTimer > 0 ? 7.5 : 2.5;
            baseOffsetX = (baseOffsetX - scrollSpeed) % 48;
        }

        if (gameState === 'READY') {
            // Delikatne unoszenie na ekranie startowym
            bird.y = 260 + Math.sin(performance.now() / 220) * 8;
            return;
        }

        if (gameState === 'PLAYING') {
            // Obsługa timerów boostów
            if (ghostTimer > 0) ghostTimer = Math.max(0, ghostTimer - dt);
            if (fastForwardTimer > 0) fastForwardTimer = Math.max(0, fastForwardTimer - dt);

            const currentSpeed = fastForwardTimer > 0 ? 7.5 : 2.5;

            // Grawitacja i kąt pochylenia ptaka
            if (fastForwardTimer > 0) {
                bird.velocity = 0;
                bird.rotation = 0;
            } else {
                bird.velocity += bird.gravity;
                bird.y += bird.velocity;
                bird.rotation = Math.min(Math.PI / 2, Math.max(-0.45, bird.velocity * 0.08));
            }

            // Sufit i ziemia
            if (bird.y < 0) {
                bird.y = 0;
                bird.velocity = 0;
            }
            if (bird.y + bird.height >= GROUND_Y) {
                bird.y = GROUND_Y - bird.height;
                playSound(sounds.hit);
                unbindControls();
                finishRun();
                return;
            }

            // Generowanie przeszkód
            spawnTimer += dt * (fastForwardTimer > 0 ? 2.5 : 1);
            if (spawnTimer >= 1.75) {
                spawnObstacleSet();
                spawnTimer = 0;
            }

            // Ruch rur, punktacja i kolizje
            pipes.forEach((pipe) => {
                pipe.x -= currentSpeed;

                if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                    pipe.passed = true;
                    score++;
                    playSound(sounds.point);
                }

                // Sprawdzanie kolizji (pomijane podczas boosta GHOST lub FAST FORWARD)
                if (ghostTimer <= 0 && fastForwardTimer <= 0) {
                    const hitX = bird.x + bird.width - 4 > pipe.x && bird.x + 4 < pipe.x + pipe.width;
                    const hitTop = bird.y + 4 < pipe.topHeight;
                    const hitBottom = bird.y + bird.height - 4 > pipe.bottomY;
                    if (hitX && (hitTop || hitBottom)) {
                        triggerCrash();
                    }
                }
            });
            pipes = pipes.filter((p) => p.x + p.width > -20);

            // Zbieranie boostów
            boosts.forEach((b) => {
                b.x -= currentSpeed;
                const dx = (bird.x + bird.width / 2) - b.x;
                const dy = (bird.y + bird.height / 2) - b.y;
                if (Math.hypot(dx, dy) < b.radius + 16) {
                    b.collected = true;
                    playSound(sounds.point);
                    if (b.type === 'GHOST') {
                        ghostTimer = 5.0; // 5 sekund przenikania przez rury
                    } else if (b.type === 'FAST') {
                        fastForwardTimer = 1.1;
                        score += 3; // Fast forward dodaje +3 punkty
                    }
                }
            });
            boosts = boosts.filter((b) => !b.collected && b.x > -30);

            // Latające przeszkody
            enemies.forEach((en) => {
                en.x -= en.speed + (fastForwardTimer > 0 ? 4 : 0);
                if (ghostTimer <= 0 && fastForwardTimer <= 0) {
                    const hitX = bird.x + bird.width - 4 > en.x && bird.x + 4 < en.x + en.width;
                    const hitY = bird.y + bird.height - 4 > en.y && bird.y + 4 < en.y + en.height;
                    if (hitX && hitY) {
                        triggerCrash();
                    }
                }
            });
            enemies = enemies.filter((en) => en.x + en.width > -30);
        }

        // Stan DYING: ptak spada po uderzeniu aż wbije się w ziemię
        if (gameState === 'DYING') {
            bird.velocity += bird.gravity * 1.3;
            bird.y += bird.velocity;
            bird.rotation = Math.PI / 2;

            if (bird.y + bird.height >= GROUND_Y) {
                bird.y = GROUND_Y - bird.height;
                finishRun();
            }
        }

        // Stan RECORD_SPIN: 3-sekundowe kręcenie ptaka po pobiciu rekordu
        if (gameState === 'RECORD_SPIN') {
            spinTimeLeft -= dt;
            bird.rotation += dt * Math.PI * 4; // 2 pełne obroty na sekundę
            if (spinTimeLeft <= 0) {
                bird.rotation = 0;
                showGameOverScreen();
            }
        }
    };

    // 6. RYSOWANIE NA CANVAS

    const drawScoreTopRight = () => {
        const digits = String(score).split('');
        const digitW = 24;
        const digitH = 36;
        const totalW = digits.length * (digitW + 2);
        let startX = canvas.width - totalW - 16;

        digits.forEach((d) => {
            const img = sprites.numbers[Number(d)];
            if (img && img.complete) {
                ctx.drawImage(img, startX, 18, digitW, digitH);
            }
            startX += digitW + 2;
        });
    };

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Tło wypełniające całą planszę
        if (sprites.bg.complete) {
            ctx.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
        }

        // 2. Rury (półprzezroczyste podczas boosta GHOST)
        ctx.save();
        if (ghostTimer > 0) ctx.globalAlpha = 0.35;

        pipes.forEach((pipe) => {
            if (sprites.pipe.complete) {
                // Dolna rura
                ctx.drawImage(sprites.pipe, pipe.x, pipe.bottomY, pipe.width, GROUND_Y - pipe.bottomY);

                // Górna rura (odwrócona w pionie)
                ctx.save();
                ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight / 2);
                ctx.scale(1, -1);
                ctx.drawImage(sprites.pipe, -pipe.width / 2, -pipe.topHeight / 2, pipe.width, pipe.topHeight);
                ctx.restore();
            }
        });
        ctx.restore();

        // 3. Boosty (kule energii)
        boosts.forEach((b) => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.type === 'GHOST' ? '#38bdf8' : '#facc15';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        });

        // 4. Latające przeszkody
        enemies.forEach((en) => {
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(en.x, en.y, en.width, en.height);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(en.x - 6, en.y + 8, 8, 6); // Dziób skierowany w lewo
        });

        // 5. Przewijana ziemia
        if (sprites.base.complete) {
            ctx.drawImage(sprites.base, baseOffsetX, GROUND_Y, canvas.width + 60, GROUND_HEIGHT);
        }

        // 6. Ptak (z rotacją i animacją sprite'a)
        const currentBirdSprite = sprites.bird[bird.frameIndex];
        ctx.save();
        if (ghostTimer > 0) ctx.globalAlpha = 0.6;
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation);

        // Efekt smugi podczas Fast Forward
        if (fastForwardTimer > 0) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
            ctx.fillRect(-55, -10, 40, 20);
        }

        if (currentBirdSprite && currentBirdSprite.complete) {
            ctx.drawImage(currentBirdSprite, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        }
        ctx.restore();

        // 7. Pasek aktywnego boosta w lewym górnym rogu
        if (ghostTimer > 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`DUCH: ${ghostTimer.toFixed(1)}s`, 14, 30);
        } else if (fastForwardTimer > 0) {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('FAST FORWARD +3!', 14, 30);
        }

        // 8. Ekran powitalny (Get Ready / TAP)
        if (gameState === 'READY' && sprites.message.complete) {
            ctx.drawImage(sprites.message, (canvas.width - 220) / 2, 110, 220, 320);
        }

        // 9. Napis celebracji rekordu
        if (gameState === 'RECORD_SPIN') {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NOWY REKORD!', canvas.width / 2, 160);
            ctx.textAlign = 'left';
        }

        // 10. Napis Game Over na planszy
        if (gameState === 'GAMEOVER' && sprites.gameover.complete) {
            ctx.drawImage(sprites.gameover, (canvas.width - 230) / 2, 95, 230, 52);
        }

        // 11. Aktualny wynik w prawym górnym rogu (widoczny cały czas)
        drawScoreTopRight();
    };

    // 7. GŁÓWNA PĘTLA GRY (requestAnimationFrame)

    const gameLoop = (timestamp) => {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
        lastTimestamp = timestamp;

        update(dt);
        draw();
        requestAnimationFrame(gameLoop);
    };

    // Start gry
    bindControls();
    requestAnimationFrame(gameLoop);

});