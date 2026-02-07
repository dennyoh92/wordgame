/**
 * Hangeul Word Warp
 * Core Logic and Engine
 */

const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const DICTIONARY = [
    '물살', '북쪽', '학기', '과학', '물학', '수박', '학교', '바다', '축구', '사자', '기차', '하늘', '포도', '모자', '나무', '나비', '우유', '아이', '오이',
    '강물', '구름', '별빛', '달빛', '햇살', '바람', '소리', '노래', '그림', '편지', '친구', '사랑', '행복', '미소', '기쁨', '슬픔', '용기', '희망',
    '사과', '참외', '딸기', '수박', '포도', '귤', '오렌지', '바나나', '망고', '레몬', '라임', '키위', '자두', '복숭아', '앵두', '보리', '벼',
    '한국', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

class HangeulParser {
    static decompose(syllable) {
        const code = syllable.charCodeAt(0) - 44032;
        if (code < 0 || code > 11171) return null;

        const jongIdx = code % 28;
        const jungIdx = ((code - jongIdx) / 28) % 21;
        const choIdx = (((code - jongIdx) / 28) - jungIdx) / 21;

        return {
            cho: CHO[choIdx],
            jung: JUNG[jungIdx],
            jong: JONG[jongIdx]
        };
    }
}

class GameEngine {
    constructor() {
        this.gridSize = 5;
        this.grid = [];
        this.playerPos = { x: 0, y: 0 };
        this.targetPos = { x: 4, y: 4 };
        this.currentWord = "";
        this.wordIndex = 0;
        this.isMoving = false;

        this.init();
    }

    init() {
        this.generateSolvableLevel();
        this.setupDOM();
        this.render();
    }

    generateSolvableLevel() {
        let attempts = 0;
        let solved = false;

        while (!solved && attempts < 200) {
            attempts++;
            this.randomizePoints();
            this.createGrid();
            if (this.findSolutions().length > 0) {
                solved = true;
            }
        }

        if (!solved) {
            console.warn("풀 수 있는 레벨을 생성하지 못했습니다. 사전이나 격자 설정을 확인하세요.");
        }
    }

    randomizePoints() {
        // Randomize start and target with at least 3 distance (Manhattan)
        do {
            this.playerPos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            this.targetPos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (Math.abs(this.playerPos.x - this.targetPos.x) + Math.abs(this.playerPos.y - this.targetPos.y) < 3);
    }

    createGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                // Target cell has no consonant
                if (x === this.targetPos.x && y === this.targetPos.y) {
                    row.push("");
                } else {
                    const randomConsonant = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
                    row.push(randomConsonant);
                }
            }
            this.grid.push(row);
        }
    }

    setupDOM() {
        this.gridEl = document.getElementById('game-grid');
        this.inputEl = document.getElementById('word-input');
        this.startBtn = document.getElementById('start-btn');
        this.messageEl = document.getElementById('message-display');
        this.wordDisplayEl = document.getElementById('active-word-display');
        this.posDisplayEl = document.getElementById('current-pos');
        this.targetDisplayEl = document.getElementById('target-pos');
        this.hintBtn = document.getElementById('hint-btn');
        this.hintDisplayEl = document.getElementById('hint-display');

        this.startBtn.onclick = () => this.handleStart();
        this.hintBtn.onclick = () => this.showHint();
        this.inputEl.onkeypress = (e) => {
            if (e.key === 'Enter') this.handleStart();
        };

        this.targetDisplayEl.textContent = `(${this.targetPos.x}, ${this.targetPos.y})`;

        // Add click listener for cells (for manual targeting if we want to allow it later)
        this.gridEl.onclick = (e) => {
            const cell = e.target.closest('.cell');
            if (cell && this.isWaitingForWarp) {
                const idx = Array.from(this.gridEl.children).indexOf(cell);
                const x = idx % this.gridSize;
                const y = Math.floor(idx / this.gridSize);
                this.resolveWarp({ x, y });
            }
        };
    }

    render() {
        this.gridEl.innerHTML = '';
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = this.grid[y][x];

                if (x === this.playerPos.x && y === this.playerPos.y) {
                    cell.classList.add('player');
                }
                if (x === this.targetPos.x && y === this.targetPos.y) {
                    cell.classList.add('target');
                }
                // Only show start label if it's the very first render or we still care about starting pos
                // Let's use a one-time class if needed, but for now just player pos

                this.gridEl.appendChild(cell);
            }
        }
        this.posDisplayEl.textContent = `(${this.playerPos.x}, ${this.playerPos.y})`;
    }

    async handleStart() {
        if (this.isMoving) return;
        const word = this.inputEl.value.trim();
        if (!word) {
            this.showMessage("단어를 입력하세요!");
            return;
        }

        if (word.length < 2) {
            this.showMessage("단어는 최소 2글자 이상이어야 합니다!");
            return;
        }

        // 틀렸을 때를 대비해 현재 위치 저장
        const startPos = { ...this.playerPos };

        this.currentWord = word;
        this.wordIndex = 0;
        this.isMoving = true;
        this.hintDisplayEl.textContent = ""; // Clear hint
        this.renderWordBlocks();

        await this.processWord();
        // Only set isMoving to false if we didn't already succeed and transition
        if (this.playerPos.x !== this.targetPos.x || this.playerPos.y !== this.targetPos.y) {
            this.playerPos = startPos;
            this.render();
            this.isMoving = false;
        }
    }

    startNewLevel() {
        this.inputEl.value = "";
        this.wordDisplayEl.innerHTML = "";
        this.generateSolvableLevel();
        this.render();
        this.showMessage("격자 위의 자음을 보고 단어를 입력하세요.");
    }

    showHint() {
        const solutions = this.findSolutions();
        if (solutions.length > 0) {
            // Show the shortest or first valid solution
            const best = solutions.sort((a, b) => a.length - b.length)[0];
            this.hintDisplayEl.textContent = `추천 단어: ${best}`;
        } else {
            this.hintDisplayEl.textContent = "현재 위치에서 도달 가능한 단어를 찾지 못했습니다.";
        }
    }

    findSolutions() {
        const possible = [];
        for (const word of DICTIONARY) {
            if (word.length >= 2 && this.simulateWord(word)) {
                possible.push(word);
            }
        }
        return possible;
    }

    simulateWord(word) {
        let tempPos = { x: this.playerPos.x, y: this.playerPos.y };

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const decomposed = HangeulParser.decompose(char);
            if (!decomposed) return false;

            const currentConsonant = this.grid[tempPos.y][tempPos.x];
            const canActivate = (currentConsonant === decomposed.cho || (decomposed.jong && currentConsonant === decomposed.jong));
            if (!canActivate) return false;

            // Simulate Warp
            if (decomposed.jong) {
                let targetConsonant = "";
                if (currentConsonant === decomposed.cho) targetConsonant = decomposed.jong;
                else if (currentConsonant === decomposed.jong) targetConsonant = decomposed.cho;

                if (targetConsonant) {
                    const potentialTargets = [];
                    for (let y = 0; y < this.gridSize; y++) {
                        for (let x = 0; x < this.gridSize; x++) {
                            if (this.grid[y][x] === targetConsonant && (x !== tempPos.x || y !== tempPos.y)) {
                                potentialTargets.push({ x, y });
                            }
                        }
                    }
                    if (potentialTargets.length > 0) {
                        // In simulation, we need to know if ANY of these paths lead to victory.
                        // For simplicity, let's assume the "best" jump (closest to goal).
                        potentialTargets.sort((a, b) => {
                            const distA = Math.abs(a.x - this.targetPos.x) + Math.abs(a.y - this.targetPos.y);
                            const distB = Math.abs(b.x - this.targetPos.x) + Math.abs(b.y - this.targetPos.y);
                            return distA - distB;
                        });
                        tempPos = { x: potentialTargets[0].x, y: potentialTargets[0].y };
                    }
                }
            }

            // Simulate Vowel Move
            let dx = 0, dy = 0;
            const vowel = decomposed.jung;
            switch (vowel) {
                case 'ㅏ': case 'ㅐ': dx = 1; break;
                case 'ㅑ': dx = 2; break;
                case 'ㅓ': case 'ㅔ': dx = -1; break;
                case 'ㅕ': dx = -2; break;
                case 'ㅗ': case 'ㅚ': dy = -1; break;
                case 'ㅛ': dy = -2; break;
                case 'ㅜ': case 'ㅟ': dy = 1; break;
                case 'ㅠ': dy = 2; break;
                case 'ㅘ': dx = 1; dy = -1; break;
                case 'ㅝ': dx = -1; dy = 1; break;
            }
            tempPos.x = Math.max(0, Math.min(this.gridSize - 1, tempPos.x + dx));
            tempPos.y = Math.max(0, Math.min(this.gridSize - 1, tempPos.y + dy));

            if (tempPos.x === this.targetPos.x && tempPos.y === this.targetPos.y) {
                return true;
            }
        }
        return false;
    }

    renderWordBlocks() {
        this.wordDisplayEl.innerHTML = '';
        for (let i = 0; i < this.currentWord.length; i++) {
            const block = document.createElement('div');
            block.className = 'letter-block';
            block.textContent = this.currentWord[i];
            this.wordDisplayEl.appendChild(block);
        }
    }

    showMessage(msg) {
        this.messageEl.textContent = msg;
    }

    async processWord() {
        while (this.wordIndex < this.currentWord.length) {
            const char = this.currentWord[this.wordIndex];
            const decomposed = HangeulParser.decompose(char);

            if (!decomposed) {
                this.showMessage(`'${char}'은 한글이 아닙니다.`);
                break;
            }

            // Update UI for current block
            const blocks = this.wordDisplayEl.children;
            for (let i = 0; i < blocks.length; i++) {
                blocks[i].classList.toggle('current', i === this.wordIndex);
            }

            this.showMessage(`현재 글자: ${char}`);

            // Check Activation
            const currentCellConsonant = this.grid[this.playerPos.y][this.playerPos.x];
            // Rule: Current consonant must match either Cho or Jong of the current letter
            const canActivate = (currentCellConsonant === decomposed.cho || (decomposed.jong && currentCellConsonant === decomposed.jong));

            if (!canActivate) {
                this.showMessage(`활성화 실패: '${char}'의 자음과 일치하지 않습니다.`);
                break;
            }

            // Step 1: Consonant Warp (Available if letter has Jong)
            if (decomposed.jong) {
                await this.performWarp(decomposed);
            }

            // Step 2: Vowel Move
            await this.performVowelMove(decomposed.jung);

            this.render();

            if (this.playerPos.x === this.targetPos.x && this.playerPos.y === this.targetPos.y) {
                this.showMessage("🎉 성공! 다음 문제로 넘어갑니다...");
                this.isMoving = false;

                // Wait and start new level
                await new Promise(r => setTimeout(r, 1500));
                this.startNewLevel();
                return;
            }

            // Move to next letter in word
            this.wordIndex++;
            await new Promise(r => setTimeout(r, 600));
        }

        if (this.playerPos.x !== this.targetPos.x || this.playerPos.y !== this.targetPos.y) {
            this.showMessage("게임 종료. 다시 시도하세요.");
        }
    }

    async performWarp(decomposed) {
        const currentConsonant = this.grid[this.playerPos.y][this.playerPos.x];
        let targetConsonant = "";

        // Determine the "other" consonant to jump TO
        if (currentConsonant === decomposed.cho && decomposed.jong) {
            targetConsonant = decomposed.jong;
        } else if (currentConsonant === decomposed.jong) {
            targetConsonant = decomposed.cho;
        }

        if (!targetConsonant) return;

        // Find potential targets
        const potentialTargets = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === targetConsonant && (x !== this.playerPos.x || y !== this.playerPos.y)) {
                    potentialTargets.push({ x, y });
                }
            }
        }

        if (potentialTargets.length > 0) {
            this.showMessage(`'${targetConsonant}' 자음 워프 중...`);

            // Visualize potential targets
            this.highlightCells(potentialTargets, 'active');

            // Auto-pick the best one for now (closest to goal)
            // In a better version, we'd wait for user input here.
            potentialTargets.sort((a, b) => {
                const distA = Math.abs(a.x - this.targetPos.x) + Math.abs(a.y - this.targetPos.y);
                const distB = Math.abs(b.x - this.targetPos.x) + Math.abs(b.y - this.targetPos.y);
                return distA - distB;
            });

            await new Promise(r => setTimeout(r, 600));
            this.playerPos = potentialTargets[0];
            this.render();
            await new Promise(r => setTimeout(r, 400));
        }
    }

    highlightCells(coords, className) {
        const cells = this.gridEl.children;
        coords.forEach(pos => {
            const idx = pos.y * this.gridSize + pos.x;
            if (cells[idx]) cells[idx].classList.add(className);
        });
    }

    async performVowelMove(vowel) {
        let dx = 0, dy = 0;

        switch (vowel) {
            case 'ㅏ': case 'ㅐ': dx = 1; break;
            case 'ㅑ': dx = 2; break;
            case 'ㅓ': case 'ㅔ': dx = -1; break;
            case 'ㅕ': dx = -2; break;
            case 'ㅗ': case 'ㅚ': dy = -1; break;
            case 'ㅛ': dy = -2; break;
            case 'ㅜ': case 'ㅟ': dy = 1; break;
            case 'ㅠ': dy = 2; break;
            case 'ㅘ': dx = 1; dy = -1; break;
            case 'ㅝ': dx = -1; dy = 1; break;
            default: break; // ㅡ, ㅣ 등은 이동 안함
        }

        if (dx !== 0 || dy !== 0) {
            this.showMessage(`모음 이동: ${vowel}`);
            this.playerPos.x = Math.max(0, Math.min(this.gridSize - 1, this.playerPos.x + dx));
            this.playerPos.y = Math.max(0, Math.min(this.gridSize - 1, this.playerPos.y + dy));
            this.render();
            await new Promise(r => setTimeout(r, 400));
        }
    }
}

window.onload = () => {
    window.game = new GameEngine();
};
