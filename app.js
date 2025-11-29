import { FightersSquad } from "./squads/FightersSquad.js";
import { MobsSquad } from "./squads/MobsSquad.js";
import { Battle } from "./battle/Battle.js";
import { Fighter, FighterClasses } from "./characters/Fighter.js";
import { I18nManager, formatString } from "./utils/i18n.js";
import { ArmoryItem } from "./armory/ArmoryItem.js";
import { calculateFighterCost, millify, calculateTierLevel } from "./utils/utils.js";

const fightersGridEl = document.getElementById("fightersGrid");
const verboseEl = document.getElementById("verbose");
const mobLevelEl = document.getElementById("mobLevel");
const numBattlesEl = document.getElementById("numBattles");
const outputEl = document.getElementById("output");
const fightBtn = document.getElementById("fightBtn");
const clearLogBtn = document.getElementById("clearLogBtn");
const createSnapshotBtn = document.getElementById("createSnapshotBtn");
const snapshotOutputField = document.getElementById("snapshotOutputField");
const loadSnapshotBtn = document.getElementById("loadSnapshotBtn");
const totalFightersCostEl = document.getElementById("totalFightersCost");

const apiKeyEl = document.getElementById("apiKey");
const importBtn = document.getElementById("importBtn");

const importConfirmModal = document.getElementById("importConfirmModal");
const confirmImportBtn = document.getElementById("confirmImport");
const cancelImportBtn = document.getElementById("cancelImport");
const dontShowImportWarningEl = document.getElementById(
  "dontShowImportWarning",
);

const fighterModal = document.getElementById("fighterModal");
const closeFighterModal = document.getElementById("closeFighterModal");
const saveFighterBtn = document.getElementById("saveFighter");
const fighterClassSelect = document.getElementById("fighterClass");
const fighterNameInput = document.getElementById("fighterName");
const modifiedFighterCostEl = document.getElementById("modifiedFighterCost");
const staticFighterCostEl = document.getElementById("staticFighterCost");

const benchGridEl = document.getElementById("benchGrid");
const addToBenchBtn = document.getElementById("addToBench");

const armoryGridEl = document.getElementById("armoryGrid");
const itemModal = document.getElementById("itemModal");
const closeItemModal = document.getElementById("closeItemModal");
const saveItemBtn = document.getElementById("saveItem");
const itemNameInput = document.getElementById("itemName"); // Universal name input
const itemTabbedContent = document.getElementById("itemTabbedContent"); // New wrapper for tabbed interface
const itemOriginalFreeValuesForm = document.getElementById("itemOriginalFreeValuesForm"); // New wrapper for original free values
const itemStatsFreeValuesContainerTab = document.getElementById("itemStatsFreeValuesContainerTab"); // Free values container inside tab
const itemStatsOriginalFreeValuesContainer = document.getElementById("itemStatsOriginalFreeValuesContainer"); // Free values container for original interface
const itemStatsLevelTiersContainer = document.getElementById("itemStatsLevelTiersContainer");
const itemLevelInput = document.getElementById("itemLevel");
const calculatedStatsDisplay = document.getElementById("calculatedStatsDisplay");
const addToArmoryBtn = document.getElementById("addToArmory");
const levelTiersContent = document.getElementById("levelTiersContent");
const freeValuesContent = document.getElementById("freeValuesContent");
const tabButtons = itemModal.querySelectorAll(".tab-button");

const changelogLink = document.getElementById("changelogLink");
const changelogModal = document.getElementById("changelogModal");
const closeChangelog = document.getElementById("closeChangelog");
const lastUpdatedEl = document.getElementById("lastUpdated");

// Constants for fighter stats
const FIGHTER_STAT_FIELDS = [
    "fighter_health", "fighter_damage", "fighter_hit", "fighter_defense", "fighter_crit", "fighter_dodge",
    "object_health", "object_damage", "object_hit", "object_defense", "object_crit", "object_dodge",
];
const STAT_SERIALIZATION_MAP = {
    fighter_health: "fh", fighter_damage: "fd", fighter_hit: "fi", fighter_defense: "fdef", fighter_crit: "fcr", fighter_dodge: "fdo",
    object_health: "oh", object_damage: "od", object_hit: "oi", object_defense: "odef", object_crit: "ocr", object_dodge: "odo",
};
const STAT_DESERIALIZATION_MAP = Object.fromEntries(Object.entries(STAT_SERIALIZATION_MAP).map(([k, v]) => [v, k]));

//Create i18n Manager
const I18N = new I18nManager();
let classDescriptions = null;
await I18N.initPromise;

// Now We Use I18nManager to load Descriptions ;D
I18N.initPromise.then(() => {
  classDescriptions = I18N.getClassDescription();
});

I18N.on("languageChanged", (event) => {
  classDescriptions = I18N.getClassDescription();
  renderGrid();
  renderBench();
});

// First register i18n Manager to global because other module may use it.
window.i18nManager = I18N;

