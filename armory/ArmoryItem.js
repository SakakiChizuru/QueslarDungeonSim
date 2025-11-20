export class ArmoryItem {
    constructor({
        _id,
        name,
        rarity,
        stats,
    }) {
        this.id = _id;
        this.name = name;
        this.rarity = rarity;
        // Deep copy stats to prevent shared references
        this.stats = stats.map(stat => ({ ...stat }));
    }
}
