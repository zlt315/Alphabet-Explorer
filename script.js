// 游戏状态变量
let score = 0;
let level = 1;
let lives = 3;
let crystals = 0;
let combo = 0;
let maxCombo = 0;
let gameRunning = false;
let gameMode = 'challenge'; // 默认为挑战模式
let currentChallenge = 'letter-rain'; // 默认为字母雨挑战
let currentPractice = ''; // 当前练习模式
let letters = [];
let words = [];
let letterSpeed = 2; // 字母下落速度
let letterInterval = 2000; // 生成新字母的间隔时间(毫秒)
let letterGenerator;
let gameLoop;
let lastKeyPressed = '';
let collectedLetters = {}; // 记录已收集的字母
let achievements = {}; // 记录已解锁的成就
let gameStartTime = 0; // 游戏开始时间
let gamePlayTime = 0; // 游戏总时长（分钟）
let typingErrors = {}; // 记录打字错误
let typingSpeed = 0; // 打字速度（WPM）
let typingAccuracy = 100; // 打字准确率

// 自定义设置
let settings = {
    musicVolume: 50,
    sfxVolume: 50,
    difficulty: 'normal',
    customLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    customWords: []
};

// Kiki的装扮和家居装饰
let kikiCustomization = {
    skin: 'default',
    hat: '',
    accessory: ''
};

let homeDecoration = {
    wallpaper: 'default',
    furniture: []
};

// 冒险模式关卡
let adventureLevels = {
    forest: {
        unlocked: true,
        levels: {
            1: { unlocked: true, completed: false, stars: 0 },
            2: { unlocked: true, completed: false, stars: 0 },
            3: { unlocked: true, completed: false, stars: 0 },
            4: { unlocked: false, completed: false, stars: 0 },
            5: { unlocked: false, completed: false, stars: 0 }
        }
    },
    ocean: { unlocked: false },
    sky: { unlocked: false }
};

// DOM元素
let gameArea = document.getElementById('game-area');
let scoreElement = document.getElementById('score');
let levelElement = document.getElementById('level');
let livesElement = document.getElementById('lives');
let crystalsElement = document.getElementById('crystals');
let comboElement = document.getElementById('combo');
let startScreen = document.getElementById('start-screen');
let gameOverScreen = document.getElementById('game-over');
let finalScoreElement = document.getElementById('final-score');
let earnedCrystalsElement = document.getElementById('earned-crystals');
let adventureSelectScreen = document.getElementById('adventure-select');
let challengeSelectScreen = document.getElementById('challenge-select');
let practiceSelectScreen = document.getElementById('practice-select');
let kikiHomeScreen = document.getElementById('kiki-home');
let alphabetBookScreen = document.getElementById('alphabet-book');
let achievementsScreen = document.getElementById('achievements');
let settingsScreen = document.getElementById('settings');
let parentPanelScreen = document.getElementById('parent-panel');
let customPracticeScreen = document.getElementById('custom-practice');
let homeCrystalsElement = document.getElementById('home-crystals');
let restartButton = document.getElementById('restart-button');
let kiki = document.getElementById('kiki');
let keys = document.querySelectorAll('.key');
let backgroundMusic = document.getElementById('background-music');

// 音效
const sounds = {
    correct: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3'),
    wrong: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3'),
    levelUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
    gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3'),
    achievement: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
    crystal: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bonus-earned-in-video-game-2058.mp3'),
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3')
};

// 安全播放音效
function safePlay(audio) {
    if (audio && typeof audio.play === 'function') {
        try {
            audio.currentTime = 0;
            audio.play().catch(e => {
                // 静默处理
            });
        } catch (e) {
            // 静默处理
        }
    }
}

// 初始化游戏
function initGame() {
    score = 0;
    level = 1;
    lives = 3;
    combo = 0;
    maxCombo = 0;
    letters = [];
    words = [];
    letterSpeed = 2;
    letterInterval = 2000;
    gameStartTime = Date.now();
    
    // 根据难度设置初始参数
    if (settings.difficulty === 'easy') {
        lives = 5;
        letterSpeed = 1.5;
        letterInterval = 2500;
    } else if (settings.difficulty === 'hard') {
        lives = 2;
        letterSpeed = 2.5;
        letterInterval = 1500;
    }
    
    // 更新UI
    updateScore();
    updateLevel();
    updateLives();
    updateCrystals();
    updateCombo();
    
    // 清除游戏区域
    gameArea.innerHTML = '<div id="kiki" class="character"></div>';
    kiki = document.getElementById('kiki');
    
    // 重置Kiki位置
    kiki.style.left = '50%';
    
    // 应用Kiki的装扮
    applyKikiCustomization();
    
    // 开始游戏
    gameRunning = true;
    
    // 根据游戏模式开始不同的游戏逻辑
    if (gameMode === 'challenge') {
        if (currentChallenge === 'letter-rain') {
            startLetterGeneration();
        } else if (currentChallenge === 'word-storm') {
            startWordGeneration();
        }
    } else if (gameMode === 'practice') {
        startPracticeMode();
    } else if (gameMode === 'adventure') {
        startAdventureLevel();
    }
    
    startGameLoop();
    
    // 播放背景音乐
    if (backgroundMusic) {
        backgroundMusic.volume = settings.musicVolume / 100;
        backgroundMusic.play();
    }
    
    // 设置音效音量
    setAudioVolume();
    if (document.body) document.body.focus();
}

// 设置音效音量
function setAudioVolume() {
    const volume = settings.sfxVolume / 100;
    for (const sound in sounds) {
        if (sounds.hasOwnProperty(sound)) {
            sounds[sound].volume = volume;
        }
    }
    if (backgroundMusic) {
        backgroundMusic.volume = settings.musicVolume / 100;
    }
}

// 应用Kiki的装扮
function applyKikiCustomization() {
    // 重置Kiki的样式
    kiki.className = 'character';
    
    // 应用皮肤
    if (kikiCustomization.skin !== 'default') {
        kiki.classList.add(`skin-${kikiCustomization.skin}`);
    }
    
    // 应用帽子
    if (kikiCustomization.hat) {
        kiki.classList.add(`hat-${kikiCustomization.hat}`);
    }
    
    // 应用配饰
    if (kikiCustomization.accessory) {
        kiki.classList.add(`accessory-${kikiCustomization.accessory}`);
    }
}

// 开始生成字母
function startLetterGeneration() {
    letterGenerator = setInterval(createLetter, letterInterval);
}

// 开始生成单词
function startWordGeneration() {
    letterGenerator = setInterval(createWord, letterInterval * 2);
}

