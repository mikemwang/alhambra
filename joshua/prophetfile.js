import {SPECS} from 'battlecode'

class Prophet{
    turn(robot){
        robot.log("I AM PROPHET")
        // find the nearest allied castle
        var units = robot.getVisibleRobots()
        var castle_coords = null
        for (var i in units){
            if (units[i].team != robot.me.team){
                var enemy_unit = [units[i].x, units[i].y]
                return robot.attack(enemy_unit[0]-robot.me.x, enemy_unit[1]-robot.me.y)
            }
            if (units[i].unit == SPECS.CASTLE && units[i].unit == robot.me.team) {
                castle_coords = [units[i].x, units[i].y]
            }
        }

        // start populating the enemy castle list
        if (robot.enemy_castles.length == 0){
            robot.sym = robot.find_sym(robot.map)
            var mirror_coord = robot.me.y
            if (robot.sym == 'y'){
                mirror_coord = robot.me.x
            }
            mirror_coord = (robot.H - robot.H%2)-mirror_coord + ((robot.H%2) - 1)
            if (robot.sym == 'y'){
                robot.nearest_enemy_castle = [mirror_coord, robot.me.y]
            } else {
                robot.nearest_enemy_castle = [robot.me.x, mirror_coord]
            }
            robot.enemy_castles.push(robot.nearest_enemy_castle)
        }

        // find the closest enemy castle
        var closest_d = 1000
        var path_to_enemy_castle = []
        if (robot.enemy_castles.length >= 1){
            for (var i in robot.enemy_castles){
                var path = robot.bfs(robot.me.x, robot.me.y, robot.enemy_castles[i][0], robot.enemy_castles[i][1])
                if (path != null && path.length < closest_d){
                    closest_d = path.length
                    robot.nearest_enemy_castle = robot.enemy_castles[i]
                    path_to_enemy_castle = path
                }
            }
        }
        // // move to front line (facing enemy castle)
        // if (path_to_enemy_castle.length > 0){
        //     // no adjacent to prevent splash
        //     if (castle_coords != null && robot.is_adjacent(robot.me.x, robot.me.y, ...castle_coords)){
        //         return robot.move(path_to_enemy_castle[0][0] - robot.me.x, path_to_enemy_castle[0][1] - robot.me.y)
        //     }
        // }

        // // make sure you're not on a karb
        // if (robot.karbonite_map[robot.me.y][robot.me.x]){
        //     if (path.length == 0){
        //         var move = robot.find_free_adjacent_tile(robot.me.x, robot.me.y)
        //         return robot.move(...move)
        //     }
        //     return robot.move(path_to_enemy_castle[0][0] - robot.me.x, path_to_enemy_castle[0][1] - robot.me.y)
        // }

        return robot.move(path_to_enemy_castle[0][0] - robot.me.x, path_to_enemy_castle[0][1] - robot.me.y)
    }
}


export function create_prophet(num){
    if (num === SPECS.PROPHET){
        return new Prophet()
    }
}
