import { Mob } from '../characters/Mob.js';

function getMob(level) {
    if (level > 0) return new Mob(level);
    return null;
}

export class MobsSquad {
    constructor(level) {
        this.mobs = [
            [getMob(level), getMob(level - 75)],
            [getMob(level - 25), getMob(level - 100)],
            [getMob(level - 50), getMob(level - 125)]
        ];
    }
}