// 开始练习模式
function startPracticeMode() {
    let practiceLetters;
    
    if (currentPractice === 'top-row') {
        practiceLetters = 'QWERTYUIOP';
    } else if (currentPractice === 'home-row') {
        practiceLetters = 'ASDFGHJKL';
    } else if (currentPractice === 'bottom-row') {
        practiceLetters = 'ZXCVBNM';
    } else if (currentPractice === 'custom') {
        practiceLetters = settings.customLetters;
    } else {
        practiceLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    
    // 在练习模式中，字母生成间隔更长，下落速度更慢
    letterSpeed = 1.5;
    letterInterval = 3000;
    
    // 设置字母生成函数使用特定的字母集
    letterGenerator = setInterval(() => {
        createLetter(practiceLetters);
    }, letterInterval);
}

// 开始冒险关卡
function startAdventureLevel() {
    // 冒险模式的实现将在后续完善
    // 目前先使用挑战模式的字母雨作为占位
    startLetterGeneration();
}

// 开始游戏循环
function startGameLoop() {
    gameLoop = setInterval(() => {
        if (gameRunning) {
            updateLetters();
            checkCollisions();
        }
    }, 16); // 约60fps
}

// 创建新字母
function createLetter(letterSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    if (!gameRunning) return;
    
    const letter = document.createElement('div');
    letter.className = 'letter';
    
    // 随机选择一个字母
    const randomLetter = letterSet[Math.floor(Math.random() * letterSet.length)];
    letter.textContent = randomLetter;
    letter.dataset.letter = randomLetter;
    
    // 随机位置（水平方向）
    const maxX = gameArea.clientWidth - 50; // 字母宽度为50px
    const randomX = Math.floor(Math.random() * maxX);
    letter.style.left = `${randomX}px`;
    letter.style.top = '-50px'; // 从屏幕顶部开始
    
    // 随机颜色（增加视觉多样性）
    const colors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    letter.style.backgroundColor = randomColor;
    
    gameArea.appendChild(letter);
    letters.push({
        element: letter,
        letter: randomLetter,
        x: randomX,
        y: -50,
        speed: letterSpeed,
        width: 50,
        height: 50
    });
}

// 创建新单词
function createWord() {
    if (!gameRunning) return;
    
    // 简单单词列表
    const wordList = settings.customWords.length > 0 ? 
        settings.customWords : 
        ['CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'BOOK', 'PLAY', 'GAME', 'JUMP', 'RUN'];
    
    const word = document.createElement('div');
    word.className = 'word';
    
    // 随机选择一个单词
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    word.textContent = randomWord;
    word.dataset.word = randomWord;
    word.dataset.currentIndex = '0'; // 跟踪当前需要输入的字母索引
    
    // 随机位置（水平方向）
    const maxX = gameArea.clientWidth - 100; // 单词宽度估计为100px
    const randomX = Math.floor(Math.random() * maxX);
    word.style.left = `${randomX}px`;
    word.style.top = '-50px'; // 从屏幕顶部开始
    
    gameArea.appendChild(word);
    words.push({
        element: word,
        word: randomWord,
        x: randomX,
        y: -50,
        speed: letterSpeed,
        currentIndex: 0,
        width: 100,
        height: 50
    });
}

// 更新游戏元素位置
function updateLetters() {
    if (!gameRunning) return;
    
    // 更新字母下落
    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        letter.y += letter.speed;
        letter.element.style.top = `${letter.y}px`;
        // 检查是否触底
        if (letter.y + letter.height >= gameArea.clientHeight) {
            letter.element.remove();
            letters.splice(i, 1);
            i--;
            loseLife();
            resetCombo();
        }
    }
    
    // 更新单词下落
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        word.y += word.speed;
        word.element.style.top = `${word.y}px`;
        // 检查是否触底
        if (word.y + word.height >= gameArea.clientHeight) {
            word.element.remove();
            words.splice(i, 1);
            i--;
            loseLife();
            resetCombo();
        }
    }
}

// 检查字母是否触底
function checkCollisions() {
    const gameAreaHeight = gameArea.clientHeight;
    
    for (let i = letters.length - 1; i >= 0; i--) {
        const letterObj = letters[i];
        const letterElement = letterObj.element;
        const letterRect = letterElement.getBoundingClientRect();
        
        // 检查字母是否触底
        if (letterRect.top >= gameAreaHeight) {
            // 字母触底，玩家失去一条生命
            loseLife();
            removeLetter(i);
        }
    }
}

// 在用户交互时初始化音频播放
function initAudioOnInteraction() {
    if (backgroundMusic) {
        backgroundMusic.play().catch(() => {});
        backgroundMusic.pause();
    }
}

// 为游戏模式选择按钮添加音频初始化监听
const modeButtons = document.querySelectorAll('.mode-button');
modeButtons.forEach(button => {
    button.addEventListener('click', initAudioOnInteraction);
});

// 玩家输入处理
function handleKeyPress(e) {
    // 调试输出
    console.log('keydown:', e.key, 'gameRunning:', gameRunning, 'game-screen hidden:', document.getElementById('game-screen').classList.contains('hidden'));
    // 只在游戏界面且游戏运行时响应
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen || gameScreen.classList.contains('hidden') || !gameRunning) return;
    let key;
    if (typeof e === 'string' && e.length === 1) {
        key = e.toUpperCase();
    } else if (e && typeof e.key === 'string' && e.key.length === 1) {
        key = e.key.toUpperCase();
    } else {
        return;
    }
    // 只处理字母键
    if (/^[A-Z]$/.test(key)) {
        lastKeyPressed = key;
        // 高亮显示按下的键
        highlightKey(key);
        
        if (currentChallenge === 'word-storm') {
            // 单词模式下，检查是否匹配当前需要输入的字母
            handleWordInput(key);
        } else {
            // 字母模式下，查找匹配的字母
            handleLetterInput(key);
        }
    }
}

// 处理字母输入
function handleLetterInput(key) {
    // 查找匹配的字母
    let matched = false;
    for (let i = 0; i < letters.length; i++) {
        if (letters[i].letter === key) {
            // 匹配成功，移除字母并加分
            const letterElement = letters[i].element;
            showFeedback(letterElement, 'Perfect!');
            safePlay(sounds.correct);
            removeLetter(i);
            addScore();
            increaseCombo();
            collectLetter(key);
            checkAchievements();
            matched = true;
            break;
        }
    }
    
    // 如果没有匹配的字母
    if (!matched) {
        showFeedback(kiki, 'Miss!');
        safePlay(sounds.wrong);
        resetCombo();
        recordTypingError(key);
    }
}

