class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        // 增加画布大小
        this.canvas.width = 1000;
        this.canvas.height = 1000;
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 60; // 增加格子大小
        this.boardSize = 15;
        this.pieces = [];
        this.currentPlayer = 1;
        this.history = [];
        this.lastMove = null; // 记录最后一步
        this.currentSkin = 'classic';
        this.loadSkinPreferences();
        this.pieceSize = 28; // 固定棋子大小
        
        this.initGame();
        this.bindEvents();
        this.bindAdditionalEvents();
    }

    initGame() {
        // 初始化棋盘
        this.pieces = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.drawBoard();
        this.updatePlayerInfo();
    }

    // 更新皮肤配置
    skins = {
        classic: {
            background: '#DCB35C',
            lines: '#000000',
            woodPattern: '#C19859',
            black: ['#333333', '#000000'],
            white: ['#ffffff', '#f0f0f0'],
            boardShadow: '#B89650'
        },
        jade: {
            background: '#9EC5AB',
            lines: '#1F4A36',
            woodPattern: '#8AB69B',
            black: ['#333333', '#000000'],
            white: ['#ffffff', '#f0f0f0'],
            boardShadow: '#7FA98E'
        },
        simple: {
            background: '#ffffff',
            lines: '#333333',
            woodPattern: '#f5f5f5',
            black: ['#333333', '#000000'],
            white: ['#ffffff', '#f0f0f0'],
            boardShadow: '#e0e0e0'
        },
        retro: {
            background: '#C19A6B',
            lines: '#4A3829',
            woodPattern: '#B38C5F',
            black: ['#333333', '#000000'],
            white: ['#ffffff', '#f0f0f0'],
            boardShadow: '#A67F53'
        },
        // 新增皮肤
        marble: {
            background: '#E6E6E6',
            lines: '#2C3E50',
            woodPattern: '#D5D5D5',
            black: ['#2C3E50', '#1A2530'],
            white: ['#ECF0F1', '#BDC3C7'],
            boardShadow: '#BFBFBF'
        },
        bamboo: {
            background: '#90A955',
            lines: '#31572C',
            woodPattern: '#7A8F4A',
            black: ['#333333', '#000000'],
            white: ['#ffffff', '#f0f0f0'],
            boardShadow: '#758B44'
        },
        sakura: {
            background: '#FFE5E5',
            lines: '#D4A5A5',
            woodPattern: '#FFCECE',
            black: ['#4A4A4A', '#000000'],
            white: ['#ffffff', '#f9f9f9'],
            boardShadow: '#FFD1D1'
        }
    };

    loadSkinPreferences() {
        const savedSkin = localStorage.getItem('gomokuSkin');
        if (savedSkin) {
            this.currentSkin = savedSkin;
            document.getElementById('skinSelect').value = savedSkin;
        }
    }

    bindAdditionalEvents() {
        document.getElementById('skinSelect').addEventListener('change', (e) => {
            this.currentSkin = e.target.value;
            localStorage.setItem('gomokuSkin', this.currentSkin);
            this.drawBoard();
        });

        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('closeModal').addEventListener('click', () => this.hideHistory());
    }

    drawBoard() {
        const skin = this.skins[this.currentSkin];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算棋盘实际大小和偏移量
        const boardSize = (this.boardSize - 1) * this.gridSize;
        const offsetX = (this.canvas.width - boardSize) / 2;
        const offsetY = (this.canvas.height - boardSize) / 2;
        
        // 绘制棋盘外阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        this.ctx.fillStyle = skin.boardShadow;
        this.ctx.fillRect(
            offsetX - 20,
            offsetY - 20,
            boardSize + 40,
            boardSize + 40
        );
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 绘制棋盘背景
        this.ctx.fillStyle = skin.background;
        this.ctx.fillRect(
            offsetX - 15,
            offsetY - 15,
            boardSize + 30,
            boardSize + 30
        );

        // 绘制木纹纹理
        if (this.currentSkin !== 'simple') {
            this.ctx.strokeStyle = skin.woodPattern;
            this.ctx.lineWidth = 1;
            
            // 水平木纹
            for (let i = 0; i < boardSize + 30; i += 4) {
                this.ctx.beginPath();
                this.ctx.moveTo(offsetX - 15, offsetY - 15 + i);
                this.ctx.lineTo(offsetX - 15 + boardSize + 30, offsetY - 15 + i);
                this.ctx.stroke();
            }
            
            // 随机添加一些木纹节点
            for (let i = 0; i < 10; i++) {
                const x = offsetX - 15 + Math.random() * (boardSize + 30);
                const y = offsetY - 15 + Math.random() * (boardSize + 30);
                const radius = 5 + Math.random() * 15;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, Math.PI * 2);
                this.ctx.fillStyle = skin.woodPattern;
                this.ctx.globalAlpha = 0.1;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }

        // 绘制棋盘网格
        this.ctx.beginPath();
        this.ctx.strokeStyle = skin.lines;
        this.ctx.lineWidth = 1;
        
        // 绘制横线和竖线
        for (let i = 0; i < this.boardSize; i++) {
            this.ctx.moveTo(offsetX, offsetY + i * this.gridSize);
            this.ctx.lineTo(offsetX + boardSize, offsetY + i * this.gridSize);
            this.ctx.moveTo(offsetX + i * this.gridSize, offsetY);
            this.ctx.lineTo(offsetX + i * this.gridSize, offsetY + boardSize);
        }
        this.ctx.stroke();

        // 绘制天元和星位
        const stars = [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]];
        stars.forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + x * this.gridSize,
                offsetY + y * this.gridSize,
                5, 0, Math.PI * 2
            );
            this.ctx.fillStyle = skin.lines;
            this.ctx.fill();
        });

        // 绘制棋子
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.pieces[i][j] !== 0) {
                    this.drawPiece(i, j, this.pieces[i][j], offsetX, offsetY);
                }
            }
        }

        // 绘制最后落子标记
        if (this.lastMove) {
            const {row, col} = this.lastMove;
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + col * this.gridSize,
                offsetY + row * this.gridSize,
                4, 0, Math.PI * 2
            );
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fill();
        }
    }

    drawPiece(row, col, player, offsetX, offsetY) {
        const skin = this.skins[this.currentSkin];
        const x = offsetX + col * this.gridSize;
        const y = offsetY + row * this.gridSize;
        
        // 绘制阴影
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y + 2, this.pieceSize, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();

        // 绘制棋子
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.pieceSize, 0, Math.PI * 2);
        
        // 创建更真实的渐变效果
        const gradient = this.ctx.createRadialGradient(
            x - this.pieceSize * 0.3,
            y - this.pieceSize * 0.3,
            this.pieceSize * 0.1,
            x,
            y,
            this.pieceSize
        );

        if (player === 1) {
            gradient.addColorStop(0, skin.black[0]);
            gradient.addColorStop(0.3, skin.black[1]);
            gradient.addColorStop(1, skin.black[1]);
        } else {
            gradient.addColorStop(0, skin.white[0]);
            gradient.addColorStop(0.3, skin.white[1]);
            gradient.addColorStop(1, skin.white[1]);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 添加高光效果
        const highlightGradient = this.ctx.createRadialGradient(
            x - this.pieceSize * 0.3,
            y - this.pieceSize * 0.3,
            0,
            x - this.pieceSize * 0.3,
            y - this.pieceSize * 0.3,
            this.pieceSize * 0.5
        );
        
        highlightGradient.addColorStop(0, player === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)');
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();
        
        // 为白子添加边框
        if (player === 2) {
            this.ctx.strokeStyle = '#999';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 计算棋盘偏移量
        const boardSize = (this.boardSize - 1) * this.gridSize;
        const offsetX = (this.canvas.width - boardSize) / 2;
        const offsetY = (this.canvas.height - boardSize) / 2;
        
        // 计算落子的行列
        const col = Math.round((x - offsetX) / this.gridSize);
        const row = Math.round((y - offsetY) / this.gridSize);
        
        // 检查是否有效位置
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize && this.pieces[row][col] === 0) {
            this.placePiece(row, col);
        }
    }

    placePiece(row, col) {
        this.pieces[row][col] = this.currentPlayer;
        this.history.push({row, col, player: this.currentPlayer});
        this.lastMove = {row, col};
        
        this.drawBoard();
        
        if (this.checkWin(row, col)) {
            this.showWinMessage(this.currentPlayer);
            return;
        }
        
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updatePlayerInfo();
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]], // 水平
            [[1, 0], [-1, 0]], // 垂直
            [[1, 1], [-1, -1]], // 对角线
            [[1, -1], [-1, 1]] // 反对角线
        ];

        for (const direction of directions) {
            let count = 1;
            for (const [dx, dy] of direction) {
                let r = row + dx;
                let c = col + dy;
                while (
                    r >= 0 && r < this.boardSize &&
                    c >= 0 && c < this.boardSize &&
                    this.pieces[r][c] === this.currentPlayer
                ) {
                    count++;
                    r += dx;
                    c += dy;
                }
            }
            if (count >= 5) return true;
        }
        return false;
    }

    undo() {
        if (this.history.length === 0) return;
        
        const lastMove = this.history.pop();
        this.pieces[lastMove.row][lastMove.col] = 0;
        this.currentPlayer = lastMove.player;
        this.lastMove = null; // 重置最后落子位置
        this.drawBoard();
        this.updatePlayerInfo();
    }

    restart() {
        this.pieces = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.history = [];
        this.currentPlayer = 1;
        this.lastMove = null; // 重置最后落子位置
        this.drawBoard();
        this.updatePlayerInfo();
    }

    updatePlayerInfo() {
        document.getElementById('currentPlayer').textContent = 
            `当前玩家：${this.currentPlayer === 1 ? '黑子' : '白子'}`;
    }

    saveGame() {
        const gameState = {
            pieces: this.pieces,
            currentPlayer: this.currentPlayer,
            timestamp: new Date().toISOString(),
            skin: this.currentSkin
        };

        let savedGames = JSON.parse(localStorage.getItem('gomokuGames') || '[]');
        savedGames.push(gameState);
        localStorage.setItem('gomokuGames', JSON.stringify(savedGames));
    }

    showHistory() {
        const modal = document.getElementById('historyModal');
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        const savedGames = JSON.parse(localStorage.getItem('gomokuGames') || '[]');
        
        savedGames.forEach((game, index) => {
            const date = new Date(game.timestamp);
            const item = document.createElement('div');
            item.className = 'history-item';
            
            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteGame(index);
            };
            
            // 创建预览画布
            const preview = document.createElement('div');
            preview.className = 'history-preview';
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            this.drawPreview(canvas, game.pieces, game.skin);
            preview.appendChild(canvas);
            
            // 创建信息区
            const info = document.createElement('div');
            info.className = 'history-info';
            info.innerHTML = `
                <p>棋局 ${index + 1}</p>
                <p>${date.toLocaleString()}</p>
            `;
            
            item.appendChild(deleteBtn);
            item.appendChild(preview);
            item.appendChild(info);
            item.onclick = () => this.loadGame(game);
            historyList.appendChild(item);
        });

        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 0);

        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideHistory();
            }
        };
    }

    hideHistory() {
        const modal = document.getElementById('historyModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    drawPreview(canvas, pieces, skinName) {
        const ctx = canvas.getContext('2d');
        const skin = this.skins[skinName || this.currentSkin];
        const gridSize = canvas.width / 15;
        
        // 绘制背景
        ctx.fillStyle = skin.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        ctx.beginPath();
        ctx.strokeStyle = skin.lines;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 15; i++) {
            ctx.moveTo(gridSize / 2, (i + 0.5) * gridSize);
            ctx.lineTo(canvas.width - gridSize / 2, (i + 0.5) * gridSize);
            ctx.moveTo((i + 0.5) * gridSize, gridSize / 2);
            ctx.lineTo((i + 0.5) * gridSize, canvas.height - gridSize / 2);
        }
        ctx.stroke();
        
        // 绘制棋子
        for (let i = 0; i < pieces.length; i++) {
            for (let j = 0; j < pieces[i].length; j++) {
                if (pieces[i][j] !== 0) {
                    const x = (j + 0.5) * gridSize;
                    const y = (i + 0.5) * gridSize;
                    ctx.beginPath();
                    ctx.arc(x, y, gridSize * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = pieces[i][j] === 1 ? '#000' : '#fff';
                    ctx.fill();
                    if (pieces[i][j] === 2) {
                        ctx.strokeStyle = '#000';
                        ctx.stroke();
                    }
                }
            }
        }
    }

    loadGame(gameState) {
        this.pieces = gameState.pieces;
        this.currentPlayer = gameState.currentPlayer;
        if (gameState.skin) {
            this.currentSkin = gameState.skin;
            document.getElementById('skinSelect').value = gameState.skin;
        }
        this.drawBoard();
        this.updatePlayerInfo();
        this.hideHistory();
    }

    showWinMessage(winner) {
        // 先保存棋局
        this.saveGame();
        
        const modal = document.getElementById('winModal');
        const winText = document.getElementById('winText');
        winText.textContent = `${winner === 1 ? '黑子' : '白子'}获胜！`;
        
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 0);
        
        document.getElementById('newGameBtn').onclick = () => {
            this.hideWinMessage();
            this.restart();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideWinMessage();
            }
        };
    }

    hideWinMessage() {
        const modal = document.getElementById('winModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    deleteGame(index) {
        if (confirm('确定要删除这个棋局吗？')) {
            let savedGames = JSON.parse(localStorage.getItem('gomokuGames') || '[]');
            savedGames.splice(index, 1);
            localStorage.setItem('gomokuGames', JSON.stringify(savedGames));
            this.showHistory(); // 刷新历史记录显示
        }
    }
}

// 初始化游戏
window.onload = () => {
    new GomokuGame();
}; 