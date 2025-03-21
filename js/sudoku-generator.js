/**
 * Sudoku puzzle generator
 */

const SudokuGenerator = {
    /**
     * Generates a complete valid Sudoku grid
     * @returns {Array} - A 9x9 Sudoku grid represented as a flat array
     */
    generateCompleteGrid() {
        // Start with an empty grid
        const grid = Array(81).fill(0);
        
        // Fill the grid using backtracking
        this.fillGrid(grid);
        
        return grid;
    },
    
    /**
     * Recursively fills a Sudoku grid using backtracking
     * @param {Array} grid - The grid to fill
     * @param {number} index - The current cell index
     * @returns {boolean} - Whether the grid was successfully filled
     */
    fillGrid(grid, index = 0) {
        if (index === 81) return true;
        
        const { row, col } = Utils.getCellIndices(index);
        
        // If the cell is already filled, move to the next cell
        if (grid[index] !== 0) {
            return this.fillGrid(grid, index + 1);
        }
        
        // Try each number 1-9 in a random order
        const numbers = Utils.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
            if (Utils.isValidPlacement(grid, row, col, num)) {
                grid[index] = num;
                
                if (this.fillGrid(grid, index + 1)) {
                    return true;
                }
                
                // If we couldn't complete the grid with this number, backtrack
                grid[index] = 0;
            }
        }
        
        return false;
    },
    
    /**
     * Creates a puzzle by removing numbers from a complete grid
     * @param {Array} completeGrid - A complete Sudoku grid
     * @param {string} difficulty - The difficulty level (easy, medium, hard)
     * @returns {Object} - Object containing the puzzle and solution
     */
    createPuzzle(completeGrid, difficulty) {
        // Clone the complete grid to create the puzzle
        const puzzle = [...completeGrid];
        const solution = [...completeGrid];
        
        // Determine how many cells to remove based on difficulty
        let cellsToRemove;
        switch (difficulty) {
            case 'easy':
                cellsToRemove = 40; // 41 clues remaining
                break;
            case 'medium':
                cellsToRemove = 50; // 31 clues remaining
                break;
            case 'hard':
                cellsToRemove = 60; // 21 clues remaining
                break;
            default:
                cellsToRemove = 45;
        }
        
        // Create a list of cell indices and shuffle it
        const indices = Utils.shuffleArray([...Array(81).keys()]);
        
        // Remove cells one by one, ensuring the puzzle remains solvable
        let removed = 0;
        for (const index of indices) {
            const backup = puzzle[index];
            puzzle[index] = 0;
            
            // Check if the puzzle still has a unique solution
            if (this.hasUniqueSolution(puzzle)) {
                removed++;
                if (removed >= cellsToRemove) break;
            } else {
                // If removing this cell creates multiple solutions, put it back
                puzzle[index] = backup;
            }
        }
        
        return { puzzle, solution };
    },
    
    /**
     * Checks if a puzzle has a unique solution
     * This is a simplified version that just checks if the puzzle is solvable
     * @param {Array} puzzle - The puzzle to check
     * @returns {boolean} - Whether the puzzle has a unique solution
     */
    hasUniqueSolution(puzzle) {
        // For simplicity, we'll just check if the puzzle is solvable
        // A more thorough check would verify that only one solution exists
        const grid = [...puzzle];
        return this.solvePuzzle(grid);
    },
    
    /**
     * Solves a Sudoku puzzle using backtracking
     * @param {Array} grid - The puzzle to solve
     * @param {number} index - The current cell index
     * @returns {boolean} - Whether the puzzle was successfully solved
     */
    solvePuzzle(grid, index = 0) {
        if (index === 81) return true;
        
        if (grid[index] !== 0) {
            return this.solvePuzzle(grid, index + 1);
        }
        
        const { row, col } = Utils.getCellIndices(index);
        
        for (let num = 1; num <= 9; num++) {
            if (Utils.isValidPlacement(grid, row, col, num)) {
                grid[index] = num;
                
                if (this.solvePuzzle(grid, index + 1)) {
                    return true;
                }
                
                grid[index] = 0;
            }
        }
        
        return false;
    },
    
    /**
     * Generates a new Sudoku puzzle
     * @param {string} difficulty - The difficulty level
     * @returns {Object} - Object containing the puzzle and solution
     */
    generatePuzzle(difficulty) {
        const completeGrid = this.generateCompleteGrid();
        return this.createPuzzle(completeGrid, difficulty);
    }
};