// Create "COPY" image SVG
function createDuplicateIcon() {
  const div = document.createElement('div');
  div.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
    <path d="M19 7h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2"></path>
  </svg>`.trim();
  return div.firstChild;
}

// Create tooltip element
const classTooltip = document.createElement("div");
classTooltip.id = "classTooltip";
document.body.appendChild(classTooltip);

// Populate the original select for form compatibility
for (const value of Object.values(FighterClasses)) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = I18N.getFighterName(value.replace(" ", "_"));
  fighterClassSelect.appendChild(opt);
}

// Hide the original select and create custom dropdown
fighterClassSelect.style.display = "none";

// Create custom dropdown container
const customDropdown = document.createElement("div");
customDropdown.className = "custom-dropdown";

// Create custom dropdown button
const dropdownButton = document.createElement("button");
dropdownButton.type = "button";
dropdownButton.className = "custom-dropdown-button";
dropdownButton.innerHTML = `${I18N.getFighterName(FighterClasses.NONE)} <span>▼</span>`;

// Create dropdown options container
const dropdownOptions = document.createElement("div");
dropdownOptions.className = "custom-dropdown-options";

// Create options
Object.values(FighterClasses).forEach((className) => {
  const option = document.createElement("div");
  option.className = "custom-dropdown-option";
  option.textContent = I18N.getFighterName(
    className.replace(" ", "_").toUpperCase(),
  );
  option.dataset.i18n = `FighterName.${className.replace(" ", "_").toUpperCase()}`;
  option.dataset.value = className;

  option.addEventListener("mouseenter", (e) => {
    const description = classDescriptions[className];
    if (description) {
      classTooltip.textContent = description;
      classTooltip.style.left = e.pageX + 10 + "px";
      classTooltip.style.top = e.pageY - 30 + "px";
      classTooltip.classList.add("visible");
    }
  });

  option.addEventListener("mousemove", (e) => {
    if (classTooltip.classList.contains("visible")) {
      classTooltip.style.left = e.pageX + 10 + "px";
      classTooltip.style.top = e.pageY - 30 + "px";
    }
  });

  option.addEventListener("mouseleave", () => {
    classTooltip.classList.remove("visible");
  });

  option.addEventListener("click", () => {
    fighterClassSelect.value = className;
    dropdownButton.innerHTML = `${I18N.getFighterName(className)} <span>▼</span>`;
    dropdownOptions.classList.remove("open");
    dropdownButton.classList.remove("open");
    classTooltip.classList.remove("visible");
    fighterClassSelect.dispatchEvent(new Event("change"));
  });

  dropdownOptions.appendChild(option);
});

// Toggle dropdown
dropdownButton.addEventListener("click", () => {
  dropdownOptions.classList.toggle("open");
  dropdownButton.classList.toggle("open");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!customDropdown.contains(e.target)) {
    dropdownOptions.classList.remove("open");
    dropdownButton.classList.remove("open");
    classTooltip.classList.remove("visible");
  }
});

customDropdown.appendChild(dropdownButton);
customDropdown.appendChild(dropdownOptions);

// Insert custom dropdown after the original select
fighterClassSelect.parentNode.insertBefore(
  customDropdown,
  fighterClassSelect.nextSibling,
);

// Helper function to duplicate a fighter
function duplicateFighter(originalFighter) {
  if (!originalFighter) return null;

  const originalRawData = originalFighter.__raw || {};
  const newRawData = { ...originalRawData }; // Start with a copy of the original raw data

  newRawData.isDuplicate = true;
  newRawData.base = {
    name: originalFighter.name, // This is the original fighter's name
    fighter_class: originalFighter.fighter_class,
  };
  // Update the name property in newRawData to reflect the duplicated state
  newRawData.name = formatString(
    I18N.getUIElement("DUPLICATE_NAME"),
    originalFighter.name,
  );

  const duplicate = new Fighter(originalFighter.fighter_class, newRawData); // Pass the updated raw data
  duplicate.__raw = { ...newRawData }; // Ensure __raw also has the updated name

  return duplicate;
}

// Persistence Keys
const LS_KEYS = {
  grid: "dungeon:gridState:v1",
  bench: "dungeon:benchState:v1",
  armory: "dungeon:armoryState:v1",
  mobLevel: "dungeon:mobLevel",
  numBattles: "dungeon:numBattles",
  verbose: "dungeon:verbose",
  apiKey: "dungeon:apiKey",
  dontShowImportWarning: "dungeon:dontShowImportWarning",
};

function serializeFighter(f) {
    if (!f) return null;
    const raw = f.__raw || {};
    const serialized = {
        fc: f.fighter_class,
        name: f.name,
    };

    for (const [key, shortKey] of Object.entries(STAT_SERIALIZATION_MAP)) {
        if (raw[key]) serialized[shortKey] = raw[key];
    }

    if (f.isDuplicate) serialized.d = true;
    if (f.base) serialized.base = f.base;
    if (f.equippedItemId) serialized.eId = f.equippedItemId;

    return serialized;
}

function deserializeFighter(obj) {
    if (!obj || !obj.fc) return null;

    const data = { name: obj.name };
    for (const [shortKey, longKey] of Object.entries(STAT_DESERIALIZATION_MAP)) {
        data[longKey] = Math.max(0, obj[shortKey] || 0);
    }

    data.isDuplicate = obj.d || false;
    data.base = obj.base || null;
    data.equippedItemId = obj.eId || null;

    try {
        const fighter = new Fighter(obj.fc, data);
        fighter.__raw = { ...data };
        fighter.name = data.name;
        return fighter;
    } catch (error) {
        console.warn("Failed to deserialize fighter:", obj, error);
        return null;
    }
}

function serializeItem(item) {
  if (!item) return null;
  return {
    id: item.id, // Shorten _id to id
    name: item.name,
    r: item.rarity, // Shorten rarity to r
    s: item.stats, // Shorten stats to s
    lvl: item.level, // Add item level
    tiers: item.tiers, // Add item tiers
  };
}

function deserializeItem(obj) {
  if (!obj) return null;
  try {
    // Map shortened keys back to original names for ArmoryItem constructor
    const itemData = {
      _id: obj.id,
      name: obj.name,
      rarity: obj.r,
      stats: obj.s,
      level: obj.lvl, // Deserialize item level
      tiers: obj.tiers, // Deserialize item tiers
    };
    return new ArmoryItem(itemData);
  } catch (error) {
    console.warn(I18N.getConsoleMsg("ERR_FAIL_LOAD_ITEM"), obj, error);
    return null;
  }
}

function saveState() {
  const raw = gridState.map((row) => row.map(serializeFighter));
  const benchRaw = benchState.map(serializeFighter);
  const armoryRaw = armoryState.map(serializeItem);
  localStorage.setItem(LS_KEYS.grid, JSON.stringify(raw));
  localStorage.setItem(LS_KEYS.bench, JSON.stringify(benchRaw));
  localStorage.setItem(LS_KEYS.armory, JSON.stringify(armoryRaw));
  localStorage.setItem(LS_KEYS.mobLevel, String(mobLevelEl.value || ""));
  localStorage.setItem(LS_KEYS.numBattles, String(numBattlesEl.value || ""));
  localStorage.setItem(LS_KEYS.verbose, verboseEl.checked ? "1" : "0");
  localStorage.setItem(LS_KEYS.apiKey, String(apiKeyEl.value || ""));
  localStorage.setItem(
    LS_KEYS.dontShowImportWarning,
    dontShowImportWarningEl.checked ? "1" : "0",
  );
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEYS.grid) || "null");
    if (Array.isArray(raw) && raw.length === 3) {
      for (let i = 0; i < 3; i++) {
        if (Array.isArray(raw[i]) && raw[i].length === 2) {
          for (let j = 0; j < 2; j++) {
            gridState[i][j] = deserializeFighter(raw[i][j]);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to load grid state:", error); //ERR_FAIL_LOAD_GRID
    // Clear corrupted data
    localStorage.removeItem(LS_KEYS.grid);
  }

  try {
    const benchRaw = JSON.parse(localStorage.getItem(LS_KEYS.bench) || "[]");
    if (Array.isArray(benchRaw)) {
      benchState.length = 0; // Clear array
      benchRaw.forEach((data) => {
        const fighter = deserializeFighter(data);
        if (fighter) {
          benchState.push(fighter);
        }
      });
    }
  } catch (error) {
    console.warn("Failed to load bench state:", error); //ERR_FAIL_LOAD_BENCH
    localStorage.removeItem(LS_KEYS.bench);
  }

  try {
    const armoryRaw = JSON.parse(localStorage.getItem(LS_KEYS.armory) || "[]");
    if (Array.isArray(armoryRaw)) {
      armoryState.length = 0; // Clear array
      armoryRaw.forEach((data) => {
        const item = deserializeItem(data);
        if (item) {
          armoryState.push(item);
        }
      });
      renderArmory();
    }
  } catch (error) {
    console.warn(I18N.getConsoleMsg("ERR_FAIL_LOAD_ARMORY"), error);
    localStorage.removeItem(LS_KEYS.armory);
  }

  const mob = localStorage.getItem(LS_KEYS.mobLevel);
  const num = localStorage.getItem(LS_KEYS.numBattles);
  const ver = localStorage.getItem(LS_KEYS.verbose);
  const api = localStorage.getItem(LS_KEYS.apiKey);

  if (mob) {
    const mobValue = Math.max(1, parseInt(mob) || 1);
    mobLevelEl.value = mobValue;
  }
  if (num) {
    let numValue = Math.max(1, parseInt(num) || 1);
    if (numValue > 1000000) numValue = 1000000;
    numBattlesEl.value = numValue;
  }
  if (ver) verboseEl.checked = ver === "1";
  if (api) apiKeyEl.value = api;

  const dontShow = localStorage.getItem(LS_KEYS.dontShowImportWarning);
  if (dontShow) dontShowImportWarningEl.checked = dontShow === "1";
}

// State: 3x2 fighters grid
const gridState = Array.from({ length: 3 }, () =>
  Array.from({ length: 2 }, () => null),
);
// State: bench fighters (dynamic array)
const benchState = [];
// State: armory items (dynamic array)
const armoryState = [];
let editingCell = { i: 0, j: 0 };
let editingBench = { index: -1, isAddNew: false };
let editingArmory = { index: -1 };

function updateTotalFightersCost() {
    let totalCost = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            const fighter = gridState[i][j];
            if (fighter) {
                const fighterStats = {
                    fighter_health: fighter.__raw.fighter_health || 0,
                    fighter_damage: fighter.__raw.fighter_damage || 0,
                    fighter_hit: fighter.__raw.fighter_hit || 0,
                    fighter_defense: fighter.__raw.fighter_defense || 0,
                    fighter_crit: fighter.__raw.fighter_crit || 0,
                    fighter_dodge: fighter.__raw.fighter_dodge || 0,
                };
                totalCost += calculateFighterCost(fighterStats);
            }
        }
    }
    totalFightersCostEl.textContent = `${I18N.getUIElement("TOTAL_FIGHTERS_COST")}${millify(totalCost)}`;
}

function createFighterInfoElement(fighter) {
    const infoContainer = document.createElement("div");
    infoContainer.className = "fighter-info";

    if (fighter) {
        const classDetails = document.createElement("div");
        classDetails.className = "fighter-class-details";
        classDetails.textContent = I18N.getFighterName(fighter.fighter_class);

        const fighterName = document.createElement("div");
        fighterName.className = "fighter-name-details";
        fighterName.textContent = fighter.name;

        const itemDetails = document.createElement("div");
        itemDetails.className = "fighter-item-details";
        const equippedItem = armoryState.find(item => item.id === fighter.equippedItemId);
        const itemName = equippedItem ? equippedItem.name : I18N.getUIElement("NO_ITEM");
        itemDetails.textContent = itemName.substring(0, 25) + (itemName.length > 25 ? "..." : "");

        infoContainer.append(classDetails, fighterName, itemDetails);
    } else {
        infoContainer.textContent = I18N.getFighterName("Empty");
    }
    return infoContainer;
}

function renderGrid() {
  fightersGridEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.createElement("div");
      const fighter = gridState[i][j];

      cell.className = fighter ? "fighter-cell" : "fighter-cell empty";
      cell.draggable = !!fighter;
      cell.dataset.gridPosition = `${i},${j}`;

      cell.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") openFighterEditor(i, j);
      });

      cell.addEventListener("dragenter", (e) => {
        e.preventDefault();
        if (draggedData && cell !== draggedElement) cell.classList.add("drag-over");
      });
      cell.addEventListener("dragleave", (e) => {
        if (!cell.contains(e.relatedTarget)) cell.classList.remove("drag-over");
      });

      if (fighter) {
        cell.addEventListener("dragstart", handleDragStart);
        cell.addEventListener("dragend", handleDragEnd);
      }
      cell.addEventListener("dragover", handleDragOver);
      cell.addEventListener("drop", handleDrop);

      const name = document.createElement("span");
      name.className = "name";
      name.appendChild(createFighterInfoElement(fighter));
      cell.appendChild(name);

      if (fighter) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "fighter-buttons";

        const del = document.createElement("button");
        del.className = "btn small delete";
        del.dataset.i18n = "UIElement.DELETE";
        del.textContent = I18N.getUIElement("Delete");
        del.style.width = "55px";
        del.style.height = "25px";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          gridState[i][j] = null;
          saveState();
          renderGrid();
          updateTotalFightersCost();
        });

        const duplicate = document.createElement("button");
        duplicate.className = "btn small duplicate";
        duplicate.dataset.i18n = "UIElement.DUPLICATE";
        duplicate.title = I18N.getUIElement("Duplicate");
        duplicate.style.width = "55px";
        duplicate.style.height = "25px";
        duplicate.appendChild(createDuplicateIcon());
        duplicate.addEventListener("click", (e) => {
          e.stopPropagation();
          const duplicatedFighter = duplicateFighter(fighter);
          if (duplicatedFighter) {
            benchState.push(duplicatedFighter);
            saveState();
            renderBench();
          }
        });

        buttonContainer.append(del, duplicate);
        cell.appendChild(buttonContainer);
      } else {
        const add = document.createElement("button");
        add.className = "btn small add";
        add.dataset.i18n = "UIElement.ADD";
        add.textContent = I18N.getUIElement("Add");
        add.style.width = "55px";
        add.style.height = "30px";
        add.addEventListener("click", (e) => {
          e.stopPropagation();
          openFighterEditor(i, j);
        });
        cell.appendChild(add);
      }
      fightersGridEl.appendChild(cell);
    }
  }
  updateTotalFightersCost();
}

function renderBench() {
  benchGridEl.innerHTML = "";

  if (benchState.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "bench-fighter";
    placeholder.style.cssText = "opacity: 0.3; border: 2px dashed #36405a; background: transparent; text-align: center; color: #8892b0; font-size: 0.9em; min-height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 10px; padding: 0 0.66em; width: 100%;";
    placeholder.dataset.i18n = "UIElement.DROP_FIGHTER_HERE";
    placeholder.textContent = I18N.getUIElement("DROP_FIGHTER_HERE");
    placeholder.addEventListener("dragover", handleDragOver);
    placeholder.addEventListener("drop", handleDrop);
    benchGridEl.appendChild(placeholder);
    return;
  }

  benchState.forEach((fighter, index) => {
    const benchItem = document.createElement("div");
    benchItem.className = "bench-fighter";
    benchItem.draggable = true;
    benchItem.dataset.benchIndex = index;
    benchItem.style.width = "100%";

    benchItem.addEventListener("dragstart", handleDragStart);
    benchItem.addEventListener("dragend", handleDragEnd);
    benchItem.addEventListener("dragover", handleDragOver);
    benchItem.addEventListener("drop", handleDrop);

    benchItem.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (draggedData && benchItem !== draggedElement) benchItem.classList.add("drag-over");
    });
    benchItem.addEventListener("dragleave", (e) => {
      if (!benchItem.contains(e.relatedTarget)) benchItem.classList.remove("drag-over");
    });

    benchItem.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") openBenchFighterEditor(index);
    });

    const nameContainer = document.createElement("div");
    nameContainer.style.cssText = "flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; width: 100%;";

    const name = document.createElement("span");
    name.className = "name";
    name.style.cssText = "text-align: center; width: 100%;";
    name.appendChild(createFighterInfoElement(fighter));

    nameContainer.appendChild(name);
    benchItem.appendChild(nameContainer);

    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 0.1em; flex-shrink: 0;";

    const del = document.createElement("button");
    del.className = "btn small delete";
    del.textContent = "×";
    del.style.cssText = "font-size: 0.8em; padding: 0.2em; width: 40px; height: 20px; display: flex; align-items: center; justify-content: center;";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      benchState.splice(index, 1);
      saveState();
      renderBench();
    });

    const duplicate = document.createElement("button");
    duplicate.className = "btn small duplicate";
    duplicate.title = I18N.getUIElement("Duplicate");
    duplicate.style.cssText = "padding: 0.2em; width: 40px; height: 20px; display: flex; align-items: center; justify-content: center;";
    duplicate.appendChild(createDuplicateIcon());
    duplicate.addEventListener("click", (e) => {
      e.stopPropagation();
      const duplicatedFighter = duplicateFighter(fighter);
      if (duplicatedFighter) {
        benchState.push(duplicatedFighter);
        saveState();
        renderBench();
      }
    });

    actions.append(del, duplicate);
    benchItem.appendChild(actions);
    benchGridEl.appendChild(benchItem);
  });
}

function duplicateItem(originalItem) {
  if (!originalItem) return null;
  const duplicateData = JSON.parse(JSON.stringify(originalItem));
  duplicateData._id = `copy_${Date.now()}`;
  duplicateData.name = `Copy of ${originalItem.name}`;
  return new ArmoryItem(duplicateData);
}

function renderArmory() {
  armoryGridEl.innerHTML = "";
  armoryState.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "armory-item";
    itemEl.draggable = true;
    itemEl.dataset.armoryIndex = index;

    // Main content area (name, rarity) - clickable
    const mainContent = document.createElement("div");
    mainContent.style.flex = "1";
    mainContent.style.cursor = "pointer";
    mainContent.addEventListener("click", () => openItemEditor(index));

    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent =
      item.name.substring(0, 30) + (item.name.length > 30 ? "..." : "");
    mainContent.appendChild(nameEl);

    const rarityEl = document.createElement("div");
    rarityEl.className = "rarity";
    rarityEl.textContent = item.rarity;

    const customRarityText = I18N.getTranslation("ITEM_RARITY_CUSTOM");

    // Only display level if it's not a custom item created via free values
    const isCustomFreeValueItem = (item.rarity === customRarityText && Object.keys(item.tiers).length === 0);

    if (item.level && item.level > 0 && !isCustomFreeValueItem) {
      rarityEl.textContent += ` - Level ${item.level}`;
    }
    mainContent.appendChild(rarityEl);

    itemEl.appendChild(mainContent);

    // Buttons container
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.flexDirection = "column"; // On top of each other
    actions.style.alignItems = "center";
    actions.style.gap = "0.1em"; // Reduced gap
    actions.style.flexShrink = "0";
    actions.style.width = "40px"; // Wider container for buttons

    const del = document.createElement("button");
    del.className = "btn small delete";
    del.textContent = "×";
    del.title = I18N.getUIElement("DELETE");
    del.style.width = "100%";
    del.style.padding = "0.1em 0.2em"; // Compress padding
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      armoryState.splice(index, 1);
      saveState();
      renderArmory();
    });

    const duplicate = document.createElement("button");
    duplicate.className = "btn small duplicate";
    duplicate.title = I18N.getUIElement("DUPLICATE");
    duplicate.style.width = "100%";
    duplicate.style.padding = "0.1em 0.2em"; // Compress padding
    const duplicateIcon = createDuplicateIcon();
    duplicateIcon.style.width = "16px";
    duplicateIcon.style.height = "16px";
    duplicate.appendChild(duplicateIcon);
    duplicate.addEventListener("click", (e) => {
      e.stopPropagation();
      const newItem = duplicateItem(item);
      if (newItem) {
        armoryState.push(newItem);
        saveState();
        renderArmory();
      }
    });

    actions.appendChild(del);
    actions.appendChild(duplicate);
    itemEl.appendChild(actions);

    // Drag and drop listeners
    itemEl.addEventListener("dragstart", handleDragStart);
    itemEl.addEventListener("dragend", handleDragEnd);
    itemEl.addEventListener("dragover", handleDragOver);
    itemEl.addEventListener("drop", handleDrop);

    itemEl.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (draggedData && itemEl !== draggedElement) {
        itemEl.classList.add("drag-over");
      }
    });

    itemEl.addEventListener("dragleave", (e) => {
      if (!itemEl.contains(e.relatedTarget)) {
        itemEl.classList.remove("drag-over");
      }
    });

    armoryGridEl.appendChild(itemEl);
  });
}

const ALL_STAT_TYPES = [
  "health",
  "damage",
  "hit",
  "defense",
  "critDamage",
  "dodge",
];

function renderLevelTiersInputs(item) {
  itemStatsLevelTiersContainer.innerHTML = ""; // Clear previous inputs

  ALL_STAT_TYPES.forEach(statType => {
    const tierValue = item.tiers ? (item.tiers[statType] || 0) : 0;

    const statRow = document.createElement("div");
    statRow.style.display = "grid";
    statRow.style.gridTemplateColumns = "1fr auto 1fr"; // Label, "T", input
    statRow.style.gap = "0.8em";
    statRow.style.alignItems = "center";

    const label = document.createElement("label");
    label.textContent = I18N.getTranslation(
      "stat_" + statType.replace(/([A-Z])/g, "_$1").toLowerCase(),
    );
    statRow.appendChild(label);

    const tSpan = document.createElement("span");
    tSpan.textContent = "T";
    tSpan.style.marginRight = "0.2em"; // Small space between "T" and input
    statRow.appendChild(tSpan);

    const input = document.createElement("input");
    input.type = "number";
    input.dataset.statType = statType;
    input.min = "0";
    input.max = "12";
    input.value = tierValue;
    input.addEventListener("input", calculateAndDisplayTieredStats);
    statRow.appendChild(input);

    itemStatsLevelTiersContainer.appendChild(statRow);
  });

  itemLevelInput.addEventListener("input", calculateAndDisplayTieredStats);
}

function calculateAndDisplayTieredStats() {
  const level = parseInt(itemLevelInput.value) || 1;
  const stats = {};
  let displayText = "";

  ALL_STAT_TYPES.forEach(statType => {
    const input = itemStatsLevelTiersContainer.querySelector(`input[data-stat-type="${statType}"]`);
    const tier = parseInt(input.value) || 0;

    if (tier > 0) {
      const calculatedValue = calculateTierLevel(statType, level, tier);
      stats[statType] = calculatedValue;
      if (statType === "critDamage") {
        const displayValue = calculatedValue * 100; // Multiply by 100 for display
        displayText += `${I18N.getTranslation("stat_" + statType.toLowerCase())}: ${displayValue.toFixed(2)}% (T${tier})\n`;
      } else {
        displayText += `${I18N.getTranslation("stat_" + statType.toLowerCase())}: ${Math.round(calculatedValue)} (T${tier})\n`;
      }
    } else {
        stats[statType] = 0; // Ensure stats not present have a value of 0
    }
  });
  calculatedStatsDisplay.textContent = displayText || I18N.getTranslation("NO_TIERED_STATS_SELECTED");
  return stats;
}

// Tab switching logic
itemModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("tab-button")) {
    tabButtons.forEach(button => button.classList.remove("active"));
    e.target.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    const targetTabContent = document.getElementById(e.target.dataset.tab + "Content");
    if (targetTabContent) targetTabContent.classList.add("active");
  }
});

function openAddToArmoryEditor() {
  editingArmory = { index: -1, isAddNew: true };
  openItemEditor(-1); // Pass -1 to indicate a new item
}

function openItemEditor(index) {
  if (index !== -1) {
    editingArmory = { index: index, isAddNew: false };
  }

  const item =
    index !== -1 ? armoryState[index] : { name: "", rarity: "", stats: [], level: 1, tiers: {} };

  // Clear all containers that might be populated
  itemStatsFreeValuesContainerTab.innerHTML = "";
  itemStatsLevelTiersContainer.innerHTML = "";
  itemStatsOriginalFreeValuesContainer.innerHTML = "";
  calculatedStatsDisplay.textContent = "";

  // Reset tab active states
  tabButtons.forEach(button => button.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  // Populate universal item name input
  itemNameInput.value = item.name;

  if (editingArmory.isAddNew) {
    // Show tabbed content, hide original free values form
    itemTabbedContent.style.display = "block";
    itemOriginalFreeValuesForm.style.display = "none";

    // For new items, activate "Level/Tiers" tab by default
    const defaultTabButton = itemModal.querySelector('.tab-button[data-tab="levelTiers"]');
    const defaultTabContent = document.getElementById("levelTiersContent");
    if (defaultTabButton) defaultTabButton.classList.add("active");
    if (defaultTabContent) defaultTabContent.classList.add("active");

    // Populate item level input
    itemLevelInput.value = item.level || 1;

    // Render Level/Tiers tab content
    renderLevelTiersInputs(item);
    calculateAndDisplayTieredStats(); // Initial calculation

    // Prepare Free Values tab content (it will be populated if user switches to it)
    ALL_STAT_TYPES.forEach((statType) => {
      const existingStat = item.stats.find((s) => s.type === statType);
      let value = existingStat ? existingStat.value : 0;

      const statRow = document.createElement("div");
      statRow.style.display = "grid";
      statRow.style.gridTemplateColumns = "1fr 1fr 30px";
      statRow.style.gap = "0.8em";
      statRow.style.alignItems = "center";

      const label = document.createElement("label");
      let labelText = I18N.getTranslation(
        "stat_" + statType.replace(/([A-Z])/g, "_$1").toLowerCase(),
      );
      const tier = item.tiers ? (item.tiers[statType] || 0) : 0;
      if (tier > 0) {
        labelText += ` (T${tier})`;
      }
      label.textContent = labelText;
      statRow.appendChild(label);

      const input = document.createElement("input");
      input.type = "number";
      input.dataset.statType = statType;
      input.value = statType === "critDamage" ? value.toFixed(2) : value;
      statRow.appendChild(input);

      const percentSign = document.createElement("span");
      percentSign.textContent = statType === "critDamage" ? "%" : "";
      statRow.appendChild(percentSign);

      itemStatsFreeValuesContainerTab.appendChild(statRow);
    });

  } else {
    // Hide tabbed content, show original free values form
    itemTabbedContent.style.display = "none";
    itemOriginalFreeValuesForm.style.display = "block";

    // Render original free values form content
    renderOriginalFreeValuesInputs(item);
  }

  itemModal.style.display = "flex";
}

function renderOriginalFreeValuesInputs(item) {
  itemStatsOriginalFreeValuesContainer.innerHTML = ""; // Clear previous inputs

  ALL_STAT_TYPES.forEach((statType) => {
    const existingStat = item.stats.find((s) => s.type === statType);
    let value = existingStat ? existingStat.value : 0;

    const statRow = document.createElement("div");
    statRow.style.display = "grid";
    statRow.style.gridTemplateColumns = "1fr 1fr 30px";
    statRow.style.gap = "0.8em";
    statRow.style.alignItems = "center";

    const label = document.createElement("label");
    let labelText = I18N.getTranslation(
      "stat_" + statType.replace(/([A-Z])/g, "_$1").toLowerCase(),
    );
    const tier = item.tiers ? (item.tiers[statType] || 0) : 0;
    if (tier > 0) {
      labelText += ` (T${tier})`;
    }
    label.textContent = labelText;
    statRow.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.dataset.statType = statType;
    input.value = statType === "critDamage" ? value.toFixed(2) : Math.round(value);
    statRow.appendChild(input);

    const percentSign = document.createElement("span");
    percentSign.textContent = statType === "critDamage" ? "%" : "";
    statRow.appendChild(percentSign);

    itemStatsOriginalFreeValuesContainer.appendChild(statRow);
  });
}

function closeItemEditor() {
  editingArmory = { index: -1, isAddNew: false };
  itemModal.style.display = "none";
}

function saveItem() {
  if (editingArmory.index === -1 && !editingArmory.isAddNew) return;

  let itemToSave;
  if (editingArmory.isAddNew) {
    itemToSave = {
      _id: `new_item_${Date.now()}`, // Generate a unique ID for new items
      name: itemNameInput.value,
      rarity: I18N.getTranslation("ITEM_RARITY_CUSTOM"), // Default rarity for new items
      stats: [],
      level: 1,
      tiers: {}
    };
  } else {
    itemToSave = armoryState[editingArmory.index];
    itemToSave.name = itemNameInput.value;
    itemToSave.stats = []; // Clear existing stats to rebuild from form
    itemToSave.tiers = {};
    itemToSave.level = 1;
  }

  // Determine which form is active
  if (itemTabbedContent.style.display === "block") {
    const activeTab = itemModal.querySelector(".tab-button.active").dataset.tab;

    if (activeTab === "freeValues") {
      const statInputs = itemStatsFreeValuesContainerTab.querySelectorAll(
        "input[data-stat-type]",
      );
      statInputs.forEach((input) => {
        const statType = input.dataset.statType;
        let value = parseFloat(input.value) || 0;

        if (value !== 0) {
          itemToSave.stats.push({ type: statType, value: value });
        }
      });
    } else if (activeTab === "levelTiers") {
      const level = parseInt(itemLevelInput.value) || 1;
      const calculatedStats = calculateAndDisplayTieredStats(); // This function returns the calculated stats object

      itemToSave.level = level;
      ALL_STAT_TYPES.forEach(statType => {
          const input = itemStatsLevelTiersContainer.querySelector(`input[data-stat-type="${statType}"]`);
          const tier = parseInt(input.value) || 0;
          if (tier > 0) {
              let valueToSave = calculatedStats[statType];
              if (statType === 'critDamage') {
                  valueToSave *= 100; // Multiply by 100 for critDamage
              }
              itemToSave.stats.push({ type: statType, value: valueToSave, tier: tier });
              itemToSave.tiers[statType] = tier; // Save the tier value
          }
      });
    }
  } else { // itemOriginalFreeValuesForm is active
    const statInputs = itemStatsOriginalFreeValuesContainer.querySelectorAll(
      "input[data-stat-type]",
    );
    statInputs.forEach((input) => {
      const statType = input.dataset.statType;
      let value = parseFloat(input.value) || 0;

      if (value !== 0) {
        itemToSave.stats.push({ type: statType, value: value });
      }
    });
  }


  if (editingArmory.isAddNew) {
    armoryState.push(new ArmoryItem(itemToSave));
  }

  saveState();
  renderArmory();
  closeItemEditor();
}

closeItemModal.addEventListener("click", closeItemEditor);
saveItemBtn.addEventListener("click", saveItem);
addToArmoryBtn.addEventListener("click", openAddToArmoryEditor);

function openFighterEditor(i, j) {
  editingCell = { i, j };
  editingBench = { index: -1, isAddNew: false };
  const fighter = gridState[i][j];
  populateFighterModal(fighter);
  fighterModal.style.display = "flex";
}

function openBenchFighterEditor(index) {
  editingBench = { index, isAddNew: false };
  editingCell = { i: -1, j: -1 };
  const fighter = benchState[index];
  populateFighterModal(fighter);
  fighterModal.style.display = "flex";
}

function openAddToBenchEditor() {
  editingBench = { index: -1, isAddNew: true };
  editingCell = { i: -1, j: -1 };
  populateFighterModal(null);
  fighterModal.style.display = "flex";
}

function populateFighterModal(fighter) {
    const selectedClass = fighter ? fighter.fighter_class : FighterClasses.NONE;
    fighterClassSelect.value = selectedClass;
    fighterNameInput.value = fighter ? fighter.name : "";

    const dropdownButton = customDropdown.querySelector("button");
    if (dropdownButton) {
        dropdownButton.innerHTML = `${I18N.getFighterName(selectedClass.replace(" ", "_"))} <span>▼</span>`;
    }

    // Reset labels for object stats before applying new formatting
    FIGHTER_STAT_FIELDS.filter(id => id.startsWith("object_")).forEach(id => {
        const labelEl = document.querySelector(`label[for="${id}"]`);
        if (labelEl && labelEl.dataset.originalText) {
            labelEl.textContent = labelEl.dataset.originalText;
            delete labelEl.dataset.originalText;
        }
    });

    for (const id of FIGHTER_STAT_FIELDS) {
        const el = document.getElementById(id);
        if (!el) continue;

        let value = (fighter && fighter.__raw && typeof fighter.__raw[id] === "number") ? fighter.__raw[id] : 0;

        if (id === "object_crit") {
            el.value = value.toFixed(2);
            const labelEl = document.querySelector(`label[for="${id}"]`);
            if (labelEl) {
                // Store original text if not already stored
                if (!labelEl.dataset.originalText) {
                    labelEl.dataset.originalText = labelEl.textContent;
                }
                labelEl.textContent = labelEl.dataset.originalText + " (%)";
            }
        } else {
            el.value = Math.round(value);
        }
    }

    const fighterStats = {
        fighter_health: Number(document.getElementById("fighter_health").value) || 0,
        fighter_damage: Number(document.getElementById("fighter_damage").value) || 0,
        fighter_hit: Number(document.getElementById("fighter_hit").value) || 0,
        fighter_defense: Number(document.getElementById("fighter_defense").value) || 0,
        fighter_crit: Number(document.getElementById("fighter_crit").value) || 0,
        fighter_dodge: Number(document.getElementById("fighter_dodge").value) || 0,
    };
    const initialCost = calculateFighterCost(fighterStats);
    staticFighterCostEl.textContent = `${I18N.getUIElement("FIGHTER_GOLD")}: ${millify(initialCost)}`;
    updateModifiedFighterCost();

    fighterClassSelect.onchange = () => {
        const currentName = fighterNameInput.value.trim();
        const newClass = fighterClassSelect.value;

        if (fighter && fighter.isDuplicate && fighter.fighter_class !== newClass) {
            fighter.isDuplicate = false;
            fighter.base = null;
        }

        if (!currentName || (fighter && (currentName === fighter.fighter_class || (fighter.isDuplicate && currentName === fighter.base.name))) || (!fighter && (!currentName || Object.values(FighterClasses).includes(currentName)))) {
            fighterNameInput.value = I18N.getFighterName(newClass.replace(" ", "_"));
        }
    };
}

function closeFighterEditor() {
  fighterClassSelect.onchange = null;
  editingCell = { i: -1, j: -1 };
  editingBench = { index: -1, isAddNew: false };
  fighterModal.style.display = "none";
}

function updateModifiedFighterCost() {
  const fighterStats = {
    fighter_health: Number(document.getElementById("fighter_health").value) || 0,
    fighter_damage: Number(document.getElementById("fighter_damage").value) || 0,
    fighter_hit: Number(document.getElementById("fighter_hit").value) || 0,
    fighter_defense: Number(document.getElementById("fighter_defense").value) || 0,
    fighter_crit: Number(document.getElementById("fighter_crit").value) || 0,
    fighter_dodge: Number(document.getElementById("fighter_dodge").value) || 0,
  };

  const totalCost = calculateFighterCost(fighterStats);
  modifiedFighterCostEl.textContent = `${I18N.getUIElement("MODIFIED_FIGHTER_GOLD")}: ${millify(totalCost)}`;
}

saveFighterBtn.addEventListener("click", () => {
  const fc = fighterClassSelect.value;
  const fighterName = fighterNameInput.value.trim();
  const data = { name: fighterName || I18N.getFighterName(fc.replace(" ", "_")) };

  FIGHTER_STAT_FIELDS.forEach((field) => {
    const input = document.getElementById(field);
    if (input) {
      let value = Math.max(0, parseFloat(input.value) || 0);
      if (field === "object_crit") {
        value = Math.round(value * 100) / 100;
      } else {
        value = Math.round(value);
      }
      data[field] = value;
    }
  });

  const originalFighter = (editingCell.i >= 0 && editingCell.j >= 0)
      ? gridState[editingCell.i][editingCell.j]
      : (editingBench.index >= 0 ? benchState[editingBench.index] : null);

  if (originalFighter && originalFighter.equippedItemId) {
    data.equippedItemId = originalFighter.equippedItemId;
  }

  try {
    const f = new Fighter(fc, data);
    f.__raw = { ...data };
    f.name = data.name;

    if (editingCell.i >= 0 && editingCell.j >= 0) {
      gridState[editingCell.i][editingCell.j] = f;
      renderGrid();
    } else if (editingBench.isAddNew) {
      benchState.push(f);
      renderBench();
    } else if (editingBench.index >= 0) {
      benchState[editingBench.index] = f;
      renderBench();
    }
  } catch (error) {
    console.error(I18N.getConsoleMsg("ERR_FAIL_CREA_FIGHTER"), error);
    alert(I18N.getAlertMsg("ERR_FAIL_CREA_FIGHTER"));
    return;
  }
  saveState();
  closeFighterEditor();
});

function setupModalBackdropClose(modalElement, closeFunction) {
    modalElement.addEventListener("click", (e) => {
        if (e.target === modalElement) closeFunction();
    });
    modalElement.querySelector(".modal").addEventListener("click", (e) => e.stopPropagation());
}

// Close modal when clicking the close button or outside
closeFighterModal.addEventListener("click", closeFighterEditor);
setupModalBackdropClose(fighterModal, closeFighterEditor);

function buildFightersSquad() {
  const createFreshFighter = (fighter) => {
    if (!fighter) return null;
    const rawData = fighter.__raw || {};
    rawData.name = fighter.name;
    return new Fighter(fighter.fighter_class, rawData);
  };

  return new FightersSquad(
    createFreshFighter(gridState[0][0]), createFreshFighter(gridState[1][0]), createFreshFighter(gridState[2][0]),
    createFreshFighter(gridState[0][1]), createFreshFighter(gridState[1][1]), createFreshFighter(gridState[2][1]),
  );
}

function runBattles() {
  outputEl.innerHTML = "";

  let level = Math.max(1, parseInt(mobLevelEl.value) || 1);
  let n = Math.max(1, parseInt(numBattlesEl.value) || 1);
  if (n > 1000000) n = 1000000;

  mobLevelEl.value = level;
  numBattlesEl.value = n;
  saveState();

  let fighterWins = 0;
  let totalMobsHealth = 0;
  let battlesWithSurvivors = 0;
  let lastBattleLog = [];
  const originalConsoleLog = console.log;

  const actualBattlesToRun = verboseEl.checked ? 1 : n;
  const shouldLogVerbose = verboseEl.checked;

  try {
    if (shouldLogVerbose) {
      console.log = (...args) => lastBattleLog.push(args.join(" "));
    }

    for (let k = 0; k < actualBattlesToRun; k++) {
      const fighters = buildFightersSquad();
      const mobs = new MobsSquad(level);
      const battle = new Battle(fighters, mobs, shouldLogVerbose ? 1 : 0);
      const [winner, , , mobHealth] = battle.battle();

      if (winner === "fighters") fighterWins++;
      if (winner === "mobs") {
        totalMobsHealth += mobHealth;
        battlesWithSurvivors++;
      }
    }
  } finally {
    console.log = originalConsoleLog;
  }

  if (shouldLogVerbose) {
    outputEl.innerHTML = lastBattleLog.join("\n");
  } else {
    const victoryChance = (fighterWins / actualBattlesToRun) * 100;
    const avgHealthSurvivors = battlesWithSurvivors > 0 ? Math.round(totalMobsHealth / battlesWithSurvivors) : 0;

    outputEl.innerHTML = `${formatString(I18N.getUIElement("VICTORY_CHANCE"), victoryChance.toFixed(2))}<br>
                           ${formatString(I18N.getUIElement("AVG_SURVIVOR_HEALTH"), avgHealthSurvivors)}<br>
                           ${formatString(I18N.getUIElement("CHANCE_60_MIN"), ((1.0 - (1.0 - victoryChance / 100.0) ** 60) * 100.0).toFixed(2))}`;
  }
}

fightBtn.addEventListener("click", runBattles);
clearLogBtn.addEventListener("click", () => { outputEl.innerHTML = ""; });

function createSnapshot() {
  const snapshotData = {
    grid: gridState.map((row) => row.map(serializeFighter)),
    armory: armoryState.map(serializeItem),
  };

  try {
    const jsonString = JSON.stringify(snapshotData);
    const jsonUint8 = new TextEncoder().encode(jsonString);
    const compressedUint8 = pako.deflate(jsonUint8);
    const binaryString = String.fromCharCode.apply(null, compressedUint8);
    snapshotOutputField.value = btoa(binaryString);
  } catch (error) {
    console.error("Error compressing snapshot data:", error);
    snapshotOutputField.value = btoa(JSON.stringify(snapshotData));
  }
  snapshotOutputField.select();
  snapshotOutputField.setSelectionRange(0, 99999);
}

createSnapshotBtn.addEventListener("click", createSnapshot);

loadSnapshotBtn.addEventListener("click", () => {
  const base64String = snapshotOutputField.value.trim();
  if (!base64String) return;

  try {
    const decodedBinaryString = atob(base64String);
    let jsonString;
    try {
      const decodedUint8 = new Uint8Array(decodedBinaryString.split('').map(char => char.charCodeAt(0)));
      jsonString = pako.inflate(decodedUint8, { to: 'string' });
    } catch (e) {
      jsonString = decodedBinaryString;
    }

    const snapshotData = JSON.parse(jsonString);

    if (snapshotData.grid) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          gridState[i][j] = deserializeFighter(snapshotData.grid[i][j]);
        }
      }
    }

    if (snapshotData.armory) {
      snapshotData.armory.forEach((itemData) => {
        const newItem = deserializeItem(itemData);
        if (newItem && !armoryState.some((existingItem) => existingItem.id === newItem.id)) {
          armoryState.push(newItem);
        }
      });
    }
    renderGrid();
    renderArmory();
    saveState();
  } catch (error) {
    console.error("Failed to load snapshot:", error);
    alert(I18N.getAlertMsg("ERR_SNAPSHOT_LOAD_FAIL"));
  }
});

// API Import functionality
importBtn.addEventListener("click", () => {
  const apiKey = apiKeyEl.value.trim();
  if (!apiKey) {
    alert(I18N.getAlertMsg("ERR_NULL_API"));
    return;
  }

  if (localStorage.getItem(LS_KEYS.dontShowImportWarning) === "1") {
    performImport(apiKey);
  } else {
    importConfirmModal.style.display = "flex";
  }
});

// Confirmation modal event handlers
confirmImportBtn.addEventListener("click", () => {
  if (dontShowImportWarningEl.checked) {
    localStorage.setItem(LS_KEYS.dontShowImportWarning, "1");
  }
  importConfirmModal.style.display = "none";
  performImport(apiKeyEl.value.trim());
});

cancelImportBtn.addEventListener("click", () => {
  importConfirmModal.style.display = "none";
});

setupModalBackdropClose(importConfirmModal, () => {
    importConfirmModal.style.display = "none";
});

async function performImport(apiKey) {
  try {
    importBtn.disabled = true;
    importBtn.textContent = I18N.getUIElement("IMPORTING");

    const response = await fetch(
      "https://http.v2.queslar.com/api/character/fighter/presets",
      { headers: { "QUESLAR-API-KEY": apiKey } },
    );

    if (!response.ok) {
      throw new Error(formatString(I18N.getAlertMsg("ERR_HTTP_ERROR"), response.status));
    }
    const data = await response.json();
    const result = processImportedData(data);
    if (!result.success) {
      console.warn(I18N.getConsoleMsg("ERR_IMPORT_FAIL"), result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error(I18N.getConsoleMsg("ERR_IMPORT_FAIL"), error);
    alert(formatString(I18N.getAlertMsg("ERR_IMPORT_FAIL"), error.message));
  } finally {
    importBtn.disabled = false;
    importBtn.textContent = I18N.getTranslation("import_button");
  }
}

function processImportedData(apiData) {
  try {
    if (!apiData.output || !Array.isArray(apiData.output)) {
      return { success: false, message: I18N.getConsoleMsg("IVLD_API_FORMAT") };
    }

    const dungeonPreset = apiData.output.find(p => p.preset?.assignment === "dungeon");

    if (!dungeonPreset) {
      console.warn(I18N.getConsoleMsg("INFO_AVIL_PRESET"), apiData.output.map(p => ({ name: p.preset?.name, assignment: p.preset?.assignment })));
      return { success: false, message: I18N.getConsoleMsg("INFO_NO_AVIL_PRESET") };
    }

    gridState.forEach(row => row.fill(null));

    let importedCount = 0;
    (dungeonPreset.fighters || []).forEach((fighterData) => {
      try {
        const fighter = createFighterFromApiData(fighterData);
        if (!fighter) return;

        const { row, column } = fighterData.placement || {};
        let placed = false;
        if (row !== undefined && column !== undefined && column >= 0 && column < 3 && row >= 0 && row < 2 && !gridState[column][row]) {
            gridState[column][row] = fighter;
            placed = true;
        } else {
            for (let i = 0; i < 3 && !placed; i++) {
              for (let j = 0; j < 2 && !placed; j++) {
                if (!gridState[i][j]) {
                  gridState[i][j] = fighter;
                  placed = true;
                }
              }
            }
        }
        if (placed) importedCount++;
        else console.warn(I18N.getConsoleMsg("ERR_GRID_FULL"), fighterData.name);

      } catch (error) {
        console.warn("Failed to import fighter:", fighterData.name, error.message);
      }
    });

    const apiItemsToProcess = new Map();
    (dungeonPreset.fighters || []).forEach(f => {
      if (f.equipment?._id) apiItemsToProcess.set(f.equipment._id, f.equipment);
    });

    apiItemsToProcess.forEach((apiItemData) => {
      const tiersFromApi = {};
      const calculatedStats = Array.isArray(apiItemData.stats) ? apiItemData.stats.map(stat => {
        const statObject = { ...stat }; // Create a copy of the original stat object
        if (stat.type && stat.tier !== undefined) {
          tiersFromApi[stat.type] = stat.tier; // Store tier for the item's top-level tiers object
          statObject.tier = stat.tier; // Explicitly add tier to the individual stat object
        }
        return { ...statObject, value: calculateStatValue(stat) }; // Pass original stat to calculateStatValue
      }) : [];

      const existingItemIndex = armoryState.findIndex(item => item.name === apiItemData.name);

      if (existingItemIndex !== -1) {
        Object.assign(armoryState[existingItemIndex], {
          id: apiItemData._id,
          rarity: apiItemData.rarity,
          stats: calculatedStats,
          level: apiItemData.level || 1, // Ensure level is also passed if available
          tiers: tiersFromApi, // Pass the extracted tiers
        });
      } else {
        armoryState.push(new ArmoryItem({
          ...apiItemData,
          stats: calculatedStats,
          level: apiItemData.level || 1, // Ensure level is also passed if available
          tiers: tiersFromApi, // Pass the extracted tiers
        }));
      }
    });

    saveState();
    renderGrid();
    renderBench();
    renderArmory();

    return { success: true, fightersCount: importedCount };
  } catch (error) {
    console.error("Error processing imported data:", error);
    return { success: false, message: formatString(I18N.getConsoleMsg("ERR_PROC_IMPORT_DATA"), error.message) };
  }
}

function calculateStatValue(stat) {
  const tierMultipliers = { 1: 1.1, 2: 1.2, 3: 1.3, 4: 1.4, 5: 1.5, 6: 1.75, 7: 2, 8: 2.25, 9: 2.5, 10: 2.75, 11: 3, 12: 3.5 };
  if (!stat?.type) return 0;

  const tier = Math.max(1, parseInt(stat.tier) || 1);
  const multiplier = tierMultipliers[tier] || 1.0;
  if (tier > 12) console.warn(formatString(I18N.getConsoleMsg("WARN_EQUIP_TIER_EXCEEDS_MAX"), tier));

  const baseValue = Math.max(0, parseFloat(stat.value) || 0);
  return stat.type.toLowerCase().includes("critdamage") ? baseValue * multiplier * 100 : Math.round(baseValue * multiplier);
}

function createFighterFromApiData(apiData) {
  try {
    if (!apiData?.class) throw new Error(I18N.getConsoleMsg("ERR_IVLD_FIGHTER_CLS"));

    const classMapping = { assassin: "Assassin", brawler: "Brawler", hunter: "Hunter", mage: "Mage", priest: "Priest", shadow_dancer: "Shadow Dancer", shadowdancer: "Shadow Dancer", berserker: "Berserker", paladin: "Paladin", crusader: "Crusader", sentinel: "Sentinel", bastion: "Bastion" };
        const fighterClass = classMapping[apiData.class.toLowerCase()] || "No Class";
        const stats = apiData.stats || {};

        const equipment = apiData.equipment || {};
    const equipmentStats = Array.isArray(equipment.stats) ? equipment.stats : [];

    const equipmentBonuses = { health: 0, damage: 0, hit: 0, defense: 0, critDamage: 0, dodge: 0 };
    equipmentStats.forEach((stat) => {
      const value = calculateStatValue(stat);
      const type = stat.type.toLowerCase();

      // Prioritize more specific crit damage checks
      if (type.includes("critdamage") || type.includes("crit_damage") || type.includes("critical_damage")) {
          equipmentBonuses.critDamage += value;
      } else if (type.includes("health")) {
          equipmentBonuses.health += value;
      } else if (type.includes("damage")) { // This now only catches non-crit damage types
          equipmentBonuses.damage += value;
      } else if (type.includes("hit")) {
          equipmentBonuses.hit += value;
      } else if (type.includes("defense") || type.includes("defence")) {
          equipmentBonuses.defense += value;
      } else if (type.includes("dodge") || type.includes("evasion")) {
          equipmentBonuses.dodge += value;
      } else {
          console.warn(
            formatString(
              I18N.getConsoleMsg("ERR_UNKNOWN_EQUIP_STAT"),
              stat.type,
              value,
            ),
          );
      }
    });

    const fighterData = {
      name: (apiData.name || fighterClass).trim(),
      fighter_health: Math.max(0, parseInt(stats.health || 0)),
      fighter_damage: Math.max(0, parseInt(stats.damage || 0)),
      fighter_hit: Math.max(0, parseInt(stats.hit || 0)),
      fighter_defense: Math.max(0, parseInt(stats.defense || 0)),
      fighter_crit: Math.max(0, parseInt(stats.critDamage || 0)),
      fighter_dodge: Math.max(0, parseInt(stats.dodge || 0)),
      object_health: Math.max(0, equipmentBonuses.health),
      object_damage: Math.max(0, equipmentBonuses.damage),
      object_hit: Math.max(0, equipmentBonuses.hit),
      object_defense: Math.max(0, equipmentBonuses.defense),
      object_crit: Math.max(0, equipmentBonuses.critDamage),
      object_dodge: Math.max(0, equipmentBonuses.dodge),
      equippedItemId: equipment ? equipment._id : null,
    };

    const fighter = new Fighter(fighterClass, fighterData);
    fighter.__raw = { ...fighterData };
    return fighter;
  } catch (error) {
    console.error("Error creating fighter from API data:", error, apiData);
    throw error;
  }
}

// Changelog functionality
async function loadChangelog() {
  try {
    const response = await fetch("./changelog.txt");
    const content = await response.text();
    const lines = content.trim().split("\n").filter(line => line.trim());
    let html = "";
    let latestDate = "";

    lines.forEach(line => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(line.trim())) {
        const currentDate = line.trim();
        if (!latestDate) latestDate = currentDate;
        html += `<h4 style="margin-top: 1.5em; margin-bottom: 0.5em; color: #4fa3ff;">${currentDate}</h4>`;
      } else {
        html += `<div style="margin-left: 1em; margin-bottom: 0.3em;">• ${line.replace(/^-/, '').trim()}</div>`;
      }
    });

    changelogModal.querySelector(".modal div:last-child").innerHTML = html || I18N.getTranslation("NO_CHANGELOG_ENTRIES");
    if (latestDate && lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${latestDate}`;

  } catch (error) {
    console.warn(I18N.getConsoleMsg("ERR_FAIL_LOAD_CHANGELOG"), error);
    changelogModal.querySelector(".modal div:last-child").innerHTML = I18N.getTranslation("UNABLE_TO_LOAD_CHANGELOG");
  }
}

