export class ArmoryItem {
    constructor({
        _id,
        name = "Unnamed Item",
        rarity,
        stats = [],
        level = 1, // Default level to 1
        tiers = {},
    }) {
        this.id = _id;
        this.name = name;
        this.rarity = rarity;
        // Deep copy stats to prevent shared references
        this.stats = stats.map(stat => ({ ...stat }));
        this.level = level;
        this.tiers = tiers;
    }
}
