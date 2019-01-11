import {BCAbstractRobot, SPECS} from 'battlecode';

// single castle seed: 983275

var built = false;
var step = -1;

class MyRobot extends BCAbstractRobot {
    constructor(){
        super();
        this.num_preachers = 0;
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,+0],          [+1,+0],
                             [-1,+1], [+0,+1], [+1,+1]]
        this.used_map = null
        this.W = null
        this.H = null
        this.sym = null
        this.maincastle = null
        this.num_castles = 1
        this.opposite_castle = []
        this.nearest_enemy_castle = null
        this.enemy_castles = []
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

        if (this.me.unit === SPECS.PREACHER){
            // find the nearest allied castle
            var units = attack_priority(this.getVisibleRobots())
            var castle_coords = null
            for (var i in units){
                if (units[i].team != this.me.team){
                    var enemy_unit = [units[i].x, units[i].y]
                    var atk = [[0,0]]
                    atk.push(this.mvmt_choices.slice())
                    var friendly_fire = false
                    for (var a in atk){
                        for (var j in units){
                            if (units[j].team == this.me.team && this.is_adjacent(...enemy_unit, units[j].x, units[j].y)){
                                friendly_fire = true
                                break
                            }
                        }
                        if (!friendly_fire){
                            enemy_unit = [enemy_unit[0] + atk[a][0], enemy_unit[1] + atk[a][1]]
                            break
                        }
                    }
                    this.log ("NOW ATTACKING: " + (enemy_unit[0]-this.me.x) + " " + (enemy_unit[1]-this.me.y))
                    return this.attack(enemy_unit[0]-this.me.x, enemy_unit[1]-this.me.y)
                }
                if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
                    castle_coords = [units[i].x, units[i].y]     
                }
            }

            // start populating the enemy castle list
            if (this.enemy_castles.length == 0){
                this.sym = find_sym(this.map)
                var mirror_coord = this.me.y 
                if (this.sym == 'y'){
                    mirror_coord = this.me.x
                }
                mirror_coord = (this.H - this.H%2)-mirror_coord + ((this.H%2) - 1)
                if (this.sym == 'y'){
                    this.nearest_enemy_castle = [mirror_coord, this.me.y]
                } else {
                    this.nearest_enemy_castle = [this.me.x, mirror_coord]
                }
                this.enemy_castles.push(this.nearest_enemy_castle)
            }

            // find the closest enemy castle
            var closest_d = 1000
            var path_to_enemy_castle = []
            if (this.enemy_castles.length >= 1){
                for (var i in this.enemy_castles){
                    //this.log("ENEMY CASTLE AT: " + this.enemy_castles[i])
                    var path = this.bfs(this.me.x, this.me.y, this.enemy_castles[i][0], this.enemy_castles[i][1])
                    //this.log("THIS IS MY PATH: " + path)
                    if (path !== null && path.length < closest_d){
                        closest_d = path.length
                        this.nearest_enemy_castle = this.enemy_castles[i]
                        path_to_enemy_castle = path
                    } else if (path == null) {
                        //DO THIS AFTER ENEMY CASTLES CONTAINS MULTIPLE CASTLE LOCATIONS
                        //enemy_castles = enemy_castles.slice(1,enemy_castles.length)
                    }
                }
            } 
            // can the nearest allied castle still spawn units?
            //if (castle_coords != null && this.find_free_adjacent_tile(...castle_coords) == null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords)){
            // move to enemy castle

            if(path!== null){
                //this.log ("I AM MOVING THIS MUCH: " +  (path_to_enemy_castle[0][0] - this.me.x) + " " + (path_to_enemy_castle[0][1] - this.me.y))
                return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
            } else {
                //this.log("NOT MOVING BC KILLED CASTLE ALREADY")
            }
    
            //}
        }
        if (this.me.unit === SPECS.PROPHET){
            // find the nearest allied castle
            var units = this.getVisibleRobots()
            var castle_coords = null
            for (var i in units){
                if (units[i].team != this.me.team){
                    var enemy_unit = [units[i].x, units[i].y]
                    var atk = [[0,0]]
                    atk.push(this.mvmt_choices.slice())
                    var friendly_fire = false
                    for (var a in atk){
                        for (var j in units){
                            if (units[j].team == this.me.team && this.is_adjacent(...enemy_unit, units[j].x, units[j].y)){
                                friendly_fire = true
                                break
                            }
                        }
                        if (!friendly_fire){
                            enemy_unit = [enemy_unit[0] + atk[a][0], enemy_unit[1] + atk[a][1]]
                            break
                        }
                    }
                    return this.attack(enemy_unit[0]-this.x, enemy_unit[1]-this.y)
                }
                if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
                    castle_coords = [units[i].x, units[i].y]     
                }
            }

            // start populating the enemy castle list
            if (this.enemy_castles.length == 0){
                this.sym = find_sym(this.map)
                var mirror_coord = this.me.y 
                if (this.sym == 'y'){
                    mirror_coord = this.me.x
                }
                mirror_coord = (this.H - this.H%2)-mirror_coord + ((this.H%2) - 1)
                if (this.sym == 'y'){
                    this.nearest_enemy_castle = [mirror_coord, this.me.y]
                } else {
                    this.nearest_enemy_castle = [this.me.x, mirror_coord]
                }
                this.enemy_castles.push(this.nearest_enemy_castle)
            }

            // find the closest enemy castle
            var closest_d = 1000
            var path_to_enemy_castle = []
            if (this.enemy_castles.length >= 1){
                for (var i in this.enemy_castles){
                    var path = this.bfs(this.me.x, this.me.y, this.enemy_castles[i][0], this.enemy_castles[i][1])
                    if (path.length < closest_d){
                        closest_d = path.length
                        this.nearest_enemy_castle = this.enemy_castles[i]
                        path_to_enemy_castle = path
                    }
                }
            } 
            // can the nearest allied castle still spawn units?
            if (castle_coords != null && this.find_free_adjacent_tile(...castle_coords) == null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords)){
                // if not, get the fuck out of the way
                return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
            }
        }
        if (this.me.unit === SPECS.PILGRIM){
            //// PATH TEST
            ////var path = this.bfs(this.me.x, this.me.y, 32, 38, true) // 118
            ////var path = this.bfs(this.me.x, this.me.y, 33, 50, true) // 1001
            //var path = this.bfs(this.me.x, this.me.y, 3, 44, true) // 183
            //if (path != null){
            //    return this.move(path[0][0] - this.me.x, path[0][1] - this.me.y)
            //}
            //return
            // PATH TEST
            var units = this.getVisibleRobots()
            if (this.nearest_karb == null){
                for (var i in units){
                    if (units[i].unit == SPECS.CASTLE && units[i].signal_radius > 0){
                        this.nearest_allied_castle = [units[i].x, units[i].y]
                        var parsestring = units[i].signal.toString(2)
                        if (parsestring.slice(0,4) == "1000"){
                            var kx = parsestring.slice(4,10)
                            var ky = parsestring.slice(10,16)
                            this.nearest_karb = [parseInt(kx,2), parseInt(ky,2)]
                        }
                    }
                }
            }

            if (this.me.karbonite < 20){
                if (this.karbonite_map[this.me.y][this.me.x]){
                    return this.mine()
                }
                var path = this.bfs(this.me.x, this.me.y, ...this.nearest_karb, true)
                if (path != null){
                    if(this.traversable(...path[0], this.getVisibleRobotMap())){
                        return this.move(path[0][0]-this.me.x, path[0][1]-this.me.y)
                    }
                }
            }

            var to_castle = this.bfs(this.me.x, this.me.y, ...this.nearest_allied_castle, true)
            if (this.me.karbonite == 20){
                if (this.is_adjacent(this.me.x, this.me.y, ...this.nearest_allied_castle)){
                    return this.give(this.nearest_allied_castle[0]-this.me.x, this.nearest_allied_castle[1]-this.me.y, 20, 0)
                }
                else {
                    if (to_castle != null){
                        return this.move(to_castle[0][0]-this.me.x, to_castle[0][1]-this.me.y)
                    }
                }
            }
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
                for (var i = x_start; i <= x_bound; i++){
                    for (var j = y_start; j <= y_bound; j++){
                        if (this.karbonite_map[j][i]){
                            var l = this.bfs(this.me.x, this.me.y, i, j).length
                            if (l != null && l < best_dist){
                                best_dist = l
                            }
                        }
                    }
                }
                this.castleTalk(Math.min(255, best_dist))
                this.num_castles = this.getVisibleRobots().length

                // find corresponding enemy castle
                var mirror_coord = this.me.y 
                if (this.sym == 'y'){
                    mirror_coord = this.me.x
                }
                mirror_coord = (this.H - this.H%2)-mirror_coord + ((this.H%2) - 1)
                if (this.sym == 'y'){
                    this.opposite_castle = [mirror_coord, this.me.y]
                } else {
                    this.opposite_castle = [this.me.x, mirror_coord]
                }

                // check if other castles have published
                var units = this.getVisibleRobots()
                var i_am_last = true
                var i_am_best = true
                for (var i in units){
                    if (units[i].id != this.me.id){
                        if (units[i].castle_talk == 0){
                            i_am_last = false
                        } else if (units[i].castle_talk <= best_dist) {
                            i_am_best = false
                            this.maincastle = false
                        }                
                    }
                }
                //this.log(i_am_last)
                //this.log(i_am_best)

                if (i_am_last && i_am_best){
                    this.maincastle = true
                }
            }

            else if (step == 1){
                if (this.maincastle == null){
                    var units = this.getVisibleRobots()
                    if (units.length > this.num_castles){
                        this.maincastle = false
                    }

                    for (var i in units){
                        if (units[i].castle_talk < this.me.castle_talk && units[i].id != this.me.id) {
                            this.maincastle = false
                        }
                    }

                    if (this.maincastle == null){
                        this.maincastle = true
                    }
                }
                if (!this.maincastle){
                    this.castleTalk(255)
                }
                if (this.maincastle){
                    if (this.num_preachers < 1 && this.maincastle){
                        this.num_preachers ++;
                        // find free tile to build preacher
                        this.log("built preacher")
                        return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                    } else if (this.num_pilgrims < 1 && this.maincastle) {
                        this.log("built pilgrim")
                        return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                    }
                }
                return
            }
            else {
                if (this.maincastle){
                    this.num_preachers ++
                    return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                }
            }
            //else {
                // find path length to carbonite, build that many (max 4) pilgrims
            //}
            return
        }
    }
    is_adjacent(x1, y1, x2, y2){
        return Math.abs(x1-x2) < 2 && Math.abs(y1-y2) < 2
    }

    find_free_adjacent_tile(x, y){
        for (var i in this.random_ordering(this.mvmt_choices)){
            var choice = this.mvmt_choices[i];
            var x = this.me.x + choice[0];
            var y = this.me.y + choice[1];
            if (this.traversable(x, y, this.getVisibleRobotMap())){
                return choice
            }
        }
        return null
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


function attack_priority(visible_bots, order = [0, 1, 5, 4, 3, 2]){
    /*
        args: a list of visible robots, optional: priority order
        returns: a list of visible robots in priority order

        ***notes
        default priority order is castle, church, preacher, prophet, crusader, pilgrim
        */
    var priority_list = []
    for (var i = 0; i < order.length; i++) {
        for (var x = 0; x < visible_bots.length; x++){
            if (visible_bots[x].unit == order[i]) {
                priority_list.push(visible_bots[x])
            }
        }
    }
    return priority_list
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