/**
 * Main application entry point
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize game state
    const gameState = new GameState();
    
    // Try to load a saved game
    const savedGame = Utils.loadGameFromLocalStorage();
    if (savedGame) {
        gameState.loadGame(savedGame);
    } else {
        // Start a new game if no saved game exists
        gameState.newGame('medium');
    }
    
    // Initialize UI controller
    const ui = new UIController(gameState);
    
    // Update the UI to reflect the initial game state
    ui.updateUI();
    
    // Ensure cage coloring is applied
    if (ui.settings.cageColoring) {
        ui.applyCageColoring();
    }
    
    // Check for completion after each move
    const originalPlaceNumber = gameState.placeNumber;
    gameState.placeNumber = function(num) {
        originalPlaceNumber.call(this, num);
        
        if (this.isComplete) {
            ui.showCompletionMessage();
        }
    };
});
