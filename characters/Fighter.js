import { calculateDefense } from "../utils/utils.js";

export const FighterClasses = Object.freeze({
  ASSASSIN: "Assassin",
  BRAWLER: "Brawler",
  HUNTER: "Hunter",
  MAGE: "Mage",
  PRIEST: "Priest",
  SHADOW_DANCER: "Shadow Dancer",
  BERSERKER: "Berserker",
  PALADIN: "Paladin",
  CRUSADER: "Crusader",
  SENTINEL: "Sentinel",
  BASTION: "Bastion",
  NONE: "No Class",
});

export class Fighter {
  constructor(
    fighterClass,
    {
      name = null,
      fighter_health = 0,
      fighter_damage = 0,
      fighter_hit = 0,
      fighter_defense = 0,
      fighter_crit = 0,
      fighter_dodge = 0,
      object_health = 0,
      object_damage = 0,
      object_hit = 0,
      object_defense = 0,
      object_crit = 0,
      object_dodge = 0,
    } = {},
  ) {
    this.fighter_class = fighterClass;

    if (!Object.values(FighterClasses).includes(fighterClass)) {
      throw new Error(
        `${fighterClass} is not a valid class. Please check your input.`,
      );
    }

    this.name = name || fighterClass;

    this.total_health = Math.ceil(500 + 100 * fighter_health) + object_health;
    this.current_health = this.total_health;
    this.damage = Math.ceil(100 + 25 * fighter_damage) + object_damage;
    this.hit = Math.ceil(50 + 50 * fighter_hit) + object_hit;
    this.defense = calculateDefense(25 + 10 * fighter_defense, object_defense);
    this.crit = (0.0 + 0.25 * fighter_crit + object_crit) / 100.0;
    this.dodge = Math.ceil(50.0 + 50.0 * fighter_dodge) + object_dodge;

    this.hit_counter = 0;
  }

  toString() {
    return `I am ${this.name} (${this.fighter_class}) with Health: ${this.current_health}/${this.total_health}, Damage: ${this.damage}, Hit: ${this.hit}, Defense: ${(100 * this.defense).toFixed(2)}%, Crit: ${(100 * this.crit).toFixed(2)}%, Dodge: ${this.dodge}`;
  }
}
