import type { BlogSection } from "@/lib/blog-posts";

const sections: BlogSection[] = [
  {
    heading: {
      es: "La tasa de retiro segura: qué dice la regla del 4 % y dónde falla",
      en: "The safe withdrawal rate: what the 4% rule says and where it fails",
    },
    paragraphs: [
      {
        es: "La regla del 4 % nace del estudio Trinity, que analizó carteras 50/50 o 60/40 en Estados Unidos entre 1926 y 1995 durante horizontes de 30 años. Concluye que retirar el 4 % del capital inicial, ajustado a inflación cada año, sobrevive a casi todos los periodos históricos. Es un punto de partida útil, no una ley física: se calculó con mercado estadounidense, fiscalidad estadounidense y un horizonte de 30 años, tres supuestos que rara vez coinciden con tu caso si eres español y planeas 45 o 50 años de retiro.",
        en: "The 4% rule comes from the Trinity Study, which analyzed 50/50 or 60/40 portfolios in the United States between 1926 and 1995 over 30-year horizons. It concludes that withdrawing 4% of the initial capital, inflation-adjusted each year, survives almost every historical period. It is a useful starting point, not a law of physics: it was calculated with US markets, US taxation and a 30-year horizon, three assumptions that rarely match your case if you are Spanish and planning 45 or 50 years of retirement.",
      },
      {
        es: "Para retiros muy largos, propios de quien deja de trabajar a los 40 o 45 años, la literatura más reciente (Bengen revisado, Kitces, Pfau) recomienda bajar la tasa a un rango de 3,25-3,5 %. La diferencia parece pequeña pero es enorme en capital: pasar de 4 % a 3,25 % implica necesitar un 23 % más de patrimonio para el mismo gasto anual. Si tu gasto anual es de 30.000 €, pasas de necesitar 750.000 € a necesitar 923.000 €. Merece la pena hacer el cálculo con la tasa conservadora antes de anunciar tu fecha de salida.",
        en: "For very long retirements, typical of those who stop working at 40 or 45, more recent literature (revised Bengen, Kitces, Pfau) recommends lowering the rate to a 3.25-3.5% range. The difference looks small but is enormous in capital terms: moving from 4% to 3.25% means needing 23% more capital for the same annual spending. If your annual spending is €30,000, you go from needing €750,000 to needing €923,000. It is worth running the numbers with the conservative rate before announcing your exit date.",
      },
      {
        es: "Las críticas más serias a la regla del 4 % apuntan a tres puntos: valoraciones de partida (un CAPE alto reduce los retornos esperados de la década siguiente), fiscalidad variable entre países y la rigidez del propio retiro fijo. Una alternativa más robusta es el gasto con barandillas: subes el retiro cuando la cartera va bien y lo recortas un 10-15 % en años bajistas, en lugar de mantener una cifra fija revalorizada con inflación pase lo que pase en el mercado.",
        en: "The most serious critiques of the 4% rule point to three issues: starting valuations (a high CAPE reduces the following decade's expected returns), taxation that varies by country, and the rigidity of a fixed withdrawal itself. A more robust alternative is guardrail spending: you raise withdrawals when the portfolio is doing well and cut them 10-15% in down years, instead of keeping a fixed inflation-adjusted figure regardless of what the market is doing.",
      },
    ],
    bullets: [
      { es: "Horizonte de 30 años: tasa clásica del 4 % suele ser suficiente.", en: "30-year horizon: the classic 4% rate is usually enough." },
      { es: "Horizonte de 40-50 años (retiro anticipado): usa 3,25-3,5 %.", en: "40-50 year horizon (early retirement): use 3.25-3.5%." },
      { es: "CAPE alto en el momento de empezar: resta 0,25-0,5 puntos a la tasa.", en: "High CAPE at the start: subtract 0.25-0.5 points from the rate." },
      { es: "Gasto con barandillas: más flexible que una cifra fija revalorizada.", en: "Guardrail spending: more flexible than a fixed inflation-adjusted figure." },
    ],
  },
  {
    heading: {
      es: "Calcula tu baseline real: fijos, variables e inflación oculta",
      en: "Calculate your real baseline: fixed costs, variable costs and hidden inflation",
    },
    paragraphs: [
      {
        es: "Casi nadie calcula bien su baseline porque mezcla gasto actual con gasto necesario. Divide tus partidas en tres bloques: fijos contractuales (vivienda, seguros, suministros, cuotas), variables recurrentes (comida, transporte, ocio habitual) y discrecionales (viajes, caprichos, regalos grandes). El baseline de libertad financiera se construye sobre los dos primeros bloques más un margen del 15-20 % para discrecional moderado, no sobre el gasto de tu mejor año.",
        en: "Almost nobody calculates their baseline correctly because they confuse current spending with necessary spending. Split your line items into three blocks: fixed contractual costs (housing, insurance, utilities, subscriptions), recurring variable costs (food, transport, habitual leisure) and discretionary costs (trips, splurges, big gifts). The financial-freedom baseline is built on the first two blocks plus a 15-20% margin for moderate discretionary spending, not on your best year's spending.",
      },
      {
        es: "Dos partidas destrozan más planes de retiro anticipado que ninguna otra: sanidad privada y educación. La inflación sanitaria en España y en la mayoría de países desarrollados corre por encima del IPC general, entre 1,5 y 2,5 puntos porcentuales al año, porque combina envejecimiento poblacional, nuevas tecnologías médicas y mayor demanda. Si dependes de un seguro privado o vives fuera de tu país de origen sin sanidad pública, proyecta ese gasto con un 6-7 % de crecimiento anual, no con el 2 % del IPC general.",
        en: "Two line items wreck more early-retirement plans than any other: private healthcare and education. Healthcare inflation in Spain and in most developed countries runs above the general CPI, by 1.5 to 2.5 percentage points a year, because it combines an aging population, new medical technology and higher demand. If you depend on private insurance or live abroad without public healthcare, project that expense at 6-7% annual growth, not the 2% of general CPI.",
      },
      {
        es: "Con la educación privada pasa algo parecido: las cuotas de colegios internacionales o universidades suelen subir entre un 4 y un 6 % anual, muy por encima de la inflación general. Si tienes hijos pequeños, no calcules el coste de escolarización con la cuota de hoy multiplicada por los años que quedan; usa una calculadora de valor futuro con esa tasa de crecimiento específica, porque el error acumulado en 15 años puede superar los 40.000-60.000 € por hijo.",
        en: "Private education behaves similarly: international school or university fees typically rise 4-6% a year, well above general inflation. If you have young children, do not calculate schooling costs using today's fee multiplied by the years remaining; use a future-value calculation with that specific growth rate, because the accumulated error over 15 years can exceed €40,000-60,000 per child.",
      },
    ],
    bullets: [
      { es: "Fijos + variables recurrentes + 15-20 % de margen = tu baseline real.", en: "Fixed + recurring variable + 15-20% margin = your real baseline." },
      { es: "Sanidad privada: proyecta a 6-7 % anual, no al IPC general.", en: "Private healthcare: project at 6-7% a year, not general CPI." },
      { es: "Educación privada: proyecta a 4-6 % anual con valor futuro, no lineal.", en: "Private education: project at 4-6% a year with future value, not linearly." },
      { es: "Revisa el baseline cada dos años: cambia con la edad y la familia.", en: "Review the baseline every two years: it changes with age and family." },
    ],
  },
  {
    heading: {
      es: "La escalera de libertad: colchón, libertad de tiempo y libertad total",
      en: "The freedom ladder: cushion, time freedom and full freedom",
    },
    paragraphs: [
      {
        es: "Pensar en la libertad financiera como un interruptor de todo o nada desanima porque el objetivo final parece lejano. Es más útil como una escalera de tres peldaños. El primero es el colchón: 6-12 meses de gasto esencial en liquidez, que elimina el miedo a decisiones cotidianas y te permite negociar en el trabajo o cambiar de empleo sin pánico. Este peldaño no genera libertad de tiempo, pero elimina la ansiedad financiera del día a día, que es el primer freno mental para todo lo demás.",
        en: "Thinking of financial freedom as an all-or-nothing switch is discouraging because the final goal feels distant. It is more useful as a three-step ladder. The first is the cushion: 6-12 months of essential spending in cash, which removes the fear behind everyday decisions and lets you negotiate at work or change jobs without panic. This step does not create time freedom, but it removes the daily financial anxiety that is the first mental brake on everything else.",
      },
      {
        es: "El segundo peldaño es la libertad de tiempo parcial: un patrimonio que cubre entre el 50 y el 100 % de tu baseline con retiros al 3,5 %, de forma que puedas reducir jornada, cambiar a un trabajo peor pagado pero más satisfactorio, o tomarte un año sabático sin desmontar el plan. Suele llegar entre 8 y 15 años después de empezar a ahorrar con una tasa de ahorro del 30-40 %, y es el punto donde más gente decide quedarse porque la calidad de vida mejora mucho más que en el tramo final.",
        en: "The second step is partial time freedom: enough capital to cover 50-100% of your baseline with 3.5% withdrawals, so you can reduce your working hours, switch to a lower-paid but more satisfying job, or take a sabbatical without derailing the plan. It usually arrives 8-15 years after you start saving at a 30-40% savings rate, and it is the point where many people decide to stay because quality of life improves far more than in the final stretch.",
      },
      {
        es: "El tercer peldaño es la libertad total, donde el patrimonio cubre el 100 % del baseline conservador sin ingreso alguno. Es el objetivo tradicional del movimiento FIRE, pero conviene matizarlo: si ya alcanzaste el segundo peldaño y generas algo de ingreso con trabajo parcial o un proyecto propio, tu número real de libertad total baja de forma significativa, porque no necesitas cubrir el cien por cien del gasto solo con la cartera.",
        en: "The third step is full freedom, where capital covers 100% of the conservative baseline with no income at all. This is the traditional FIRE-movement goal, but it is worth qualifying: if you have already reached the second step and generate some income from part-time work or a personal project, your real full-freedom number drops significantly, because you do not need the portfolio to cover 100% of spending on its own.",
      },
    ],
    bullets: [
      { es: "Peldaño 1: colchón de 6-12 meses. Elimina la ansiedad diaria.", en: "Step 1: 6-12 month cushion. Removes daily anxiety." },
      { es: "Peldaño 2: libertad de tiempo parcial. Cubre 50-100 % del baseline.", en: "Step 2: partial time freedom. Covers 50-100% of baseline." },
      { es: "Peldaño 3: libertad total. Cubre el 100 % sin ingreso alguno.", en: "Step 3: full freedom. Covers 100% with no income at all." },
      { es: "Un ingreso parcial en el peldaño 2 reduce mucho el número final.", en: "Partial income at step 2 lowers the final number significantly." },
    ],
  },
  {
    heading: {
      es: "El riesgo de secuencia de rentabilidades y cómo mitigarlo",
      en: "Sequence-of-returns risk and how to mitigate it",
    },
    paragraphs: [
      {
        es: "El riesgo de secuencia describe cómo el orden en que llegan los rendimientos, no solo su promedio, determina si tu cartera sobrevive al retiro. Dos carteras con la misma rentabilidad media anual a 30 años pueden tener destinos opuestos si una sufre una caída fuerte en los primeros cinco años de retiros y la otra la sufre al final. En el primer caso, estás vendiendo activos baratos justo cuando más capital tienes en juego, lo que reduce de forma permanente la base sobre la que se recupera la cartera.",
        en: "Sequence risk describes how the order in which returns arrive, not just their average, determines whether your portfolio survives retirement. Two portfolios with the same 30-year average annual return can have opposite outcomes if one suffers a sharp drop in the first five years of withdrawals and the other suffers it at the end. In the first case, you are selling cheap assets exactly when you have the most capital at stake, permanently shrinking the base from which the portfolio can recover.",
      },
      {
        es: "Este riesgo es máximo en los primeros cinco a siete años tras dejar de trabajar, porque es cuando el patrimonio es mayor en términos absolutos y cualquier retirada pesa más en proporción tras una caída. Se puede mitigar con tres tácticas combinadas: mantener un colchón de 2-3 años de gasto en liquidez o renta fija a corto plazo para no vender renta variable en plena caída, aplicar el gasto con barandillas que baja retiros en años malos, y llegar al retiro con una asignación algo más conservadora los primeros años para luego subir exposición a bolsa si el mercado se ha comportado bien.",
        en: "This risk peaks in the first five to seven years after leaving work, because that is when the portfolio is largest in absolute terms and any withdrawal weighs proportionally more after a drop. It can be mitigated with three combined tactics: keeping a 2-3 year cash or short-term fixed-income cushion so you do not sell equities during a downturn, applying guardrail spending that cuts withdrawals in bad years, and entering retirement with a somewhat more conservative allocation for the first years before raising equity exposure if markets have behaved well.",
      },
      {
        es: "Una cuarta táctica, menos conocida pero eficaz, es el retiro flexible por ingresos alternativos: mantener una fuente de ingreso residual, aunque sea pequeña, durante los primeros años de retiro. Ganar 500-800 € al mes con trabajo parcial o un negocio secundario reduce directamente la cantidad que debes retirar de la cartera en el momento más vulnerable, lo que en la práctica equivale a bajar tu tasa de retiro efectiva sin necesidad de acumular más capital.",
        en: "A fourth, less well-known but effective tactic is flexible withdrawal through alternative income: keeping a residual income source, even a small one, during the first years of retirement. Earning €500-800 a month from part-time work or a side business directly reduces the amount you must withdraw from the portfolio at the most vulnerable moment, which in practice is equivalent to lowering your effective withdrawal rate without needing to accumulate more capital.",
      },
    ],
    bullets: [
      { es: "El riesgo es máximo en los primeros 5-7 años de retiro.", en: "The risk peaks in the first 5-7 years of retirement." },
      { es: "Colchón de 2-3 años en liquidez o renta fija corta.", en: "2-3 year cushion in cash or short-term fixed income." },
      { es: "Gasto con barandillas: recorta retiros en años bajistas.", en: "Guardrail spending: cuts withdrawals in down years." },
      { es: "Un ingreso residual de 500-800 €/mes reduce mucho el riesgo real.", en: "A residual income of €500-800/month significantly lowers the real risk." },
    ],
  },
  {
    heading: {
      es: "Lifestyle creep: por qué subir el estándar de vida retrasa años tu libertad",
      en: "Lifestyle creep: why raising your standard of living delays freedom by years",
    },
    paragraphs: [
      {
        es: "El lifestyle creep es el fenómeno por el que el gasto sube en paralelo al ingreso sin que la persona lo perciba como una decisión consciente: cada ascenso, cada subida salarial, cada bonus se traduce en un coche mejor, una casa más grande o vacaciones más caras, y la tasa de ahorro se queda estancada aunque el sueldo se haya duplicado. El efecto sobre la libertad financiera es doble y muy costoso: necesitas más capital porque tu baseline ha subido, y ahorras el mismo importe absoluto o incluso menos en proporción, así que tardas más años en llegar al mismo peldaño.",
        en: "Lifestyle creep is the phenomenon where spending rises in step with income without the person perceiving it as a conscious decision: every promotion, every raise, every bonus turns into a better car, a bigger house or pricier holidays, and the savings rate stays flat even though salary has doubled. The effect on financial freedom is double and very costly: you need more capital because your baseline has risen, and you save the same absolute amount or even less proportionally, so it takes more years to reach the same rung of the ladder.",
      },
      {
        es: "La matemática es brutal cuando se hace explícita. Subir el baseline anual de 30.000 € a 45.000 € no solo exige un 50 % más de patrimonio objetivo; si además ese aumento de gasto reduce tu tasa de ahorro del 40 al 25 %, los años necesarios para llegar a la libertad casi se duplican, porque estás combinando un objetivo mayor con una velocidad de acumulación menor. Es la razón por la que dos personas con ingresos similares y una diferencia de estilo de vida moderada pueden separarse por 10-15 años en su fecha de libertad financiera.",
        en: "The math is brutal once made explicit. Raising your annual baseline from €30,000 to €45,000 not only requires 50% more target capital; if that spending increase also cuts your savings rate from 40% to 25%, the years needed to reach freedom nearly double, because you are combining a bigger target with a slower accumulation speed. This is why two people with similar incomes and a moderate lifestyle difference can end up 10-15 years apart in their financial-freedom date.",
      },
      {
        es: "La defensa más eficaz contra el lifestyle creep no es la austeridad radical, sino la regla de reparto de cada subida de ingreso: destina automáticamente un 50-70 % de cualquier aumento salarial o bonus al ahorro e inversión antes de que llegue a tu cuenta corriente, y permítete disfrutar el resto sin culpa. Así el estándar de vida sube de forma controlada y la tasa de ahorro mejora con el tiempo en lugar de deteriorarse, que es justo lo contrario de lo que ocurre quien no automatiza esta decisión.",
        en: "The most effective defense against lifestyle creep is not radical austerity but a rule for splitting every income raise: automatically route 50-70% of any salary increase or bonus into savings and investment before it reaches your checking account, and let yourself enjoy the rest guilt-free. That way your standard of living rises in a controlled manner and your savings rate improves over time instead of deteriorating, which is exactly the opposite of what happens to those who never automate this decision.",
      },
    ],
    bullets: [
      { es: "Subir el baseline exige más capital y suele bajar la tasa de ahorro.", en: "Raising the baseline requires more capital and usually lowers the savings rate." },
      { es: "Duplicar el gasto puede casi duplicar los años hasta la libertad.", en: "Doubling spending can nearly double the years until freedom." },
      { es: "Regla de reparto: 50-70 % de cada subida a ahorro, el resto a disfrutar.", en: "Split rule: 50-70% of each raise to savings, the rest to enjoy." },
      { es: "Automatiza el reparto antes de que el dinero llegue a la cuenta corriente.", en: "Automate the split before the money reaches your checking account." },
    ],
  },
  {
    heading: {
      es: "Ingreso alto pero variable: autónomos, comisiones y bonus",
      en: "High but variable income: freelancers, commissions and bonuses",
    },
    paragraphs: [
      {
        es: "Quien vive de comisiones, factura como autónomo o depende de un bonus anual concentrado tiene un problema distinto al del asalariado fijo: el ingreso medio puede ser alto, pero la varianza mes a mes complica cualquier plan de ahorro basado en porcentajes fijos. La solución no es esperar a fin de año para ahorrar lo que sobre, sino fijar el baseline de gasto sobre el peor mes razonable de los últimos dos o tres años, no sobre el mejor ni sobre el promedio, y tratar todo lo que supere ese baseline como excedente a repartir entre impuestos, inversión y colchón.",
        en: "Someone living on commissions, invoicing as a freelancer, or depending on a concentrated annual bonus faces a different problem than a fixed-salary employee: average income can be high, but month-to-month variance complicates any savings plan based on fixed percentages. The solution is not to wait until year-end to save whatever is left over, but to set the spending baseline on the worst reasonable month of the last two or three years, not on the best or the average, and treat everything above that baseline as surplus to split between taxes, investment and cushion.",
      },
      {
        es: "El colchón de liquidez debe ser más amplio que el de un asalariado: entre 9 y 18 meses de baseline en lugar de los 6 habituales, porque los periodos de bache pueden extenderse más de lo previsto en sectores estacionales o dependientes de un único cliente grande. Además, conviene separar en cuentas distintas el dinero reservado para impuestos (IVA, IRPF, cuota de autónomo) del dinero disponible para vivir, porque confundir ambos flujos es la causa más habitual de tensiones de tesorería en autónomos con ingresos altos pero irregulares.",
        en: "The cash cushion should be larger than an employee's: 9 to 18 months of baseline instead of the usual 6, because lean periods can stretch longer than expected in seasonal sectors or those dependent on a single large client. It also helps to keep money reserved for taxes (VAT, income tax, self-employed contributions) in a separate account from money available for living expenses, because mixing both flows is the most common cause of cash-flow stress for freelancers with high but irregular income.",
      },
      {
        es: "Con los bonus concentrados en uno o dos pagos anuales, la trampa habitual es tratarlos como ingreso extraordinario para gastar en algo puntual en lugar de como parte estructural del plan de acumulación. Si el bonus representa una parte relevante de tu ingreso total, decide de antemano, antes de recibirlo, qué porcentaje va a inversión, qué porcentaje a colchón y qué porcentaje a disfrute; tomar esa decisión con la cifra ya en la cuenta corriente casi siempre inclina la balanza hacia el gasto.",
        en: "With bonuses concentrated in one or two annual payments, the usual trap is treating them as extraordinary income to spend on something one-off rather than as a structural part of the accumulation plan. If the bonus represents a meaningful share of your total income, decide in advance, before receiving it, what percentage goes to investment, what percentage to the cushion and what percentage to enjoyment; making that decision once the figure is already sitting in your checking account almost always tips the balance toward spending.",
      },
    ],
    bullets: [
      { es: "Fija el baseline sobre el peor mes razonable, no sobre el promedio.", en: "Set the baseline on the worst reasonable month, not the average." },
      { es: "Colchón de 9-18 meses para ingresos variables o estacionales.", en: "9-18 month cushion for variable or seasonal income." },
      { es: "Separa en cuentas distintas el dinero de impuestos y el de vivir.", en: "Keep tax money and living money in separate accounts." },
      { es: "Decide el reparto del bonus antes de recibirlo, no después.", en: "Decide how to split the bonus before receiving it, not after." },
    ],
  },
  {
    heading: {
      es: "Errores fiscales que destruyen patrimonio sin que lo notes",
      en: "Tax mistakes that quietly destroy net worth",
    },
    paragraphs: [
      {
        es: "El error fiscal más extendido entre quienes acumulan patrimonio es rotar carteras sin necesidad, vendiendo posiciones ganadoras para comprar otras similares y generando plusvalías gravables que un enfoque de comprar y mantener habría diferido durante años. En España, cada venta con ganancia tributa entre el 19 % y el 28 % en la base del ahorro, y ese dinero que sale hacia Hacienda deja de componer. Diferir la venta el mayor tiempo posible, salvo que haya una razón de asignación de activos, suele valer más que intentar acertar el mejor fondo del año.",
        en: "The most widespread tax mistake among people building wealth is rotating portfolios unnecessarily, selling winning positions to buy similar ones and triggering taxable gains that a buy-and-hold approach would have deferred for years. In Spain, each profitable sale is taxed between 19% and 28% on the savings tax base, and that money leaving for the tax authority stops compounding. Deferring the sale as long as possible, unless there is a genuine asset-allocation reason, is usually worth more than trying to pick the best fund of the year.",
      },
      {
        es: "El segundo error es no aprovechar los vehículos con ventaja fiscal disponibles: planes de pensiones y planes de empleo con aportación de la empresa, fondos de inversión con traspaso sin peaje fiscal frente a acciones directas, o SICAV y ETF domiciliados de forma poco eficiente para tu residencia fiscal. Cambiar de fondo de inversión en España no genera tributación inmediata gracias al régimen de traspasos, una ventaja que sí tiene coste de oportunidad si en vez de fondos usas ETF o acciones directas y vendes con frecuencia.",
        en: "The second mistake is not using the tax-advantaged vehicles available: pension plans and employer-matched schemes, mutual funds with tax-free switching versus direct stocks, or SICAVs and ETFs domiciled inefficiently for your tax residency. Switching mutual funds in Spain does not trigger immediate taxation thanks to the transfer regime, an advantage that carries a real opportunity cost if you use ETFs or direct stocks instead and sell frequently.",
      },
      {
        es: "El tercer error, más silencioso, es ignorar la fiscalidad de la sucesión y donación hasta que ya es tarde para planificarla. El Impuesto de Sucesiones y Donaciones varía de forma drástica entre comunidades autónomas, y patrimonios grandes sin planificación pueden perder entre un 10 % y un 30 % en la transmisión a herederos, mientras que estructuras simples como donaciones escalonadas en vida o el traslado de residencia fiscal con antelación suficiente pueden reducir ese coste de forma legal y sustancial.",
        en: "The third, quieter mistake is ignoring inheritance and gift taxation until it is too late to plan for it. Spain's inheritance and gift tax varies drastically between regions, and large unplanned estates can lose between 10% and 30% when transferred to heirs, while simple structures such as staggered lifetime gifts or relocating tax residency with enough lead time can legally and substantially reduce that cost.",
      },
      {
        es: "El cuarto error es olvidar la doble imposición internacional cuando se invierte en activos extranjeros o se cambia de país de residencia. Dividendos de acciones estadounidenses sujetos a retención en origen, cuentas en el extranjero no declaradas con el modelo correspondiente, o un cambio de residencia fiscal mal ejecutado pueden generar sanciones o una factura fiscal muy superior a la esperada. Revisar la fiscalidad internacional con un asesor especializado antes de mover activos grandes entre países es una de las inversiones con mejor retorno que existen.",
        en: "The fourth mistake is forgetting international double taxation when investing in foreign assets or changing country of residence. Dividends from US stocks subject to withholding at source, undeclared foreign accounts missing the required disclosure forms, or a poorly executed change of tax residency can trigger penalties or a tax bill far higher than expected. Reviewing international taxation with a specialized advisor before moving large assets between countries is one of the best-returning investments there is.",
      },
    ],
    bullets: [
      { es: "Evita rotar carteras sin necesidad: diferir ganancias compone más.", en: "Avoid unnecessary portfolio rotation: deferring gains compounds more." },
      { es: "Usa el régimen de traspasos de fondos frente a vender acciones sueltas.", en: "Use the fund-transfer regime instead of selling individual stocks." },
      { es: "Planifica sucesión y donación en vida, no cuando ya es tarde.", en: "Plan inheritance and lifetime gifts early, not when it's too late." },
      { es: "Revisa doble imposición internacional antes de mover activos grandes.", en: "Review international double taxation before moving large assets." },
    ],
  },
];

export default sections;
