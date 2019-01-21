import {SPECS} from 'battlecode'
import {Castle} from 'castle.js'
import {Pilgrim} from 'pilgrim.js'

export function create_bot(bot){
    if (bot.me.unit === SPECS.CASTLE){
        return new Castle(bot)
    }
    if (bot.me.unit === SPECS.PILGRIM){
        return new Pilgrim(bot)
    }
}
