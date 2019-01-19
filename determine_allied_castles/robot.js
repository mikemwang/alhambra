import {create_bot} from 'botfile.js';
import {BaseBot} from 'funcfile.js'

// signals
// 1000: mine location

// 1001, 1010, 1011: enemy castle info ping
// 1100: require msg[1:0] enemy castle coordinate

// 1101: attack directive

// 1111: needs more space
// 

// castletalk parsing
// 255: maincastle requesting enemy castle x pos
// 254: requesting enemy castle y pos 
// 253: group reports victory, increment target castle and send next wave

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
            this.bot = create_bot(this.me.unit)
        }
        this.bot.turn(this)
    }
}

var robot = new MyRobot();
