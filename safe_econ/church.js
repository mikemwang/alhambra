import {SPECS} from 'battlecode'

const PROPHET_CHANCE = 0.3
const PILGRIM_CHANCE = 0.5

export class Church{
    constructor (r){
        this.r = r
        this.defensive_build = null
        this.desired_pilgrims = 0
        this.num_units = [0,0,1,0,0,0]
        this.desired_pilgrims = 0
        this.resource_saturation = null
        this.karbonite_saturation = null
        this.fuel_saturation = null
        this.sym = null
        this.sym_d = null
        this.max_pilgrim_range = 5
        this.num_units = [0,0,0,0,0,0]
        this.church_turn_order = 0
        
    }
    turn (step){
        var units = this.r.getVisibleRobots()


        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
            var coord = 0
            if (this.sym == "x") coord = 1
            this.sym_d = Math.abs(0.5*this.r.map.length - (coord == 0 ? this.r.me.x : this.r.me.y))
            this.r.castleTalk(255)
            this.r.log("church built")
        }

        if (this.resource_saturation == null){
            this.karbonite_saturation = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, true, this.sym)
            this.fuel_saturation =this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, false, this.sym)
            this.resource_saturation = this.karbonite_saturation + this.fuel_saturation
        }

        var num_enemy_units = [0,0,0,0,0,0]
        var atk_loc = null
        this.defensive_build = null
        for (var i in units){
            if (units[i].team != this.r.me.team){
                atk_loc = [units[i].x, units[i].y]
                num_enemy_units[units[i].unit] ++
                if (units[i].unit == SPECS.CRUSADER){
                    this.defensive_build = SPECS.PREACHER
                }
                if (units[i].unit == SPECS.PROPHET){
                    this.defensive_build = SPECS.PROPHET
                }
                if (units[i].unit == SPECS.PREACHER){
                    this.defensive_build = SPECS.PROPHET
                }
                if (units[i].unit == SPECS.CASTLE || units[i].unit == SPECS.CHURCH){
                    this.defensive_build = SPECS.PROPHET
                }
            }
        }
        var preacher_fcs = this.r.preacher_fire_control(units)
        if (preacher_fcs != null){
            this.r.signal_encode("1110", ...preacher_fcs, 100)
        }         

        if (this.desired_pilgrims < this.resource_saturation && step % 8 == 0){
            this.desired_pilgrims ++
        }

        if ( this.defensive_build != null){
            if (atk_loc == null){
                this.r.log("null atk_loc")
                return
            }
            if (this.r.karbonite >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_FUEL){
                this.num_units[this.defensive_build] ++
                var dir = this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y)
                if (dir != null) return this.r.buildUnit(this.defensive_build, ...dir)
                this.r.log("adjacent squares full")
            }
            this.r.signal_encode("1110", ...atk_loc, 100)
            return
        }

        //if (enemy_structure != null){
        //    if (this.r.karbonite >= SPECS.UNITS[SPECS.PREACHER].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[SPECS.PREACHER].CONSTRUCTION_FUEL){
        //        this.signal_encode("1100", ...enemy_structure, 3)
        //        return this.r.buildUnit(SPECS.PREACHER, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
        //    }
        //    return
        //}
        if (Math.random() < 0.6){
            var h = Math.random()
            if (this.r.get_visible_allied_units(units, SPECS.PROPHET) < 6*(0.5*this.r.map.length - this.sym_d)/(0.5*this.r.map.length)){
                if (h < 1-.75*(0.5*this.r.map.length - this.sym_d)/(0.5*this.r.map.length)){
                    var p = this.r.get_visible_allied_units(units, SPECS.PILGRIM)
                    if ( p == 0 || (Math.min(this.num_units[SPECS.PILGRIM]+1, p+1) <= Math.floor(this.desired_pilgrims) && this.r.karbonite >= 60))
                    {
                        this.num_units[SPECS.PILGRIM] ++
                        if (this.r.karbonite >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_FUEL)
                        {
                            var dir = this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y)
                            if (dir != null) return this.r.buildUnit(SPECS.PILGRIM, ...dir)
                            this.r.log("adjacent squares full")
                        }
                    }
                } else {
                    var dir = this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y)
                    if (dir != null) return this.r.buildUnit(SPECS.PROPHET, ...dir)
                }
            } else {
                var p = this.r.get_visible_allied_units(units, SPECS.PILGRIM)
                if ( p == 0 || (Math.min(this.num_units[SPECS.PILGRIM]+1, p+1) <= Math.floor(this.desired_pilgrims) && this.r.karbonite >= 60))
                {
                    this.num_units[SPECS.PILGRIM] ++
                    if (this.r.karbonite >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_FUEL)
                    {
                        var dir = this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y)
                        if (dir != null) return this.r.buildUnit(SPECS.PILGRIM, ...dir)
                        this.r.log("adjacent squares full")
                    }
                }
            }
        }
        

        for (var i in units){
            var unit = units[i]
            if (this.r.isRadioing(unit)){
                var header = this.r.parse_header(unit.signal)
                if (header == '1111'){
                    var q = Math.random()
                    var u = SPECS.CRUSADER
                    if (q <= PROPHET_CHANCE) u = SPECS.PROPHET
                    var dir = this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y)
                    if (dir != null) return this.r.buildUnit(u, ...dir)
                    this.r.log("adjacent squares full")

                }
            }
        }
        return
        if (this.r.karbonite >= 75 && this.r.fuel >= 150){
            return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
        }
    }
    check_to_build_pilgrim(units){
        var p = this.r.get_visible_allied_units(units, SPECS.PILGRIM)
        if ( p == 0 || (Math.min(this.num_units[SPECS.PILGRIM]+1, p+1) <= Math.floor(this.desired_pilgrims) && this.r.karbonite >= 60))
        {
            this.num_units[SPECS.PILGRIM] ++
            if (this.r.karbonite >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_FUEL)
            {
                var dir = this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y)
                if (dir != null) return this.r.buildUnit(SPECS.PILGRIM, ...dir)
                this.r.log("adjacent squares full")
            }
        }
    }
}