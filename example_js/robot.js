import {BCAbstractRobot, SPECS} from 'battlecode';

// signals
// 1000: mine location

// 1001, 1010, 1011: enemy castle info ping
// 1100: require msg[1:0] enemy castle coordinate

// 1101: attack directive

// 1111: needs more space
// 

// castletalk parsing
// 255: maincastle requesting enemy castle x pos
// 254: requesting enemy castle y pos 
// 253: group reports victory, increment target castle and send next wave

var built = false;
var step = -1;

class MyRobot extends BCAbstractRobot {
    constructor(){
        super();
        this.num_preachers = 0
        this.num_pilgrims = 0
        this.num_prophets = 0
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,+0],          [+1,+0],
                             [-1,+1], [+0,+1], [+1,+1]]
        this.used_map = null
        this.W = null
        this.H = null
        this.sym = null
        this.maincastle = null
        this.num_castles = null
        this.opposite_castle = []
        this.nearest_enemy_castle = null
        this.target_castle = 0
        this.enemy_castles = {}
        this.enemy_castle_list = []
        this.tried_asking = [null, null, null]
        this.nearest_karb = null
        this.nearest_karb_d = null
        this.nearest_allied_castle = null
        this.attack_signalled = false
        this.requesting_xs = false
        this.received_xs = false
        this.requesting_ys = false
        this.received_ys = false
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


    bfs(startx, starty, x, y, ignore_goal=false) {
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
                    if (this.traversable(newx, newy, visible_robot_map) || (ignore_goal && newx==x && newy==y)){
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
            this.sym = find_sym(this.map)
        }

        if (this.me.unit === SPECS.PREACHER || this.me.unit === SPECS.PROPHET){
            if (this.enemy_castle_list.length == 0){
                this.enemy_castle_list = [[-1,-1], [-1,-1], [-1,-1]]
            }
            // find the nearest allied castle
            var blocking = false
            var units = this.getVisibleRobots()
            var castle_coords = null
            var new_castle = null

            for (var i in units){
                if (this.is_self(units[i])){
                    continue
                }
                if (units[i].team != this.me.team){
                    var enemy_unit = [units[i].x, units[i].y]
                    return this.attack(enemy_unit[0]-this.me.x, enemy_unit[1]-this.me.y)
                }
                if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
                    castle_coords = [units[i].x, units[i].y]     
                }
                if (this.isRadioing(units[i])){
                    var header = this.parse_header(units[i].signal)
                    if (!blocking && header == "1111"){
                        blocking = true
                    }
                    if (header == "1101"){
                        this.attack_signalled = true
                        this.log("attack signalled")
                        var coords = this.parse_coords(units[i].signal)
                        this.log(coords)
                        var found = false
                        for (var k in this.enemy_castle_list){
                            if (coords[0] == this.enemy_castle_list[k][0] && coords[1] == this.enemy_castle_list[k][1]){
                                this.target_castle = k
                                found = true
                                break
                            }
                        } 
                        if (!found){
                            for (var k in this.tried_asking){
                                if (this.tried_asking[k] == null || this.tried_asking[k] == false){
                                    this.tried_asking[k] = true
                                    this.enemy_castle_list[k] = coords.slice()
                                    this.target_castle = k
                                    break
                                }
                            }
                        }
                    }
                    if (header == "1100"){
                        var needed = this.parse_coords(units[i].signal)[1]
                        if (this.tried_asking[needed]){
                            this.signal_encode((needed+9).toString(2), ...this.enemy_castle_list[needed], 9)
                        }
                    }
                    if (header == "1001" || header == "1010" || header == "1011"){
                        // this means we have a new target
                        var coords = this.parse_coords(units[i].signal)
                        var new_target = true
                        for (var j in this.enemy_castle_list){
                            if (this.enemy_castle_list[j][0] == coords[0] && this.enemy_castle_list[j][1] == coords[1]){
                                new_target = false
                                break
                            }
                        }
                        if (new_target){
                            new_castle = units[i].signal
                            this.enemy_castle_list[parseInt(header, 2)-9] = coords.slice()
                            this.tried_asking[parseInt(header, 2)-9] = true
                        }
                    }
                }
            }

            var signalled = false

            if (this.attack_signalled){
                if (!this.attack_signalled){
                    this.signal_encode("1101", ...this.enemy_castle_list[this.target_castle], 4)
                }
                signalled = true
            } else if (new_castle != null){
                this.signal(new_castle, 9)
                signalled = true
            } else {
                for (var i in this.tried_asking){
                    if (this.tried_asking[i] == null){
                        this.signal_encode("1100", 0, i, 9)
                        signalled = true
                        this.tried_asking[i] = false
                        break
                    }
                }
            }

            if (this.tried_asking[0] == null ||this.tried_asking[1] == null ||this.tried_asking[2] == null ){
                this.log(this.enemy_castle_list)
            }

            var path = null
            if (this.tried_asking[this.target_castle]){
                path = this.bfs(this.me.x, this.me.y, ...this.enemy_castle_list[this.target_castle], true)
            }

            if (this.attack_signalled){
                this.log(this.me.unit+" attacking")
                if (path != null){
                    return this.move(path[0][0] - this.me.x, path[0][1] - this.me.y)
                }
                return
            }



            // no adjacent to prevent splash on castle
            if (blocking || (castle_coords != null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords))){
            //if (blocking || this.is_something_else_adjacent([this.me.x, this.me.y])){
                if (path != null){
                    return this.move(path[0][0] - this.me.x, path[0][1] - this.me.y)
                } else {
                    if (! signalled){
                        this.signal(parseInt("1111000000000000", 2), 8)
                    }
                }
            }
            // make sure you're not on a karb
            if (this.karbonite_map[this.me.y][this.me.x]){
                if (path != null){
                    var move = this.find_free_adjacent_tile(this.me.x, this.me.y)
                    if (move != null){
                        return(this.move(...move))
                    }
                }
                return this.move(path[0][0] - this.me.x, path[0][1] - this.me.y)
            }
        }

        if (this.me.unit === SPECS.PILGRIM){
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
                    this.signal(parseInt("1111000000000000", 2), 4)
                }
            }
        }

        if (this.me.unit === SPECS.CASTLE) {
            var units = this.getVisibleRobots()
            if (this.maincastle){
                this.log(step)
            }
            if (step == 0){
                this.sym = find_sym(this.map)                
                var best_dist = 1000
                for (var i = Math.max(this.me.x-6, 0); i <= Math.min(this.W-1, this.me.x+6); i++){
                    for (var j = Math.max(this.me.y-6, 0); j <= Math.min(this.W-1, this.me.y+6); j++){
                        if (this.karbonite_map[j][i]){
                            var l = this.bfs(this.me.x, this.me.y, i, j)
                            if (l != null && l.length < best_dist){
                                best_dist = l.length
                                this.nearest_karb = [i,j]
                                this.nearest_karb_d = best_dist
                            }
                        }
                    }
                }

                this.castleTalk(Math.min(70, best_dist))
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
                this.log(this.opposite_castle)

                // check if other castles have published
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

                if (i_am_last && i_am_best){
                    this.maincastle = true
                    this.check_broadcasts()
                }
            }

            else if (step == 1){
                var units = this.getVisibleRobots()
                if (this.maincastle == null){
                    if (units.length > this.num_castles){
                        this.maincastle = false
                    }

                    for (var i in units){
                        if (units[i].castle_talk == 255 || (units[i].castle_talk < this.me.castle_talk && !this.is_self(units[i]))) {
                            this.maincastle = false
                        }
                    }

                    if (this.maincastle == null){
                        this.maincastle = true
                    }
                }
                this.log(this.maincastle)
            } 

            if (this.maincastle != null && this.enemy_castle_list.length == 0){
                var units = this.getVisibleRobots()
                if (this.maincastle){
                    // check the enemy castle Xs
                    this.check_broadcasts()
                } else {
                    this.check_to_broadcast()
                }
            }

            if (this.maincastle == null) return

            if (!this.maincastle) return


            if (this.num_pilgrims == 0){
                this.num_pilgrims ++
                this.signal_encode("1000", ...this.nearest_karb,2)
                return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y))
            }

            if (this.enemy_castle_list.length != 0){
                if (this.num_preachers < 3){
                    if (this.karbonite >= 30){
                        this.num_preachers ++
                        this.log("build preacher")
                        this.signal_encode(((step%this.num_castles)+9).toString(2), ...this.enemy_castle_list[step%this.num_castles], 9)
                        return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y))
                    }
                } else if (this.karbonite >= 25){
                    this.num_prophets ++
                    this.log("build_prophet")
                    if (this.num_prophets > 0 && this.num_prophets%3 == 0){
                        this.signal_encode("1101", ...this.enemy_castle_list[this.target_castle], 9)
                    } else {
                        this.signal_encode(((step%this.num_castles)+9).toString(2), ...this.enemy_castle_list[step%this.num_castles], 9)
                    }
                    return this.buildUnit(SPECS.PROPHET, ...this.find_free_adjacent_tile(this.me.x, this.me.y))
                } else {
                    for (var i in units){
                        if (this.isRadioing(units[i])){
                            var header = this.parse_header(units[i].signal)
                            if (header == "1100"){
                                var t = this.parse_coords(units[i].signal)[1]
                                if (t < this.enemy_castle_list.length){
                                    this.signal_encode((t+9).toString(2), ...this.enemy_castle_list[t],2)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    is_adjacent(x1, y1, x2, y2){
        return ((Math.abs(x1-x2) < 2) && (Math.abs(y1-y2) < 2))
    }

    is_something_else_adjacent(coords){
        var map = this.getVisibleRobotMap()
        for (var i in this.mvmt_choices){
            if (map[coords[1]+this.mvmt_choices[i][1]][coords[0]+this.mvmt_choices[i][0]]){
                return true
            }
        }
        return false
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

    is_self(r){
        return r.id == this.me.id
    }

    check_to_broadcast(){
        var units = this.getVisibleRobots()
        if (this.num_castles != 1){
            for (var i in units){ // if the Xs were requested, broadcast it
                if (units[i].castle_talk == 255){
                    this.log("gotta broadcast x")
                    this.castleTalk(this.opposite_castle[0]+1)
                }
                if (units[i].castle_talk == 254){
                    this.log("gotta broadcast y")
                    this.castleTalk(this.opposite_castle[1]+1)
                }
            }
        }
    }
    signal_encode(header, msg1, msg2, range){
        /*
        msg1, msg2 had better fucking be less than 63, or bad things will
        happen
        */
        
        var msg1_bin = msg1.toString(2)
        var zeros = ""
        if (msg1_bin.length < 6){
            for (var i = 0; i < 6-msg1_bin.length; i++){
                zeros = zeros + "0"
            }
        }
        msg1_bin = zeros + msg1_bin

        var msg2_bin = msg2.toString(2)
        var zeros = ""
        if (msg2_bin.length < 6){
            for (var i = 0; i < 6-msg2_bin.length; i++){
                zeros = zeros + "0"
            }
        }
        msg2_bin = zeros + msg2_bin

        var message = header+msg1_bin+msg2_bin
        this.signal(parseInt(message, 2), range)
    }

    parse_coords(signal){
        return [parseInt(signal.toString(2).slice(4,10),2),parseInt(signal.toString(2).slice(10,16),2)]
    }

    parse_header(signal){
        return signal.toString(2).slice(0,4)
    }

    check_broadcasts(){
        var units = this.getVisibleRobots()
        // checks other castles for broadcasted enemy castle x positions
        // request xs if not already requested
        // else update xs and request ys
        // else update ys
        if (this.requesting_xs && !this.received_xs){
            for (var i in units){
                if (units[i].castle_talk > 0 && !this.is_self(units[i])){
                    this.enemy_castles[units[i].id] = [units[i].castle_talk-1, 0]
                }
            }
            this.received_xs = true
            // request the Ys
            this.log("requested ys here")
            this.log(this.enemy_castles)
            this.requesting_ys = true
            this.castleTalk(254)
            return true
        } else if (!this.received_xs){
            // request the enemy castle xs
            this.log("requested xs there")
            this.requesting_xs = true
            this.castleTalk(255)
            return true
        } else if (this.received_xs && this.requesting_ys && !this.received_ys){
            for (var i in units){
                if (units[i].castle_talk > 0 && !this.is_self(units[i])){
                    this.enemy_castles[units[i].id][1] = units[i].castle_talk - 1
                }
            }
            this.received_ys = true
            // convert to list
            this.log(this.enemy_castles)
            this.enemy_castle_list = [this.opposite_castle.slice()].concat(Object.values(this.enemy_castles))
            this.log(this.enemy_castle_list)
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

