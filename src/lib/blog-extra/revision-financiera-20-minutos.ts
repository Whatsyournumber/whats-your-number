import type { BlogSection } from "@/lib/blog-posts";

const sections: BlogSection[] = [
  {
    heading: {
      es: "La agenda minuto a minuto, con ejemplos reales",
      en: "The minute-by-minute agenda, with real examples",
    },
    paragraphs: [
      {
        es: "Una revisión sin guion se convierte en media hora de navegar entre pestañas del banco sin llegar a ninguna conclusión. La solución es tratarla como una reunión de trabajo con orden del día fijo: minuto 0 abres la hoja de cálculo o la app, minuto 1 actualizas saldos de cuentas corrientes, minuto 2 actualizas saldos de inversión y fondos, minuto 3 actualizas deudas pendientes. Nada de analizar todavía, solo teclear números.",
        en: "A review without a script turns into half an hour of tab-hopping between bank apps without reaching any conclusion. The fix is to treat it like a work meeting with a fixed agenda: minute 0 you open the spreadsheet or app, minute 1 you update current account balances, minute 2 you update investment and fund balances, minute 3 you update outstanding debts. No analysis yet, just typing numbers.",
      },
      {
        es: "Entre los minutos 4 y 5 revisas los movimientos marcados como dudosos por tu categorización automática: un cargo de 34 euros sin descripción clara, una transferencia recibida que no sabes de dónde viene. Resolver estas dudas ahora evita que se acumulen y distorsionen el dato de gasto real de meses futuros. Si en un mes normal tienes más de cinco movimientos dudosos, tu sistema de categorización necesita ajustes, no tu disciplina.",
        en: "Between minutes 4 and 5 you review transactions flagged as doubtful by your automatic categorisation: a 34-euro charge with no clear description, a transfer received you cannot place. Resolving these now stops them piling up and distorting the real spending figure in future months. If a normal month brings more than five doubtful transactions, your categorisation system needs adjusting, not your discipline.",
      },
      {
        es: "El bloque de los minutos 6 a 12 es el análisis de las métricas fijas, que detallamos en la sección siguiente. Los minutos 13 a 18 son para la decisión única de acción. Los últimos dos minutos, 19 y 20, se reservan para escribir una frase de una línea en tu diario financiero: qué ha pasado este mes y qué esperas del siguiente. Esa frase, releída en diciembre, vale más que cualquier informe automático.",
        en: "The block from minute 6 to 12 is the fixed-metrics analysis, detailed in the next section. Minutes 13 to 18 are for the single action decision. The last two minutes, 19 and 20, are reserved for writing a one-line entry in your financial diary: what happened this month and what you expect from the next. That line, reread in December, is worth more than any automated report.",
      },
    ],
    bullets: [
      { es: "Minutos 0-3: actualizar saldos, sin analizar.", en: "Minutes 0-3: update balances, no analysis." },
      { es: "Minutos 4-5: resolver movimientos dudosos.", en: "Minutes 4-5: resolve doubtful transactions." },
      { es: "Minutos 6-12: cuadro de mando de métricas.", en: "Minutes 6-12: metrics dashboard." },
      { es: "Minutos 13-18: elegir y ejecutar una decisión.", en: "Minutes 13-18: choose and execute one decision." },
      { es: "Minutos 19-20: una línea en el diario financiero.", en: "Minutes 19-20: one line in the financial diary." },
    ],
  },
  {
    heading: {
      es: "El cuadro de mando de seis métricas que sí importan",
      en: "The six-metric dashboard that actually matters",
    },
    paragraphs: [
      {
        es: "Más de seis métricas en una revisión mensual es ruido disfrazado de rigor. El cuadro de mando mínimo cubre tasa de ahorro, runway, distancia porcentual a tu número, patrimonio neto total, coste medio de la deuda si la tienes y rentabilidad acumulada de la cartera frente a un índice de referencia. Con estas seis puedes diagnosticar el 90% de las decisiones financieras de una familia sin necesitar un cuadro de Excel de veinte pestañas.",
        en: "More than six metrics in a monthly review is noise disguised as rigour. The minimum dashboard covers savings rate, runway, percentage distance to your number, total net worth, average cost of debt if you carry any, and accumulated portfolio return against a benchmark index. With these six you can diagnose 90% of a household's financial decisions without needing a twenty-tab spreadsheet.",
      },
      {
        es: "La tasa de ahorro se calcula como ahorro neto dividido entre ingresos netos, y conviene mirarla en media móvil de tres meses porque un mes con una factura del coche o un regalo caro no debe disparar la alarma. El runway, meses de gasto cubiertos por el colchón líquido, es la métrica que más tranquilidad aporta cuando hay incertidumbre laboral: verla subir de 4 a 5 meses en un trimestre es una victoria silenciosa que merece anotarse.",
        en: "Savings rate is net savings divided by net income, and it is worth watching as a three-month moving average because one month with a car repair bill or an expensive gift should not trigger alarm. Runway, months of spending covered by your liquid buffer, is the metric that brings the most peace of mind during job uncertainty: watching it rise from 4 to 5 months in a quarter is a quiet win worth logging.",
      },
      {
        es: "La distancia a tu número, expresada en porcentaje y en años estimados al ritmo actual, es la métrica que da sentido a todas las demás: sin ella, ahorrar es un ejercicio abstracto de virtud; con ella, cada decisión de gasto se traduce directamente en meses que se añaden o se quitan de tu fecha de libertad financiera. Actualízala con la misma fórmula cada mes para que la comparación sea honesta.",
        en: "Distance to your number, expressed as a percentage and as estimated years at your current pace, is the metric that gives meaning to all the others: without it, saving is an abstract exercise in virtue; with it, every spending decision translates directly into months added to or removed from your financial freedom date. Update it with the same formula every month so the comparison stays honest.",
      },
    ],
  },
  {
    heading: {
      es: "La revisión trimestral: rebalanceo, seguros y comisiones",
      en: "The quarterly review: rebalancing, insurance and fees",
    },
    paragraphs: [],
    subsections: [
      {
        heading: { es: "Rebalanceo de cartera sin obsesión", en: "Portfolio rebalancing without obsession" },
        paragraphs: [
          {
            es: "Cada tres meses, y no antes, compara el peso real de cada activo en tu cartera con tu asignación objetivo. Si la renta variable ha subido y ahora pesa un 75% cuando tu objetivo era 65%, vende el exceso o, mejor aún, dirige las nuevas aportaciones hacia renta fija hasta recuperar el equilibrio. Rebalancear con más frecuencia solo añade comisiones y decisiones impulsivas basadas en ruido de mercado de corto plazo.",
            en: "Every three months, and not sooner, compare the actual weight of each asset in your portfolio against your target allocation. If equities have risen and now sit at 75% when your target was 65%, sell the excess or, better, steer new contributions towards fixed income until balance is restored. Rebalancing more often only adds fees and impulsive decisions based on short-term market noise.",
          },
        ],
      },
      {
        heading: { es: "Auditoría de seguros y comisiones", en: "Insurance and fee audit" },
        paragraphs: [
          {
            es: "El trimestre es el momento de revisar si el seguro de hogar, vida o coche sigue siendo competitivo, y de sumar todas las comisiones que pagas: gestión de fondos, mantenimiento de cuentas, custodia de valores. Una comisión de fondo del 1,8% frente a una alternativa indexada del 0,2% resta más de un punto y medio de rentabilidad anual compuesta, una diferencia que en veinte años puede superar el 30% del capital final.",
            en: "The quarter is when you review whether home, life or car insurance is still competitive, and add up every fee you pay: fund management, account maintenance, custody of securities. A fund fee of 1.8% versus an indexed alternative at 0.2% costs more than a point and a half of compounded annual return, a difference that over twenty years can exceed 30% of the final capital.",
          },
          {
            es: "No hace falta cambiar de proveedor cada trimestre: basta con preguntarte si, con la información actual, elegirías el mismo producto hoy. Si la respuesta es no dos trimestres seguidos, es momento de actuar.",
            en: "You do not need to switch providers every quarter: it is enough to ask whether, with today's information, you would choose the same product again. If the answer is no for two quarters running, it is time to act.",
          },
        ],
      },
    ],
  },
  {
    heading: {
      es: "La revisión anual: fiscalidad, testamento y subida de aportaciones",
      en: "The annual review: tax, will and raising contributions",
    },
    paragraphs: [
      {
        es: "Una vez al año, en diciembre o en enero, la revisión se amplía a noventa minutos y cubre lo que no tiene sentido tocar cada mes. Repasa aportaciones a planes de pensiones o vehículos con ventaja fiscal antes de que cierre el ejercicio, calcula si te conviene compensar plusvalías y minusvalías vendiendo posiciones perdedoras, y confirma que tu declaración de la renta del año anterior no dejó deducciones sobre la mesa.",
        en: "Once a year, in December or January, the review expands to ninety minutes and covers what makes no sense to touch monthly. Review contributions to pension plans or tax-advantaged vehicles before the tax year closes, calculate whether it is worth harvesting losses against gains by selling losing positions, and confirm last year's tax return did not leave deductions unclaimed.",
      },
      {
        es: "Es también el momento de revisar testamento y beneficiarios de seguros de vida, algo que la mayoría posterga indefinidamente porque no tiene urgencia mensual pero sí una importancia enorme si cambian las circunstancias familiares: un nacimiento, un divorcio, la compra de una vivienda con hipoteca compartida. Comprobar esto una vez al año cuesta veinte minutos y evita conflictos patrimoniales que pueden durar años.",
        en: "It is also when you review your will and life insurance beneficiaries, something most people postpone indefinitely because it carries no monthly urgency but matters enormously if family circumstances change: a birth, a divorce, buying a home with a shared mortgage. Checking this once a year takes twenty minutes and prevents estate conflicts that can drag on for years.",
      },
      {
        es: "Por último, la revisión anual es donde decides si subes el porcentaje de aportación automática para el año siguiente. Si tu sueldo ha subido un 4% y mantienes el mismo gasto, sube la aportación automática ese mismo 4% antes de que el dinero adicional encuentre otro destino. Esta única decisión anual, repetida durante una carrera de veinticinco años, puede adelantar tu fecha de libertad financiera varios años.",
        en: "Finally, the annual review is where you decide whether to raise the automatic contribution percentage for the coming year. If your salary rose 4% and spending stayed flat, raise the automatic contribution by that same 4% before the extra money finds another destination. This single annual decision, repeated over a 25-year career, can bring your financial freedom date forward by several years.",
      },
    ],
  },
  {
    heading: {
      es: "Cuando el mes ha ido mal: qué hacer sin culpabilizarte",
      en: "When the month went badly: what to do without guilt",
    },
    paragraphs: [
      {
        es: "Algunos meses la tasa de ahorro cae, el patrimonio baja por una corrección de mercado o aparece un gasto imprevisto de mil euros. El error más común es saltarse la revisión ese mes por vergüenza o desánimo, precisamente cuando más falta hace. La regla es simple: la revisión se hace siempre, sea cual sea el resultado, porque el hábito depende de la constancia, no del rendimiento.",
        en: "Some months the savings rate drops, net worth falls due to a market correction, or an unexpected thousand-euro expense appears. The most common mistake is skipping the review that month out of shame or discouragement, exactly when it is needed most. The rule is simple: the review always happens, regardless of the outcome, because the habit depends on consistency, not performance.",
      },
      {
        es: "Cuando el dato es malo, separa causa y culpa. Pregúntate qué ha pasado en términos de hechos: una boda, una reparación del coche, una caída bursátil del 12% que afecta a todo el mercado y no solo a tu cartera. Si la causa es puntual y no se repite, anótala y sigue adelante sin cambiar el sistema. Si la causa es estructural, como un gasto recurrente que has subestimado, ese es exactamente el dato que la revisión mensual está diseñada para detectar.",
        en: "When the figure is bad, separate cause from blame. Ask what happened in factual terms: a wedding, a car repair, a 12% market drop affecting the whole market, not just your portfolio. If the cause is a one-off that will not repeat, note it and move on without changing the system. If the cause is structural, such as a recurring expense you underestimated, that is exactly the signal the monthly review is designed to catch.",
      },
      {
        es: "Una técnica útil es la regla del mes siguiente: en lugar de intentar recuperar de golpe lo perdido, comprométete solo a que el próximo mes vuelva a la tendencia normal, sin sobrecompensar con recortes drásticos que suelen durar dos semanas y terminan en un gasto de rebote mayor. La disciplina financiera se parece más a mantener el rumbo de un barco que a un sprint.",
        en: "A useful technique is the next-month rule: instead of trying to recover the loss all at once, commit only to returning to the normal trend the following month, without overcompensating with drastic cuts that usually last two weeks and end in a bigger rebound expense. Financial discipline resembles holding a ship's course more than running a sprint.",
      },
    ],
    bullets: [
      { es: "La revisión se hace siempre, sin excepción por mal resultado.", en: "The review always happens, no exception for a bad result." },
      { es: "Separa hechos puntuales de causas estructurales.", en: "Separate one-off facts from structural causes." },
      { es: "Corrige el rumbo el mes siguiente, sin sobrecompensar.", en: "Correct course the next month, without overcompensating." },
    ],
  },
  {
    heading: {
      es: "La revisión en pareja: reglas para no discutir de dinero",
      en: "The review as a couple: rules to avoid money fights",
    },
    paragraphs: [
      {
        es: "Hacer la revisión en pareja multiplica su valor porque alinea expectativas antes de que se conviertan en discusión, pero también multiplica el riesgo de tensión si se hace sin estructura. La primera regla es fijar el mismo día y la misma hora cada mes, como una cita ineludible, y tratarla como una reunión de proyecto compartido, no como una evaluación de la conducta del otro.",
        en: "Doing the review as a couple multiplies its value because it aligns expectations before they turn into arguments, but it also multiplies the risk of tension if done without structure. The first rule is fixing the same day and time every month, like a non-negotiable appointment, and treating it as a shared project meeting, not an evaluation of the other person's behaviour.",
      },
      {
        es: "La segunda regla es empezar siempre por los datos compartidos, nunca por gastos individuales concretos: cuánto se ha ahorrado en conjunto, cómo evoluciona el patrimonio familiar, qué objetivo común se acerca o se aleja. Solo después, si hace falta, se aborda un gasto específico, y se hace en términos de acuerdo futuro, no de reproche pasado: no es qué has gastado, sino qué límite fijamos juntos para el mes que viene.",
        en: "The second rule is to always start with shared data, never with specific individual expenses: how much has been saved jointly, how family net worth is evolving, which shared goal is getting closer or farther. Only afterwards, if needed, is a specific expense addressed, framed as a future agreement rather than a past reproach: not what you spent, but what limit we set together for next month.",
      },
      {
        es: "Muchas parejas con ingresos y prioridades distintas usan un modelo de tres cuentas: una cuenta común para gastos compartidos con aportaciones proporcionales a cada ingreso, y una cuenta individual libre para cada uno que no se revisa ni se justifica ante el otro. Este esquema reduce drásticamente los motivos de fricción porque separa lo que es decisión conjunta de lo que es autonomía personal, y la revisión mensual solo entra en la cuenta común y en los objetivos compartidos.",
        en: "Many couples with different incomes and priorities use a three-account model: a joint account for shared expenses funded proportionally to each income, and a free individual account for each person that is never reviewed or justified to the other. This scheme drastically reduces friction because it separates joint decisions from personal autonomy, and the monthly review only touches the joint account and shared goals.",
      },
    ],
  },
  {
    heading: {
      es: "Automatizaciones que reducen la revisión a la mitad",
      en: "Automations that cut the review in half",
    },
    paragraphs: [
      {
        es: "Buena parte de los veinte minutos se puede recortar con automatizaciones que no requieren conocimientos técnicos avanzados. Conectar cuentas bancarias a una app de agregación financiera elimina el minuto de copiar saldos a mano y reduce los errores de transcripción. Configurar reglas de categorización automática para comercios recurrentes, como el supermercado habitual o la gasolinera de siempre, deja solo los movimientos genuinamente nuevos para revisión manual.",
        en: "Much of the twenty minutes can be trimmed with automations that require no advanced technical skill. Connecting bank accounts to a financial aggregation app removes the minute spent copying balances by hand and cuts transcription errors. Setting up automatic categorisation rules for recurring merchants, like the usual supermarket or petrol station, leaves only genuinely new transactions for manual review.",
      },
      {
        es: "Las transferencias automáticas programadas para el día siguiente al cobro de la nómina, hacia ahorro, inversión y amortización de deuda, convierten la tasa de ahorro en un hecho consumado antes de que empiece el mes, en lugar de una intención que compite con el gasto discrecional. Esto no solo ahorra tiempo de revisión: elimina la decisión mensual de cuánto ahorrar, que es precisamente la decisión que más energía mental consume y más se pospone.",
        en: "Automatic transfers scheduled for the day after payday, into savings, investment and debt repayment, turn the savings rate into a fait accompli before the month begins, rather than an intention competing with discretionary spending. This does not just save review time: it removes the monthly decision of how much to save, precisely the decision that consumes the most mental energy and gets postponed the most.",
      },
      {
        es: "Un panel de control simple, ya sea una hoja de cálculo con fórmulas enlazadas o una app de finanzas personales, que calcule automáticamente las seis métricas del cuadro de mando en cuanto se actualizan los saldos, ahorra los minutos que antes se dedicaban a calcular a mano tasa de ahorro y runway. El objetivo de toda automatización es el mismo: que los veinte minutos se dediquen a decidir, no a teclear.",
        en: "A simple dashboard, whether a spreadsheet with linked formulas or a personal finance app, that automatically calculates the six dashboard metrics as soon as balances update, saves the minutes previously spent hand-calculating savings rate and runway. The goal of every automation is the same: spend the twenty minutes deciding, not typing.",
      },
    ],
  },
  {
    heading: {
      es: "Señales de alarma que exigen actuar el mismo día",
      en: "Warning signs that demand same-day action",
    },
    paragraphs: [
      {
        es: "No todo puede esperar al calendario mensual. Hay señales que, si aparecen entre revisiones, merecen una acción inmediata en lugar de esperar veinte o treinta días. Un cargo no reconocido superior a cien euros, un correo de tu banco sobre un intento de acceso sospechoso, o una notificación de que se ha superado el límite de una tarjeta de crédito son ejemplos de alertas que requieren atención en horas, no en semanas.",
        en: "Not everything can wait for the calendar slot. Some signals, if they appear between reviews, deserve immediate action rather than waiting twenty or thirty days. An unrecognised charge over one hundred euros, an email from your bank about a suspicious login attempt, or a notification that a credit card limit has been exceeded are examples of alerts requiring attention in hours, not weeks.",
      },
      {
        es: "En el terreno de las inversiones, una caída superior al 20% en una sola posición individual, o una noticia que cuestiona la solvencia de una entidad donde tienes depósitos por encima del límite del fondo de garantía de 100.000 euros, también justifican revisar la situación fuera de calendario. La clave para no caer en el pánico permanente es definir estos umbrales por adelantado, durante una revisión tranquila, y no improvisarlos en caliente cuando ya ha saltado la alarma.",
        en: "On the investment side, a drop of more than 20% in a single individual position, or news questioning the solvency of an institution where you hold deposits above the 100,000-euro deposit guarantee scheme limit, also justify reviewing the situation outside the calendar. The key to avoiding permanent panic is defining these thresholds in advance, during a calm review, rather than improvising them in the heat of the moment once the alarm has already gone off.",
      },
      {
        es: "Escribe estos umbrales una sola vez, en tu documento de revisión, como una lista de condiciones de disparo: si ocurre X, reviso ese mismo día; si no ocurre ninguna, la próxima cita sigue siendo la del calendario mensual. Esto convierte la vigilancia en un sistema binario y silencioso en lugar de una fuente constante de ansiedad financiera.",
        en: "Write these thresholds once, in your review document, as a list of trigger conditions: if X happens, I review that same day; if none occurs, the next appointment remains the scheduled monthly one. This turns vigilance into a quiet, binary system instead of a constant source of financial anxiety.",
      },
    ],
    bullets: [
      { es: "Cargo no reconocido superior a 100 euros: revisar el mismo día.", en: "Unrecognised charge over 100 euros: review the same day." },
      { es: "Alerta de seguridad bancaria o acceso sospechoso: actuar en horas.", en: "Banking security alert or suspicious access: act within hours." },
      { es: "Caída superior al 20% en una posición individual: valorar fuera de calendario.", en: "Drop over 20% in a single position: assess outside the schedule." },
      { es: "Depósitos por encima del límite del fondo de garantía en una entidad con noticias de riesgo: revisar de inmediato.", en: "Deposits above the guarantee scheme limit at an institution with risk news: review immediately." },
    ],
  },
  {
    heading: {
      es: "Cómo mantener el hábito doce meses seguidos",
      en: "How to keep the habit going for twelve straight months",
    },
    paragraphs: [
      {
        es: "El mayor riesgo de cualquier ritual financiero no es hacerlo mal un mes, sino abandonarlo silenciosamente entre el mes cuatro y el mes seis, cuando la novedad desaparece y todavía no se ha convertido en costumbre automática. Vincular la revisión a un ancla ya existente en tu rutina, como el café del primer sábado de mes o la tarde en que pagas la factura del móvil, multiplica las probabilidades de sostenerla frente a intentar crear un hueco nuevo en la agenda.",
        en: "The biggest risk with any financial ritual is not doing it badly one month, but quietly abandoning it between month four and month six, when the novelty wears off and it has not yet become automatic habit. Anchoring the review to an existing routine, such as the coffee on the first Saturday of the month or the afternoon you pay your phone bill, multiplies the odds of sticking with it compared with trying to carve out a brand-new slot in your calendar.",
      },
      {
        es: "Llevar un registro visual, como una fila de casillas marcadas en un calendario o una racha visible en una app de hábitos, aprovecha el mismo mecanismo psicológico que hace efectivas las cadenas de hábitos en cualquier otro ámbito: nadie quiere romper una racha de ocho meses seguidos. Si un mes se te pasa el día exacto, hazla al día siguiente en lugar de saltártela por completo; una racha con un desliz de un día sigue siendo una racha.",
        en: "Keeping a visual log, like a row of checked boxes on a calendar or a visible streak in a habit app, taps into the same psychological mechanism that makes habit chains effective in any other area: nobody wants to break an eight-month streak. If one month you miss the exact day, do it the next day instead of skipping it entirely; a streak with a one-day slip is still a streak.",
      },
      {
        es: "Por último, celebra los hitos de proceso, no solo los de resultado. Cumplir doce revisiones seguidas es un logro en sí mismo, independientemente de si la tasa de ahorro subió o bajó ese año, porque demuestra que el sistema es sostenible. Los resultados financieros llegan con retraso respecto al esfuerzo; el hábito es lo único que controlas por completo cada mes, y por eso es lo único que merece la pena celebrar con la misma regularidad con la que se practica.",
        en: "Finally, celebrate process milestones, not only outcome ones. Completing twelve reviews in a row is an achievement in itself, regardless of whether the savings rate rose or fell that year, because it proves the system is sustainable. Financial results lag behind effort; the habit is the one thing you fully control every month, and that is exactly why it deserves to be celebrated with the same regularity with which it is practised.",
      },
    ],
    bullets: [
      { es: "Ancla la revisión a una rutina ya existente.", en: "Anchor the review to an already existing routine." },
      { es: "Lleva un registro visual de la racha mensual.", en: "Keep a visual log of the monthly streak." },
      { es: "Si se te pasa el día, hazla al día siguiente sin saltártela.", en: "If you miss the day, do it the next one instead of skipping." },
      { es: "Celebra el proceso, no solo el resultado financiero.", en: "Celebrate the process, not only the financial outcome." },
    ],
  },
];

export default sections;
