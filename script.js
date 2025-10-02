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
  const statuses = checkClues(houses);

  statuses.forEach((status, idx) => {
    const el = document.getElementById("clue-" + idx);
    const marker = el.querySelector(".marker");

    // clear previous status classes
    el.classList.remove("satisfied", "conflict");

    if (status === "conflict") {
      // make sure conflict wins over any manual highlight
      el.classList.remove("highlight");       
      el.classList.add("conflict");
      marker.textContent = "×";
      marker.style.color = "red";
    } else if (status === "satisfied") {
      // satisfied always wins
      el.classList.remove("highlight");          
      el.classList.add("satisfied");
      marker.textContent = "✓";
      marker.style.color = "green";
    } else {
      // neutral
      marker.textContent = "";
      marker.style.color = "";
      // leave highlight alone (user can toggle it)
    }
  });

  const allSatisfied = statuses.every(s => s === "satisfied");
  const noBlanks = houses.every(h => Object.values(h).every(v => v));
  if (allSatisfied && noBlanks) launchFireworks();
}

function enforceUniqueSelections() {
  ["color", "nat", "drink", "cig", "pet"].forEach(cat => {
    const selected = [];
    for (let i = 0; i < 5; i++) {
      const val = document.getElementById(cat + "-" + i).value;
      if (val) selected.push(val);
    }
    for (let i = 0; i < 5; i++) {
      const dropdown = document.getElementById(cat + "-" + i);
      const current = dropdown.value;
      for (const opt of dropdown.options) {
        if (opt.value === "") continue;
        opt.disabled = selected.includes(opt.value) && opt.value !== current;
      }
    }
  });
}

/* ========= Pure JS Clue Checker ========= */
function checkClues(h) {
  const s = new Array(15).fill("unsatisfied");

  // 0. Brit ↔ Red
  if (h.some(x => x.nationality === "Brit" && x.color === "Red")) s[0] = "satisfied";
  else if (h.some(x => x.nationality === "Brit") && h.some(x => x.color === "Red")) s[0] = "conflict";

  // 1. Swede ↔ Dogs
  if (h.some(x => x.nationality === "Swede" && x.pet === "Dog")) s[1] = "satisfied";
  else if (h.some(x => x.nationality === "Swede") && h.some(x => x.pet === "Dog")) s[1] = "conflict";

  // 2. Dane ↔ Tea
  if (h.some(x => x.nationality === "Dane" && x.drink === "Tea")) s[2] = "satisfied";
  else if (h.some(x => x.nationality === "Dane") && h.some(x => x.drink === "Tea")) s[2] = "conflict";

  // 3. Green immediately left of White
  for (let i = 0; i < 4; i++) if (h[i].color === "Green" && h[i + 1].color === "White") s[3] = "satisfied";
  if (s[3] !== "satisfied" && h.some(x => x.color === "Green") && h.some(x => x.color === "White")) s[3] = "conflict";

  // 4. Green ↔ Coffee
  if (h.some(x => x.color === "Green" && x.drink === "Coffee")) s[4] = "satisfied";
  else if (h.some(x => x.color === "Green") && h.some(x => x.drink === "Coffee")) s[4] = "conflict";

  // 5. Pall Mall ↔ Birds
  if (h.some(x => x.cigarette === "Pall Mall" && x.pet === "Bird")) s[5] = "satisfied";
  else if (h.some(x => x.cigarette === "Pall Mall") && h.some(x => x.pet === "Bird")) s[5] = "conflict";

  // 6. Yellow ↔ Dunhill
  if (h.some(x => x.color === "Yellow" && x.cigarette === "Dunhill")) s[6] = "satisfied";
  else if (h.some(x => x.color === "Yellow") && h.some(x => x.cigarette === "Dunhill")) s[6] = "conflict";

  // 7. Center (house #3) ↔ Milk
  if (h[2].drink === "Milk") s[7] = "satisfied";
  else if (h.some(x => x.drink === "Milk")) s[7] = "conflict";

  // 8. First house ↔ Norwegian
  if (h[0].nationality === "Norwegian") s[8] = "satisfied";
  else if (h.some(x => x.nationality === "Norwegian")) s[8] = "conflict";

  // 9. Blends next to Cats
  for (let i = 0; i < 5; i++) {
    if (h[i].cigarette === "Blends" &&
        ((i > 0 && h[i - 1].pet === "Cat") || (i < 4 && h[i + 1].pet === "Cat"))) s[9] = "satisfied";
  }

  // 10. Horses next to Dunhill
  for (let i = 0; i < 5; i++) {
    if (h[i].pet === "Horse" &&
        ((i > 0 && h[i - 1].cigarette === "Dunhill") || (i < 4 && h[i + 1].cigarette === "Dunhill"))) s[10] = "satisfied";
  }

  // 11. Blue Master ↔ Beer
  if (h.some(x => x.cigarette === "Blue Master" && x.drink === "Beer")) s[11] = "satisfied";
  else if (h.some(x => x.cigarette === "Blue Master") && h.some(x => x.drink === "Beer")) s[11] = "conflict";

  // 12. German ↔ Prince
  if (h.some(x => x.nationality === "German" && x.cigarette === "Prince")) s[12] = "satisfied";
  else if (h.some(x => x.nationality === "German") && h.some(x => x.cigarette === "Prince")) s[12] = "conflict";

  // 13. Norwegian next to Blue
  for (let i = 0; i < 4; i++) {
    if (h[i].nationality === "Norwegian" && h[i + 1].color === "Blue") s[13] = "satisfied";
    if (h[i + 1].nationality === "Norwegian" && h[i].color === "Blue") s[13] = "satisfied";
  }

  // 14. Blends next to Water
  for (let i = 0; i < 5; i++) {
    if (h[i].cigarette === "Blends" &&
        ((i > 0 && h[i - 1].drink === "Water") || (i < 4 && h[i + 1].drink === "Water"))) s[14] = "satisfied";
  }

  return s;
}

/* ========= Fireworks ========= */
function launchFireworks() {
  const container = document.getElementById("fireworks");
  container.innerHTML = "";
  container.style.display = "block";

  const burstCount = 5;     // total bursts
  const duration = 3000;    // particle lifetime (ms)
  const interval = 500;     // start bursts this far apart (overlap)

  function createBurst() {
    for (let b = 0; b < 17; b++) {  // 17 random origins
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

/* ========= Click-to-highlight (notes) ========= */
function toggleClueHighlight(idx) {
  const el = document.getElementById("clue-" + idx);
  if (el.classList.contains("satisfied")) return; // don't let notes override satisfied
  if (el.classList.contains("conflict")) return;  // also don't let notes override conflict
  el.classList.toggle("highlight");
}
