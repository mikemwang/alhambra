import {SPECS} from 'battlecode'

export class Prophet{
    constructor (r){
        this.r = r
        this.lattice_occupancy = []
        this.priority_list = [0,1,2,3,5,4]
        this.sym = null
        this.bodyguard = false
        this.target_expansion = null

    }
    turn(step){
        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        var units = this.r.getVisibleRobots()

        for (var i in units){
            var unit = units[i]
            if (this.r.isRadioing(unit)) {
                var header = this.r.parse_header(unit.signal)
                var coords = this.r.parse_coords(unit.signal)
                if (header == '1000' || header == '1001' || header == '1010'){
                    this.target_expansion = coords.slice()
                    this.bodyguard = true
                    break
                }
            }
            if (this.bodyguard){
                if (unit.unit == SPECS.CHURCH && unit.x == this.target_expansion[0] && unit.y == this.target_expansion[1] && unit.team == this.r.me.team){
                    this.bodyguard = false
                }
            }
        }


        if (this.r.should_i_kite(units)) 
        {
            var path = this.r.kite(this.r.get_closest_attackable_enemy_unit(units, [0,0,0,0,0,0]))
            if (path != null) {
                return this.r.move(path[0] - this.r.me.x, path[1] - this.r.me.y)
            }
        }

        var atk = this.r.get_closest_attackable_enemy_unit(units, this.priority_list)
        if (atk != null){
            return this.r.attack(atk[0]-this.r.me.x, atk[1]-this.r.me.y)
        }

        if (this.bodyguard) {
            var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.target_expansion, true, true)
            if (path != null && path[0][0] != this.target_expansion[0] && path[0][1] != this.target_expansion[1]) return this.r.move(path[0][0]-this.r.me.x, path[0][1]-this.r.me.y)
            return
        }

        if (this.r.me.x%2 != 0 || this.r.me.y%2 != 0 ||this.r.karbonite_map[this.r.me.y][this.r.me.x] || this.r.fuel_map[this.r.me.y][this.r.me.x] ){
            var path = this.r.flood_fill(this.r.me.x, this.r.me.y, null, this.lattice_occupancy, this.sym, 90)
            if (path != null) return this.r.move(path[0][0]-this.r.me.x, path[0][1]-this.r.me.y)
        }
    }
}