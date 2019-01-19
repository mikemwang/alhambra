import {BCAbstractRobot, SPECS} from 'battlecode';


class Allied_Castle_Finder{
    /*
    call find() every turn
    on the 4th turn, it will know all the allied castles. this.done will be true
    this.allied_castle_list is a list of all allied castles, sorted by castle ID
    so all castles have the same list, in the same order
    */
    constructor(myrobot){
        this.myrobot = myrobot
        this.phase = 0
        this.allied_castles = {}
        this.allied_castle_list = []
        this.done = false
    }
    find(units){
        if (this.done){
            return
        }
        if (this.phase == 0){
            this.allied_castles[this.myrobot.me.id] = [this.myrobot.me.x, this.myrobot.me.y]
            this.myrobot.castleTalk(this.myrobot.me.x + 1)
        } else if (this.phase == 1){
            this.myrobot.castleTalk(this.myrobot.me.x + 1)
            for (var i in units){
                if (units[i].id != this.myrobot.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id] = [units[i].castle_talk - 1, 0]
                }
            }
        } else if (this.phase == 2){
            this.myrobot.castleTalk(this.myrobot.me.y + 1)
        } else if (this.phase == 3){
            this.myrobot.castleTalk(this.myrobot.me.y + 1)
            for (var i in units){
                if (units[i].id != this.myrobot.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id][1] = units[i].castle_talk - 1
                }
            }
            var keys = Object.keys(this.allied_castles)
            keys.sort()
            for (var i in keys){
                this.allied_castle_list.push(this.allied_castles[keys[i]])
            }
            this.done = true
        }
        this.phase ++
    }
}

export class BaseBot extends BCAbstractRobot{
    constructor(){
        super();
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,-0],        , [+1, 0],
                             [-1,+1], [+0,+1], [+1, +1]]
        this.used_map = null
        this.allied_castle_finder = new Allied_Castle_Finder()
    }



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
        this.nearest_fuel = null
        this.nearest_fuel_d = null
        this.nearest_allied_castle = null
    }

    attack_priority(visible_bots, order = [0, 1, 5, 4, 3, 2]){
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

    pprint_map(){
      var pmap = Array.apply(null, Array(this.map.length))
      var row = pmap.map(function (x, i) { return 0 });
      var pmap = pmap.map(function (x, i) { return row });

      for (var i = 0; i < this.map.length; i++) {
        for (var j = 0; j < this.map.length; j++) {
          pmap.slice()[i][j] = Number(this.map[i][j])
        }
        this.log(pmap[i])
      }
    }

    find_sym(){
      for (var i = 0; i < this.map.length; i++){
        for (var j = 0; j < this.map.length; j++){
          var ii = this.map.length - 1 - i
          if (this.map[i][j] !== this.map[ii][j]){
            return 'y'
          }
        }
      }
      return 'x'
    }

    in_bounds(x, y) {
        // check if a tile is in bounds
        return (x >= 0 && x < this.W && y >= 0 && y < this.H)
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

    traversable(x, y, visible_robot_map) {
        // check if a square is in bounds, not terrain, and not occupied
        return (this.in_bounds(x, y) && this.map[y][x] && visible_robot_map[y][x] <= 0)
    }

    parse_coords(signal){
        return [parseInt(signal.toString(2).slice(4,10),2),parseInt(signal.toString(2).slice(10,16),2)]
    }

    parse_header(signal){
        return signal.toString(2).slice(0,4)
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

    is_self(r){
        return r.id == this.me.id
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

    determine_nearest_fuel(x_start, x_bound, y_start, y_bound, best_dist){

                for (var i = Math.max(x_start, this.me.x-6); i <= Math.min(x_bound, this.me.x+6); i++){
                    for (var j = Math.max(y_start, this.me.y-6); j <= Math.min(y_bound, this.me.y+6); j++){
                        if (this.fuel_map[j][i]){
                            var l = this.bfs(this.me.x, this.me.y, i, j)
                            if (l != null && l.length < best_dist){
                                best_dist = l.length
                                this.nearest_fuel = [i,j]
                                this.nearest_fuel_d = best_dist
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
            this.find_sym(this.map)
        }
    }

    enough_resources(unit_type){
      if (unit_type == SPECS.PILGRIM && this.fuel >= 50 && this.karbonite >= 10){
        return true
      }
      if (unit_type == SPECS.CRUSADER && this.fuel >= 50 && this.karbonite >=20){
        return true
      }
      if (unit_type == SPECS.PROPHET && this.fuel >= 50 && this.karbonite >=25){
        return true
      }
      if (unit_type == SPECS.PREACHER && this.fuel >= 50 && this.karbonite >=30){
        return true
      }
      return false
    }

}
