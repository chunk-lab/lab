# 1ページ用に書かれたCSSを「ある箱の中だけに効く」ように直す（html/body/:root/#app はその箱そのものに）
import re

def scope_css(css, scope):
    """CSS をすべて scope の中だけに効くように直す（html/body/#app はその箱そのものに）"""
    out, i = [], 0
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    def sel(s):
        parts = []
        for x in s.split(','):
            x = x.strip()
            if not x: continue
            if x in ('html', 'body', 'html,body', ':root', '#app'): parts.append(scope); continue
            x = re.sub(r'^(html|body)\s*', '', x).replace('#app', scope)
            parts.append(x if x.startswith(scope) else scope + ' ' + x)
        return ','.join(parts)
    while i < len(css):
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip()
        if head.startswith('@media') or head.startswith('@supports'):
            depth, k = 1, j + 1
            while depth:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            out.append(head + '{' + scope_css(css[j + 1:k - 1], scope) + '}'); i = k; continue
        if head.startswith('@keyframes') or head.startswith('@font-face'):
            depth, k = 1, j + 1
            while depth:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            out.append(css[i:k].strip()); i = k; continue
        k = css.find('}', j)
        out.append(sel(head) + '{' + css[j + 1:k] + '}'); i = k + 1
    return '\n'.join(out)
