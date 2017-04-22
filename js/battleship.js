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


})


