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

# 找到 Frame 2147239887
def find_by_id(n, target):
    if n.get("id") == target: return n
    for ch in n.get("children", []) or []:
        r = find_by_id(ch, target)
        if r: return r
    return None

# 递归打印整个树 —— 这次用层级方式
all_elements = []

def collect(n, depth=0):
    bb = n.get("absoluteBoundingBox")
    if bb:
        x = int(bb["x"]); y = int(bb["y"]); w = int(bb["width"]); h = int(bb["height"])
    else:
        x = y = w = h = 0

    typ = n.get("type", "")
    name = n.get("name", "")

    # 收集所有非 TEXT 节点（FRAME/INSTANCE 等）作为布局元素
    if typ == "FRAME" or typ == "INSTANCE":
        # 检查内部是否只有文本
        def has_only_text(n):
            sub = n.get("children", []) or []
            if len(sub) == 0: return False
            for s in sub:
                if s.get("type") != "TEXT":
                    return has_only_text(s) if s.get("children") else False
            return True

        text_content = ""
        def get_first_text(n):
            for c2 in (n.get("children", []) or []):
                if c2.get("type") == "TEXT":
                    return c2.get("characters", "")[:30]
                r = get_first_text(c2)
                if r: return r
            return ""
        text_content = get_first_text(n)

        all_elements.append((depth, f"[{typ}] '{name}' pos=({x},{y}) dim=({w}x{h}) -> '{text_content}'"))

    for ch in n.get("children", []) or []:
        collect(ch, depth+1)

# 从根开始
root = find_by_id(doc, "111:28817")  # Frame 2147239887
if root:
    collect(root, 0)

# 按 y 排序输出
def extract_y(s):
    import re
    m = re.search(r"pos=\((\d+),", s)
    return int(m.group(1)) if m else 99999

print("=== 按 y 坐标排序的布局元素 ===\n")
for depth, info in sorted(all_elements, key=lambda x: extract_y(x[1])):
    print("  " * depth + info)
