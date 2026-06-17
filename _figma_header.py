import json

with open("/tmp/figma_node.json", "r", encoding="utf-8") as f:
    node = json.load(f)

# 在 Figma 中，顶层 Frame "主题列表" 的直接子节点
print("=== 顶层子节点（按 y 排序）===")
children = node.get("children", [])
print(f"总共有 {len(children)} 个子节点\n")

# 按 y 位置排序，看看顶部有什么
for ch in children:
    bb = ch.get("absoluteBoundingBox", {})
    x = int(bb.get("x", 0)) if bb else 0
    y = int(bb.get("y", 0)) if bb else 0
    w = int(bb.get("width", 0)) if bb else 0
    h = int(bb.get("height", 0)) if bb else 0

    bits = [f"[{ch.get('type')}] '{ch.get('name','')}'", f"pos=({x},{y}) dim=({w}x{h})"]

    # fills
    for f in ch.get("fills", []) or []:
        if f.get("type") == "SOLID":
            c = f["color"]
            hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
            bits.append(f"bg={hex} op={f.get('opacity',1):.2f}")
        else:
            bits.append(f"bg_type={f.get('type')}")

    # strokes
    for s in ch.get("strokes", []) or []:
        if s.get("type") == "SOLID":
            c = s["color"]
            hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
            bits.append(f"border={hex} w={ch.get('strokeWeight',1)}")

    if "cornerRadius" in ch:
        bits.append(f"radius={ch['cornerRadius']}")
    # effects
    for e in ch.get("effects", []) or []:
        if e.get("type") == "DROP_SHADOW":
            c = e.get("color", {})
            hex = f"#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x} alpha={c.get('a',1):.2f}"
            bits.append(f"shadow=({e.get('offset',{}).get('x',0)},{e.get('offset',{}).get('y',0)}) r={e.get('radius',0)} {hex}")

    # 检查是否含文本
    def check_text(n, depth=0):
        if n.get("type") == "TEXT":
            return (n.get("characters","")[:40], n.get("style",{}))
        for c2 in n.get("children", []) or []:
            r = check_text(c2, depth+1)
            if r: return r
        return None
    t = check_text(ch)
    if t:
        text, st = t
        bits.append(f"txt='{text}'")
        bits.append(f"font={st.get('fontFamily','')} fs={st.get('fontSize','')} fw={st.get('fontWeight','')}")

    print("  " + " | ".join(bits))

# ============ 重点："查看素材库" 按钮和搜索 ============
print("\n\n=== 搜索 '查看素材库' 相关节点 ===")
def find_text(n, target, ancestors=None):
    if ancestors is None: ancestors = []
    chars = n.get("characters","")
    if target in chars:
        return (n, ancestors)
    for ch in n.get("children", []) or []:
        r = find_text(ch, target, ancestors + [n])
        if r: return r
    return None

for keyword in ["查看素材库", "灵感主题", "灵感", "Figma", "素材库"]:
    r = find_text(node, keyword)
    if r:
        txt, anc = r
        print(f"\n  找到 '{keyword}':")
        st = txt.get("style", {})
        c = txt.get("fills", [{}])[0].get("color", {})
        hex = f"#{int(c.get('r',0)*255):02x}{int(c.get('g',0)*255):02x}{int(c.get('b',0)*255):02x}"
        print(f"    文字: '{txt.get('characters','')}'")
        print(f"    字体: {st.get('fontFamily','')} size={st.get('fontSize','')} weight={st.get('fontWeight','')}")
        print(f"    颜色: {hex}")
        print(f"    对齐: {st.get('textAlignHorizontal','')}/{st.get('textAlignVertical','')}")
        bb = txt.get("absoluteBoundingBox", {})
        print(f"    文本框: {int(bb.get('width',0))}x{int(bb.get('height',0))}")

        # 父容器（按钮外壳）
        if anc:
            container = anc[-1]
            bb2 = container.get("absoluteBoundingBox", {})
            print(f"    父容器: '{container.get('name','')}' size={int(bb2.get('width',0))}x{int(bb2.get('height',0))}")
            for f in container.get("fills", []) or []:
                if f.get("type") == "SOLID":
                    c2 = f["color"]
                    hex2 = f"#{int(c2['r']*255):02x}{int(c2['g']*255):02x}{int(c2['b']*255):02x}"
                    print(f"    父容器背景: {hex2} op={f.get('opacity',1):.2f}")
            for s in container.get("strokes", []) or []:
                if s.get("type") == "SOLID":
                    c2 = s["color"]
                    hex2 = f"#{int(c2['r']*255):02x}{int(c2['g']*255):02x}{int(c2['b']*255):02x}"
                    print(f"    父容器边框: {hex2} w={container.get('strokeWeight',1)}")
            if "cornerRadius" in container:
                print(f"    父容器圆角: {container['cornerRadius']}")
