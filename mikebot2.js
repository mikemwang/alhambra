'use strict';

var SPECS = {"COMMUNICATION_BITS":16,"CASTLE_TALK_BITS":8,"MAX_ROUNDS":1000,"TRICKLE_FUEL":25,"INITIAL_KARBONITE":100,"INITIAL_FUEL":500,"MINE_FUEL_COST":1,"KARBONITE_YIELD":2,"FUEL_YIELD":10,"MAX_TRADE":1024,"MAX_BOARD_SIZE":64,"MAX_ID":4096,"CASTLE":0,"CHURCH":1,"PILGRIM":2,"CRUSADER":3,"PROPHET":4,"PREACHER":5,"RED":0,"BLUE":1,"CHESS_INITIAL":100,"CHESS_EXTRA":20,"TURN_MAX_TIME":200,"MAX_MEMORY":50000000,"UNITS":[{"CONSTRUCTION_KARBONITE":null,"CONSTRUCTION_FUEL":null,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":200,"VISION_RADIUS":100,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,64],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":50,"CONSTRUCTION_FUEL":200,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":100,"VISION_RADIUS":100,"ATTACK_DAMAGE":0,"ATTACK_RADIUS":0,"ATTACK_FUEL_COST":0,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":10,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":1,"STARTING_HP":10,"VISION_RADIUS":100,"ATTACK_DAMAGE":null,"ATTACK_RADIUS":null,"ATTACK_FUEL_COST":null,"DAMAGE_SPREAD":null},{"CONSTRUCTION_KARBONITE":15,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":9,"FUEL_PER_MOVE":1,"STARTING_HP":40,"VISION_RADIUS":49,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":25,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":2,"STARTING_HP":20,"VISION_RADIUS":64,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[16,64],"ATTACK_FUEL_COST":25,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":30,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":3,"STARTING_HP":60,"VISION_RADIUS":16,"ATTACK_DAMAGE":20,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":15,"DAMAGE_SPREAD":3}]};

function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        this._bc_reset_state();
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        this.id = game_state.id;
        this.karbonite = game_state.karbonite;
        this.fuel = game_state.fuel;
        this.last_offer = game_state.last_offer;

        this.me = this.getRobot(this.id);

        if (this.me.turn === 1) {
            this.map = game_state.map;
            this.karbonite_map = game_state.karbonite_map;
            this.fuel_map = game_state.fuel_map;
        }

        try {
            var t = this.turn();
        } catch (e) {
            t = this._bc_error_action(e);
        }

        if (!t) t = this._bc_null_action();

        t.signal = this._bc_signal;
        t.signal_radius = this._bc_signal_radius;
        t.logs = this._bc_logs;
        t.castle_talk = this._bc_castle_talk;

        this._bc_reset_state();

        return t;
    }

    _bc_reset_state() {
        // Internal robot state representation
        this._bc_logs = [];
        this._bc_signal = 0;
        this._bc_signal_radius = 0;
        this._bc_game_state = null;
        this._bc_castle_talk = 0;
        this.me = null;
        this.id = null;
        this.fuel = null;
        this.karbonite = null;
        this.last_offer = null;
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'signal_radius': this._bc_signal_radius,
            'logs': this._bc_logs,
            'castle_talk': this._bc_castle_talk
        };
    }

    _bc_error_action(e) {
        var a = this._bc_null_action();
        
        if (e.stack) a.error = e.stack;
        else a.error = e.toString();

        return a;
    }

    _bc_action(action, properties) {
        var a = this._bc_null_action();
        if (properties) for (var key in properties) { a[key] = properties[key]; }
        a['action'] = action;
        return a;
    }

    _bc_check_on_map(x, y) {
        return x >= 0 && x < this._bc_game_state.shadow[0].length && y >= 0 && y < this._bc_game_state.shadow.length;
    }
    
    log(message) {
        this._bc_logs.push(JSON.stringify(message));
    }

    // Set signal value.
    signal(value, radius) {
        // Check if enough fuel to signal, and that valid value.
        
        var fuelNeeded = Math.ceil(Math.sqrt(radius));
        if (this.fuel < fuelNeeded) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw "Signal radius is too big.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= fuelNeeded;
    }

    // Set castle talk value.
    castleTalk(value) {
        // Check if enough fuel to signal, and that valid value.

        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw "Invalid castle talk, must be between 0 and 2^8.";

        this._bc_castle_talk = value;
    }

    proposeTrade(karbonite, fuel) {
        if (this.me.unit !== SPECS.CASTLE) throw "Only castles can trade.";
        if (!Number.isInteger(karbonite) || !Number.isInteger(fuel)) throw "Must propose integer valued trade."
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw "Cannot trade over " + SPECS.MAX_TRADE + " in a given turn.";

        return this._bc_action('trade', {
            trade_fuel: fuel,
            trade_karbonite: karbonite
        });
    }

    buildUnit(unit, dx, dy) {
        if (this.me.unit !== SPECS.PILGRIM && this.me.unit !== SPECS.CASTLE && this.me.unit !== SPECS.CHURCH) throw "This unit type cannot build.";
        if (this.me.unit === SPECS.PILGRIM && unit !== SPECS.CHURCH) throw "Pilgrims can only build churches.";
        if (this.me.unit !== SPECS.PILGRIM && unit === SPECS.CHURCH) throw "Only pilgrims can build churches.";
        
        if (!Number.isInteger(dx) || !Number.isInteger(dx) || dx < -1 || dy < -1 || dx > 1 || dy > 1) throw "Can only build in adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't build units off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] > 0) throw "Cannot build on occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot build onto impassable terrain.";
        if (this.karbonite < SPECS.UNITS[unit].CONSTRUCTION_KARBONITE || this.fuel < SPECS.UNITS[unit].CONSTRUCTION_FUEL) throw "Cannot afford to build specified unit.";

        return this._bc_action('build', {
            dx: dx, dy: dy,
            build_unit: unit
        });
    }

    move(dx, dy) {
        if (this.me.unit === SPECS.CASTLE || this.me.unit === SPECS.CHURCH) throw "Churches and Castles cannot move.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't move off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot move outside of vision range.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] !== 0) throw "Cannot move onto occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot move onto impassable terrain.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);  // Squared radius
        if (r > SPECS.UNITS[this.me.unit]['SPEED']) throw "Slow down, cowboy.  Tried to move faster than unit can.";
        if (this.fuel < r*SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE']) throw "Not enough fuel to move at given speed.";

        return this._bc_action('move', {
            dx: dx, dy: dy
        });
    }

    mine() {
        if (this.me.unit !== SPECS.PILGRIM) throw "Only Pilgrims can mine.";
        if (this.fuel < SPECS.MINE_FUEL_COST) throw "Not enough fuel to mine.";
        
        if (this.karbonite_map[this.me.y][this.me.x]) {
            if (this.me.karbonite >= SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY) throw "Cannot mine, as at karbonite capacity.";
        } else if (this.fuel_map[this.me.y][this.me.x]) {
            if (this.me.fuel >= SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY) throw "Cannot mine, as at fuel capacity.";
        } else throw "Cannot mine square without fuel or karbonite.";

        return this._bc_action('mine');
    }

    give(dx, dy, karbonite, fuel) {
        if (dx > 1 || dx < -1 || dy > 1 || dy < -1 || (dx === 0 && dy === 0)) throw "Can only give to adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't give off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] <= 0) throw "Cannot give to empty square.";
        if (karbonite < 0 || fuel < 0 || this.me.karbonite < karbonite || this.me.fuel < fuel) throw "Do not have specified amount to give.";

        return this._bc_action('give', {
            dx:dx, dy:dy,
            give_karbonite:karbonite,
            give_fuel:fuel
        });
    }

    attack(dx, dy) {
        if (this.me.unit === SPECS.CHURCH) throw "Churches cannot attack.";
        if (this.fuel < SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST) throw "Not enough fuel to attack.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't attack off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot attack outside of vision range.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);
        if (r > SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1] || r < SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0]) throw "Cannot attack outside of attack range.";

        return this._bc_action('attack', {
            dx:dx, dy:dy
        });
        
    }


    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Check if a given robot is visible.
    isVisible(robot) {
        return ('unit' in robot);
    }

    // Check if a given robot is sending you radio.
    isRadioing(robot) {
        return robot.signal >= 0;
    }

    // Get map of visible robot IDs.
    getVisibleRobotMap() {
        return this._bc_game_state.shadow;
    }

    // Get boolean map of passable terrain.
    getPassableMap() {
        return this.map;
    }

    // Get boolean map of karbonite points.
    getKarboniteMap() {
        return this.karbonite_map;
    }

    // Get boolean map of impassable terrain.
    getFuelMap() {
        return this.fuel_map;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    turn() {
        return null;
    }
}

