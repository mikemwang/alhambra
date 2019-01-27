import {SPECS} from 'battlecode'

const PROPHET_CHANCE = 0

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
        this.max_pilgrim_range = 5
        this.church_turn_order = 0
    }
    turn (step){
        var units = this.r.getVisibleRobots()
        for (var i in units){
            var unit = units[i]
            if (this.r.isRadioing(unit)){
                var header = this.r.parse_header(unit.signal)
                var message = this.r.parse_coords(unit.signal)
                if (header == '1011') {
                    this.church_turn_order = message[0]
                    this.r.log("I am church number " + this.church_turn_order.toString(10))
                    }
            }
        }


        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
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
            }
        }
        var preacher_fcs = this.r.preacher_fire_control(units)
        if (preacher_fcs != null){
            this.r.signal_encode("1111", ...preacher_fcs, 100)
        }         

        var p = this.r.get_visible_allied_units(units, SPECS.PILGRIM)
        if (this.desired_pilgrims < this.resource_saturation && step % 7 == 0){
            this.desired_pilgrims ++
        }

        if ( this.defensive_build != null){
            if (this.r.karbonite >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_FUEL){
                this.num_units[this.defensive_build] ++
                return this.r.buildUnit(this.defensive_build, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            }
            return
        }
        // if we need defense, save up for those units
        if ( p == 0 || (Math.min(this.num_units[SPECS.PILGRIM]+1, p+1) <= Math.floor(this.desired_pilgrims) && this.r.karbonite >= 60))
        {
            this.num_units[SPECS.PILGRIM] ++
            if (this.r.karbonite >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_FUEL)
            {
                return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            }
        }

        for (var i in units){
            var unit = units[i]
            if (this.r.isRadioing(unit)){
                var header = this.r.parse_header(unit.signal)
                if (header == '1111'){
                    var q = Math.random()
                    if (q <= PROPHET_CHANCE) return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
                    return this.r.buildUnit(SPECS.CRUSADER, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
                }
            }
        }
        return
        if (this.r.karbonite >= 75 && this.r.fuel >= 150){
            return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
        }
    }
}