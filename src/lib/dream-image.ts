// Maps a wish/dream title to a photo keyword and a stable photo URL.
// Falls back to a generated graphic when no photo can be loaded.

const KEYWORDS: Array<[RegExp, string]> = [
  [/bici|bike|bicicl/i, "bicycle"],
  [/patin|skate|monopat/i, "skateboard"],
  [/tel[eé]fono|phone|celular|iphone|m[oó]vil/i, "smartphone"],
  [/tablet|ipad/i, "tablet"],
  [/computad|laptop|ordenador|pc/i, "laptop"],
  [/consola|nintendo|playstation|xbox|switch|videojuego|game/i, "videogame,console"],
  [/lego|bloques/i, "lego"],
  [/libro|book/i, "books"],
  [/guitarra|guitar|m[uú]sica|piano/i, "guitar"],
  [/bal[oó]n|f[uú]tbol|soccer|football/i, "soccer,ball"],
  [/basket|baloncesto/i, "basketball"],
  [/tenis|tennis/i, "tennis"],
  [/nataci[oó]n|swim|piscina/i, "swimming"],
  [/perro|dog|mascota|pet/i, "puppy"],
  [/gato|cat/i, "kitten"],
  [/viaje|travel|avi[oó]n|trip|vacacion/i, "travel,airplane"],
  [/disney|parque/i, "themepark"],
  [/playa|beach|mar/i, "beach"],
  [/c[aá]mara|camera|foto/i, "camera"],
  [/audifon|auricular|headphone|airpod/i, "headphones"],
  [/zapat|sneaker|tenis nike|shoes/i, "sneakers"],
  [/ropa|clothes|camiseta/i, "clothes"],
  [/carro|coche|car|auto/i, "car"],
  [/univers|college|estudio|school|escuela/i, "university,campus"],
  [/telescop|espacio|space|cohete/i, "space"],
  [/arte|pintura|paint|draw|dibujo/i, "art,paint"],
  [/dron|drone/i, "drone"],
  [/reloj|watch/i, "watch"],
];

export function dreamKeyword(title: string): string {
  for (const [re, kw] of KEYWORDS) if (re.test(title)) return kw;
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(",");
  return slug || "gift";
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 99991;
  return h;
}

export function dreamPhotoUrl(title: string, size = 480): string {
  const kw = encodeURIComponent(dreamKeyword(title));
  return `https://loremflickr.com/${size}/${size}/${kw}?lock=${hash(title)}`;
}
