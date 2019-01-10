import {BCAbstractRobot, SPECS} from 'battlecode';

var built = false;
var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;
        // var pmap = get_pmap(this.map)
        // for (var i = 0; i < pmap.length; i++) {
        //   this.log(pmap[i])
        // }
//////////////////////////////////////////////////////////////////////////
        var pmap = Array.apply(null, Array(this.map.length))
        var row = pmap.map(function (x, i) { return 0 });
        var pmap = pmap.map(function (x, i) { return row });

        for (var i = 0; i < this.map.length; i++) {
          for (var j = 0; j < this.map.length; j++) {
            pmap.slice()[i][j] = Number(this.map[i][j])
          }
          this.log(pmap[i])
        }
//////////////////////////////////////////////////////////////////////////
        var sym_axis = find_sym(this.map);
        this.log(sym_axis)
//////////////////////////////////////////////////////////////////////////
        if (this.me.unit === SPECS.PILGRIM) {
            // this.log("Crusader health: " + this.me.health);
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.CRUSADER) {
            // this.log("Crusader health: " + this.me.health);
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.PROPHET) {
            // this.log("Crusader health: " + this.me.health);
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.PREACHER) {
            // this.log("Crusader health: " + this.me.health);
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            if (step % 10 === 0) {
                // this.log(this.getVisibleRobots())
                var unit_types = [SPECS.PILGRIM, SPECS.CRUSADER, SPECS.PROPHET, SPECS.PREACHER]
                var unit = unit_types[Math.floor(Math.random()*unit_types.length)];
                var unit_names = ['PILGRIM', 'CRUSADER', 'PROPHET', 'PREACHER']
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

function find_sym(map){
  for (var i = 0; i < map.length; i++){
    for (var j = 0; j < map.length; j++){
      var ii = map.length - 1 - i
      if (map[i][j] !== map[ii][j]){
        return 'y'
      }
    }
  }
  return 'x'
}


//////////////////////////////////////////////////////////////////////////
// function get_pmap(map){
//   var pmap = Array.apply(null, Array(map.length))
//   var row = pmap.map(function (x, i) { return 0 });
//   pmap = pmap.map(function (x, i) { return row });
//   for (var i = 0; i < map.length; i++) {
//     for (var j = 0; j < map[0].length; j++) {
//       pmap[i][j] = Number(map[i][j])
//     }
//   }
//   return pmap
// }
//////////////////////////////////////////////////////////////////////////