class BaseBot extends BCAbstractRobot{
    constructor(){
        super();
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,-0],          [+1, 0],
                             [-1,+1], [+0,+1], [+1, +1]];

        this.fast_mvmt_choices = [[-2, 0], [-1, -1], [-1, 0], [-1, 1], [0, -2], [0, -1], [0, 0], [0, 1],[0, 2], [1, -1], [1, 0], [1, 1], [2, 0]];

        this.allied_castle_finder = null;
    }

    bfs(startx, starty, x, y, ignore_goal=false, fast=true) {
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

        var paths = [[[startx, starty]]];

        var used_map = [];
        for (var i = 0; i < this.map.length; i++){
            used_map[i] = [];
            for (var j = 0; j<  this.map.length; j++){
                used_map[i][j] = false;
            }
        }

        used_map[starty][startx] = true;
        var visible_robot_map = this.getVisibleRobotMap();

        while (paths.length > 0){
            var new_paths = [];
            while (paths.length > 0){
                var cur_path = paths.shift();  // get the path in the beginning
                var choices = fast ? this.random_ordering(this.fast_mvmt_choices) : this.random_ordering(this.mvmt_choices);
                for (var i in choices){
                    var newx = cur_path[cur_path.length-1][0] + choices[i][0];
                    var newy = cur_path[cur_path.length-1][1] + choices[i][1];
                    if (this.traversable(newx, newy, visible_robot_map)){
                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true;
                            var newpath = cur_path.slice(0, cur_path.length);
                            newpath.push([newx, newy]);
                            if (ignore_goal && this.is_adjacent(newx, newy, x, y)){
                                return newpath.slice(1)    
                            }
                            if (newx == x && newy == y) {
                                return newpath.slice(1)
                            }
                            new_paths.push(newpath);
                        }
                    }
                }
            }
            if (new_paths.length > 0) {
                paths = new_paths.slice();
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
                var ii = map.length - 1 - i;
                if (map[i][j] !== map[ii][j]){
                return 'y'
                }
            }
        }
        return 'x'
    }

    preacher_fire_control(units){
        var attack_square = null;
        for (var i in units){
            var unit = units[i];
            if (unit.team != this.me.team){
                for (var j in units){
                    var allied_unit = units[j];
                    if (allied_unit.team == this.me.team && allied_unit.unit == SPECS.PREACHER){
                        var r = this.r_squared(allied_unit.x, allied_unit.y, unit.x, unit.y);
                        if (r > 16 && r <=27){
                            for (var k in this.mvmt_choices){
                                var choice = this.mvmt_choices[k];
                                if (this.r_squared(allied_unit.x, allied_unit.y, unit.x+choice[0], unit.y+choice[1]) <= 16){
                                    attack_square = [unit.x+choice[0], unit.y+choice[1]];
                                    break
                                }
                            }
                        }
                    }
                }
            }
        }
        return attack_square
    }

    flood_fill(startx, starty, find_karb=true, occupied_list = [], sym, max_range) {
        if (find_karb != null){
            if (find_karb && this.karbonite_map[starty][startx]) return [[startx, starty]]
            if (!find_karb && this.fuel_map[starty][startx]) return [[startx, starty]]
        }

        var l = this.map.length;
        var xbounds = [0, l];
        var ybounds = [0, l];
        if (find_karb != null){
            if (sym == 'x'){
                xbounds = [0, l-1];
                if (this.me.y < l/2) ybounds = [0, Math.floor(l/2)];
                else ybounds = [Math.floor(l/2), l-1];

            } else{
                ybounds = [0, l-1];
                if (this.me.x < l/2) xbounds = [0, Math.floor(l/2)];
                else xbounds = [Math.floor(l/2), l-1];
            }
        }

        var paths = [[[startx, starty]]];

        var used_map = [];
        for (var i = 0; i < this.map.length; i++){
            used_map[i] = [];
            for (var j = 0; j<  this.map.length; j++){
                used_map[i][j] = false;
            }
        }

        used_map[starty][startx] = true;
        var visible_robot_map = this.getVisibleRobotMap();

        while (paths.length > 0){
            var new_paths = [];
            while (paths.length > 0){
                var cur_path = paths.shift();  // get the path in the beginning
                var choices = this.random_ordering(this.mvmt_choices);
                for (var i in choices){
                    var newx = cur_path[cur_path.length-1][0] + choices[i][0];
                    var newy = cur_path[cur_path.length-1][1] + choices[i][1];
                    if (newx < xbounds[0] || newx > xbounds[1]) continue
                    if (newy < ybounds[0] || newy > ybounds[1]) continue
                    if (this.traversable(newx, newy, visible_robot_map)){
                        var valid = true;
                        for (var k in occupied_list){
                            if (newx == occupied_list[k][0] && newy == occupied_list[k][1]){
                                valid = false; 
                                break
                            }
                        }
                        if (!valid) used_map[newy][newx] = true;

                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true;
                            var newpath = cur_path.slice(0, cur_path.length);
                            newpath.push([newx, newy]);
                            
                            if (find_karb == null && !this.karbonite_map[newy][newx] && !this.fuel_map[newy][newx]){
                                if (newx%2 == 0 && newy%2 ==0) return newpath.slice(1)
                            }

                            if ((find_karb != null && find_karb) ? this.karbonite_map[newy][newx] : this.fuel_map[newy][newx]) {
                                return newpath.slice(1)
                            }
                            if (newpath.length < max_range) new_paths.push(newpath);
                        }
                    }
                }
            }
            if (new_paths.length > 0) {
                paths = new_paths.slice();
            }
        }
        return null
    }

    get_closest_attackable_enemy_unit(units, priority_list){
        var loc = null;
        var bot_at_loc = -1;
        for (var i in units){
            if (units[i].team != this.me.team){
                if (priority_list[units[i].unit] > bot_at_loc) {
                    loc = [units[i].x, units[i].y];
                    bot_at_loc = priority_list[units[i].unit]; 
                } else if (priority_list[units[i].unit] == bot_at_loc){
                    var e = this.r_squared(units[i].x, units[i].y, this.me.x, this.me.y);
                    if (this.in_range(units[i].x, uints[i].y) && e >= min){
                        loc = [units[i].x, units[i].y];
                        bot_at_loc = priority_list[units[i].unit]; 
                    }
                }
                
            }
        }
        return loc
    }

    get_visible_allied_units(units, type=null){
        var num = 0;
        for (var i in units){
            var unit = units[i];
            if (unit.team == this.me.team){
                if (type == null){
                    num ++;
                    continue
                }
                if (unit.unit == type){
                    num ++;
                }
            }
        }
        return num
    }

    get_type_from_id(id, units){
        for (var i in units){
            var unit = units[i];
            if (unit.id == id){
                return unit.unit
            }
        }
    }

    in_bounds(x, y) {
        // check if a tile is in bounds
        return (x >= 0 && x < this.map.length && y >= 0 && y < this.map.length)
    }

    in_range(x, y, x1=this.me.x, y1=this.me.y, stationary=true){
        var r = this.r_squared(x1, y1, x, y); 
        var max = SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1];
        if (!stationary) max ++;
        var min = SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0];
        if (!stationary) min ++;
        return r <= max && r >= min
    }

    is_adjacent(x1, y1, x2, y2){
        return ((Math.abs(x1-x2) < 2) && (Math.abs(y1-y2) < 2))
    }

    is_ally_by_id(id, units){
        for (var i in units){
            if (units[i].id == id){
                if (units[i].team == this.me.team){
                    return true
                }
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
        var map = this.getVisibleRobotMap();
        for (var i in this.mvmt_choices){
            if (map[coords[1]+this.mvmt_choices[i][1]][coords[0]+this.mvmt_choices[i][0]] >0){
                if (type == null) return true
                if (this.get_type_from_id(map[coords[1]+this.mvmt_choices[i][1]][coords[0]+this.mvmt_choices[i][0]], this.getVisibleRobots()) == type) return true
            }
        }
        return false
    }

    move_to_attack_range(startx, starty, goalx, goaly, stationary) {
        var paths = [[[startx, starty]]];

        var used_map = [];
        for (var i = 0; i < this.map.length; i++){
            used_map[i] = [];
            for (var j = 0; j<  this.map.length; j++){
                used_map[i][j] = false;
            }
        }

        used_map[starty][startx] = true;
        var visible_robot_map = this.getVisibleRobotMap();

        while (paths.length > 0){
            var new_paths = [];
            while (paths.length > 0){
                var cur_path = paths.shift();  // get the path in the beginning
                var choices = this.random_ordering(this.mvmt_choices);
                for (var i in choices){
                    var newx = cur_path[cur_path.length-1][0] + choices[i][0];
                    var newy = cur_path[cur_path.length-1][1] + choices[i][1];

                    if (this.traversable(newx, newy, visible_robot_map)){
                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true;
                            var newpath = cur_path.slice(0, cur_path.length);
                            newpath.push([newx, newy]);
                            
                            if (this.in_range(newx, newy, goalx, goaly, stationary))
                                return newpath.slice(1)

                            new_paths.push(newpath);
                        }
                    }
                }
            }
            if (new_paths.length > 0) {
                paths = new_paths.slice();
            }
        }
        return null
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
        var array = inp_array.slice();
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
        var resources = [];
        do{
            var p = this.flood_fill(x, y, find_karb, resources, sym, range);
            if (p!=null){
                resources.push(p[p.length-1].slice());
            }
        }while(p!=null)
        return resources
    }


    signal_encode(header, msg1, msg2, range){
        /*
        msg1, msg2 had better fucking be less than 63, or bad things will
        happen
        */
        
        var msg1_bin = msg1.toString(2);
        var zeros = "";
        if (msg1_bin.length < 6){
            for (var i = 0; i < 6-msg1_bin.length; i++){
                zeros = zeros + "0";
            }
        }
        msg1_bin = zeros + msg1_bin;

        var msg2_bin = msg2.toString(2);
        var zeros = "";
        if (msg2_bin.length < 6){
            for (var i = 0; i < 6-msg2_bin.length; i++){
                zeros = zeros + "0";
            }
        }
        msg2_bin = zeros + msg2_bin;

        var message = header+msg1_bin+msg2_bin;
        this.log(message);
        this.signal(parseInt(message, 2), range);
    }

    traversable(x, y, visible_robot_map) {
        // check if a square is in bounds, not terrain, and not occupied
        return (this.in_bounds(x, y) && this.map[y][x] && visible_robot_map[y][x] <= 0 && visible_robot_map[y][x] != this.me.id)
    }

}