changelogLink.addEventListener("click", () => {
  changelogModal.style.display = "flex";
});
closeChangelog.addEventListener("click", () => {
  changelogModal.style.display = "none";
});

// Close changelog modal when clicking outside
changelogModal.addEventListener("click", (e) => {
  if (e.target === changelogModal) {
    changelogModal.style.display = "none";
  }
});

// Prevent changelog modal from closing when clicking inside
changelogModal.querySelector(".modal").addEventListener("click", (e) => {
  e.stopPropagation();
});

// Input validation and persistence
mobLevelEl.addEventListener("input", () => {
  let value = Math.max(1, parseInt(mobLevelEl.value) || 1);
  if (mobLevelEl.value != value) {
    mobLevelEl.value = value;
  }
  saveState();
});

numBattlesEl.addEventListener("input", () => {
  let value = Math.max(1, parseInt(numBattlesEl.value) || 1);
  if (value > 1000000) {
    value = 1000000;
  }
  if (numBattlesEl.value != value) {
    numBattlesEl.value = value;
  }
  saveState();
});

verboseEl.addEventListener("input", saveState);
apiKeyEl.addEventListener("input", saveState);
dontShowImportWarningEl.addEventListener("change", saveState);

const statInputs = [
  "fighter_health",
  "fighter_damage",
  "fighter_hit",
  "fighter_defense",
  "fighter_crit",
  "fighter_dodge",
];
for (const id of statInputs) {
  const el = document.getElementById(id);
  el.addEventListener("input", updateModifiedFighterCost); // Renamed function
}

