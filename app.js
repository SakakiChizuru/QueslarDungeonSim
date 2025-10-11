import { FightersSquad } from "./squads/FightersSquad.js";
import { MobsSquad } from "./squads/MobsSquad.js";
import { Battle } from "./battle/Battle.js";
import { Fighter, FighterClasses } from "./characters/Fighter.js";

const fightersGridEl = document.getElementById("fightersGrid");
const verboseEl = document.getElementById("verbose");
const mobLevelEl = document.getElementById("mobLevel");
const numBattlesEl = document.getElementById("numBattles");
const outputEl = document.getElementById("output");
const fightBtn = document.getElementById("fightBtn");
const clearLogBtn = document.getElementById("clearLogBtn");

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

const benchGridEl = document.getElementById("benchGrid");
const addToBenchBtn = document.getElementById("addToBench");

const changelogLink = document.getElementById("changelogLink");
const changelogModal = document.getElementById("changelogModal");
const closeChangelog = document.getElementById("closeChangelog");
const lastUpdatedEl = document.getElementById("lastUpdated");

// Fighter class descriptions for tooltips
const classDescriptions = {
  Assassin: "Prioritises the back column first",
  Brawler: "15% chance to attack twice",
  Hunter: "Attacks a row dealing 75% damage to every enemy",
  Mage: "Attacks a column dealing 50% damage to every enemy",
  Priest: "10% chance to resurrect a random dead ally each round",
  "Shadow Dancer":
    "25% dodge chance, next attack after dodge deals 200% damage",
  Berserker: "Gains 25% damage per 25% health lost, undodgeable below 25%",
  Paladin: "Provides 15% damage reduction aura to allies in same row",
  Crusader: "Gains +20% to all stats for each dead ally",
  Sentinel: "Intercepts all attacks against allies below 25% health",
  Bastion: "Adjacent allies gain +50% dodge and 25% damage reduction",
  "No Class": "No special abilities",
};

// Create tooltip element
const classTooltip = document.createElement("div");
classTooltip.id = "classTooltip";
classTooltip.style.cssText = `
  position: absolute;
  background: linear-gradient(135deg, #2c3242 0%, #1a1e28 100%);
  color: #e6eaf3;
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  max-width: 280px;
  min-width: 200px;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
  transform: translateY(-5px);
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2);
  backdrop-filter: blur(4px);
  word-wrap: break-word;
`;
document.body.appendChild(classTooltip);

// Populate the original select for form compatibility
for (const value of Object.values(FighterClasses)) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = value;
  fighterClassSelect.appendChild(opt);
}

// Hide the original select and create custom dropdown
fighterClassSelect.style.display = "none";

// Create custom dropdown container
const customDropdown = document.createElement("div");
customDropdown.style.cssText = `
  position: relative;
  width: 100%;
`;

// Create custom dropdown button
const dropdownButton = document.createElement("button");
dropdownButton.type = "button";
dropdownButton.style.cssText = `
  width: 100%;
  padding: 0.5em 0.7em;
  border-radius: 6px;
  border: 1px solid #2c3242;
  background: #181c24;
  color: #e6eaf3;
  text-align: left;
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
`;
dropdownButton.innerHTML = `${FighterClasses.NONE} <span style="float: right; transform: rotate(0deg); transition: transform 0.2s ease;">▼</span>`;

dropdownButton.addEventListener("mouseenter", () => {
  dropdownButton.style.borderColor = "#4a5568";
});

dropdownButton.addEventListener("mouseleave", () => {
  dropdownButton.style.borderColor = "#2c3242";
});

// Create dropdown options container
const dropdownOptions = document.createElement("div");
dropdownOptions.style.cssText = `
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #181c24;
  border: 1px solid #4a5568;
  border-top: none;
  border-radius: 0 0 6px 6px;
  z-index: 100;
  display: none;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
`;