class Allied_Castle_Finder{
    /*
    call find() every turn
    on the 4th turn, it will know all the allied castles. this.done will be true
    this.allied_castle_list is a list of all allied castles, sorted by castle ID
    so all castles have the same list, in the same order
    */
    constructor(r){
        this.r = r;
        this.phase = 0;
        this.allied_castles = {};
        this.allied_castle_list = [];
        this.done = false;
        this.enemy_castle_list = [];
        this.castle_turn_order = 0;
        this.num_castles = 1;
    }
    find(units, sym){
        if (this.done){
            return
        }
        if (this.phase == 0){
            this.allied_castles[this.r.me.id] = [this.r.me.x, this.r.me.y];
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.castle_turn_order ++;
                }
            }
            this.r.castleTalk(this.r.me.x + 1);
        } else if (this.phase == 1){
            this.r.castleTalk(this.r.me.x + 1);
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id] = [units[i].castle_talk - 1, 0];
                    this.num_castles ++;
                }
            }
        } else if (this.phase == 2){
            this.r.castleTalk(this.r.me.y + 1);
        } else if (this.phase == 3){
            this.r.castleTalk(this.r.me.y + 1);
            for (var i in units){
                if (units[i].id != this.r.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id][1] = units[i].castle_talk - 1;
                }
            }
            var keys = Object.keys(this.allied_castles);
            keys.sort();
            for (var i in keys){
                this.allied_castle_list.push(this.allied_castles[keys[i]]);
            }

            for (var i in this.allied_castle_list){
                var opposite_castle = [];
                var mirror_coord = this.allied_castle_list[i][1];
                if (sym == 'y'){
                    mirror_coord = this.allied_castle_list[i][0];
                }
                mirror_coord = (this.r.map.length - this.r.map.length%2)-mirror_coord + ((this.r.map.length%2) - 1);

                if (sym == 'y'){
                    opposite_castle = [mirror_coord, this.allied_castle_list[i][1]];
                } else {
                    opposite_castle = [this.allied_castle_list[i][0], mirror_coord];
                }
                this.enemy_castle_list.push(opposite_castle.slice());
            }

            this.done = true;
        }
        this.phase ++;
    }
}

