"""Export a curated, public view of the Neo4j knowledge graph to graph.json for the hero section.

Read-only. Keeps Léon, his projects, his professional and academic experiences (merged with their
institution) and the skills shared by at least two of them. Personal nodes (preferences, contacts,
anecdotes, places, values...) are never exported. The layout is precomputed (force-directed, fixed seed)
so the page only draws SVG.

    python tools/export_graph.py            # reads NEO4J_* from .env, writes graph.json
"""
import json
import math
import os
import random
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "graph.json"

# Experiences shown in the graph, with the label used on the page
EXPERIENCES = {
    "UTBM_Degree": "UTBM",
    "UQAC_Degree": "UQAC",
    "Yeditepe_Exchange": "Yeditepe",
    "Ksilink_Internship": "Ksilink",
    "Astek_RND_Internship": "Astek",
    "Hackathon_UQAC_2025": "Hackathon UQAC",
    "SKIUTBM_Presidency": "SKI'UTBM",
}

# Neo4j project name -> project card key in texte.json (for translated titles and scrolling to the card)
PROJECT_CARDS = {
    "Multimodal Contrastive Learning": "card2",
    "LLM Chatbot for Biologists": "card3",
    "Cell Classification CNN": "card4",
    "Mushroom Toxicity Prediction": "card5",
    "MNIST Digit Recognition Demo": "card7",
    "Music Genre Classification": "card8",
    "Tangram Solver": "card9",
    "Intelligent RAG Chatbot & Dashboard": "card1",
    "Personal AI Chatbot (Portfolio RAG)": "card14",
    "Human Activity Recognition via Wearable Sensors": "card10",
    "AgroScan: AI-Powered Agricultural Diagnosis": "card12",
    "Multimodal Parkinson's Disease Detection": "card13",
    "RAG Chatbot for UQAC Handbook": "card11",
    "Poultry Disease Detection": "card6",
}

MAX_SKILLS = 18
WIDTH, HEIGHT = 1000, 720


def fetch(tx_query, **params):
    with driver.session() as session:
        return session.execute_read(lambda tx: [r.data() for r in tx.run(tx_query, params)])


load_dotenv(ROOT / ".env")
driver = GraphDatabase.driver(os.environ["NEO4J_URI"], auth=(os.environ["NEO4J_USER"], os.environ["NEO4J_PASSWORD"]))

projects = fetch("MATCH (:Person {name: 'Léon Morales'})-[:WORKED_ON]->(p:Project) RETURN p.name AS name")
links = fetch(
    """
    MATCH (src)-[:UTILIZED_SKILL|INVOLVED_SKILL|FOCUSED_ON_SKILL]->(s:Skill)
    WHERE (src:Project) OR (src:Experience AND src.identifier IN $exp)
    RETURN coalesce(src.identifier, src.name) AS src, s.name AS skill
    """,
    exp=list(EXPERIENCES),
)
exp_projects = fetch(
    "MATCH (e:Experience)-[:INCLUDED_PROJECT]->(p:Project) WHERE e.identifier IN $exp "
    "RETURN e.identifier AS exp, p.name AS project",
    exp=list(EXPERIENCES),
)
driver.close()

# --- Select skills linked to at least two shown projects/experiences
shown_sources = {p["name"] for p in projects} | set(EXPERIENCES)
skill_sources = {}
for l in links:
    if l["src"] in shown_sources:
        skill_sources.setdefault(l["skill"], set()).add(l["src"])
skills = sorted((s for s, src in skill_sources.items() if len(src) >= 2), key=lambda s: (-len(skill_sources[s]), s))
skills = skills[:MAX_SKILLS]

# --- Nodes and edges
nodes = [{"id": "leon", "type": "person", "label": "Léon Morales"}]
for name in sorted(p["name"] for p in projects):
    node = {"id": f"p:{name}", "type": "project", "label": name}
    if name in PROJECT_CARDS:
        node["card"] = PROJECT_CARDS[name]
    nodes.append(node)
for ident, label in EXPERIENCES.items():
    nodes.append({"id": f"e:{ident}", "type": "experience", "label": label})
for s in skills:
    nodes.append({"id": f"s:{s}", "type": "skill", "label": s})
