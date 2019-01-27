import {SPECS} from 'battlecode'
import {Allied_Castle_Finder} from 'funcfile.js'
//import { strict } from 'assert';
//import { stringify } from 'querystring';
//import { join } from 'path';

/* castletalk key:
*   255: church built
*/

/* signal header key:
1000, 1001, 1010: build church, church turn order
*/

const PROPHET_CHANCE = 0
 

export class Castle{
    constructor(r){
        this.allied_castle_list = null
        this.all_expansions = null
        this.all_finished = false
        this.am_expanding = false
        this.anti_rush_budget = 100
        this.castle_turn_order = null
        this.check_to_expand = false
        this.contested_expansion = false
        this.cur_expansion = null
        this.defensive_build = null
        this.defended_rush = false
        this.economy = true
        this.enemy_castle_list = null
        this.furthest_outpost = null
        this.init_pilgrims = null
        this.possible_expansions = null
        this.fuel_saturation = null
        this.desired_pilgrims = null
        this.karbonite_saturation = null
        this.latest_possible_rush = 25
        this.num_expansions = 0
        this.num_finished_econ = 0
        this.num_castles = null
        this.num_units = [0,0,0,0,0,0]
        this.num_bodyguards = 0
        this.max_pilgrim_range = 5
        this.pilgrim_dispatched
        this.r = r
        this.synced_build = false
        this.synced_build_rush = false
        this.resource_saturation = null
        this.rush_castle = false
        this.rush_distance = null
        this.sym = null
        this.last_hp = null
        this.expand = false
        this.finished_expand_turn = null
    }