// Create options
Object.values(FighterClasses).forEach((className) => {
  const option = document.createElement("div");
  option.style.cssText = `
    padding: 0.5em 0.7em;
    cursor: pointer;
    color: #e6eaf3;
    border-bottom: 1px solid #2c3242;
    transition: background-color 0.15s ease;
  `;
  option.textContent = className;
  option.dataset.value = className;

  // Hover effects
  option.addEventListener("mouseenter", (e) => {
    option.style.background = "#2c3242";
    const description = classDescriptions[className];
    if (description) {
      classTooltip.textContent = description;
      classTooltip.style.left = e.pageX + 10 + "px";
      classTooltip.style.top = e.pageY - 30 + "px";
      classTooltip.style.opacity = "1";
      classTooltip.style.visibility = "visible";
      classTooltip.style.transform = "translateY(0)";
    }
  });

  option.addEventListener("mousemove", (e) => {
    if (classTooltip.style.opacity === "1") {
      classTooltip.style.left = e.pageX + 10 + "px";
      classTooltip.style.top = e.pageY - 30 + "px";
    }
  });

  option.addEventListener("mouseleave", () => {
    option.style.background = "transparent";
    classTooltip.style.opacity = "0";
    classTooltip.style.visibility = "hidden";
    classTooltip.style.transform = "translateY(-5px)";
  });

  option.addEventListener("click", () => {
    fighterClassSelect.value = className;
    dropdownButton.innerHTML = `${className} <span style="float: right;">▼</span>`;
    dropdownOptions.style.display = "none";
    dropdownButton.style.borderRadius = "6px";

    // Hide tooltip
    classTooltip.style.opacity = "0";
    classTooltip.style.visibility = "hidden";
    classTooltip.style.transform = "translateY(-5px)";

    // Trigger change event
    const event = new Event("change");
    fighterClassSelect.dispatchEvent(event);
  });

  dropdownOptions.appendChild(option);
});

// Toggle dropdown
dropdownButton.addEventListener("click", () => {
  const isOpen = dropdownOptions.style.display === "block";
  const arrow = dropdownButton.querySelector("span");
  if (isOpen) {
    dropdownOptions.style.display = "none";
    dropdownButton.style.borderRadius = "6px";
    dropdownButton.style.borderColor = "#2c3242";
    arrow.style.transform = "rotate(0deg)";
  } else {
    dropdownOptions.style.display = "block";
    dropdownButton.style.borderRadius = "6px 6px 0 0";
    dropdownButton.style.borderColor = "#4a5568";
    arrow.style.transform = "rotate(180deg)";
  }
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!customDropdown.contains(e.target)) {
    const arrow = dropdownButton.querySelector("span");
    dropdownOptions.style.display = "none";
    dropdownButton.style.borderRadius = "6px";
    dropdownButton.style.borderColor = "#2c3242";
    arrow.style.transform = "rotate(0deg)";
    classTooltip.style.opacity = "0";
    classTooltip.style.visibility = "hidden";
    classTooltip.style.transform = "translateY(-5px)";
  }
});

customDropdown.appendChild(dropdownButton);
customDropdown.appendChild(dropdownOptions);

// Insert custom dropdown after the original select
fighterClassSelect.parentNode.insertBefore(
  customDropdown,
  fighterClassSelect.nextSibling,
);

// Persistence Keys
const LS_KEYS = {
  grid: "dungeon:gridState:v1",
  bench: "dungeon:benchState:v1",
  mobLevel: "dungeon:mobLevel",
  numBattles: "dungeon:numBattles",
  verbose: "dungeon:verbose",
  apiKey: "dungeon:apiKey",
  dontShowImportWarning: "dungeon:dontShowImportWarning",
};

