// fluid.js
// Sam Engel
//
// This is the start of a simulation/animation aimed at the question:
// Can we use Monte Carlo methods to reliably fill a discretely subdivided
// space with one single, randomly-generated closed path?
// Also: How does the mode of propagation of the path affect success/failure?
// (Note: the method attempted here largely fails to complete the challenge.)
//
// Subdivides a canvas into tiles,
// randomly populates the canvas by sequentially assigning each tile a direction,
// which points to the next tile in the series (forming a linked list),
// then plays an animation of one path through the linked list in a new color.
// (Note: the animation plays after completion of the population phase.
// This may take some time.)
//
// The population stage will attempt to maintain one closed path through all
// tiles, but, when it gets stuck, will reassign or write over a tile's
// assignment.
//
// The program allows for several different kinds of path propagation.
// The world is infinite, i.e. edges loop back around like in pac-man.

// Methods of path propagation
var FollowEnum = {
	EIGHT: 1,
	FOUR: 2,
	TWO: 3,
	KNIGHT: 4
}

var sqSize = 8;
var interval = 100;
var canvas = null;
var context = null;
var defaultFill = "#FF6699";
var sim = null;
var rows = 0;
var cols = 0;
var popInt = 1;
var popTry = 32;
var popTries = 0;
var populated = 0;
var followPattern = FollowEnum.EIGHT;
var stop = false;
var pathCounters = [];
var latestPath = [];

// Fill a tile with a color.
function fill(x, y, color) {
	if(color == null) {
		color = defaultFill;
	}
	if(y+1 > rows || x+1 > cols){
		return;
	}
	context.fillStyle = color;
	context.fillRect(sqSize*x, sqSize*y, sqSize, sqSize);
	context.fillStyle = defaultFill;
}

function populateAnimation() {
	sim = new Array(cols);
	for(i = 0; i < cols; i++) {
		sim[i] = new Array(rows);
	}
	var popX = Math.floor(cols/2);
	var popY = Math.floor(rows/2);
	populate(popX, popY);
}

function populatePath(x1, y1, x2, y2, path) {
	sim = new Array(cols);
	for(i = 0; i < cols; i++) {
		sim[i] = new Array(rows);
	}

	sim[x1][y1] = getDir(x1, y1, path[0][0], path[0][1]);
	for(k = 0; k < path.length; k++) {
		var point = path[k];
		var next = [];
		if(k < path.length-1) {
			next = path[k+1];
		} else {
			// At the end, loop back to the beginning
			next = [x1, y1];
		}
		sim[point[0]][point[1]] = getDir(point[0],point[1],next[0],next[1]);
	}
	startAnimation();
}

function startAnimation() {
	var startX = Math.floor(Math.random()*cols);
	var startY = Math.floor(Math.random()*rows);
	fill(startX, startY, '#33CC33');
	animate(startX, startY, '#33CC33');
}

// Populate the tiles with directions.
function populate(x, y) {
	if(stop) {
		return;
	}
	if(sim[x][y] == null) {
		fill(x, y);
	}
	sim[x][y] = Math.floor(Math.random()*8);
	var next = follow(x, y);
	if(sim[next[0]][next[1]] != null && popTries < popTry) {
		// If the tile we want to point to is already populated,
		// i.e. we are closing a loop
		// try again, if we haven't tried too many times already.
		popTries++;
		setTimeout(function() {
			populate(x, y);
		}, popInt);
	} else {
		if(sim[next[0]][next[1]] == null) {
			populated++;
			console.log((populated)+"/"+((rows*cols)));
		} else {
			fill(next[0], next[1], "#FF0099");
		}

		if(populated < (rows*cols)-1) {
			popTries = 0;
			setTimeout(function() {
				populate(next[0], next[1]);
			}, popInt);
		} else {
			sim[next[0]][next[1]] = Math.floor(Math.random()*8);
			fill(next[0], next[1]);
			startAnimation();
		}
	}
}

// Animate a path of the linked list
function animate(x, y, color) {
	if(stop) {
		return;
	}
	var newPos = follow(x, y);
	if(newPos == null) {
		return;
	}
	var xNew = newPos[0];
	var yNew = newPos[1];
	fill(x, y,'#33BB33');
	fill(xNew, yNew, color);
	setTimeout(function() {
		animate(xNew, yNew, color);
	}, interval);
}

