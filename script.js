/* ================== UI wiring ================== */
function updateHouse(select, houseIndex, key) {
  const value = select.value;
  if (key === "color") {
    const houseHeader = document.getElementById("house-" + houseIndex);
    houseHeader.style.color = value ? value.toLowerCase() : "black";
  }
  collectData();
  enforceUniqueSelections();
}

function getHouses() {
  const houses = [];
  for (let i = 0; i < 5; i++) {
    houses.push({
      color: document.getElementById("color-" + i).value,
      nationality: document.getElementById("nat-" + i).value,
      drink: document.getElementById("drink-" + i).value,
      cigarette: document.getElementById("cig-" + i).value,
      pet: document.getElementById("pet-" + i).value
    });
  }
  return houses;
}

function collectData() {
  const houses = getHouses();
  const data = checkClues(houses); // ← pure JS version of your Flask logic

  data.forEach((res, idx) => {
    const el = document.getElementById("clue-" + idx);
    const marker = el.querySelector(".marker");

    el.classList.remove("satisfied", "conflict");

    if (res.status === "conflict") {
      el.classList.remove("highlight");     // conflict wins over manual notes
      el.classList.add("conflict");
      marker.textContent = "×";
      marker.style.color = "red";
    } else if (res.status === "satisfied") {
      el.classList.remove("highlight");     // satisfied wins over manual notes
      el.classList.add("satisfied");
      marker.textContent = "✓";
      marker.style.color = "green";
    } else {
      marker.textContent = "";
      marker.style.color = "";
      // keep any manual highlight if present
    }
  });

  const allSatisfied = data.every(x => x.status === "satisfied");
  const noBlanks = houses.every(h => Object.values(h).every(v => v));
  if (allSatisfied && noBlanks) launchFireworks();
}

function enforceUniqueSelections() {
  ["color", "nat", "drink", "cig", "pet"].forEach(cat => {
    const picked = [];
    for (let i = 0; i < 5; i++) {
      const v = document.getElementById(cat + "-" + i).value;
      if (v) picked.push(v);
    }
    for (let i = 0; i < 5; i++) {
      const dd = document.getElementById(cat + "-" + i);
      const cur = dd.value;
      for (const opt of dd.options) {
        if (opt.value === "") continue;
        opt.disabled = picked.includes(opt.value) && opt.value !== cur;
      }
    }
  });
}

function toggleClueHighlight(idx) {
  const el = document.getElementById("clue-" + idx);
  if (el.classList.contains("satisfied")) return;
  if (el.classList.contains("conflict")) return;
  el.classList.toggle("highlight");
}

/* ================== Fireworks ================== */
function launchFireworks() {
  const container = document.getElementById("fireworks");
  container.innerHTML = "";
  container.style.display = "block";

  const burstCount = 5;     // total bursts
  const duration = 3000;    // particle lifetime (ms)
  const interval = 500;     // overlap between bursts

  function createBurst() {
    for (let b = 0; b < 10; b++) {  // 10 random origins
      const originX = Math.random() * window.innerWidth;
      const originY = Math.random() * window.innerHeight * 0.7;

      for (let i = 0; i < 40; i++) {
        const f = document.createElement("div");
        f.className = "firework";
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 250 + 50;
        f.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        f.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        f.style.background = `hsl(${Math.random()*360}, 100%, 50%)`;
        f.style.left = originX + "px";
        f.style.top = originY + "px";
        container.appendChild(f);
      }
    }
  }

  for (let n = 0; n < burstCount; n++) {
    setTimeout(createBurst, n * interval);
  }

  setTimeout(() => {
    container.style.display = "none";
    container.innerHTML = "";
  }, burstCount * interval + duration);
}

/* ================== Flask logic port ================== */
/* Helpers */
function findIndex(houses, key, value) {
  for (let i = 0; i < houses.length; i++) {
    if (houses[i][key] === value) return i;
  }
  return null;
}
function valAt(houses, i, key) {
  if (i < 0 || i >= houses.length) return null;
  return houses[i][key] || null;
}

/* Same-house constraint: (k1==v1) <-> (k2==v2) */
function check_pair(h, k1, v1, k2, v2) {
  const i1 = findIndex(h, k1, v1);
  const i2 = findIndex(h, k2, v2);

  if (i1 !== null && i2 !== null) {
    return (i1 === i2) ? "satisfied" : "conflict";
  }

  if (i1 !== null) {
    const v2at = valAt(h, i1, k2);
    if (v2at && v2at !== v2) return "conflict";
    if (i2 !== null && i2 !== i1) {
      const v1there = valAt(h, i2, k1);
      if (v1there && v1there !== v1) return "conflict";
    }
    return "unsatisfied";
  }

  if (i2 !== null) {
    const v1at = valAt(h, i2, k1);
    if (v1at && v1at !== v1) return "conflict";
    if (i1 !== null && i1 !== i2) {
      const v2there = valAt(h, i1, k2);
      if (v2there && v2there !== v2) return "conflict";
    }
    return "unsatisfied";
  }

  return "unsatisfied";
}

/* Centre house must have (key==value) */
function check_center(h, key, value, centerIdx = 2) {
  const v = valAt(h, centerIdx, key);
  if (v === value) return "satisfied";
  if (v && v !== value) return "conflict"; // center has a different value → conflict
  // if any other house already has that value → center can't have it later
  for (let i = 0; i < h.length; i++) {
    if (i === centerIdx) continue;
    if (valAt(h, i, key) === value) return "conflict";
  }
  return "unsatisfied";
}