function serializeFighter(f) {
  if (!f) return null;
  // Save the raw input values that were stored when creating the fighter
  const raw = f.__raw || {};
  return {
    fighter_class: f.fighter_class,
    name: f.name,
    fighter_health: raw.fighter_health || 0,
    fighter_damage: raw.fighter_damage || 0,
    fighter_hit: raw.fighter_hit || 0,
    fighter_defense: raw.fighter_defense || 0,
    fighter_crit: raw.fighter_crit || 0,
    fighter_dodge: raw.fighter_dodge || 0,
    object_health: raw.object_health || 0,
    object_damage: raw.object_damage || 0,
    object_hit: raw.object_hit || 0,
    object_defense: raw.object_defense || 0,
    object_crit: raw.object_crit || 0,
    object_dodge: raw.object_dodge || 0,
  };
}

function deserializeFighter(obj) {
  if (!obj || !obj.fighter_class) return null;

  // Ensure all required fields exist with default values
  const data = {
    name: obj.name,
    fighter_health: obj.fighter_health || 0,
    fighter_damage: obj.fighter_damage || 0,
    fighter_hit: obj.fighter_hit || 0,
    fighter_defense: obj.fighter_defense || 0,
    fighter_crit: obj.fighter_crit || 0,
    fighter_dodge: obj.fighter_dodge || 0,
    object_health: obj.object_health || 0,
    object_damage: obj.object_damage || 0,
    object_hit: obj.object_hit || 0,
    object_defense: obj.object_defense || 0,
    object_crit: obj.object_crit || 0,
    object_dodge: obj.object_dodge || 0,
  };

  try {
    const fighter = new Fighter(obj.fighter_class, data);
    // Store the raw input values for re-populating the form
    fighter.__raw = { ...data };
    return fighter;
  } catch (error) {
    console.warn("Failed to deserialize fighter:", obj, error);
    return null;
  }
}

function saveState() {
  const raw = gridState.map((row) => row.map(serializeFighter));
  const benchRaw = benchState.map(serializeFighter);
  localStorage.setItem(LS_KEYS.grid, JSON.stringify(raw));
  localStorage.setItem(LS_KEYS.bench, JSON.stringify(benchRaw));
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
    console.warn("Failed to load grid state:", error);
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
    console.warn("Failed to load bench state:", error);
    localStorage.removeItem(LS_KEYS.bench);
  }

  const mob = localStorage.getItem(LS_KEYS.mobLevel);
  const num = localStorage.getItem(LS_KEYS.numBattles);
  const ver = localStorage.getItem(LS_KEYS.verbose);
  const api = localStorage.getItem(LS_KEYS.apiKey);
  if (mob) mobLevelEl.value = mob;
  if (num) numBattlesEl.value = num;
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
let editingCell = { i: 0, j: 0 };
let editingBench = { index: -1, isAddNew: false };

function renderGrid() {
  fightersGridEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.createElement("div");
      const fighter = gridState[i][j];

      // Apply different styling for empty vs filled cells
      if (fighter) {
        cell.className = "fighter-cell";
      } else {
        cell.className = "fighter-cell empty";
      }

      // Add drag and drop attributes
      cell.draggable = !!fighter;
      cell.dataset.gridPosition = `${i},${j}`;

      // Make the entire cell clickable to open editor
      cell.addEventListener("click", (e) => {
        // Prevent double-firing by checking if we clicked a button
        if (e.target.tagName === "BUTTON") {
          return;
        }
        openFighterEditor(i, j);
      });

      // Add drag over visual feedback
      cell.addEventListener("dragenter", (e) => {
        e.preventDefault();
        if (draggedData && cell !== draggedElement) {
          cell.classList.add("drag-over");
        }
      });

      cell.addEventListener("dragleave", (e) => {
        // Only remove if we're actually leaving the element
        if (!cell.contains(e.relatedTarget)) {
          cell.classList.remove("drag-over");
        }
      });

      // Add drag and drop event listeners
      if (fighter) {
        cell.addEventListener("dragstart", handleDragStart);
        cell.addEventListener("dragend", handleDragEnd);
      }
      cell.addEventListener("dragover", handleDragOver);
      cell.addEventListener("drop", handleDrop);

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = fighter ? fighter.name : "Empty";
      cell.appendChild(name);

      if (fighter) {
        const del = document.createElement("button");
        del.className = "btn small delete";
        del.textContent = "Delete";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          gridState[i][j] = null;
          saveState();
          renderGrid();
          renderBench();
        });
        cell.appendChild(del);
      } else {
        const add = document.createElement("button");
        add.className = "btn small add";
        add.textContent = "Add";
        add.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          openFighterEditor(i, j);
        });
        cell.appendChild(add);
      }
      fightersGridEl.appendChild(cell);
    }
  }
}

