import netWorthImg from "@/assets/blog/net-worth.jpg";
import runwayImg from "@/assets/blog/runway.jpg";
import benchmarkImg from "@/assets/blog/benchmark.jpg";
import aiExpensesImg from "@/assets/blog/ai-expenses.jpg";
import freedomImg from "@/assets/blog/freedom-number.jpg";
import reviewImg from "@/assets/blog/review.jpg";

export type BlogSection = {
  heading: { es: string; en: string };
  paragraphs: { es: string; en: string }[];
  bullets?: { es: string; en: string }[];
};

export type BlogPost = {
  slug: string;
  image: string;
  readMinutes: number;
  tag: { es: string; en: string };
  date: { es: string; en: string };
  title: { es: string; en: string };
  excerpt: { es: string; en: string };
  intro: { es: string; en: string };
  sections: BlogSection[];
  takeaway: { es: string; en: string };
};

export const blogPosts: BlogPost[] = [
  {
    slug: "calcular-patrimonio-neto-real",
    image: netWorthImg,
    readMinutes: 6,
    tag: { es: "Patrimonio", en: "Net worth" },
    date: { es: "12 jul 2026", en: "Jul 12, 2026" },
    title: {
      es: "Cómo calcular tu patrimonio neto real (y por qué casi todos lo hacen mal)",
      en: "How to calculate your real net worth (and why almost everyone gets it wrong)",
    },
    excerpt: {
      es: "Activos menos pasivos suena simple, hasta que aparecen las deudas revolventes, los activos ilíquidos y la inflación.",
      en: "Assets minus liabilities sounds simple, until revolving debt, illiquid assets and inflation show up.",
    },
    intro: {
      es: "Tu patrimonio neto es la única cifra que resume tu situación financiera en un solo número. El problema es que la mayoría lo calcula con optimismo: suman lo que creen que vale su casa, olvidan la tarjeta y no descuentan impuestos futuros.",
      en: "Your net worth is the only figure that sums up your finances in a single number. The problem is most people calculate it optimistically: they add what they think their home is worth, forget the credit card, and never discount future taxes.",
    },
    sections: [
      {
        heading: { es: "1. Valora los activos a precio de venta rápida", en: "1. Value assets at quick-sale price" },
        paragraphs: [
          {
            es: "Un inmueble no vale lo que pide el vecino, vale lo que alguien paga hoy menos comisiones, impuestos y meses de mercado. Aplica un descuento de liquidez del 5-10% en inmuebles y del 20-30% en activos difíciles de vender (coches de colección, participaciones en empresas privadas).",
            en: "A property is not worth what your neighbour asks, it is worth what someone pays today minus fees, taxes and months on the market. Apply a liquidity discount of 5-10% on real estate and 20-30% on hard-to-sell assets (collector cars, stakes in private companies).",
          },
        ],
      },
      {
        heading: { es: "2. Suma todos los pasivos, también los invisibles", en: "2. Add every liability, including the invisible ones" },
        paragraphs: [
          {
            es: "Las deudas que más duelen no son la hipoteca sino las revolventes: tarjetas, compras a plazos y líneas de crédito que se renuevan mes a mes. Aquí el interés compuesto trabaja en tu contra a 20-40% anual.",
            en: "The debt that hurts most is not the mortgage but revolving debt: cards, instalment purchases and credit lines that renew every month. Here compounding works against you at 20-40% a year.",
          },
        ],
        bullets: [
          { es: "Saldo real de tarjetas, no el pago mínimo.", en: "Real card balance, not the minimum payment." },
          { es: "Impuestos diferidos sobre plusvalías no realizadas.", en: "Deferred taxes on unrealised gains." },
          { es: "Avales y deudas familiares informales.", en: "Guarantees and informal family debt." },
        ],
      },
      {
        heading: { es: "3. Mide en términos reales, no nominales", en: "3. Measure in real terms, not nominal" },
        paragraphs: [
          {
            es: "Crecer 4% con inflación del 5% es empobrecerse con buena cara. Registra tu patrimonio en la misma moneda cada mes y compáralo contra la inflación de tu país de residencia.",
            en: "Growing 4% with 5% inflation is getting poorer with a smile. Track your net worth in the same currency every month and compare it against the inflation of the country you live in.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Calcula tu patrimonio el mismo día de cada mes, con las mismas reglas. La tendencia importa más que el nivel.",
      en: "Calculate your net worth on the same day each month, with the same rules. The trend matters more than the level.",
    },
  },
  {
    slug: "runway-personal",
    image: runwayImg,
    readMinutes: 5,
    tag: { es: "Cash flow", en: "Cash flow" },
    date: { es: "28 jun 2026", en: "Jun 28, 2026" },
    title: {
      es: "La regla del runway personal: cuántos meses aguantas sin ingresos",
      en: "The personal runway rule: how many months you can last without income",
    },
    excerpt: {
      es: "Una métrica de startups aplicada a tu vida: cómo medirla y cómo llevarla de 3 a 12 meses.",
      en: "A startup metric applied to your life: how to measure it and take it from 3 to 12 months.",
    },
    intro: {
      es: "Las startups viven obsesionadas con el runway: cuántos meses de caja quedan al ritmo actual de quema. Es exactamente la métrica que necesitas para dormir tranquilo.",
      en: "Startups obsess over runway: how many months of cash remain at the current burn rate. It is exactly the metric you need to sleep well.",
    },
    sections: [
      {
        heading: { es: "La fórmula", en: "The formula" },
        paragraphs: [
          {
            es: "Runway = activos líquidos ÷ gasto mensual esencial. Líquido significa efectivo, cuentas remuneradas y fondos monetarios: nada que tarde más de 72 horas en convertirse en dinero disponible.",
            en: "Runway = liquid assets ÷ essential monthly spending. Liquid means cash, savings accounts and money-market funds: nothing that takes more than 72 hours to become spendable money.",
          },
        ],
      },
      {
        heading: { es: "Gasto esencial ≠ gasto actual", en: "Essential spending ≠ current spending" },
        paragraphs: [
          {
            es: "En modo crisis tu gasto baja: desaparecen viajes, restaurantes y suscripciones. Calcula dos runways, uno con tu tren de vida actual y otro en modo austero. La diferencia entre 4 y 9 meses suele ser puro estilo de vida.",
            en: "In crisis mode your spending drops: travel, restaurants and subscriptions disappear. Compute two runways, one at your current lifestyle and one in austere mode. The gap between 4 and 9 months is usually pure lifestyle.",
          },
        ],
      },
      {
        heading: { es: "Cómo pasar de 3 a 12 meses", en: "How to go from 3 to 12 months" },
        paragraphs: [
          {
            es: "No hace falta duplicar el ingreso. Bajar 15% el gasto fijo y automatizar una transferencia el día de cobro suele añadir cinco o seis meses de runway en un año.",
            en: "You do not need to double your income. Cutting fixed costs by 15% and automating a transfer on payday usually adds five or six months of runway within a year.",
          },
        ],
        bullets: [
          { es: "Renegocia los tres gastos fijos más grandes.", en: "Renegotiate your three largest fixed costs." },
          { es: "Automatiza el ahorro el mismo día del salario.", en: "Automate saving on payday itself." },
          { es: "Mantén el colchón en un instrumento remunerado y líquido.", en: "Keep the buffer in a liquid, yield-bearing instrument." },
        ],
      },
    ],
    takeaway: {
      es: "Debajo de 3 meses estás en riesgo; entre 6 y 12 puedes negociar, cambiar de trabajo y decir que no.",
      en: "Below 3 months you are exposed; between 6 and 12 you can negotiate, switch jobs and say no.",
    },
  },
  {
    slug: "portafolio-vs-sp500",
    image: benchmarkImg,
    readMinutes: 7,
    tag: { es: "Inversión", en: "Investing" },
    date: { es: "9 jun 2026", en: "Jun 9, 2026" },
    title: {
      es: "Tu portafolio contra el S&P 500: el benchmark que duele pero enseña",
      en: "Your portfolio vs. the S&P 500: the benchmark that hurts but teaches",
    },
    excerpt: {
      es: "Comparar rendimiento sin engañarte: costo base, dividendos, comisiones y sesgo de supervivencia.",
      en: "Comparing returns without fooling yourself: cost basis, dividends, fees and survivorship bias.",
    },
    intro: {
      es: "Casi todos creen que baten al mercado, porque recuerdan las posiciones ganadoras y olvidan las que vendieron en pérdida. Un benchmark honesto elimina esa amnesia.",
      en: "Almost everyone believes they beat the market, because they remember the winners and forget the positions they sold at a loss. An honest benchmark removes that amnesia.",
    },
    sections: [
      {
        heading: { es: "Usa retorno ponderado por dinero", en: "Use money-weighted return" },
        paragraphs: [
          {
            es: "Si aportas cada mes, el retorno simple miente. Necesitas TIR (tasa interna de retorno) sobre tus flujos reales, y compararla contra la misma serie de aportes invertida en el índice.",
            en: "If you contribute monthly, simple return lies. You need IRR over your actual cash flows, compared with the same contribution schedule invested in the index.",
          },
        ],
      },
      {
        heading: { es: "Cuenta dividendos, comisiones e impuestos", en: "Count dividends, fees and taxes" },
        paragraphs: [
          {
            es: "El índice que ves en las noticias es price return: no incluye dividendos. Compárate contra el total return, y réstate tus comisiones de compraventa, custodia y el impuesto sobre dividendos.",
            en: "The index you see in the news is price return: it excludes dividends. Compare against total return, and subtract your trading fees, custody costs and dividend tax.",
          },
        ],
      },
      {
        heading: { es: "Ajusta por riesgo y por moneda", en: "Adjust for risk and currency" },
        paragraphs: [
          {
            es: "Ganar 12% con 40% de volatilidad no es mejor que ganar 9% con 15%. Y si tu gasto es en euros pero inviertes en dólares, el tipo de cambio puede explicar toda tu 'habilidad'.",
            en: "Earning 12% with 40% volatility is not better than 9% with 15%. And if you spend in euros but invest in dollars, FX may explain all of your 'skill'.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Si tras 3 años no superas al índice ajustado por riesgo, indexa el núcleo y experimenta solo con el 10%.",
      en: "If after 3 years you do not beat the risk-adjusted index, index the core and experiment with just 10%.",
    },
  },
  {
    slug: "clasificacion-automatica-gastos-ia",
    image: aiExpensesImg,
    readMinutes: 6,
    tag: { es: "IA", en: "AI" },
    date: { es: "21 may 2026", en: "May 21, 2026" },
    title: {
      es: "Clasificación automática de gastos: qué puede y qué no puede hacer la IA",
      en: "Automatic expense classification: what AI can and can't do",
    },
    excerpt: {
      es: "Cómo entrenamos reglas híbridas para que un traspaso no se cuente como gasto nunca más.",
      en: "How we trained hybrid rules so a transfer never gets counted as an expense again.",
    },
    intro: {
      es: "Un modelo de lenguaje entiende que 'MERCADONA 4412' es supermercado. Lo que no sabe, sin contexto, es si esa transferencia de 900 € a tu propia cuenta es ahorro, alquiler o un préstamo a un amigo.",
      en: "A language model understands that 'MERCADONA 4412' is groceries. What it cannot know, without context, is whether that €900 transfer to your own account is savings, rent or a loan to a friend.",
    },
    sections: [
      {
        heading: { es: "Reglas primero, IA después", en: "Rules first, AI second" },
        paragraphs: [
          {
            es: "El mejor sistema es híbrido: reglas deterministas para lo que se repite (nómina, hipoteca, traspasos entre cuentas propias) y modelo de lenguaje solo para la cola larga de comercios desconocidos.",
            en: "The best system is hybrid: deterministic rules for what repeats (payroll, mortgage, transfers between your own accounts) and a language model only for the long tail of unknown merchants.",
          },
        ],
      },
      {
        heading: { es: "El error caro: duplicar movimientos", en: "The expensive mistake: double counting" },
        paragraphs: [
          {
            es: "Cuando mueves dinero entre tus cuentas, hay dos apuntes. Si ambos se clasifican como gasto e ingreso normales, tu tasa de ahorro se inventa. Detectar pares por importe, fecha y titularidad resuelve el 90% de los casos.",
            en: "When you move money between your accounts there are two entries. If both are classified as ordinary spending and income, your savings rate becomes fiction. Matching pairs by amount, date and ownership solves 90% of cases.",
          },
        ],
      },
      {
        heading: { es: "Corrige una vez, aprende siempre", en: "Correct once, learn forever" },
        paragraphs: [
          {
            es: "Cada corrección manual debe generar una regla persistente por comercio. Un usuario típico corrige 30-40 movimientos el primer mes y menos de 5 al tercero.",
            en: "Every manual correction should create a persistent per-merchant rule. A typical user fixes 30-40 transactions in month one and fewer than 5 by month three.",
          },
        ],
      },
    ],
    takeaway: {
      es: "La IA acelera la clasificación, pero la precisión llega de las reglas que tú confirmas.",
      en: "AI speeds classification up, but accuracy comes from the rules you confirm.",
    },
  },
  {
    slug: "numero-libertad-financiera",
    image: freedomImg,
    readMinutes: 8,
    tag: { es: "Retiro", en: "Retirement" },
    date: { es: "3 may 2026", en: "May 3, 2026" },
    title: {
      es: "El número de tu libertad financiera, explicado sin humo",
      en: "Your financial freedom number, explained with no fluff",
    },
    excerpt: {
      es: "Tasa de retiro segura, secuencia de rendimientos y por qué tu tasa de ahorro pesa más que tu retorno.",
      en: "Safe withdrawal rate, sequence of returns, and why your savings rate matters more than your return.",
    },
    intro: {
      es: "Tu número es el capital que, invertido, cubre tu gasto anual sin agotarse. La versión rápida: gasto anual × 25. La versión honesta tiene tres matices que cambian el resultado por años.",
      en: "Your number is the capital that, once invested, covers your annual spending without running out. The quick version: annual spending × 25. The honest version has three nuances that shift the result by years.",
    },
    sections: [
      {
        heading: { es: "La tasa de retiro no es una ley física", en: "The withdrawal rate is not a law of physics" },
        paragraphs: [
          {
            es: "El clásico 4% viene de un estudio con datos de EE. UU. y horizontes de 30 años. Si te retiras a los 45 con 50 años por delante, o vives fuera del dólar, entre 3,25% y 3,5% es más prudente.",
            en: "The classic 4% comes from a US study with 30-year horizons. If you retire at 45 with 50 years ahead, or live outside the dollar, 3.25%-3.5% is more prudent.",
          },
        ],
      },
      {
        heading: { es: "Secuencia de rendimientos: el riesgo del primer lustro", en: "Sequence of returns: the first five years' risk" },
        paragraphs: [
          {
            es: "Dos personas con el mismo retorno medio acaban distinto si una sufre un mercado bajista al principio. La defensa: 2-3 años de gasto en activos estables y flexibilidad para recortar 10% el gasto en años malos.",
            en: "Two people with the same average return end up differently if one hits a bear market early. The defence: 2-3 years of spending in stable assets and the flexibility to cut spending 10% in bad years.",
          },
        ],
      },
      {
        heading: { es: "Tu tasa de ahorro manda", en: "Your savings rate rules" },
        paragraphs: [
          {
            es: "Pasar de 10% a 30% de tasa de ahorro recorta más de una década al camino. Pasar de 7% a 8% de rentabilidad recorta un par de años. Controlas mucho más lo primero.",
            en: "Going from a 10% to a 30% savings rate cuts more than a decade off the path. Going from 7% to 8% returns cuts a couple of years. You control the first far more.",
          },
        ],
        bullets: [
          { es: "Define el gasto objetivo antes que el capital objetivo.", en: "Define target spending before target capital." },
          { es: "Revisa el número cada año, no cada titular de prensa.", en: "Review the number yearly, not with every headline." },
          { es: "Incluye salud, impuestos y cambios de país.", en: "Include healthcare, taxes and country changes." },
        ],
      },
    ],
    takeaway: {
      es: "Tu número no es fijo: baja cuando reduces gasto y sube cuando cambias de ciudad o de estilo de vida.",
      en: "Your number is not fixed: it drops when you cut spending and rises when you change city or lifestyle.",
    },
  },
  {
    slug: "revision-financiera-20-minutos",
    image: reviewImg,
    readMinutes: 4,
    tag: { es: "Hábitos", en: "Habits" },
    date: { es: "14 abr 2026", en: "Apr 14, 2026" },
    title: {
      es: "Revisión financiera de 20 minutos al mes",
      en: "A 20-minute monthly financial review",
    },
    excerpt: {
      es: "El ritual mínimo viable para mantener tu norte sin convertirte en contador de tiempo completo.",
      en: "The minimum viable ritual to keep your number without becoming a full-time accountant.",
    },
    intro: {
      es: "La disciplina financiera no se gana en enero con una hoja de cálculo enorme; se gana con 20 minutos al mes, siempre el mismo día.",
      en: "Financial discipline is not won in January with a giant spreadsheet; it is won with 20 minutes a month, always on the same day.",
    },
    sections: [
      {
        heading: { es: "Minutos 1-5: cierra los números", en: "Minutes 1-5: close the numbers" },
        paragraphs: [
          {
            es: "Actualiza saldos, confirma la clasificación de los movimientos dudosos y registra el patrimonio del mes. Sin juicios, solo datos.",
            en: "Update balances, confirm the classification of doubtful transactions and log this month's net worth. No judgement, just data.",
          },
        ],
      },
      {
        heading: { es: "Minutos 6-12: tres métricas", en: "Minutes 6-12: three metrics" },
        paragraphs: [
          {
            es: "Tasa de ahorro, runway y distancia a tu número. Si las tres van en la dirección correcta, el resto es ruido.",
            en: "Savings rate, runway and distance to your number. If all three move the right way, everything else is noise.",
          },
        ],
      },
      {
        heading: { es: "Minutos 13-20: una sola decisión", en: "Minutes 13-20: one single decision" },
        paragraphs: [
          {
            es: "Cancela una suscripción, sube 1% la aportación automática o renegocia un seguro. Una acción al mes son doce mejoras al año.",
            en: "Cancel one subscription, raise the automatic contribution by 1% or renegotiate an insurance policy. One action a month is twelve improvements a year.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Agenda la revisión como una reunión recurrente. Lo que no está en el calendario, no ocurre.",
      en: "Book the review as a recurring meeting. What is not in the calendar does not happen.",
    },
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
