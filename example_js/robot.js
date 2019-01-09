import {BCAbstractRobot, SPECS} from 'battlecode';

// single castle seed: 983275

var built = false;
var step = -1;

//class Castle extends BCAbstractRobot {
//    constructor(){
//        super();
//        this.num_pilgrims = 0;
//    }
//}

class MyRobot extends BCAbstractRobot {
    constructor(){
        super();
        this.num_pilgrims = 0;
        this.mvmt_choices = [[-1,-1], [+0,-1], [+1,-1], 
                             [-1,+0],          [+1,+0], 
                             [-1,+1], [+0,+1], [+1,+1]]
        this.used_map = null
        this.W = null
        this.H = null
    }

    in_bounds(x, y) {
        // check if a tile is in bounds
        return (x >= 0 && x < this.W && y >= 0 && y < this.H)
    }

    traversable(x, y, visible_robot_map) {
        // check if a square is in bounds, not terrain, and not occupied
        return (this.in_bounds(x, y) && this.map[y][x])//&& visible_robot_map[y][x] <= 0)
    }

    bfs(x, y) {
        /*
        takes in a goal x and y, returns where the robot should move next
        */
        // init the map used for storing explored nodes

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
                for (var i in this.mvmt_choices){
                    var newx = cur_path[cur_path.length-1][0] + this.mvmt_choices[i][0] 
                    var newy = cur_path[cur_path.length-1][1] + this.mvmt_choices[i][1]
                    //if (this.in_bounds(newx, newy) && this.map[newy][newx]){
                    //if (this.in_bounds(newx, newy)){
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
        return [this.me.x,this.me.y]
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
            if (this.num_pilgrims < 1){
                this.num_pilgrims ++;
                // find free tile to build pilgrim
                for (var i in this.mvmt_choices){
                    var choice = this.mvmt_choices[i];
                    var x = this.me.x + choice[0];
                    var y = this.me.y + choice[1];
                    if (x < this.W && y < this.H){
                        if (this.map[y][x]){
                            this.log("Build PILGRIM at " + (x) + ", " + (y));
                            return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);
                        }
                    }
                }
            }
       }
    }
}

var robot = new MyRobot();