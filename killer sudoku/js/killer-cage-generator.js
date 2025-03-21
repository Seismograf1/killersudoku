/**
 * Killer Sudoku cage generator
 */

const KillerCageGenerator = {
    /**
     * Generates cages for a Killer Sudoku puzzle
     * @param {Array} solution - The complete Sudoku solution
     * @param {string} difficulty - The difficulty level
     * @returns {Array} - Array of cage objects
     */
    generateCages(solution, difficulty) {
        // Determine cage parameters based on difficulty
        let minCageSize, maxCageSize, targetCageCount;
        
        switch (difficulty) {
            case 'easy':
                minCageSize = 2;
                maxCageSize = 4;
                targetCageCount = 25;
                break;
            case 'medium':
                minCageSize = 2;
                maxCageSize = 5;
                targetCageCount = 22;
                break;
            case 'hard':
                minCageSize = 2;
                maxCageSize = 6;
                targetCageCount = 20;
                break;
            default:
                minCageSize = 2;
                maxCageSize = 4;
                targetCageCount = 25;
        }
        
        // Ensure we never have single-cell cages
        if (minCageSize < 2) minCageSize = 2;
        
        // Start with all cells uncaged
        const cagedCells = new Set();
        const cages = [];
        
        // Create cages until all cells are covered
        while (cagedCells.size < 81) {
            // If we have enough cages but not all cells are covered,
            // allow larger cages to fill the remaining space
            if (cages.length >= targetCageCount) {
                maxCageSize = 9;
            }
            
            // Pick a random uncaged cell as the starting point
            const availableCells = [...Array(81).keys()].filter(i => !cagedCells.has(i));
            if (availableCells.length === 0) break;
            
            const startCell = availableCells[Math.floor(Math.random() * availableCells.length)];
            
            // Create a new cage
            const cageSize = Math.min(
                availableCells.length,
                Math.floor(Math.random() * (maxCageSize - minCageSize + 1)) + minCageSize
            );
            
            const cage = this.growCage(startCell, cageSize, cagedCells, solution);
            
            // Add the cage
            cages.push(cage);
            
            // Mark these cells as caged
            cage.cells.forEach(cell => cagedCells.add(cell));
        }
        
        // Validate that there are no single-cell cages
        const validCages = cages.filter(cage => cage.cells.length >= 2);
        
        // If we removed any cages, we need to reassign their cells
        if (validCages.length < cages.length) {
            const singleCellCages = cages.filter(cage => cage.cells.length === 1);
            
            // For each single cell cage, try to merge it with an adjacent cage
            singleCellCages.forEach(cage => {
                const cellIndex = cage.cells[0];
                const { row, col } = Utils.getCellIndices(cellIndex);
                
                // Check adjacent cells to find a cage to merge with
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
                    
                    const adjacentIndex = Utils.getCellIndex(newRow, newCol);
                    
                    // Find a valid cage that contains this adjacent cell
                    const adjacentCage = validCages.find(c => c.cells.includes(adjacentIndex));
                    
                    if (adjacentCage) {
                        // Merge the single cell into this cage
                        adjacentCage.cells.push(cellIndex);
                        adjacentCage.sum += solution[cellIndex];
                        return;
                    }
                }
                
                // If we couldn't merge with an existing cage, create a new cage with an adjacent cell
                for (const { dr, dc } of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    
                    // Skip if out of bounds
                    if (newRow < 0 || newRow >= 9 || newCol < 0 || newCol >= 9) {
                        continue;
                    }
                    
                    const adjacentIndex = Utils.getCellIndex(newRow, newCol);
                    
                    // Check if this cell is already in a valid cage
                    const isInValidCage = validCages.some(c => c.cells.includes(adjacentIndex));
                    
                    if (!isInValidCage) {
                        // Create a new cage with these two cells
                        validCages.push({
                            cells: [cellIndex, adjacentIndex],
                            sum: solution[cellIndex] + solution[adjacentIndex]
                        });
                        return;
                    }
                }
            });
        }
        
        return validCages;
    },
    
    /**
     * Grows a cage from a starting cell
     * @param {number} startCell - The starting cell index
     * @param {number} targetSize - The target cage size
     * @param {Set} cagedCells - Set of already caged cells
     * @param {Array} solution - The complete Sudoku solution
     * @returns {Object} - A cage object with cells and sum
     */
    growCage(startCell, targetSize, cagedCells, solution) {
        const cage = {
            cells: [startCell],
            sum: solution[startCell]
        };
        
        // Always ensure we have at least 2 cells in a cage
        if (targetSize < 2) {
            targetSize = 2;
        }
        
        // Keep track of the frontier (cells adjacent to the cage)
        let frontier = this.getAdjacentCells(startCell, cagedCells);
        
        // Grow the cage until it reaches the target size or can't grow anymore
        while (cage.cells.length < targetSize && frontier.length > 0) {
            // Pick a random cell from the frontier
            const nextCellIndex = Math.floor(Math.random() * frontier.length);
            const nextCell = frontier[nextCellIndex];
            
            // Add the cell to the cage
            cage.cells.push(nextCell);
            cage.sum += solution[nextCell];
            
            // Update the frontier - remove the cell we just added
            frontier.splice(nextCellIndex, 1);
            
            // Remove any cells from frontier that are now in the cage
            frontier = frontier.filter(cell => !cage.cells.includes(cell));
            
            // Add new adjacent cells
            const newAdjacent = this.getAdjacentCells(nextCell, cagedCells, cage.cells);
            frontier.push(...newAdjacent);
        }
        
        // If we couldn't reach the target size but have only 1 cell, try to add an adjacent cell
        if (cage.cells.length === 1) {
            const { row, col } = Utils.getCellIndices(startCell);
            
            // Try each direction until we find an uncaged cell
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
                
                const newIndex = Utils.getCellIndex(newRow, newCol);
                
                // Skip if already caged
                if (cagedCells.has(newIndex)) {
                    continue;
                }
                
                // Add this cell to the cage
                cage.cells.push(newIndex);
                cage.sum += solution[newIndex];
                break;
            }
        }
        
        return cage;
    },
    
    /**
     * Gets adjacent cells that are not already caged or in the current cage
     * @param {number} cellIndex - The cell index
     * @param {Set} cagedCells - Set of already caged cells
     * @param {Array} currentCage - Cells in the current cage
     * @returns {Array} - Array of adjacent cell indices
     */
    getAdjacentCells(cellIndex, cagedCells, currentCage = []) {
        const { row, col } = Utils.getCellIndices(cellIndex);
        const adjacent = [];
        
        // Check the four adjacent cells (up, right, down, left)
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
            
            const newIndex = Utils.getCellIndex(newRow, newCol);
            
            // Skip if already caged or in the current cage
            if (cagedCells.has(newIndex) || currentCage.includes(newIndex)) {
                continue;
            }
            
            adjacent.push(newIndex);
        }
        
        return adjacent;
    },
    
    /**
     * Determines the cage borders for rendering
     * @param {Array} cages - Array of cage objects
     * @returns {Object} - Object mapping cell indices to border information
     */
    determineCageBorders(cages) {
        const borders = {};
        
        // Initialize all cells with no borders
        for (let i = 0; i < 81; i++) {
            borders[i] = {
                top: false,
                right: false,
                bottom: false,
                left: false
            };
        }
        
        // For each cage, determine which cells need borders
        cages.forEach(cage => {
            cage.cells.forEach(cellIndex => {
                const { row, col } = Utils.getCellIndices(cellIndex);
                
                // Check if adjacent cells are in the same cage
                // If not, add a border
                
                // Top border
                if (row > 0) {
                    const topCellIndex = Utils.getCellIndex(row - 1, col);
                    if (!cage.cells.includes(topCellIndex)) {
                        borders[cellIndex].top = true;
                    }
                } else {
                    borders[cellIndex].top = true; // Edge of the grid
                }
                
                // Right border
                if (col < 8) {
                    const rightCellIndex = Utils.getCellIndex(row, col + 1);
                    if (!cage.cells.includes(rightCellIndex)) {
                        borders[cellIndex].right = true;
                    }
                } else {
                    borders[cellIndex].right = true; // Edge of the grid
                }
                
                // Bottom border
                if (row < 8) {
                    const bottomCellIndex = Utils.getCellIndex(row + 1, col);
                    if (!cage.cells.includes(bottomCellIndex)) {
                        borders[cellIndex].bottom = true;
                    }
                } else {
                    borders[cellIndex].bottom = true; // Edge of the grid
                }
                
                // Left border
                if (col > 0) {
                    const leftCellIndex = Utils.getCellIndex(row, col - 1);
                    if (!cage.cells.includes(leftCellIndex)) {
                        borders[cellIndex].left = true;
                    }
                } else {
                    borders[cellIndex].left = true; // Edge of the grid
                }
            });
        });
        
        return borders;
    }
};