// 处理单词输入
function handleWordInput(key) {
    let matched = false;
    
    for (let i = 0; i < words.length; i++) {
        const wordObj = words[i];
        const nextLetter = wordObj.word[wordObj.currentIndex];
        
        if (key === nextLetter) {
            // 匹配成功
            matched = true;
            wordObj.currentIndex++;
            wordObj.element.dataset.currentIndex = wordObj.currentIndex;
            
            // 高亮显示已输入部分
            const wordText = wordObj.word;
            const highlightedText = `<span style="color: #2ecc71">${wordText.substring(0, wordObj.currentIndex)}</span>${wordText.substring(wordObj.currentIndex)}`;
            wordObj.element.innerHTML = highlightedText;
            
            // 检查是否完成单词
            if (wordObj.currentIndex >= wordObj.word.length) {
                showFeedback(wordObj.element, 'Perfect!');
                safePlay(sounds.correct);
                removeWord(i);
                addScore(wordObj.word.length * 10); // 单词得分更高
                increaseCombo();
                collectWord(wordObj.word);
                checkAchievements();
            } else {
                // 部分匹配也播放声音反馈
                safePlay(sounds.correct);
            }
            
            break; // 只处理第一个匹配的单词
        }
    }
    
    if (!matched) {
        // 匹配失败
        showFeedback(kiki, 'Miss!');
        safePlay(sounds.wrong);
        resetCombo();
        recordTypingError(key);
    }
}

// 移除单词
function removeWord(index) {
    const wordObj = words[index];
    wordObj.element.remove();
    words.splice(index, 1);
}

// 高亮显示按键
function highlightKey(key) {
    const keyElement = document.querySelector(`.key[data-key="${key}"]`);
    if (keyElement) {
        keyElement.classList.add('active');
        setTimeout(() => {
            keyElement.classList.remove('active');
        }, 100);
    }
}

// 显示反馈文本
function showFeedback(element, text) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.textContent = text;
    
    // 定位在字母的位置
    const rect = element.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    feedback.style.left = `${rect.left - gameAreaRect.left}px`;
    feedback.style.top = `${rect.top - gameAreaRect.top}px`;
    
    gameArea.appendChild(feedback);
    
    // 动画结束后移除
    setTimeout(() => {
        feedback.remove();
    }, 1000);
}

// 移除字母
function removeLetter(index) {
    const letter = letters[index];
    letter.element.remove();
    letters.splice(index, 1);
}

// 收集字母（添加到图鉴）
function collectLetter(letter) {
    if (!collectedLetters[letter]) {
        collectedLetters[letter] = { count: 0, firstCollected: new Date() };
    }
    
    collectedLetters[letter].count++;
    
    // 检查是否收集了所有字母
    checkAllLettersCollected();
}

// 收集单词
function collectWord(word) {
    // 将单词中的每个字母添加到收集中
    for (let i = 0; i < word.length; i++) {
        collectLetter(word[i]);
    }
}

// 检查是否收集了所有字母
function checkAllLettersCollected() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let allCollected = true;
    
    for (let i = 0; i < alphabet.length; i++) {
        if (!collectedLetters[alphabet[i]]) {
            allCollected = false;
            break;
        }
    }
    
    if (allCollected && !achievements['collect-all']) {
        unlockAchievement('collect-all');
    }
}

// 增加连击数
function increaseCombo() {
    combo++;
    updateCombo();
    
    // 更新最大连击数
    if (combo > maxCombo) {
        maxCombo = combo;
    }
    
    // 检查连击成就
    if (combo >= 10 && !achievements['combo-10']) {
        unlockAchievement('combo-10');
    }
}

// 重置连击数
function resetCombo() {
    combo = 0;
    updateCombo();
}

// 记录打字错误
function recordTypingError(key) {
    if (!typingErrors[key]) {
        typingErrors[key] = 0;
    }
    
    typingErrors[key]++;
    
    // 更新打字准确率
    const totalAttempts = Object.values(typingErrors).reduce((sum, count) => sum + count, 0) + score / 10;
    typingAccuracy = Math.round((score / 10) / (totalAttempts) * 100);
}

// 增加分数
function addScore(points = 10) {
    score += points;
    updateScore();
    
    // 检查是否升级
    if (score >= level * 100) {
        levelUp();
    }
    
    // 检查初次得分成就
    if (score >= 10 && !achievements['first-letter']) {
        unlockAchievement('first-letter');
    }
}

// 更新分数显示
function updateScore() {
    scoreElement.textContent = score;
}

// 升级
function levelUp() {
    level++;
    updateLevel();
    safePlay(sounds.levelUp);
    
    // 增加难度
    letterSpeed += 0.5;
    letterInterval = Math.max(500, letterInterval - 200);
    
    // 重新设置字母生成定时器
    clearInterval(letterGenerator);
    
    if (currentChallenge === 'word-storm') {
        letterGenerator = setInterval(createWord, letterInterval * 2);
    } else if (gameMode === 'practice') {
        startPracticeMode();
    } else {
        letterGenerator = setInterval(createLetter, letterInterval);
    }
    
    // 显示升级提示
    showLevelUpMessage();
    
    // 每升级获得一些水晶
    addCrystals(level * 5);
    
    // 检查等级成就
    if (level >= 5 && !achievements['level-5']) {
        unlockAchievement('level-5');
    }
}

// 显示升级消息
function showLevelUpMessage() {
    const message = document.createElement('div');
    message.className = 'level-up-message';
    message.textContent = `升级到 ${level} 级！`;
    gameArea.appendChild(message);
    
    // 2秒后移除消息
    setTimeout(() => {
        message.remove();
    }, 2000);
}

// 更新等级显示
function updateLevel() {
    levelElement.textContent = level;
}

// 增加能量水晶
function addCrystals(amount) {
    crystals += amount;
    updateCrystals();
    
    // 显示获得水晶的动画
    const crystalText = document.createElement('div');
    crystalText.className = 'feedback-text';
    crystalText.textContent = `+${amount} 💎`;
    crystalText.style.color = '#3498db';
    crystalText.style.fontSize = '24px';
    crystalText.style.right = '20px';
    crystalText.style.top = '60px';
    
    gameArea.appendChild(crystalText);
    safePlay(sounds.crystal);
    
    setTimeout(() => {
        crystalText.remove();
    }, 1500);
}

// 更新水晶显示
function updateCrystals() {
    crystalsElement.textContent = crystals;
    if (homeCrystalsElement) {
        homeCrystalsElement.textContent = crystals;
    }
}

// 更新连击显示
function updateCombo() {
    comboElement.textContent = combo;
}

// 失去生命
function loseLife() {
    lives--;
    updateLives();
    safePlay(sounds.wrong);
    
    if (lives <= 0) {
        endGame();
    }
}

// 更新生命值显示
function updateLives() {
    livesElement.textContent = '❤️'.repeat(lives);
}

