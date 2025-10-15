import { Fighter, FighterClasses } from "../characters/Fighter.js";
import { Mob } from "../characters/Mob.js";
import { calculateDefense } from "../utils/utils.js";
import { formatString } from "../utils/i18n.js";

function getAdjacent(i, j) {
  const rows = 3,
    cols = 2;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const neighbors = [];
  for (const [di, dj] of directions) {
    const ni = i + di;
    const nj = j + dj;
    if (0 <= ni && ni < rows && 0 <= nj && nj < cols) neighbors.push([ni, nj]);
  }
  return neighbors;
}

export class Battle {
  constructor(fighters, mobs, verbose = 0) {
    this.fighters = fighters;
    this.mobs = mobs;
    this.continue_flag = true;
    this.current_round = 1;
    this.verbose = verbose;

    this.dead_fighters = [];
    this.shadow_dancer_double_damage = false;
    this.cannot_be_dodged = false;
    this.paladin_aura = false;
    this.bastion_aura = false;

    // Imports i18nManager from global;
    this.I18N = window.i18nManager;
  }

  battle() {
    while (this.continue_flag) {
      this._do_one_round();
      if (this.current_round > 300) break;
      const winner = this._check_battle_is_over();
      if (winner) break;
    }

    const tot_mob_health = this._sumMobsHealth();
    if (this.current_round > 300) {
      return [
        "mobs",
        this.current_round,
        this.I18N.getBattleMsg("LOSE_DUE_TO_EXHAUST"),
        tot_mob_health,
      ];
    }

    const winner = this._check_battle_is_over();
    return [
      winner,
      this.current_round,
      this.I18N.getBattleMsg("HEALTH_0"),
      tot_mob_health,
    ];
  }

