# -*- coding: utf-8 -*-
"""把 Me_Honey/diary 的 MD 散文日记转成 MMDV 散文体 HTML（含封面图）。"""
import os, re, shutil, json

MH = r'C:\Me_Honey\diary'
MMV = r'C:\Users\NewtN\下载\Mon-Mode-de-Vie-main'
LOCATION = 'Mon Mode de Vie · Me_Honey'

def html_escape(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def md_inline(s):
    """处理行内 markdown：**粗体**、`code`、[链接]"""
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    return s

def md_body_to_html(lines):
    """把 MD 正文行转成 HTML 片段（从 H1 之后开始）。"""
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        if stripped == '---':
            i += 1
            continue
        if stripped.startswith('# '):  # H1 标题：跳过（日期入 header）
            i += 1
            continue
        if stripped.startswith('## '):
            out.append('<h2>%s</h2>' % md_inline(stripped[3:].strip()))
            i += 1
            continue
        if stripped.startswith('### '):
            out.append('<h3>%s</h3>' % md_inline(stripped[4:].strip()))
            i += 1
            continue
        if re.match(r'^[-*] ', stripped):  # 列表
            items = []
            while i < n and re.match(r'^[-*] ', lines[i].strip()):
                items.append('<li>%s</li>' % md_inline(lines[i].strip()[2:].strip()))
                i += 1
            out.append('<ul>' + ''.join(items) + '</ul>')
            continue
        if re.match(r'^\d{4}年\d{1,2}月\d{1,2}日$', stripped):  # 单独日期行：跳过
            i += 1
            continue
        # 普通段落（合并连续行）
        para = [stripped]
        i += 1
        while i < n and lines[i].strip() and not re.match(r'^(#|[-*] )', lines[i].strip()) and lines[i].strip() != '---':
            para.append(lines[i].strip())
            i += 1
        out.append('<p>%s</p>' % md_inline(' '.join(para)))
    return '\n'.join(out)

def parse_md(f):
    t = open(os.path.join(MH, f), encoding='utf-8').read()
    lines = t.split('\n')
    date = f[:10]
    # frontmatter
    cover_img = ''
    in_fm = False
    for l in lines:
        if l.strip() == '---':
            if not in_fm:
                in_fm = True
                continue
            else:
                break
        if in_fm:
            m = re.match(r'\s*image:\s*(.*)', l)
            if m:
                cover_img = m.group(1).strip()
    # 标题
    title = ''
    for l in lines:
        if l.startswith('# '):
            title = l[2:].strip()
            break
    body_start = 0
    for i, l in enumerate(lines):
        if l.startswith('# '):
            body_start = i
            break
    body_html = md_body_to_html(lines[body_start:])
    # excerpt：正文第一个 <p> 的纯文本（跳过 h2/h3 等）
    m = re.search(r'<p>(.*?)</p>', body_html, re.S)
    excerpt = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else title
    return date, title, cover_img, body_html, excerpt

def convert(f):
    date, title, cover_img, body_html, excerpt = parse_md(f)
    # 封面图拷贝
    img_name = ''
    if cover_img:
        src = os.path.join(MH, cover_img.replace('/', '\\'))
        ext = os.path.splitext(cover_img)[1].lower()
        img_name = 'assets/images/%s-1%s' % (date, ext)
        dst = os.path.join(MMV, 'journals', img_name)
        if os.path.exists(src) and not os.path.exists(dst):
            shutil.copy2(src, dst)
    # 中文日期
    y, m, d = date.split('-')
    h1 = '%d年%d月%d日' % (int(y), int(m), int(d))
    # 媒体 section
    media = ''
    if img_name:
        media = '<div class="journal-media-prose"><figure><img src="./%s" alt="" loading="lazy" decoding="async"></figure></div>' % img_name
    html = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="robots" content="noindex,nofollow,noarchive"><link rel="canonical" href="../index.html#journal/%s">'
            '<title>%s · Journal · Mon Mode de Vie</title><style>html{background:#ece9e1}body{margin:0;visibility:hidden}</style>'
            '<script>location.replace("../index.html#journal/%s")</script></head><body>'
            '<article class="journal-article"><header class="journal-header"><p class="kicker">Journal · %s</p>'
            '<h1><time datetime="%s">%s</time></h1><p class="subtitle">%s</p></header>'
            '<section class="prose journal-original-text" lang="zh-CN" data-journal-lang="zh">%s</section>%s</article></body></html>'
            ) % (date, h1, date, date, date, h1, LOCATION, body_html, media)
    return {'date': date, 'file': '%s.html' % date, 'location': LOCATION,
            'excerpt': excerpt[:120], 'images': [{'file': img_name}] if img_name else []}, html

if __name__ == '__main__':
    import sys
    if '--test' in sys.argv:
        for f in ['2026-05-18 被法语表白的一天，和那些跑不起来的定时任务.md',
                  '2026-06-22 结课大作业一夜冲刺：从MD到PDF的全流程.md']:
            entry, html = convert(f)
            open(os.path.join(MMV, '_mh_test_%s.html' % entry['date']), 'w', encoding='utf-8').write(html)
            print(entry['date'], '| excerpt:', entry['excerpt'][:50])
