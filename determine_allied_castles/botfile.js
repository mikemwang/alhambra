import {SPECS} from 'battlecode'

class Castle{
    turn(robot){
        robot.log("I AM CASTLE")
    }
}

export function create_bot(num){
    if (num === SPECS.CASTLE){
        return new Castle()
    }
}
