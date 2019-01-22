import {create_castle} from 'castlefile.js';
import {create_pilgrim} from 'pilgrimfile.js';
import {create_preacher} from 'preacherfile.js';
import {create_prophet} from 'prophetfile.js';
import {BaseBot} from 'funcfile.js'
// temp
import {SPECS} from 'battlecode';

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
//determine_nearest_karb(x_start, x_bound, y_start, y_bound) =

class MyRobot extends BaseBot {
    constructor(){
        super()
        this.bot = null
    }

    turn() {
        this.initalize_coor()
        this.step++;
        if (this.bot == null){
          if (this.me.unit === SPECS.PILGRIM){
            this.bot = create_pilgrim(this.me.unit)
          }
          if (this.me.unit === SPECS.PREACHER){
            this.bot = create_preacher(this.me.unit)
          }
          if (this.me.unit === SPECS.PROPHET){
            this.bot = create_prophet(this.me.unit)
          }
          if (this.me.unit === SPECS.CASTLE) {
            this.bot = create_castle(this.me.unit)
          }
        }
        return this.bot.turn(this)
    }
}

var robot = new MyRobot();
