import {SPECS} from 'battlecode'
import {Allied_Castle_Finder} from 'funcfile.js'
 

export class Castle{
    constructor(r){
        this.resource_kernel = [[1.54, 1.54, 1.54, 1.54, 1.54],
                                [1.54, 1.82, 1.82, 1.82, 1.54],
                                [1.54, 1.82, 0.00, 1.82, 1.54],
                                [1.54, 1.82, 1.82, 1.82, 1.54],
                                [1.54, 1.54, 1.54, 1.54, 1.54]]
        this.applied = false
        this.allied_castle_list = null
        this.enemy_castle_list = null
        this.sym = null
        this.r = r
        this.built = 0
        this.num_pilgrims = 0
        this.num_prophets = 0
        this.num_preachers = 0
        this.resource_saturation = null
        this.max_pilgrim_range = 5
    }

    turn(step){
        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        if (this.r.allied_castle_finder == null){
            this.r.allied_castle_finder = new Allied_Castle_Finder(this.r)
        }


        var units = this.r.getVisibleRobots()

        this.r.allied_castle_finder.find(units)
        if (this.r.allied_castle_finder.done && this.allied_castle_list == null){
            this.allied_castle_list = this.r.allied_castle_finder.allied_castle_list.slice()
            this.enemy_castle_list = this.r.allied_castle_finder.enemy_castle_list.slice()
        }


        if (this.resource_saturation == null){
            var karbonites = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, true, this.sym)
            var fuels = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, false, this.sym)
            this.resource_saturation = karbonites.length + fuels.length
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...karbonites[0])){
                return this.r.buildUnit(SPECS.PILGRIM, karbonites[0][0] - this.r.me.x, karbonites[0][1] - this.r.me.y)
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