import {SPECS} from 'battlecode'
import {Castle} from 'castle.js'
import {Pilgrim} from 'pilgrim.js'
import {Prophet} from 'prophet.js'
import {Preacher} from 'preacher.js'
import {Church} from 'church.js'

export function create_bot(bot){
    if (bot.me.unit === SPECS.CASTLE){
        return new Castle(bot)
    }
    if (bot.me.unit === SPECS.PILGRIM){
        return new Pilgrim(bot)
    }
    if (bot.me.unit === SPECS.PROPHET){
        return new Prophet(bot)
    }
    if (bot.me.unit === SPECS.PREACHER){
        return new Preacher(bot)
    }
    if (bot.me.unit === SPECS.CHURCH){
        return new Church(bot)
    }
}
