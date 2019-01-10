import {BCAbstractRobot, SPECS} from 'battlecode';

// single castle seed: 983275

var built = false;
var step = -1;

class MyRobot extends BCAbstractRobot {
    constructor(){
        super();
        this.num_pilgrims = 0;
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,+0],          [+1,+0],
                             [-1,+1], [+0,+1], [+1,+1]]
        this.used_map = null
        this.W = null
        this.H = null
        this.sym = null
        this.first_castle = true
    }

    in_bounds(x, y) {
        // check if a tile is in bounds
        return (x >= 0 && x < this.W && y >= 0 && y < this.H)
    }


    traversable(x, y, visible_robot_map) {
        // check if a square is in bounds, not terrain, and not occupied
        return (this.in_bounds(x, y) && this.map[y][x] && visible_robot_map[y][x] <= 0)
    }

    random_ordering(inp_array){
        var array = inp_array.slice()
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }


    bfs(startx, starty, x, y) {
        /*
        args: a start location startx starty, in a goal x and y
        returns: a list of waypoints, with index 0 being the next point to go

        ***notes
        traffic-jam behavior: if the way to the goal, or the goal itself, is
        blocked by another robot, this robot will stop
        */

        if (x == startx && y == starty){
            return null
        }

        var paths = [[[startx, starty]]]

        if (this.used_map == null) {
            this.used_map = []
            for (var i = 0; i < this.H; i++){
                this.used_map[i] = []
                for (var j = 0; j<  this.W; j++){
                    this.used_map[i][j] = false
                }
            }
        }

        for (var j in this.used_map){
            for (var i in this.used_map[0]){
                this.used_map[j][i] = false
            }
        }

        this.used_map[starty][startx] = true
        var visible_robot_map = this.getVisibleRobotMap()

        while (paths.length > 0){
            var new_paths = []
            while (paths.length > 0){
                var cur_path = paths.shift()  // get the path in the beginning
                var choices = this.random_ordering(this.mvmt_choices)
                for (var i in choices){
                    var newx = cur_path[cur_path.length-1][0] + choices[i][0]
                    var newy = cur_path[cur_path.length-1][1] + choices[i][1]
                    if (this.traversable(newx, newy, visible_robot_map)){
                        if (!this.used_map[newy][newx]){
                            this.used_map[newy][newx] = true
                            var newpath = cur_path.slice(0, cur_path.length)
                            newpath.push([newx, newy])
                            if (newx == x && newy == y) {
                                return newpath.slice(1)
                            }
                            new_paths.push(newpath)
                        }
                    }
                }
            }
            if (new_paths.length > 0) {
                paths = new_paths.slice()
            }
        }
        return null
    }

    turn() {
        step++;
        if (this.H == null){
            this.H = this.map.length
        }
        if (this.W == null){
            this.W = this.map[0].length;
        }

        if (this.sym == null){
            find_sym(this.map)
        }

        if (this.me.unit === SPECS.PILGRIM){
            // find corresponding castle
            //var nearby_units = this.getVisibleRobots()
            //for (var i in nearby_units){
            //    if (nearby_units[i].unit == SPEC.CASTLE) {
            //        var castlex = nearby_units[i].x
            //        var castley = nearby_units[i].y
            //        var otherx = 0
            //        var othery = 0
            //        if (this.sym == 'x'){
            //            
            //        }
            //    }
            //}

            var path = this.bfs(this.me.x, this.me.y, this.W-1, this.H-1)
            if (path != null){
                return this.move(path[0][0]-this.me.x, path[0][1]-this.me.y)
            }
            // move toward nearest fuel
            // mine
            // move toward nearest castle/church
            // deposit

            // move toward nearest karbonite
            // mine
            // move to castle/church
            // deposit
        }

        // find nearest fuel
        if (this.me.unit === SPECS.CASTLE) {
            if (step == 0){
                this.sym = find_sym(this.map)                
                var x_start = 0
                var x_bound = this.W -1
                var y_start = 0
                var y_bound = this.H -1
                if (this.sym == 'x'){
                    y_bound = Math.floor(this.H*0.5) + this.H%2
                    if (this.me.y <= y_bound){
                        y_start = 0
                    } else{
                        y_start = y_bound
                        y_bound = this.H -1
                    }
                } else {
                    x_bound = Math.floor(this.W*0.5) + this.W%2
                    if (this.me.x <= x_bound){
                        x_start = 0
                    } else{
                        x_start = x_bound
                        x_bound = this.W -1
                    }
                }
                var best_dist = 1000
                var best_path = []
                for (var i = x_start; i <= x_bound; i++){
                    for (var j = y_start; j <= y_bound; j++){
                        if (this.fuel_map[j][i]){
                            var l = this.bfs(this.me.x, this.me.y, i, j)
                            if (l.length < best_dist){
                                best_dist = l.length
                                best_path = l.slice()
                            }
                        }
                    }
                }
                this.castleTalk(Math.min(255, best_dist))
            }
            return
            if (step == 0 && this.getVisibleRobots().length > 3){
                this.first_castle = false
            }
            if (this.num_pilgrims < 1 && this.first_castle){
                var units = this.getVisibleRobots()
                for (var unit in units){
                    this.log(units[unit])
                    if (units[unit].unit === SPECS.CASTLE){
                        this.log("castle at " + (units[unit].x) + " ," + (units[unit].y))
                    }
                }
                this.num_pilgrims ++;
                // find free tile to build pilgrim
                for (var i in this.mvmt_choices){
                    var choice = this.mvmt_choices[i];
                    var x = this.me.x + choice[0];
                    var y = this.me.y + choice[1];
                    if (x < this.W && y < this.H){
                        if (this.map[y][x]){
                            this.log("Build PILGRIM at " + (x) + ", " + (y));
                            return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);
                        }
                    }
                }
            }
       }
    }
}

