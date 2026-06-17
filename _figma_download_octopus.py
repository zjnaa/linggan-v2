import os, json, urllib.request

FILE_KEY = "U3ozlb4TTs4Rx64sRx1yDI"
TOKEN = os.environ["FIGMA_TOKEN"]

# 尝试不同的节点 ID 下载小章鱼哥
candidates = [
    "111:28831",           # INSTANCE 32x32
    "111:28830",           # FRAME 32x32 (父)
    "111:28831;I111:28815;1483:52796",  # 尝试组合
    "I111:28831;1483:52796",  # 变体
]

for nid in candidates:
    try:
        url = f"https://api.figma.com/v1/images/{FILE_KEY}?ids={nid.replace(':', '%3A').replace(';', '%3B')}&format=svg&scale=2"
        req = urllib.request.Request(url, headers={"X-Figma-Token": TOKEN})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        img_url = data.get("images", {}).get(nid)
        if img_url:
            # 下载
            req2 = urllib.request.Request(img_url)
            with urllib.request.urlopen(req2, timeout=60) as r2:
                svg = r2.read().decode("utf-8")
            outpath = "/Users/bytedance/Downloads/提取样式/灵感新版/src/assets/avatar-octopus.svg"
            with open(outpath, "w", encoding="utf-8") as f:
                f.write(svg)
            print(f"✅ 成功: {nid} ({len(svg)} bytes) -> {outpath}")
            break
        else:
            print(f"❌ 无 URL: {nid}")
    except Exception as e:
        print(f"❌ 失败: {nid} -> {e}")

# 另外：既然 logo 已经下载了，看看可不可以直接复用 logo
print("\n✅ logo-octopus.svg 已存在，可以用作头像")
