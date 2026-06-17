import json

with open("/tmp/figma_node.json", "r", encoding="utf-8") as f:
    node = json.load(f)

# 找 "查看素材库" 按钮的完整祖先链
def find_with_path(n, target, path=None):
    if path is None: path = []
    chars = n.get("characters","")
    if target in chars:
        return path + [n]
    for ch in n.get("children", []) or []:
        r = find_with_path(ch, target, path + [n])
        if r: return r
    return None

path = find_with_path(node, "查看素材库")
if path:
    print("=== 『查看素材库』按钮完整结构 ===\n")
    for i, anc in enumerate(path):
        indent = "  " * i
        name = anc.get("name","")
        t = anc.get("type")
        bb = anc.get("absoluteBoundingBox", {})
        x = int(bb.get("x",0)) if bb else 0
        y = int(bb.get("y",0)) if bb else 0
        w = int(bb.get("width",0)) if bb else 0
        h = int(bb.get("height",0)) if bb else 0

        bits = [f"{indent}[{t}] '{name}'", f"pos=({x},{y}) dim=({w}x{h})"]

        for f in anc.get("fills", []) or []:
            if f.get("type") == "SOLID":
                c = f["color"]
                hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
                bits.append(f"bg={hex} op={f.get('opacity',1):.2f}")
            elif f.get("type"):
                bits.append(f"bg_type={f.get('type')}")

        for s in anc.get("strokes", []) or []:
            if s.get("type") == "SOLID":
                c = s["color"]
                hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
                bits.append(f"border={hex} w={anc.get('strokeWeight',1)}")

        if "cornerRadius" in anc:
            bits.append(f"radius={anc['cornerRadius']}")

        if t == "TEXT":
            st = anc.get("style", {})
            bits.append(f"font={st.get('fontFamily','')} fs={st.get('fontSize','')} fw={st.get('fontWeight','')}")
            c = anc.get("fills", [{}])[0].get("color", {})
            if c:
                bits.append(f"color=#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x}")
        print("  ".join(bits))

# ============ 左侧导航栏 "灵感" ============
print("\n\n=== 左侧导航栏 ===")
nav_path = find_with_path(node, "灵感")
if nav_path:
    for i, anc in enumerate(nav_path):
        indent = "  " * i
        name = anc.get("name","")
        t = anc.get("type")
        bb = anc.get("absoluteBoundingBox", {})
        x = int(bb.get("x",0)) if bb else 0
        y = int(bb.get("y",0)) if bb else 0
        w = int(bb.get("width",0)) if bb else 0
        h = int(bb.get("height",0)) if bb else 0
        bits = [f"{indent}[{t}] '{name}'", f"pos=({x},{y}) dim=({w}x{h})"]

        for f in anc.get("fills", []) or []:
            if f.get("type") == "SOLID":
                c = f["color"]
                hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
                bits.append(f"bg={hex} op={f.get('opacity',1):.2f}")

        for s in anc.get("strokes", []) or []:
            if s.get("type") == "SOLID":
                c = s["color"]
                hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
                bits.append(f"border={hex} w={anc.get('strokeWeight',1)}")

        if "cornerRadius" in anc:
            bits.append(f"radius={anc['cornerRadius']}")

        if t == "TEXT":
            st = anc.get("style", {})
            bits.append(f"font={st.get('fontFamily','')} fs={st.get('fontSize','')} fw={st.get('fontWeight','')}")
            c = anc.get("fills", [{}])[0].get("color", {})
            if c:
                bits.append(f"color=#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x}")
        print("  ".join(bits))