function renderBench() {
  benchGridEl.innerHTML = "";

  // Add a placeholder when bench is empty to ensure drops work
  if (benchState.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "bench-fighter";
    placeholder.style.opacity = "0.3";
    placeholder.style.border = "2px dashed #36405a";
    placeholder.style.background = "transparent";
    placeholder.textContent = "Drop fighters here";
    placeholder.style.textAlign = "center";
    placeholder.style.color = "#8892b0";
    placeholder.style.fontSize = "0.9em";
    placeholder.style.flex = "1 1 100%";
    placeholder.style.minHeight = "60px";
    placeholder.style.display = "flex";
    placeholder.style.alignItems = "center";
    placeholder.style.justifyContent = "center";
    placeholder.style.borderRadius = "10px";
    placeholder.style.padding = "0 0.66em";

    // Make placeholder accept drops
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

    benchItem.addEventListener("dragstart", handleDragStart);
    benchItem.addEventListener("dragend", handleDragEnd);
    benchItem.addEventListener("dragover", handleDragOver);
    benchItem.addEventListener("drop", handleDrop);

    // Add drag over visual feedback
    benchItem.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (draggedData && benchItem !== draggedElement) {
        benchItem.classList.add("drag-over");
      }
    });

    benchItem.addEventListener("dragleave", (e) => {
      if (!benchItem.contains(e.relatedTarget)) {
        benchItem.classList.remove("drag-over");
      }
    });

    // Click to edit
    benchItem.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        return;
      }
      openBenchFighterEditor(index);
    });

    const nameContainer = document.createElement("div");
    nameContainer.style.flex = "1";
    nameContainer.style.display = "flex";
    nameContainer.style.alignItems = "center";
    nameContainer.style.justifyContent = "center";
    nameContainer.style.minWidth = "0";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = fighter.name;
    name.style.textAlign = "center";
    nameContainer.appendChild(name);

    benchItem.appendChild(nameContainer);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "0.3em";
    actions.style.flexShrink = "0";

    const del = document.createElement("button");
    del.className = "btn small delete";
    del.textContent = "×";
    del.style.fontSize = "0.8em";
    del.style.padding = "0.2em 0.4em";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      benchState.splice(index, 1);
      saveState();
      renderBench();
    });
    actions.appendChild(del);

    benchItem.appendChild(actions);
    benchGridEl.appendChild(benchItem);
  });
}

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
  fighterClassSelect.value = fighter
    ? fighter.fighter_class
    : FighterClasses.NONE;

  // Set the name field
  fighterNameInput.value = fighter ? fighter.name : "";

  const fields = [
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
  for (const id of fields) {
    const el = document.getElementById(id);
    // Always use the raw values for form population
    const value =
      fighter && fighter.__raw && typeof fighter.__raw[id] === "number"
        ? fighter.__raw[id]
        : 0;
    el.value = value;
  }

  // Add event listener for class change to auto-update name
  fighterClassSelect.onchange = function () {
    const currentName = fighterNameInput.value.trim();
    const newClass = fighterClassSelect.value;

    // If name is empty or matches the old class, update it to the new class
    if (
      !currentName ||
      (fighter && currentName === fighter.fighter_class) ||
      (!fighter &&
        (!currentName || Object.values(FighterClasses).includes(currentName)))
    ) {
      fighterNameInput.value = newClass;
    }
  };
}

