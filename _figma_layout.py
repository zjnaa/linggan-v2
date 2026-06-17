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

# 打印整个"主题列表"容器下第一层子节点 —— 这就是所有的顶层元素
# 这样能清楚看到从顶部到顶部各个区块的位置和尺寸
print("=== 主题列表 第一层子节点 ===\n")
children = doc.get("children", []) or []
print(f"第一层共有 {len(children)} 个子节点\n")

for i, ch in enumerate(children):
    name = ch.get("name", "")
    typ = ch.get("type", "")
    bb = ch.get("absoluteBoundingBox")
    if bb:
        x = int(bb.get("x", 0))
        y = int(bb.get("y", 0))
        w = int(bb.get("width", 0))
        h = int(bb.get("height", 0))
    else:
        x = y = w = h = 0

    bits = [f"[{i:>2}][{typ}] '{name}'", f"pos=({x},{y}) dim=({w}x{h})"]
    for f in ch.get("fills", []) or []:
        if f.get("type") == "SOLID":
            c = f["color"]
            hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
            bits.append(f"bg={hex} op={f.get('opacity',1):.2f}")
        elif f.get("type"):
            bits.append(f"bg_type={f.get('type')}")
    for s in ch.get("strokes", []) or []:
        if s.get("type") == "SOLID":
            c = s["color"]
            hex = f"#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}"
            bits.append(f"border={hex} w={ch.get('strokeWeight',1)}")
    if "cornerRadius" in ch:
        bits.append(f"radius={ch['cornerRadius']}")

    # 检查是否包含文字或子节点
    sub = ch.get("children", []) or []
    bits.append(f"children={len(sub)}")

    # 查找内部文本
    def find_text(n, depth=0):
        if n.get("type") == "TEXT":
            chars = n.get("characters", "")[:30]
            st = n.get("style", {})
            size = st.get("fontSize", "?")
            weight = st.get("fontWeight", "?")
            return f"'{chars}' fs={size} fw={weight}"
        for c2 in n.get("children", []) or []:
            r = find_text(c2, depth+1)
            if r:
                return r
        return None

    t = find_text(ch)
    if t:
        bits.append(t)

    print("  " + " | ".join(bits))

# ==============
# 重点：找 "创建你的灵感主题" 和 "添加主题" 按钮
# ==============
print("\n=== 关键词搜索: 创建 / 添加 / Frame 2147239829 ===")

def search_keyword(n, target, path=""):
    chars = n.get("characters", "")
    nid = n.get("id", "")
    name = n.get("name", "")

    if target in chars or target in name:
        bb = n.get("absoluteBoundingBox")
        if bb:
            x = int(bb["x"]); y = int(bb["y"]); w = int(bb["width"]); h = int(bb["height"])
            print(f"  {nid} '{name}' chars='{chars[:40]}' pos=({x},{y}) dim=({w}x{h})")
        st = n.get("style", {})
        if "fontSize" in st:
            print(f"    font: {st.get('fontFamily','')} fs={st['fontSize']} fw={st.get('fontWeight','')}")
            c = n.get("fills", [{}])[0].get("color", {})
            if c:
                print(f"    color: #{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}")

    for ch in n.get("children", []) or []:
        search_keyword(ch, target, path + "/" + str(n.get("id","")))

for kw in ["创建", "添加主题", "Frame 2147239829", "Frame 2147240000"]:
    print(f"\n  搜索 '{kw}':")
    search_keyword(doc, kw)

# 找卡片相关 Frame
print("\n=== 搜索卡片堆叠 (Frame 2147239829 附近节点) ===")
def search_card_container(n, depth=0):
    name = n.get("name", "")
    if "2147239829" in name or "2147239879" in name or "Stack" in name or "Cards" in name:
        bb = n.get("absoluteBoundingBox")
        if bb:
            x = int(bb["x"]); y = int(bb["y"]); w = int(bb["width"]); h = int(bb["height"])
            print(f"  {n.get('id','')} '{name}' pos=({x},{y}) dim=({w}x{h}) type={n.get('type')} children={len(n.get('children', []) or [])}")
    for ch in n.get("children", []) or []:
        search_card_container(ch, depth+1)

search_card_container(doc)
