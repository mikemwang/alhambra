import {SPECS} from 'battlecode'
import {Allied_Castle_Finder} from 'funcfile.js'
 

export class Castle{
    constructor(r){
        this.resource_kernel = [[1.54, 1.54, 1.54, 1.54, 1.54],
                                [1.54, 1.82, 1.82, 1.82, 1.54],
                                [1.54, 1.82, 0.00, 1.82, 1.54],
                                [1.54, 1.82, 1.82, 1.82, 1.54],
                                [1.54, 1.54, 1.54, 1.54, 1.54]]
        this.allied_castle_list = null
        this.castle_turn_order = null
        this.defensive_build = null
        this.economy = true
        this.enemy_castle_list = null
        this.num_finished_econ = 0
        this.num_castles = null
        this.num_pilgrims = 0
        this.num_prophets = 0
        this.num_preachers = 0
        this.max_pilgrim_range = 5
        this.r = r
        this.synced_build = false
        this.resource_saturation = null
        this.rush_distance = null
        this.sym = null
    }

    turn(step){
        this.defensive_build = null
        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        if (this.r.allied_castle_finder == null){
            this.r.allied_castle_finder = new Allied_Castle_Finder(this.r)
        }

        var units = this.r.getVisibleRobots()

        this.r.allied_castle_finder.find(units, this.sym)
        if (this.r.allied_castle_finder.done && this.allied_castle_list == null){
            this.allied_castle_list = this.r.allied_castle_finder.allied_castle_list.slice()
            this.enemy_castle_list = this.r.allied_castle_finder.enemy_castle_list.slice()
            this.castle_turn_order = this.r.allied_castle_finder.castle_turn_order
            this.num_castles = this.r.allied_castle_finder.num_castles
            var d = 999
            for (var i in this.enemy_castle_list){
                var e = this.r.bfs(this.r.me.x, this.r.me.y, ...this.enemy_castle_list[i])
                if (e != null && e.length < d){
                    d = e.length
                }
            }
            this.rush_distance = d
        }

        if (this.resource_saturation == null){
            var karbonites = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, true, this.sym)
            var fuels = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, false, this.sym)
            this.resource_saturation = karbonites.length + fuels.length
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...karbonites[0])){
                this.num_pilgrims ++
                return this.r.buildUnit(SPECS.PILGRIM, karbonites[0][0] - this.r.me.x, karbonites[0][1] - this.r.me.y)
            }
        }

        if (this.num_castles != null){
            if (this.castle_turn_order == 0){
                for (var i in units){
                    if (units[i].id != this.r.me.id && units[i].castle_talk == 254){
                        this.num_finished_econ ++
                    }
                }
                if (this.r.karbonite >=(90 + (this.num_castles-this.num_finished_econ)*10 + this.num_finished_econ*25)){
                    this.r.castleTalk(255)
                    this.synced_build = true
                }
            } else {
                for (var i in units){
                    if (units[i].id != this.r.me.id && units[i].castle_talk == 255){
                        this.synced_build = true
                    }
                }
            }
        }

        var atk_loc = null
        for (var i in units){
            if (units[i].team != this.r.me.team){
                atk_loc = [units[i].x, units[i].y]
                if (units[i].unit == SPECS.CRUSADER){
                    this.defensive_build = SPECS.PREACHER
                }
                if (units[i].unit == SPECS.PROPHET){
                    this.defensive_build = SPECS.PROPHET
                }
                if (units[i].unit == SPECS.PREACHER){
                    this.defensive_build = SPECS.PREACHER
                }
            }
        }
        
        if (this.defensive_build != null){
            this.r.castleTalk(253)
            if (this.r.karbonite >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE){
                return this.r.buildUnit(this.defensive_build, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            }
            if (this.r.r_squared(this.r.me.x, this.r.me.y, ...atk_loc) <= 64){
                return this.r.attack(atk_loc[0] - this.r.me.x, atk_loc[1] - this.r.me.y)
            }
        }

        if (this.synced_build){
            this.synced_build = false
            if (this.economy){
                this.num_pilgrims ++
                if (this.num_pilgrims == this.resource_saturation){
                    this.economy = false
                    if (this.castle_turn_order != 0) this.r.castleTalk(254)
                    this.num_finished_econ ++
                }
                return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            } else {
                return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))

            }
        }

        return


        if (this.r.karbonite >= 10 && this.r.fuel >= 50 && this.built < 2){
            this.r.log("building pilgrim")
            this.built ++
            return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
        }

        return
        if (!this.applied){
            for (var i in this.r.map){
                for (var j in this.r.map){
                    var score = 0
                    for (var k in this.resource_kernel){
                        for (var l in this.resource_kernel){
                            var coeff = this.resource_kernel[l][k]
                            var x = i + k - 2
                            var y = j + l - 2
                            if (!this.r.in_bounds(x, y)) continue
                            if (this.r.karbonite_map[y][x]) {
                                score += coeff
                            }
                        }
                    }
                }
            }
        }
    }
}