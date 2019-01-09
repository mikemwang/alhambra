import {BCAbstractRobot, SPECS} from 'battlecode';

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
        this.pilgrim_phase = "TO_FUEL";
        //this.mvmt_choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
        //this.mvmt_choices = [[1,0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        this.mvmt_choices = [[0,1],
                             [1,1], 
                             [1,0], 
                             [1,-1], 
                             [0,-1], 
                             [-1,-1], 
                             [-1,0], 
                             [-1,1]]
        this.explored_map = null
        this.W = null
        this.H = null
    }

    dir_list_centered(center) {
        var result = [];
        result.push(this.mvmt_choices[center]);
        for (var i = 1; i < 4; i++){
            result.push(this.mvmt_choices[(center-i+8)%8]);
            result.push(this.mvmt_choices[(center+i+8)%8]);
        }
        result.push(this.mvmt_choices[(center+4)%8])
        return result;
    }

    choose_best_dir(dir){
        var choices = this.dir_list_centered(dir);
        for (var i in choices){
            var cmd = choices[i];
            var x = this.me.x + cmd[0];
            var y = this.me.y + cmd[1];
            if (this.in_bounds(x, y) && this.getVisibleRobotMap()[y][x] <= 0) {
                return cmd;
            }
        }
        return [0,0];

    }

    move_toward_location(x, y) {
        // TODO: add random variations in movement, and jumping
        var dx = x - this.me.x;
        var dy = y - this.me.y;
        var d = dx*dx + dy*dy;
        var s = SPECS.UNITS[this.me.unit].SPEED;
        if ( d <= s) {
            return this.move(x, y);
        }
        dx += Math.sign(dx)*0.01;
        var tan = dy/dx;
        //this.log("move from (" + (this.me.x) + ", " + (this.me.y) +") to ("+(x) + ", " + (y) + "): " + (tan));
        var choice = [0,0];

        if (dy >= 0 && dx > 0){ 
            if (tan <0.41){
                // east
                choice = this.choose_best_dir(0);
            }
            else if (tan >= 0.41 && tan <2.41){
                // northeast
                choice = this.choose_best_dir(1);
            }
            else {
                // north
                choice = this.choose_best_dir(2);
            }
        }
        if (dy >= 0 && dx < 0){
            if (tan <= -2.41){
                // north
                choice = this.choose_best_dir(2);
            }
            else if (tan <= -0.41 && tan >-2.41){
                // northwest
                choice = this.choose_best_dir(3);
            }
            else {
                // west
                choice = this.choose_best_dir(4);
            }
        }
        if (dy <= 0 && dx < 0){ 
            if (tan > 2.41){
                // south
                choice = this.choose_best_dir(6);
            }
            else if (tan >= 0.41 && tan <2.41){
                // southwest
                choice = this.choose_best_dir(5);
            }
            else {
                // west
                choice = this.choose_best_dir(4);
            }
        }
        if (dy <= 0 && dx > 0){
            if (tan <= -2.41){
                // south
                choice = this.choose_best_dir(6);
            }
            else if (tan <= -0.41 && tan >-2.41){
                // southeast
                choice = this.choose_best_dir(7);
            }
            else {
                // east
                choice = this.choose_best_dir(0);
            }
        }
        return this.move(choice[0], choice[1])
        //this.log("move from (" + (this.me.x) + ", " + (this.me.y) +") to ("+(x) + ", " + (y)+"): " + (sdx) + " ," + (sdy));
    }

    square_d(x1, y1, x2, y2) {
        return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)
    }

    in_bounds(x, y) {
        return (x >= 0 && x < this.W && y >= 0 && y < this.H)
    }

    bfs(x, y) {
        // init the map used for storing explored nodes
        var paths = [[[this.me.x, this.me.y]]]

        if (this.explored_map == null) {
            this.explored_map = this.map.slice(0, this.map.length)
        }

        for (var j in this.explored_map){
            for (var i in this.explored_map[0]){
                this.explored_map[j][i] = false
            }
        }

        this.explored_map[this.me.y][this.me.x] = true

        var iters = 0
        while (paths.length > 0){
            this.log((iters))
            this.log(paths)
            iters ++
            if (iters > 3) {
                break
            }
            var new_paths = []
            var cur_path = paths.shift()  // get the path in the beginning
            for (var i in this.mvmt_choices){
                var newx = cur_path[cur_path.length-1][0] + this.mvmt_choices[i][0] 
                var newy = cur_path[cur_path.length-1][1] + this.mvmt_choices[i][1]
                //if (this.in_bounds(newx, newy) && this.map[newy][newx]){
                if (this.in_bounds(newx, newy)){
                    if (!this.explored_map[newy][newx]){
                        this.explored_map[newy][newx] = true
                        var newpath = cur_path.slice(0, cur_path.length)
                        newpath.push([newx, newy])
                        if (newx == x && newy == y) {
                            return newpath
                        }
                        new_paths.push(newpath)
                    }
                }
            }
            if (new_paths.length > 0) {
                paths = new_paths.slice(0, new_paths.length)
            }
        }
//        this.log(iters)
        this.log("no path found")
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
            //this.log(this.bfs(this.me.x+5,this.me.y+2))
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
            return
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