class Castle{
    constructor(r){
        this.resource_kernel = [[1.54, 1.54, 1.54, 1.54, 1.54],
                                [1.54, 1.82, 1.82, 1.82, 1.54],
                                [1.54, 1.82, 0.00, 1.82, 1.54],
                                [1.54, 1.82, 1.82, 1.82, 1.54],
                                [1.54, 1.54, 1.54, 1.54, 1.54]];
        this.allied_castle_list = null;
        this.anti_rush_budget = 90;
        this.castle_turn_order = null;
        this.defensive_build = null;
        this.defended_rush = false;
        this.economy = true;
        this.enemy_castle_list = null;
        this.latest_possible_rush = 25;
        this.num_finished_econ = 0;
        this.num_castles = null;
        this.num_units = [0,0,0,0,0,0];
        this.max_pilgrim_range = 5;
        this.r = r;
        this.synced_build = false;
        this.synced_build_rush = false;
        this.resource_saturation = null;
        this.rush_castle = false;
        this.rush_distance = null;
        this.sym = null;
        this.last_hp = null;
    }

    turn(step){
        this.r.log(step);
        if (this.last_hp == null) {
            this.last_hp = this.r.me.health;
        }
        var damage_taken = this.r.me.health != this.last_hp;
        this.last_hp = this.r.me.health;

        this.defensive_build = null;
        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map);
        }

        if (this.r.allied_castle_finder == null){
            this.r.allied_castle_finder = new Allied_Castle_Finder(this.r);
        }

        var units = this.r.getVisibleRobots();

        this.r.allied_castle_finder.find(units, this.sym);
        if (this.r.allied_castle_finder.done && this.allied_castle_list == null){
            this.allied_castle_list = this.r.allied_castle_finder.allied_castle_list.slice();
            this.enemy_castle_list = this.r.allied_castle_finder.enemy_castle_list.slice();
            this.castle_turn_order = this.r.allied_castle_finder.castle_turn_order;
            this.num_castles = this.r.allied_castle_finder.num_castles;
            var d = 999;
            var castle = null;
            for (var i in this.enemy_castle_list){
                for (var k in this.allied_castle_list){
                    var e = this.r.bfs(...this.allied_castle_list[k], ...this.enemy_castle_list[i]);
                    if (e != null && e.length < d){
                        d = e.length;
                        castle = this.allied_castle_list[k].slice();
                    }
                }
            }
            this.rush_distance = d;
            this.rush_castle = castle[0] == this.r.me.x && castle[1] == this.r.me.y;
        }

        if (this.resource_saturation == null){
            var karbonites = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, true, this.sym);
            var fuels = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, false, this.sym);
            this.resource_saturation = karbonites.length + fuels.length;
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...karbonites[0])){
                this.num_units[SPECS.PILGRIM] ++;
                return this.r.buildUnit(SPECS.PILGRIM, karbonites[0][0] - this.r.me.x, karbonites[0][1] - this.r.me.y)
            }
        }

        if (this.num_castles != null){
            if (this.castle_turn_order == 0){
                for (var i in units){
                    if (units[i].id != this.r.me.id && units[i].castle_talk == 254){
                        this.num_finished_econ ++;
                    }
                    if (step > this.latest_possible_rush || units[i].id != this.r.me.id && units[i].castle_talk == 252){
                        this.defended_rush = true;
                        this.anti_rush_budget = 30;
                    }
                }
                if (this.r.karbonite >=(this.anti_rush_budget + (this.num_castles-this.num_finished_econ)*10 + this.num_finished_econ*25)){
                    this.r.castleTalk(255);
                    this.synced_build = true;
                }
            } else {
                for (var i in units){
                    if (units[i].id != this.r.me.id && units[i].castle_talk == 255){
                        this.synced_build = true;
                    }
                }
            }
        }

        var atk_loc = null;
        var num_enemy_units = [0,0,0,0,0,0];
        for (var i in units){
            if (units[i].team != this.r.me.team){
                atk_loc = [units[i].x, units[i].y];
                num_enemy_units[units[i].unit] ++;
                if (units[i].unit == SPECS.CRUSADER){
                    this.defensive_build = SPECS.PREACHER;
                }
                if (units[i].unit == SPECS.PROPHET){
                    this.defensive_build = SPECS.PROPHET;
                }
                if (units[i].unit == SPECS.PREACHER){
                    this.defensive_build = SPECS.PREACHER;
                }
            }
        }
        var preacher_fcs = this.r.preacher_fire_control(units);
        if (preacher_fcs != null){
            this.r.log("found");
            this.r.log("found");
            this.r.log("found");
            this.r.log("found");
            this.r.log("found");
            this.r.log("found");
            this.r.log("found");
            this.r.log(preacher_fcs);
            this.r.signal_encode("1111", ...preacher_fcs, 100);
        }         
        if (this.defensive_build != null){
            if (this.r.get_visible_allied_units(units, this.defensive_build) < num_enemy_units[num_enemy_units.indexOf(Math.max(...num_enemy_units))] + 2){
                if (this.r.karbonite >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE){
                    this.num_units[this.defensive_build] ++;
                    if ((this.num_units[this.defensive_build]*SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE) >= 90 || step > 25) {
                        this.r.castleTalk(252);  // anti-rush budget exceeded
                    }
                    return this.r.buildUnit(this.defensive_build, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
                }
            }
            if (this.r.in_range(...atk_loc)){
                return this.r.attack(atk_loc[0] - this.r.me.x, atk_loc[1] - this.r.me.y)
            }
        }

        this.economy = this.r.get_visible_allied_units(units, SPECS.PILGRIM) < this.resource_saturation;

        if (this.synced_build && this.rush_castle && step <= this.latest_possible_rush){
            this.synced_build_rush = true;
        }

        if (this.synced_build || this.synced_build_rush){
            if (!this.synced_build){
                this.synced_build_rush = false;
            }
            if (this.economy && this.synced_build){
                if (this.r.get_visible_allied_units(units, SPECS.PILGRIM) == (this.resource_saturation -1)){
                    if (this.castle_turn_order != 0) this.r.castleTalk(254);
                    this.num_finished_econ ++;
                    this.num_finished_econ = Math.min(this.num_finished_econ, this.num_castles);
                }
                this.synced_build = false;
                return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            } else {
                this.num_units[SPECS.PROPHET] ++;
                this.synced_build = false;
                return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))

            }
        }

        return


        if (this.r.karbonite >= 10 && this.r.fuel >= 50 && this.built < 2){
            this.r.log("building pilgrim");
            this.built ++;
            return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
        }

        return
        if (!this.applied){
            for (var i in this.r.map){
                for (var j in this.r.map){
                    for (var k in this.resource_kernel){
                        for (var l in this.resource_kernel){
                            var coeff = this.resource_kernel[l][k];
                            var x = i + k - 2;
                            var y = j + l - 2;
                            if (!this.r.in_bounds(x, y)) continue
                            if (this.r.karbonite_map[y][x]) ;
                        }
                    }
                }
            }
        }
    }
}

