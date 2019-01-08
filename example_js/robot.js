import {BCAbstractRobot, SPECS} from 'battlecode';

var built = false;
var step = -1;
var num_pilgrims = 0;

class MyRobot extends BCAbstractRobot {
    turn() {
        var H = this.map.length;
        var W = this.map[0].length;
        step++;

        //if (this.me.unit === SPECS.CRUSADER) {
        //    // this.log("Crusader health: " + this.me.health);
        //    const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
        //    const choice = choices[Math.floor(Math.random()*choices.length)]
        //    return this.move(...choice);
        //    //return this.move(choice[0], choice[1])
        //}

        if (this.me.unit === SPECS.CASTLE) {
            if (num_pilgrims < 1){
                num_pilgrims ++;
                var choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                // find free tile to build pilgrim
                for (var i in choices){
                    var choice = choices[i];
                    var x = this.me.x + choice[0];
                    var y = this.me.y + choice[1];
                    if (x < W && y < H){
                        if (this.map[y][x]){
                            this.log("Build PILGRIM at " + (this.me.x+choice[0]) + ", " + (this.me.y+choice[1]));
                            return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);
                        }
                    }
                }
            }
            // determine symmetry so we know where enemy castles are
            
            //if (step % 10 === 0) {
            //    this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
            //    return this.buildUnit(SPECS.CRUSADER, 1, 1);
            //} else {
            //    return // this.log("Castle health: " + this.me.health);
            //}
        }

    }
}

var robot = new MyRobot();