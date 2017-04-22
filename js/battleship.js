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
})