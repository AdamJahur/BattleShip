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

// Creates click event listeners on each of the ship names in the roster
Game.prototype.rosterListener = function(e) {
	var self = e.target.self;
	//Remove all classes of 'placing' from the fleet roster first
	var roster = document.querySelectorAll('.fleet-roster li');
	for (var i = 0; i < roster.length; i++) {
		var classes = roster[i].getAttribute('class') || '';
		classes = classes.replace('placing', '');
		roster[i].setAttribute('class', classes);
	}

	// Set the class of the target ship to 'placing'
	Game.placeShipType = e.target.getAttribute('id');
	document.getElementById(Game.placeShipType).setAttribute('class', 'placing');
	Game.placeShipDirection = parseInt(document.getElementById('rotate-button').getAttribute('data-direction'), 10);
	self.placingOnGrid = true;
};

// Creates click event listeners on the human player's grid to handle
// ship placement after the user has selected a ship name
Game.prototype.placementListener = function(e) {
	var self = e.target.self;
	if (self.placingOnGrid) {
		//Extract coordinates from event listener
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);

		//Dont screw up direction if the user tries to place again
		var successful = self.humanFleet.placeShip(x, y, Game.placeShipDirection, Game.placeShipType);
		if (successful) {
			// Done placing the ship
			self.endPlacing(Game.placeShipType);
		

			self.placingOnGrid = false;
			if (self.areAllShipsPlaced()) {
				var el = document.getElementById('rotate-button');
				el.addEventListner(transitionEndEventName(), (function() {
					el.setAttribute('class', 'hidden');
					document.getElementById('start-game').removeAttribute('class');
				}),false);
				el.setAttribute('class', 'invisible');
			}
		}
	}
};
// Creates mouseover event listeners that handles mouseover on the
// human player's grid to draw a phantom ship implying that the user
// is allowed to place a ship there
Game.prototype.placementMouseover = function(e) {
	var self = e.target.self;
	if (self.placingOnGrid) {
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);
		var classes;
		var fleetRoster = self.humanFleet.fleetRoster;

		for (var i = 0; i < fleetRoster.length; i++) {
			var shipType = fleetRoster[i].type;

			if (Game.placeShipType === shipType &&
				fleetRoster[i].isLegal(x, y, Game.placeShipDirection)) {
				// Virtual Ship
				fleetRoster[i].create(x, y, Game.placeShipDirection, true);
				Game.placeShipCoords = fleetRoster[i].getAllShipCells();

				for (var j = 0; j < Game.placeShipCoords.length; j++) {
					var el = document.querySelector('.grid-cell-' + Game.placeShipCoords[j].x + '-' + Game.placeShipCoords[j].y);
					classes = el.getAttribute('class');
					// Check if the substring ' grid-ship' already exists to avoid adding it twice
					if (classes.indexOf('grid-ship') < 0) {
						classes += ' grid-ship';
						el.setAttribute('class', classes);
					}
				}
			}
		}
	}
};

// Creates mouseout event listeners that un-draws the phantom ship
// on the human player's grid as the user hovers over a different cell
Game.prototype.placementMouseout = function(e) {
	var self = e.target.self;
	if (self.placingOnGrid) {
		for (var j = 0; j < Game.placeShipCoords.length; j++) {
			var el = document.querySelector('.grid-cell-' + Game.placeShipCoords[j].x + '-' + Game.placeShipCoords[j].y);
			classes = el.getAttribute('class');
			// Check if the substring ' grid-ship' already exists to avoid adding it twice
			if (classes.indexOf(' grid-ship') > -1) {
				classes = classes.replace(' grid-ship', '');
				el.setAttribute('class', classes);
			}
		}
	}
};

// Click handler for the Rotate Ship button
Game.prototype.toggleRotation = function(e) {
	// Toggle roatation direction
	var direction = parseInt(e.target.getAttribute('data-direction'), 10);
	if (direction === Ship.DIRECTION_VERTICAL) {
		e.target.setAttribute('data-direction', '1');
		Game.placeShipDirection = Ship.DIRECTION_HORIZONTAL;
	} else if (direction === Ship.DIRECTION_HORIZONTAL) {
		e.target.setAttribute('data-direction', '0');
		Game.placeShipDirection = Ship.DIRECTION_VERTICAL;
	}
};

// Click handler for the Start Game button
Game.prototype.startGame = function(e) {
	var self = e.target.self;
	var el = document.getElementById('roster-sidebar');
	var fn = function() {el.setAttribute('class', 'hidden');};
	el.addEventListner(transitionEndEventName(),fn,false);
	el.setAttribute('class', ' invisible');
	self.readyToPlay = true;

	el.removeEventListener(transitionEndEventName(),fn,false);
};

// Click handler for Restart Game button
Game.prototype.restartGame = function(e) {
	e.target.removeEventListener(e.type, arguments.callee);
	var self = e.target.self;
	document.getElementById('restart-sidebar').setAttribute('class', 'hidden');
	self.resetFogOfWar();
	self.init();
};

// Debugging function used to place all ships and just start
Game.prototype.placeRandomly = function(e) {
	e.target.removeEventListener(e.type, arguments.callee);
	e.target.self.humanFleet.placeShipsRandomly();
	e.target.self.readyToPlay = true;
	document.getElementById('roster-sidebar').setAttribute('class', ' hidden');
	this.setAttribute('class', 'hidden');
};

