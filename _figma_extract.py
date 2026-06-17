import os, urllib.request, json

TOKEN = os.environ["FIGMA_TOKEN"]
FILE_KEY = "U3ozlb4TTs4Rx64sRx1yDI"
NODE_IDS = "111-28813"

req = urllib.request.Request(
    f"https://api.figma.com/v1/files/{FILE_KEY}/nodes?ids={NODE_IDS}",
    headers={"X-Figma-Token": TOKEN, "Accept": "application/json"},
)
with urllib.request.urlopen(req, timeout=180) as resp:
    data = json.loads(resp.read().decode("utf-8"))

node = data["nodes"]["111:28813"]["document"]
with open("/tmp/figma_node.json", "w", encoding="utf-8") as f:
    json.dump(node, f, ensure_ascii=False, indent=2)
print(f"Saved. Size: {len(json.dumps(node, ensure_ascii=False))/1024:.1f} KB")

# ============================================================
# 样式提取工具
# ============================================================

def rgb_to_hex(rgb):
    if not rgb: return ""
    r = int(round(rgb.get("r", 0) * 255))
    g = int(round(rgb.get("g", 0) * 255))
    b = int(round(rgb.get("b", 0) * 255))
    a = rgb.get("a", 1)
    hex3 = f"#{r:02x}{g:02x}{b:02x}"
    if a < 1:
        return f"{hex3} / alpha {a:.2f}"
    return hex3

def describe_fill(fills):
    if not fills: return ""
    parts = []
    for f in fills:
        tp = f.get("type")
        if tp == "SOLID":
            c = f.get("color", {})
            opacity = f.get("opacity", 1)
            parts.append(f"SOLID:{rgb_to_hex(c)} op={opacity:.2f}")
        elif tp == "GRADIENT_LINEAR":
            parts.append("LINEAR_GRADIENT")
        elif tp == "IMAGE":
            parts.append("IMAGE")
        else:
            parts.append(str(tp))
    return " | ".join(parts)

def describe_effects(effects):
    if not effects: return ""
    out = []
    for e in effects:
        if e.get("type") == "DROP_SHADOW":
            c = e.get("color", {})
            out.append(f"shadow offset=({e.get('offset',{}).get('x',0)}, {e.get('offset',{}).get('y',0)}) radius={e.get('radius',0)} color={rgb_to_hex(c)}")
        elif e.get("type") == "INNER_SHADOW":
            out.append("inner_shadow")
        elif e.get("type") == "BLUR":
            out.append(f"blur r={e.get('radius',0)}")
    return " | ".join(out)

def describe_text_style(st):
    if not st: return ""
    parts = []
    if "fontFamily" in st: parts.append(f"fontFamily={st['fontFamily']}")
    if "fontSize" in st: parts.append(f"fontSize={st['fontSize']}")
    if "fontWeight" in st: parts.append(f"fontWeight={st['fontWeight']}")
    if "letterSpacing" in st: parts.append(f"letterSpacing={st['letterSpacing']}")
    lh = st.get("lineHeight")
    if lh and lh.get("value"): parts.append(f"lineHeight={lh['value']}{lh.get('unit','')}")
    if "textAlignHorizontal" in st: parts.append(f"alignH={st['textAlignHorizontal']}")
    if "textAlignVertical" in st: parts.append(f"alignV={st['textAlignVertical']}")
    if "textCase" in st: parts.append(f"case={st['textCase']}")
    return " | ".join(parts)

def analyze(n, depth=0, lines=None):
    if lines is None: lines = []
    indent = "  " * depth
    t = n.get("type")
    name = n.get("name", "")
    bb = n.get("absoluteBoundingBox")
    dim = f"w={bb['width']:.0f} h={bb['height']:.0f}" if bb else ""
    x = f"x={bb['x']:.0f} y={bb['y']:.0f}" if bb and depth > 0 else ""

    bits = [f"{indent}[{t}] \"{name}\""]
    if dim: bits.append(dim)
    if x: bits.append(x)

    # Fill color
    if "fills" in n:
        d = describe_fill(n["fills"])
        if d: bits.append(f"fill=({d})")
    if "strokes" in n and n["strokes"]:
        d = describe_fill(n["strokes"])
        sw = n.get("strokeWeight", 1)
        bits.append(f"stroke=({d}) w={sw}")
    if "cornerRadius" in n:
        bits.append(f"radius={n['cornerRadius']}")
    if "rectangleCornerRadii" in n:
        r = n["rectangleCornerRadii"]
        bits.append(f"radii=[{r[0]},{r[1]},{r[2]},{r[3]}]")
    if "effects" in n:
        d = describe_effects(n["effects"])
        if d: bits.append(f"effects=({d})")
    if "opacity" in n and n["opacity"] < 1:
        bits.append(f"opacity={n['opacity']:.2f}")
    # Text
    if t == "TEXT":
        st = n.get("style", {})
        chars = n.get("characters", "")
        fill_color = describe_fill(n.get("fills", []))
        bits.append(f"TXT_COLOR={fill_color}")
        ts = describe_text_style(st)
        if ts: bits.append(f"style=({ts})")
        if chars: bits.append(f'chars="{chars[:40]}"')

    lines.append("  ".join(bits))
    for ch in n.get("children", []) or []:
        analyze(ch, depth+1, lines)
    return lines

lines = analyze(node)
for l in lines:
    print(l)
print(f"\nTotal nodes: {len(lines)}")
