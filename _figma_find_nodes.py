import os, json, urllib.request

FILE_KEY = "U3ozlb4TTs4Rx64sRx1yDI"
TOKEN = os.environ["FIGMA_TOKEN"]

req = urllib.request.Request(
    f"https://api.figma.com/v1/files/{FILE_KEY}/nodes?ids=111-28813",
    headers={"X-Figma-Token": TOKEN}
)
with urllib.request.urlopen(req, timeout=180) as resp:
    data = json.loads(resp.read().decode("utf-8"))

doc = data["nodes"]["111:28813"]["document"]

target_names = {"mtc-默认", "章鱼哥", "灵感", "任务", "协作", "市场",
                 "AI/summary", "Text Editor/search", "Text Editor/ search",
                 "Arrows/chevron-right-small", "icon.16.agent", "icon.16.add",
                 "icon.12.keyboard.command", "icon.12.keyboard.opt",
                 "icon.12.keyboard.letter", "Text Editor /search",
                 "Mic button icon", "Send button icon", "icon.16.arrow.up",
                 "icon.16.microphone", "icon.16.chevron.up",
                 "icon.16.ai.sparkles", "moon", "Moon", "图片", "Image", "image",
                 "icon.16.add", "Frame 2147239449"}

found_nodes = []

def traverse(n, depth=0):
    name = n.get("name", "")
    nid = n.get("id", "")
    typ = n.get("type", "")
    children = n.get("children", []) or []

    if name in target_names:
        bb = n.get("absoluteBoundingBox")
        if bb:
            dim = (int(bb["width"]), int(bb["height"]))
        else:
            dim = (0, 0)
        found_nodes.append({"id": nid, "name": name, "type": typ, "dim": dim, "num_children": len(children)})

    for ch in children:
        traverse(ch, depth+1)

traverse(doc)

for item in found_nodes:
    print(f"  id={item['id']:<20} name={item['name']:<40} type={item['type']:<12} size={item['dim']} children={item['num_children']}")

print(f"\n找到 {len(found_nodes)} 个节点")
