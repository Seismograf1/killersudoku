/**
 * UI Controller for the Killer Sudoku game
 */

class UIController {
    constructor(gameState) {
        this.gameState = gameState;
        this.settings = Utils.loadSettingsFromLocalStorage();
        this.timerInterval = null;
        this.gridElement = document.getElementById('sudoku-grid');
        
        this.initializeUI();
        this.applySettings();
    }
    
    /**
     * Initializes the UI and event listeners
     */
    initializeUI() {
        // Create the grid cells
        this.createGrid();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the timer
        this.startTimer();
        
        // Make sure modal is hidden on initialization
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('modal').style.display = 'none';
        
        // Apply cage coloring
        if (this.settings.cageColoring) {
            this.applyCageColoring();
        }
    }
    
    /**
     * Creates the Sudoku grid in the DOM
     */
    createGrid() {
        this.gridElement.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // Create notes container
            const notesContainer = document.createElement('div');
            notesContainer.className = 'cell-notes';
            
            // Create 9 note elements in a row
            for (let j = 0; j < 9; j++) {
                const note = document.createElement('div');
                note.className = 'note';
                note.dataset.value = j + 1;
                notesContainer.appendChild(note);
            }
            
            cell.appendChild(notesContainer);
            this.gridElement.appendChild(cell);
        }
    }
    
    /**
     * Sets up event listeners for the UI
     */
    setupEventListeners() {
        // Cell selection
        this.gridElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                const index = parseInt(cell.dataset.index);
                this.selectCell(index);
            }
        });
        
        // Number pad buttons
        document.querySelectorAll('.num-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.num;
                
                if (action === 'notes') {
                    this.gameState.toggleNotesMode();
                    button.classList.toggle('active');
                    document.getElementById('sudoku-grid').classList.toggle('notes-mode');
                } else if (action === 'erase') {
                    this.gameState.eraseCell();
                    this.updateUI();
                } else {
                    const num = parseInt(action);
                    this.gameState.placeNumber(num);
                    this.updateUI();
                }
            });
        });
        
        // Game control buttons
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showNewGameConfirmation();
        });
        
        document.getElementById('hint-btn').addEventListener('click', () => {
            const hintCell = this.gameState.getHint();
            if (hintCell !== -1) {
                this.updateUI();
                this.selectCell(hintCell);
            }
        });
        
        document.getElementById('check-btn').addEventListener('click', () => {
            this.checkErrors();
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => {
            if (this.gameState.undo()) {
                this.updateUI();
            }
        });
        
        document.getElementById('redo-btn').addEventListener('click', () => {
            if (this.gameState.redo()) {
                this.updateUI();
            }
        });
        
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(button => {
            button.addEventListener('click', () => {
                const difficulty = button.dataset.difficulty;
                document.querySelectorAll('.difficulty-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                this.showNewGameConfirmation(difficulty);
            });
        });
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-panel').classList.toggle('hidden');
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-panel').classList.add('hidden');
        });
        
        // Settings options
        document.getElementById('cage-coloring').addEventListener('change', (e) => {
            this.settings.cageColoring = e.target.checked;
            Utils.saveSettingsToLocalStorage(this.settings);
            this.applySettings();
        });
        
        document.getElementById('dotted-lines').addEventListener('change', (e) => {
            this.settings.dottedLines = e.target.checked;
            Utils.saveSettingsToLocalStorage(this.settings);
            this.applySettings();
        });
        
        document.getElementById('dark-mode').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            Utils.saveSettingsToLocalStorage(this.settings);
            this.applySettings();
        });
        
        // Modal close button
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideModal();
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.gameState.isPaused) return;
            
            const key = e.key;
            
            if (key >= '1' && key <= '9') {
                const num = parseInt(key);
                this.gameState.placeNumber(num);
                this.updateUI();
            } else if (key === 'Delete' || key === 'Backspace') {
                this.gameState.eraseCell();
                this.updateUI();
            } else if (key === 'n') {
                this.gameState.toggleNotesMode();
                document.querySelector('.num-btn[data-num="notes"]').classList.toggle('active');
                document.getElementById('sudoku-grid').classList.toggle('notes-mode');
            } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
                this.handleArrowKey(key);
            } else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
                if (this.gameState.undo()) {
                    this.updateUI();
                }
            } else if (key === 'y' && (e.ctrlKey || e.metaKey)) {
                if (this.gameState.redo()) {
                    this.updateUI();
                }
            }
        });
    }
    
    /**
     * Handles arrow key navigation
     * @param {string} key - The arrow key that was pressed
     */
    handleArrowKey(key) {
        if (this.gameState.selectedCell === -1) {
            this.selectCell(0);
            return;
        }
        
        const { row, col } = Utils.getCellIndices(this.gameState.selectedCell);
        let newRow = row;
        let newCol = col;
        
        switch (key) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(8, col + 1);
                break;
        }
        
        const newIndex = Utils.getCellIndex(newRow, newCol);
        this.selectCell(newIndex);
    }
    
    /**
     * Selects a cell in the grid
     * @param {number} index - The cell index to select
     */
    selectCell(index) {
        this.gameState.selectCell(index);
        
        // Update the UI to show the selected cell
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.remove('same-number');
        });
        
        const selectedCell = document.querySelector(`.cell[data-index="${index}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
            
            // Highlight cells with the same number
            const value = this.gameState.userGrid[index];
            if (value !== 0) {
                document.querySelectorAll('.cell').forEach(cell => {
                    const cellIndex = parseInt(cell.dataset.index);
                    if (this.gameState.userGrid[cellIndex] === value && cellIndex !== index) {
                        cell.classList.add('same-number');
                    }
                });
            }
        }
    }
    
    /**
     * Updates the UI to reflect the current game state
     */
    updateUI() {
        // First apply cage coloring if needed
        if (this.settings.cageColoring) {
            this.applyCageColoring();
        }
        
        // Store current background colors and border styles
        const cellStyles = [];
        for (let i = 0; i < 81; i++) {
            const cell = document.querySelector(`.cell[data-index="${i}"]`);
            if (cell) {
                cellStyles[i] = {
                    backgroundColor: cell.style.backgroundColor,
                    borderTopStyle: cell.style.borderTopStyle,
                    borderRightStyle: cell.style.borderRightStyle,
                    borderBottomStyle: cell.style.borderBottomStyle,
                    borderLeftStyle: cell.style.borderLeftStyle,
                    classes: {
                        top: cell.classList.contains('cage-border-top'),
                        right: cell.classList.contains('cage-border-right'),
                        bottom: cell.classList.contains('cage-border-bottom'),
                        left: cell.classList.contains('cage-border-left')
                    }
                };
            }
        }
        
        // Update cell values and notes
        for (let i = 0; i < 81; i++) {
            const cell = document.querySelector(`.cell[data-index="${i}"]`);
            if (!cell) continue;
            
            // Clear existing content and classes
            cell.innerHTML = '';
            
            // Create notes container
            const notesContainer = document.createElement('div');
            notesContainer.className = 'cell-notes';
            
            // Add notes in a row at the top
            for (let j = 0; j < 9; j++) {
                const note = document.createElement('div');
                note.className = 'note';
                note.dataset.value = j + 1;
                if (this.gameState.notes[i][j]) {
                    note.textContent = j + 1;
                    note.style.display = 'block';
                } else {
                    note.style.display = 'none';
                }
                notesContainer.appendChild(note);
            }
            
            cell.appendChild(notesContainer);
            
            // Add value if not empty
            if (this.gameState.userGrid[i] !== 0) {
                const value = document.createElement('div');
                value.className = 'cell-value';
                value.textContent = this.gameState.userGrid[i];
                
                // Style differently for given numbers
                if (this.gameState.puzzle[i] !== 0) {
                    value.classList.add('given');
                } else {
                    value.classList.add('user-input');
                }
                
                cell.appendChild(value);
            }
            
            // Add cage sum if this is the first cell in a cage
            const cage = this.gameState.getCageForCell(i);
            if (cage && cage.cells[0] === i) {
                const cageSum = document.createElement('div');
                cageSum.className = 'cage-sum';
                cageSum.textContent = cage.sum;
                cell.appendChild(cageSum);
            }
            
            // Restore background color and border styles
            if (cellStyles[i]) {
                cell.style.backgroundColor = cellStyles[i].backgroundColor;
                
                // Restore cage border classes and styles
                if (cellStyles[i].classes.top) {
                    cell.classList.add('cage-border-top');
                    cell.style.borderTopStyle = cellStyles[i].borderTopStyle;
                }
                if (cellStyles[i].classes.right) {
                    cell.classList.add('cage-border-right');
                    cell.style.borderRightStyle = cellStyles[i].borderRightStyle;
                }
                if (cellStyles[i].classes.bottom) {
                    cell.classList.add('cage-border-bottom');
                    cell.style.borderBottomStyle = cellStyles[i].borderBottomStyle;
                }
                if (cellStyles[i].classes.left) {
                    cell.classList.add('cage-border-left');
                    cell.style.borderLeftStyle = cellStyles[i].borderLeftStyle;
                }
            } else {
                // Add cage borders for initial render
                if (this.gameState.cageBorders[i]) {
                    const borders = this.gameState.cageBorders[i];
                    const borderStyle = this.settings.dottedLines ? 'dashed' : 'solid';
                    
                    if (borders.top) {
                        cell.classList.add('cage-border-top');
                        cell.style.borderTopStyle = borderStyle;
                    }
                    if (borders.right) {
                        cell.classList.add('cage-border-right');
                        cell.style.borderRightStyle = borderStyle;
                    }
                    if (borders.bottom) {
                        cell.classList.add('cage-border-bottom');
                        cell.style.borderBottomStyle = borderStyle;
                    }
                    if (borders.left) {
                        cell.classList.add('cage-border-left');
                        cell.style.borderLeftStyle = borderStyle;
                    }
                }
            }
        }
        
        // Reselect the current cell to update highlighting
        if (this.gameState.selectedCell !== -1) {
            this.selectCell(this.gameState.selectedCell);
        }
        
        // Update timer display
        this.updateTimerDisplay();
        
        // Save game state to local storage
        Utils.saveGameToLocalStorage(this.gameState);
    }
    
    /**
     * Starts a new game
     * @param {string} difficulty - The difficulty level
     */
    startNewGame(difficulty) {
        // Stop the current timer
        clearInterval(this.timerInterval);
        
        // Clear all cell styling first
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('cage-border-top', 'cage-border-right', 'cage-border-bottom', 'cage-border-left');
            cell.style.backgroundColor = '';
            cell.style.borderTopStyle = '';
            cell.style.borderRightStyle = '';
            cell.style.borderBottomStyle = '';
            cell.style.borderLeftStyle = '';
        });
        
        // Initialize a new game
        this.gameState.newGame(difficulty);
        
        // Update the UI
        this.updateUI();
        
        // Restart the timer
        this.startTimer();
        
        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('active');
        
        // Apply settings to ensure cage coloring and borders are applied correctly
        this.applySettings();
    }
    
    /**
     * Shows a confirmation dialog for starting a new game
     * @param {string} difficulty - The difficulty level
     */
    showNewGameConfirmation(difficulty = null) {
        const modal = document.getElementById('modal');
        const message = document.getElementById('modal-message');
        const buttons = document.getElementById('modal-buttons');
        
        message.textContent = 'Start a new game? Your current progress will be lost.';
        
        buttons.innerHTML = '';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            this.hideModal();
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'New Game';
        confirmButton.addEventListener('click', () => {
            this.hideModal();
            this.startNewGame(difficulty || this.gameState.difficulty);
        });
        
        buttons.appendChild(cancelButton);
        buttons.appendChild(confirmButton);
        
        this.showModal();
    }
    
    /**
     * Toggles the pause state
     */
    togglePause() {
        this.gameState.togglePause();
        
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
        
        if (this.gameState.isPaused) {
            // Show pause overlay
            const message = document.getElementById('modal-message');
            const buttons = document.getElementById('modal-buttons');
            
            message.textContent = 'Game Paused';
            
            buttons.innerHTML = '';
            
            const resumeButton = document.createElement('button');
            resumeButton.textContent = 'Resume';
            resumeButton.addEventListener('click', () => {
                this.hideModal();
                this.togglePause();
            });
            
            buttons.appendChild(resumeButton);
            
            this.showModal();
        }
    }
    
    /**
     * Starts the timer
     */
    startTimer() {
        clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.gameState.incrementTimer();
            this.updateTimerDisplay();
        }, 1000);
    }
    
    /**
     * Updates the timer display
     */
    updateTimerDisplay() {
        const timerElement = document.querySelector('.timer');
        timerElement.textContent = Utils.formatTime(this.gameState.timer);
    }
    
    /**
     * Checks for errors in the current grid
     */
    checkErrors() {
        const errors = this.gameState.checkErrors();
        
        // Highlight error cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('error');
        });
        
        errors.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            if (cell) {
                cell.classList.add('error');
            }
        });
        
        // Show message
        if (errors.length === 0) {
            this.showMessage('No errors found!');
        } else {
            this.showMessage(`Found ${errors.length} error${errors.length === 1 ? '' : 's'}.`);
        }
    }
    
    /**
     * Shows a message in the modal
     * @param {string} message - The message to show
     */
    showMessage(message) {
        const messageElement = document.getElementById('modal-message');
        const buttons = document.getElementById('modal-buttons');
        
        messageElement.textContent = message;
        
        buttons.innerHTML = '';
        
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => {
            this.hideModal();
        });
        
        buttons.appendChild(okButton);
        
        this.showModal();
    }
    
    /**
     * Shows a completion message
     */
    showCompletionMessage() {
        // Start fireworks animation
        Fireworks.start(6000, () => {
            // Show completion modal after fireworks
            const message = document.getElementById('modal-message');
            const buttons = document.getElementById('modal-buttons');
            
            message.innerHTML = `
                <h2>Puzzle Completed!</h2>
                <p>Congratulations! You've solved the puzzle.</p>
                <p>Time: ${Utils.formatTime(this.gameState.timer)}</p>
            `;
            
            buttons.innerHTML = '';
            
            const newGameButton = document.createElement('button');
            newGameButton.textContent = 'New Game';
            newGameButton.addEventListener('click', () => {
                this.hideModal();
                this.startNewGame(this.gameState.difficulty);
            });
            
            const celebrateButton = document.createElement('button');
            celebrateButton.textContent = 'Celebrate Again!';
            celebrateButton.addEventListener('click', () => {
                this.hideModal();
                Fireworks.start(6000, () => {
                    this.showModal();
                });
            });
            
            buttons.appendChild(celebrateButton);
            buttons.appendChild(newGameButton);
            
            this.showModal();
        });
    }
    
    /**
     * Applies the current settings
     */
    applySettings() {
        // Update checkboxes to match settings
        document.getElementById('cage-coloring').checked = this.settings.cageColoring;
        document.getElementById('dotted-lines').checked = this.settings.dottedLines;
        document.getElementById('dark-mode').checked = this.settings.darkMode;
        
        // Apply dark mode
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Apply dotted lines setting
        const cageBorderStyle = this.settings.dottedLines ? 'dashed' : 'solid';
        document.documentElement.style.setProperty('--cage-border-style', cageBorderStyle);
        
        // Clear all cell styling first
        document.querySelectorAll('.cell').forEach(cell => {
            if (!this.settings.cageColoring) {
                cell.style.backgroundColor = '';
            }
            
            // Update border styles for all cells with cage borders
            if (cell.classList.contains('cage-border-top')) {
                cell.style.borderTopStyle = cageBorderStyle;
            }
            if (cell.classList.contains('cage-border-right')) {
                cell.style.borderRightStyle = cageBorderStyle;
            }
            if (cell.classList.contains('cage-border-bottom')) {
                cell.style.borderBottomStyle = cageBorderStyle;
            }
            if (cell.classList.contains('cage-border-left')) {
                cell.style.borderLeftStyle = cageBorderStyle;
            }
        });
        
        // Apply cage coloring
        if (this.settings.cageColoring) {
            this.applyCageColoring();
        } else {
            // Remove cage colors
            document.querySelectorAll('.cell').forEach(cell => {
                cell.style.backgroundColor = '';
            });
        }
    }
    
    /**
     * Applies coloring to cages
     */
    applyCageColoring() {
        // Only clear background colors, not borders
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.backgroundColor = '';
        });
        
        // Create a map of adjacent cages
        const adjacentCages = new Map();
        
        // Find adjacent cages
        for (let i = 0; i < this.gameState.cages.length; i++) {
            const cage = this.gameState.cages[i];
            adjacentCages.set(i, new Set());
            
            // For each cell in the cage
            for (const cellIndex of cage.cells) {
                const { row, col } = Utils.getCellIndices(cellIndex);
                
                // Check adjacent cells
                const directions = [
                    { dr: -1, dc: 0 }, // up
                    { dr: 0, dc: 1 },  // right
                    { dr: 1, dc: 0 },  // down
                    { dr: 0, dc: -1 }  // left
                ];
                
                for (const { dr, dc } of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    
                    // Skip if out of bounds
                    if (newRow < 0 || newRow >= 9 || newCol < 0 || newCol >= 9) {
                        continue;
                    }
                    
                    const adjacentCellIndex = Utils.getCellIndex(newRow, newCol);
                    
                    // Find which cage this adjacent cell belongs to
                    for (let j = 0; j < this.gameState.cages.length; j++) {
                        if (i !== j && this.gameState.cages[j].cells.includes(adjacentCellIndex)) {
                            adjacentCages.get(i).add(j);
                        }
                    }
                }
            }
        }
        
        // Assign colors to cages using graph coloring algorithm
        const cageColors = new Map();
        // Use more muted, pastel colors that work well together
        const availableHues = [30, 120, 200, 270, 330, 60]; // Orange, Green, Blue, Purple, Pink, Yellow-Green
        
        for (let i = 0; i < this.gameState.cages.length; i++) {
            // Get colors of adjacent cages
            const adjacentColors = new Set();
            for (const adjCage of adjacentCages.get(i)) {
                if (cageColors.has(adjCage)) {
                    adjacentColors.add(cageColors.get(adjCage));
                }
            }
            
            // Find first available color not used by adjacent cages
            let selectedHue = null;
            for (const hue of availableHues) {
                if (!adjacentColors.has(hue)) {
                    selectedHue = hue;
                    break;
                }
            }
            
            // If all colors are used by adjacent cages, pick one with different saturation/lightness
            if (selectedHue === null) {
                selectedHue = availableHues[i % availableHues.length];
            }
            
            cageColors.set(i, selectedHue);
            
            // Apply the color to all cells in the cage
            // Use more subtle, pastel colors with lower saturation and higher lightness
            const saturation = 50 + (i % 3) * 10; // Lower saturation for more subtle colors
            const lightness = 88 - (i % 3) * 3;   // Higher lightness for pastel effect
            const color = `hsla(${selectedHue}, ${saturation}%, ${lightness}%, 0.4)`; // Lower opacity
            
            this.gameState.cages[i].cells.forEach(cellIndex => {
                const cell = document.querySelector(`.cell[data-index="${cellIndex}"]`);
                if (cell) {
                    cell.style.backgroundColor = color;
                }
            });
        }
        
        // Apply cage borders with correct style
        const borderStyle = this.settings.dottedLines ? 'dashed' : 'solid';
        for (let i = 0; i < 81; i++) {
            const cell = document.querySelector(`.cell[data-index="${i}"]`);
            if (!cell) continue;
            
            // Add cage borders
            if (this.gameState.cageBorders[i]) {
                const borders = this.gameState.cageBorders[i];
                
                if (borders.top) {
                    cell.classList.add('cage-border-top');
                    cell.style.borderTopStyle = borderStyle;
                }
                if (borders.right) {
                    cell.classList.add('cage-border-right');
                    cell.style.borderRightStyle = borderStyle;
                }
                if (borders.bottom) {
                    cell.classList.add('cage-border-bottom');
                    cell.style.borderBottomStyle = borderStyle;
                }
                if (borders.left) {
                    cell.classList.add('cage-border-left');
                    cell.style.borderLeftStyle = borderStyle;
                }
            }
        }
    }
    
    /**
     * Shows the modal dialog
     */
    showModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
    
    /**
     * Hides the modal dialog
     */
    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}
