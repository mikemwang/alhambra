import {BCAbstractRobot, SPECS} from 'battlecode';
// import './funcfile.js'

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

class MyRobot extends BCAbstractRobot {
    constructor(){
        super();
        this.my_castles = {}
    }

    initalizes_my_castles_list(units){
      this.log(units)
      for (var i in units){
        if (units[i].unit === SPECS.CASTLES){
          this.my_castles[units[i].id] = [-1,-1]
        }
        if (units[i].id == this.me.id){
          this.my_castles[this.me.id] = [this.me.x, this.me.y]
          this.log(this.my_castles)
        }
      }
    }

    friendly_castles(units){
        if (Object.keys(this.my_castles).length === 0) {
          this.initalizes_my_castles_list(units)
        }
        if (this.me.turn <= 2){
          this.castleTalk(this.me.x)
        }
        if (this.me.turn <= 4 && this.me.turn > 2){
          this.castleTalk(this.me.y)
        }
        for (var i in units){
          // this.log('units#'+String(units[i].id)+'-turn#'+units[i].turn+':'+units[i].castle_talk)
          if (this.my_castles[units[i].id][0] == -1 && units[i].castle_talk != 0 && units[i].turn <= 2){
            this.my_castles[units[i].id][0] = units[i].castle_talk
          }
          if (this.my_castles[units[i].id][1] == -1 && units[i].castle_talk != 0 && units[i].turn > 2 && units[i].turn <= 4){
            this.my_castles[units[i].id][1] = units[i].castle_talk
          }
        }
    }


    turn() {
        step++;
        var units = this.getVisibleRobots()
        if (this.me.unit === SPECS.CASTLE) {
          if(this.me.turn <= 4){
            this.friendly_castles(units)
          }
          this.log(this.my_castles)
        }
    }

}


var robot = new MyRobot();
