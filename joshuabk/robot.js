import {create_bot} from 'botfile.js';
import {BaseBot} from 'funcfile.js'

// signals
// 1000: mine location
// 1001, 1010, 1011: enemy castle info ping
// 1100: require msg[1:0] enemy castle coordinate
// 1101: attack directive
// 1111: needs more space
// castletalk parsing
// 255: maincastle requesting enemy castle x pos
// 254: requesting enemy castle y pos
// 253: group reports victory, increment target castle and send next wave

var built = false;
// var step = -1;

// List of functions
//in_bounds(x,y) == checks if it is within the bounds of the map
//traversable(x, y, robot_map) = checks if it is within the map and robotmap location is true
//random_ordering(inp_array) = returns the list of options mixed
//bfs(startx, starty, x, y, ignore_goal=false) = bfs, if the ignore goal is true then you ignore the last tile
//initalize_coor() = initalizes the coor x and y and sym of map
//is_adjacent(x1, y1, x2, y2) = returns if the tiles are next to each other
//find_free_adjacent_tile(x, y) = returns the next free tile around x y
//determine_bounds(x_start, x_bound, y_start, y_bound) = for the castle to find its private variables
//determine_nearest_karb(x_start, x_bound, y_start, y_bound) =

class MyRobot extends BaseBot {
    constructor(){
        super()
        this.bot = null
    }

