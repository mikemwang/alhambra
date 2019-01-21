import {SPECS} from 'battlecode'

export class Pilgrim{
    constructor(r){
        this.r = r
        this.karb_bot = true
        this.home_depo = null
        this.occupied_resources = []
        this.target_resource = null
        this.target_karb = null
        this.target_fuel = null
        this.phase = 'retarget'
    }

    turn(){
        if (this.home_depo == null) {
            var units = this.r.getVisibleRobots()
            for (var i in units) {
                if (units[i].unit == SPECS.CASTLE){
                    this.home_depo = [units[i].x, units[i].y]
                    break
                }
            }
        }

        if (this.r.fuel < 200){
            this.karb_bot = false
            this.target_resource = this.target_fuel
        } else if (this.r.karbonite < 100){
            this.karb_bot = true
            this.target_resource = this.target_karb
        }

        if(this.r.fuel > 500){
            this.karb_bot = true
            this.target_resource = this.target_karb
        }

        if (this.target_resource == null){
            var path = this.r.flood_fill(this.r.me.x, this.r.me.y, this.karb_bot, this.occupied_resources)
            if (path == null) return
            if (!this.r.traversable(...path[path.length-1], this.r.getVisibleRobotMap())){
                this.occupied_resources.push(path[path.length-1].slice())
            } else {
                if (this.karb_bot) this.target_karb = path[path.length-1]
                else this.target_fuel = path[path.length-1]
            }
            this.target_resource = this.target_karb
        }

        var resource = this.karb_bot ? this.r.me.karbonite : this.r.me.fuel
        var max_resource = this.karb_bot ? 20 : 100
        var resource_map = this.karb_bot ? this.r.karbonite_map : this.r.fuel_map

        // mine phase
        if (resource < max_resource){
            if (resource_map[this.r.me.y][this.r.me.x]){
                return this.r.mine()
            }
            var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.target_resource)
            if (path != null) return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
            if (!this.r.traversable(...this.target_resource, this.r.getVisibleRobotMap())) this.target_resource = null

        } else { // deposit phase
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...this.home_depo)){
                return this.r.give(this.home_depo[0]-this.r.me.x, this.home_depo[1]-this.r.me.y, this.r.me.karbonite, this.r.me.fuel)
            } else {
                var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.home_depo, true)
                if (path != null){
                    return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
                }
            }
        }
    }
}