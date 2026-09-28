#!/usr/bin/env python3
"""生成全量拼音映射 data-src/pinyin-full.json。

精选词(vocab-meta.tsv)沿用 pinyin.json 的 id(与已下载图片文件名对应),
新词用 bmcx 词条 id 作标识(w{wid})。
"""
import json, os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from pypinyin import pinyin, Style

old = json.load(open(f'{BASE}/data-src/pinyin.json', encoding='utf-8'))
out = dict(old)
new = 0
for line in open(f'{BASE}/data-src/bmcx-full.tsv', encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) < 4 or p[1] in out: continue
    disp = ' '.join(''.join(x) for x in pinyin(p[1]))
    out[p[1]] = {'pinyin': disp, 'id': f"w{p[0]}"}
    new += 1
json.dump(out, open(f'{BASE}/data-src/pinyin-full.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('pinyin-full:', len(out), '词(新增', new, ')')
