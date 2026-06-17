import json

with open("/tmp/figma_node.json", "r", encoding="utf-8") as f:
    node = json.load(f)

# =============== 主容器信息 ===============
bb = node.get("absoluteBoundingBox") or {}
print(f"=== 主容器『{node.get('name')}』===")
print(f"  尺寸: {int(bb.get('width',0))} x {int(bb.get('height',0))}")
if "backgroundColor" in node:
    c = node["backgroundColor"]
    bg = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
    print(f"  背景色: {bg}")
if "fills" in node:
    for f in node["fills"]:
        c = f.get("color",{})
        hex = f"#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x}"
        print(f"  fills: {f.get('type')} color={hex} op={f.get('opacity',1)}")

# =============== 卡片颜色汇总 ===============
def collect_cards(n, cards=None):
    if cards is None: cards = []
    name = n.get("name","")
    if name.startswith("Frame 21472398") or name.startswith("Frame 214723987"):
        cards.append(n)
    for ch in n.get("children", []) or []:
        collect_cards(ch, cards)
    return cards

cards = collect_cards(node)
print(f"\n=== 堆叠卡片（共 {len(cards)} 个）===")
colors = set()
for c in cards:
    for f in c.get("fills", []) or []:
        if f.get("type") == "SOLID":
            col = f["color"]
            hex = f"#{int(col['r']*255):02x}{int(col['g']*255):02x}{int(col['b']*255):02x}"
            op = f.get("opacity", 1)
            key = (hex, op)
            if key not in colors:
                colors.add(key)
                bb = c.get("absoluteBoundingBox",{})
                print(f"  color={hex} opacity={op} w={int(bb.get('width',0))} h={int(bb.get('height',0))} radius={c.get('cornerRadius')}")

# =============== 按钮样式 ===============
def find_by_name(n, target):
    if n.get("name") == target: return n
    for ch in n.get("children", []) or []:
        r = find_by_name(ch, target)
        if r: return r
    return None

btn = find_by_name(node, "Frame 2147240052")  # 添加主题按钮容器
if btn:
    bb = btn.get("absoluteBoundingBox",{})
    print(f"\n=== 「添加主题」按钮 ===")
    print(f"  尺寸: {int(bb.get('width',0))} x {int(bb.get('height',0))}")
    print(f"  圆角: {btn.get('cornerRadius')}")
    # 阴影
    for e in btn.get("effects", []) or []:
        if e.get("type") == "DROP_SHADOW":
            col = e.get("color", {})
            hex = f"#{int(col.get('r',0)*255):02x}{int(col.get('g',0)*255):02x}{int(col.get('b',0)*255):02x}"
            print(f"  阴影: offset=({e.get('offset',{}).get('x',0)}, {e.get('offset',{}).get('y',0)}) radius={e.get('radius')} color={hex} alpha={col.get('a',1)}")
    # 渐变
    for f in btn.get("fills", []) or []:
        print(f"  fill_type={f.get('type')}")

# =============== Chat 输入框 ===============
chat = find_by_name(node, "Chat Input")
if chat:
    bb = chat.get("absoluteBoundingBox",{})
    print(f"\n=== Chat Input ===")
    print(f"  尺寸: {int(bb.get('width',0))} x {int(bb.get('height',0))}")
    print(f"  圆角: {chat.get('cornerRadius')}")
    for f in chat.get("fills", []) or []:
        if f.get("type") == "SOLID":
            col = f["color"]
            print(f"  背景: #{int(col['r']*255):02x}{int(col['g']*255):02x}{int(col['b']*255):02x}")
    for s in chat.get("strokes", []) or []:
        if s.get("type") == "SOLID":
            col = s["color"]
            print(f"  边框: #{int(col['r']*255):02x}{int(col['g']*255):02x}{int(col['b']*255):02x} w={chat.get('strokeWeight',1)}")

# =============== 文本样式汇总 ===============
def collect_texts(n, styles=None):
    if styles is None: styles = {}
    if n.get("type") == "TEXT":
        st = n.get("style", {})
        fs = st.get("fontSize",0)
        fw = st.get("fontWeight",0)
        key = (fs, fw, st.get("fontFamily",""))
        for f in n.get("fills", []) or []:
            c = f.get("color",{})
            col = f"#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x}"
        chars = n.get("characters","")[:30]
        if key not in styles:
            styles[key] = []
        styles[key].append(chars)
    for ch in n.get("children", []) or []:
        collect_texts(ch, styles)
    return styles

styles = collect_texts(node)
print(f"\n=== 文本样式（{len(styles)} 种）===")
for (fs, fw, ff), samples in sorted(styles.items(), key=lambda x: -x[0][0]):
    print(f"  {ff} | size={fs} | weight={fw} | 例如: '{samples[0]}'（出现 {len(samples)} 次）")