// Ends placing the current ship
Game.prototype.endPlacing = function(e) {
	document.getElementById(shipType).setAttribute('class', 'placed');

	// Mark the shipas 'used'
	Game.usedShips[CONST.AVAILABLE_SHIPS.indexOf(shipType)] = CONST.USED;

	// Wipe out the variable when you're done with it
	Game.placeShipDirection = null;
	Game.placeShipType = '';
	Game.placeShipCoords = [];
};

// Checks whether or not all ships are done placing
// Returns boolean
Game.prototype.areAllShipsPlaced = function() {
	var playerRoster = document.querySelectorAll('.fleet-roster li');
	for (var i = 0; i < playerRoster.length; i++) {
		if (playerRoster[i].getAttribute('class') === 'placed') {
			continue;
		} else {
			return false;
		}
	}
	// Reset temporary variables
	Game.placeShipDirection = null;
	Game.placeShipType = '';
	Game.placeShipCoords = [];
	return true;
};

// Resets the fog of war
Game.prototype.resetFogOfWar = function() {
	for (var i = 0; i < Game.size; i++) {
		for (var j = 0; j < Game.size; j++) {
			this.humanGrid.updateCell(i, j, 'empty', CONST.HUMAN_PLAYER);
			this.computerGrid.updateCell(i, j, 'empty', CONST.COMPUTER_PLAYER);
		}
	}
	// Reset all values to indicate the ships are ready to be placed again
	Game.usedShips = Game.usedShips.map(function(){return CONST.UNUSED;});
};

// Resets CSS styling of the sidebar
Game.prototype.resetRosterSidebar = function() {
	var els = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < els.length; i++) {
		els[i].removeAttribute('class');
	}
	document.getElementById('roster-sidebar').removeAttribute('class');
	document.getElementById('rotate-button').removeAttribute('class');
	document.getElementById('start-game').setAttribute('class', 'hidden');
};

Game.prototype.showResetSidebar = function() {
	var sidebar = document.getElementById('restart-sidebar');
	sidebar.setAttribute('class', 'highlight');

	// Deregister listeners
	var computerCells = document.querySelector('.computer-player').childNodes;
	for (var j = 0; j < computerCells.length; j++) {
		computerCells[j].removeEventListener('click', this.shootListener, false);
	}
	var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < playerRoster.length; i++) {
		playerRoster[i].removeEventListener('click', this.rosterListener, false);
	}

	var restartButton = document.getElementById('restart-game');
	restartButton.addEventListner('click', this.restartGame, false);
	restartButton.self = this;
};

// Generates the HTML divs for the grid for both players
Game.prototype.createGrid = function() {
	var gridDiv = document.querySelectorAll('.grid');
	for (var grid = 0; grid < gridDiv.length; grid++) {
		gridDiv[grid].removeChild(gridDiv[grid].querySelector('.no-js')); //Removes the no-js warning
		for (var i = 0; i < Game.size; i++) {
			for (var j = 0; j <Game.size; j++) {
				var el = document.createElement('div');
				el.setAttribute('data-x', i);
				el.setAttribute('data-y', j);
				el.setAttribute('class', 'grid-cell grid-cell-' + i + '-' + j);
				gridDiv[grid].appendChild(el);
			}
		}
	}
};

// Initializes the Game. Also resets the game if previously initialized
Game.prototype.init = function() {
	this.humanGrid = new Grid(Game.size);
	this.computerGrid = new Grid(Game.size);
	this.humanFleet = new Fleet(this.humanGrid, CONST.HUMAN_PLAYER);
	this.computerFleet = new Fleet(this.computerGrid, CONST.COMPUTER_PLAYER);

	this.robot = new AI(this);
	Game.stats = new Stats();
	Game.stats.updateStatsSidebar();

	//Reset game variables
	this.shotsTaken = 0;
	this.readyToPlay = false;
	this.placingOnGrid = false;
	Game.placeShipDirection = 0;
	Game.placeShipType = '';
	Game.placeShipCoords = [];

	this.resetRosterSidebar();

	// Add a click listener for the Grid.shoot() method for all cells
	// Only add this listener to the computer's grid
	var computerCells = document.querySelector('.computer-player').childNodes;
	for (var j = 0; j < computerCells.length; j++) {
		computerCells[j].self = this;
		computerCells[j].addEventListner('click', this.shootListener, false);
	}

	// Add a click listener to the roster
	var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < playerRoster.length; i++) {
		playerRoster[i].self = this;
		playerRoster[i].addEventListner('click', this.rosterListener, false);
	}	

	// Add a click listener to the human player's grid while placing
	var humanCells = document.querySelector('.human-player').childNodes;
	for (var k = 0; k < humanCells.length; k++) {
		humanCells[k].self = this;
		humanCells[k].addEventListner('click', this.placementListener, false);
		humanCells[k].addEventListner('mouseover', this.placementMouseover, false);
		humanCells[k].addEventListner('mouseout', this.placementMouseout, false);
	}

	var rotateButton = document.getElementById('rotate-button');
	rotateButton.addEventListner('click', this.toggleRotation, false);
	var startButton = document.getElementById('start-game');
	startButton.self = this;
	startButton.addEventListner('click', this.startGame, false);
	var resetButton = document.getElementById('reset-stats');
	resetButton.addEventListner('click', Game.stats.resetStats, false);
	var randomButton = document.getElementById('place-randomly');
	randomButton.self = this;
	randomButton.addEventListner('click', this.placeRandomly, false);
	this.computerFleet.placeShipsRandomly();
};

// Grid object
// Constructor



})


