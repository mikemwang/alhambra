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
    }

    turn(){
        var units = this.r.getVisibleRobots()

        if (this.r.allied_castle_finder == null){
            this.r.allied_castle_finder = new Allied_Castle_Finder(this.r)
        }

        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        this.r.allied_castle_finder.find(units)
        if (this.r.allied_castle_finder.done && this.allied_castle_list == null){
            this.allied_castle_list = this.r.allied_castle_finder.allied_castle_list.slice()
            this.enemy_castle_list = this.r.allied_castle_finder.enemy_castle_list.slice()
        }

        this.r.signal(255, 65)
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