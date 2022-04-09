import sys
import json

save_rotate = 20
save_rotate_count = 0

path = sys.argv[1]
save_path = path.replace(".json", "-concept.json")
with open(path, encoding="utf-8") as fp:
    j = json.load(fp)

concepts: dict[str, list[str]] = dict()


def add_concept(concept, subconcept=None):
    if not concept:
        return
    if concept not in concepts:
        if subconcept:
            concepts[concept] = [subconcept]
        else:
            concepts[concept] = []
    elif subconcept and subconcept not in concepts[concept]:
        concepts[concept].append(subconcept)


for answer in j["answers"]:
    if not answer:
        continue
    for prop in answer["propositions"]:
        if "concept" not in prop:
            prop["concept"] = ""
        if "subconcept" not in prop:
            prop["subconcept"] = ""
        concept, subconcept = prop["concept"], prop["subconcept"]
        add_concept(concept, subconcept)
lenans = sum(1 for a in j["answers"] if a)


print(f"Curent concept data: {concepts}")


def save(force=False):
    global save_rotate_count
    save_rotate_count += 1
    if save_rotate_count < save_rotate and not force:
        return
    save_rotate_count = 0
    with open(save_path, "w", encoding="utf-8") as fp:
        json.dump(j, fp, indent=2, ensure_ascii=False)


for ians, answer in enumerate(j["answers"]):
    if not answer:
        continue
    progress = len([None for prop in answer["propositions"] if prop["concept"]]), len(
        answer["propositions"]
    )
    print("========")
    print("========")
    print(
        f'({ians}/{lenans}) ({answer.get("author", {}).get("name", "<NA>")}) {answer["content"][:50]}...'
    )
    print(f"This answer's progress: {progress[0]}/{progress[1]}")
    if progress[0] == progress[1]:
        continue

    for iprop, proposition in enumerate(answer["propositions"]):
        print("----CONCEPT----")
        print(f'({iprop + 1}/{progress[1]}) {proposition["content"]}')
        concepts_keys = list(concepts)
        if concepts_keys:
            for i, c in enumerate(concepts_keys):
                print(f"{i+1}: {c}")
            print("<num>: <Select concept>")
        print("<text>: <Add new concept>")
        print("f: <skip proposition>")
        print("a: <skip answer>")
        print("q: <save and quit>")
        inp = input("Action: ").strip().lower()
        if inp == "f":
            continue
        elif inp == "a":
            break
        elif inp == "q":
            save(True)
            exit(0)
        else:
            if inp.isdigit():
                idx = int(inp) - 1
                while idx < 0 or idx >= len(concepts_keys):
                    inp = input("Invalid number. Action: ").strip().lower()
                    idx = int(inp) - 1
                con = concepts_keys[idx]
                proposition["concept"] = con
                print(f"Selecting concept {con}")
            else:
                con = inp
                add_concept(con)
                proposition["concept"] = con
                print(f"Selecting concept {con}")
                # save()

            print("----SUBCONCEPT----")
            subcon_list = concepts[con]
            if subcon_list:
                for i, sc in enumerate(subcon_list):
                    print(f"{i+1}: {sc}")
                print("<num>: <Select concept>")
            print("<text>: <Add new concept>")
            inp = input("Action: ").strip().lower()
            if inp.isdigit():
                idx = int(inp) - 1
                while idx < 0 or idx >= len(subcon_list):
                    inp = input("Invalid number. Action: ").strip().lower()
                    idx = int(inp) - 1
                sc = subcon_list[idx]
                proposition["subconcept"] = sc
                print(f"Selecting subconcept {sc}")
            else:
                sc = inp
                concepts[con].append(sc)
                proposition["subconcept"] = sc
                print(f"Selecting subconcept {sc}")
            # save()

    save(True)
