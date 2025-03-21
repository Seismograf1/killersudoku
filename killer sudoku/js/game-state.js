/**
 * Game state management
 */

class GameState {
    constructor() {
        this.puzzle = Array(81).fill(0);
        this.solution = Array(81).fill(0);
        this.userGrid = Array(81).fill(0);
        this.notes = Array(81).fill().map(() => Array(9).fill(false));
        this.cages = [];
        this.cageBorders = {};
        this.difficulty = 'medium';
        this.timer = 0;
        this.isPaused = false;
        this.isComplete = false;
        this.history = [];
        this.historyIndex = -1;
        this.selectedCell = -1;
        this.notesMode = false;
    }

    /**
     * Initializes a new game
     * @param {string} difficulty - The difficulty level
     */
    newGame(difficulty) {
        this.difficulty = difficulty;
        
        // Generate a new Sudoku puzzle
        const { puzzle, solution } = SudokuGenerator.generatePuzzle(difficulty);
        this.puzzle = puzzle;
        this.solution = solution;
        
        // Initialize the user grid with the puzzle
        this.userGrid = [...puzzle];
        
        // Clear notes
        this.notes = Array(81).fill().map(() => Array(9).fill(false));
        
        // Generate cages - retry until we have no single-cell cages
        let attempts = 0;
        do {
            this.cages = KillerCageGenerator.generateCages(solution, difficulty);
            attempts++;
            // Prevent infinite loop
            if (attempts > 10) break;
        } while (this.cages.some(cage => cage.cells.length < 2));
        
        this.cageBorders = KillerCageGenerator.determineCageBorders(this.cages);
        
        // Reset game state
        this.timer = 0;
        this.isPaused = false;
        this.isComplete = false;
        this.history = [];
        this.historyIndex = -1;
        this.selectedCell = -1;
        this.notesMode = false;
        
        // Save the initial state to history
        this.saveState();
    }

    /**
     * Loads a saved game
     * @param {Object} savedState - The saved game state
     */
    loadGame(savedState) {
        Object.assign(this, savedState);
        
        // Ensure cageBorders are properly set if they weren't saved
        if (!this.cageBorders || Object.keys(this.cageBorders).length === 0) {
            this.cageBorders = KillerCageGenerator.determineCageBorders(this.cages);
        }
    }

    /**
     * Places a number in the selected cell
     * @param {number} num - The number to place (1-9)
     */
    placeNumber(num) {
        if (this.selectedCell === -1 || this.isPaused || this.isComplete) return;
        if (this.puzzle[this.selectedCell] !== 0) return; // Can't modify given cells
        
        const oldValue = this.userGrid[this.selectedCell];
        const oldNotes = [...this.notes[this.selectedCell]];
        
        if (this.notesMode) {
            // Toggle note
            const noteIndex = num - 1;
            this.notes[this.selectedCell][noteIndex] = !this.notes[this.selectedCell][noteIndex];
        } else {
            // Place number
            this.userGrid[this.selectedCell] = num;
            // Clear notes for this cell
            this.notes[this.selectedCell] = Array(9).fill(false);
        }
        
        // Save state to history
        this.saveState({
            type: 'placeNumber',
            cell: this.selectedCell,
            oldValue,
            newValue: this.userGrid[this.selectedCell],
            oldNotes,
            newNotes: [...this.notes[this.selectedCell]]
        });
        
        // Check if the puzzle is complete
        this.checkCompletion();
    }

    /**
     * Erases the number or notes in the selected cell
     */
    eraseCell() {
        if (this.selectedCell === -1 || this.isPaused || this.isComplete) return;
        if (this.puzzle[this.selectedCell] !== 0) return; // Can't modify given cells
        
        const oldValue = this.userGrid[this.selectedCell];
        const oldNotes = [...this.notes[this.selectedCell]];
        
        // Erase number
        this.userGrid[this.selectedCell] = 0;
        
        // Save state to history
        this.saveState({
            type: 'eraseCell',
            cell: this.selectedCell,
            oldValue,
            newValue: 0,
            oldNotes,
            newNotes: [...this.notes[this.selectedCell]]
        });
    }

    /**
     * Toggles notes mode
     */
    toggleNotesMode() {
        this.notesMode = !this.notesMode;
    }

    /**
     * Selects a cell
     * @param {number} cellIndex - The cell index to select
     */
    selectCell(cellIndex) {
        this.selectedCell = cellIndex;
    }

    /**
     * Checks if the puzzle is complete and correct
     * @returns {boolean} - Whether the puzzle is complete and correct
     */
    checkCompletion() {
        // Check if all cells are filled
        if (this.userGrid.includes(0)) {
            return false;
        }
        
        // Check if all cells match the solution
        for (let i = 0; i < 81; i++) {
            if (this.userGrid[i] !== this.solution[i]) {
                return false;
            }
        }
        
        this.isComplete = true;
        return true;
    }

    /**
     * Checks if the current grid has any errors
     * @returns {Array} - Array of cell indices with errors
     */
    checkErrors() {
        const errors = [];
        
        for (let i = 0; i < 81; i++) {
            if (this.userGrid[i] !== 0 && this.userGrid[i] !== this.solution[i]) {
                errors.push(i);
            }
        }
        
        return errors;
    }

