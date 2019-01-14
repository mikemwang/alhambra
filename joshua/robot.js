import {BCAbstractRobot, SPECS} from 'battlecode';

// single castle seed: 983275

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
        this.enemy_castles = []
        this.nearest_karb = null
        this.nearest_karb_d = null
        this.nearest_allied_castle = null
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

    bfs(x, y) {
        /*
        args: in a goal x and y
        returns: the next point to which the robot should move, null if no path

        ***notes
        traffic-jam behavior: if the way to the goal, or the goal itself, is
        blocked by another robot, this robot will stop
        */

        var paths = [[[this.me.x, this.me.y]]]

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

        this.used_map[this.me.y][this.me.x] = true
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
                                return [newpath[1][0] - this.me.x, newpath[1][1] - this.me.y] // since newpath[0] is the robot's starting point
                            }
                            new_paths.push(newpath)
                        }
                    }
                }
            }
            if (new_paths.length > 0) {
                paths = new_paths.slice(0, new_paths.length)
            }
        }
        this.log("no path found")
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

        if (this.me.unit === SPECS.PREACHER){
            //return this.move_toward_location(0,H);
            return this.move(...this.bfs(this.W-1,this.H-1))
            // move toward nearest fuel
            // mine
            // move toward nearest castle/church
            // deposit

            // move toward nearest karbonite
            // mine
            // move to castle/church
            // deposit
        }

        if (this.me.unit === SPECS.CASTLE) {
            if (step % 10 === 0) {
                // this.log(this.getVisibleRobots())
                var unit_types = [SPECS.PILGRIM]//, SPECS.CRUSADER, SPECS.PROPHET, SPECS.PREACHER]
                var unit = unit_types[Math.floor(Math.random()*unit_types.length)];
                var unit_names = ['PILGRIM']//, 'CRUSADER', 'PROPHET', 'PREACHER']
                var unit_name = unit_names[unit - 1]
                this.log('Building a ' + unit_name + ' at '+ (this.me.x+1) + ", " + (this.me.y+1))
                return this.buildUnit(unit, 1, 1);
            } else {
                return // this.log("Castle health: " + this.me.health);
            }
        }
    }
}

var robot = new MyRobot();
