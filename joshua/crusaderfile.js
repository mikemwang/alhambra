import {SPECS} from 'battlecode'

class Crusader{
    turn(robot){
        robot.log("I AM CRUSADER")

    }
}


export function create_crusader(num){
    if (num === SPECS.CRUSADER){
        return new Crusader()
    }
}
