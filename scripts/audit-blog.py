import re, json, sys
s=open('src/lib/blog-posts.ts',encoding='utf-8').read()
def keys(name):
    i=s.index('export const %s: Record'%name); j=s.index('\n};',i)
    return set(re.findall(r'^  "(.+?)":',s[i:j],re.M))
ex,ch,qt=keys('postExtras'),keys('postCharts'),keys('postQuotes')
rows=[]
for m in re.finditer(r'    slug: "(.+?)"',s):
    sl=m.group(1); i=m.start(); j=s.index('\n    takeaway:',i); body=s[i:j]
    imgs=1+len(re.findall(r'^        image: ',body,re.M))+(1 if sl in ex else 0)
    rows.append(dict(slug=sl, secciones=len(re.findall(r'^        heading: \{',body,re.M)),
      toc='toc: true' in body, imagenes=imgs, alt='imageAlt' in body,
      graficas=sl in ch, tabla=sl in ex, quotes=sl in qt,
      caso=('Caso real' in body or 'Real case' in body)))
ok=True
for r in rows:
    fail=[k for k in ('toc','alt','graficas','tabla','quotes','caso') if not r[k]]+(['imagenes<3'] if r['imagenes']<3 else [])
    ok &= not fail
    print(("PASS " if not fail else "FAIL ")+r['slug'].ljust(48)+f"secs={r['secciones']} imgs={r['imagenes']} "+(",".join(fail)))
sys.exit(0 if ok else 1)
