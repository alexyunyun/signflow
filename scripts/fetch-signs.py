#!/usr/bin/env python3
"""从便民查询网手语词典抓取词汇描述与图解图片(数据管道第一步,已抓取完成留档)。

用法:python3 scripts/fetch-signs.py
前置:data-src/vocab-meta.tsv(词|分类|钩子)与 data-src/pinyin.json(python 生成)
输出:data-src/signs-raw.tsv 与 public/signs/*.png
新增词汇后运行本脚本补抓,再执行 npm run vocab 重建 vocab.json。
"""
import re, html, gzip, urllib.request, urllib.parse, time, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(f'{BASE}/public/signs', exist_ok=True)

pinyin = {}
import json
for w, v in json.load(open(f'{BASE}/data-src/pinyin.json', encoding='utf-8')).items():
    pinyin[w] = v['id']

def norm(d):
    if d[:2] == b'\x1f\x8b':
        try: d = gzip.decompress(d)
        except Exception: return b''
    return d

def GOOD(d):
    return d[:4] == b'\x89PNG' or d[:3] == b'\xff\xd8' or (d[:4] == b'RIFF' and d[8:12] == b'WEBP')

def clean(d):
    d = d.replace('<br />', ' ').replace('<br>', ' ')
    d = re.sub(r'<[^>]+>', '', d)
    d = html.unescape(d).strip()
    d = re.sub(r'（?图[一二三四五六\d]+）?', '', d)
    return d.strip(' ；;')

mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
import sys
raw = open(f'{BASE}/data-src/signs-raw.tsv', 'a', encoding='utf-8')
meta = [l.rstrip('\n') for l in open(f'{BASE}/data-src/vocab-meta.tsv', encoding='utf-8') if l.strip()]
have = set()
if os.path.exists(f'{BASE}/data-src/signs-raw.tsv') and mode == 'missing':
    have = {l.split('\t')[1] for l in open(f'{BASE}/data-src/signs-raw.tsv', encoding='utf-8')}

for line in meta:
    w = line.split('|')[0].strip()
    if not w or w in have: continue
    ident = pinyin.get(w)
    if not ident: print('缺拼音,先更新 pinyin.json:', w); continue
    url = f'https://shouyu.bmcx.com/{urllib.parse.quote(w)}__shouyus/'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        t = urllib.request.urlopen(req, timeout=12).read().decode('utf-8', 'ignore')
    except Exception as e:
        print('FETCH FAIL', w, e); continue
    rows = re.findall(r'<strong>(.*?)</strong></td><td bgcolor="#FFFFFF">(.*?)</td>.*?<img src="(//d\.bmcx\.com[^"]+)"', t, re.S)
    descs, imgs = [], []
    for word, d, img in rows:
        d = clean(d)
        if not d or '暂无该词手语' in d: d = ''
        descs.append(d); imgs.append('https:' + img)
    if len(w) > 1:
        seen = []
        for d in descs:
            if d and d not in seen: seen.append(d)
        desc = '；'.join(seen)
    else:
        desc = max(descs, key=len) if descs else ''
    raw.write(f'{ident}\t{w}\t{desc}|{"|".join(imgs)}\n'); raw.flush()
    if not desc: print('MISS', w)
    for i, u in enumerate(imgs, 1):
        name = f'{ident}.png' if i == 1 else f'{ident}-{i}.png'
        path = f'{BASE}/public/signs/{name}'
        if os.path.exists(path) and GOOD(open(path,'rb').read(12)): continue
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
            data = norm(urllib.request.urlopen(req, timeout=12).read())
            if GOOD(data): open(path, 'wb').write(data)
            else: print('BAD CONTENT', name)
        except Exception as e:
            print('IMG FAIL', name, e)
    time.sleep(0.3)
raw.close()
print('done')