    turn(step){
        //this.r.log(step)
        var units = this.r.getVisibleRobots()
        if (step % 5 == 0 && this.castle_turn_order != null && this.castle_turn_order == 0) this.r.log(step)

        // see if damage was taken
        if (this.last_hp == null) {
            this.last_hp = this.r.me.health
        }
        var damage_taken = this.r.me.health != this.last_hp
        this.last_hp = this.r.me.health

        if (this.sym == null){
            this.sym = this.r.find_sym(this.r.map)
        }

        if (this.r.allied_castle_finder == null){
            this.r.allied_castle_finder = new Allied_Castle_Finder(this.r)
        }


        this.r.allied_castle_finder.find(units, this.sym)
        if (this.r.allied_castle_finder.done && this.allied_castle_list == null){
            this.allied_castle_list = this.r.allied_castle_finder.allied_castle_list.slice()
            this.enemy_castle_list = this.r.allied_castle_finder.enemy_castle_list.slice()
            this.castle_turn_order = this.r.allied_castle_finder.castle_turn_order
            this.num_castles = this.r.allied_castle_finder.num_castles
            var d = 999
            var castle = null
            for (var k in this.allied_castle_list){
                var e = Math.abs(0.5*this.r.map.length - (this.sym=='x' ? this.allied_castle_list[k][1] : this.allied_castle_list[k][0]))
                if (e < d){
                    d = e
                    castle = this.allied_castle_list[k].slice()
                }
            }
            this.rush_distance = d
            this.rush_castle = castle[0] == this.r.me.x && castle[1] == this.r.me.y
            this.check_to_expand = true
        }

        if (this.resource_saturation == null){
            this.karbonite_saturation = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, true, this.sym)
            this.fuel_saturation =this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, false, this.sym)
            this.resource_saturation = this.karbonite_saturation + this.fuel_saturation
        }

        // initial pilgrims
        if (this.desired_pilgrims == null)
        {
            this.desired_pilgrims = this.karbonite_saturation
            return
        }        

        if (step > 20 && this.desired_pilgrims == this.init_pilgrims){
            this.desired_pilgrims = this.karbonite_saturation
        }

        //if (step > 20 && Math.min(this.num_units[SPECS.PILGRIM], this.r.get_visible_allied_units(units, SPECS.PILGRIM)) >= this.init_pilgrims){
        if (step > 20 && this.possible_expansions != null && this.possible_expansions.length == 0){
            if (step %8 == 0 && this.desired_pilgrims < this.resource_saturation){
                this.desired_pilgrims ++
            }
        }

        // rush defense takes precedence over pilgrim production
        var atk_loc = null
        var num_enemy_units = 0
        this.defensive_build = null
        for (var i in units){
            if (units[i].team != this.r.me.team){
                atk_loc = [units[i].x, units[i].y]
                num_enemy_units ++
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

        if ( this.defensive_build != null){
            if (this.r.karbonite >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE){
                this.num_units[this.defensive_build] ++
                return this.r.buildUnit(this.defensive_build, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            }
            if (this.r.in_range(...atk_loc)){
                return this.r.attack(atk_loc[0] - this.r.me.x, atk_loc[1] - this.r.me.y)
            }
        }


        for (var i in units){
            var unit = units[i]
            if (unit.castle_talk == 255){
                if (this.possible_expansions.length > 0) this.check_to_expand = true
                this.am_expanding = false
                this.pilgrim_dispatched = false
                this.contested_expansion = false
                this.num_bodyguards = 0
                this.num_castles ++
                if (this.possible_expansions.length == 0) this.finished_expand_turn = step
            }
        }

        if (this.defensive_build != null){
            // build the defensive units, or save up for them
            return
        }

        if (this.check_to_expand){
            this.check_to_expand = false
            if (this.possible_expansions == null){
                this.possible_expansions = this.r.find_good_expansions( this.sym, [this.r.karbonite_map, this.r.fuel_map], this.allied_castle_list, 3)
                this.r.log("found these expansions")
                this.r.log(this.possible_expansions.length)
                this.all_expansions = this.possible_expansions.slice()
                this.num_expansions = this.possible_expansions.length
            }

            if (this.all_expansions.length == 0){
                this.finished_expand_turn = step
            } else {
                this.cur_expansion = this.possible_expansions[0].slice()
                this.possible_expansions = this.possible_expansions.slice(1) // we have occupied the first one

                var best_d = 999
                var best_castle = []
                for (var i in this.allied_castle_list){
                    var castle = this.allied_castle_list[i]
                    var d = this.r.map_distance(...castle, ...this.cur_expansion)
                    if (d < best_d){
                        best_d = d
                        best_castle = castle.slice()
                    }
                }

                if (best_castle[0] == this.r.me.x && best_castle[1] == this.r.me.y){
                    this.am_expanding = true
                }

                var test_coord = 0
                if (this.sym == 'x') {
                    test_coord = 1
                }

                //if (Math.abs(this.cur_expansion[test_coord] - 0.5*this.r.map.length) < 0.25*this.r.map.length) this.contested_expansion = true
                var d_to_center = Math.abs(this.cur_expansion[test_coord] - 0.5*this.r.map.length)
                this.num_bodyguards = Math.ceil(5*(0.5*this.r.map.length - d_to_center))/(0.5*this.r.map.length)
                if (d_to_center >= 0.25*this.r.map.length) this.num_bodyguards = 0
            }
        }

        if (this.am_expanding && !this.pilgrim_dispatched){
            var karb_reserve = 70
            var fuel_reserve = 250
            var escort_available = false
            if (this.r.get_visible_allied_units(units, SPECS.PROPHET) >= this.num_bodyguards) escort_available = true
            if (this.num_bodyguards > 0) {
                if (!escort_available) {
                    karb_reserve += SPECS.UNITS[SPECS.PROPHET].CONSTRUCTION_KARBONITE
                }
            }
            var which_church = this.num_expansions-this.possible_expansions.length-1
            if (this.r.karbonite >= karb_reserve && this.r.fuel >= fuel_reserve){
                if (this.num_bodyguards > 0){
                    this.r.log("this is a contested expansion, we need an escort")
                    if (escort_available) {
                        this.r.log("an escort is available, dispatching pilgrim")
                        switch (which_church){
                            case(0):
                                this.r.signal_encode("1000", ...this.cur_expansion, 100)
                                break
                            case(1):
                                this.r.signal_encode("1001", ...this.cur_expansion, 100)
                                break
                            case(2):
                                this.r.signal_encode("1010", ...this.cur_expansion, 100)
                                break
                        }
                        this.pilgrim_dispatched = true
                        return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.x, this.r.y))
                    } else {
                        this.r.log("not enough escorts available for contested expansion, building escort")
                        this.pilgrim_dispatched = false
                        return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.x, this.r.y))
                    }
                } else {
                    this.r.log("no escort required for uncontested expansion")
                    switch (which_church){
                        case(0):
                            this.r.signal_encode("1000", ...this.cur_expansion, 2)
                            break
                        case(1):
                            this.r.signal_encode("1001", ...this.cur_expansion, 2)
                            break
                        case(2):
                            this.r.signal_encode("1010", ...this.cur_expansion, 2)
                            break
                    }
                    this.pilgrim_dispatched = true
                    return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.x, this.r.y))
                }
            }
        }

        // saturating local resources is low priority
        var p = this.r.get_visible_allied_units(units, SPECS.PILGRIM)
        if ( p == 0 || (Math.min(this.num_units[SPECS.PILGRIM]+1, p+1) <= Math.floor(this.desired_pilgrims) && this.r.karbonite >= 60))
        {
            this.num_units[SPECS.PILGRIM] ++

            if (this.r.karbonite >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.r.fuel >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_FUEL)
            {
                return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            }
        }

        // synced build
        if (this.castle_turn_order == 0 && this.finished_expand_turn != null){
            if (step - this.finished_expand_turn < 20) return
            if (this.furthest_outpost == null){
                var d = 0
                for (var i in this.all_expansions){
                    var e = this.r.r_squared(this.r.me.x, this.r.me.y, ...this.all_expansions[i])
                    if (e > d){
                        d = e
                    }
                }
                for (var i in this.allied_castle_list){
                    var e = this.r.r_squared(this.r.me.x, this.r.me.y, ...this.allied_castle_list[i])
                    if (e > d){
                        d = e
                    }
                }
                this.furthest_outpost = d
            }
            var min_karb = 25*(this.num_castles)
            var min_fuel = 50*(this.num_castles) + Math.ceil(Math.sqrt(this.furthest_outpost))
            if (this.r.karbonite >= min_karb && this.r.fuel >= min_fuel){
                this.r.signal_encode("1111", 0, 0, this.furthest_outpost)
                var q = Math.random()
                if (q <= PROPHET_CHANCE) return this.r.buildUnit(SPECS.PROPHET, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
                return this.r.buildUnit(SPECS.CRUSADER, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
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
    }
}