class Pilgrim{
    constructor(r){
        this.r = r;
        this.karb_bot = true;
        this.home_depo = null;
        this.occupied_resources = [];
        this.target_resource = null;
        this.target_karb = null;
        this.target_fuel = null;
        this.saturated = false;
        this.sym = null;
        this.max_range = 5;
    }

    turn(step){

        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map);
        }

        if (this.home_depo == null) {
            var units = this.r.getVisibleRobots();
            for (var i in units) {
                if (units[i].unit == SPECS.CASTLE || units[i].unit == SPECS.CHURCH){
                    this.home_depo = [units[i].x, units[i].y];
                    break
                }
            }
        }

        // retargeting conditions
        if (!this.saturated){
            if (this.r.fuel < 200){
                this.karb_bot = false;
            } else if (this.r.karbonite < 100){
                this.karb_bot = true;
            }
            if(this.r.fuel > 500){
                this.karb_bot = true;
            }
        }

        if (this.target_resource == null){
            var path = null;
            var done = false;
            do {
                path = this.r.flood_fill(this.r.me.x, this.r.me.y, this.karb_bot, this.occupied_resources, this.sym, this.max_range);

                if ((!this.saturated && path == null) || (path!=null && path.length > this.max_range)) {
                    this.r.log("IS SATURATED");
                    this.saturated = true;
                    this.karb_bot = !this.karb_bot;
                    path = null;
                } else if (this.saturated && path == null) {
                    this.r.log("USELESS PILGRIM");
                    done = true;
                } else {
                    done = true;
                }
            }while(!done)

            if (path == null){
                this.r.log("never found a resource");
                return
            }

            if (this.karb_bot){
                this.target_karb = path[path.length-1];
            }
            else {
                this.target_fuel = path[path.length-1];
            }
            this.target_resource = this.karb_bot ? this.target_karb : this.target_fuel;
            this.r.signal(4, 0);
        }

        var resource = this.karb_bot ? this.r.me.karbonite : this.r.me.fuel;
        var max_resource = this.karb_bot ? 20 : 100;
        var resource_map = this.karb_bot ? this.r.karbonite_map : this.r.fuel_map;

        // mine phase
        if (resource < max_resource){
            if (resource_map[this.r.me.y][this.r.me.x]){
                return this.r.mine()
            }
            var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.target_resource, false, true);
            if (path != null) return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
            this.target_resource = null;
            if (this.karb_bot) this.target_karb = null;
            if (!this.karb_bot) this.target_fuel = null;

        } else { // deposit phase
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...this.home_depo)){
                return this.r.give(this.home_depo[0]-this.r.me.x, this.home_depo[1]-this.r.me.y, this.r.me.karbonite, this.r.me.fuel)
            } else {
                var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.home_depo, true, true);
                if (path != null){
                    return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
                }
            }
        }
    }
}

