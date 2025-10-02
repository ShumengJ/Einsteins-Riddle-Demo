function updateHouse(select, houseIndex, key) {
    let value = select.value;
    if (key === "color") {
        let houseHeader = document.getElementById("house-" + houseIndex);
        if (value) {
            houseHeader.style.color = value.toLowerCase();
        } else {
            houseHeader.style.color = "black"; // reset to default
        }
    }
    collectData();
    enforceUniqueSelections();
}

function collectData() {
    let houses = [];
    for (let i = 0; i < 5; i++) {
        let color = document.getElementById("color-" + i).value;
        let nationality = document.getElementById("nat-" + i).value;
        let drink = document.getElementById("drink-" + i).value;
        let cigarette = document.getElementById("cig-" + i).value;
        let pet = document.getElementById("pet-" + i).value;
        houses.push({color, nationality, drink, cigarette, pet});
    }

    fetch("/check_clues", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({houses: houses})
    })
    .then(response => response.json())
    .then(data => {
        data.forEach((res, idx) => {
            const el = document.getElementById("clue-" + idx);
            const marker = el.querySelector(".marker");

            // remove previous status classes
            el.classList.remove("satisfied", "conflict");

            if (res.status === "conflict") {
                el.classList.add("conflict");
                marker.textContent = "×";
                marker.style.color = "red";
            } else if (res.status === "satisfied") {
                el.classList.add("satisfied");
                el.classList.remove("highlight");   // drop manual highlight
                el.style.color = "";
                el.style.fontWeight = "";
                marker.textContent = "✓";
                marker.style.color = "green";
            } else {
                marker.textContent = "";
                marker.style.color = "";
            }
        });

        // check if puzzle is solved
        let allSatisfied = data.every(res => res.status === "satisfied");

        // check if no blanks left
        let noBlanks = true;
        for (let i = 0; i < 5; i++) {
            if (!document.getElementById("color-" + i).value ||
                !document.getElementById("nat-" + i).value ||
                !document.getElementById("drink-" + i).value ||
                !document.getElementById("cig-" + i).value ||
                !document.getElementById("pet-" + i).value) {
                noBlanks = false;
                break;
            }
        }

        if (allSatisfied && noBlanks) {
            launchFireworks();
        }
    });
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
                if (selectedValues.includes(opt.value) && opt.value !== currentVal) {
                    opt.disabled = true;
                } else {
                    opt.disabled = false;
                }
            }
        }
    });
}

function launchFireworks() {
    const container = document.getElementById("fireworks");
    container.innerHTML = "";
    container.style.display = "block";

    let burstCount = 5;
    let duration = 3000;
    let interval = 500;

    function createBurst() {
        for (let b = 0; b < 17; b++) {
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

    for (let n = 0; n < burstCount; n++) {
        setTimeout(() => {
            createBurst();
        }, n * interval);
    }

    setTimeout(() => {
        container.style.display = "none";
        container.innerHTML = "";
    }, burstCount * interval + duration);
}

function toggleClueHighlight(idx) {
    const el = document.getElementById("clue-" + idx);
    if (el.classList.contains("satisfied")) return;
    el.classList.toggle("highlight");
}
