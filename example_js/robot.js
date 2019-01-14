import {BCAbstractRobot, SPECS} from 'battlecode';

// signals
// 1000: mine location
// 1001: target ping
// 1111: needs more space

// castletalk parsing
// 11111111: maincastle requesting enemy castle x pos
// 11111110: requesting enemy castle y pos 

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
        this.num_castles = 1
        this.opposite_castle = []
        this.nearest_enemy_castle = null
        this.enemy_castles = {}
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
                    if (cur_path.length == 1){
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
                    else if (this.in_bounds(newx, newy) && this.map[newy][newx]){
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
        this.log("my turn "+step)
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
            var blocking = false
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
                    return this.attack(enemy_unit[0]-this.me.x, enemy_unit[1]-this.me.y)
                }
                if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
                    castle_coords = [units[i].x, units[i].y]     
                }
                if (this.isRadioing(units[i])){
                    if (units[i].signal.toString(2).slice(0,4) == "1111"){
                        blocking = true
                    }
                    if (units[i].signal.toString(2).slice(0,4) == "1101"){
                        this.attack_signalled = true
                        this.signal(parseInt("1101000000000000", 2), 4)
                    }
                }
            }

            if (this.attack_signalled){
                this.log(this.me.unit+" attacking")
                var closest_d = 1000
                var path_to_enemy_castle = []
                if (this.enemy_castles.length >= 1){
                    for (var i in this.enemy_castles){
                        var path = this.bfs(this.me.x, this.me.y, this.enemy_castles[i][0], this.enemy_castles[i][1])
                        if (path != null && path.length < closest_d){
                            closest_d = path.length
                            this.nearest_enemy_castle = this.enemy_castles[i]
                            path_to_enemy_castle = path
                        }
                    }
                }
                if (path_to_enemy_castle.length > 0){
                    return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
                }
                return
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
                    if (path != null && path.length < closest_d){
                        closest_d = path.length
                        this.nearest_enemy_castle = this.enemy_castles[i]
                        path_to_enemy_castle = path
                    }
                }
            }


            // no adjacent to prevent splash
            if (blocking || (castle_coords != null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords))){
                if (path_to_enemy_castle.length > 0){
                    return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
                } else {
                    this.signal(parseInt("1111000000000000", 2), 4)
                }
            }
            // make sure you're not on a karb
            if (this.karbonite_map[this.me.y][this.me.x]){
                if (path_to_enemy_castle.length == 0){
                    var move = this.find_free_adjacent_tile(this.me.x, this.me.y)
                    return this.move(...move)
                }
                return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
            }
            // prevent traffic jams
            //var cross = [[1,0],[0,1],[-1,0],[0,-1]]
            //var visible_bots = this.getVisibleRobotMap()
            //for (i in cross){
            //    if (visible_bots[this.me.y+cross[i][1]][this.me.x+cross[i][0]]>0){
            //        return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
            //    }
            //}
        }
        if (this.me.unit === SPECS.PROPHET){
            // find the nearest allied castle
            var blocking = false
            var units = this.getVisibleRobots()
            var pilgrim_coords = null
            var castle_coords = null
            for (var i in units){
                if (units[i].team != this.me.team){
                    var enemy_unit = [units[i].x, units[i].y]
                    return this.attack(enemy_unit[0]-this.me.x, enemy_unit[1]-this.me.y)
                }
                if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
                    castle_coords = [units[i].x, units[i].y]     
                }
                if (this.isRadioing(units[i])){
                    if (units[i].signal.toString(2).slice(0,4) == "1111"){
                        blocking = true
                    }
                }
                if (units[i].signal.toString(2).slice(0,4) == "1101"){
                    this.attack_signalled = true
                    this.signal(parseInt("1101000000000000", 2), 4)
                }
            }

            if (this.attack_signalled){
                this.log(this.me.unit+" attacking")
                var closest_d = 1000
                var path_to_enemy_castle = []
                if (this.enemy_castles.length >= 1){
                    for (var i in this.enemy_castles){
                        var path = this.bfs(this.me.x, this.me.y, this.enemy_castles[i][0], this.enemy_castles[i][1])
                        if (path != null && path.length < closest_d){
                            closest_d = path.length
                            this.nearest_enemy_castle = this.enemy_castles[i]
                            path_to_enemy_castle = path
                        }
                    }
                }
                if (path_to_enemy_castle.length > 0){
                    return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
                }
                return
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
                    if (path != null && path.length < closest_d){
                        closest_d = path.length
                        this.nearest_enemy_castle = this.enemy_castles[i]
                        path_to_enemy_castle = path
                    }
                }
            } 
            // no adjacent to prevent splash
            if (blocking || (castle_coords != null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords))){
                if (path_to_enemy_castle.length > 0){
                    return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
                } else {
                    this.signal(parseInt("1111000000000000", 2), 4)
                }
            }

            // make sure you're not on a karb
            if (this.karbonite_map[this.me.y][this.me.x]){
                if (path_to_enemy_castle.length == 0){
                    var move = this.find_free_adjacent_tile(this.me.x, this.me.y)
                    return this.move(...move)
                }
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
                    this.signal(parseInt("1111000000000000", 2), 4)
                }
            }
        }

        if (this.me.unit === SPECS.CASTLE) {
            if (step == 0){
                this.sym = find_sym(this.map)                
                //var x_start = 0
                //var x_bound = this.W -1
                //var y_start = 0
                //var y_bound = this.H -1
                //if (this.sym == 'x'){
                //    y_bound = Math.floor(this.H*0.5) + this.H%2
                //    if (this.me.y <= y_bound){
                //        y_start = 0
                //    } else{
                //        y_start = y_bound
                //        y_bound = this.H -1
                //    }
                //} else {
                //    x_bound = Math.floor(this.W*0.5) + this.W%2
                //    if (this.me.x <= x_bound){
                //        x_start = 0
                //    } else{
                //        x_start = x_bound
                //        x_bound = this.W -1
                //    }
                //}
                var best_dist = 1000
                //for (var i = Math.max(x_start, this.me.x-6); i <= Math.min(x_bound, this.me.x+6); i++){
                //    for (var j = Math.max(y_start, this.me.y-6); j <= Math.min(y_bound, this.me.y+6); j++){
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

                if (i_am_last && i_am_best){
                    this.maincastle = true
                    this.castleTalk(255)
                    this.log("requested xs here")
                    this.requesting_xs = true
                }
            }

            else if (step == 1){
                var units = this.getVisibleRobots()
                if (this.maincastle == null){
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
                    for (var i in units){
                        // if the Xs were requested, broadcast it
                        if (units[i].castle_talk == 255 && !this.is_self(units[i])){
                            // +1 one since impossible to distinguish not broadcasting
                            // from a broadcast of 0
                            this.log("broadcast x")
                            this.castleTalk(this.opposite_castle[0]+1)
                        }
                    }
                }
                ///* PATH TESTING
                if (this.maincastle){
                    // if you already requested xs last turn, they should be available now
                    if (this.requesting_xs && !this.received_xs){
                        for (var i in units){
                            if (units[i].castle_talk > 0 && !this.is_self(units[i])){
                                this.enemy_castles[units[i].id] = units[i].castle_talk-1
                            }
                        }
                        this.received_xs = true
                        // request the Ys
                        this.requesting_ys = true
                        this.castleTalk(254)
                    } else if (!this.received_xs){
                        // request the enemy castle xs
                        this.log("requested xs there")
                        this.requesting_xs = true
                        this.castleTalk(255)
                    }

                    // it's impossible to have requested the Ys at this time

                    this.num_pilgrims ++;
                    var karb_x_bin = this.nearest_karb[0].toString(2)
                    var karb_y_bin = this.nearest_karb[1].toString(2)
                    var zeros = ""
                    if (karb_x_bin.length < 6){
                        for (var i = 0; i < 6-karb_x_bin.length; i++){
                            zeros = zeros + "0"
                        }
                    }
                    karb_x_bin = zeros + karb_x_bin

                    var zeros = ""
                    if (karb_y_bin.length < 6){
                        for (var i = 0; i < 6-karb_y_bin.length; i++){
                            zeros = zeros + "0"
                        }
                    }
                    karb_y_bin = zeros + karb_y_bin

                    var message = "1000"+karb_x_bin+karb_y_bin
                    this.signal(parseInt(message, 2), 2)
                    // request the other enemy castle xs
                    // find free tile to build preacher
                    return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                }
                return
            } 

            else if (step == 2){
                var units = this.getVisibleRobots()
                if (this.maincastle){
                    // check the enemy castle Xs
                    if (this.requesting_xs && !this.received_xs){
                        for (var i in units){
                            if (units[i].castle_talk > 0 && !this.is_self(units[i])){
                                this.enemy_castles[units[i].id] = [units[i].castle_talk-1, 0]
                            }
                        }
                        this.received_xs = true
                        // request the Ys
                        this.requesting_ys = true
                        this.castleTalk(254)
                    } else if (!this.received_xs){
                        // request the enemy castle xs
                        this.requesting_xs = true
                        this.castleTalk(255)

                    // if you have already received xs that means you requested Ys
                    // last turn, so they should be available now
                    } else if (this.received_xs && this.requesting_ys && !this.received_ys){
                        for (var i in units){
                            if (units[i].unit == SPECS.CASTLE){
                                this.enemy_castles[units[i].id][1] = units[i].castle_talk - 1
                            }
                        }
                        this.received_ys = true
                    }


                    this.num_preachers ++
                    return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                } else {
                    for (var i in units){ // if the Xs were requested, broadcast it
                        if (units[i].castle_talk == 255){
                            this.log("gotta broadcast x")
                            this.castleTalk(this.opposite_castle[0])
                        }
                        if (units[i].castle_talk == 254){
                            this.log("gotta broadcast y1")
                            this.castleTalk(this.opposite_castle[1])
                        }
                    }
                }
            }

            else if (step == 3){
                var units = this.getVisibleRobots()
                if (this.maincastle){
                    // check the enemy castle Xs
                    if (this.requesting_xs && !this.received_xs){
                        for (var i in units){
                            if (units[i].castle_talk > 0 && !this.is_self(units[i])){
                                this.enemy_castles[units[i].castle_talk] = [units[i].castle_talk, 0]
                            }
                        }
                        this.received_xs = true
                        // request the Ys
                        this.requesting_ys = true
                        this.castleTalk(254)
                    } else if (!this.received_xs){
                        // request the enemy castle xs
                        this.requesting_xs = true
                        this.castleTalk(255)
                    }

                    if (this.received_xs && this.requesting_ys && !this.received_ys){
                        for (var i in units){
                            if (units[i].castle_talk > 0 && !this.is_self(units[i])){
                                this.enemy_castles[units[i].id][1] = units[i].castle_talk
                            }
                        }
                        this.received_ys = true
                    }
                    this.log(this.enemy_castles)
                    this.num_preachers ++
                    return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                } else {
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
            else if (step > 3){
                return
                this.log(this.enemy_castles)
            }
            else if (step == 4){
                if (this.maincastle){
                    this.num_preachers ++
                    return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                } else {
                    // only Ys are being requested now
                    for (var i in units){ 
                        if (units[i].unit == SPECS.CASTLE){
                            if (units[i].castle_talk == 254){
                                this.castleTalk(this.opposite_castle[1])
                            }
                        }
                    }
                }
            }
            else {
                if (!this.maincastle){
                    return
                }
                this.log(this.num_prophets)
                if (this.num_prophets == 3 && !this.attack_signalled){
                    // attack signal
                    this.attack_signalled = true
                    this.signal(parseInt("1101000000000000", 2), 9)
                }
                if (this.karbonite >= 25){
                    this.num_prophets ++
                    return this.buildUnit(SPECS.PROPHET, ...this.find_free_adjacent_tile(this.me.x, this.me.y));

                }
                if (this.num_pilgrims < 1){
                    if (this.karbonite < 10){
                        return
                    }
                    this.num_pilgrims ++
                    var karb_x_bin = this.nearest_karb[0].toString(2)
                    var karb_y_bin = this.nearest_karb[1].toString(2)
                    var zeros = ""
                    if (karb_x_bin.length < 6){
                        for (var i = 0; i < 6-karb_x_bin.length; i++){
                            zeros = zeros + "0"
                        }
                    }
                    karb_x_bin = zeros + karb_x_bin

                    var zeros = ""
                    if (karb_y_bin.length < 6){
                        for (var i = 0; i < 6-karb_y_bin.length; i++){
                            zeros = zeros + "0"
                        }
                    }
                    karb_y_bin = zeros + karb_y_bin

                    var message = "1000"+karb_x_bin+karb_y_bin
                    this.signal(parseInt(message, 2), 2)
                    return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                }
            }
            return
        }
    }
    is_adjacent(x1, y1, x2, y2){
        return ((Math.abs(x1-x2) < 2) && (Math.abs(y1-y2) < 2))
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
