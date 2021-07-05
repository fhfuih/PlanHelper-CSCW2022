import sys
import json

concepts = []
save_rotate = 20
save_rotate_count = 0

path = sys.argv[1]
with open(path, encoding='utf-8') as fp:
    j = json.load(fp)

concepts = set()
for answer in j['answers']:
    concepts.update([prop['concept'] for prop in answer['propositions'] if prop['concept']])
concepts = list(concepts)
lenans = len(j['answers'])
print(f'Curent concept list: {concepts}')

def save(force=False):
    global save_rotate_count
    save_rotate_count += 1
    if save_rotate_count < save_rotate and not force:
        return
    save_rotate_count = 0
    with open(path, 'w', encoding='utf-8') as fp:
        json.dump(j, fp, indent=2, ensure_ascii=False)

for ians, answer in enumerate(j['answers']):
    progress = len([None for prop in answer['propositions'] if prop['concept']]), len(answer['propositions'])
    print('========')
    print(f'({ians}/{lenans}) ({answer.get("author", "<Unknown>")}) {answer["content"][:50]}...')
    print(f'This answer\'s progress: {progress[0]}/{progress[1]}')
    if progress[0] == progress[1]:
        continue
    for iprop, proposition in enumerate(answer['propositions']):
        print('--------')
        print(f'({iprop + 1}/{progress[1]}) {proposition["content"]}')
        if concepts:
            for i, c in enumerate(concepts):
                print(f'{i+1}: {c}')
        print('<num>: <Select concept>')
        print('<text>: <Add new concept>')
        print('f: <skip proposition>')
        print('a: <skip answer>')
        print('q: <save and quit>')
        inp = input('Action: ').lower()
        if inp.isdigit():
            idx = int(inp) - 1
            con = concepts[idx]
            proposition['concept'] = con
            print(f'Selecting concept {con}')
            # save()
        elif inp == 'f':
            continue
        elif inp == 'a':
            break
        elif inp == 'q':
            save(True)
            exit(0)
        else:
            con = inp.title()
            concepts.append(con)
            proposition['concept'] = con
            print(f'Selecting concept {con}')
            # save()
    save(True)