function longestPath(x1, y1, x2, y2, visited) {
	// Visualize
	context.clearRect(0, 0, canvas.width, canvas.height);
	fill(x1,y1,'#6600CC');
	fill(x2,y2,'#66FFFF');
	for(v = 0; v < visited.length; v++) {
		fill(visited[v][0],visited[v][1],'#800000');
	}
	fill(x1,y1,'#6600CC');

	var path = [];
	var neighbors = [];
	var paths = [];
	var dest = [x2, y2];

	// Base case -- if we visit our source
	if(x1 == x2 && y1 == y2) {
		return [];
	}

	// Base case -- if we've already visitied our dest
	if(arrayContainsArray(visited, dest)) {
		return [];
	}

	// Add our destination to the list of visited points
	var _visited = visited.slice(0);
	_visited.push(dest);

	// Get a list of neighbor coordinates starting at a random neighbor
	// and calculate/record the longest path betwen src
	// and each univisited neighbor
	var offset = Math.floor(Math.random()*8);
	pathCounters.push(0);
	var ctrs = pathCounters.length - 1;
	for(pathCounters[ctrs] = 0; pathCounters[ctrs] < 8; pathCounters[ctrs]++) {
		//console.log('before counter: ' + pathCounters[ctrs]);
		var dir = (pathCounters[ctrs] + offset) % 8;
		var neighbor = followDir(x2, y2, dir);
		if(!arrayContainsArray(neighbors, neighbor)) {
			neighbors.push(neighbor);
			//paths.push(longestPath(x1, y1, neighbor[0], neighbor[1], _visited));
			setTimeout(function() {
				longestPath(x1, y1, neighbor[0], neighbor[1], _visited);
			}, 1000);
			paths.push(latestPath);
		}
		//console.log('after counter: ' + pathCounters[ctrs]);
	}

	// Find the longest of the paths to neighbors,
	// concat dest to the path, and return.
	var ind = -1;
	var max = 0;
	if(paths.length == 0) {
		path = [];
	} else {
		for(j = 0; j < paths.length; j++) {
			if(paths[j] != null && paths[j].length > max) {
				ind = j;
			}
		}
		if(ind == -1) {
			path = [];
		} else {
			path = paths[ind].slice(0);
		}
	}
	path.push(dest);
	pathCounters.pop();
	//return path;
	latestPath = path;
}

// Follow a given tile's pointer to the next tile in the linked list.
// Returns coordinates of next tile.
function follow(x, y) {
	var dir = sim[x][y];
	return followDir(x, y, dir);
}

// Manages different follow options
// Returns coordinates of next tile.
function followDir(x, y, dir) {
	if(dir == null) {
		return null;
	}
	var next = null;
	switch(followPattern) {
		case FollowEnum.EIGHT:
			next = followEight(x, y, dir);
			break;
		case FollowEnum.FOUR:
			next = followFour(x, y, dir);
			break;
		case FollowEnum.TWO:
			next = followSE(x, y, dir);
			break;
		case FollowEnum.KNIGHT:
			next = followKnight(x, y, dir);
			break;
		default:
			next = followEight(x, y, dir);
			break;
	}
	xNew = next[0];
	yNew = next[1];
	if(mod(xNew,cols) < 0 || mod(yNew,rows) < 0) {
		console.log('huh???');
	}
	return [mod(xNew,cols), mod(yNew,rows)];
}

// Moves in eight directions.
function followEight(x, y, dir) {
	var xNew = x;
	var yNew = y;
	switch(dir) {
		// N
		case 0:
			yNew--;
			break;
		// NE
		case 1:
			yNew--;
			xNew++;
			break;
		// E
		case 2:
			xNew++;
			break;
		// SE
		case 3:
			yNew++;
			xNew++;
			break;
		// S
		case 4:
			yNew++;
			break;
		// SW
		case 5:
			yNew++;
			xNew--;
			break;
		// W
		case 6:
			xNew--;
			break;
		// NW
		case 7:
			yNew--;
			xNew--;
			break;
	}
	return [xNew, yNew];
}