function getBonusesFromItem(item) {
  const bonuses = {
    object_health: 0,
    object_damage: 0,
    object_hit: 0,
    object_defense: 0,
    object_crit: 0,
    object_dodge: 0,
  };
  if (!item || !item.stats) return bonuses;

  item.stats.forEach((stat) => {
    const statType = stat.type.toLowerCase();
    const value = stat.value || 0;

    if (statType.includes("health")) bonuses.object_health += value;
    else if (statType.includes("damage") && !statType.includes("crit"))
      bonuses.object_damage += value;
    else if (statType.includes("hit")) bonuses.object_hit += value;
    else if (statType.includes("defense")) bonuses.object_defense += value;
    else if (
        statType === "critdamage" ||
        statType === "crit_damage" ||
        statType === "critical_damage"
    ) {
        bonuses.object_crit += value;
    }
    else if (statType.includes("dodge")) bonuses.object_dodge += value;
  });
  return bonuses;
}

// Drag and drop functionality
let draggedElement = null;
let draggedData = null;

function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add("dragging");

  // Determine what we're dragging
  if (e.target.dataset.gridPosition) {
    const [i, j] = e.target.dataset.gridPosition.split(",").map(Number);
    draggedData = {
      type: "grid",
      position: { i, j },
      fighter: gridState[i][j],
    };
  } else if (e.target.dataset.benchIndex !== undefined) {
    const index = parseInt(e.target.dataset.benchIndex);
    draggedData = {
      type: "bench",
      index: index,
      fighter: benchState[index],
    };
  } else if (e.target.dataset.armoryIndex !== undefined) {
    const index = parseInt(e.target.dataset.armoryIndex);
    draggedData = {
      type: "armory",
      index: index,
      item: armoryState[index],
    };
  }

  e.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  // Remove drag-over class from all elements
  document.querySelectorAll(".drag-over").forEach((el) => {
    el.classList.remove("drag-over");
  });
  draggedElement = null;
  draggedData = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();

  if (!draggedData) return;

  const dropTarget = e.currentTarget;
  dropTarget.classList.remove("drag-over");

  // Determine drop target
  let targetType = null;
  let targetData = null;

  if (dropTarget.dataset.gridPosition) {
    const [i, j] = dropTarget.dataset.gridPosition.split(",").map(Number);
    targetType = "grid";
    targetData = { i, j, fighter: gridState[i][j] };
  } else if (dropTarget.dataset.benchIndex !== undefined) {
    const index = parseInt(dropTarget.dataset.benchIndex);
    targetType = "bench";
    targetData = { index, fighter: benchState[index] };
  } else if (dropTarget.dataset.armoryIndex !== undefined) {
    const index = parseInt(dropTarget.dataset.armoryIndex);
    targetType = "armory";
    targetData = { index, item: armoryState[index] };
  } else if (
    dropTarget === benchGridEl ||
    dropTarget.textContent === "Drop fighters here"
  ) {
    // Dropping on empty bench area or placeholder
    targetType = "benchEmpty";
    targetData = null;
  }

  // Handle the drop based on source and target
  if (draggedData.type === "grid" && targetType === "grid") {
    // Grid to grid - swap fighters
    const sourceFighter =
      gridState[draggedData.position.i][draggedData.position.j];
    const targetFighter = gridState[targetData.i][targetData.j];

    gridState[draggedData.position.i][draggedData.position.j] = targetFighter;
    gridState[targetData.i][targetData.j] = sourceFighter;

    renderGrid();
  } else if (
    draggedData.type === "grid" &&
    (targetType === "bench" || targetType === "benchEmpty")
  ) {
    // Grid to bench - move fighter to bench, leave grid empty
    const sourceFighter =
      gridState[draggedData.position.i][draggedData.position.j];
    gridState[draggedData.position.i][draggedData.position.j] = null;

    if (targetType === "bench") {
      // Insert at target position in bench
      benchState.splice(targetData.index, 0, sourceFighter);
    } else {
      // Add to end of bench if dropping on empty area
      benchState.push(sourceFighter);
    }

    renderGrid();
    renderBench();
  } else if (draggedData.type === "bench" && targetType === "grid") {
    // Bench to grid - move fighter to grid, remove from bench
    const sourceFighter = benchState[draggedData.index];
    const targetFighter = targetData.fighter;

    // Remove from bench
    benchState.splice(draggedData.index, 1);

    // If target grid position has a fighter, add it to the bench at the same position
    if (targetFighter) {
      benchState.splice(draggedData.index, 0, targetFighter);
    }

    // Place the dragged fighter in the grid
    gridState[targetData.i][targetData.j] = sourceFighter;

    renderGrid();
    renderBench();
  } else if (draggedData.type === "bench" && targetType === "bench") {
    // Bench to bench - reorder
    if (draggedData.index !== targetData.index) {
      const sourceFighter = benchState[draggedData.index];
      benchState.splice(draggedData.index, 1);
      benchState.splice(targetData.index, 0, sourceFighter);
      renderBench();
    }
  } else if (draggedData.type === "armory" && targetType === "armory") {
    // Armory to armory - reorder
    if (draggedData.index !== targetData.index) {
      const sourceItem = armoryState[draggedData.index];
      armoryState.splice(draggedData.index, 1);
      armoryState.splice(targetData.index, 0, sourceItem);
      renderArmory();
    }
  } else if (
    draggedData.type === "armory" &&
    (targetType === "grid" || targetType === "bench")
  ) {
    // Equip item onto a fighter
    const draggedItem = draggedData.item;
    let originalFighter = null;
    if (targetType === "grid") {
      originalFighter = gridState[targetData.i][targetData.j];
    } else {
      // bench
      originalFighter = benchState[targetData.index];
    }

    if (originalFighter) {
      const itemBonuses = getBonusesFromItem(draggedItem);
      console.log(`handleDrop: itemBonuses.object_crit from getBonusesFromItem = ${itemBonuses.object_crit}`);

      const newFighterData = { ...originalFighter.__raw };
      Object.assign(newFighterData, itemBonuses);
      newFighterData.equippedItemId = draggedItem.id;

      const newFighter = new Fighter(
        originalFighter.fighter_class,
        newFighterData,
      );
      newFighter.__raw = newFighterData;

      // Replace the old fighter
      if (targetType === "grid") {
        gridState[targetData.i][targetData.j] = newFighter;
        renderGrid();
      } else {
        benchState[targetData.index] = newFighter;
        renderBench();
      }
    }
  }

  saveState();
}
// Add visual feedback for bench grid when dragging from grid
benchGridEl.addEventListener("dragenter", (e) => {
  e.preventDefault();
  if (draggedData && draggedData.type === "grid") {
    benchGridEl.style.border = "2px dashed #4fa3ff";
    benchGridEl.style.backgroundColor = "rgba(79, 163, 255, 0.1)";
  }
});