function closeFighterEditor() {
  // Clean up event listener to prevent memory leaks
  fighterClassSelect.onchange = null;
  editingCell = { i: -1, j: -1 };
  editingBench = { index: -1, isAddNew: false };
  fighterModal.style.display = "none";
}

saveFighterBtn.addEventListener("click", () => {
  const fc = fighterClassSelect.value;
  const fighterName = fighterNameInput.value.trim();

  // Create fighter data from form inputs
  const data = {};

  // Add name to data, use class name as default if no name provided
  data.name = fighterName || fc;

  const fields = [
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
  for (const id of fields) {
    const value = Number(document.getElementById(id).value || 0);
    data[id] = value;
  }

  try {
    // Create fighter with selected class (including "No Class")
    const f = new Fighter(fc, data);
    // Store raw inputs on instance for easy re-populating
    f.__raw = { ...data };

    // Determine where to save the fighter
    if (editingCell.i >= 0 && editingCell.j >= 0) {
      // Saving to main grid
      gridState[editingCell.i][editingCell.j] = f;
      renderGrid();
    } else if (editingBench.isAddNew) {
      // Adding new fighter to bench
      benchState.push(f);
      renderBench();
    } else if (editingBench.index >= 0) {
      // Editing existing bench fighter
      benchState[editingBench.index] = f;
      renderBench();
    }
  } catch (error) {
    console.error("Failed to create fighter:", error);
    alert("Failed to create fighter. Please check your input values.");
    return;
  }

  saveState();
  closeFighterEditor();
});

// Close modal when clicking the close button
closeFighterModal.addEventListener("click", closeFighterEditor);

// Close modal when clicking outside of it (on the backdrop)
fighterModal.addEventListener("click", (e) => {
  if (e.target === fighterModal) {
    closeFighterEditor();
  }
});

// Prevent modal from closing when clicking inside the modal content
fighterModal.querySelector(".modal").addEventListener("click", (e) => {
  e.stopPropagation();
});

function buildFightersSquad() {
  // Create fresh fighter instances for each battle to reset health and state
  const createFreshFighter = (fighter) => {
    if (!fighter) return null;
    // Create new fighter instance with same data to reset current_health and hit_counter
    const rawData = fighter.__raw || {};
    // Preserve the fighter's name
    rawData.name = fighter.name;
    return new Fighter(fighter.fighter_class, rawData);
  };

  // Map gridState to constructor order [[0,0],[0,1]],[ [1,0],[1,1] ], [ [2,0],[2,1] ]
  return new FightersSquad(
    createFreshFighter(gridState[0][0]),
    createFreshFighter(gridState[1][0]),
    createFreshFighter(gridState[2][0]),
    createFreshFighter(gridState[0][1]),
    createFreshFighter(gridState[1][1]),
    createFreshFighter(gridState[2][1]),
  );
}

function runBattles() {
  // Clear previous output immediately
  outputEl.textContent = "";

  const level = Number(mobLevelEl.value || 1);
  const n = Number(numBattlesEl.value || 1);
  const verbose = verboseEl.checked;
  saveState();

  // Reset battle statistics completely
  let fighterWins = 0;
  let lastBattleLog = [];
  const originalConsoleLog = console.log;

  // Only enable verbose logging if verbose is checked AND exactly one battle
  const shouldLogVerbose = verbose && n === 1;

  try {
    if (shouldLogVerbose) {
      console.log = (...args) => {
        lastBattleLog.push(args.join(" "));
        originalConsoleLog(...args);
      };
    }

    for (let k = 0; k < n; k++) {
      // Create completely fresh squads for each battle
      const fighters = buildFightersSquad();
      const mobs = new MobsSquad(level);

      // Pass verbose flag only if we should log verbose
      const battle = new Battle(fighters, mobs, shouldLogVerbose ? 1 : 0);
      const [winner] = battle.battle();

      if (winner === "fighters") {
        fighterWins += 1;
      }
    }
  } finally {
    console.log = originalConsoleLog;
  }

  // Display results in the output field
  if (shouldLogVerbose) {
    outputEl.textContent = lastBattleLog.join("\n");
  } else {
    outputEl.textContent = `Fighters won ${fighterWins} out of ${n} battles.`;
  }
}

fightBtn.addEventListener("click", runBattles);
clearLogBtn.addEventListener("click", () => {
  outputEl.textContent = "";
});

// API Import functionality
importBtn.addEventListener("click", () => {
  const apiKey = apiKeyEl.value.trim();

  if (!apiKey) {
    alert("Please enter an API key before importing.");
    return;
  }

  // Check if user has opted to skip the warning
  const dontShow = localStorage.getItem(LS_KEYS.dontShowImportWarning);
  if (dontShow === "1") {
    // Skip confirmation modal and proceed directly
    performImport(apiKey);
  } else {
    // Show confirmation modal
    importConfirmModal.style.display = "flex";
  }
});

// Confirmation modal event handlers
confirmImportBtn.addEventListener("click", () => {
  // Save the "don't show anymore" preference
  if (dontShowImportWarningEl.checked) {
    localStorage.setItem(LS_KEYS.dontShowImportWarning, "1");
  }

  // Hide modal and proceed with import
  importConfirmModal.style.display = "none";
  const apiKey = apiKeyEl.value.trim();
  performImport(apiKey);
});

cancelImportBtn.addEventListener("click", () => {
  importConfirmModal.style.display = "none";
});

// Close modal when clicking outside of it (on the backdrop)
importConfirmModal.addEventListener("click", (e) => {
  if (e.target === importConfirmModal) {
    importConfirmModal.style.display = "none";
  }
});

// Prevent modal from closing when clicking inside
importConfirmModal.querySelector(".modal").addEventListener("click", (e) => {
  e.stopPropagation();
});

// Perform the actual API import
async function performImport(apiKey) {
  try {
    importBtn.disabled = true;
    importBtn.textContent = "Importing...";

    const response = await fetch(
      "https://http.v2.queslar.com/api/character/fighter/presets",
      {
        method: "GET",
        headers: {
          "QUESLAR-API-KEY": apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Data received:", data);

    // Process the imported data
    const result = processImportedData(data);
    if (result.success) {
      console.log(`Successfully imported ${result.fightersCount} fighters`);
      alert(
        `Successfully imported ${result.fightersCount} fighters from dungeon preset!`,
      );
    } else {
      console.warn("Import failed:", result.message);
      alert(result.message);
    }
  } catch (error) {
    console.error("Import failed:", error);
    alert(`Import failed: ${error.message}`);
  } finally {
    importBtn.disabled = false;
    importBtn.textContent = "Import";
  }
}

// Process imported API data
function processImportedData(apiData) {
  try {
    // Check if output exists and is an array
    if (!apiData.output || !Array.isArray(apiData.output)) {
      return {
        success: false,
        message:
          "Invalid API response format: missing or invalid 'output' array.",
      };
    }

    // Find the preset with assignment = "dungeon"
    console.log(
      "Searching for dungeon preset in",
      apiData.output.length,
      "items",
    );
    const dungeonPreset = apiData.output.find(
      (item) => item.preset && item.preset.assignment === "dungeon",
    );

    if (!dungeonPreset) {
      console.warn(
        "Available presets:",
        apiData.output.map((item) => ({
          name: item.preset?.name,
          assignment: item.preset?.assignment,
        })),
      );
      return {
        success: false,
        message:
          "No preset found with assignment 'dungeon'. Nothing was imported.",
      };
    }

    console.log(
      "Found dungeon preset:",
      dungeonPreset.preset.name,
      "with",
      dungeonPreset.fighters?.length || 0,
      "fighters",
    );

    // Clear current grid state
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        gridState[i][j] = null;
      }
    }

    // Import fighters from the dungeon preset
    const fighters = dungeonPreset.fighters || [];
    let importedCount = 0;

    fighters.forEach((fighterData) => {
      try {
        console.log(
          "Processing fighter:",
          fighterData.name,
          "class:",
          fighterData.class,
        );
        const fighter = createFighterFromApiData(fighterData);
        if (fighter) {
          // Place fighter according to placement data, or find next available spot
          const placement = fighterData.placement;
          let placed = false;

          if (
            placement &&
            placement.row !== undefined &&
            placement.column !== undefined
          ) {
            const row = placement.row;
            const col = placement.column;
            console.log(
              "Attempting to place",
              fighterData.name,
              "at position",
              row,
              col,
            );

            // Validate placement bounds (0-2 rows, 0-1 columns)
            if (
              row >= 0 &&
              row < 3 &&
              col >= 0 &&
              col < 2 &&
              !gridState[row][col]
            ) {
              gridState[row][col] = fighter;
              placed = true;
              importedCount++;
              console.log("Placed", fighterData.name, "at", row, col);
            } else {
              console.log(
                "Cannot place at",
                row,
                col,
                "- out of bounds or occupied",
              );
            }
          }

          // If placement failed or wasn't specified, find first available spot
          if (!placed) {
            for (let i = 0; i < 3 && !placed; i++) {
              for (let j = 0; j < 2 && !placed; j++) {
                if (!gridState[i][j]) {
                  gridState[i][j] = fighter;
                  placed = true;
                  importedCount++;
                }
              }
            }
          }

          if (!placed) {
            console.warn(
              "Could not place fighter:",
              fighterData.name,
              "- grid is full",
            );
          }
        }
      } catch (error) {
        console.warn(
          "Failed to import fighter:",
          fighterData.name,
          error.message,
        );
      }
    });

    // Save state and re-render
    saveState();
    renderGrid();
    renderBench();

    return {
      success: true,
      fightersCount: importedCount,
    };
  } catch (error) {
    console.error("Error processing imported data:", error);
    return {
      success: false,
      message: `Error processing imported data: ${error.message}`,
    };
  }
}

// Create Fighter instance from API data
function createFighterFromApiData(apiData) {
  try {
    // Validate basic required data
    if (!apiData || typeof apiData !== "object") {
      throw new Error("Invalid fighter data: not an object");
    }

    if (!apiData.class || typeof apiData.class !== "string") {
      throw new Error("Invalid or missing fighter class");
    }

    // Map API class names to our class names
    const classMapping = {
      assassin: "Assassin",
      brawler: "Brawler",
      hunter: "Hunter",
      mage: "Mage",
      priest: "Priest",
      shadow_dancer: "Shadow Dancer",
      berserker: "Berserker",
      paladin: "Paladin",
      crusader: "Crusader",
      sentinel: "Sentinel",
      bastion: "Bastion",
    };

    const fighterClass =
      classMapping[apiData.class.toLowerCase()] || "No Class";
    const stats = apiData.stats || {};
    const equipment = apiData.equipment || {};
    const equipmentStats = equipment.stats || [];

    // Calculate equipment stat bonuses
    let equipmentBonuses = {
      health: 0,
      damage: 0,
      hit: 0,
      defense: 0,
      critDamage: 0,
      dodge: 0,
    };

    equipmentStats.forEach((stat) => {
      if (!stat || typeof stat !== "object" || !stat.type) return;

      const value = Math.max(0, parseInt(stat.value) || 0); // Ensure positive integer

      switch (stat.type) {
        case "health":
          equipmentBonuses.health += value;
          break;
        case "damage":
          equipmentBonuses.damage += value;
          break;
        case "hit":
          equipmentBonuses.hit += value;
          break;
        case "defense":
          equipmentBonuses.defense += value;
          break;
        case "critDamage":
          equipmentBonuses.critDamage += value;
          break;
        case "dodge":
          equipmentBonuses.dodge += value;
          break;
      }
    });

    // Create fighter data object for our Fighter constructor
    // Convert API stats (which appear to be allocations) to our fighter stat format
    const fighterData = {
      name: (apiData.name || fighterClass).trim() || fighterClass,
      // Convert API stats (which appear to be allocations) to our fighter stat format
      // Ensure values are within reasonable bounds (0-20 allocation points)
      fighter_health: Math.max(
        0,
        Math.min(20, Math.round((stats.health || 0) / 50)),
      ),
      fighter_damage: Math.max(
        0,
        Math.min(20, Math.round((stats.damage || 0) / 50)),
      ),
      fighter_hit: Math.max(0, Math.min(20, Math.round((stats.hit || 0) / 50))),
      fighter_defense: Math.max(
        0,
        Math.min(20, Math.round((stats.defense || 0) / 50)),
      ),
      fighter_crit: Math.max(
        0,
        Math.min(20, Math.round((stats.critDamage || 0) / 50)),
      ),
      fighter_dodge: Math.max(
        0,
        Math.min(20, Math.round((stats.dodge || 0) / 50)),
      ),
      // Equipment bonuses (ensure they are non-negative)
      object_health: Math.max(0, equipmentBonuses.health),
      object_damage: Math.max(0, equipmentBonuses.damage),
      object_hit: Math.max(0, equipmentBonuses.hit),
      object_defense: Math.max(0, equipmentBonuses.defense),
      object_crit: Math.max(0, equipmentBonuses.critDamage),
      object_dodge: Math.max(0, equipmentBonuses.dodge),
    };

    console.log("Created fighter data for", apiData.name, ":", {
      class: fighterClass,
      stats: `H:${fighterData.fighter_health} D:${fighterData.fighter_damage} Hi:${fighterData.fighter_hit} Def:${fighterData.fighter_defense} C:${fighterData.fighter_crit} Do:${fighterData.fighter_dodge}`,
      equipment: `H:${fighterData.object_health} D:${fighterData.object_damage} Hi:${fighterData.object_hit} Def:${fighterData.object_defense} C:${fighterData.object_crit} Do:${fighterData.object_dodge}`,
    });

    const fighter = new Fighter(fighterClass, fighterData);
    fighter.__raw = { ...fighterData }; // Store raw data for form re-population

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
    const lines = content
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    let html = "";
    let currentDate = "";
    let latestDate = "";

    for (const line of lines) {
      // Check if line is a date (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(line.trim())) {
        currentDate = line.trim();
        if (!latestDate) latestDate = currentDate;
        html += `<h4 style="margin-top: 1.5em; margin-bottom: 0.5em; color: #4fa3ff;">${currentDate}</h4>`;
      } else if (line.startsWith("-")) {
        // Convert hyphen to bullet point
        const entry = line.substring(1).trim();
        html += `<div style="margin-left: 1em; margin-bottom: 0.3em;">• ${entry}</div>`;
      } else if (line.trim()) {
        // Regular line
        html += `<div style="margin-left: 1em; margin-bottom: 0.3em;">• ${line.trim()}</div>`;
      }
    }

    // Update changelog modal content
    const changelogContent = changelogModal.querySelector(
      ".modal div:last-child",
    );
    changelogContent.innerHTML = html || "<p>No changelog entries found.</p>";

    // Update last updated date in footer
    if (latestDate && lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated: ${latestDate}`;
    }
  } catch (error) {
    console.warn("Failed to load changelog:", error);
    const changelogContent = changelogModal.querySelector(
      ".modal div:last-child",
    );
    changelogContent.innerHTML = "<p>Unable to load changelog.</p>";
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

// Inputs persistence
mobLevelEl.addEventListener("input", saveState);
numBattlesEl.addEventListener("input", saveState);
verboseEl.addEventListener("input", saveState);
apiKeyEl.addEventListener("input", saveState);
dontShowImportWarningEl.addEventListener("change", saveState);

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

loadState();
renderGrid();
renderBench();
loadChangelog();
