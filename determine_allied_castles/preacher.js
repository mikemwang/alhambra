import {SPECS} from 'battlecode'

export class Preacher{
    constructor (r){
        this.r = r
        this.lattice_occupancy = []
        this.priority_list = [0,0,0,0,1,0]
        this.sym = null

    }
    turn(step){
        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        var units = this.r.getVisibleRobots()

        var atk = this.r.get_closest_attackable_enemy_unit(units, this.priority_list)
        if (atk != null){
            this.r.log(atk)
            return this.r.attack(atk[0]-this.r.me.x, atk[1]-this.r.me.y)
        }

        this.r.log(this.r.is_something_else_adjacent([this.r.me.x, this.r.me.y], SPECS.CASTLE))
        if (this.r.me.x%2 != 0 || this.r.me.y%2 != 0 ||this.r.karbonite_map[this.r.me.y][this.r.me.x] || this.r.fuel_map[this.r.me.y][this.r.me.x] ){
            var path = this.r.flood_fill(this.r.me.x, this.r.me.y, null, this.lattice_occupancy, this.sym, 90)
            if (path != null) return this.r.move(path[0][0]-this.r.me.x, path[0][1]-this.r.me.y)
        }
    }
}