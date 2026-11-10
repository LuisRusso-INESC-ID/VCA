#!/usr/bin/env python3
"""Wrap each src/<id>.js into a standalone <id>.html page.

Titles and descriptions are read from the PAGES table in lib/vca.js so the
static HTML carries the right <title> and <meta name="description"> even
before the script runs (useful for search engines and link previews).
"""
import glob
import html
import os
import re

root = os.path.dirname(os.path.abspath(__file__))

TPL = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="lib/vca.css">
<script src="lib/vca.js"></script>
</head>
<body>
<script>
{body}
</script>
</body>
</html>
'''

SITE = 'Visual Complex Analysis'
INDEX_DESC = ('Interactive illustrations following the chapters of Tristan '
              "Needham's Visual Complex Analysis.")


def read_pages():
    src = open(os.path.join(root, 'lib', 'vca.js'), encoding='utf-8').read()
    rows = re.findall(r'\[\s*"([^"]+)",\s*(\d+),\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\s*\]', src)
    return {pid: (title, blurb) for pid, _, title, blurb in rows}


def main():
    pages = read_pages()
    for f in sorted(glob.glob(os.path.join(root, 'src', '*.js'))):
        name = os.path.splitext(os.path.basename(f))[0]
        body = open(f, encoding='utf-8').read()
        if name == 'index':
            title, desc = f'Contents — {SITE}', INDEX_DESC
        else:
            t, desc = pages.get(name, (SITE, INDEX_DESC))
            title = f'{t} — {SITE}'
        out = TPL.format(title=html.escape(title, quote=False),
                         desc=html.escape(desc), body=body)
        with open(os.path.join(root, name + '.html'), 'w', encoding='utf-8') as fh:
            fh.write(out)
        print('built', name)


if __name__ == '__main__':
    main()
