import {BCAbstractRobot, SPECS} from 'battlecode';

var built = false;
var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;

        if (this.me.unit === SPECS.PREACHER) {
            // this.log("Crusader health: " + this.me.health);
		var visible = this.getVisibleRobots(); //gets both visible and radioable robots
                for (var i = 0; i< visible.length; i++) {
                        if (this.isVisible(visible[i]) && (this.me.team !== visible[i].team)) { //if visible and not same team
                                var dx = visible[i].x-this.me.x;
                                var dy = visible[i].y-this.me.y;
                                this.log("Attacking enemy robot at " + dx + " "+ dy);
                                return this.attack(dx,dy);
                        }
                }
        	const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            	const choice = choices[Math.floor(Math.random()*choices.length)]
            	return this.move(...choice);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            if (step % 10 === 0) {
                this.log("Building a preacher at " + (this.me.x+1) + ", " + (this.me.y+1));
                return this.buildUnit(SPECS.PREACHER, 1, 1);
            } else {
                return // this.log("Castle health: " + this.me.health);
            }
        }

    }

   
}

var robot = new MyRobot();