benchGridEl.addEventListener("dragleave", (e) => {
  if (!benchGridEl.contains(e.relatedTarget)) {
    benchGridEl.style.border = "";
    benchGridEl.style.backgroundColor = "";
  }
});

// Add drop handling to bench grid container for empty area drops
benchGridEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
});

benchGridEl.addEventListener("drop", (e) => {
  e.preventDefault();

  // Reset visual feedback
  benchGridEl.style.border = "";
  benchGridEl.style.backgroundColor = "";

  if (!draggedData) return;

  // Only handle drops from grid to bench (adding to end)
  if (draggedData.type === "grid") {
    const sourceFighter =
      gridState[draggedData.position.i][draggedData.position.j];
    gridState[draggedData.position.i][draggedData.position.j] = null;

    // Add to end of bench
    benchState.push(sourceFighter);

    renderGrid();
    renderBench();
    saveState();
  }
});

// Add to bench button event
addToBenchBtn.addEventListener("click", openAddToBenchEditor);

// Add comprehensive validation to all fighter stat inputs
const statInputIds = [
  "fighter_health",
  "fighter_damage",
  "fighter_hit",
  "fighter_defense",
  "fighter_crit",
  "fighter_dodge",
  "object_health",
  "object_damage",
  "object_hit",
  "object_defense",
  "object_crit",
  "object_dodge",
];

