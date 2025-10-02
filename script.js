function updateHouse(select, houseIndex, key) {
    let value = select.value;
    if (key === "color") {
        let houseHeader = document.getElementById("house-" + houseIndex);
        houseHeader.style.color = value ? value.toLowerCase() : "black";
    }
    collectData();
    enforceUniqueSelections();
}

function getHouses() {
    let houses = [];
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
        el.classList.remove("satisfied", "conflict");

        if (status === "conflict") {
            el.classList.add("conflict");
            marker.textContent = "×";
            marker.style.color = "red";
        } else if (status === "satisfied") {
            el.classList.add("satisfied");
            el.classList.remove("highlight");
            marker.textContent = "✓";
            marker.style.color = "green";
        } else {
            marker.textContent = "";
            marker.style.color = "";
        }
    });

    // check if puzzle is solved
    let allSatisfied = statuses.every(res => res === "satisfied");
    let noBlanks = houses.every(h => Object.values(h).every(v => v));

    if (allSatisfied && noBlanks) {
        launchFireworks();
    }
}

function enforceUniqueSelections() {
    let categories = ["color", "nat", "drink", "cig", "pet"];

    categories.forEach(cat => {
        let selectedValues = [];
        for (let i = 0; i < 5; i++) {
            let val = document.getElementById(cat + "-" + i).value;
            if (val) selectedValues.push(val);
        }

        for (let i = 0; i < 5; i++) {
            let dropdown = document.getElementById(cat + "-" + i);
            let currentVal = dropdown.value;
            for (let opt of dropdown.options) {
                if (opt.value === "") continue;
                opt.disabled = selectedValues.includes(opt.value) && opt.value !== currentVal;
            }
        }
    });
}

// === Pure JS Clue Checker ===
function checkClues(h) {
    let s = new Array(15).fill("unsatisfied");

    if (h.some(x => x.nationality==="Brit" && x.color==="Red")) s[0]="satisfied"; 
    else if (h.some(x => x.nationality==="Brit")&&h.some(x=>x.color==="Red")) s[0]="conflict";

    if (h.some(x=>x.nationality==="Swede" && x.pet==="Dog")) s[1]="satisfied"; 
    else if (h.some(x=>x.nationality==="Swede")&&h.some(x=>x.pet==="Dog")) s[1]="conflict";

    if (h.some(x=>x.nationality==="Dane" && x.drink==="Tea")) s[2]="satisfied"; 
    else if (h.some(x=>x.nationality==="Dane")&&h.some(x=>x.drink==="Tea")) s[2]="conflict";

    for (let i=0;i<4;i++) if (h[i].color==="Green" && h[i+1].color==="White") s[3]="satisfied";
    if (s[3]!=="satisfied" && h.some(x=>x.color==="Green")&&h.some(x=>x.color==="White")) s[3]="conflict";

    if (h.some(x=>x.color==="Green" && x.drink==="Coffee")) s[4]="satisfied";
    else if (h.some(x=>x.color==="Green")&&h.some(x=>x.drink==="Coffee")) s[4]="conflict";

    if (h.some(x=>x.cigarette==="Pall Mall" && x.pet==="Bird")) s[5]="satisfied";
    else if (h.some(x=>x.cigarette==="Pall Mall")&&h.some(x=>x.pet==="Bird")) s[5]="conflict";

    if (h.some(x=>x.color==="Yellow" && x.cigarette==="Dunhill")) s[6]="satisfied";
    else if (h.some(x=>x.color==="Yellow")&&h.some(x=>x.cigarette==="Dunhill")) s[6]="conflict";

    if (h[2].drink==="Milk") s[7]="satisfied";
    else if (h.some(x=>x.drink==="Milk")) s[7]="conflict";

    if (h[0].nationality==="Norwegian") s[8]="satisfied";
    else if (h.some(x=>x.nationality==="Norwegian")) s[8]="conflict";

    for (let i=0;i<5;i++) {
        if (h[i].cigarette==="Blends" && ((i>0&&h[i-1].pet==="Cat")||(i<4&&h[i+1].pet==="Cat"))) s[9]="satisfied";
    }

    for (let i=0;i<5;i++) {
        if (h[i].pet==="Horse" && ((i>0&&h[i-1].cigarette==="Dunhill")||(i<4&&h[i+1].cigarette==="Dunhill"))) s[10]="satisfied";
    }

    if (h.some(x=>x.cigarette==="Blue Master" && x.drink==="Beer")) s[11]="satisfied";
    else if (h.some(x=>x.cigarette==="Blue Master")&&h.some(x=>x.drink==="Beer")) s[11]="conflict";

    if (h.some(x=>x.nationality==="German" && x.cigarette==="Prince")) s[12]="satisfied";
    else if (h.some(x=>x.nationality==="German")&&h.some(x=>x.cigarette==="Prince")) s[12]="conflict";

    for (let i=0;i<4;i++) {
        if (h[i].nationality==="Norwegian" && h[i+1].color==="Blue") s[13]="satisfied";
        if (h[i+1].nationality==="Norwegian" && h[i].color==="Blue") s[13]="satisfied";
    }

    for (let i=0;i<5;i++) {
        if (h[i].cigarette==="Blends" && ((i>0&&h[i-1].drink==="Water")||(i<4&&h[i+1].drink==="Water"))) s[14]="satisfied";
    }

    return s;
}

function launchFireworks() {
    const container = document.getElementById("fireworks");
    container.innerHTML = "";
    container.style.display = "block";

    let burstCount = 5;
    let duration = 3000;
    let interval = 500;

    function createBurst() {
        for (let b = 0; b < 10; b++) {
            let originX = Math.random() * window.innerWidth;
            let originY = Math.random() * window.innerHeight * 0.7;

            for (let i = 0; i < 40; i++) {
                let f = document.createElement("div");
                f.className = "firework";
                let angle = Math.random() * 2 * Math.PI;
                let distance = Math.random() * 250 + 50;
                f.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
                f.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
                f.style.background = `hsl(${Math.random()*360}, 100%, 50%)`;
                f.style.left = originX + "px";
                f.style.top = originY + "px";
                container.appendChild(f);
            }
        }
    }

    for (let n=0; n<burstCount; n++) {
        setTimeout(() => { createBurst(); }, n*interval);
    }

    setTimeout(() => {
        container.style.display = "none";
        container.innerHTML = "";
    }, burstCount*interval + duration);
}

function toggleClueHighlight(idx) {
    const el = document.getElementById("clue-" + idx);
    if (el.classList.contains("satisfied")) return;
    el.classList.toggle("highlight");
}