/* First (left-most) house must have (key==value) */
function check_first(h, key, value) {
  const v = valAt(h, 0, key);
  if (v === value) return "satisfied";
  if (v && v !== value) return "conflict"; // first already set to different value → conflict
  for (let i = 1; i < h.length; i++) {
    if (valAt(h, i, key) === value) return "conflict"; // value appears elsewhere → conflict
  }
  return "unsatisfied";
}

/* Next-to constraint: (k1==v1) next to (k2==v2) */
function check_next_to(h, k1, v1, k2, v2) {
  const N = h.length;
  const i1 = findIndex(h, k1, v1);
  const i2 = findIndex(h, k2, v2);

  if (i1 !== null && i2 !== null) {
    return (Math.abs(i1 - i2) === 1) ? "satisfied" : "conflict";
  }

  if (i1 !== null) {
    const L = (i1 > 0) ? i1 - 1 : null;
    const R = (i1 < N - 1) ? i1 + 1 : null;

    if ((L !== null && valAt(h, L, k2) === v2) || (R !== null && valAt(h, R, k2) === v2)) {
      return "satisfied";
    }
    if (i2 !== null && Math.abs(i1 - i2) !== 1) return "conflict";

    const leftBlock  = (L !== null && valAt(h, L, k2) && valAt(h, L, k2) !== v2);
    const rightBlock = (R !== null && valAt(h, R, k2) && valAt(h, R, k2) !== v2);
    if ((L === null && rightBlock) || (R === null && leftBlock) || (leftBlock && rightBlock)) {
      return "conflict";
    }
    return "unsatisfied";
  }

  if (i2 !== null) {
    const L = (i2 > 0) ? i2 - 1 : null;
    const R = (i2 < N - 1) ? i2 + 1 : null;

    if ((L !== null && valAt(h, L, k1) === v1) || (R !== null && valAt(h, R, k1) === v1)) {
      return "satisfied";
    }
    if (i1 !== null && Math.abs(i1 - i2) !== 1) return "conflict";

    const leftBlock  = (L !== null && valAt(h, L, k1) && valAt(h, L, k1) !== v1);
    const rightBlock = (R !== null && valAt(h, R, k1) && valAt(h, R, k1) !== v1);
    if ((L === null && rightBlock) || (R === null && leftBlock) || (leftBlock && rightBlock)) {
      return "conflict";
    }
    return "unsatisfied";
  }

  return "unsatisfied";
}

/* Exactly-left-of constraint: (kL==vL) immediately left of (kR==vR) */
function check_exact_left_of(h, kL, vL, kR, vR) {
  const N = h.length;
  const iL = findIndex(h, kL, vL);
  const iR = findIndex(h, kR, vR);

  if (iL !== null && iR !== null) {
    return (iL + 1 === iR) ? "satisfied" : "conflict";
  }

  if (iL !== null) {
    if (iL === N - 1) return "conflict"; // left item cannot be at far right
    const rightIdx = iL + 1;
    const vRight = valAt(h, rightIdx, kR);
    if (vRight && vRight !== vR) return "conflict";
    if (iR !== null && iR !== rightIdx) return "conflict";
    return "unsatisfied";
  }

  if (iR !== null) {
    if (iR === 0) return "conflict"; // right item cannot be at far left
    const leftIdx = iR - 1;
    const vLeft = valAt(h, leftIdx, kL);
    if (vLeft && vLeft !== vL) return "conflict";
    if (iL !== null && iL !== leftIdx) return "conflict";
    return "unsatisfied";
  }

  return "unsatisfied";
}

/* Master evaluator: mirrors your Python app.py */
function checkClues(h) {
  const results = [];

  // 0
  results.push({ status: check_pair(h, "nationality", "Brit", "color", "Red") });

  // 1 (Dogs vs Dog singular)
  results.push({ status: check_pair(h, "nationality", "Swede", "pet", "Dog") });

  // 2
  results.push({ status: check_pair(h, "nationality", "Dane", "drink", "Tea") });

  // 3
  results.push({ status: check_exact_left_of(h, "color", "Green", "color", "White") });

  // 4
  results.push({ status: check_pair(h, "color", "Green", "drink", "Coffee") });

  // 5 (Birds vs Bird singular)
  results.push({ status: check_pair(h, "cigarette", "Pall Mall", "pet", "Bird") });

  // 6
  results.push({ status: check_pair(h, "color", "Yellow", "cigarette", "Dunhill") });

  // 7 center house drinks Milk (index 2)
  results.push({ status: check_center(h, "drink", "Milk", 2) });

  // 8 first house is Norwegian
  results.push({ status: check_first(h, "nationality", "Norwegian") });

  // 9 Blends next to Cats
  results.push({ status: check_next_to(h, "cigarette", "Blends", "pet", "Cat") });

  // 10 Horses next to Dunhill
  results.push({ status: check_next_to(h, "pet", "Horse", "cigarette", "Dunhill") });

  // 11 Blue Master ↔ Beer
  results.push({ status: check_pair(h, "cigarette", "Blue Master", "drink", "Beer") });

  // 12 German ↔ Prince
  results.push({ status: check_pair(h, "nationality", "German", "cigarette", "Prince") });

  // 13 Norwegian next to Blue house
  results.push({ status: check_next_to(h, "nationality", "Norwegian", "color", "Blue") });

  // 14 Blends next to Water
  results.push({ status: check_next_to(h, "cigarette", "Blends", "drink", "Water") });

  return results;
}
