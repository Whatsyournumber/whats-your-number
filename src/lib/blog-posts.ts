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
  /** Bilingual, descriptive alt text for the cover image (SEO + a11y). */
  imageAlt: { es: string; en: string };
  /** Main keyword the article targets. */
  keyword: { es: string; en: string };
  /** Show an in-article table of contents. */
  toc?: boolean;
  readMinutes: number;
  tag: { es: string; en: string };
  date: { es: string; en: string };
  title: { es: string; en: string };
  excerpt: { es: string; en: string };
  intro: { es: string; en: string };
  sections: BlogSection[];
  takeaway: { es: string; en: string };
};

/** Stable anchor id for a section heading (used by the table of contents). */
export function sectionId(heading: string) {
  return heading
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const blogPosts: BlogPost[] = [
  {
    slug: "calcular-patrimonio-neto-real",
    image: netWorthImg,
    imageAlt: {
      es: "Mujer revisando en su portátil una hoja con activos y deudas para calcular su patrimonio neto real",
      en: "Woman reviewing a spreadsheet of assets and debts on her laptop to calculate her real net worth",
    },
    keyword: { es: "calcular patrimonio neto", en: "calculate net worth" },
    toc: true,
    readMinutes: 12,
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
      es: "Calcular tu patrimonio neto es la forma más rápida de resumir tu vida financiera en un solo número: lo que tienes menos lo que debes. El problema es que casi nadie lo calcula bien. La mayoría suma lo que cree que vale su casa, olvida el saldo de la tarjeta, cuenta el coche a precio de catálogo y nunca descuenta los impuestos que pagará al vender. El resultado es una cifra que sube todos los meses aunque la situación real empeore. En esta guía verás cómo calcular tu patrimonio neto con criterios conservadores, cada cuánto revisarlo y qué señales te dice la tendencia.",
      en: "Calculating your net worth is the fastest way to summarise your financial life in a single number: what you own minus what you owe. The problem is that almost nobody does it properly. Most people add what they think their home is worth, forget the credit card balance, price the car at list value and never discount the taxes they will pay on sale. The result is a figure that rises every month even when the real situation deteriorates. This guide shows how to calculate your net worth with conservative rules, how often to review it and what the trend is telling you.",
    },
    sections: [
      {
        heading: { es: "Qué es exactamente el patrimonio neto", en: "What net worth actually is" },
        paragraphs: [
          {
            es: "Patrimonio neto = activos − pasivos. Los activos son todo lo que puedes convertir en dinero: cuentas, inversiones, planes de pensiones, inmuebles, vehículos, participaciones en empresas y préstamos que te deben. Los pasivos son todo lo que debes: hipoteca, préstamos personales, tarjetas, financiación de compras, impuestos pendientes y avales que podrías tener que pagar.",
            en: "Net worth = assets − liabilities. Assets are anything you can turn into money: accounts, investments, pensions, property, vehicles, company stakes and loans owed to you. Liabilities are everything you owe: mortgage, personal loans, cards, purchase financing, pending taxes and guarantees you might have to honour.",
          },
          {
            es: "La diferencia entre un cálculo útil y uno decorativo está en las reglas de valoración. No existe una cifra 'verdadera' de patrimonio neto: existe una cifra consistente. Si aplicas siempre los mismos criterios, la comparación mes a mes te dirá la verdad aunque el nivel absoluto tenga un margen de error del 10%.",
            en: "The difference between a useful calculation and a decorative one is the valuation rules. There is no 'true' net worth figure: there is a consistent one. If you always apply the same criteria, the month-to-month comparison will tell you the truth even if the absolute level has a 10% margin of error.",
          },
        ],
      },
      {
        heading: { es: "1. Valora los activos a precio de venta rápida", en: "1. Value assets at quick-sale price" },
        paragraphs: [
          {
            es: "Un inmueble no vale lo que pide el vecino: vale lo que alguien paga hoy, menos comisión de agencia, impuestos de transmisión y los meses que tarde en venderse. Aplica un descuento de liquidez del 5-10% en vivienda en zonas líquidas y del 15% en zonas con poca demanda.",
            en: "A property is not worth what your neighbour asks: it is worth what someone pays today, minus agency fees, transfer taxes and the months it takes to sell. Apply a liquidity discount of 5-10% for housing in liquid areas and 15% where demand is thin.",
          },
          {
            es: "Con activos difíciles de vender —coches de colección, relojes, obras de arte, participaciones en empresas privadas— el descuento razonable está entre el 20% y el 30%. Y si un activo no tiene mercado ni comprador identificable, la respuesta honesta es contarlo a cero hasta que se venda.",
            en: "For hard-to-sell assets — collector cars, watches, art, stakes in private companies — a reasonable discount is 20-30%. And if an asset has no market and no identifiable buyer, the honest answer is to count it at zero until it sells.",
          },
        ],
        bullets: [
          { es: "Vivienda habitual: valor de tasación menos 8% de costes de venta.", en: "Primary home: appraisal value minus 8% selling costs." },
          { es: "Coche: precio real de mercado de segunda mano, no el de compra.", en: "Car: real second-hand market price, not what you paid." },
          { es: "Empresa propia: solo si hay múltiplo o valoración reciente creíble.", en: "Your own company: only with a credible recent multiple or valuation." },
          { es: "Criptoactivos: al precio de cierre del día de corte, sin promedios.", en: "Crypto: at the closing price of your cut-off date, no averaging." },
        ],
      },
      {
        heading: { es: "2. Suma todos los pasivos, también los invisibles", en: "2. Add every liability, including the invisible ones" },
        paragraphs: [
          {
            es: "La deuda que más patrimonio destruye no es la hipoteca, sino la revolvente: tarjetas, compras a plazos y líneas de crédito que se renuevan cada mes con intereses del 20-40% anual. Ahí el interés compuesto trabaja en tu contra y a una velocidad que ninguna inversión razonable compensa.",
            en: "The debt that destroys the most wealth is not the mortgage but revolving debt: cards, instalment purchases and credit lines renewing monthly at 20-40% a year. There compounding works against you at a speed no reasonable investment can offset.",
          },
          {
            es: "También cuentan los pasivos que no aparecen en ningún extracto: impuestos diferidos sobre plusvalías latentes, una derrama pendiente de la comunidad, la liquidación anual de autónomos o un aval firmado a un familiar. No hace falta ser exhaustivo al céntimo; hace falta no fingir que no existen.",
            en: "Liabilities that show on no statement also count: deferred taxes on unrealised gains, a pending building levy, your annual self-employment settlement or a guarantee signed for a relative. You do not need cent-level precision; you need to stop pretending they do not exist.",
          },
        ],
        bullets: [
          { es: "Saldo real de tarjetas, no el pago mínimo.", en: "Real card balance, not the minimum payment." },
          { es: "Impuestos diferidos sobre plusvalías no realizadas.", en: "Deferred taxes on unrealised gains." },
          { es: "Avales, préstamos familiares y deudas informales.", en: "Guarantees, family loans and informal debt." },
          { es: "Cuotas pendientes de financiación a 0% (siguen siendo deuda).", en: "Pending 0% financing instalments (still debt)." },
        ],
      },
      {
        heading: { es: "3. Separa patrimonio líquido de patrimonio total", en: "3. Split liquid net worth from total net worth" },
        paragraphs: [
          {
            es: "Dos personas con 400.000 € de patrimonio neto pueden vivir realidades opuestas. Si el 95% está en la vivienda habitual, no hay margen de maniobra: cualquier imprevisto se paga con deuda. Si el 60% es líquido, hay libertad para cambiar de trabajo, de ciudad o de vida.",
            en: "Two people with €400,000 net worth can live opposite realities. If 95% sits in the primary home there is no room to manoeuvre: any surprise gets paid with debt. If 60% is liquid, there is freedom to change job, city or life.",
          },
          {
            es: "Por eso conviene registrar dos cifras cada mes: patrimonio total y patrimonio invertible (líquido más inversiones vendibles en menos de una semana). La segunda es la que realmente determina tu independencia financiera.",
            en: "That is why you should log two figures each month: total net worth and investable net worth (cash plus investments sellable within a week). The second is what really drives your financial independence.",
          },
        ],
      },
      {
        heading: { es: "4. Mide en términos reales, no nominales", en: "4. Measure in real terms, not nominal" },
        paragraphs: [
          {
            es: "Crecer un 4% con una inflación del 5% es empobrecerse con buena cara. Registra tu patrimonio en la misma moneda cada mes y compáralo contra la inflación del país donde gastas, no donde inviertes.",
            en: "Growing 4% with 5% inflation is getting poorer with a smile. Track your net worth in the same currency every month and compare it against the inflation of the country where you spend, not where you invest.",
          },
          {
            es: "Si vives entre dos países, elige una moneda base y conviértelo todo a ella con el tipo de cambio del día de corte. Cambiar de moneda base a mitad de año destruye la serie histórica y hace imposible leer la tendencia.",
            en: "If you live between two countries, pick a base currency and convert everything at the cut-off day's exchange rate. Switching base currency mid-year destroys the historical series and makes the trend unreadable.",
          },
        ],
      },
      {
        heading: { es: "5. Errores frecuentes al calcular el patrimonio neto", en: "5. Common mistakes when calculating net worth" },
        paragraphs: [
          {
            es: "El error más común es contar ingresos futuros como activos: el bonus que aún no cobras, las stock options sin vestir o la herencia esperada. Nada de eso es patrimonio hasta que está en tu cuenta y es tuyo sin condiciones.",
            en: "The most common mistake is counting future income as assets: the bonus not yet paid, unvested stock options or an expected inheritance. None of that is net worth until it is in your account and unconditionally yours.",
          },
          {
            es: "El segundo es cambiar de método sin darse cuenta: un mes valoras la casa con el portal inmobiliario, al siguiente con la tasación del banco. Escribe tus reglas una vez y respétalas durante al menos doce meses.",
            en: "The second is silently changing method: one month you value the house with a listings portal, the next with the bank appraisal. Write your rules once and keep them for at least twelve months.",
          },
        ],
        bullets: [
          { es: "Contar el mismo dinero dos veces (ahorro y aportación pendiente).", en: "Counting the same money twice (savings and a pending contribution)." },
          { es: "Ignorar los costes de venta e impuestos de un activo grande.", en: "Ignoring selling costs and taxes on a big asset." },
          { es: "Valorar en la moneda que más te favorece ese mes.", en: "Valuing in whichever currency flatters you that month." },
        ],
      },
      {
        heading: { es: "6. Convierte el número en decisiones", en: "6. Turn the number into decisions" },
        paragraphs: [
          {
            es: "Un patrimonio neto que no cambia tu comportamiento es un dato de museo. Úsalo para responder tres preguntas cada trimestre: ¿cuánto he creado con ahorro y cuánto con mercado?, ¿qué porcentaje es líquido?, ¿a qué distancia estoy de mi número de libertad financiera?",
            en: "A net worth that changes no behaviour is museum data. Use it to answer three questions each quarter: how much came from saving versus the market, what share is liquid, and how far am I from my financial freedom number?",
          },
          {
            es: "Separar crecimiento por ahorro de crecimiento por mercado es especialmente revelador: el primero demuestra disciplina, el segundo solo demuestra exposición. En años buenos casi todo el mundo parece brillante; la tasa de ahorro es lo que se sostiene en años malos.",
            en: "Separating savings-driven growth from market-driven growth is especially revealing: the first proves discipline, the second only proves exposure. In good years everyone looks brilliant; the savings rate is what holds up in bad ones.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Calcula tu patrimonio neto el mismo día de cada mes, con las mismas reglas y en la misma moneda. La tendencia importa mucho más que el nivel.",
      en: "Calculate your net worth on the same day each month, with the same rules and currency. The trend matters far more than the level.",
    },
  },
  {
    slug: "runway-personal",
    image: runwayImg,
    imageAlt: {
      es: "Hombre calculando su runway personal, los meses de gastos cubiertos por su fondo de emergencia",
      en: "Man calculating his personal runway, the months of expenses covered by his emergency fund",
    },
    keyword: { es: "runway personal", en: "personal runway" },
    toc: true,
    readMinutes: 10,
    tag: { es: "Cash flow", en: "Cash flow" },
    date: { es: "28 jun 2026", en: "Jun 28, 2026" },
    title: {
      es: "Runway personal: cuántos meses aguantas sin ingresos (y cómo ampliarlo)",
      en: "Personal runway: how many months you last without income (and how to extend it)",
    },
    excerpt: {
      es: "Una métrica de startups aplicada a tu vida: cómo medir tu runway personal y cómo llevarlo de 3 a 12 meses.",
      en: "A startup metric applied to your life: how to measure your personal runway and take it from 3 to 12 months.",
    },
    intro: {
      es: "Las startups viven obsesionadas con el runway: cuántos meses de caja les quedan al ritmo actual de gasto. Tu runway personal es exactamente lo mismo y es la métrica que mejor predice tu tranquilidad. No mide cuánto ganas ni cuánto tienes invertido: mide cuánto tiempo puedes seguir viviendo si mañana desaparece tu ingreso principal. Y ese tiempo es lo que te permite negociar un salario, rechazar un mal cliente o cambiar de carrera sin pánico.",
      en: "Startups obsess over runway: how many months of cash remain at the current burn rate. Your personal runway is exactly the same and it is the metric that best predicts your peace of mind. It does not measure what you earn or what you have invested: it measures how long you can keep living if your main income disappears tomorrow. That time is what lets you negotiate a salary, turn down a bad client or change careers without panic.",
    },
    sections: [
      {
        heading: { es: "La fórmula del runway personal", en: "The personal runway formula" },
        paragraphs: [
          {
            es: "Runway = activos líquidos ÷ gasto mensual esencial. Líquido significa efectivo, cuentas remuneradas y fondos monetarios: nada que tarde más de 72 horas en convertirse en dinero disponible ni que dependa del precio al que cotice ese día.",
            en: "Runway = liquid assets ÷ essential monthly spending. Liquid means cash, savings accounts and money-market funds: nothing that takes more than 72 hours to become spendable money or depends on that day's market price.",
          },
          {
            es: "Las acciones no cuentan igual. Puedes venderlas, sí, pero probablemente tendrás que hacerlo justo cuando el mercado esté cayendo, porque las crisis personales y las de mercado tienden a coincidir. Si las incluyes, aplícales un recorte del 30%.",
            en: "Stocks do not count the same. You can sell them, yes, but you will probably have to do it exactly when the market is falling, because personal and market crises tend to coincide. If you include them, apply a 30% haircut.",
          },
        ],
      },
      {
        heading: { es: "Gasto esencial ≠ gasto actual", en: "Essential spending ≠ current spending" },
        paragraphs: [
          {
            es: "En modo crisis tu gasto baja de golpe: desaparecen viajes, restaurantes, suscripciones y compras aplazables. Por eso conviene calcular dos runways: uno con tu tren de vida actual y otro en modo austero, con solo vivienda, comida, transporte, salud, seguros y deuda mínima.",
            en: "In crisis mode your spending drops sharply: travel, restaurants, subscriptions and deferrable purchases disappear. So compute two runways: one at your current lifestyle and one in austere mode, with only housing, food, transport, health, insurance and minimum debt payments.",
          },
          {
            es: "La distancia entre ambos números es tu colchón de flexibilidad. Pasar de 4 a 9 meses sin ingresar un euro más suele ser puro estilo de vida recortable, y saberlo por adelantado cambia cómo tomas decisiones bajo presión.",
            en: "The gap between the two numbers is your flexibility buffer. Going from 4 to 9 months without earning an extra euro is usually pure trimmable lifestyle, and knowing that in advance changes how you decide under pressure.",
          },
        ],
      },
      {
        heading: { es: "Cuánto runway necesitas según tu perfil", en: "How much runway you need by profile" },
        paragraphs: [
          {
            es: "No existe un número universal. Un empleado con contrato indefinido, doble ingreso en casa y sector estable puede vivir bien con 4-6 meses. Un autónomo con ingresos irregulares o alguien con un único ingreso y dependientes necesita 9-12.",
            en: "There is no universal number. An employee with a permanent contract, a dual-income household and a stable sector can live well with 4-6 months. A freelancer with irregular income, or a sole earner with dependants, needs 9-12.",
          },
        ],
        bullets: [
          { es: "Empleado, doble ingreso, sector estable: 4-6 meses.", en: "Employee, dual income, stable sector: 4-6 months." },
          { es: "Ingreso único con dependientes: 9-12 meses.", en: "Single income with dependants: 9-12 months." },
          { es: "Autónomo o comisión variable: 12 meses del gasto austero.", en: "Freelance or commission-based: 12 months of austere spending." },
          { es: "Cerca de un cambio de carrera o país: 12-18 meses.", en: "Near a career or country change: 12-18 months." },
        ],
      },
      {
        heading: { es: "Cómo pasar de 3 a 12 meses de runway", en: "How to go from 3 to 12 months of runway" },
        paragraphs: [
          {
            es: "No hace falta duplicar el ingreso. Bajar un 15% el gasto fijo y automatizar una transferencia el día de cobro suele añadir cinco o seis meses de runway en un año, porque actúa por los dos lados: reduces el denominador y aumentas el numerador a la vez.",
            en: "You do not need to double your income. Cutting fixed costs by 15% and automating a transfer on payday usually adds five or six months of runway within a year, because it works on both sides: you shrink the denominator and grow the numerator at once.",
          },
          {
            es: "El orden importa. Empieza por los tres gastos fijos más grandes —vivienda, coche y seguros— porque una sola negociación ahí vale más que veinte cafés menos. Después automatiza, y solo al final optimiza lo variable.",
            en: "Order matters. Start with your three biggest fixed costs — housing, car and insurance — because a single negotiation there beats twenty skipped coffees. Then automate, and only at the end optimise the variable stuff.",
          },
        ],
        bullets: [
          { es: "Renegocia los tres gastos fijos más grandes.", en: "Renegotiate your three largest fixed costs." },
          { es: "Automatiza el ahorro el mismo día del salario.", en: "Automate saving on payday itself." },
          { es: "Mantén el colchón en un instrumento líquido y remunerado.", en: "Keep the buffer in a liquid, yield-bearing instrument." },
          { es: "Cancela deuda revolvente antes de ampliar el colchón.", en: "Kill revolving debt before growing the buffer." },
        ],
      },
      {
        heading: { es: "Dónde guardar el dinero del runway", en: "Where to keep your runway money" },
        paragraphs: [
          {
            es: "El colchón no está para rentar, está para existir el día que hace falta. Aun así, dejarlo en una cuenta al 0% le regala a la inflación un 3-5% anual. El punto medio razonable es una cuenta remunerada o un fondo monetario con liquidez en 24-48 horas.",
            en: "The buffer is not there to earn, it is there to exist the day you need it. Still, leaving it in a 0% account hands inflation 3-5% a year. The reasonable middle ground is a high-yield savings account or a money-market fund with 24-48h liquidity.",
          },
          {
            es: "Guárdalo en una entidad distinta a la de tu cuenta diaria. La fricción de tener que hacer una transferencia entre bancos evita que el colchón se erosione en compras que no eran emergencias.",
            en: "Keep it at a different institution from your everyday account. The friction of an inter-bank transfer stops the buffer eroding into purchases that were never emergencies.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Por debajo de 3 meses estás expuesto; entre 6 y 12 puedes negociar, cambiar de trabajo y decir que no. El runway compra opciones, no solo seguridad.",
      en: "Below 3 months you are exposed; between 6 and 12 you can negotiate, switch jobs and say no. Runway buys options, not just safety.",
    },
  },
  {
    slug: "portafolio-vs-sp500",
    image: benchmarkImg,
    imageAlt: {
      es: "Inversor comparando la rentabilidad de su portafolio con el índice S&P 500 en dos pantallas",
      en: "Investor comparing his portfolio return against the S&P 500 index on two screens",
    },
    keyword: { es: "comparar portafolio con el S&P 500", en: "benchmark portfolio against the S&P 500" },
    toc: true,
    readMinutes: 11,
    tag: { es: "Inversión", en: "Investing" },
    date: { es: "9 jun 2026", en: "Jun 9, 2026" },
    title: {
      es: "Tu portafolio contra el S&P 500: el benchmark que duele pero enseña",
      en: "Your portfolio vs. the S&P 500: the benchmark that hurts but teaches",
    },
    excerpt: {
      es: "Comparar tu rentabilidad con el S&P 500 sin engañarte: TIR, dividendos, comisiones, divisa y riesgo.",
      en: "Comparing your return with the S&P 500 without fooling yourself: IRR, dividends, fees, currency and risk.",
    },
    intro: {
      es: "Casi todo el mundo cree que bate al mercado, porque recuerda las posiciones ganadoras y olvida las que vendió en pérdida. Comparar tu portafolio con el S&P 500 elimina esa amnesia selectiva: es un espejo que no negocia. Pero para que el espejo sea honesto hay que comparar bien, y ahí es donde se cometen casi todos los errores: retorno simple en vez de TIR, índice sin dividendos, comisiones ignoradas y tipo de cambio disfrazado de talento.",
      en: "Almost everyone believes they beat the market, because they remember the winners and forget the positions they sold at a loss. Benchmarking your portfolio against the S&P 500 removes that selective amnesia: it is a mirror that does not negotiate. But for the mirror to be honest you must compare properly, and that is where nearly every mistake happens: simple return instead of IRR, an index without dividends, ignored fees and FX disguised as skill.",
    },
    sections: [
      {
        heading: { es: "Usa retorno ponderado por dinero (TIR)", en: "Use money-weighted return (IRR)" },
        paragraphs: [
          {
            es: "Si aportas cada mes, el retorno simple miente. Necesitas la TIR sobre tus flujos reales de caja y compararla contra la misma serie de aportes invertida en el índice. Solo así sabes si tu selección aportó valor o si simplemente aportaste más dinero en un buen momento.",
            en: "If you contribute monthly, simple return lies. You need IRR over your real cash flows, compared with the same contribution schedule invested in the index. Only then do you know whether your stock picking added value or you simply added money at a good moment.",
          },
          {
            es: "El experimento correcto es un portafolio espejo: cada vez que compraste algo, imagina que ese mismo importe y esa misma fecha fueron a un ETF del S&P 500. Al final, dos TIR comparables. Cualquier otra comparación es una anécdota.",
            en: "The correct experiment is a shadow portfolio: every time you bought something, imagine that same amount on that same date went into an S&P 500 ETF. At the end, two comparable IRRs. Any other comparison is an anecdote.",
          },
        ],
      },
      {
        heading: { es: "Cuenta dividendos, comisiones e impuestos", en: "Count dividends, fees and taxes" },
        paragraphs: [
          {
            es: "El índice que ves en las noticias es price return: no incluye dividendos. Compárate siempre contra el total return, que históricamente añade cerca de dos puntos anuales. Si te comparas contra el índice sin dividendos, ganas por definición y no has aprendido nada.",
            en: "The index you see in the news is price return: it excludes dividends. Always benchmark against total return, historically worth about two extra points a year. Comparing against the ex-dividend index means you win by definition and learn nothing.",
          },
          {
            es: "Después réstate lo tuyo: comisiones de compraventa, custodia, cambio de divisa, spread y el impuesto sobre dividendos. Un 1,5% anual de fricción, sostenido veinte años, se come más de un tercio del capital final.",
            en: "Then subtract your side: trading fees, custody, FX conversion, spread and dividend tax. A 1.5% annual friction, sustained twenty years, eats more than a third of the final capital.",
          },
        ],
        bullets: [
          { es: "Compara siempre contra el S&P 500 Total Return.", en: "Always compare against the S&P 500 Total Return." },
          { es: "Incluye comisiones de custodia y cambio de divisa.", en: "Include custody and FX conversion fees." },
          { es: "Cuenta el impuesto retenido sobre dividendos extranjeros.", en: "Count withholding tax on foreign dividends." },
        ],
      },
      {
        heading: { es: "Ajusta por riesgo y por moneda", en: "Adjust for risk and currency" },
        paragraphs: [
          {
            es: "Ganar un 12% con un 40% de volatilidad no es mejor que ganar un 9% con un 15%. Divide tu exceso de retorno entre la volatilidad asumida y compáralo con el mismo cociente del índice; si tu ventaja desaparece, era apalancamiento emocional, no habilidad.",
            en: "Earning 12% with 40% volatility is not better than 9% with 15%. Divide your excess return by the volatility taken and compare it with the index's own ratio; if your edge vanishes, it was emotional leverage, not skill.",
          },
          {
            es: "Y si gastas en euros pero inviertes en dólares, el tipo de cambio puede explicar todo tu resultado. Calcula la rentabilidad en tu moneda de gasto: es la única que puedes usar para pagar el alquiler.",
            en: "And if you spend in euros but invest in dollars, FX may explain your entire result. Compute the return in your spending currency: it is the only one you can pay rent with.",
          },
        ],
      },
      {
        heading: { es: "El sesgo de supervivencia en tu propio historial", en: "Survivorship bias in your own track record" },
        paragraphs: [
          {
            es: "Tu memoria borra las posiciones que cerraste mal y los brókeres que dejaste atrás. Para un benchmark real necesitas todas las operaciones desde el primer día, incluidas cuentas cerradas, criptos perdidas y aquella empresa que quebró.",
            en: "Your memory deletes the positions you closed badly and the brokers you left behind. A real benchmark needs every trade since day one, including closed accounts, lost crypto and that company that went bankrupt.",
          },
          {
            es: "Exporta el histórico completo de cada bróker una vez al año y guárdalo. Es tedioso, pero es la diferencia entre medir tu rendimiento y contarte una historia.",
            en: "Export each broker's full history once a year and keep it. Tedious, but it is the difference between measuring your performance and telling yourself a story.",
          },
        ],
      },
      {
        heading: { es: "Qué hacer con el resultado", en: "What to do with the result" },
        paragraphs: [
          {
            es: "Si tras tres años completos no superas al índice ajustado por riesgo, la respuesta no es rendirse: es indexar el núcleo del portafolio y dejar un 10% de satélite para experimentar. Mantienes el aprendizaje y eliminas el coste de equivocarte con el 100%.",
            en: "If after three full years you do not beat the risk-adjusted index, the answer is not to give up: index the core of the portfolio and keep a 10% satellite to experiment with. You keep learning and remove the cost of being wrong with 100%.",
          },
          {
            es: "Si sí lo superas, verifica antes de celebrarlo que no fue una sola posición, un solo año o una sola divisa. La habilidad se demuestra en la repetición, no en el mejor trimestre.",
            en: "If you do beat it, verify before celebrating that it was not one position, one year or one currency. Skill shows in repetition, not in your best quarter.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Compara con TIR, contra el total return y en tu moneda de gasto. Si el índice gana tres años seguidos, indexa el núcleo y experimenta con el 10%.",
      en: "Compare with IRR, against total return, in your spending currency. If the index wins three years running, index the core and experiment with 10%.",
    },
  },
  {
    slug: "clasificacion-automatica-gastos-ia",
    image: aiExpensesImg,
    imageAlt: {
      es: "Persona revisando la clasificación automática de gastos con IA sobre el extracto bancario del mes",
      en: "Person reviewing AI-powered automatic expense classification on the month's bank statement",
    },
    keyword: { es: "clasificación automática de gastos con IA", en: "automatic expense classification with AI" },
    readMinutes: 9,
    tag: { es: "IA", en: "AI" },
    date: { es: "21 may 2026", en: "May 21, 2026" },
    title: {
      es: "Clasificación automática de gastos: qué puede y qué no puede hacer la IA",
      en: "Automatic expense classification: what AI can and can't do",
    },
    excerpt: {
      es: "Cómo funcionan las reglas híbridas que evitan que un traspaso entre tus cuentas se cuente como gasto.",
      en: "How hybrid rules stop a transfer between your own accounts from being counted as spending.",
    },
    intro: {
      es: "Un modelo de lenguaje entiende sin esfuerzo que 'MERCADONA 4412' es supermercado y que 'IBERIA BILLETE' es viaje. Lo que no puede saber, sin contexto tuyo, es si esa transferencia de 900 € a tu propia cuenta es ahorro, alquiler pagado a mano o un préstamo a un amigo. Ahí está toda la diferencia entre una app que ordena movimientos y una que te dice la verdad sobre tu tasa de ahorro.",
      en: "A language model effortlessly understands that 'MERCADONA 4412' is groceries and 'IBERIA TICKET' is travel. What it cannot know, without context from you, is whether that €900 transfer to your own account is savings, rent paid by hand or a loan to a friend. That is the whole difference between an app that sorts transactions and one that tells you the truth about your savings rate.",
    },
    sections: [
      {
        heading: { es: "Reglas primero, IA después", en: "Rules first, AI second" },
        paragraphs: [
          {
            es: "El mejor sistema es híbrido: reglas deterministas para lo que se repite —nómina, hipoteca, recibos, traspasos entre cuentas propias— y modelo de lenguaje solo para la cola larga de comercios desconocidos. Las reglas dan estabilidad; la IA da cobertura.",
            en: "The best system is hybrid: deterministic rules for what repeats — payroll, mortgage, direct debits, transfers between your own accounts — and a language model only for the long tail of unknown merchants. Rules give stability; AI gives coverage.",
          },
          {
            es: "Con reglas cubres el 60-70% del volumen con precisión del 100%. La IA resuelve el resto con un 90-95% de acierto, y ese resto es justo donde vive la información interesante: gasto discrecional, viajes, salud y suscripciones.",
            en: "Rules cover 60-70% of volume at 100% accuracy. AI handles the rest at 90-95%, and that rest is exactly where the interesting information lives: discretionary spending, travel, health and subscriptions.",
          },
        ],
      },
      {
        heading: { es: "El error caro: duplicar movimientos", en: "The expensive mistake: double counting" },
        paragraphs: [
          {
            es: "Cuando mueves dinero entre tus cuentas hay dos apuntes. Si ambos se clasifican como gasto e ingreso normales, tu tasa de ahorro se inventa y tu gasto mensual se infla. Detectar pares por importe, fecha cercana y titularidad resuelve el 90% de los casos.",
            en: "When you move money between your accounts there are two entries. If both get classified as ordinary spending and income, your savings rate becomes fiction and your monthly spending inflates. Matching pairs by amount, nearby date and ownership solves 90% of cases.",
          },
          {
            es: "El 10% restante son los casos raros: traspasos parciales, cambios de divisa con comisión, o dinero que sale un mes y entra al siguiente. Ahí hace falta que tú confirmes una vez, y que el sistema recuerde para siempre.",
            en: "The remaining 10% are the odd cases: partial transfers, currency conversions with fees, or money leaving one month and landing the next. There you need to confirm once, and the system must remember forever.",
          },
        ],
      },
      {
        heading: { es: "Gastos de viaje: agrupar sin duplicar", en: "Travel spending: group without duplicating" },
        paragraphs: [
          {
            es: "Un viaje genera vuelos, hotel, restaurantes, taxis y compras repartidos entre categorías distintas. Verlo solo como 'viaje' oculta cuánto gastas comiendo fuera; verlo solo por categoría oculta cuánto cuesta realmente cada viaje.",
            en: "A trip generates flights, hotels, restaurants, taxis and shopping spread across different categories. Seeing it only as 'travel' hides how much you spend eating out; seeing it only by category hides what each trip really costs.",
          },
          {
            es: "La solución es etiquetar por evento sin mover el importe de categoría: cada movimiento sigue en su categoría real, y además pertenece a un viaje con fechas. Así puedes leer los dos ángulos sin contar el dinero dos veces.",
            en: "The fix is to tag by event without moving the amount out of its category: each transaction stays in its real category and also belongs to a dated trip. You can read both angles without counting the money twice.",
          },
        ],
      },
      {
        heading: { es: "Corrige una vez, aprende siempre", en: "Correct once, learn forever" },
        paragraphs: [
          {
            es: "Cada corrección manual debe generar una regla persistente por comercio, no un cambio suelto en ese movimiento. Un usuario típico corrige 30-40 movimientos el primer mes, menos de 10 el segundo y menos de 5 al tercero.",
            en: "Every manual correction should create a persistent per-merchant rule, not a one-off edit. A typical user fixes 30-40 transactions in month one, under 10 in month two and fewer than 5 by month three.",
          },
        ],
        bullets: [
          { es: "Una corrección = una regla por comercio, no un parche.", en: "One correction = one merchant rule, not a patch." },
          { es: "Revisa solo lo que la IA marque con baja confianza.", en: "Review only what the AI flags with low confidence." },
          { es: "Bloquea las categorías críticas (ahorro, deuda) con reglas fijas.", en: "Lock critical categories (savings, debt) with fixed rules." },
        ],
      },
      {
        heading: { es: "Privacidad: qué debería salir de tu dispositivo", en: "Privacy: what should leave your device" },
        paragraphs: [
          {
            es: "Para clasificar no hace falta enviar tu nombre, tu IBAN ni tu saldo. Basta con el concepto del movimiento, el importe y la fecha. Cualquier sistema que necesite más de eso para categorizar está pidiendo datos que no usa.",
            en: "Classifying needs neither your name, your IBAN nor your balance. The transaction description, amount and date are enough. Any system that needs more than that to categorise is asking for data it does not use.",
          },
        ],
      },
    ],
    takeaway: {
      es: "La IA acelera la clasificación de gastos, pero la precisión viene de las reglas que tú confirmas una sola vez.",
      en: "AI speeds expense classification up, but accuracy comes from the rules you confirm once.",
    },
  },
  {
    slug: "numero-libertad-financiera",
    image: freedomImg,
    imageAlt: {
      es: "Pareja calculando su número de libertad financiera y la tasa de retiro segura de su cartera",
      en: "Couple calculating their financial freedom number and the safe withdrawal rate of their portfolio",
    },
    keyword: { es: "número de libertad financiera", en: "financial freedom number" },
    toc: true,
    readMinutes: 13,
    tag: { es: "Retiro", en: "Retirement" },
    date: { es: "3 may 2026", en: "May 3, 2026" },
    title: {
      es: "El número de tu libertad financiera, explicado sin humo",
      en: "Your financial freedom number, explained with no fluff",
    },
    excerpt: {
      es: "Tasa de retiro segura, secuencia de rendimientos y por qué tu tasa de ahorro pesa más que tu rentabilidad.",
      en: "Safe withdrawal rate, sequence of returns and why your savings rate weighs more than your return.",
    },
    intro: {
      es: "Tu número de libertad financiera es el capital que, invertido, cubre tu gasto anual sin agotarse. La versión rápida es conocida: gasto anual × 25. La versión honesta tiene tres matices —tasa de retiro, secuencia de rendimientos e impuestos— que pueden mover tu fecha de independencia varios años en cualquier dirección. Verlos antes de tiempo es lo que separa un plan de un deseo.",
      en: "Your financial freedom number is the capital that, once invested, covers your annual spending without running out. The quick version is famous: annual spending × 25. The honest version has three nuances — withdrawal rate, sequence of returns and taxes — that can move your independence date by several years in either direction. Seeing them early is what separates a plan from a wish.",
    },
    sections: [
      {
        heading: { es: "Empieza por el gasto, no por el capital", en: "Start with spending, not capital" },
        paragraphs: [
          {
            es: "El número no se elige, se deduce. Primero defines el gasto anual de la vida que quieres —incluyendo salud, impuestos, vivienda y los caprichos que no piensas soltar— y solo después calculas el capital necesario. Hacerlo al revés produce cifras redondas y sin sentido como 'un millón'.",
            en: "The number is not chosen, it is derived. First you define the annual spending of the life you want — including health, taxes, housing and the treats you will not drop — and only then compute the capital needed. Doing it backwards produces round, meaningless figures like 'a million'.",
          },
          {
            es: "Un cambio de ciudad puede alterar ese gasto un 40% en cualquier dirección, y con él tu número entero. Por eso conviene calcular al menos dos escenarios: la vida donde estás y la vida donde te gustaría estar.",
            en: "A change of city can shift that spending 40% in either direction, and with it your entire number. So compute at least two scenarios: life where you are and life where you would like to be.",
          },
        ],
      },
      {
        heading: { es: "La tasa de retiro no es una ley física", en: "The withdrawal rate is not a law of physics" },
        paragraphs: [
          {
            es: "El clásico 4% viene de un estudio con datos de EE. UU. y horizontes de 30 años. Si te retiras a los 45 con 50 años por delante, o vives fuera del dólar, entre el 3,25% y el 3,5% es más prudente. Cada cuarto de punto que bajas añade años de capital, pero también años de trabajo.",
            en: "The classic 4% comes from a US study with 30-year horizons. If you retire at 45 with 50 years ahead, or live outside the dollar, 3.25-3.5% is more prudent. Every quarter point you lower adds years of capital, but also years of work.",
          },
          {
            es: "La alternativa a fijar un porcentaje rígido es una regla flexible: retirar entre el 3% y el 4,5% según cómo vaya el mercado, con un tope de recorte del 10% en el gasto discrecional. La flexibilidad vale más que cualquier optimización de cartera.",
            en: "The alternative to a rigid percentage is a flexible rule: withdraw between 3% and 4.5% depending on how markets go, with a 10% cap on discretionary spending cuts. Flexibility is worth more than any portfolio optimisation.",
          },
        ],
      },
      {
        heading: { es: "Secuencia de rendimientos: el riesgo del primer lustro", en: "Sequence of returns: the first five years' risk" },
        paragraphs: [
          {
            es: "Dos personas con el mismo retorno medio acaban en sitios distintos si una sufre un mercado bajista al principio. Vender participaciones baratas para vivir en el año uno deja un agujero que las buenas rachas posteriores no rellenan.",
            en: "Two people with the same average return end up in different places if one hits a bear market early. Selling cheap shares to live on in year one leaves a hole later good runs never fill.",
          },
          {
            es: "La defensa es sencilla: dos o tres años de gasto en activos estables, disposición a recortar un 10% en años malos y, si es posible, algún ingreso pequeño durante los primeros años. No es glamuroso, pero es lo que hace el plan robusto.",
            en: "The defence is simple: two or three years of spending in stable assets, willingness to cut 10% in bad years and, if possible, some small income during the early years. Not glamorous, but it is what makes the plan robust.",
          },
        ],
      },
      {
        heading: { es: "Impuestos y país: el descuento que casi nadie hace", en: "Taxes and country: the discount almost nobody applies" },
        paragraphs: [
          {
            es: "Tu número no se mide en capital bruto, sino en gasto neto disponible. Si retiras 40.000 € y pagas un 19-23% sobre las plusvalías de esa venta, necesitas un capital mayor del que sugiere la regla del 25×.",
            en: "Your number is not measured in gross capital but in net available spending. If you withdraw €40,000 and pay 19-23% on the gains within that sale, you need more capital than the 25× rule suggests.",
          },
          {
            es: "Cambiar de país cambia todo el cálculo: fiscalidad de plusvalías, coste de la sanidad privada, tipo de cambio y estabilidad institucional. Un número que funciona en Lisboa puede quedarse corto en Zúrich y sobrar en Medellín.",
            en: "Changing country changes the whole calculation: capital gains tax, private healthcare cost, exchange rate and institutional stability. A number that works in Lisbon may fall short in Zurich and be generous in Medellín.",
          },
        ],
      },
      {
        heading: { es: "Tu tasa de ahorro manda sobre la rentabilidad", en: "Your savings rate rules over your return" },
        paragraphs: [
          {
            es: "Pasar de un 10% a un 30% de tasa de ahorro recorta más de una década del camino. Pasar de un 7% a un 8% de rentabilidad recorta un par de años. Lo primero depende de ti; lo segundo, de un mercado que no controlas.",
            en: "Going from a 10% to a 30% savings rate cuts more than a decade off the path. Going from 7% to 8% returns cuts a couple of years. The first depends on you; the second on a market you do not control.",
          },
          {
            es: "Y hay un efecto doble que se olvida: cada euro que dejas de gastar de forma permanente sube tu tasa de ahorro y baja tu número al mismo tiempo. Es la única palanca que empuja las dos variables en la dirección correcta.",
            en: "And there is a forgotten double effect: every euro you permanently stop spending raises your savings rate and lowers your number at the same time. It is the only lever that pushes both variables the right way.",
          },
        ],
        bullets: [
          { es: "Define el gasto objetivo antes que el capital objetivo.", en: "Define target spending before target capital." },
          { es: "Revisa el número cada año, no con cada titular.", en: "Review the number yearly, not with every headline." },
          { es: "Incluye salud, impuestos y posibles cambios de país.", en: "Include health, taxes and possible country changes." },
          { es: "Guarda 2-3 años de gasto fuera de renta variable.", en: "Keep 2-3 years of spending outside equities." },
        ],
      },
      {
        heading: { es: "Los hitos antes del número final", en: "The milestones before the final number" },
        paragraphs: [
          {
            es: "La libertad financiera no es un interruptor. Hay hitos intermedios que ya cambian tu vida: cubrir el gasto esencial con rentas, poder trabajar media jornada, o tener capital suficiente para que dejar de aportar siga llevándote a la meta por interés compuesto.",
            en: "Financial freedom is not a switch. There are intermediate milestones that already change your life: covering essential spending with passive income, being able to work part-time, or holding enough capital that stopping contributions still gets you there through compounding.",
          },
          {
            es: "Ese último hito —a veces llamado coast— suele llegar entre 10 y 15 años antes que el número completo, y es el momento en que el estrés financiero baja de verdad.",
            en: "That last milestone — sometimes called coast — usually arrives 10 to 15 years before the full number, and it is when financial stress genuinely drops.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Tu número de libertad financiera no es fijo: baja cuando reduces gasto y sube cuando cambias de ciudad o de estilo de vida. Revísalo una vez al año.",
      en: "Your financial freedom number is not fixed: it drops when you cut spending and rises when you change city or lifestyle. Review it once a year.",
    },
  },
  {
    slug: "revision-financiera-20-minutos",
    image: reviewImg,
    imageAlt: {
      es: "Mujer haciendo su revisión financiera mensual de 20 minutos con café y el móvil en la mano",
      en: "Woman doing her 20-minute monthly financial review with coffee and her phone in hand",
    },
    keyword: { es: "revisión financiera mensual", en: "monthly financial review" },
    readMinutes: 8,
    tag: { es: "Hábitos", en: "Habits" },
    date: { es: "14 abr 2026", en: "Apr 14, 2026" },
    title: {
      es: "Revisión financiera mensual: el ritual de 20 minutos que lo sostiene todo",
      en: "Monthly financial review: the 20-minute ritual that holds everything together",
    },
    excerpt: {
      es: "El ritual mínimo viable para mantener tu número sin convertirte en contador a tiempo completo.",
      en: "The minimum viable ritual to keep your number on track without becoming a full-time accountant.",
    },
    intro: {
      es: "La disciplina financiera no se gana en enero con una hoja de cálculo enorme que abandonas en marzo. Se gana con una revisión financiera mensual de 20 minutos, siempre el mismo día, con la misma estructura y sin dramatismo. Veinte minutos al mes son cuatro horas al año: menos de lo que dedicas a elegir un móvil, y con mucho más impacto sobre tu patrimonio.",
      en: "Financial discipline is not won in January with a giant spreadsheet you abandon by March. It is won with a 20-minute monthly financial review, always on the same day, with the same structure and no drama. Twenty minutes a month is four hours a year: less than you spend choosing a phone, with far more impact on your net worth.",
    },
    sections: [
      {
        heading: { es: "Minutos 1-5: cierra los números", en: "Minutes 1-5: close the numbers" },
        paragraphs: [
          {
            es: "Actualiza saldos, confirma la clasificación de los movimientos dudosos y registra el patrimonio del mes. Sin juicios, solo datos. Esta fase es mecánica a propósito: si empiezas opinando sobre cada gasto, nunca llegas a las métricas.",
            en: "Update balances, confirm the classification of doubtful transactions and log this month's net worth. No judgement, just data. This phase is deliberately mechanical: if you start opining on every expense, you never reach the metrics.",
          },
        ],
      },
      {
        heading: { es: "Minutos 6-12: tres métricas y nada más", en: "Minutes 6-12: three metrics and nothing else" },
        paragraphs: [
          {
            es: "Tasa de ahorro, runway y distancia a tu número. Si las tres van en la dirección correcta, el resto es ruido. Anota el valor de cada una al lado del mes anterior; lo que buscas es dirección, no perfección.",
            en: "Savings rate, runway and distance to your number. If all three move the right way, everything else is noise. Write each value next to last month's; you are looking for direction, not perfection.",
          },
          {
            es: "Añade una cuarta lectura solo si estás en una fase concreta: coste de la deuda si estás amortizando, o rentabilidad frente al índice si estás construyendo cartera. Nunca más de cuatro.",
            en: "Add a fourth reading only if you are in a specific phase: cost of debt while paying it down, or return vs. the index while building a portfolio. Never more than four.",
          },
        ],
      },
      {
        heading: { es: "Minutos 13-20: una sola decisión", en: "Minutes 13-20: one single decision" },
        paragraphs: [
          {
            es: "Cancela una suscripción, sube un 1% la aportación automática, renegocia un seguro o mueve el colchón a una cuenta remunerada. Una acción al mes son doce mejoras al año, y cada una se compone con las anteriores.",
            en: "Cancel one subscription, raise the automatic contribution by 1%, renegotiate an insurance policy or move the buffer to a yield-bearing account. One action a month is twelve improvements a year, each compounding on the last.",
          },
          {
            es: "La restricción de una sola decisión no es pereza: es lo que hace el hábito sostenible. Las revisiones que terminan con siete tareas pendientes se abandonan al tercer mes.",
            en: "The one-decision constraint is not laziness: it is what makes the habit sustainable. Reviews that end with seven pending tasks get abandoned by month three.",
          },
        ],
        bullets: [
          { es: "Una decisión por revisión, ejecutada el mismo día.", en: "One decision per review, executed the same day." },
          { es: "Si no puedes ejecutarla en 5 minutos, agéndala.", en: "If you cannot execute it in 5 minutes, schedule it." },
          { es: "Registra qué decidiste: en diciembre verás doce.", en: "Log what you decided: in December you will see twelve." },
        ],
      },
      {
        heading: { es: "La revisión trimestral y la anual", en: "The quarterly and the annual review" },
        paragraphs: [
          {
            es: "Cada tres meses añade 20 minutos extra para rebalancear la cartera y revisar los gastos fijos. Una vez al año, dedica una hora a lo estructural: número objetivo, seguros, fiscalidad, testamento y objetivos de la familia.",
            en: "Every three months add 20 extra minutes to rebalance the portfolio and review fixed costs. Once a year, spend an hour on the structural stuff: target number, insurance, taxes, will and family goals.",
          },
        ],
      },
      {
        heading: { es: "Qué hacer cuando el mes fue malo", en: "What to do when the month was bad" },
        paragraphs: [
          {
            es: "Habrá meses con tasa de ahorro negativa: una mudanza, una avería, una boda. La respuesta correcta no es saltarse la revisión, es hacerla igual y etiquetar el gasto como extraordinario para que no contamine tu media.",
            en: "There will be months with a negative savings rate: a move, a breakdown, a wedding. The right answer is not to skip the review, but to do it anyway and tag the expense as extraordinary so it does not pollute your average.",
          },
          {
            es: "Los que abandonan no lo hacen por un mal mes: lo hacen por dejar de mirar después de un mal mes. La constancia del registro vale más que la calidad de cualquier decisión individual.",
            en: "People do not quit because of a bad month: they quit by stopping looking after a bad month. Consistency of tracking beats the quality of any individual decision.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Agenda la revisión financiera mensual como una reunión recurrente el mismo día de cada mes. Lo que no está en el calendario, no ocurre.",
      en: "Book the monthly financial review as a recurring meeting on the same day each month. What is not in the calendar does not happen.",
    },
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
