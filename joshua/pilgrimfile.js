import {SPECS} from 'battlecode'

class Pilgrim{
    turn(robot){
        robot.log("I AM PILGRIM")
        var units = robot.getVisibleRobots()
        if (robot.nearest_karb == null){
            for (var i in units){
                if (units[i].unit == SPECS.CASTLE && units[i].signal_radius > 0){
                    robot.nearest_allied_castle = [units[i].x, units[i].y]
                    var parsestring = units[i].signal.toString(2)
                    if (parsestring.slice(0,4) == "1000"){
                        var kx = parsestring.slice(4,10)
                        var ky = parsestring.slice(10,16)
                        robot.nearest_karb = [parseInt(kx,2), parseInt(ky,2)]
                    }
                }
            }
        } else if (robot.nearest_fuel == null){
            for (var i in units){
                if (units[i].unit == SPECS.CASTLE && units[i].signal_radius > 0){
                    robot.nearest_allied_castle = [units[i].x, units[i].y]
                    var parsestring = units[i].signal.toString(2)
                    if (parsestring.slice(0,4) == "1100"){
                        var fx = parsestring.slice(4,10)
                        var fy = parsestring.slice(10,16)
                        robot.nearest_fuel = [parseInt(fx,2), parseInt(fy,2)]
                    }
                }
            }
        }

        if (robot.me.karbonite < 20 && robot.nearest_karb !== null){
            if (robot.karbonite_map[robot.me.y][robot.me.x]){
                return robot.mine()
            }
            var path = robot.bfs(robot.me.x, robot.me.y, ...robot.nearest_karb, true)
            if (path != null){
                if(robot.traversable(...path[0], robot.getVisibleRobotMap())){
                    return robot.move(path[0][0]-robot.me.x, path[0][1]-robot.me.y)
                }
            }
        } else if (robot.me.fuel < 100 && robot.nearest_fuel !== null){
            if (robot.fuel_map[robot.me.y][robot.me.x]){
                return robot.mine()
            }
            var path = robot.bfs(robot.me.x, robot.me.y, ...robot.nearest_fuel, true)
            if (path != null){
                if(robot.traversable(...path[0], robot.getVisibleRobotMap())){
                    return robot.move(path[0][0]-robot.me.x, path[0][1]-robot.me.y)
                }
            }
        }

        var to_castle = robot.bfs(robot.me.x, robot.me.y, ...robot.nearest_allied_castle, true)
        if (robot.me.karbonite == 20 || robot.me.fuel == 100){
            if (robot.is_adjacent(robot.me.x, robot.me.y, ...robot.nearest_allied_castle)){
                return robot.give(robot.nearest_allied_castle[0]-robot.me.x, robot.nearest_allied_castle[1]-robot.me.y, 20, 0)
            }
            else {
                if (to_castle != null){
                    return robot.move(to_castle[0][0]-robot.me.x, to_castle[0][1]-robot.me.y)
                }
                robot.signal(parseInt("1111000000000000", 2), 4)
            }

        }
    }
}


export function create_pilgrim(num){
    if (num === SPECS.PILGRIM){
        return new Pilgrim()
    }
}
