import {SPECS} from 'battlecode'

class Preacher{
    turn(robot){
        robot.log("I AM PREACHER")
        // find the nearest allied castle
        var units = robot.attack_priority(robot.getVisibleRobots())
        var castle_coords = null
        for (var i in units){
            if (units[i].team != robot.me.team){
                var enemy_unit = [units[i].x, units[i].y]
                var atk = [[0,0]]
                atk.push(robot.mvmt_choices.slice())
                var friendly_fire = false
                for (var a in atk){
                    for (var j in units){
                        if (units[j].team == robot.me.team && robot.is_adjacent(...enemy_unit, units[j].x, units[j].y)){
                            friendly_fire = true
                            break
                        }
                    }
                    if (!friendly_fire){
                        enemy_unit = [enemy_unit[0] + atk[a][0], enemy_unit[1] + atk[a][1]]
                        break
                    }
                }
                robot.log ("NOW ATTACKING: " + (enemy_unit[0]-robot.me.x) + " " + (enemy_unit[1]-robot.me.y))
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
                //robot.log("ENEMY CASTLE AT: " + robot.enemy_castles[i])
                var path = robot.bfs(robot.me.x, robot.me.y, robot.enemy_castles[i][0], robot.enemy_castles[i][1])
                //robot.log("THIS IS MY PATH: " + path)
                if (path !== null && path.length < closest_d){
                    closest_d = path.length
                    robot.nearest_enemy_castle = robot.enemy_castles[i]
                    path_to_enemy_castle = path
                }
            }
        }
        // can the nearest allied castle still spawn units?
        //if (castle_coords != null && robot.find_free_adjacent_tile(...castle_coords) == null && robot.is_adjacent(robot.me.x, robot.me.y, ...castle_coords)){
        // move to enemy castle

        if(path!== null){
            //robot.log ("I AM MOVING THIS MUCH: " +  (path_to_enemy_castle[0][0] - robot.me.x) + " " + (path_to_enemy_castle[0][1] - robot.me.y))
            return robot.move(path_to_enemy_castle[0][0] - robot.me.x, path_to_enemy_castle[0][1] - robot.me.y)
        } else {
            //robot.log("NOT MOVING BC KILLED CASTLE ALREADY")
        }

        //}
    }
}


export function create_preacher(num){
    if (num === SPECS.PREACHER){
        return new Preacher()
    }
}
