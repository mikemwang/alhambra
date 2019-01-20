import {SPECS} from 'battlecode'

class Castle{
    turn(robot){
      robot.log('step:'+robot.step)
      robot.log('nearest_karb:'+robot.nearest_karb)
        if (robot.step == 0){
            robot.sym = robot.find_sym(robot.map)
            robot.initalize_coor()
            var x_start = 0
            var x_bound = robot.W -1
            var y_start = 0
            var y_bound = robot.H -1
            var best_dist = 1000
            robot.determine_bounds(x_start, x_bound, y_start, y_bound);
            robot.determine_nearest_karb(x_start, x_bound, y_start, y_bound, best_dist);
            robot.determine_nearest_karb2(10);
            robot.determine_nearest_fuel(x_start, x_bound, y_start, y_bound, best_dist);

            robot.castleTalk(Math.min(255, best_dist))
            robot.num_castles = robot.getVisibleRobots().length

            // find corresponding enemy castle
            robot.determine_opp_castle();

            // check if other castles have published //determines the maincastle
            var units = robot.getVisibleRobots()
            var i_am_last = true
            var i_am_best = true
            for (var i in units){
                if (units[i].id != robot.me.id){
                    if (units[i].castle_talk == 0){
                        i_am_last = false
                    } else if (units[i].castle_talk <= best_dist) {
                        i_am_best = false
                        robot.maincastle = false
                    }
                }
            }
            if (i_am_last && i_am_best){
                robot.maincastle = true
            }

        }

        else if (robot.step == 1){
            if (robot.maincastle == null){
                var units = robot.getVisibleRobots()
                if (units.length > robot.num_castles){
                    robot.maincastle = false
                }

                for (var i in units){
                    if (units[i].castle_talk < robot.me.castle_talk && units[i].id != robot.me.id) {
                        robot.maincastle = false
                    }
                }

                if (robot.maincastle == null){
                    robot.maincastle = true
                }
            }
            if (!robot.maincastle){
                robot.castleTalk(255)
            }
            ///* PATH TESTING
            if (robot.maincastle){
                if (robot.num_preachers < 1 && robot.maincastle){
                    robot.num_preachers ++;
                    // find free tile to build preacher
                    return robot.buildUnit(SPECS.PREACHER, ...robot.find_free_adjacent_tile(robot.me.x, robot.me.y));
                }
            }

            //PATH TESTING*/
            return
        }

        //// PATH TESTING
        //if (robot.step > 1){
        //    if (!robot.maincastle) {
        //        return
        //    }
        //    robot.log(robot.step)
        //    if (robot.karbonite < 10){
        //        return
        //    }
        //    return robot.buildUnit(SPECS.PILGRIM, ...robot.find_free_adjacent_tile(robot.me.x, robot.me.y))
        //}
        //// PATH TESTING

        else if (robot.step <= 3){
            if (robot.maincastle){
                robot.num_preachers ++
                return robot.buildUnit(SPECS.PREACHER, ...robot.find_free_adjacent_tile(robot.me.x, robot.me.y));
            }
        } else {
            //if (robot.maincastle && (robot.num_pilgrims < 1 && robot.nearest_karb_d < 3 || robot.num_pilgrims < 2 && robot.nearest_karb_d >= 3)){
            // if (!robot.maincastle){
            //     return
            // }
            robot.log('#prophets: ' + robot.num_prophets)
            if (robot.enough_resources(SPECS.PROPHET) && robot.step % 5 == 0){
                robot.num_prophets ++
                return robot.buildUnit(SPECS.PROPHET, ...robot.find_free_adjacent_tile(robot.me.x, robot.me.y));
            }
            if (robot.enough_resources(SPECS.PREACHER) && robot.step % 6 == 1){
                robot.num_preachers ++
                return robot.buildUnit(SPECS.PREACHER, ...robot.find_free_adjacent_tile(robot.me.x, robot.me.y));
            }
            // if (robot.num_pilgrims < 1 && robot.enough_resources(SPECS.PILGRIM)){
            if (robot.enough_resources(SPECS.PILGRIM) && robot.num_pilgrims < 3){
                robot.num_pilgrims ++
                robot.log('#pilgrim: ' + robot.num_pilgrims)
                var karb_x_bin = robot.nearest_karb[0].toString(2)
                var karb_y_bin = robot.nearest_karb[1].toString(2)
                var fuel_x_bin = robot.nearest_fuel[0].toString(2)
                var fuel_y_bin = robot.nearest_fuel[1].toString(2)
                var zeros = ""
                if (karb_x_bin.length < 6){
                    for (var i = 0; i < 6-karb_x_bin.length; i++){
                        zeros = zeros + "0"
                    }
                }
                karb_x_bin = zeros + karb_x_bin

                var zeros = ""
                if (karb_y_bin.length < 6){
                    for (var i = 0; i < 6-karb_y_bin.length; i++){
                        zeros = zeros + "0"
                    }
                }
                karb_y_bin = zeros + karb_y_bin

                if (fuel_x_bin.length < 6){
                    for (var i = 0; i < 6-fuel_x_bin.length; i++){
                        zeros = zeros + "0"
                    }
                }
                fuel_x_bin = zeros + fuel_x_bin

                var zeros = ""
                if (fuel_y_bin.length < 6){
                    for (var i = 0; i < 6-fuel_y_bin.length; i++){
                        zeros = zeros + "0"
                    }
                }
                fuel_y_bin = zeros + fuel_y_bin

                // if (robot.karbonite < robot.fuel + 1000){
                if (robot.step % 2 == 0){
                  var message = "1000"+karb_x_bin+karb_y_bin
                  robot.signal(parseInt(message, 2), 2)
                } else {
                  var message = "1100"+fuel_x_bin+fuel_y_bin
                  robot.signal(parseInt(message, 2), 2)
                }

                return robot.buildUnit(SPECS.PILGRIM, ...robot.find_free_adjacent_tile(robot.me.x, robot.me.y));

            }
        }
        return
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
