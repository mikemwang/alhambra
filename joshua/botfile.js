import {SPECS} from 'battlecode'

class Castle{
    turn(robot){
        robot.log("I AM CASTLE")
    }
}


class Pilgrim{

}

class Crusader{

}

class Prophet{

}

class Preacher{

}

export function create_bot(num){
    if (num === SPECS.CASTLE){
        return new Castle()
    }
}
