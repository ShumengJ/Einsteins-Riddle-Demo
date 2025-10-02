from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Example constraints for Einstein’s riddle (15 classic)
CLUES = [
    "The Brit lives in the Red house.",
    "The Swede keeps Dogs as pets.",
    "The Dane drinks Tea.",
    "The Green house is exactly to the left of the White house.",
    "The owner of the Green house drinks Coffee.",
    "The person who smokes Pall Mall rears Birds.",
    "The owner of the Yellow house smokes Dunhill.",
    "The man living in the centre house drinks Milk.",
    "The Norwegian lives in the first house.",
    "The man who smokes Blends lives next to the one who keeps Cats.",
    "The man who keeps Horses lives next to the man who smokes Dunhill.",
    "The man who smokes Blue Master drinks Beer.",
    "The German smokes Prince.",
    "The Norwegian lives next to the Blue house.",
    "The man who smokes Blends has a neighbour who drinks Water."
]

@app.route("/")
def index():
    return render_template("index.html", clues=CLUES)

@app.route("/check_clues", methods=["POST"])
def check_clues():
    data = request.json
    houses = data.get("houses", [])  # list of 5 dicts, left->right

    N = len(houses)

    # --- helpers -------------------------------------------------------------
    def find_index(key, value):
        """Return the index of the house that has key==value, or None."""
        for i, h in enumerate(houses):
            if h.get(key) == value:
                return i
        return None

    def val_at(i, key):
        return houses[i].get(key) if 0 <= i < N else None

    def check_pair(key1, val1, key2, val2):
        """
        Same-house constraint: (key1==val1) <-> (key2==val2)
        satisfied if they co-occur in same house.
        conflict if one side is fixed but the other side is fixed to a different value OR
        if the 'other' value is placed in a different house with a conflicting identity (uniqueness).
        else unsatisfied.
        """
        i1 = find_index(key1, val1)  # where val1 is
        i2 = find_index(key2, val2)  # where val2 is

        if i1 is not None and i2 is not None:
            return "satisfied" if i1 == i2 else "conflict"

        if i1 is not None:
            v2 = val_at(i1, key2)
            if v2 and v2 != val2:
                return "conflict"
            # also, if val2 appears elsewhere in a house whose key1 is set and != val1, that’s conflict
            if i2 is not None and i2 != i1:
                v1_there = val_at(i2, key1)
                if v1_there and v1_there != val1:
                    return "conflict"
            return "unsatisfied"

        if i2 is not None:
            v1 = val_at(i2, key1)
            if v1 and v1 != val1:
                return "conflict"
            # also, if val1 appears elsewhere with a different key2 already set, conflict
            if i1 is not None and i1 != i2:
                v2_there = val_at(i1, key2)
                if v2_there and v2_there != val2:
                    return "conflict"
            return "unsatisfied"

        # Neither side placed: still neutral.
        return "unsatisfied"

    def check_center(key, value, center_idx=2):
        """
        Centre house must have key==value.
        conflict if centre has a different value for key OR if value appears in any other house (uniqueness).
        """
        v = val_at(center_idx, key)
        if v == value:
            return "satisfied"
        if v and v != value:
            return "conflict"
        # uniqueness: if some other house already has that value, centre can't have it
        for i in range(N):
            if i == center_idx:
                continue
            if val_at(i, key) == value:
                return "conflict"
        return "unsatisfied"

    def check_first(key, value):
        """
        First (left-most) house must have key==value.
        conflict if first has a different value OR if value appears in any other house (uniqueness).
        """
        v = val_at(0, key)
        if v == value:
            return "satisfied"
        if v and v != value:
            return "conflict"
        for i in range(1, N):
            if val_at(i, key) == value:
                return "conflict"
        return "unsatisfied"

    def check_next_to(key1, val1, key2, val2):
        """
        (key1==val1) is next to (key2==val2).
        satisfied if positions known and adjacent OR a known side neighbor already has needed value.
        conflict if both positions known and not adjacent, OR if the only possible neighbor slot(s) are filled wrongly.
        otherwise unsatisfied.
        """
        i1 = find_index(key1, val1)
        i2 = find_index(key2, val2)

        # If both placed, we can decide immediately.
        if i1 is not None and i2 is not None:
            return "satisfied" if abs(i1 - i2) == 1 else "conflict"

        # If (key1,val1) placed, check neighbors and impossibility
        if i1 is not None:
            left_i, right_i = (i1 - 1 if i1 > 0 else None), (i1 + 1 if i1 < N - 1 else None)
            # Already satisfied?
            if (left_i is not None and val_at(left_i, key2) == val2) or \
               (right_i is not None and val_at(right_i, key2) == val2):
                return "satisfied"
            # If (key2,val2) is placed elsewhere and not adjacent => impossible
            if i2 is not None and abs(i1 - i2) != 1:
                return "conflict"
            # If both neighbor slots exist but both are explicitly filled with wrong values => impossible
            left_block = (left_i is not None and val_at(left_i, key2) and val_at(left_i, key2) != val2)
            right_block = (right_i is not None and val_at(right_i, key2) and val_at(right_i, key2) != val2)
            if (left_i is None and right_block) or (right_i is None and left_block) or (left_block and right_block):
                return "conflict"
            return "unsatisfied"

        # Symmetric: (key2,val2) placed but (key1,val1) not.
        if i2 is not None:
            left_i, right_i = (i2 - 1 if i2 > 0 else None), (i2 + 1 if i2 < N - 1 else None)
            if (left_i is not None and val_at(left_i, key1) == val1) or \
               (right_i is not None and val_at(right_i, key1) == val1):
                return "satisfied"
            # If (key1,val1) is placed elsewhere and not adjacent => impossible
            if i1 is not None and abs(i1 - i2) != 1:
                return "conflict"
            left_block = (left_i is not None and val_at(left_i, key1) and val_at(left_i, key1) != val1)
            right_block = (right_i is not None and val_at(right_i, key1) and val_at(right_i, key1) != val1)
            if (left_i is None and right_block) or (right_i is None and left_block) or (left_block and right_block):
                return "conflict"
            return "unsatisfied"

        return "unsatisfied"

    def check_exact_left_of(keyL, valL, keyR, valR):
        """
        (keyL==valL) is immediately to the left of (keyR==valR).
        Adjacent positions only.
        """
        iL = find_index(keyL, valL)
        iR = find_index(keyR, valR)

        if iL is not None and iR is not None:
            return "satisfied" if (iL + 1 == iR) else "conflict"

        # If left item placed:
        if iL is not None:
            # cannot be at far right
            if iL == N - 1:
                return "conflict"
            right_i = iL + 1
            # If the right neighbor has keyR set but not valR => impossible
            vr = val_at(right_i, keyR)
            if vr and vr != valR:
                return "conflict"
            # If valR is placed elsewhere but not at right_i => impossible
            if iR is not None and iR != right_i:
                return "conflict"
            return "unsatisfied"

        # If right item placed:
        if iR is not None:
            # cannot be at far left
            if iR == 0:
                return "conflict"
            left_i = iR - 1
            vl = val_at(left_i, keyL)
            if vl and vl != valL:
                return "conflict"
            if iL is not None and iL != left_i:
                return "conflict"
            return "unsatisfied"

        return "unsatisfied"

    # --- evaluate all clues ---------------------------------------------------
    results = []

    for clue in CLUES:
        status = "unsatisfied"

        if clue == "The Brit lives in the Red house.":
            status = check_pair("nationality", "Brit", "color", "Red")

        elif clue == "The Swede keeps Dogs as pets.":
            # Dropdown uses "Dog" (singular)
            status = check_pair("nationality", "Swede", "pet", "Dog")

        elif clue == "The Dane drinks Tea.":
            status = check_pair("nationality", "Dane", "drink", "Tea")

        elif clue == "The Green house is exactly to the left of the White house.":
            status = check_exact_left_of("color", "Green", "color", "White")

        elif clue == "The owner of the Green house drinks Coffee.":
            status = check_pair("color", "Green", "drink", "Coffee")

        elif clue == "The person who smokes Pall Mall rears Birds.":
            status = check_pair("cigarette", "Pall Mall", "pet", "Bird")

        elif clue == "The owner of the Yellow house smokes Dunhill.":
            status = check_pair("color", "Yellow", "cigarette", "Dunhill")

        elif clue == "The man living in the centre house drinks Milk.":
            status = check_center("drink", "Milk", center_idx=2)

        elif clue == "The Norwegian lives in the first house.":
            status = check_first("nationality", "Norwegian")

        elif clue == "The man who smokes Blends lives next to the one who keeps Cats.":
            status = check_next_to("cigarette", "Blends", "pet", "Cat")

        elif clue == "The man who keeps Horses lives next to the man who smokes Dunhill.":
            status = check_next_to("pet", "Horse", "cigarette", "Dunhill")

        elif clue == "The man who smokes Blue Master drinks Beer.":
            status = check_pair("cigarette", "Blue Master", "drink", "Beer")

        elif clue == "The German smokes Prince.":
            status = check_pair("nationality", "German", "cigarette", "Prince")

        elif clue == "The Norwegian lives next to the Blue house.":
            status = check_next_to("nationality", "Norwegian", "color", "Blue")

        elif clue == "The man who smokes Blends has a neighbour who drinks Water.":
            status = check_next_to("cigarette", "Blends", "drink", "Water")

        results.append({"clue": clue, "status": status})

    return jsonify(results)




if __name__ == "__main__":
    app.run(debug=True)