    /**
     * Provides a hint by filling in a random empty cell
     * @returns {number} - The cell index that was filled
     */
    getHint() {
        if (this.isPaused || this.isComplete) return -1;
        
        // Find all empty cells
        const emptyCells = [];
        for (let i = 0; i < 81; i++) {
            if (this.userGrid[i] === 0) {
                emptyCells.push(i);
            }
        }
        
        if (emptyCells.length === 0) return -1;
        
        // Pick a random empty cell
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const cellIndex = emptyCells[randomIndex];
        
        const oldValue = this.userGrid[cellIndex];
        const oldNotes = [...this.notes[cellIndex]];
        
        // Fill in the correct value
        this.userGrid[cellIndex] = this.solution[cellIndex];
        // Clear notes for this cell
        this.notes[cellIndex] = Array(9).fill(false);
        
        // Save state to history
        this.saveState({
            type: 'hint',
            cell: cellIndex,
            oldValue,
            newValue: this.userGrid[cellIndex],
            oldNotes,
            newNotes: [...this.notes[cellIndex]]
        });
        
        // Check if the puzzle is complete
        this.checkCompletion();
        
        return cellIndex;
    }

    /**
     * Saves the current state to history
     * @param {Object} action - The action that was performed
     */
    saveState(action = null) {
        // If we're not at the end of the history, truncate it
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Save the current state
        this.history.push({
            userGrid: [...this.userGrid],
            notes: this.notes.map(cell => [...cell]),
            action
        });
        
        this.historyIndex = this.history.length - 1;
    }

    /**
     * Undoes the last action
     * @returns {boolean} - Whether an action was undone
     */
    undo() {
        if (this.historyIndex <= 0 || this.isPaused) return false;
        
        this.historyIndex--;
        const prevState = this.history[this.historyIndex];
        
        this.userGrid = [...prevState.userGrid];
        this.notes = prevState.notes.map(cell => [...cell]);
        
        return true;
    }

    /**
     * Redoes the last undone action
     * @returns {boolean} - Whether an action was redone
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1 || this.isPaused) return false;
        
        this.historyIndex++;
        const nextState = this.history[this.historyIndex];
        
        this.userGrid = [...nextState.userGrid];
        this.notes = nextState.notes.map(cell => [...cell]);
        
        return true;
    }

    /**
     * Toggles the pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }

    /**
     * Increments the timer by one second
     */
    incrementTimer() {
        if (!this.isPaused && !this.isComplete) {
            this.timer++;
        }
    }

    /**
     * Gets the cage for a cell
     * @param {number} cellIndex - The cell index
     * @returns {Object|null} - The cage object or null if not found
     */
    getCageForCell(cellIndex) {
        return this.cages.find(cage => cage.cells.includes(cellIndex)) || null;
    }

    /**
     * Auto-fills notes for all empty cells
     */
    autoSetNotes() {
        for (let cellIndex = 0; cellIndex < 81; cellIndex++) {
            if (this.userGrid[cellIndex] !== 0) continue;
            
            const { row, col } = Utils.getCellIndices(cellIndex);
            const newNotes = Array(9).fill(true);
            
            // Check row
            for (let i = 0; i < 9; i++) {
                const value = this.userGrid[row * 9 + i];
                if (value !== 0) {
                    newNotes[value - 1] = false;
                }
            }
            
            // Check column
            for (let i = 0; i < 9; i++) {
                const value = this.userGrid[i * 9 + col];
                if (value !== 0) {
                    newNotes[value - 1] = false;
                }
            }
            
            // Check box
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const value = this.userGrid[(boxRow + i) * 9 + (boxCol + j)];
                    if (value !== 0) {
                        newNotes[value - 1] = false;
                    }
                }
            }
            
            // Check cage
            const cage = this.getCageForCell(cellIndex);
            if (cage) {
                // Get the remaining sum for the cage
                let remainingSum = cage.sum;
                let emptyCells = 0;
                
                for (const cageCell of cage.cells) {
                    if (this.userGrid[cageCell] !== 0) {
                        remainingSum -= this.userGrid[cageCell];
                    } else if (cageCell !== cellIndex) {
                        emptyCells++;
                    }
                }
                
                // If there's only one empty cell in the cage, we know its value
                if (emptyCells === 0 && remainingSum >= 1 && remainingSum <= 9) {
                    this.userGrid[cellIndex] = remainingSum;
                    this.notes[cellIndex] = Array(9).fill(false);
                    continue;
                }
                
                // Remove notes that would make the cage sum too large
                for (let i = 0; i < 9; i++) {
                    if (i + 1 > remainingSum) {
                        newNotes[i] = false;
                    }
                }
            }
            
            this.notes[cellIndex] = newNotes;
        }
        
        // Save state to history
        this.saveState({
            type: 'autoSetNotes'
        });
    }

    /**
     * Clears all notes
     */
    clearAllNotes() {
        this.notes = Array(81).fill().map(() => Array(9).fill(false));
        
        // Save state to history
        this.saveState({
            type: 'clearAllNotes'
        });
    }
}
