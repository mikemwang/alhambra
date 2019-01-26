import {SPECS} from 'battlecode'

export class Pilgrim{
    constructor(r){
        this.r = r
        this.karb_bot = true
        this.expanding = null
        this.first_run = 0
        this.home_depo = null
        this.max_range = 5
        this.occupied_resources = []
        this.saturated = false
        this.sym = null
        this.target_expansion = null
        this.target_resource = null
        this.target_karb = null
        this.target_fuel = null
    }

    expand_phase(step, units){
        if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...this.target_expansion)){
            if (this.r.karbonite >= 50 && this.r.fuel >= 200 && this.r.traversable(...this.target_expansion, this.r.getVisibleRobotMap())){
                this.r.log("built church")
                this.r.castleTalk(255)
                this.expanding = false
                this.home_depo = this.target_expansion.slice()
                return this.r.buildUnit(SPECS.CHURCH, this.target_expansion[0]-this.r.me.x, this.target_expansion[1]-this.r.me.y)
            }
        }
        var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.target_expansion, true, true)        
        if (path != null){
            return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
        }
    }

    turn(step){

        var units = this.r.getVisibleRobots()

        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        if (this.expanding == null){
            this.expanding = false
            for (var i in units){
                var unit = units[i]
                if (this.r.isRadioing(unit)) {
                    var header = this.r.parse_header(unit.signal)
                    var coords = this.r.parse_coords(unit.signal)
                    if (header == '1000'){
                        this.target_expansion = coords.slice()
                        this.expanding = true
                        break
                    }
                }
            }
        }

        if (this.home_depo == null) {
            for (var i in units) {
                if (units[i].unit == SPECS.CASTLE || units[i].unit == SPECS.CHURCH){
                    this.home_depo = [units[i].x, units[i].y]
                    break
                }
            }
        }


        if (this.expanding) {
            return this.expand_phase(step, units)
        }
        // normal resource gathering below this line


        // retargeting conditions
        if (!this.saturated){
            if (this.r.fuel < 300){
                this.karb_bot = false
            } else if (this.r.karbonite < 100){
                this.karb_bot = true
            }
            if(this.r.fuel > 500){
                this.karb_bot = true
            }
        }

        if (this.target_resource == null){
            var path = null
            var done = false
            do {
                path = this.r.flood_fill(this.r.me.x, this.r.me.y, this.karb_bot, this.occupied_resources, this.sym, this.max_range)

                if ((!this.saturated && path == null) || (path!=null && path.length > this.max_range)) {
                    this.r.log("IS SATURATED")
                    this.saturated = true
                    this.karb_bot = !this.karb_bot
                    path = null
                } else if (this.saturated && path == null) {
                    this.r.log("USELESS PILGRIM")
                    done = true
                } else {
                    done = true
                }
            }while(!done)

            if (path == null){
                this.r.log("never found a resource")
                return
            }

            if (this.karb_bot){
                this.target_karb = path[path.length-1]
            }
            else {
                this.target_fuel = path[path.length-1]
            }
            this.target_resource = this.karb_bot ? this.target_karb : this.target_fuel
            this.r.signal(4, 0)
        }

        var resource = this.karb_bot ? this.r.me.karbonite : this.r.me.fuel
        var max_resource = this.karb_bot ? 20 : 100
        var resource_map = this.karb_bot ? this.r.karbonite_map : this.r.fuel_map

        // mine phase
        if ((this.first_run >= 3 && resource < max_resource) || (this.first_run < 3 && resource < 0.5*max_resource && this.karb_bot)){
            if (resource_map[this.r.me.y][this.r.me.x]){
                return this.r.mine()
            }
            var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.target_resource, false, true)
            if (path != null) return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
            this.target_resource = null
            if (this.karb_bot) this.target_karb = null
            if (!this.karb_bot) this.target_fuel = null

        } else { // deposit phase
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...this.home_depo)){
                this.first_run ++
                return this.r.give(this.home_depo[0]-this.r.me.x, this.home_depo[1]-this.r.me.y, this.r.me.karbonite, this.r.me.fuel)
            } else {
                var path = this.r.bfs(this.r.me.x, this.r.me.y, ...this.home_depo, true, true)
                if (path != null){
                    return this.r.move(path[0][0] - this.r.me.x, path[0][1] - this.r.me.y)
                }
            }
        }
    }
}