// Moves like a knight on a chess board.
function followKnight(x, y, dir) {
	var xNew = x;
	var yNew = y;
	switch(dir) {
		// NNE
		case 0:
			yNew = yNew - 2;
			xNew++;
			break;
		// ENE
		case 1:
			yNew--;
			xNew = xNew + 2;
			break;
		// ESE
		case 2:
			yNew++;
			xNew = xNew + 2;
			break;
		// SSE
		case 3:
			yNew = yNew +2;
			xNew++;
			break;
		// SSW
		case 4:
			yNew = yNew + 2;
			xNew--;
			break;
		// WSW
		case 5:
			yNew++;
			xNew = xNew - 2;
			break;
		// WNW
		case 6:
			yNew--;
			xNew = xNew - 2;
			break;
		// NNW
		case 7:
			yNew = yNew - 2;
			xNew--;
			break;
	}
	return [xNew, yNew];
}

// Only moves in the four cardinal directions.
function followFour(x, y, dir) {
	var xNew = x;
	var yNew = y;
	switch(dir) {
		// N
		case 0:
		case 1:
			yNew--;
			break;
		// E
		case 2:
		case 3:
			xNew++;
			break;
		// S
		case 4:
		case 5:
			yNew++;
			break;
		// W
		case 6:
		case 7:
			xNew--;
			break;
	}
	return [xNew, yNew];
}

// Only moves south or east.
function followSE(x, y, dir) {
	var xNew = x;
	var yNew = y;
	switch(dir) {
		// S
		case 0:
		case 1:
		case 2:
		case 3:
			yNew++;
			break;
		// E
		case 4:
		case 5:
		case 6:
		case 7:
			xNew++;
			break;
	}
	return [xNew, yNew];
}

function getDir(x1, y1, x2, y2) {
	for(d = 0; d < 8; d++) {
		var testPt = followDir(x1, y1, d);
		if(testPt[0] == x2 && testPt[1] == y2) {
			return d;
		}
	}
	console.log('There was an error getting dir: ');
	console.log('x1: ' + x1);
	console.log('y1: ' + y1);
	console.log('x2: ' + x2);
	console.log('y1: ' + y2);
	return null;
}

function restart(pattern) {
	stop = true;
	populated = 0;
	sim = null;
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = defaultFill;
	followPattern = pattern;
	setTimeout(function() {
		stop = false;
		populateAnimation();
	}, 10*popInt);
}

function startPath() {
	stop = true;
	populated = 0;
	sim = null;
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = defaultFill;
	setTimeout(function() {
		stop = false;
		findPath();
	}, 10*popInt);
}

function findPath() {
	var visited = new Array(0);
	fill(2,2,null);
	//var path = longestPath(2,2,2,1,visited);
	longestPath(2,2,2,1,visited);
	var path = latestPath;
	console.log(path);
	populatePath(2, 2, 2, 1, path);
}

function mod(x, n) {
	return ((x%n)+n)%n;
}

function arrayContainsArray(a1, a2) {
	for(i = 0; i < a1.length; i++) {
		if(compareArrays(a1[i], a2)) {
			return true;
		}
	}
	return false;
}

function compareArrays(a1, a2) {
	return (a1.length == a2.length) && a1.every(function(e, index) {
		return e === a2[index];
	});
}

function sleep(ms) {
	var currentTime = new Date().getTime();
	while(currentTime + ms >= new Date().getTime()) {
	}
}

$().ready(function() {
	console.log("hello!");
	canvas = $('#fCanvas')[0];
	context = canvas.getContext("2d");
	context.fillStyle = "#FF6699";
	defaultFill = context.fillStyle;
	rows = (canvas.height/sqSize);
	cols = (canvas.width/sqSize);
	$('#eight').click(function() {
		restart(FollowEnum.EIGHT);
	});
	$('#four').click(function() {
		restart(FollowEnum.FOUR);
	});
	$('#two').click(function() {
		restart(FollowEnum.TWO);
	});
	$('#knight').click(function() {
		restart(FollowEnum.KNIGHT);
	});
	$('#longestPath').click(function() {
		startPath();
	});
	populateAnimation();
});