class Preacher{
    constructor (r){
        this.r = r;
        this.lattice_occupancy = [];
        this.priority_list = [0,0,0,0,1,0];
        this.sym = null;

    }
    turn(step){
        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map);
        }

        var units = this.r.getVisibleRobots();

        var fire_control_target = null;
        for (var i in units){
            var unit = units[i];
            if (this.r.isRadioing(unit)){
                var header = this.r.parse_header(unit.signal);
                var msg = this.r.parse_coords(unit.signal);

                if (header == '1111'){
                    this.r.log("decoded");
                    this.r.log(msg);
                    var rad = this.r.r_squared(...msg, this.r.me.x, this.r.me.y);
                    this.r.log(rad);
                    if (rad <= 16){
                        this.r.log("valid fct");
                        fire_control_target = msg.slice();
                    } 
                    break
                }
            }
        }

        var atk = this.r.get_closest_attackable_enemy_unit(units, this.priority_list);
        if (atk != null){
            var new_fire_control = this.r.preacher_fire_control(units);
            if (new_fire_control != null){
                this.r.signal_encode("1111", ...new_fire_control, 16);
            }
            return this.r.attack(atk[0]-this.r.me.x, atk[1]-this.r.me.y)
        }

        if (fire_control_target != null){
            this.r.log(fire_control_target);
            return this.r.attack(fire_control_target[0]-this.r.me.x, fire_control_target[1]-this.r.me.y)
        }

        if (this.r.me.x%2 != 0 || this.r.me.y%2 != 0 ||this.r.karbonite_map[this.r.me.y][this.r.me.x] || this.r.fuel_map[this.r.me.y][this.r.me.x] ){
            var path = this.r.flood_fill(this.r.me.x, this.r.me.y, null, this.lattice_occupancy, this.sym, 90);
            if (path != null) return this.r.move(path[0][0]-this.r.me.x, path[0][1]-this.r.me.y)
        }

    }
}

function create_bot(bot){
    if (bot.me.unit === SPECS.CASTLE){
        return new Castle(bot)
    }
    if (bot.me.unit === SPECS.PILGRIM){
        return new Pilgrim(bot)
    }
    if (bot.me.unit === SPECS.PROPHET){
        return new Preacher(bot)
    }
    if (bot.me.unit === SPECS.PREACHER){
        return new Preacher(bot)
    }
}

var step = -1;

class MyRobot extends BaseBot{
    constructor(){
        super();
        this.bot = null;
    }
    turn(){
        step ++;
        if (this.bot == null){
            this.bot = create_bot(this);
        }
        return this.bot.turn(step)
    }
}

var robot = new MyRobot();

var robot = new MyRobot();