    turn() {
        this.step ++
        this.initalize_coor()
        if (this.bot == null){
            this.bot = create_bot(this.me.unit)
        }
        this.bot.turn(this)

        // this.initalize_coor()
        // if (this.H == null){
        //     this.H = this.map.length
        // }
        // if (this.W == null){
        //     this.W = this.map[0].length;
        // }
        //
        // if (this.me.unit === SPECS.PILGRIM){
        //     //// PATH TEST
        //     ////var path = this.bfs(this.me.x, this.me.y, 32, 38, true) // 118
        //     ////var path = this.bfs(this.me.x, this.me.y, 33, 50, true) // 1001
        //     //var path = this.bfs(this.me.x, this.me.y, 3, 44, true) // 183
        //     //if (path != null){
        //     //    return this.move(path[0][0] - this.me.x, path[0][1] - this.me.y)
        //     //}
        //     //return
        //     // PATH TEST
        //     var units = this.getVisibleRobots()
        //     if (this.nearest_karb == null){
        //         for (var i in units){
        //             if (units[i].unit == SPECS.CASTLE && units[i].signal_radius > 0){
        //                 this.nearest_allied_castle = [units[i].x, units[i].y]
        //                 var parsestring = units[i].signal.toString(2)
        //                 if (parsestring.slice(0,4) == "1000"){
        //                     var kx = parsestring.slice(4,10)
        //                     var ky = parsestring.slice(10,16)
        //                     this.nearest_karb = [parseInt(kx,2), parseInt(ky,2)]
        //                 }
        //             }
        //         }
        //     } else if (this.nearest_fuel == null){
        //         for (var i in units){
        //             if (units[i].unit == SPECS.CASTLE && units[i].signal_radius > 0){
        //                 this.nearest_allied_castle = [units[i].x, units[i].y]
        //                 var parsestring = units[i].signal.toString(2)
        //                 if (parsestring.slice(0,4) == "1100"){
        //                     var fx = parsestring.slice(4,10)
        //                     var fy = parsestring.slice(10,16)
        //                     this.nearest_fuel = [parseInt(fx,2), parseInt(fy,2)]
        //                 }
        //             }
        //         }
        //     }
        //
        //     if (this.me.karbonite < 20 && this.nearest_karb !== null){
        //         if (this.karbonite_map[this.me.y][this.me.x]){
        //             return this.mine()
        //         }
        //         var path = this.bfs(this.me.x, this.me.y, ...this.nearest_karb, true)
        //         if (path != null){
        //             if(this.traversable(...path[0], this.getVisibleRobotMap())){
        //                 return this.move(path[0][0]-this.me.x, path[0][1]-this.me.y)
        //             }
        //         }
        //     } else if (this.me.fuel < 100 && this.nearest_fuel !== null){
        //         if (this.fuel_map[this.me.y][this.me.x]){
        //             return this.mine()
        //         }
        //         var path = this.bfs(this.me.x, this.me.y, ...this.nearest_fuel, true)
        //         if (path != null){
        //             if(this.traversable(...path[0], this.getVisibleRobotMap())){
        //                 return this.move(path[0][0]-this.me.x, path[0][1]-this.me.y)
        //             }
        //         }
        //     }
        //
        //     var to_castle = this.bfs(this.me.x, this.me.y, ...this.nearest_allied_castle, true)
        //     if (this.me.karbonite == 20 || this.me.fuel == 100){
        //         if (this.is_adjacent(this.me.x, this.me.y, ...this.nearest_allied_castle)){
        //             return this.give(this.nearest_allied_castle[0]-this.me.x, this.nearest_allied_castle[1]-this.me.y, 20, 0)
        //         }
        //         else {
        //             if (to_castle != null){
        //                 return this.move(to_castle[0][0]-this.me.x, to_castle[0][1]-this.me.y)
        //             }
        //             this.signal(parseInt("1111000000000000", 2), 4)
        //         }
        //
        //     }
        // }
        //
        // if (this.me.unit === SPECS.PREACHER){
        //     // find the nearest allied castle
        //     var units = this.attack_priority(this.getVisibleRobots())
        //     var castle_coords = null
        //     for (var i in units){
        //         if (units[i].team != this.me.team){
        //             var enemy_unit = [units[i].x, units[i].y]
        //             var atk = [[0,0]]
        //             atk.push(this.mvmt_choices.slice())
        //             var friendly_fire = false
        //             for (var a in atk){
        //                 for (var j in units){
        //                     if (units[j].team == this.me.team && this.is_adjacent(...enemy_unit, units[j].x, units[j].y)){
        //                         friendly_fire = true
        //                         break
        //                     }
        //                 }
        //                 if (!friendly_fire){
        //                     enemy_unit = [enemy_unit[0] + atk[a][0], enemy_unit[1] + atk[a][1]]
        //                     break
        //                 }
        //             }
        //             this.log ("NOW ATTACKING: " + (enemy_unit[0]-this.me.x) + " " + (enemy_unit[1]-this.me.y))
        //             return this.attack(enemy_unit[0]-this.me.x, enemy_unit[1]-this.me.y)
        //         }
        //         if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
        //             castle_coords = [units[i].x, units[i].y]
        //         }
        //     }
        //
        //     // start populating the enemy castle list
        //     if (this.enemy_castles.length == 0){
        //         this.sym = this.find_sym(this.map)
        //         var mirror_coord = this.me.y
        //         if (this.sym == 'y'){
        //             mirror_coord = this.me.x
        //         }
        //         mirror_coord = (this.H - this.H%2)-mirror_coord + ((this.H%2) - 1)
        //         if (this.sym == 'y'){
        //             this.nearest_enemy_castle = [mirror_coord, this.me.y]
        //         } else {
        //             this.nearest_enemy_castle = [this.me.x, mirror_coord]
        //         }
        //         this.enemy_castles.push(this.nearest_enemy_castle)
        //     }
        //
        //     // find the closest enemy castle
        //     var closest_d = 1000
        //     var path_to_enemy_castle = []
        //     if (this.enemy_castles.length >= 1){
        //         for (var i in this.enemy_castles){
        //             //this.log("ENEMY CASTLE AT: " + this.enemy_castles[i])
        //             var path = this.bfs(this.me.x, this.me.y, this.enemy_castles[i][0], this.enemy_castles[i][1])
        //             //this.log("THIS IS MY PATH: " + path)
        //             if (path !== null && path.length < closest_d){
        //                 closest_d = path.length
        //                 this.nearest_enemy_castle = this.enemy_castles[i]
        //                 path_to_enemy_castle = path
        //             }
        //         }
        //     }
        //     // can the nearest allied castle still spawn units?
        //     //if (castle_coords != null && this.find_free_adjacent_tile(...castle_coords) == null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords)){
        //     // move to enemy castle
        //
        //     if(path!== null){
        //         //this.log ("I AM MOVING THIS MUCH: " +  (path_to_enemy_castle[0][0] - this.me.x) + " " + (path_to_enemy_castle[0][1] - this.me.y))
        //         return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
        //     } else {
        //         //this.log("NOT MOVING BC KILLED CASTLE ALREADY")
        //     }
        //
        //     //}
        // }
        //
        // if (this.me.unit === SPECS.PROPHET){
        //     // find the nearest allied castle
        //     var units = this.getVisibleRobots()
        //     var castle_coords = null
        //     for (var i in units){
        //         if (units[i].team != this.me.team){
        //             var enemy_unit = [units[i].x, units[i].y]
        //             return this.attack(enemy_unit[0]-this.me.x, enemy_unit[1]-this.me.y)
        //         }
        //         if (units[i].unit == SPECS.CASTLE && units[i].unit == this.me.team) {
        //             castle_coords = [units[i].x, units[i].y]
        //         }
        //     }
        //
        //     // start populating the enemy castle list
        //     if (this.enemy_castles.length == 0){
        //         this.sym = this.find_sym(this.map)
        //         var mirror_coord = this.me.y
        //         if (this.sym == 'y'){
        //             mirror_coord = this.me.x
        //         }
        //         mirror_coord = (this.H - this.H%2)-mirror_coord + ((this.H%2) - 1)
        //         if (this.sym == 'y'){
        //             this.nearest_enemy_castle = [mirror_coord, this.me.y]
        //         } else {
        //             this.nearest_enemy_castle = [this.me.x, mirror_coord]
        //         }
        //         this.enemy_castles.push(this.nearest_enemy_castle)
        //     }
        //
        //     // find the closest enemy castle
        //     var closest_d = 1000
        //     var path_to_enemy_castle = []
        //     if (this.enemy_castles.length >= 1){
        //         for (var i in this.enemy_castles){
        //             var path = this.bfs(this.me.x, this.me.y, this.enemy_castles[i][0], this.enemy_castles[i][1])
        //             if (path != null && path.length < closest_d){
        //                 closest_d = path.length
        //                 this.nearest_enemy_castle = this.enemy_castles[i]
        //                 path_to_enemy_castle = path
        //             }
        //         }
        //     }
        //     // // move to front line (facing enemy castle)
        //     // if (path_to_enemy_castle.length > 0){
        //     //     // no adjacent to prevent splash
        //     //     if (castle_coords != null && this.is_adjacent(this.me.x, this.me.y, ...castle_coords)){
        //     //         return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
        //     //     }
        //     // }
        //
        //     // // make sure you're not on a karb
        //     // if (this.karbonite_map[this.me.y][this.me.x]){
        //     //     if (path.length == 0){
        //     //         var move = this.find_free_adjacent_tile(this.me.x, this.me.y)
        //     //         return this.move(...move)
        //     //     }
        //     //     return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
        //     // }
        //
        //     return this.move(path_to_enemy_castle[0][0] - this.me.x, path_to_enemy_castle[0][1] - this.me.y)
        // }
        //
        // if (this.me.unit === SPECS.CASTLE) {
        //     if (step == 0){
        //         this.sym = this.find_sym(this.map)
        //         var x_start = 0
        //         var x_bound = this.W -1
        //         var y_start = 0
        //         var y_bound = this.H -1
        //         var best_dist = 1000
        //
        //         this.determine_bounds(x_start, x_bound, y_start, y_bound);
        //         this.determine_nearest_karb(x_start, x_bound, y_start, y_bound, best_dist);
        //         this.determine_nearest_fuel(x_start, x_bound, y_start, y_bound, best_dist);
        //
        //         this.castleTalk(Math.min(255, best_dist))
        //         this.num_castles = this.getVisibleRobots().length
        //
        //         // find corresponding enemy castle
        //         this.determine_opp_castle();
        //
        //         // check if other castles have published //determines the maincastle
        //         var units = this.getVisibleRobots()
        //         var i_am_last = true
        //         var i_am_best = true
        //         for (var i in units){
        //             if (units[i].id != this.me.id){
        //                 if (units[i].castle_talk == 0){
        //                     i_am_last = false
        //                 } else if (units[i].castle_talk <= best_dist) {
        //                     i_am_best = false
        //                     this.maincastle = false
        //                 }
        //             }
        //         }
        //         if (i_am_last && i_am_best){
        //             this.maincastle = true
        //         }
        //
        //     }
        //
        //     else if (step == 1){
        //         if (this.maincastle == null){
        //             var units = this.getVisibleRobots()
        //             if (units.length > this.num_castles){
        //                 this.maincastle = false
        //             }
        //
        //             for (var i in units){
        //                 if (units[i].castle_talk < this.me.castle_talk && units[i].id != this.me.id) {
        //                     this.maincastle = false
        //                 }
        //             }
        //
        //             if (this.maincastle == null){
        //                 this.maincastle = true
        //             }
        //         }
        //         if (!this.maincastle){
        //             this.castleTalk(255)
        //         }
        //         ///* PATH TESTING
        //         if (this.maincastle){
        //             if (this.num_preachers < 1 && this.maincastle){
        //                 this.num_preachers ++;
        //                 // find free tile to build preacher
        //                 return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
        //             }
        //         }
        //
        //         //PATH TESTING*/
        //         return
        //     }
        //
        //     //// PATH TESTING
        //     //if (step > 1){
        //     //    if (!this.maincastle) {
        //     //        return
        //     //    }
        //     //    this.log(step)
        //     //    if (this.karbonite < 10){
        //     //        return
        //     //    }
        //     //    return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y))
        //     //}
        //     //// PATH TESTING
        //
        //     else if (step <= 3){
        //         if (this.maincastle){
        //             this.num_preachers ++
        //             return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
        //         }
        //     } else {
        //         //if (this.maincastle && (this.num_pilgrims < 1 && this.nearest_karb_d < 3 || this.num_pilgrims < 2 && this.nearest_karb_d >= 3)){
        //         // if (!this.maincastle){
        //         //     return
        //         // }
        //         this.log('#prophets: ' + this.num_prophets)
        //         if (this.enough_resources(SPECS.PROPHET) && step % 5 == 0){
        //             this.num_prophets ++
        //             return this.buildUnit(SPECS.PROPHET, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
        //         }
        //         if (this.enough_resources(SPECS.PREACHER) && step % 6 == 1){
        //             this.num_preachers ++
        //             return this.buildUnit(SPECS.PREACHER, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
        //         }
        //         // if (this.num_pilgrims < 1 && this.enough_resources(SPECS.PILGRIM)){
        //         if (this.enough_resources(SPECS.PILGRIM) && this.num_pilgrims < 3){
        //             this.num_pilgrims ++
        //             this.log('#pilgrim: ' + this.num_pilgrims)
        //             var karb_x_bin = this.nearest_karb[0].toString(2)
        //             var karb_y_bin = this.nearest_karb[1].toString(2)
        //             var fuel_x_bin = this.nearest_fuel[0].toString(2)
        //             var fuel_y_bin = this.nearest_fuel[1].toString(2)
        //             var zeros = ""
        //             if (karb_x_bin.length < 6){
        //                 for (var i = 0; i < 6-karb_x_bin.length; i++){
        //                     zeros = zeros + "0"
        //                 }
        //             }
        //             karb_x_bin = zeros + karb_x_bin
        //
        //             var zeros = ""
        //             if (karb_y_bin.length < 6){
        //                 for (var i = 0; i < 6-karb_y_bin.length; i++){
        //                     zeros = zeros + "0"
        //                 }
        //             }
        //             karb_y_bin = zeros + karb_y_bin
        //
        //             if (fuel_x_bin.length < 6){
        //                 for (var i = 0; i < 6-fuel_x_bin.length; i++){
        //                     zeros = zeros + "0"
        //                 }
        //             }
        //             fuel_x_bin = zeros + fuel_x_bin
        //
        //             var zeros = ""
        //             if (fuel_y_bin.length < 6){
        //                 for (var i = 0; i < 6-fuel_y_bin.length; i++){
        //                     zeros = zeros + "0"
        //                 }
        //             }
        //             fuel_y_bin = zeros + fuel_y_bin
        //
        //             // if (this.karbonite < this.fuel + 1000){
        //             if (step % 2 == 0){
        //               var message = "1000"+karb_x_bin+karb_y_bin
        //               this.signal(parseInt(message, 2), 2)
        //             } else {
        //               var message = "1100"+fuel_x_bin+fuel_y_bin
        //               this.signal(parseInt(message, 2), 2)
        //             }
        //
        //             return this.buildUnit(SPECS.PILGRIM, ...this.find_free_adjacent_tile(this.me.x, this.me.y));
        //
        //         }
        //     }
        //     return
        // }
    }
}

var robot = new MyRobot();
