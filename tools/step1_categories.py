# -*- coding: utf-8 -*-
"""Step1：创建/校正 Outlook 主类别及配色。幂等，可重复运行。"""
from outlook_client import OutlookClient

# displayName -> preset 色（经 Microsoft Graph categoryColor 色板核对）
WANTED = {
    "课程": "preset7",   # Blue 蓝
    "睡眠": "preset23",  # DarkPurple 深紫
    "三餐": "preset1",   # Orange 橙
    "午睡": "preset9",   # Cranberry 莓粉
    "放风": "preset4",   # Green 绿
}

c = OutlookClient()
existing = {x["displayName"]: x for x in c.get("/me/outlook/masterCategories").get("value", [])}

for name, color in WANTED.items():
    if name in existing:
        cur = existing[name]
        if cur.get("color") == color:
            print(f"= 已存在且颜色一致：{name}（{color}）")
        else:
            c.patch(f"/me/outlook/masterCategories/{cur['id']}", {"color": color})
            print(f"~ 校正颜色：{name} {cur.get('color')} -> {color}")
    else:
        c.post("/me/outlook/masterCategories", {"displayName": name, "color": color})
        print(f"+ 新建类别：{name}（{color}）")

print("\n创建后主类别列表：")
for x in c.get("/me/outlook/masterCategories").get("value", []):
    mark = " *" if x["displayName"] in WANTED else ""
    print(f"  - {x['displayName']} | {x.get('color')}{mark}")
print("\n总请求数:", c.request_count)
