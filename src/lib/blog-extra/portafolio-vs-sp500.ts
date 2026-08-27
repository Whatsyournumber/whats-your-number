import type { BlogSection } from "@/lib/blog-posts";

const sections: BlogSection[] = [
  {
    heading: {
      es: "TWR vs TIR: por qué tu bróker y tu Excel no coinciden",
      en: "TWR vs IRR: why your broker and your spreadsheet disagree",
    },
    paragraphs: [
      {
        es: "El error más habitual al comparar tu cartera con el S&P 500 es mezclar dos formas distintas de medir rentabilidad. El TWR (time-weighted return) elimina el efecto de tus aportaciones y retiradas, y es el único método que permite comparar tu gestión contra un índice de forma justa. La TIR o rentabilidad ponderada por dinero (money-weighted return) sí depende de cuándo metiste capital, así que dos inversores con la misma cartera pero distinto calendario de aportaciones obtienen TIR distintas aunque el TWR sea idéntico.",
        en: "The most common mistake when comparing your portfolio to the S&P 500 is mixing up two different ways of measuring return. TWR (time-weighted return) strips out the effect of your contributions and withdrawals, and it is the only method that lets you compare your management against an index fairly. IRR or money-weighted return does depend on when you added capital, so two investors with the same portfolio but different contribution timing get different IRRs even if their TWR is identical.",
      },
      {
        es: "Si aportas cada mes con un plan de inversión periódico, tu TIR reflejará también tu suerte al comprar en caídas o en máximos, algo que no tiene nada que ver con la calidad de tu selección de activos. Para saber si tus decisiones de inversión baten al mercado, calcula el TWR encadenando subperiodos entre cada aportación o retirada: divide la rentabilidad de cada tramo, multiplica los factores (1+r1)x(1+r2)x... y resta uno al resultado final. La mayoría de brókeres y agregadores ya ofrecen este dato, aunque a veces lo etiquetan simplemente como rentabilidad total.",
        en: "If you contribute monthly through a recurring investment plan, your IRR will also reflect your luck buying during dips or peaks, which has nothing to do with the quality of your asset selection. To know whether your investment decisions beat the market, calculate the TWR by chaining sub-periods between each contribution or withdrawal: work out each segment's return, multiply the factors (1+r1)x(1+r2)x... and subtract one from the final result. Most brokers and aggregators already provide this figure, though sometimes they simply label it total return.",
      },
      {
        es: "Una regla práctica: usa TWR para juzgar tu estrategia y comparar contra benchmarks, y reserva la TIR para decisiones de planificación personal, como saber si vas camino de un objetivo de patrimonio concreto teniendo en cuenta cuánto y cuándo has aportado realmente. Confundir ambas métricas lleva a conclusiones erróneas: inversores que creen estar batiendo al índice cuando en realidad solo tuvieron la suerte de aportar más capital justo antes de una subida fuerte.",
        en: "A practical rule: use TWR to judge your strategy and compare against benchmarks, and reserve IRR for personal planning decisions, such as knowing whether you are on track for a specific net worth goal given how much and when you actually contributed. Confusing the two metrics leads to wrong conclusions: investors who believe they are beating the index when in reality they were simply lucky to contribute extra capital right before a strong rally.",
      },
    ],
  },
  {
    heading: {
      es: "Elegir el benchmark correcto: S&P 500, MSCI World o un mix realista",
      en: "Choosing the right benchmark: S&P 500, MSCI World, or a realistic blend",
    },
    paragraphs: [
      {
        es: "Comparar una cartera diversificada globalmente contra el S&P 500 es un error metodológico muy extendido. El S&P 500 son 500 empresas estadounidenses de gran capitalización, concentradas en tecnología y con un peso creciente de un puñado de compañías. Si tu cartera incluye Europa, mercados emergentes, small caps o bonos, medirte solo contra ese índice distorsiona el análisis: en años de dominio de las grandes tecnológicas estadounidenses siempre parecerás rezagado, y en años de rotación hacia value o mercados fuera de EE. UU. parecerás un genio sin serlo.",
        en: "Comparing a globally diversified portfolio against the S&P 500 is a widespread methodological error. The S&P 500 is 500 large-cap US companies, concentrated in technology with a growing weight in a handful of names. If your portfolio includes Europe, emerging markets, small caps or bonds, measuring yourself only against that index skews the analysis: in years dominated by big US tech you will always look like a laggard, and in years of rotation toward value or non-US markets you will look like a genius without being one.",
      },
      {
        es: "El primer paso es replicar la composición real de tu cartera con un benchmark compuesto. Si tienes 70 % renta variable global y 30 % bonos, el punto de comparación honesto es un índice mixto tipo 70/30 con MSCI World o MSCI ACWI (que incluye emergentes) y un índice agregado de bonos, no el S&P 500 en solitario. Existen calculadoras de benchmark compuesto gratuitas que permiten introducir los pesos exactos de cada clase de activo y generar una serie histórica comparable.",
        en: "The first step is to replicate your portfolio's actual composition with a blended benchmark. If you hold 70% global equities and 30% bonds, the honest comparison point is a 70/30 blended index using MSCI World or MSCI ACWI (which includes emerging markets) plus an aggregate bond index, not the S&P 500 on its own. Free blended benchmark calculators let you input the exact weights of each asset class and generate a comparable historical series.",
      },
      {
        es: "Usa el S&P 500 únicamente si tu cartera es mayoritariamente renta variable estadounidense de gran capitalización. Si inviertes en un fondo indexado global tipo MSCI World o FTSE All-World, ese es tu benchmark natural. Y si tu cartera es una mezcla de fondos activos, indexados y posiciones directas, construye un benchmark ponderado por el peso real de cada bloque; de lo contrario cualquier conclusión sobre si bates o no al mercado carece de sentido estadístico.",
        en: "Only use the S&P 500 if your portfolio is mostly large-cap US equities. If you invest in a global index fund like MSCI World or FTSE All-World, that is your natural benchmark. And if your portfolio mixes active funds, index funds and direct positions, build a benchmark weighted by the actual size of each block; otherwise any conclusion about whether you beat the market lacks statistical meaning.",
      },
    ],
  },
  {
    heading: {
      es: "Rentabilidad ajustada al riesgo: volatilidad, máxima caída y ratio de Sharpe explicados sin jerga",
      en: "Risk-adjusted return: volatility, maximum drawdown and the Sharpe ratio explained without jargon",
    },
    paragraphs: [
      {
        es: "Una cartera que gana un 12 % anual con caídas del 40 % no es comparable a otra que gana un 9 % con caídas máximas del 15 %. La rentabilidad bruta sin contexto de riesgo es una foto incompleta. La volatilidad, medida como desviación típica de las rentabilidades mensuales, te dice cuánto se mueve tu cartera de media respecto a su propia tendencia; una cartera 100 % renta variable suele rondar el 15-18 % de volatilidad anual, mientras que una 60/40 se sitúa entre el 8 y el 11 %.",
        en: "A portfolio earning 12% a year with 40% drawdowns is not comparable to one earning 9% with a maximum drawdown of 15%. Raw returns without risk context are an incomplete picture. Volatility, measured as the standard deviation of monthly returns, tells you how much your portfolio typically swings around its own trend; an all-equity portfolio usually sits around 15-18% annual volatility, while a 60/40 mix lands between 8 and 11%.",
      },
      {
        es: "La máxima caída o drawdown máximo mide la peor pérdida desde un máximo histórico hasta el valle posterior, y es la métrica que mejor predice si aguantarás psicológicamente una estrategia. El S&P 500 ha sufrido caídas superiores al 50 % en 2000-2002 y en 2007-2009, y del 34 % en marzo de 2020. Si tu cartera cae menos que el índice en esos episodios pero también sube menos en las recuperaciones, no estás gestionando mal: estás asumiendo menos riesgo, y eso tiene un precio en rentabilidad que debes aceptar conscientemente.",
        en: "Maximum drawdown measures the worst loss from a historical peak to the subsequent trough, and it is the metric that best predicts whether you will psychologically stick with a strategy. The S&P 500 suffered drawdowns above 50% in 2000-2002 and 2007-2009, and 34% in March 2020. If your portfolio falls less than the index during those episodes but also rises less during recoveries, you are not managing badly: you are taking on less risk, and that has a return cost you must accept knowingly.",
      },
      {
        es: "El ratio de Sharpe resume ambas ideas en un solo número: resta la rentabilidad de un activo sin riesgo (letras del Tesoro) a la rentabilidad de tu cartera y divide el resultado entre la volatilidad. Un Sharpe de 1 significa que por cada unidad de riesgo asumido obtienes una unidad de rentabilidad extra sobre el activo libre de riesgo; el S&P 500 histórico ronda un Sharpe de 0,4-0,5 a largo plazo. Si tu cartera tiene un Sharpe superior al del índice aunque su rentabilidad absoluta sea menor, en realidad estás gestionando mejor el binomio rentabilidad-riesgo, no peor.",
        en: "The Sharpe ratio summarises both ideas in a single number: subtract the return of a risk-free asset (Treasury bills) from your portfolio's return and divide the result by volatility. A Sharpe ratio of 1 means that for each unit of risk taken you get one extra unit of return above the risk-free asset; the historical S&P 500 sits around a Sharpe of 0.4-0.5 long term. If your portfolio has a higher Sharpe than the index even with lower absolute returns, you are actually managing the return-risk trade-off better, not worse.",
      },
    ],
  },
  {
    heading: {
      es: "El coste oculto: comisiones, spreads y fiscalidad que erosionan tu ventaja",
      en: "The hidden cost: fees, spreads and taxes that erode your edge",
    },
    paragraphs: [
      {
        es: "Antes de concluir que tu cartera se queda atrás del índice, revisa cuánto te está costando realmente invertir. Un fondo activo con un TER del 1,8 % frente a un indexado del 0,15 % necesita generar 1,65 puntos porcentuales de rentabilidad extra cada año solo para empatar, antes incluso de hablar de habilidad de gestión. A veinte años, esa diferencia de comisión sobre una cartera de 100.000 euros con un 7 % de rentabilidad bruta anual puede suponer más de 90.000 euros menos de patrimonio final.",
        en: "Before concluding your portfolio lags the index, check how much investing is actually costing you. An active fund with a 1.8% TER versus an index fund at 0.15% needs to generate 1.65 extra percentage points of return every year just to break even, before even discussing management skill. Over twenty years, that fee gap on a €100,000 portfolio earning 7% gross annually can mean more than €90,000 less in final wealth.",
      },
      {
        es: "Los spreads de compraventa en ETFs poco líquidos, las comisiones de custodia de algunos brókeres tradicionales y las comisiones de cambio de divisa al comprar productos denominados en dólares son costes silenciosos que no aparecen en el TER pero sí en tu rentabilidad neta real. Revisa también la retención en origen sobre dividendos: un ETF de acumulación domiciliado en Irlanda que replica el S&P 500 sufre una retención convenio del 15 % sobre dividendos estadounidenses, frente al 30 % que pagaría un fondo domiciliado en EE. UU. sin convenio favorable, una diferencia que se traduce directamente en menor rentabilidad compuesta.",
        en: "Bid-ask spreads on illiquid ETFs, custody fees charged by some traditional brokers, and currency conversion fees when buying dollar-denominated products are silent costs that never show up in the TER but do show up in your real net return. Also check withholding tax on dividends: an accumulating ETF domiciled in Ireland tracking the S&P 500 suffers a 15% treaty withholding rate on US dividends, versus the 30% a fund without a favourable treaty domicile would pay, a difference that translates directly into lower compounded returns.",
      },
      {
        es: "En España, el régimen de traspasos entre fondos de inversión (no aplicable a ETFs) permite rotar de un fondo activo caro a uno indexado sin tributar por la plusvalía en ese momento, difiriendo el impuesto hasta el reembolso final. Aprovechar este mecanismo para migrar carteras heredadas de comisiones altas hacia una estructura más barata, sin generar un peaje fiscal inmediato, suele ser más rentable a largo plazo que mantener el fondo caro solo por evitar tributar ahora.",
        en: "In Spain, the fund-switching regime between mutual funds (not applicable to ETFs) allows you to rotate from an expensive active fund into an index fund without paying capital gains tax at that moment, deferring the tax until final redemption. Using this mechanism to migrate legacy high-fee portfolios into a cheaper structure, without triggering an immediate tax hit, is usually more profitable long term than keeping the expensive fund just to avoid taxation now.",
      },
    ],
  },
  {
    heading: {
      es: "El sesgo de divisa: euro contra dólar y cuándo tiene sentido cubrir",
      en: "Currency bias: euro versus dollar and when hedging makes sense",
    },
    paragraphs: [
      {
        es: "Si inviertes desde España en el S&P 500 sin cobertura de divisa, tu rentabilidad final en euros depende tanto del índice como del tipo de cambio EUR/USD. Entre 2014 y 2015 el dólar se apreció más de un 20 % frente al euro, lo que infló artificialmente la rentabilidad en euros de cualquier inversor español en activos estadounidenses; en 2017 ocurrió justo lo contrario, con el dólar depreciándose y restando rentabilidad pese a que el índice subía en su moneda local.",
        en: "If you invest in the S&P 500 from Spain unhedged, your final return in euros depends both on the index and on the EUR/USD exchange rate. Between 2014 and 2015 the dollar appreciated more than 20% against the euro, artificially inflating the euro return for any Spanish investor in US assets; in 2017 the opposite happened, with the dollar depreciating and subtracting from returns even though the index rose in its local currency.",
      },
      {
        es: "Cuando compares tu cartera con el S&P 500, asegúrate de comparar peras con peras: si tu cartera está expuesta a dólares sin cubrir, compara contra el S&P 500 en euros (existen índices y ETFs que ya reflejan esta conversión), no contra el índice en dólares. De lo contrario atribuirás a tu gestión un resultado que en realidad depende del mercado de divisas, algo completamente ajeno a tus decisiones de selección de activos.",
        en: "When comparing your portfolio to the S&P 500, make sure you compare like with like: if your portfolio is exposed to dollars unhedged, compare against the S&P 500 in euros (indices and ETFs already reflecting this conversion exist), not against the index in dollars. Otherwise you will attribute to your management a result that actually depends on the currency market, something entirely unrelated to your asset selection decisions.",
      },
      {
        es: "Cubrir la divisa tiene sentido cuando tu horizonte es corto o cuando la volatilidad cambiaria añade un riesgo que no puedes tolerar, pero conlleva un coste de cobertura de entre 0,1 % y 0,3 % anual y elimina también el efecto diversificador que aporta el dólar en épocas de crisis, cuando suele actuar como refugio y se aprecia frente al euro. Para carteras de largo plazo con horizonte superior a diez años, mantener la exposición a dólar sin cubrir suele compensar, porque el efecto divisa tiende a diluirse con el tiempo y añade una capa extra de diversificación.",
        en: "Hedging currency makes sense when your horizon is short or when exchange-rate volatility adds a risk you cannot tolerate, but it carries a hedging cost of between 0.1% and 0.3% annually and also removes the diversifying effect the dollar provides during crises, when it tends to act as a safe haven and appreciate against the euro. For long-term portfolios with a horizon beyond ten years, keeping unhedged dollar exposure usually pays off, because the currency effect tends to dilute over time and adds an extra layer of diversification.",
      },
    ],
  },
  {
    heading: {
      es: "Rebalancear con reglas, no con emociones",
      en: "Rebalancing with rules, not emotions",
    },
    paragraphs: [
      {
        es: "El rebalanceo consiste en devolver tu cartera a los pesos objetivo originales cuando el mercado los ha desviado, vendiendo lo que ha subido más de la cuenta y comprando lo que se ha quedado rezagado. Existen dos enfoques principales: rebalanceo calendario, revisando la cartera una o dos veces al año en fechas fijas, y rebalanceo por bandas, actuando solo cuando un activo se desvía más de un 5 % o un 20 % relativo de su peso objetivo. Este segundo método evita operar en exceso y reduce comisiones y peajes fiscales innecesarios.",
        en: "Rebalancing means returning your portfolio to its original target weights when the market has drifted them, selling what has risen too much and buying what has lagged. There are two main approaches: calendar rebalancing, reviewing the portfolio once or twice a year on fixed dates, and band rebalancing, acting only when an asset drifts more than 5 percentage points or 20% relative to its target weight. This second method avoids overtrading and reduces unnecessary fees and tax friction.",
      },
      {
        es: "Rebalancear no busca maximizar la rentabilidad puntual, sino mantener el nivel de riesgo que decidiste asumir originalmente. Si tu renta variable pasó del 70 % al 85 % de la cartera tras varios años de subidas, tu perfil de riesgo real ya no es el que diseñaste, aunque tu rentabilidad parezca excelente; el siguiente desplome te afectará mucho más de lo previsto. Rebalancear de forma sistemática es, en la práctica, comprar barato y vender caro sin necesidad de predecir nada, simplemente siguiendo una regla mecánica.",
        en: "Rebalancing does not aim to maximise short-term returns, but to maintain the risk level you originally chose to take on. If your equity allocation drifted from 70% to 85% of the portfolio after several years of gains, your actual risk profile is no longer the one you designed, even though your returns look excellent; the next downturn will hit you much harder than expected. Systematic rebalancing is, in practice, buying low and selling high without needing to predict anything, simply by following a mechanical rule.",
      },
      {
        es: "En cuentas con ventaja fiscal como los planes de pensiones, rebalancea sin restricción porque no hay peaje tributario por operar dentro del producto. En cartera general sujeta a IRPF, prioriza rebalancear con las nuevas aportaciones antes que vendiendo posiciones con plusvalías, y usa los traspasos entre fondos de inversión en España para ajustar pesos sin generar impacto fiscal inmediato. Documenta tu regla de rebalanceo por escrito antes de que llegue la próxima corrección, porque decidir en caliente casi siempre lleva a posponer la venta de lo que sube y a evitar comprar lo que cae, justo lo contrario de lo que funciona.",
        en: "In tax-advantaged accounts like pension plans, rebalance freely because there is no tax friction from trading within the product. In a general portfolio subject to income tax, prioritise rebalancing with new contributions rather than selling positions with gains, and use fund-switching in Spain to adjust weights without triggering an immediate tax impact. Write down your rebalancing rule before the next correction arrives, because deciding in the heat of the moment almost always leads to postponing the sale of winners and avoiding the purchase of losers, exactly the opposite of what works.",
      },
    ],
  },
  {
    heading: {
      es: "Llevas años perdiendo contra el índice: qué hacer antes de rendirte o cambiar de estrategia",
      en: "You have lagged the index for years: what to do before giving up or switching strategy",
    },
    paragraphs: [
      {
        es: "Si al revisar con TWR y un benchmark compuesto correcto sigues confirmando que tu cartera pierde contra el mercado de forma sostenida durante tres años o más, el diagnóstico más probable no es mala suerte puntual sino un problema estructural: exceso de comisiones, concentración excesiva en pocas posiciones, exceso de rotación por operar con frecuencia, o un sesgo hacia activos o sectores que simplemente no han funcionado en ese periodo. Antes de rendirte, separa el análisis por bloques: cuánto ha aportado o restado cada clase de activo, cada fondo y cada decisión táctica de market timing.",
        en: "If after reviewing with TWR and a proper blended benchmark you keep confirming your portfolio has lagged the market persistently for three years or more, the most likely diagnosis is not one-off bad luck but a structural problem: excessive fees, overconcentration in too few positions, excessive turnover from frequent trading, or a bias toward assets or sectors that simply have not worked over that period. Before giving up, break the analysis down by block: how much each asset class, each fund and each tactical market-timing decision has added or subtracted.",
      },
      {
        es: "Un patrón muy común es el llamado behaviour gap: la rentabilidad que obtiene el inversor medio es sistemáticamente inferior a la del fondo en el que invierte, porque entra tras subidas fuertes movido por el entusiasmo y sale tras caídas movido por el miedo. Estudios de Morningstar sobre este fenómeno estiman esa brecha entre 1 y 2 puntos porcentuales anuales de media. Si tu problema es este, la solución no es cambiar de fondo o de índice, sino automatizar aportaciones periódicas y eliminar la posibilidad de decidir en momentos de estrés.",
        en: "A very common pattern is the so-called behaviour gap: the return the average investor achieves is systematically lower than the fund they invest in, because they enter after strong rallies driven by enthusiasm and exit after drops driven by fear. Morningstar studies on this phenomenon estimate that gap at 1 to 2 percentage points annually on average. If this is your problem, the solution is not switching funds or indices, but automating recurring contributions and removing the ability to decide during moments of stress.",
      },
      {
        es: "Si el problema es realmente de selección, la evidencia académica es contundente: menos del 15 % de los fondos activos de renta variable estadounidense bate a su índice de referencia a diez años vista, según los informes SPIVA de S&P Dow Jones Indices que se publican semestralmente. Rendirte a intentar seleccionar ganadores y migrar el núcleo de tu cartera hacia productos indexados de bajo coste no es una derrota, es alinear tu estrategia con la evidencia disponible y liberar tiempo y energía mental para otras decisiones financieras.",
        en: "If the problem is really about selection, the academic evidence is conclusive: fewer than 15% of active US equity funds beat their benchmark index over a ten-year horizon, according to the SPIVA reports published semi-annually by S&P Dow Jones Indices. Giving up on trying to pick winners and migrating your portfolio's core toward low-cost index products is not a defeat, it is aligning your strategy with the available evidence and freeing up time and mental energy for other financial decisions.",
      },
    ],
  },
  {
    heading: {
      es: "Construir una cartera núcleo-satélite disciplinada para dejar de compararte constantemente",
      en: "Building a disciplined core-satellite portfolio to stop constantly comparing yourself",
    },
    paragraphs: [
      {
        es: "El enfoque núcleo-satélite resuelve la tensión entre querer batir al mercado y necesitar una base sólida y predecible. El núcleo, entre el 70 % y el 90 % del patrimonio invertido, se coloca en fondos o ETFs indexados globales de bajo coste que replican benchmarks amplios como MSCI World o MSCI ACWI, garantizando que la mayor parte de tu patrimonio siga de cerca la rentabilidad del mercado con comisiones mínimas. El resto, el satélite, se reserva para convicciones concretas, sectores, acciones individuales o estrategias activas que quieras probar con capital que puedes permitirte perder sin comprometer tu plan financiero.",
        en: "The core-satellite approach resolves the tension between wanting to beat the market and needing a solid, predictable base. The core, between 70% and 90% of invested wealth, sits in low-cost global index funds or ETFs tracking broad benchmarks like MSCI World or MSCI ACWI, ensuring most of your wealth closely tracks market returns at minimal cost. The rest, the satellite, is reserved for specific convictions, sectors, individual stocks or active strategies you want to test with capital you can afford to lose without jeopardising your financial plan.",
      },
      {
        es: "Esta estructura acota el daño potencial de una mala decisión táctica al satélite, mientras el núcleo sigue generando la rentabilidad de mercado de forma fiable. Establece de antemano un límite máximo para el satélite, por ejemplo el 20 % del total, y una regla de revisión anual: si una posición satélite lleva dos años consecutivos por debajo del benchmark que le corresponde, se liquida y el capital vuelve al núcleo, sin excepciones ni justificaciones de última hora sobre por qué esta vez sí va a funcionar.",
        en: "This structure caps the potential damage of a bad tactical decision within the satellite, while the core keeps reliably generating market returns. Set a maximum satellite limit in advance, for example 20% of the total, and an annual review rule: if a satellite position has trailed its corresponding benchmark for two consecutive years, it gets liquidated and the capital returns to the core, no exceptions or last-minute justifications about why this time it will work.",
      },
      {
        es: "Con esta arquitectura, comparar tu cartera contra el S&P 500 o cualquier otro índice deja de ser una fuente de ansiedad mensual y se convierte en una revisión anual sencilla: el núcleo debería moverse en línea con su benchmark compuesto, y solo necesitas evaluar si el satélite, en conjunto, ha justificado el tiempo y el riesgo adicional asumido. Si no lo ha hecho durante varios años seguidos, la decisión racional es reducirlo o eliminarlo, no insistir por orgullo o por la esperanza de que el próximo año sea diferente.",
        en: "With this architecture, comparing your portfolio against the S&P 500 or any other index stops being a source of monthly anxiety and becomes a simple annual review: the core should move in line with its blended benchmark, and you only need to evaluate whether the satellite, as a whole, has justified the extra time and risk taken. If it has not over several consecutive years, the rational decision is to reduce or eliminate it, not to persist out of pride or hope that next year will be different.",
      },
    ],
  },
];

export default sections;
