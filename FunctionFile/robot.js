import {BCAbstractRobot, SPECS} from 'battlecode';

// 1000: mine location
// 1001: target ping
// 1111: needs more space

var built = false;
var step = -1;


// List of functions
//in_bounds(x,y) == checks if it is within the bounds of the map
//traversable(x, y, robot_map) = checks if it is within the map and robotmap location is true
//random_ordering(inp_array) = returns the list of options mixed
//bfs(startx, starty, x, y, ignore_goal=false) = bfs, if the ignore goal is true then you ignore the last tile
//initalize_coor() = initalizes the coor x and y and sym of map
//is_adjacent(x1, y1, x2, y2) = returns if the tiles are next to each other
//find_free_adjacent_tile(x, y) = returns the next free tile around x y 
//determine_bounds(x_start, x_bound, y_start, y_bound) = for the castle to find its private variables

//determine_nearest_karb(x_start, x_bound, y_start, y_bound) = straightforward
//determine_opp_location(x,y,sym) = find the opposite location

//attack_priority = takes a list of visible robots and sorts them in priority order





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
        this.enemy_castles = []
        this.nearest_karb = null
        this.nearest_karb_d = null
        this.nearest_allied_castle = null
        this.counter = 0
        this.search_range = 6
        this.flag = false
        this.steps_from_start = 3
        this.inital_pilgrims = 0
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

    determine_bounds(x_start, x_bound, y_start, y_bound){
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
    }

    determine_nearest_karb(x_start, x_bound, y_start, y_bound, best_dist){
        
                for (var i = Math.max(x_start, this.me.x-6); i <= Math.min(x_bound, this.me.x+6); i++){
                    for (var j = Math.max(y_start, this.me.y-6); j <= Math.min(y_bound, this.me.y+6); j++){
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
    }

    determine_resource_dep_amounts(map, range){
        var count = 0
        for (var i = Math.max(this.me.x- range, 0); i <= Math.min(this.W-1, this.me.x+ range); i++){
                    for (var j = Math.max(this.me.y-range, 0); j <= Math.min(this.W-1, this.me.y+range); j++){
                        if (map[j][i]){
                                count ++
                            
                        }
                    }
                }
        return count
    }

    determine_nearest_karb2(value){
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
    }

    determine_opp_castle(){
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
    }

    determine_opp_location(x,y,sym){
        
                var mirror_coord = y 
                if (this.sym == 'y'){
                    mirror_coord = x
                }
                mirror_coord = (this.H - this.H%2)-mirror_coord + ((this.H%2) - 1)
                if (this.sym == 'y'){
                    return [mirror_coord, y]
                } else {
                    return [x, mirror_coord]
                }
    }

    attack_acc_for_friendly(units, i){
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
    }

    initalize_coor(){
        if (this.H == null){
            this.H = this.map.length
        }
        if (this.W == null){
            this.W = this.map[0].length;
        }

        if (this.sym == null){
            find_sym(this.map)
        }
    }

    attack_priority(visible_bots, order = [0, 1, 5, 4, 3, 2]){
        /*
            args: a list of visible robots, optional: list of priority order
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



    turn() {
        step++;
        this.initalize_coor()

        if (this.me.unit === SPECS.PREACHER){
            // find the nearest allied castle
            var blocking = false
            var units = this.getVisibleRobots()
            var castle_coords = null
            for (var i in units){
                this.attack_acc_for_friendly(units, i);

                if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
                    castle_coords = [units[i].x, units[i].y]     
                }
                if (this.isRadioing(units[i])){
                    if (units[i].signal.toString(2).slice(0,4) == "1111"){
                        blocking = true
                    }
                }
            }

            // start populating the enemy castle list
            if (this.enemy_castles.length == 0){
                this.sym = find_sym(this.map)
                this.nearest_enemy_castle = this.determine_opp_location(this.me.x,this.me.y,this.sym)
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

            if(this.steps_from_start !== 0){
                this.steps_from_start -= 1
                return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
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
            }

            // start populating the enemy castle list
            if (this.enemy_castles.length == 0){
                this.sym = find_sym(this.map)
                this.nearest_enemy_castle = this.determine_opp_location(this.me.x,this.me.y,this.sym)
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
            this.log(this.me.id + "      " + path_to_enemy_castle[0])
            return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
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

            var best_dist = 1000
            var old_karb = this.nearest_karb
            var at_current_karb

            
            at_current_karb = this.getVisibleRobotMap()[this.nearest_karb[1]][this.nearest_karb[0]]
        
            if (at_current_karb != 0 && at_current_karb != -1 && this.flag == false && at_current_karb != this.me.id){
                this.counter ++
                this.log(this.counter)
            }
            else {
                this.counter = 0
            }

            if (this.counter === 3){
                this.log("counter triggered")
                this.flag = true
                this.karbonite_map[this.nearest_karb[1]][this.nearest_karb[0]] = false
                this.determine_nearest_karb2(6)
                if(old_karb === this.nearest_karb){
                    this.log("attempting to move")
                    var move = this.find_free_adjacent_tile(this.me.x, this.me.y)
                    this.move(...move)
                    this.log("movement happened")
                }
                else{

                    this.log("Switched karb dep: " + this.nearest_karb)
                    this.flag = false
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
                var x_start = 0
                var x_bound = this.W -1
                var y_start = 0
                var y_bound = this.H -1
                var best_dist = 1000

                this.determine_bounds(x_start, x_bound, y_start, y_bound);
                this.determine_nearest_karb(x_start, x_bound, y_start, y_bound, best_dist);
                this.inital_pilgrims = this.determine_resource_dep_amounts(this.karbonite_map, 8);

                
                this.castleTalk(Math.min(255, best_dist))
                this.num_castles = this.getVisibleRobots().length

                // find corresponding enemy castle
                this.determine_opp_castle();
                
                

                // check if other castles have published //determines the maincastle
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
                ///* PATH TESTING
                
                    if (this.num_preachers < 1 && this.maincastle){
                        this.num_preachers ++;
                        // find free tile to build preacher
                        return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                    }
                

                //PATH TESTING*/                 
                return
            }

            //// PATH TESTING
            //if (step > 1){
            //    if (!this.maincastle) {
            //        return
            //    }
            //    this.log(step)
            //    if (this.karbonite < 10){
            //        return
            //    }
            //    return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y))
            //}
            //// PATH TESTING

            else if (step == 2){
                if (this.maincastle){
                    this.num_preachers ++
                    return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                }
            }

            


            else {
                //if (this.maincastle && (this.num_pilgrims < 1 && this.nearest_karb_d < 3 || this.num_pilgrims < 2 && this.nearest_karb_d >= 3)){
                
                
                
                if (this.num_pilgrims < this.inital_pilgrims){
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

                var units = this.getVisibleRobots()
                var count = 0
                for (var i in units){
                if (units[i].unit == SPECS.PREACHER){
                    count ++
                    }
                }
                if (count < 2 && this.karbonite >= 30){
                    return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
                }

                if (this.karbonite >= 35){
                    this.num_prophets ++
                    return this.buildUnit(SPECS.PROPHET, ...this.find_free_adjacent_tile(this.me.x, this.me.y));

                }
            }
            return
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
