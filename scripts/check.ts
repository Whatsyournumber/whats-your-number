import { blogPosts } from "../src/lib/blog-posts";
for (const p of blogPosts) {
  const bad = (label: string, o: any) => {
    if (!o || typeof o.es !== "string" || typeof o.en !== "string") console.log("BAD", p.slug, label, JSON.stringify(o)?.slice(0,120));
  };
  p.sections.forEach((s, i) => {
    bad(`s${i}.heading`, s.heading);
    (s.paragraphs ?? []).forEach((x, j) => bad(`s${i}.p${j}`, x));
    (s.bullets ?? []).forEach((x, j) => bad(`s${i}.b${j}`, x));
    (s.subsections ?? []).forEach((sub, k) => {
      bad(`s${i}.sub${k}.heading`, sub.heading);
      (sub.paragraphs ?? []).forEach((x, j) => bad(`s${i}.sub${k}.p${j}`, x));
      (sub.bullets ?? []).forEach((x, j) => bad(`s${i}.sub${k}.b${j}`, x));
    });
    if (!s.paragraphs) console.log("NOPARAS", p.slug, i, s.heading?.es);
  });
}
