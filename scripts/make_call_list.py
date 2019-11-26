import json
import re

with open("all_apartments.json", "r") as infile:
    data = json.load(infile)

agents = []
numbers = []

for d in data:
    agent = d.get("agent")
    if not agent:
        continue
    name = agent.get("name")
    phone = agent.get("phone")
    if not name or not phone:
        continue

    phone = phone.replace("(", "1-").replace(") ", "-")

    name = name.split(" ")[0].title()

    if len(name) < 3:
        continue

    if re.search(r'^[\d]', name):
        continue

    if phone in numbers:
        continue

    numbers.append(phone)
    name = re.sub('\W', '', name)

    a = (name, phone)

    if a not in agents:
        agents.append(a)

agents = sorted(agents, key=lambda a: (a[0], a[1]))

with open('agents.json', "w") as outfile:
    json.dump(agents, outfile)
