# -*- coding: utf-8 -*-
"""批量转换 Me_Honey 28 篇 MD → 中文散文体 HTML + 拷贝封面图。"""
import _mh_convert as C
import os, json

def batch():
    entries = []
    htmls = {}
    os.makedirs('_mh_html', exist_ok=True)
    for f in sorted(os.listdir(C.MH)):
        if not f.endswith('.md'):
            continue
        entry, html = C.convert(f)
        entries.append(entry)
        htmls[entry['date']] = html
        open('_mh_html/%s.html' % entry['date'], 'w', encoding='utf-8').write(html)
        print('转换', entry['date'], '封面图=%s' % ('有' if entry['images'] else '无'))
    # 保存 entry 到 json（供后续用）
    open('_mh_entries.json', 'w', encoding='utf-8').write(json.dumps(entries, ensure_ascii=False, indent=1))
    return entries

if __name__ == '__main__':
    entries = batch()
    print('共', len(entries), '篇')
