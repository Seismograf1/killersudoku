/**
 * Utility functions for the Killer Sudoku game
 */

const Utils = {
    /**
     * Shuffles an array in place using Fisher-Yates algorithm
     * @param {Array} array - The array to shuffle
     * @returns {Array} - The shuffled array
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },

    /**
     * Formats time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} - Formatted time string
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    /**
     * Saves game state to local storage
     * @param {Object} gameState - The current game state
     */
    saveGameToLocalStorage(gameState) {
        localStorage.setItem('killerSudokuGameState', JSON.stringify(gameState));
    },

    /**
     * Loads game state from local storage
     * @returns {Object|null} - The saved game state or null if none exists
     */
    loadGameFromLocalStorage() {
        const savedGame = localStorage.getItem('killerSudokuGameState');
        return savedGame ? JSON.parse(savedGame) : null;
    },

    /**
     * Saves settings to local storage
     * @param {Object} settings - The current settings
     */
    saveSettingsToLocalStorage(settings) {
        localStorage.setItem('killerSudokuSettings', JSON.stringify(settings));
    },

    /**
     * Loads settings from local storage
     * @returns {Object} - The saved settings or default settings if none exist
     */
    loadSettingsFromLocalStorage() {
        const savedSettings = localStorage.getItem('killerSudokuSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            cageColoring: true,
            dottedLines: true,
            darkMode: false
        };
    },

    /**
     * Gets row, column and box indices for a cell
     * @param {number} index - The cell index (0-80)
     * @returns {Object} - Object containing row, column and box indices
     */
    getCellIndices(index) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        return { row, col, box };
    },

    /**
     * Gets the index of a cell from row and column
     * @param {number} row - The row index (0-8)
     * @param {number} col - The column index (0-8)
     * @returns {number} - The cell index (0-80)
     */
    getCellIndex(row, col) {
        return row * 9 + col;
    },

    /**
     * Checks if a value is valid for a cell in the grid
     * @param {Array} grid - The current grid values
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {number} value - The value to check
     * @returns {boolean} - Whether the value is valid
     */
    isValidPlacement(grid, row, col, value) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (grid[row * 9 + i] === value) return false;
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (grid[i * 9 + col] === value) return false;
        }
        
        // Check box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[(boxRow + i) * 9 + (boxCol + j)] === value) return false;
            }
        }
        
        return true;
    },

    /**
     * Deep clones an object
     * @param {Object} obj - The object to clone
     * @returns {Object} - The cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};
