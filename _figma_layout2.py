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

# 递归查找 id=111:28816 （右侧主内容区 Frame 2147240000）
def find_by_id(n, target):
    if n.get("id") == target:
        return n
    for ch in n.get("children", []) or []:
        r = find_by_id(ch, target)
        if r: return r
    return None

# 深入两层
def print_children(n, depth=0, max_depth=3):
    if depth > max_depth:
        return
    indent = "  " * depth
    bb = n.get("absoluteBoundingBox")
    if bb:
        x = int(bb["x"]); y = int(bb["y"]); w = int(bb["width"]); h = int(bb["height"])
    else:
        x = y = w = h = 0

    bits = [f"{indent}[{n.get('type','')}] id={n.get('id','')} '{n.get('name','')}'", f"pos=({x},{y}) dim=({w}x{h})"]
    for f in n.get("fills", []) or []:
        if f.get("type") == "SOLID":
            c = f["color"]
            bits.append(f"bg=#{int(c['r']*255):02x}{int(c['g']*255):02x}{int(c['b']*255):02x}")
        elif f.get("type"):
            bits.append(f"bg_type={f.get('type')}")

    if n.get("type") == "TEXT":
        st = n.get("style", {})
        bits.append(f"'{n.get('characters','')[:30]}' font={st.get('fontFamily','')} fs={st.get('fontSize','')} fw={st.get('fontWeight','')}")

    # 只在顶层或找到重要节点时打印
    if depth <= 1 or "灵感" in n.get("name","") or "主题" in n.get("name","") or n.get("type") == "TEXT":
        print("  " + " | ".join(bits))

    for ch in n.get("children", []) or []:
        print_children(ch, depth+1, max_depth)

# 主内容区
print("=== Frame 2147240000（右侧主内容 1624x1018） ===")
main = find_by_id(doc, "111:28816")
if main:
    print_children(main, 0, 4)
else:
    print(" 未找到")

# 另外：查找 "创建你的灵感主题" 上面的元素
print("\n=== 详细：Frame 2147239022 下的所有节点 ===")
frame = find_by_id(doc, "111:28816")
if frame:
    # 打印所有直接子节点（更仔细）
    for i, ch in enumerate(frame.get("children", []) or []):
        bb = ch.get("absoluteBoundingBox")
        if bb:
            x = int(bb["x"]); y = int(bb["y"]); w = int(bb["width"]); h = int(bb["height"])
        else:
            x = y = w = h = 0
        bits = [f"  [{i}][{ch.get('type','')}] '{ch.get('name','')}'", f"pos=({x},{y}) dim=({w}x{h})"]

        # 检查有没有子节点（可能是一组卡片）
        sub = ch.get("children", []) or []
        bits.append(f"children={len(sub)}")

        # 查找文字
        def collect_texts(n, out):
            if n.get("type") == "TEXT":
                st = n.get("style", {})
                bb2 = n.get("absoluteBoundingBox")
                if bb2:
                    tx = int(bb2["x"]); ty = int(bb2["y"])
                else:
                    tx = ty = 0
                out.append(f"    TXT: ({tx},{ty}) '{n.get('characters','')[:40]}' fs={st.get('fontSize','')} fw={st.get('fontWeight','')}")
            for c2 in n.get("children", []) or []:
                collect_texts(c2, out)

        texts = []
        collect_texts(ch, texts)
        for t in texts[:5]:
            bits.append(t)
        if len(texts) > 5:
            bits.append(f"    ... ({len(texts)} texts total)")

        print(" | ".join(bits))
