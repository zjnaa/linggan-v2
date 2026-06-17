import os, json, urllib.request, urllib.parse

FILE_KEY = "U3ozlb4TTs4Rx64sRx1yDI"
TOKEN = os.environ["FIGMA_TOKEN"]

# 需要下载的图标节点
# 章鱼哥 40x40（Logo）: I111:28815;1483:52796
# 章鱼哥 32x32（头像）: 111:28831
# AI/summary 14x14 查看素材库图标: I112:31045;13369:67280
# 搜索图标 14x14: I111:30987;14007:78813

icon_ids = [
    "I111:28815;1483:52796",  # 章鱼哥 logo
    "111:28831",               # 章鱼哥 32x32 (右下角)
    "I112:31045;13369:67280",  # AI/summary 图标（查看素材库按钮里的）
    "I111:30987;14007:78813",  # 搜索图标
]

# Figma API 端点：批量获取 image URL
ids_comma = ",".join(icon_ids)
url = f"https://api.figma.com/v1/images/{FILE_KEY}?ids={urllib.parse.quote(ids_comma)}&format=svg&scale=2"

print(f"请求 URL: {url}")

req = urllib.request.Request(
    url,
    headers={"X-Figma-Token": TOKEN}
)

with urllib.request.urlopen(req, timeout=300) as resp:
    data = json.loads(resp.read().decode("utf-8"))

print(f"响应状态: {data.get('err', 'OK')}")
print()

images = data.get("images", {})
for nid, img_url in images.items():
    print(f"  {nid} -> {img_url}")
    if not img_url:
        continue

    # 下载 SVG
    try:
        req2 = urllib.request.Request(img_url)
        with urllib.request.urlopen(req2, timeout=120) as r2:
            svg_content = r2.read().decode("utf-8")
            filename_map = {
                "I111:28815;1483:52796": "logo-octopus",
                "111:28831": "avatar-octopus",
                "I112:31045;13369:67280": "icon-summary",
                "I111:30987;14007:78813": "icon-search",
            }
            fname = filename_map.get(nid, f"icon-{nid.replace(':', '-').replace(';','_')}")
            outpath = f"/Users/bytedance/Downloads/提取样式/灵感新版/src/assets/{fname}.svg"

            import os
            os.makedirs(os.path.dirname(outpath), exist_ok=True)

            with open(outpath, "w", encoding="utf-8") as f:
                f.write(svg_content)

            print(f"    已保存: {outpath}  ({len(svg_content)} bytes)")
    except Exception as e:
        print(f"    下载失败: {e}")

print("\n完成")