// 解锁成就
function unlockAchievement(achievementId) {
    if (achievements[achievementId]) return;
    
    achievements[achievementId] = {
        unlocked: true,
        date: new Date()
    };
    
    // 播放成就解锁音效
    safePlay(sounds.achievement);
    
    // 显示成就解锁通知
    const achievementElement = document.querySelector(`.achievement[data-id="${achievementId}"]`);
    if (achievementElement) {
        const statusElement = achievementElement.querySelector('.achievement-status');
        if (statusElement) {
            statusElement.textContent = '✅';
            statusElement.classList.remove('locked');
            statusElement.classList.add('unlocked');
        }
    }
    
    // 显示成就解锁提示
    const achievementText = document.createElement('div');
    achievementText.className = 'feedback-text';
    achievementText.textContent = '🏆 成就解锁！';
    achievementText.style.color = '#f1c40f';
    achievementText.style.fontSize = '28px';
    achievementText.style.left = '50%';
    achievementText.style.top = '30%';
    achievementText.style.transform = 'translateX(-50%)';
    
    gameArea.appendChild(achievementText);
    
    setTimeout(() => {
        achievementText.remove();
    }, 2000);
    
    // 给予成就奖励（水晶）
    addCrystals(20);
}

// 检查成就
function checkAchievements() {
    // 成就检查逻辑已在各个相关函数中实现
}

// 结束游戏
function endGame() {
    gameRunning = false;
    clearInterval(letterGenerator);
    clearInterval(gameLoop);
    
    safePlay(sounds.gameOver);
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
    
    // 计算游戏时长
    const gameEndTime = Date.now();
    gamePlayTime += (gameEndTime - gameStartTime) / 60000; // 转换为分钟
    
    // 计算获得的水晶
    const earnedCrystals = Math.floor(score / 50) + (maxCombo >= 10 ? 10 : 0);
    addCrystals(earnedCrystals);
    
    finalScoreElement.textContent = score;
    if (earnedCrystalsElement) {
        earnedCrystalsElement.textContent = earnedCrystals;
    }
    gameOverScreen.classList.remove('hidden');
}

// 初始化字母图鉴
function initAlphabetBook() {
    const alphabetGrid = document.querySelector('.alphabet-grid');
    if (!alphabetGrid) return;
    
    alphabetGrid.innerHTML = '';
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
        const letter = alphabet[i];
        const collected = collectedLetters[letter];
        
        const item = document.createElement('div');
        item.className = `alphabet-item${collected ? '' : ' locked'}`;
        item.textContent = letter;
        
        if (collected) {
            item.title = `收集次数: ${collected.count}\n首次收集: ${collected.firstCollected.toLocaleDateString()}`;
        } else {
            item.title = '尚未收集';
        }
        
        alphabetGrid.appendChild(item);
    }
}

// 初始化自定义练习设置
function initCustomPractice() {
    const letterCheckboxes = document.querySelector('.letter-checkboxes');
    if (!letterCheckboxes) return;
    
    letterCheckboxes.innerHTML = '';
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
        const letter = alphabet[i];
        
        const checkbox = document.createElement('div');
        checkbox.className = 'letter-checkbox';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `letter-${letter}`;
        input.value = letter;
        input.checked = settings.customLetters.includes(letter);
        
        const label = document.createElement('label');
        label.htmlFor = `letter-${letter}`;
        label.textContent = letter;
        
        checkbox.appendChild(input);
        checkbox.appendChild(label);
        letterCheckboxes.appendChild(checkbox);
    }
}