function validateStatInput(input) {
  // Handle crit fields
  if (input.id === "object_crit") {
    // Object crit: decimal percentage values
    let value = Math.max(0, parseFloat(input.value) || 0);
    value = Math.round(value * 100) / 100; // Round to 2 decimal places
    if (Math.abs(parseFloat(input.value) - value) > 0.01) {
      input.value = value;
    }
  } else {
    // Integer validation for all other fields
    let value = Math.max(0, parseInt(input.value) || 0);
    if (input.value != value) {
      input.value = value;
    }
  }
}

statInputIds.forEach((inputId) => {
  const input = document.getElementById(inputId);
  if (input) {
    // Real-time validation
    input.addEventListener("input", () => validateStatInput(input));

    // Validation on paste
    input.addEventListener("paste", () => {
      setTimeout(() => validateStatInput(input), 0);
    });

    // Validation on blur (when user leaves the field)
    input.addEventListener("blur", () => validateStatInput(input));
  }
});

// Also add validation for mob level and number of battles on blur and paste
mobLevelEl.addEventListener("blur", () => {
  let value = Math.max(1, parseInt(mobLevelEl.value) || 1);
  if (mobLevelEl.value != value) {
    mobLevelEl.value = value;
  }
});

mobLevelEl.addEventListener("paste", () => {
  setTimeout(() => {
    let value = Math.max(1, parseInt(mobLevelEl.value) || 1);
    if (mobLevelEl.value != value) {
      mobLevelEl.value = value;
    }
  }, 0);
});

numBattlesEl.addEventListener("blur", () => {
  let value = Math.max(1, parseInt(numBattlesEl.value) || 1);
  if (value > 1000000) {
    value = 1000000;
  }
  if (numBattlesEl.value != value) {
    numBattlesEl.value = value;
  }
});

numBattlesEl.addEventListener("paste", () => {
  setTimeout(() => {
    let value = Math.max(1, parseInt(numBattlesEl.value) || 1);
    if (value > 1000000) {
      value = 1000000;
    }
    if (numBattlesEl.value != value) {
      numBattlesEl.value = value;
    }
  }, 0);
});

loadState();
renderGrid();
renderBench();
renderArmory();
loadChangelog();