ids = {n["id"] for n in nodes}

edges = set()
for n in nodes:
    if n["type"] in ("project", "experience"):
        edges.add(("leon", n["id"]))
for l in links:
    src = f"e:{l['src']}" if l["src"] in EXPERIENCES else f"p:{l['src']}"
    dst = f"s:{l['skill']}"
    if src in ids and dst in ids:
        edges.add((src, dst))
for ep in exp_projects:
    a, b = f"e:{ep['exp']}", f"p:{ep['project']}"
    if a in ids and b in ids:
        edges.add((a, b))
edges = sorted(edges)

# --- Force-directed layout (Fruchterman-Reingold), Léon pinned at the centre
rng = random.Random(42)
pos = {n["id"]: [rng.uniform(0.2, 0.8) * WIDTH, rng.uniform(0.2, 0.8) * HEIGHT] for n in nodes}
pos["leon"] = [WIDTH / 2, HEIGHT / 2]
k = math.sqrt(WIDTH * HEIGHT / len(nodes)) * 0.9
temp = WIDTH / 8
for _ in range(400):
    disp = {i: [0.0, 0.0] for i in pos}
    keys = list(pos)
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
            d = max(math.hypot(dx, dy), 0.01)
            f = k * k / d
            disp[a][0] += dx / d * f; disp[a][1] += dy / d * f
            disp[b][0] -= dx / d * f; disp[b][1] -= dy / d * f
    for a, b in edges:
        dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
        d = max(math.hypot(dx, dy), 0.01)
        f = d * d / k
        disp[a][0] -= dx / d * f; disp[a][1] -= dy / d * f
        disp[b][0] += dx / d * f; disp[b][1] += dy / d * f
    for i, (dx, dy) in disp.items():
        if i == "leon":
            continue
        d = max(math.hypot(dx, dy), 0.01)
        pos[i][0] = min(WIDTH - 60, max(60, pos[i][0] + dx / d * min(d, temp)))
        pos[i][1] = min(HEIGHT - 40, max(40, pos[i][1] + dy / d * min(d, temp)))
    temp *= 0.985

# Stretch the layout to the whole frame, leaving room on both sides for labels
xs, ys = [p[0] for p in pos.values()], [p[1] for p in pos.values()]
MARGIN_L, MARGIN_R, MARGIN_Y = 130, 130, 40
for n in nodes:
    x, y = pos[n["id"]]
    n["x"] = round(MARGIN_L + (x - min(xs)) / (max(xs) - min(xs)) * (WIDTH - MARGIN_L - MARGIN_R), 1)
    n["y"] = round(MARGIN_Y + (y - min(ys)) / (max(ys) - min(ys)) * (HEIGHT - 2 * MARGIN_Y), 1)

# Push apart nodes that ended up too close. Léon and the experiences always show a label, so they
# keep a wider clearance from each other
MIN_DIST = 58
LABELLED = ("person", "experience")
for _ in range(300):
    moved = False
    for i, a in enumerate(nodes):
        for b in nodes[i + 1:]:
            need = MIN_DIST * (2.2 if a["type"] in LABELLED and b["type"] in LABELLED else 1)
            dx, dy = b["x"] - a["x"], b["y"] - a["y"]
            d = math.hypot(dx, dy) or 0.01
            if d < need:
                push = (need - d) / 2
                ux, uy = dx / d, dy / d
                for node, sign in ((a, -1), (b, 1)):
                    if node["id"] != "leon":
                        node["x"] = round(min(WIDTH - MARGIN_R, max(MARGIN_L, node["x"] + sign * ux * push)), 1)
                        node["y"] = round(min(HEIGHT - MARGIN_Y, max(MARGIN_Y, node["y"] + sign * uy * push)), 1)
                moved = True
    if not moved:
        break

graph = {"width": WIDTH, "height": HEIGHT, "nodes": nodes, "edges": [list(e) for e in edges]}
OUT.write_text(json.dumps(graph, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"{OUT.name}: {len(nodes)} nodes ({len(projects)} projects, {len(EXPERIENCES)} experiences, "
      f"{len(skills)} skills), {len(edges)} edges")