// 更新家长监控面板
function updateParentPanel() {
    const todayTimeElement = document.getElementById('today-time');
    const weekTimeElement = document.getElementById('week-time');
    const avgSpeedElement = document.getElementById('avg-speed');
    const maxSpeedElement = document.getElementById('max-speed');
    const avgAccuracyElement = document.getElementById('avg-accuracy');
    
    if (todayTimeElement) todayTimeElement.textContent = Math.round(gamePlayTime);
    if (weekTimeElement) weekTimeElement.textContent = Math.round(gamePlayTime); // 简化版，实际应累计一周的时间
    if (avgSpeedElement) avgSpeedElement.textContent = typingSpeed;
    if (maxSpeedElement) maxSpeedElement.textContent = Math.max(typingSpeed, 0);
    if (avgAccuracyElement) avgAccuracyElement.textContent = typingAccuracy;
    
    // 更新进度条
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = `${typingAccuracy}%`;
    }
    
    // 更新常见错误
    const commonErrorsList = document.getElementById('common-errors');
    if (commonErrorsList) {
        commonErrorsList.innerHTML = '';
        
        // 获取错误次数最多的前3个字母
        const sortedErrors = Object.entries(typingErrors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        if (sortedErrors.length > 0) {
            sortedErrors.forEach(([letter, count]) => {
                const li = document.createElement('li');
                li.textContent = `字母 ${letter}: ${count} 次错误`;
                commonErrorsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = '暂无数据';
            commonErrorsList.appendChild(li);
        }
    }
}

// 购买装饰品或皮肤
function purchaseItem(type, value, cost) {
    if (crystals < cost) {
        alert('能量水晶不足！');
        return false;
    }
    
    crystals -= cost;
    updateCrystals();
    
    if (type === 'skin' || type === 'hat' || type === 'accessory') {
        kikiCustomization[type] = value;
        applyKikiCustomization();
    } else if (type === 'wallpaper' || type === 'furniture') {
        if (type === 'wallpaper') {
            homeDecoration.wallpaper = value;
        } else {
            if (!homeDecoration.furniture.includes(value)) {
                homeDecoration.furniture.push(value);
            }
        }
        updateHomeInterior();
    }
    
    return true;
}

// 更新Kiki的家内部装饰
function updateHomeInterior() {
    const homeInterior = document.querySelector('.home-interior');
    if (!homeInterior) return;
    
    // 设置壁纸
    homeInterior.style.backgroundColor = homeDecoration.wallpaper === 'default' ? '#f5f5f5' : '';
    homeInterior.style.backgroundImage = homeDecoration.wallpaper === 'stars' ? 'url("https://img.freepik.com/free-vector/space-background-with-stars_23-2148074607.jpg")' : '';
    
    // 清除现有家具
    const existingFurniture = homeInterior.querySelectorAll('.furniture');
    existingFurniture.forEach(item => item.remove());
    
    // 添加家具
    homeDecoration.furniture.forEach(furniture => {
        const item = document.createElement('div');
        item.className = `furniture ${furniture}`;
        
        if (furniture === 'bookshelf') {
            item.style.width = '80px';
            item.style.height = '120px';
            item.style.backgroundColor = '#8B4513';
            item.style.position = 'absolute';
            item.style.bottom = '0';
            item.style.left = '20px';
        } else if (furniture === 'plant') {
            item.style.width = '40px';
            item.style.height = '60px';
            item.style.backgroundColor = '#2ecc71';
            item.style.borderRadius = '50% 50% 0 0';
            item.style.position = 'absolute';
            item.style.bottom = '0';
            item.style.right = '20px';
        }
        
        homeInterior.appendChild(item);
    });
    
    // 添加Kiki
    const homeKiki = document.createElement('div');
    homeKiki.className = 'character';
    homeKiki.style.position = 'absolute';
    homeKiki.style.bottom = '20px';
    homeKiki.style.left = '50%';
    homeKiki.style.transform = 'translateX(-50%)';
    
    // 应用Kiki的装扮
    if (kikiCustomization.skin !== 'default') {
        homeKiki.classList.add(`skin-${kikiCustomization.skin}`);
    }
    
    if (kikiCustomization.hat) {
        homeKiki.classList.add(`hat-${kikiCustomization.hat}`);
    }
    
    if (kikiCustomization.accessory) {
        homeKiki.classList.add(`accessory-${kikiCustomization.accessory}`);
    }
    
    homeInterior.appendChild(homeKiki);
}

// 界面切换函数
function showScreen(screenId) {
    // 隐藏所有屏幕
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
    
    // 显示指定屏幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // 特殊处理
    if (screenId === 'game-screen') {
        if (!gameRunning) {
            initGame();
        }
        // 切换到游戏界面后自动聚焦
        if (document.body) document.body.focus();
        // 添加点击提示
        const gameArea = document.getElementById('game-area');
        if (gameArea && !document.getElementById('focus-tip')) {
            const tip = document.createElement('div');
            tip.id = 'focus-tip';
            tip.style.position = 'absolute';
            tip.style.top = '10px';
            tip.style.right = '10px';
            tip.style.background = 'rgba(255,255,0,0.9)';
            tip.style.color = '#333';
            tip.style.padding = '6px 12px';
            tip.style.borderRadius = '6px';
            tip.style.zIndex = '9999';
            tip.style.fontSize = '16px';
            tip.style.cursor = 'pointer';
            tip.innerText = '如物理键盘无效，请点击此处';
            tip.onclick = function() {
                if (document.body) document.body.focus();
                tip.innerText = '已聚焦，可用物理键盘';
                setTimeout(() => tip.remove(), 2000);
            };
            gameArea.appendChild(tip);
        }
    }
    if (screenId === 'adventure-select') {
        // 绑定关卡选择事件
        document.querySelectorAll('.level-item').forEach(item => {
            if (!item.classList.contains('locked')) {
                item.onclick = null;
                item.addEventListener('click', function() {
                    adventureLevel = parseInt(this.getAttribute('data-level')) - 1;
                    gameMode = 'adventure';
                    showScreen('game-screen');
                });
            }
        });
    }
    if (screenId === 'alphabet-book-screen') {
        initAlphabetBook();
    } else if (screenId === 'custom-practice-screen') {
        initCustomPractice();
    } else if (screenId === 'parent-panel-screen') {
        updateParentPanel();
    } else if (screenId === 'kiki-home-screen') {
        updateHomeInterior();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏数据
    initGameData();
    // 应用音频设置
    setAudioVolume();
    // 应用Kiki的装扮
    applyKikiCustomization();
    // 设置自动保存
    setInterval(saveGameData, 60000); // 每分钟保存一次

    // 获取需要的DOM元素
    restartButton = document.getElementById('restart-button');
    gameOverScreen = document.getElementById('game-over');
    startPracticeButton = document.getElementById('start-practice');
    adventureBack = document.getElementById('adventure-back');
    challengeBack = document.getElementById('challenge-back');
    practiceBack = document.getElementById('practice-back');
    let homeReturnButton = document.getElementById('home-return-button');

    // 事件监听器
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
            initGame();
        });
    }

    // 模式选择按钮
    document.querySelectorAll('.mode-button').forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                // 根据按钮ID确定模式
                let mode;
                if (button.id === 'adventure-button') {
                    mode = 'adventure';
                    gameMode = 'adventure';
                    showScreen('adventure-select');
                } else if (button.id === 'challenge-button') {
                    mode = 'challenge';
                    gameMode = 'challenge';
                    showScreen('challenge-select');
                } else if (button.id === 'practice-button') {
                    mode = 'practice';
                    gameMode = 'practice';
                    showScreen('practice-select');
                }
            });
        }
    });

    // 游戏界面控制按钮
    const homeButton = document.getElementById('home-button');
    const alphabetButton = document.getElementById('alphabet-button');
    const achievementsButton = document.getElementById('achievements-button');
    const settingsButton = document.getElementById('settings-button');

    if (homeButton) {
        homeButton.addEventListener('click', () => {
            showScreen('kiki-home');
        });
    }
    if (alphabetButton) {
        alphabetButton.addEventListener('click', () => {
            showScreen('alphabet-book');
        });
    }
    if (achievementsButton) {
        achievementsButton.addEventListener('click', () => {
            showScreen('achievements');
        });
    }
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            showScreen('settings');
        });
    }

    // 自定义练习开始按钮
    if (startPracticeButton) {
        startPracticeButton.addEventListener('click', () => {
            // 获取选中的字母
            const checkboxes = document.querySelectorAll('.letter-checkboxes input:checked');
            settings.customLetters = Array.from(checkboxes).map(cb => cb.value);
            // 获取选中的难度
            const difficultySelect = document.getElementById('practice-difficulty');
            if (difficultySelect) {
                settings.difficulty = difficultySelect.value;
            }
            showScreen('game-screen');
        });
    }

    // 导航按钮
    document.querySelectorAll('.nav-button').forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-target');
                showScreen(target + '-screen');
            });
        }
    });

    // 返回主页按钮
    document.querySelectorAll('.back-button').forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                showScreen('start-screen');
            });
        }
    });

    // 设置按钮
    document.querySelectorAll('.settings-option').forEach(option => {
        if (option) {
            option.addEventListener('change', (e) => {
                const setting = option.getAttribute('data-setting');
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                settings[setting] = value;
                // 应用设置
                if (setting === 'musicVolume' || setting === 'soundVolume') {
                    setAudioVolume();
                }
                // 保存设置到本地存储
                localStorage.setItem('alphabetExplorerSettings', JSON.stringify(settings));
            });
        }
    });

    // 商店购买按钮
    document.querySelectorAll('.shop-item').forEach(item => {
        if (item) {
            const buyButton = item.querySelector('.buy-button');
            if (buyButton) {
                buyButton.addEventListener('click', () => {
                    const type = item.getAttribute('data-type');
                    const value = item.getAttribute('data-value');
                    const cost = parseInt(item.getAttribute('data-cost'));
                    if (purchaseItem(type, value, cost)) {
                        buyButton.textContent = '已购买';
                        buyButton.disabled = true;
                    }
                });
            }
        }
    });

    // 冒险模式返回按钮
    if (adventureBack) {
        adventureBack.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 挑战模式返回按钮
    if (challengeBack) {
        challengeBack.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 练习模式返回按钮
    if (practiceBack) {
        practiceBack.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 挑战模式“开始”按钮
    document.querySelectorAll('.play-challenge').forEach(btn => {
        btn.addEventListener('click', function() {
            const challengeOption = this.closest('.challenge-option');
            if (challengeOption) {
                const challengeType = challengeOption.getAttribute('data-challenge');
                if (challengeType) {
                    gameMode = 'challenge';
                    currentChallenge = challengeType;
                    showScreen('game-screen');
                }
            }
        });
    });

    // 练习模式“开始”按钮
    document.querySelectorAll('.start-practice').forEach(btn => {
        btn.addEventListener('click', function() {
            const practiceOption = this.closest('.practice-option');
            if (practiceOption) {
                const practiceType = practiceOption.getAttribute('data-practice');
                if (practiceType) {
                    gameMode = 'practice';
                    currentPractice = practiceType;
                    showScreen('game-screen');
                }
            }
        });
    });

    // 返回主页按钮（游戏结束界面）
    if (homeReturnButton) {
        homeReturnButton.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 物理键盘输入支持（全局只绑定一次）
    document.addEventListener('keydown', handleKeyPress);
    // 全局调试
    document.addEventListener('keydown', function(e) {
        console.log('全局keydown:', e.key);
    });
    // 页面加载后自动聚焦
    if (document.body) document.body.focus();

    // 冒险模式关卡选择
    // 此部分已移至showScreen('adventure-select')中绑定事件
});

// 冒险模式实现
function startAdventureMode() {
    // 冒险模式的关卡数据
    const adventureLevels = [
        { letters: 'ABCDE', speed: 1, interval: 2000, goal: 20 },
        { letters: 'FGHIJ', speed: 1.2, interval: 1800, goal: 25 },
        { letters: 'KLMNO', speed: 1.4, interval: 1600, goal: 30 },
        { letters: 'PQRST', speed: 1.6, interval: 1400, goal: 35 },
        { letters: 'UVWXYZ', speed: 1.8, interval: 1200, goal: 40 },
        { letters: 'ABCDEFGHIJ', speed: 2, interval: 1000, goal: 45 },
        { letters: 'KLMNOPQRST', speed: 2.2, interval: 900, goal: 50 },
        { letters: 'UVWXYZABCD', speed: 2.4, interval: 800, goal: 55 },
        { letters: 'EFGHIJKLMN', speed: 2.6, interval: 700, goal: 60 },
        { letters: 'OPQRSTUVWX', speed: 2.8, interval: 600, goal: 65 },
        { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 3, interval: 500, goal: 100 }
    ];
    
    // 设置当前关卡
    const currentLevel = Math.min(adventureLevel, adventureLevels.length - 1);
    const levelData = adventureLevels[currentLevel];
    
    // 更新UI显示当前关卡
    const levelDisplay = document.getElementById('adventure-level');
    if (levelDisplay) {
        levelDisplay.textContent = adventureLevel + 1;
    }
    
    // 设置关卡目标
    const goalDisplay = document.getElementById('level-goal');
    if (goalDisplay) {
        goalDisplay.textContent = levelData.goal;
    }
    
    // 设置字母生成参数
    letterSpeed = levelData.speed;
    letterInterval = levelData.interval;
    
    // 开始生成字母
    letterGenerator = setInterval(() => {
        createLetter(levelData.letters.split(''));
    }, letterInterval);
    
    // 显示关卡提示
    showFeedback(`冒险模式 - 第${adventureLevel + 1}关`, 'level');
}

// 检查冒险模式关卡完成
function checkAdventureLevelComplete() {
    if (gameMode !== 'adventure') return;
    
    // 冒险模式的关卡数据
    const adventureLevels = [
        { goal: 20 }, { goal: 25 }, { goal: 30 }, { goal: 35 }, { goal: 40 },
        { goal: 45 }, { goal: 50 }, { goal: 55 }, { goal: 60 }, { goal: 65 }, { goal: 100 }
    ];
    
    // 获取当前关卡目标
    const currentLevel = Math.min(adventureLevel, adventureLevels.length - 1);
    const levelGoal = adventureLevels[currentLevel].goal;
    
    // 检查是否达到目标
    if (score >= levelGoal) {
        // 停止字母生成
        clearInterval(letterGenerator);
        
        // 播放关卡完成音效
        safePlay(sounds.levelUp);
        
        // 显示关卡完成提示
        showFeedback('关卡完成！', 'success');
        
        // 奖励水晶
        const levelCrystals = 5 + adventureLevel * 2;
        addCrystals(levelCrystals);
        
        // 显示奖励提示
        setTimeout(() => {
            showFeedback(`获得 ${levelCrystals} 能量水晶！`, 'crystal');
        }, 1500);
        
        // 进入下一关
        setTimeout(() => {
            adventureLevel++;
            
            // 检查是否通关所有关卡
            if (adventureLevel >= adventureLevels.length) {
                // 游戏通关
                showFeedback('恭喜你通关了所有关卡！', 'success');
                unlockAchievement('adventure_complete');
                
                // 返回主菜单
                setTimeout(() => {
                    endGame();
                    showScreen('start-screen');
                }, 3000);
            } else {
                // 进入下一关
                initGame();
            }
        }, 3000);
    }
}

// 为触摸设备添加虚拟键盘支持
const keyboardKeys = document.querySelectorAll('.key');
keyboardKeys.forEach(key => {
    key.addEventListener('click', () => {
        if (!gameRunning) return;
        const keyValue = key.dataset.key;
        if (typeof keyValue === 'string' && keyValue.length === 1) {
            handleKeyPress(keyValue);
        }
    });
});

// 启动HTTP服务器预览游戏
// 使用以下命令启动一个简单的HTTP服务器：
// Python 3: python -m http.server
// Python 2: python -m SimpleHTTPServer
// Node.js: npx http-server

// 音量控制
musicVolumeSlider = document.getElementById('music-volume');
soundVolumeSlider = document.getElementById('sound-volume');

if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener('input', (e) => {
        settings.musicVolume = parseFloat(e.target.value);
        setAudioVolume();
    });
}

if (soundVolumeSlider) {
    soundVolumeSlider.addEventListener('input', (e) => {
        settings.soundVolume = parseFloat(e.target.value);
        setAudioVolume();
    });
}

// 初始化游戏数据
function initGameData() {
    // 尝试从本地存储加载数据
    try {
        const savedData = localStorage.getItem('alphabetExplorerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            // 恢复水晶数量
            if (data.crystals !== undefined) {
                crystals = data.crystals;
            }
            // 恢复收集的字母
            if (data.collectedLetters) {
                collectedLetters = data.collectedLetters;
            }
            // 恢复成就
            if (data.achievements) {
                achievements = data.achievements;
            }
            // 恢复Kiki的装扮
            if (data.kikiCustomization) {
                kikiCustomization = data.kikiCustomization;
            }
            // 恢复家居装饰
            if (data.homeDecoration) {
                homeDecoration = data.homeDecoration;
            }
            // 恢复游戏统计数据
            if (data.gamePlayTime !== undefined) {
                gamePlayTime = data.gamePlayTime;
            }
            if (data.typingSpeed !== undefined) {
                typingSpeed = data.typingSpeed;
            }
            if (data.typingAccuracy !== undefined) {
                typingAccuracy = data.typingAccuracy;
            }
            if (data.typingErrors) {
                typingErrors = data.typingErrors;
            }
        }
    } catch (error) {
        console.error('加载游戏数据失败:', error);
    }
    // 尝试从本地存储加载设置
    try {
        const savedSettings = localStorage.getItem('alphabetExplorerSettings');
        if (savedSettings) {
            const data = JSON.parse(savedSettings);
            settings = { ...settings, ...data };
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
    // 更新UI
    if (typeof updateCrystals === 'function') updateCrystals();
}

function saveGameData() {
    try {
        const gameData = {
            crystals,
            collectedLetters,
            achievements,
            kikiCustomization,
            homeDecoration,
            gamePlayTime,
            typingSpeed,
            typingAccuracy,
            typingErrors
        };
        localStorage.setItem('alphabetExplorerData', JSON.stringify(gameData));
    } catch (error) {
        console.error('保存游戏数据失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取进入家长模式按钮和返回按钮
    const parentModeButton = document.getElementById('parent-mode-button');
    const returnButton = document.getElementById('return-button');

    // 添加进入家长模式按钮事件监听
    if (parentModeButton) {
        parentModeButton.addEventListener('click', () => {
            showScreen('parent-panel');
        });
    }

    // 添加返回按钮事件监听
    if (returnButton) {
        returnButton.addEventListener('click', () => {
            // 可根据实际需求修改返回的目标界面，这里默认返回主界面
            showScreen('start-screen');
        });
    }

    // 初始化游戏数据
    initGameData();
    // 应用音频设置
    setAudioVolume();
    // 应用Kiki的装扮
    applyKikiCustomization();
    // 设置自动保存
    setInterval(saveGameData, 60000); // 每分钟保存一次

    // 获取需要的DOM元素
    restartButton = document.getElementById('restart-button');
    gameOverScreen = document.getElementById('game-over');
    startPracticeButton = document.getElementById('start-practice');
    adventureBack = document.getElementById('adventure-back');
    challengeBack = document.getElementById('challenge-back');
    practiceBack = document.getElementById('practice-back');
    let homeReturnButton = document.getElementById('home-return-button');

    // 事件监听器
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
            initGame();
        });
    }

    // 模式选择按钮
    document.querySelectorAll('.mode-button').forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                // 根据按钮ID确定模式
                let mode;
                if (button.id === 'adventure-button') {
                    mode = 'adventure';
                    gameMode = 'adventure';
                    showScreen('adventure-select');
                } else if (button.id === 'challenge-button') {
                    mode = 'challenge';
                    gameMode = 'challenge';
                    showScreen('challenge-select');
                } else if (button.id === 'practice-button') {
                    mode = 'practice';
                    gameMode = 'practice';
                    showScreen('practice-select');
                }
            });
        }
    });

    // 游戏界面控制按钮
    const homeButton = document.getElementById('home-button');
    const alphabetButton = document.getElementById('alphabet-button');
    const achievementsButton = document.getElementById('achievements-button');
    const settingsButton = document.getElementById('settings-button');

    if (homeButton) {
        homeButton.addEventListener('click', () => {
            showScreen('kiki-home');
        });
    }
    if (alphabetButton) {
        alphabetButton.addEventListener('click', () => {
            showScreen('alphabet-book');
        });
    }
    if (achievementsButton) {
        achievementsButton.addEventListener('click', () => {
            showScreen('achievements');
        });
    }
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            showScreen('settings');
        });
    }

    // 自定义练习开始按钮
    if (startPracticeButton) {
        startPracticeButton.addEventListener('click', () => {
            // 获取选中的字母
            const checkboxes = document.querySelectorAll('.letter-checkboxes input:checked');
            settings.customLetters = Array.from(checkboxes).map(cb => cb.value);
            // 获取选中的难度
            const difficultySelect = document.getElementById('practice-difficulty');
            if (difficultySelect) {
                settings.difficulty = difficultySelect.value;
            }
            showScreen('game-screen');
        });
    }

    // 导航按钮
    document.querySelectorAll('.nav-button').forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-target');
                showScreen(target + '-screen');
            });
        }
    });

    // 返回主页按钮
    document.querySelectorAll('.back-button').forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                showScreen('start-screen');
            });
        }
    });

    // 设置按钮
    document.querySelectorAll('.settings-option').forEach(option => {
        if (option) {
            option.addEventListener('change', (e) => {
                const setting = option.getAttribute('data-setting');
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                settings[setting] = value;
                // 应用设置
                if (setting === 'musicVolume' || setting === 'soundVolume') {
                    setAudioVolume();
                }
                // 保存设置到本地存储
                localStorage.setItem('alphabetExplorerSettings', JSON.stringify(settings));
            });
        }
    });

    // 商店购买按钮
    document.querySelectorAll('.shop-item').forEach(item => {
        if (item) {
            const buyButton = item.querySelector('.buy-button');
            if (buyButton) {
                buyButton.addEventListener('click', () => {
                    const type = item.getAttribute('data-type');
                    const value = item.getAttribute('data-value');
                    const cost = parseInt(item.getAttribute('data-cost'));
                    if (purchaseItem(type, value, cost)) {
                        buyButton.textContent = '已购买';
                        buyButton.disabled = true;
                    }
                });
            }
        }
    });

    // 冒险模式返回按钮
    if (adventureBack) {
        adventureBack.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 挑战模式返回按钮
    if (challengeBack) {
        challengeBack.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 练习模式返回按钮
    if (practiceBack) {
        practiceBack.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 挑战模式“开始”按钮
    document.querySelectorAll('.play-challenge').forEach(btn => {
        btn.addEventListener('click', function() {
            const challengeOption = this.closest('.challenge-option');
            if (challengeOption) {
                const challengeType = challengeOption.getAttribute('data-challenge');
                if (challengeType) {
                    gameMode = 'challenge';
                    currentChallenge = challengeType;
                    showScreen('game-screen');
                }
            }
        });
    });

    // 练习模式“开始”按钮
    document.querySelectorAll('.start-practice').forEach(btn => {
        btn.addEventListener('click', function() {
            const practiceOption = this.closest('.practice-option');
            if (practiceOption) {
                const practiceType = practiceOption.getAttribute('data-practice');
                if (practiceType) {
                    gameMode = 'practice';
                    currentPractice = practiceType;
                    showScreen('game-screen');
                }
            }
        });
    });

    // 返回主页按钮（游戏结束界面）
    if (homeReturnButton) {
        homeReturnButton.addEventListener('click', () => {
            showScreen('start-screen');
        });
    }

    // 物理键盘输入支持（全局只绑定一次）
    document.addEventListener('keydown', handleKeyPress);
    // 全局调试
    document.addEventListener('keydown', function(e) {
        console.log('全局keydown:', e.key);
    });
    // 页面加载后自动聚焦
    if (document.body) document.body.focus();

    // 冒险模式关卡选择
    // 此部分已移至showScreen('adventure-select')中绑定事件
});

// 冒险模式实现
function startAdventureMode() {
    // 冒险模式的关卡数据
    const adventureLevels = [
        { letters: 'ABCDE', speed: 1, interval: 2000, goal: 20 },
        { letters: 'FGHIJ', speed: 1.2, interval: 1800, goal: 25 },
        { letters: 'KLMNO', speed: 1.4, interval: 1600, goal: 30 },
        { letters: 'PQRST', speed: 1.6, interval: 1400, goal: 35 },
        { letters: 'UVWXYZ', speed: 1.8, interval: 1200, goal: 40 },
        { letters: 'ABCDEFGHIJ', speed: 2, interval: 1000, goal: 45 },
        { letters: 'KLMNOPQRST', speed: 2.2, interval: 900, goal: 50 },
        { letters: 'UVWXYZABCD', speed: 2.4, interval: 800, goal: 55 },
        { letters: 'EFGHIJKLMN', speed: 2.6, interval: 700, goal: 60 },
        { letters: 'OPQRSTUVWX', speed: 2.8, interval: 600, goal: 65 },
        { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 3, interval: 500, goal: 100 }
    ];
    
    // 设置当前关卡
    const currentLevel = Math.min(adventureLevel, adventureLevels.length - 1);
    const levelData = adventureLevels[currentLevel];
    
    // 更新UI显示当前关卡
    const levelDisplay = document.getElementById('adventure-level');
    if (levelDisplay) {
        levelDisplay.textContent = adventureLevel + 1;
    }
    
    // 设置关卡目标
    const goalDisplay = document.getElementById('level-goal');
    if (goalDisplay) {
        goalDisplay.textContent = levelData.goal;
    }
    
    // 设置字母生成参数
    letterSpeed = levelData.speed;
    letterInterval = levelData.interval;
    
    // 开始生成字母
    letterGenerator = setInterval(() => {
        createLetter(levelData.letters.split(''));
    }, letterInterval);
    
    // 显示关卡提示
    showFeedback(`冒险模式 - 第${adventureLevel + 1}关`, 'level');
}

// 检查冒险模式关卡完成
function checkAdventureLevelComplete() {
    if (gameMode !== 'adventure') return;
    
    // 冒险模式的关卡数据
    const adventureLevels = [
        { goal: 20 }, { goal: 25 }, { goal: 30 }, { goal: 35 }, { goal: 40 },
        { goal: 45 }, { goal: 50 }, { goal: 55 }, { goal: 60 }, { goal: 65 }, { goal: 100 }
    ];
    
    // 获取当前关卡目标
    const currentLevel = Math.min(adventureLevel, adventureLevels.length - 1);
    const levelGoal = adventureLevels[currentLevel].goal;
    
    // 检查是否达到目标
    if (score >= levelGoal) {
        // 停止字母生成
        clearInterval(letterGenerator);
        
        // 播放关卡完成音效
        safePlay(sounds.levelUp);
        
        // 显示关卡完成提示
        showFeedback('关卡完成！', 'success');
        
        // 奖励水晶
        const levelCrystals = 5 + adventureLevel * 2;
        addCrystals(levelCrystals);
        
        // 显示奖励提示
        setTimeout(() => {
            showFeedback(`获得 ${levelCrystals} 能量水晶！`, 'crystal');
        }, 1500);
        
        // 进入下一关
        setTimeout(() => {
            adventureLevel++;
            
            // 检查是否通关所有关卡
            if (adventureLevel >= adventureLevels.length) {
                // 游戏通关
                showFeedback('恭喜你通关了所有关卡！', 'success');
                unlockAchievement('adventure_complete');
                
                // 返回主菜单
                setTimeout(() => {
                    endGame();
                    showScreen('start-screen');
                }, 3000);
            } else {
                // 进入下一关
                initGame();
            }
        }, 3000);
    }
}



// 启动HTTP服务器预览游戏
// 使用以下命令启动一个简单的HTTP服务器：
// Python 3: python -m http.server
// Python 2: python -m SimpleHTTPServer
// Node.js: npx http-server

// 音量控制
const musicVolumeSlider = document.getElementById('music-volume');
const soundVolumeSlider = document.getElementById('sound-volume');

if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener('input', (e) => {
        settings.musicVolume = parseFloat(e.target.value);
        setAudioVolume();
    });
}

