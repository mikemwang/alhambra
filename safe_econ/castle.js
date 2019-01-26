import {SPECS} from 'battlecode'
import {Allied_Castle_Finder} from 'funcfile.js'
//import { join } from 'path';

/* castletalk key:
*   255: synced build
*   254: finished econ (saturated nearby karbs)
*   252: someone has spent the anti-rush budget
*/
 

export class Castle{
    constructor(r){
        this.allied_castle_list = null
        this.all_finished = false
        this.anti_rush_budget = 100
        this.castle_turn_order = null
        this.defensive_build = null
        this.defended_rush = false
        this.economy = true
        this.enemy_castle_list = null
        this.fuel_saturation = null
        this.init_karbs = null
        this.karbonite_saturation = null
        this.latest_possible_rush = 25
        this.num_finished_econ = 0
        this.num_castles = null
        this.num_units = [0,0,0,0,0,0]
        this.max_pilgrim_range = 5
        this.r = r
        this.synced_build = false
        this.synced_build_rush = false
        this.resource_saturation = null
        this.rush_castle = false
        this.rush_distance = null
        this.sym = null
        this.last_hp = null
        this.expand = false
    }

    turn(step){
        this.r.log(step)

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

        var units = this.r.getVisibleRobots()

        this.r.allied_castle_finder.find(units, this.sym)
        if (this.r.allied_castle_finder.done && this.allied_castle_list == null){
            this.allied_castle_list = this.r.allied_castle_finder.allied_castle_list.slice()
            this.enemy_castle_list = this.r.allied_castle_finder.enemy_castle_list.slice()
            this.castle_turn_order = this.r.allied_castle_finder.castle_turn_order
            this.num_castles = this.r.allied_castle_finder.num_castles
            var d = 999
            var castle = null
            for (var k in this.allied_castle_list){
                var e = Math.abs(this.r.map.length - (this.sym=='x' ? this.allied_castle_list[k][1] : this.allied_castle_list[k][1]))
                if (e < d){
                    d = e
                    castle = this.allied_castle_list[k].slice()
                }
            }
            this.rush_distance = d
            this.rush_castle = castle[0] == this.r.me.x && castle[1] == this.r.me.y
        }

        // initial pilgrims
        if (this.init_karbs == null)
        {
            this.init_karbs = []
            for (var i = -3; i < 4; i++)
            {
                for (var j = -3; j < 4; j++)
                {
                    var x = this.r.me.x + i
                    var y = this.r.me.y + j
                    if (this.r.r_squared(0,0,i,j) <= 9 && this.r.in_bounds(x, y) && this.r.karbonite_map[y][x]) this.init_karbs.push([x,y])
                }
            }
        }

        if (this.r.karbonite == 50){
            this.all_finished = true
        }

        if (step == 10){
            this.r.find_good_expansions( this.sym, [this.r.karbonite_map, this.r.fuel_map])
        }

        if (this.num_units[SPECS.PILGRIM] < this.init_karbs.length && !this.all_finished)
        {
            this.num_units[SPECS.PILGRIM] ++
            if (this.r.karbonite >= SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE)
            {
                return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            }
        }


        return
        if (this.resource_saturation == null){
            var karbonites = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, true, this.sym)
            var fuels = this.r.resources_in_area(this.r.me.x, this.r.me.y, this.max_pilgrim_range, false, this.sym)
            this.karbonite_saturation = karbonites.length
            this.fuel_saturation = fuels.length
            this.resource_saturation = this.karbonite_saturation
            if (this.r.is_adjacent(this.r.me.x, this.r.me.y, ...karbonites[0])){
                this.num_units[SPECS.PILGRIM] ++
                return this.r.buildUnit(SPECS.PILGRIM, karbonites[0][0] - this.r.me.x, karbonites[0][1] - this.r.me.y)
            }
        }



        return

        if (this.num_castles != null){
            if (this.castle_turn_order == 0){
                for (var i in units){
                    if (units[i].id != this.r.me.id && units[i].castle_talk == 254){
                        this.num_finished_econ ++
                    }
                    if (step > this.latest_possible_rush || units[i].id != this.r.me.id && units[i].castle_talk == 252){
                        this.defended_rush = true
                        this.anti_rush_budget = 0
                    }
                }
                if (this.r.karbonite >=(this.anti_rush_budget + (this.num_castles-this.num_finished_econ)*10 + this.num_finished_econ*25)){
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
        var num_enemy_units = [0,0,0,0,0,0]
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
            this.r.log(preacher_fcs)
            this.r.signal_encode("1111", ...preacher_fcs, 100)
        }         

        if ( this.defensive_build != null){
            if (this.r.get_visible_allied_units(units, this.defensive_build) < num_enemy_units[num_enemy_units.indexOf(Math.max(...num_enemy_units))] + 2){
                if (this.r.karbonite >= SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE){
                    this.num_units[this.defensive_build] ++
                    if ((this.num_units[this.defensive_build]*SPECS.UNITS[this.defensive_build].CONSTRUCTION_KARBONITE) >= 90 || step > 25) {
                        this.r.castleTalk(252)  // anti-rush budget exceeded
                    }
                    return this.r.buildUnit(this.defensive_build, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
                }
            }
            if (this.r.in_range(...atk_loc)){
                return this.r.attack(atk_loc[0] - this.r.me.x, atk_loc[1] - this.r.me.y)
            }
        }

        if ( step == 30)
        {
            this.r.find_good_expansions(this.sym, [this.r.karbonite_map, this.r.fuel_map])
        }

        this.economy = this.r.get_visible_allied_units(units, SPECS.PILGRIM) < this.resource_saturation

        if (this.synced_build && this.rush_castle && step <= this.latest_possible_rush){
            this.synced_build_rush = true
        }

        if (this.synced_build || this.synced_build_rush){
            if (!this.synced_build){
                this.synced_build_rush = false
            }
            if (this.economy && this.synced_build){
                if (this.r.get_visible_allied_units(units, SPECS.PILGRIM) == (this.resource_saturation -1)){
                    if (this.castle_turn_order != 0) this.r.castleTalk(254)
                    this.num_finished_econ ++
                    this.num_finished_econ = Math.min(this.num_finished_econ, this.num_castles)
                }
                this.synced_build = false
                return this.r.buildUnit(SPECS.PILGRIM, ...this.r.find_free_adjacent_tile(this.r.me.x, this.r.me.y))
            } else {
                this.num_units[SPECS.PROPHET] ++
                this.synced_build = false
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
    }
}