  _sumMobsHealth() {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const m = this.mobs.mobs[i][j];
        if (m) sum += m.current_health;
      }
    }
    return sum;
  }

  _do_one_round() {
    const sorted_attack_list = this._sort_by_hit();
    let current_attack = 0;
    for (const row of sorted_attack_list) {
      const i = row.i,
        j = row.j;
      let attacker, target;
      if (row.type === "fighters") {
        attacker = this.fighters.all_fighters[i][j];
        target = this._find_target("mobs");
      } else {
        attacker = this.mobs.mobs[i][j];
        target = this._find_target("fighters");
      }

      if (target === null) {
        this.continue_flag = false;
        break;
      }
      if (attacker === null || attacker.current_health === 0.0) continue;

      current_attack += 1;

      this.dead_fighters = [];
      for (const [x, y] of [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ]) {
        const f = this.fighters.all_fighters[x][y];
        if (f && f.current_health === 0.0) this.dead_fighters.push(f);
      }

      if (
        attacker instanceof Mob &&
        target.fighter_class !== FighterClasses.PALADIN
      ) {
        const f = this.fighters.all_fighters;
        if (
          (f[0][j] &&
            f[0][j].fighter_class === FighterClasses.PALADIN &&
            f[0][j].current_health > 0.0) ||
          (f[1][j] &&
            f[1][j].fighter_class === FighterClasses.PALADIN &&
            f[1][j].current_health > 0.0) ||
          (f[2][j] &&
            f[2][j].fighter_class === FighterClasses.PALADIN &&
            f[2][j].current_health > 0.0)
        ) {
          this.paladin_aura = true;
        }
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.ASSASSIN
      ) {
        target = this._find_target_for_assassin();
        if (target === null) {
          this.continue_flag = false;
          break;
        }
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.BRAWLER
      ) {
        const rng_brawler = Math.random();
        if (this.verbose >= 2)
          console.log(`\nRNG brawler: ${rng_brawler} < 0.15`);
        if (rng_brawler < 0.15) {
          if (this.verbose >= 1)
            this._draw_table_head(this.I18N.getBattleMsg("SP_BR_DOUBLE"), true); //console.log("Brawler attacked twice!");
          this._do_standard_attack(attacker, target);
          target = this._find_target("mobs");
          if (target === null) {
            this.continue_flag = false;
            break;
          }
        }
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.HUNTER
      ) {
        const targets_hunter = this._find_target_for_hunter();
        if (targets_hunter === null) {
          this.continue_flag = false;
          break;
        } else {
          for (const lcl_target of targets_hunter) {
            if (lcl_target)
              this._do_standard_attack(attacker, lcl_target, 0.75);
          }
        }
        this._print_debug(i, j, row.type, current_attack);
        continue;
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.MAGE
      ) {
        const targets_mage = this._find_target_for_mage();
        if (targets_mage === null) {
          this.continue_flag = false;
          break;
        } else {
          for (const lcl_target of targets_mage) {
            if (lcl_target) this._do_standard_attack(attacker, lcl_target, 0.5);
          }
        }
        this._print_debug(i, j, row.type, current_attack);
        continue;
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.PRIEST
      ) {
        if (this.dead_fighters.length > 0) {
          const rng_priest = Math.random();
          if (rng_priest < 0.1) {
            const idx = Math.floor(Math.random() * this.dead_fighters.length);
            const resurrected_fighter = this.dead_fighters[idx];
            resurrected_fighter.current_health =
              resurrected_fighter.total_health;
            resurrected_fighter.hit_counter = 0;
            this.dead_fighters = [];
            for (const [x, y] of [
              [0, 0],
              [1, 0],
              [2, 0],
              [0, 1],
              [1, 1],
              [2, 1],
            ]) {
              const f = this.fighters.all_fighters[x][y];
              if (f && f.current_health === 0.0) this.dead_fighters.push(f);
            }
            if (this.verbose >= 1)
              console.log(
                `Priest resurrected ${resurrected_fighter.fighter_class}`,
              );
          }
        }
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.BERSERKER
      ) {
        const health_ratio = attacker.current_health / attacker.total_health;
        let damage_mult = 1.0;
        if (0.75 <= health_ratio && health_ratio <= 1.0) {
          damage_mult = 1.0;
        } else if (0.5 <= health_ratio && health_ratio < 0.75) {
          damage_mult = 1.25;
        } else if (0.25 <= health_ratio && health_ratio < 0.5) {
          damage_mult = 1.5;
        } else if (health_ratio < 0.25) {
          this.cannot_be_dodged = true;
          damage_mult = 1.75;
        }
        this._do_standard_attack(attacker, target, damage_mult);
        this._print_debug(i, j, row.type, current_attack);
        continue;
      }

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.CRUSADER
      ) {
        const attack_multiplier = 1.0 + 0.2 * this.dead_fighters.length;
        this._do_standard_attack(attacker, target, attack_multiplier);
        this._print_debug(i, j, row.type, current_attack);
        continue;
      }

      if (
        target instanceof Fighter &&
        target.current_health / target.total_health < 0.25
      ) {
        const f = this.fighters.all_fighters;
        const sentinel = [];
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 2; y++) {
            if (
              f[x][y] &&
              f[x][y].fighter_class === FighterClasses.SENTINEL &&
              f[x][y].current_health > 0.0
            ) {
              sentinel.push(f[x][y]);
            }
          }
        }
        if (sentinel.length > 0) target = sentinel[0];
      }

      if (attacker instanceof Mob) {
        const f = this.fighters.all_fighters;
        const pos = [];
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 2; y++) {
            if (f[x][y] && f[x][y].fighter_class === target.fighter_class)
              pos.push([x, y]);
          }
        }
        if (pos.length) {
          const [target_i, target_j] = pos[0];
          const adjacents = getAdjacent(target_i, target_j);
          for (const [row_bastion, col_bastion] of adjacents) {
            if (
              f[row_bastion][col_bastion] &&
              f[row_bastion][col_bastion].fighter_class ===
                FighterClasses.BASTION &&
              f[row_bastion][col_bastion].current_health > 0.0
            ) {
              this.bastion_aura = true;
            }
          }
        }
      }

      this._do_standard_attack(attacker, target);
      this._print_debug(i, j, row.type, current_attack);
    }

    if (this.verbose >= 1) {
      //console.log("Final Round Situation");
      //this._draw_table_head("Final Round Situation");
      this._draw_table_head(this.I18N.getBattleMsg("FINAL_ROUND"));
      this._draw_health_table(null, null, null);
      console.log("<br/><br/>");
    }
    this.current_round += 1;
  }

  /**
   * Print table head for Round information.
   * @param {*} content
   * @param {boolean} sigle If needs display a sigle info
   */
  _draw_table_head(content, sigle = false) {
    let head = `<table style="border: 1px solid white; border-collapse: collapse; width: 100%; text-align: center; background:#36405a">\n`;
    head += `<thead><tr><th colspan="4" style="border: 1px solid white; padding: 16px;"> ${content} </th></tr></thead>${sigle ? "</table>" : ""}`;
    console.log(head);
  }

  /**
   * Print row for special moves/passive effect.
   * @param {*} content
   */
  _draw_table_row(content) {
    let row = `<tr><th colspan="4" style="border: 1px solid white; padding: 16px;"> ${content} </th></tr>`;
    console.log(row);
  }

  _print_debug(i, j, type, current_attack) {
    if (this.verbose >= 1) {
      //console.log(`Round: ${this.current_round}, Attack: ${current_attack}\n`);
      this._draw_table_row(
        formatString(
          this.I18N.getBattleMsg("ROUND_INFO"),
          this.current_round,
          current_attack,
        ),
      );
      this._draw_health_table(i, j, type);
    }
  }

  _draw_health_table(i, j, att_type, test = false) {
    const fighters = this.fighters.all_fighters;
    const mobs = this.mobs.mobs;

    const formattedString = (selI, selJ, selType, x, y, type) => {
      if (type === "fighters" && !fighters[x][y]) return "";
      if (type === "mobs" && !mobs[x][y]) return "";

      let label =
        type === "fighters"
          ? this.I18N.getFighterName(fighters[x][y].fighter_class)
          : //? fighters[x][y].fighter_class
            formatString(
              this.I18N.getBattleMsg("HEALTH_TABLE_LINE"),
              mobs[x][y].mob_class,
              mobs[x][y].level,
            );
      //: `${mobs[x][y].mob_class} lvl ${mobs[x][y].level}`;
      if (selI === x && selJ === y && att_type === type) label += " *";

      let current, total;
      if (type === "fighters") {
        const f = fighters[x][y];
        const boost =
          f.fighter_class === FighterClasses.CRUSADER
            ? 1 + 0.2 * this.dead_fighters.length
            : 1;
        current = Math.trunc(f.current_health);
        total = Math.trunc(f.total_health * boost);
      } else {
        const m = mobs[x][y];
        current = Math.trunc(m.current_health);
        total = Math.trunc(m.total_health);
      }

      return `${label}\n${current}/${total}`;
    };

    // Build data grid
    const rows = [0, 1, 2].map((x) => [
      formattedString(i, j, att_type, x, 1, "mobs"),
      formattedString(i, j, att_type, x, 0, "mobs"),
      formattedString(i, j, att_type, x, 0, "fighters"),
      formattedString(i, j, att_type, x, 1, "fighters"),
    ]);

    /*
    const headers = [
      "Mobs Back",
      "Mobs Front",
      "Fighters Front",
      "Fighters Back",
    ]; */
    const headers = this.I18N.getBattleMsg("headers");

    // Calculate column widths
    const allCells = [headers, ...rows];

    // Build HTML table
    // Table body, table head process with this._draw_table_head
    let output = "<tbody>";
    output += "<tr>";
    headers.forEach((headerline) => {
      output += `<td style="border: 1px solid white; padding: 8px;">${headerline}</td>`;
    });
    output += "</tr>";
    for (const row of rows) {
      output += "<tr>";
      row.forEach((cell) => {
        // Handle multi-line cells by replacing newlines with <br>
        const cellContent = (cell || "")
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join("<br>");

        output += `<td style="border: 1px solid white; padding: 8px; ${cellContent.indexOf("*") > 0 ? "background: #A0522D;" : ""} ">${cellContent.replace("EMPTY", "")}</td>`;
      });
      output += "</tr>";
    }
    output += "</tbody></table>";

    /*
      const colWidths = headers.map((_, ci) =>
        Math.max(
          ...allCells.map((r) =>
            (r[ci] || "").split("\n").reduce((a, l) => Math.max(a, l.length), 0),
          ),
        ),
      );

      // Helper to pad multiline cells
      const padCell = (content, width) => {
        const lines = (content || "").split("\n");
        const paddedLines = lines.map((line) => line.padEnd(width, " "));
        return paddedLines.join("\n");
      };

      // Build the table text
      const separator = colWidths.map((w) => "-".repeat(w)).join("-+-");
      const headerLine = headers
        .map((h, i) => h.padEnd(colWidths[i], " "))
        .join(" | ");
      const tableLines = [headerLine, separator];

      // Add rows (multi-line cell alignment)
      for (const row of rows) {
        const cellLines = row.map((cell, ci) =>
          padCell(cell, colWidths[ci]).split("\n"),
        );
        const maxLines = Math.max(...cellLines.map((l) => l.length));
        for (let li = 0; li < maxLines; li++) {
          const line = cellLines
            .map((l) =>
              (l[li] || "").padEnd(colWidths[cellLines.indexOf(l)], " "),
            )
            .join(" | ");
          tableLines.push(line);
        }
        tableLines.push(separator);
      }

      const output = tableLines.join("\n") + "\n\n";
    */

    // Print to HTML <pre> element
    const outputEl = document.getElementById("battle-output");

    if (test) console.warn(JSON.stringify(output));

    if (outputEl) {
      outputEl.textContent = output;
      //outputEl.innerHTML = output;
    } else {
      console.log(output); // fallback if no element exists
    }
  }

  _do_standard_attack(attacker, target, damage_mult = 1.0) {
    let attacker_name, target_name;
    // Add safety check for null/undefined targets
    if (!target) {
      if (this.verbose >= 1)
        console.log(
          formatString(
            this.I18N.getBattleMsg("ERR_IVLD_TGT_ID"),
            attacker instanceof Mob
              ? this.I18N.getBattleMsg("mob")
              : this.I18N.getBattleMsg("fighter"),
          ),
        );
      /*
        console.log(
          `No valid target found for ${attacker instanceof Mob ? "mob" : "fighter"} attack`,
        );
        */
      return;
    }

    if (attacker instanceof Mob)
      attacker_name = formatString(
        this.I18N.getBattleMsg("MOB_ATK_NAME"),
        attacker.level,
        attacker.mob_class,
      );
    //attacker_name = `level ${attacker.level} ${attacker.mob_class}`;
    else if (attacker instanceof Fighter)
      attacker_name = this.I18N.getFighterName(attacker.fighter_class);
    else throw new Error(this.I18N.getBattleMsg("ERR_IVLD_ATKR"));
    //else throw new Error("Invalid attacker");

    if (target instanceof Mob)
      target_name = formatString(
        this.I18N.getBattleMsg("MOB_TGT_NAME"),
        target.level,
        target.mob_class,
      );
    //target_name = `level ${target.level} ${target.mob_class}`;
    else if (target instanceof Fighter)
      target_name = this.I18N.getFighterName(target.fighter_class);
    else throw new Error(this.I18N.getBattleMsg("ERR_IVLD_TGT"));
    //else throw new Error("Invalid target");

    let target_defense = 1 - target.defense;
    let target_defense_pre = target.defense_pre;
    let target_dodge = target.dodge;
    let attacker_hit = attacker.hit;
    let attacker_damage = attacker.damage;
    let attacker_crit = attacker.crit;
    let additional_dr = 0.0;

    if (
      target instanceof Fighter &&
      target.fighter_class === FighterClasses.CRUSADER
    ) {
      target_defense_pre =
        (1 + 0.2 * this.dead_fighters.length) * target.defense_pre;
      target_defense = 1 - calculateDefense(target_defense_pre);
      target_dodge = (1 + 0.2 * this.dead_fighters.length) * target_dodge;
    }

    if (
      attacker instanceof Fighter &&
      attacker.fighter_class === FighterClasses.CRUSADER
    ) {
      attacker_hit = (1 + 0.2 * this.dead_fighters.length) * attacker_hit;
      attacker_damage = (1 + 0.2 * this.dead_fighters.length) * attacker_damage;
      attacker_crit = (1 + 0.2 * this.dead_fighters.length) * attacker_crit;
    }

    if (
      target instanceof Fighter &&
      target.fighter_class === FighterClasses.SHADOW_DANCER
    ) {
      const rng_evade = Math.random();
      if (this.verbose >= 2)
        console.log(`Shadow dancer evade rng: ${rng_evade.toFixed(3)} < 0.25`);
      if (rng_evade < 0.25) {
        if (this.verbose >= 1)
          this._draw_table_head(this.I18N.getBattleMsg("SP_SD_EVADED"));
        /*           console.log(
            "Shadow dancer has evaded. Next attack will be double damage",
          ); */
        this.shadow_dancer_double_damage = true;
        attacker.hit_counter += 1;
        return;
      }
    }

    if (this.bastion_aura) {
      if (this.verbose >= 1)
        this._draw_table_head(this.I18N.getBattleMsg("SP_BS_DMG_DODGE"), true);
      /*         console.log(
          "Bastion aura adds 25% damage reduction and 50% increased dodge ",
        ); */
      additional_dr = additional_dr + 0.25;
      target_dodge *= 1.5;
      this.bastion_aura = false;
    }

    const attacker_chance = attacker_hit / (attacker_hit + target_dodge);
    let rng_attack;
    if (this.cannot_be_dodged) {
      rng_attack = -1.0;
      if (this.verbose >= 1)
        this._draw_table_head(
          formatString(
            this.I18N.getBattleMsg("ATK_CANNOT_DODGE"),
            attacker_name,
          ),
          true,
        );
      //console.log(`${attacker_name} attack cannot be dodged`);
      this.cannot_be_dodged = false;
    } else {
      rng_attack = Math.random();
      if (this.verbose >= 2)
        this._draw_table_head(
          formatString(
            this.I18N.getBattleMsg("ATK_RNG_SUCC"),
            rng_attack.toFixed(3),
            attacker_chance.toFixed(3),
          ),
          true,
        );
      /*         console.log(
          `Successful attack rng: ${rng_attack.toFixed(3)} < ${attacker_chance.toFixed(3)}`,
        ); */
    }

    if (rng_attack < attacker_chance) {
      attacker.hit_counter += 1;

      if (
        attacker instanceof Fighter &&
        attacker.fighter_class === FighterClasses.SHADOW_DANCER &&
        this.shadow_dancer_double_damage
      ) {
        if (this.verbose >= 1)
          this._draw_table_head(
            this.I18N.getBattleMsg("SP_SD_APL_DOUBLEDMG"),
            true,
          );
        //console.log("Shadow Dancer applies double damage");
        attacker_damage = attacker_damage * 2;
        this.shadow_dancer_double_damage = false;
      }

      if (this.paladin_aura) {
        if (this.verbose >= 1)
          this._draw_table_head(
            this.I18N.getBattleMsg("SP_PL_DMG_REDUCTION"),
            true,
          );
        //console.log("Paladin aura adds 15% damage reduction");
        additional_dr = additional_dr + 0.15;
        this.paladin_aura = false;
      }

      let dmg_amount =
        target_defense * (1 - additional_dr) * attacker_damage * damage_mult;
      const rng_crit = Math.random();
      if (this.verbose >= 2)
        this._draw_table_head(
          formatString(
            this.I18N.getBattleMsg("CRT_RNG_INFO"),
            rng_attack.toFixed(3),
          ),
          true,
        );
      //console.log(`Crit rng: ${rng_attack.toFixed(3)} < 0.1`);
      if (rng_crit < 0.1) {
        dmg_amount = dmg_amount * (1 + attacker_crit);
      }
      const dmg_final = Math.floor(dmg_amount);
      const dmg_applied = Math.max(dmg_final, 0.0);
      if (this.verbose >= 1)
        this._draw_table_head(
          formatString(
            this.I18N.getBattleMsg("DAMAGE_INFO"),
            attacker_name,
            target_name,
            dmg_applied,
          ),
        );
      /*         console.log(
          `${attacker_name} hits ${target_name} and deals ${dmg_applied} damage.`,
        ); */
      target.current_health = Math.max(
        0.0,
        target.current_health - dmg_applied,
      );
    } else {
      if (this.verbose >= 1)
        this._draw_table_head(
          formatString(
            this.I18N.getBattleMsg("ATK_MISS"),
            attacker_name,
            target_name,
          ),
        );
      //console.log(`${attacker_name} misses attacking ${target_name}.`);
      if (
        target instanceof Fighter &&
        target.fighter_class === FighterClasses.SHADOW_DANCER
      ) {
        if (this.verbose >= 1) this._draw_table_head("SP_SD_DODGED");
        /*           console.log(
            "Shadow dancer has dodged (not evaded). Next attack will deal normal damage",
          ); */
      }
    }
  }

  _check_battle_is_over() {
    let fighters_health = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const f = this.fighters.all_fighters[i][j];
        if (f) fighters_health += f.current_health;
      }
    }
    if (fighters_health === 0.0) return "mobs";

    let mobs_health = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const m = this.mobs.mobs[i][j];
        if (m) mobs_health += m.current_health;
      }
    }
    if (mobs_health === 0.0) return "fighters";
    return null;
  }

  _find_target(target_group) {
    if (target_group === "mobs") {
      for (const [i, j] of [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ]) {
        const m = this.mobs.mobs[i][j];
        if (m && m.current_health > 0.0) return m;
      }
      return null;
    }
    if (target_group === "fighters") {
      for (const [i, j] of [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ]) {
        const f = this.fighters.all_fighters[i][j];
        if (f && f.current_health > 0.0) return f;
      }
      return null;
    }
    throw new Error(`Unknown target type ${target_group}`);
  }

  _find_target_for_assassin() {
    for (const [i, j] of [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 0],
      [1, 0],
      [2, 0],
    ]) {
      const m = this.mobs.mobs[i][j];
      if (m && m.current_health > 0.0) return m;
    }
    return null;
  }

  _find_target_for_hunter() {
    for (const pair of [
      [
        [0, 0],
        [0, 1],
      ],
      [
        [1, 0],
        [1, 1],
      ],
      [
        [2, 0],
        [2, 1],
      ],
    ]) {
      const [[f1_i, f1_j], [f2_i, f2_j]] = pair;
      const f1 = this.mobs.mobs[f1_i][f1_j];
      const f2 = this.mobs.mobs[f2_i][f2_j];
      if ((f1 && f1.current_health > 0.0) || (f2 && f2.current_health > 0.0))
        return [f1, f2];
    }
    return null;
  }

  _find_target_for_mage() {
    for (const triple of [
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    ]) {
      const [[f1_i, f1_j], [f2_i, f2_j], [f3_i, f3_j]] = triple;
      const f1 = this.mobs.mobs[f1_i][f1_j];
      const f2 = this.mobs.mobs[f2_i][f2_j];
      const f3 = this.mobs.mobs[f3_i][f3_j];
      if (
        (f1 && f1.current_health > 0.0) ||
        (f2 && f2.current_health > 0.0) ||
        (f3 && f3.current_health > 0.0)
      )
        return [f1, f2, f3];
    }
    return null;
  }

  _sort_by_hit() {
    const d = [];
    for (const [i, j] of [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ]) {
      const fighter = this.fighters.all_fighters[i][j];
      if (fighter !== null)
        d.push({ i, j, type: "fighters", hit: fighter.hit });
      else d.push({ i, j, type: "fighters", hit: 0.0 });

      const mob = this.mobs.mobs[i][j];
      if (mob !== null) d.push({ i, j, type: "mobs", hit: mob.hit });
      else d.push({ i, j, type: "mobs", hit: 0.0 });
    }
    d.sort((a, b) => {
      if (b.hit !== a.hit) return b.hit - a.hit;
      if (-b.j !== -a.j) return -b.j - -a.j;
      return -b.i - -a.i;
    });
    return d;
  }
}