if (soundVolumeSlider) {
    soundVolumeSlider.addEventListener('input', (e) => {
        settings.soundVolume = parseFloat(e.target.value);
        setAudioVolume();
    });
}

// 初始化游戏数据
function initGameData() {
    // 尝试从本地存储加载数据
    try {
        const savedData = localStorage.getItem('alphabetExplorerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            // 恢复水晶数量
            if (data.crystals !== undefined) {
                crystals = data.crystals;
            }
            // 恢复收集的字母
            if (data.collectedLetters) {
                collectedLetters = data.collectedLetters;
            }
            // 恢复成就
            if (data.achievements) {
                achievements = data.achievements;
            }
            // 恢复Kiki的装扮
            if (data.kikiCustomization) {
                kikiCustomization = data.kikiCustomization;
            }
            // 恢复家居装饰
            if (data.homeDecoration) {
                homeDecoration = data.homeDecoration;
            }
            // 恢复游戏统计数据
            if (data.gamePlayTime !== undefined) {
                gamePlayTime = data.gamePlayTime;
            }
            if (data.typingSpeed !== undefined) {
                typingSpeed = data.typingSpeed;
            }
            if (data.typingAccuracy !== undefined) {
                typingAccuracy = data.typingAccuracy;
            }
            if (data.typingErrors) {
                typingErrors = data.typingErrors;
            }
        }
    } catch (error) {
        console.error('加载游戏数据失败:', error);
    }
    // 尝试从本地存储加载设置
    try {
        const savedSettings = localStorage.getItem('alphabetExplorerSettings');
        if (savedSettings) {
            const data = JSON.parse(savedSettings);
            settings = { ...settings, ...data };
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
    // 更新UI
    if (typeof updateCrystals === 'function') updateCrystals();
}

function saveGameData() {
    try {
        const gameData = {
            crystals,
            collectedLetters,
            achievements,
            kikiCustomization,
            homeDecoration,
            gamePlayTime,
            typingSpeed,
            typingAccuracy,
            typingErrors
        };
        localStorage.setItem('alphabetExplorerData', JSON.stringify(gameData));
    } catch (error) {
        console.error('保存游戏数据失败:', error);
    }
}