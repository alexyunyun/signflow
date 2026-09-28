#!/usr/bin/env python3
"""全量爬取便民查询网手语词典(bmcx)分类目录。

输出:
- data-src/bmcx-full.tsv : id \t 词 \t bmcx分类 \t 描述 \t 图片URL(|分隔)
- data-src/.crawl-state  : 已爬取的 (分类,页码) 断点
- public/signs/          : 图片下载(独立步骤,--images)

用法:
  python3 scripts/crawl-bmcx.py            # 爬词条(断点续传)
  python3 scripts/crawl-bmcx.py --images   # 下载图片(跳过已存在)
"""
import re, html, gzip, os, sys, time, json, urllib.request, urllib.parse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
SLEEP = 1.1  # 礼貌间隔,避免 429

def norm(d):
    if d[:2] == b'\x1f\x8b':
        try: d = gzip.decompress(d)
        except Exception: return b''
    return d

def GOOD(d):
    return d[:4] == b'\x89PNG' or d[:3] == b'\xff\xd8' or (d[:4] == b'RIFF' and d[8:12] == b'WEBP')

def get(url, binary=False, tries=5):
    for a in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            data = urllib.request.urlopen(req, timeout=20).read()
            data = norm(data)
            if binary:
                return data
            t = data.decode('utf-8', 'ignore')
            if '<html' in t.lower() or len(t) > 500:
                return t
        except Exception as e:
            if '429' in str(e):
                time.sleep(15 * (a + 1))
            else:
                time.sleep(2 * (a + 1))
    return None

def clean(d):
    d = d.replace('<br />', ' ').replace('<br>', ' ')
    d = re.sub(r'<[^>]+>', '', d)
    d = html.unescape(d).strip()
    d = re.sub(r'（?图[一二三四五六\d]+）?', '', d)
    return d.strip(' ；;')

# ---- 分类列表 ----
def get_cats():
    t = get('https://shouyu.bmcx.com/')
    if not t: return []
    cats = []
    for href in re.findall(r'href="(/([^"]+)_\d+__shouyul/)"', t):
        name = urllib.parse.unquote(href[1])
        cats.append((name, href[0]))
    seen, out = set(), []
    for name, path in cats:
        if name not in seen:
            seen.add(name); out.append((name, path))
    return out

# ---- 解析一页词条 ----
WORD_LINK = re.compile(r'href="/(\d+)__shouyud/">')

def parse_entries(t):
    """按词链接切分页面,每段取:词名 / 描述(到第一个</td>) / 紧随其后的图片"""
    out = []
    matches = list(WORD_LINK.finditer(t))
    for i, m in enumerate(matches):
        wid = m.group(1)
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(t)
        seg = t[m.end():seg_end]
        wm = re.search(r'<strong>(.*?)</strong>', seg)
        if not wm: continue
        word = wm.group(1).strip()
        seg = seg[wm.end():]  # 跳过词名本身,避免混入描述
        td = seg.find('</td>')
        desc_raw = seg[:td] if td >= 0 else seg[:600]
        img = ''
        im = re.search(r'<img src="(//d\.bmcx\.com[^"]+)"', desc_raw + seg[td:td + 300])
        if im: img = 'https:' + im.group(1)
        desc = clean(desc_raw)
        if not desc or '暂无该词手语' in desc: desc = ''
        out.append((wid, word, desc, img))
    return out

def crawl_entries():
    tsv = f'{BASE}/data-src/bmcx-full.tsv'
    state_f = f'{BASE}/data-src/.crawl-state'
    done = set()
    if os.path.exists(state_f):
        done = set(open(state_f).read().splitlines())
    state = open(state_f, 'a', encoding='utf-8')
    out = open(tsv, 'a', encoding='utf-8')
    total = 0
    for name, path in get_cats():
        enc = urllib.parse.quote(name)
        # 断点续传:该分类已爬到的最大页码
        done_pages = [int(k.split('|')[1]) for k in done if k.startswith(name + '|')]
        max_done = max(done_pages) if done_pages else 0
        page = 1
        while True:
            key = f'{name}|{page}'
            if key in done:
                page += 1
                if page > max_done + 1: break  # 该分类此前已全部爬完
                continue
            url = f'https://shouyu.bmcx.com/{enc}_{page}__shouyul/'
            t = get(url)
            if not t:
                print('fetch fail', name, page, flush=True); break
            entries = parse_entries(t)
            if not entries:
                break  # 本分类结束
            for wid, word, desc, img in entries:
                out.write(f'{wid}\t{word}\t{name}\t{desc}|{img}\n')
            out.flush()
            state.write(key + '\n'); state.flush()
            total += len(entries)
            print(f'{name} p{page}: {len(entries)} 词 (累计 {total})', flush=True)
            if len(entries) < 20:
                break  # 不足一页,到尾
            page += 1
            time.sleep(SLEEP)
    out.close(); state.close()
    print('crawl done, total', total)

# ---- 图片下载 ----
def dl_images():
    tsv = f'{BASE}/data-src/bmcx-full.tsv'
    # 精选词(第一批)已有以拼音命名的图片,跳过
    curated = set()
    for line in open(f'{BASE}/data-src/vocab-meta.tsv', encoding='utf-8'):
        w = line.split('|')[0].strip()
        if w: curated.add(w)
    n = 0
    for line in open(tsv, encoding='utf-8'):
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 4: continue
        wid, word = parts[0], parts[1]
        if word in curated: continue
        imgs = parts[3].split('|', 1)[1] if '|' in parts[3] else ''
        for i, u in enumerate([x for x in imgs.split('|') if x], 1):
            name = f'w{wid}.png' if i == 1 else f'w{wid}-{i}.png'
            p = f'{BASE}/public/signs/{name}'
            if os.path.exists(p) and GOOD(open(p, 'rb').read(12)): continue
            data = get(u, binary=True)
            if data and GOOD(data):
                open(p, 'wb').write(data); n += 1
            else:
                print('img fail', word, name, flush=True)
            time.sleep(0.7)
    print('images downloaded:', n)

if __name__ == '__main__':
    if '--images' in sys.argv:
        dl_images()
    else:
        crawl_entries()
