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

        if (this.fuel < Math.ceil(Math.sqrt(radius))) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw "Signal radius is too big.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= radius;
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

class Castle{
    turn(robot){
        robot.log("I AM CASTLE");
    }
}

function create_bot(num){
    if (num === SPECS.CASTLE){
        return new Castle()
    }
}

class BaseBot extends BCAbstractRobot{
    constructor(){
        super();
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1],
                             [-1,-0],        , [+1, 0],
                             [-1,+1], [+0,+1], [+1, +1]];
        this.used_map = null;
        this.allied_castle_finder = new Allied_Castle_Finder();
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

        var paths = [[[startx, starty]]];

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
                    if (this.traversable(newx, newy, visible_robot_map) || (ignore_goal && newx==x && newy==y)){
                        if (!used_map[newy][newx]){
                            used_map[newy][newx] = true;
                            var newpath = cur_path.slice(0, cur_path.length);
                            newpath.push([newx, newy]);
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
        var map = this.getVisibleRobotMap();
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
        this.signal(parseInt(message, 2), range);
    }

    traversable(x, y, visible_robot_map) {
        // check if a square is in bounds, not terrain, and not occupied
        return (this.in_bounds(x, y) && this.map[y][x] && visible_robot_map[y][x] <= 0)
    }

}

class Allied_Castle_Finder{
    /*
    call find() every turn
    on the 4th turn, it will know all the allied castles. this.done will be true
    this.allied_castle_list is a list of all allied castles, sorted by castle ID
    so all castles have the same list, in the same order
    */
    constructor(myrobot){
        this.myrobot = myrobot;
        this.phase = 0;
        this.allied_castles = {};
        this.allied_castle_list = [];
        this.done = false;
    }
    find(units){
        if (this.done){
            return
        }
        if (this.phase == 0){
            this.allied_castles[this.myrobot.me.id] = [this.myrobot.me.x, this.myrobot.me.y];
            this.myrobot.castleTalk(this.myrobot.me.x + 1);
        } else if (this.phase == 1){
            this.myrobot.castleTalk(this.myrobot.me.x + 1);
            for (var i in units){
                if (units[i].id != this.myrobot.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id] = [units[i].castle_talk - 1, 0];
                }
            }
        } else if (this.phase == 2){
            this.myrobot.castleTalk(this.myrobot.me.y + 1);
        } else if (this.phase == 3){
            this.myrobot.castleTalk(this.myrobot.me.y + 1);
            for (var i in units){
                if (units[i].id != this.myrobot.me.id && units[i].castle_talk != 0){
                    this.allied_castles[units[i].id][1] = units[i].castle_talk - 1;
                }
            }
            var keys = Object.keys(this.allied_castles);
            keys.sort();
            for (var i in keys){
                this.allied_castle_list.push(this.allied_castles[keys[i]]);
            }
            this.done = true;
        }
        this.phase ++;
    }
}

class MyRobot extends BaseBot{
    constructor(){
        super();
        this.bot = null;
    }
    turn(){
        if (this.bot == null){
            this.bot = create_bot(this.me.unit);
        }
        this.bot.turn(this);
    }
}

var robot = new MyRobot();

var robot = new MyRobot();
