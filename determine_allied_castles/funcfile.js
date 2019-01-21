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

    flood_fill(startx, starty, find_karb=true, occupied_list = []) {
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
                    if (this.traversable(newx, newy, visible_robot_map)){
                        var valid = true
                        for (var k in occupied_list){
                            if (newx == occupied_list[i][0] && newy == occupied_list[i][1]){
                                valid = false 
                                break
                            }
                        }
                        if (!valid) used_map[newy][newx] = true

                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true
                            var newpath = cur_path.slice(0, cur_path.length)
                            newpath.push([newx, newy])

                            if (find_karb ? this.karbonite_map[newy][newx] : this.fuel_map[newy][newx]) {
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

    in_bounds(x, y) {
        // check if a tile is in bounds
        return (x >= 0 && x < this.map.length && y >= 0 && y < this.map.length)
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
    }
    find(units){
        if (this.done){
            return
        }
        if (this.phase == 0){
            this.allied_castles[this.r.me.id] = [this.r.me.x, this.r.me.y]
            this.r.castleTalk(this.r.me.x + 1)
        } else if (this.phase == 1){
            this.r.castleTalk(this.r.me.x + 1)
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id] = [units[i].castle_talk - 1, 0]
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
                var mirror_coord = this.allied_castle_list[i][0]
                if (this.sym == 'y'){
                    mirror_coord = this.allied_castle_list[i][1]
                }
                mirror_coord = (this.r.map.length - this.r.map.length%2)-mirror_coord + ((this.r.map.length%2) - 1)
                if (this.sym == 'y'){
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