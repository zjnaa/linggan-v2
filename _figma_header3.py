import json

with open("/tmp/figma_node.json", "r", encoding="utf-8") as f:
    node = json.load(f)

# 找 header 区 (Frame 2147240039 的第二个子节点)
# 上一次我们看到它在 pos=(1003,13) dim=(660x28)
# 让我直接解析它的所有后代
def find_frame(n, target_name):
    if n.get("id") == target_name or n.get("name") == target_name:
        return n
    for ch in n.get("children", []) or []:
        r = find_frame(ch, target_name)
        if r: return r
    return None

# 查找搜索图标
def find_by_dim(n, min_w, max_w, depth=0, results=None):
    if results is None: results = []
    bb = n.get("absoluteBoundingBox", {})
    if bb:
        w = int(bb.get("width", 0))
        h = int(bb.get("height", 0))
        if min_w <= w <= max_w and min_w <= h <= max_w and n.get("type") != "TEXT":
            results.append((n, depth))
    for ch in n.get("children", []) or []:
        find_by_dim(ch, min_w, max_w, depth+1, results)
    return results

# 找到顶部工具栏 (第二个 Frame 2147240039)
# 直接打印所有 y<=56 的内容
print("=== y <= 56 的所有节点 (header 区域) ===")
def find_toparea(n, acc=None, depth=0):
    if acc is None: acc = []
    bb = n.get("absoluteBoundingBox", {})
    y = bb.get("y", 999999) if bb else 999999
    h = bb.get("height", 0) if bb else 0
    if y + h <= 80:
        acc.append(n)
    for ch in n.get("children", []) or []:
        find_toparea(ch, acc, depth+1)
    return acc

top = find_toparea(node)
print(f"发现 {len(top)} 个 y <= 80 的节点\n")

for i, n in enumerate(top):
    bb = n.get("absoluteBoundingBox", {})
    if not bb: continue
    x = int(bb.get("x", 0))
    y = int(bb.get("y", 0))
    w = int(bb.get("width", 0))
    h = int(bb.get("height", 0))
    t = n.get("type")
    name = n.get("name", "")

    bits = [f"[{t}] '{name}'", f"pos=({x},{y}) dim=({w}x{h})"]

    for f in n.get("fills", []) or []:
        if f.get("type") == "SOLID":
            c = f["color"]
            hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
            bits.append(f"bg={hex} op={f.get('opacity',1):.2f}")
        else:
            bits.append(f"bg_type={f.get('type')}")

    for s in n.get("strokes", []) or []:
        if s.get("type") == "SOLID":
            c = s["color"]
            hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
            bits.append(f"border={hex} w={n.get('strokeWeight',1)}")

    if "cornerRadius" in n:
        bits.append(f"radius={n['cornerRadius']}")

    if t == "TEXT":
        st = n.get("style", {})
        chars = n.get("characters", "")[:30]
        bits.append(f"'{chars}' font={st.get('fontFamily','')} fs={st.get('fontSize','')} fw={st.get('fontWeight','')}")
        c = n.get("fills", [{}])[0].get("color", {})
        if c:
            bits.append(f"color=#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x}")

    # 只打印非重复小方块和文本
    if w > 0 and (t == "TEXT" or w < 200):
        print("  " + " | ".join(bits))
