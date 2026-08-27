import { blogPosts } from "../src/lib/blog-posts";
import { postWordCount } from "../src/lib/blog-audit";
for (const p of blogPosts) {
  console.log(p.slug.padEnd(50), postWordCount(p, "es"), postWordCount(p, "en"), p.sections.length);
}
