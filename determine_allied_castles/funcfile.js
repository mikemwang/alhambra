import {BCAbstractRobot, SPECS} from 'battlecode';

export class BaseBot extends BCAbstractRobot{
    constructor(){
        super();
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,-0],          [+1, 0],
                             [-1,+1], [+0,+1], [+1, +1]]
        this.allied_castle_finder = null
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

        var used_map = []
        for (var i = 0; i < this.map.length; i++){
            used_map[i] = []
            for (var j = 0; j<  this.map.length; j++){
                used_map[i][j] = false
            }
        }

        used_map[starty][startx] = true
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
                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true
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

    find_sym(map) {
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

    flood_fill(startx, starty, find_karb=true, occupied_list = [], sym, max_range) {
        if (find_karb != null){
            if (find_karb && this.karbonite_map[starty][startx]) return [[startx, starty]]
            if (!find_karb && this.fuel_map[starty][startx]) return [[startx, starty]]
        }

        var l = this.map.length
        var xbounds = [0, l]
        var ybounds = [0, l]
        if (find_karb != null){
            if (sym == 'x'){
                xbounds = [0, l-1]
                if (this.me.y < l/2) ybounds = [0, Math.floor(l/2)]
                else ybounds = [Math.floor(l/2), l-1]

            } else{
                ybounds = [0, l-1]
                if (this.me.x < l/2) xbounds = [0, Math.floor(l/2)]
                else xbounds = [Math.floor(l/2), l-1]
            }
        }

        var paths = [[[startx, starty]]]

        var used_map = []
        for (var i = 0; i < this.map.length; i++){
            used_map[i] = []
            for (var j = 0; j<  this.map.length; j++){
                used_map[i][j] = false
            }
        }

        used_map[starty][startx] = true
        var visible_robot_map = this.getVisibleRobotMap()

        while (paths.length > 0){
            var new_paths = []
            while (paths.length > 0){
                var cur_path = paths.shift()  // get the path in the beginning
                var choices = this.random_ordering(this.mvmt_choices)
                for (var i in choices){
                    var newx = cur_path[cur_path.length-1][0] + choices[i][0]
                    var newy = cur_path[cur_path.length-1][1] + choices[i][1]
                    if (newx < xbounds[0] || newx > xbounds[1]) continue
                    if (newy < ybounds[0] || newy > ybounds[1]) continue
                    if (this.traversable(newx, newy, visible_robot_map)){
                        var valid = true
                        for (var k in occupied_list){
                            if (newx == occupied_list[k][0] && newy == occupied_list[k][1]){
                                valid = false 
                                break
                            }
                        }
                        if (!valid) used_map[newy][newx] = true

                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true
                            var newpath = cur_path.slice(0, cur_path.length)
                            newpath.push([newx, newy])
                            
                            if (find_karb == null && !this.karbonite_map[newy][newx] && !this.fuel_map[newy][newx]){
                                if (newx%2 == 0 && newy%2 ==0) return newpath.slice(1)
                            }

                            if ((find_karb != null && find_karb) ? this.karbonite_map[newy][newx] : this.fuel_map[newy][newx]) {
                                return newpath.slice(1)
                            }
                            if (newpath.length < max_range) new_paths.push(newpath)
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

    get_closest_attackable_enemy_unit(units, priority_list){
        var max = SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1]
        var min = SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0]
        var loc = null
        var d = 99
        var bot_at_loc = -1
        for (var i in units){
            if (units[i].team != this.me.team){
                if (priority_list[units[i].unit] > bot_at_loc) {
                    loc = [units[i].x, units[i].y]
                    bot_at_loc = priority_list[units[i].unit] 
                } else if (priority_list[units[i].unit] == bot_at_loc){
                    var e = this.r_squared(units[i].x, units[i].y, this.me.x, this.me.y)
                    if (e < d && e <= max && e >= min){
                        d = e
                        loc = [units[i].x, units[i].y]
                        bot_at_loc = priority_list[units[i].unit] 
                    }
                }
                
            }
        }
        return loc
    }

    get_visible_allied_units(units, type=null){
        var num = 0
        for (var i in units){
            var unit = units[i]
            if (unit.team == this.me.team){
                if (type == null){
                    num ++
                    continue
                }
                if (unit.unit == type){
                    num ++
                }
            }
        }
        return num
    }

    get_type_from_id(id, units){
        for (var i in units){
            var unit = units[i]
            if (unit.id == id){
                return unit.unit
            }
        }
    }

    in_bounds(x, y) {
        // check if a tile is in bounds
        return (x >= 0 && x < this.map.length && y >= 0 && y < this.map.length)
    }

    in_range(x,y){
        var r = this.r_squared(this.me.x, this.me.y, x, y) 
        return r <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] && r >= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0]
    }

    is_adjacent(x1, y1, x2, y2){
        return ((Math.abs(x1-x2) < 2) && (Math.abs(y1-y2) < 2))
    }

    is_ally_by_id(id, units){
        for (var i in units){
            if (units[i].id == id){
                this.log("here")
                this.log("here")
                this.log("here")
                this.log("here")
                this.log("here")
                this.log("here")
                
                if (units[i].team == this.me.team){
                    return true
                }

                this.log("is not an ally")
                this.log("is not an ally")
                this.log("is not an ally")
                this.log("is not an ally")
                this.log("is not an ally")
                return false
            }
        }
    }

    is_type_by_id(id, type){
        for (var i in units){
            if (units[i].id == id){
                return units[i].unit == type
            }
        }

    }

    is_self(r){
        return r.id == this.me.id
    }

    is_something_else_adjacent(coords, type=null){
        var map = this.getVisibleRobotMap()
        for (var i in this.mvmt_choices){
            if (map[coords[1]+this.mvmt_choices[i][1]][coords[0]+this.mvmt_choices[i][0]] >0){
                if (type == null) return true
                if (this.get_type_from_id(map[coords[1]+this.mvmt_choices[i][1]][coords[0]+this.mvmt_choices[i][0]], this.getVisibleRobots()) == type) return true
            }
        }
        return false
    }

    move_lattice(units){
    }

    parse_coords(signal){
        return [parseInt(signal.toString(2).slice(4,10),2),parseInt(signal.toString(2).slice(10,16),2)]
    }

    parse_header(signal){
        return signal.toString(2).slice(0,4)
    }

    r_squared(x1, y1, x2, y2){
        return Math.pow(x1-x2, 2) + Math.pow(y1-y2,2)
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

    resources_in_area(x, y, range, find_karb, sym){
        var resources = []
        do{
            var p = this.flood_fill(x, y, find_karb, resources, sym, range)
            if (p!=null){
                resources.push(p[p.length-1].slice())
            }
        }while(p!=null)
        return resources
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
        return (this.in_bounds(x, y) && this.map[y][x] && visible_robot_map[y][x] <= 0 && visible_robot_map[y][x] != this.me.id)
    }

}

export class Allied_Castle_Finder{
    /*
    call find() every turn
    on the 4th turn, it will know all the allied castles. this.done will be true
    this.allied_castle_list is a list of all allied castles, sorted by castle ID
    so all castles have the same list, in the same order
    */
    constructor(r){
        this.r = r
        this.phase = 0
        this.allied_castles = {}
        this.allied_castle_list = []
        this.done = false
        this.enemy_castle_list = []
        this.castle_turn_order = 0
        this.num_castles = 1
    }
    find(units, sym){
        if (this.done){
            return
        }
        if (this.phase == 0){
            this.allied_castles[this.r.me.id] = [this.r.me.x, this.r.me.y]
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.castle_turn_order ++
                }
            }
            this.r.castleTalk(this.r.me.x + 1)
        } else if (this.phase == 1){
            this.r.castleTalk(this.r.me.x + 1)
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id] = [units[i].castle_talk - 1, 0]
                    this.num_castles ++
                }
            }
        } else if (this.phase == 2){
            this.r.castleTalk(this.r.me.y + 1)
        } else if (this.phase == 3){
            this.r.castleTalk(this.r.me.y + 1)
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id][1] = units[i].castle_talk - 1
                }
            }
            var keys = Object.keys(this.allied_castles)
            keys.sort()
            for (var i in keys){
                this.allied_castle_list.push(this.allied_castles[keys[i]])
            }

            for (var i in this.allied_castle_list){
                var opposite_castle = []
                var mirror_coord = this.allied_castle_list[i][1]
                if (sym == 'y'){
                    mirror_coord = this.allied_castle_list[i][0]
                }
                mirror_coord = (this.r.map.length - this.r.map.length%2)-mirror_coord + ((this.r.map.length%2) - 1)

                if (sym == 'y'){
                    opposite_castle = [mirror_coord, this.allied_castle_list[i][1]]
                } else {
                    opposite_castle = [this.allied_castle_list[i][0], mirror_coord]
                }
                this.enemy_castle_list.push(opposite_castle.slice())
            }

            this.done = true
        }
        this.phase ++
    }
}

export class SignalContainer{
    constructor (header='', message=[], castletalk=false, range=0, priority=null){
        this.header = header
        this.message = message
        this.castletalk = castletalk
        this.range = range
    }
}

export class PriorityQueue{

}

export class ActionContainer{
    constructor (action=null, priority){
        this.action = action
        this.priority = priority
    }
}