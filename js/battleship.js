(function () {

//Global Constants
var CONST = {};
CONST.AVAILABLE_SHIPS = ['carrier', 'battleship', 'destroyer', 'submarine', 'patrolboat'];

//You are player 0 and computer is player 1
CONST.HUMAN_PLAYER = 0;
CONST.COMPUTER_PLAYER = 1;

//Possible values for the parmeter `type` (string)
CONST.CSS_TYPE_EMPTY = 'empty';
CONST.CSS_TYPE_SHIP = 'ship';
CONST.CSS_TYPE_MISS = 'miss';
CONST.CSS_TYPE_HIT = 'hit';
CONST.CSS_TYPE_SUNK = 'sunk';

//Grid code
CONST.TYPE_EMPTY = 0; //0 = water(empty)
CONST.TYPE_SHIP = 1; //1 = undamaged ship
CONST.TYPE_MISS = 2; //2 = water with cannonball in it (missed shot)
CONST.TYPE_HIT = 3; //3 = damaged ship (unsunk) 
CONST.TYPE_SUNK = 4; //4 = sunk ship

Game.usedShips = [CONST.UNUSED, CONST.UNUSED, CONST.UNUSED, CONST.UNUSED, CONST.UNUSED];
CONST.USED = 1;
CONST.UNUSED = 0;

//Game Statistics
function Stats() {
	this.shotsTaken = 0;
	this.shotsHit = 0;
	this.totalShots = parseInt(localStorage.getItem('totalShots'), 10) || 0;
	this.totalHits = parseInt(localStorage.getItem('totalHits'), 10) || 0;
	this.gamesPlayed = parseInt(localStorage.getItem('gamesPlayed'), 10) || 0;
	this.gamesWon = parseInt(localStorage.getItem('gamesWon'), 10) ||0;
}

Stats.prototype.incrementShots = function() {
	this.shotsTaken++;
}
Stats.prototype.hitShot = function() {
	this.shotsHit++;
}
Stats.prototype.wonGame = function() {
	this.gamesPlayed++;
	this.gamesWon++;
}
Stats.prototype.lostGame = function() {
	this.gamesPlayed++;
};

//Saves the game statistics to localstorage
Stats.prototype.syncStats = function() {
	if(!this.skipCurrentGame) {
		var totalShots = parseInt(localStorage.getItem('totalShots'), 10) ||0;
		totalShots += this.shotsTaken;
		var totalHits = parseInt(localStorage.getItem('totalHits'), 10) ||0;
		totalHits += this.shotsHit;
		localStorage.setItem('totalShots', totalShots);
		localStorage.setItem('totalHits', totalHits);
		localStorage.setItem('gamesPlayed', this.gamesPlayed);
		localStorage.setItem('gamesWon', this.gamesWon);
	} else {
		this.skipCurrentGame = false;
	}

	var stringifiedGrid = '';
	for (var x = 0; x < Game.size; x++) {
		for (var y = 0; y < Game.size; y++) {
			stringifiedGrid += '(' + x + ',' + y + '):' + mainGame.humanGrid.cells[x][y] + ';\n';
		}
	}
};

//Updates the sidebar display with the current statistics
Stats.prototype.updateStatsSidebar = function() {
	var elWinPercent = document.getElementById('stats-win');
	var elAccuracy = document.getElementById('stats-accuracy');
	elWinPercent.innerHTML = this.gamesWon + " of " + this.gamesPlayed;
	elAccuracy.innerHTML = Math.round((100 * this.totalHits / this.totalShots) || 0) + "%";
};

//Reset all game vanity statistics to zero.
Stats.prototype.resetStats = function(e) {
	Game.stats.skipCurrentGame = true;
	localStorage.setItem('totalShots', 0);
	localStorage.setItem('totalHits', 0);
	localStorage.setItem('gamesPlayed', 0);
	localStorage.setItem('gamesWon', 0);
	Game.stats.shotsTaken = 0;
	Game.stats.shotsHit = 0;
	Game.stats.totalShots = 0;
	Game.stats.totalHits = 0;
	Game.stats.gamesPlayed = 0;
	Game.stats.gamesWon = 0;
	Game.stats.updateStatsSidebar();
};

//Game manager object
//Constructor
function Game(size) {
	Game.size = size;
	this.shotsTaken = 0;
	this.createGrid();
	this.init();
}
Game.size = 10; // Default grid size is 10x10
Game.gameOver = false;
// Checks if the game is won, and if it is, re-initializes the game
Game.prototype.checkIfWon = function() {
	if (this.computerFleet.allShipsSunk()) {
		alert('Congratulations, you win!');
		Game.gameOver = true;
		Game.stats.syncStats();
		Game.stats.updateStatsSidebar();
		this.showResetSidebar();
	} else if (this.humanFleet.allShipsSunk()) {
		alert('Yarr! The computer sank your ships. Try again.');
		Game.gameOver = true;
		Game.stats.lostGame();
		Game.stats.syncStats();
		Game.stats.updateStatsSidebar();
		this.showResetSidebar();
	}
};

// Shoots at the target player on the grid.
// Returns {int} Constants.TYPE: What the shot uncovered
Game.prototype.shoot = function(x, y, targetPlayer) {
	var targetGrid;
	var targetFleet;
	if (targetPlayer === CONST.HUMAN_PLAYER) {
		targetGrid = this.humanGrid;
		targetFleet = this.humanFleet;
	} else if (targetPlayer === CONST.COMPUTER_PLAYER) {
		targetGrid = this.computerGrid;
		targetFleet = this.computerFleet;
	} else {
		// Should never be called
		console.log("There was an error trying to find the correct player to target");
	}

	if (targetGrid.isDamagedShip(x, y)) {
		return null;
	} else if (targetGrid.isMiss(x, y)) {
		return null;
	} else if (targetGrid.isUndamagedShip(x, y)) {
		//update grid/board
		targetGrid.updateCell(x, y, 'hit', targetPlayer);
		// IMPORTANT: This function needs to be called _after_ updating the cell to a 'hit',
		// because it overrides the CSS class to 'sunk' if we find that the ship was sunk.
		targetFleet.findShipByCoords(x, y).incrementDamage(); //Increase damage
		this.checkIfWon();
		return CONST.TYPE_HIT;
	} else {
		targetGrid.updateCell(x, y, 'miss', targetPlayer);
		this.checkIfWon();
		return CONST.TYPE_MISS;
	}
};

// Creates click event listeners on each one of the 100 grid cells
Game.prototype.shootListener = function(e) {
	var self = e.target.self;
	// Extract coordinates from event listener
	var x = parseInt(e.target.getAttribute('data-x'), 10);
	var y = parseInt(e.target.getAttribute('data-y'), 10);
	var result = null;
	if (self.readyToPlay) {
		result = self.shoot(x, y, CONST.COMPUTER_PLAYER);
	}

	if (result !== null && !Game.gameOver) {
		Game.stats.incrementShots();
		if (result === CONST.TYPE_HIT) {
			Game.stats.hitShot();
		}
		// The AI shoots iff the player clicks on a cell that he/she hasn't
		// already clicked on yet
		self.robot.shoot();
	} else {
		Game.gameOver = false;
	}
};

}


})