function find_sym(map){
    for (var i = 0; i < map.length; i++){
      for (var j = 0; j < map.length; j++){
        var ii = map.length - 1 - i
        if (map[i][j] !== map[ii][j]){
          return 'y'
        }
      }
    }
    return 'x'
 }

var robot = new MyRobot();

/*
round 0
ALL CASTLES
- castletalk nearest fuel bfs path dist
- count the castles

round 1
ALL CASTLES
- if there is a castle with closer fuel:
- set MAINCASTLE false
- find location of corresponding enemy castle
- castletalk enemy castle X 

- else if visibleunits.length > number of castles recorded last turn:
- set MAINCASTLE false
- find location of corresponding enemy castle
- castletalk enemy castle X 

- else
- set MAINCASTLE true
- build pilgrim

PILGRIM1:
- calculate enemy castle 0 based on nearest visible allied castle
- move toward enemy castle 0

turn 2
OTHERCASTLES:
- castletalk(enemy castle Y)

MAINCASTLE:
- read enemy castle Xs on castletalk
- build PROHET1

PILGRIM1:
- move toward enemy castle 0

PROPHET1:
- calculate enemy castle 0 based on nearest visible allied castle
- move toward enemy castle 0

turn3:
MAINCASTLE:
- read enemy castle Ys on castletalk
- calculate enemy castle positions
- broadcast enemy castle 1 position, range 1
- build PROHET2

PILGRIM1, PROPHET1:
- move toward enemycastle0

PROPHET2:
- calculate enemy castle 0 based on nearest visible allied castle
- move toward enemy castle 0

turn4:
MAINCASTLE:
- broadcast enemy castle 2 position, range 1
- build PROPHET3

PILGRIM1, PROPHET1, PROPHET2
- move toward enemycastle0

PROPHET3:
- read enemycastle1 from castle broadcast
- broadcast enemycastle1, range 3
- calculate enemycastle0 based on nearest visible allied castle
- move toward enemycastle0


PROPHET ALGO:
- calculate enemycastle0 based on visible allied castle
- listen for broadcasts, if the coord != any existing enemy castle,
    add to list of enemy castles AND broadcast that coord, range 3
- move toward allied pilgrim closest to target castle

PILGRIM1 ALGO:
- calculate enemycastle0 based on visible allied castle
- listen for broadcasts, if the coord != any existing enemy castle,
    add to list of enemy castles
- move toward enemycastle 0

PILGRIM2 ALGO:
- enemycastle 2 will be broadcast from castle on spawn, listen for it
- if its there, rebroadcast range 3
- go to nearest fuel
- mine
- go to nearest castle/church
- deposit


*/