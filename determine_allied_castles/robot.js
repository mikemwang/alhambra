import {create_bot} from 'botfile.js';
import {BaseBot} from 'funcfile.js'

var built = false;
var step = -1;

class MyRobot extends BaseBot{
    constructor(){
        super()
        this.bot = null
    }
    turn(){
        step ++
        if (this.bot == null){
            this.bot = create_bot(this)
        }
        return this.bot.turn(step)
    }
}

var robot = new MyRobot();
