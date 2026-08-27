import type { BlogSection } from "@/lib/blog-posts";

const sections: BlogSection[] = [
  {
    heading: {
      es: "Por qué las categorías de tu banco no sirven para decidir",
      en: "Why your bank's categories don't help you decide",
    },
    paragraphs: [
      {
        es: "Las apps bancarias etiquetan movimientos con categorías genéricas pensadas para mostrar un gráfico bonito, no para tomar decisiones. Un cargo de 45 euros puede aparecer como «compras» tanto si es ropa como si es material de trabajo deducible, y un recibo de 12 euros de streaming se mezcla con el resto de «ocio» sin distinguir si es una suscripción activa o un cobro fantasma. El resultado es un desglose que parece informativo pero no te dice qué recortar ni qué proteger.",
        en: "Banking apps tag transactions with generic categories designed to render a nice chart, not to support decisions. A 45-euro charge might show up as \"shopping\" whether it's clothing or tax-deductible work supplies, and a 12-euro streaming charge gets lumped into \"leisure\" without distinguishing an active subscription from a ghost charge. The result looks informative but doesn't tell you what to cut or what to protect.",
      },
      {
        es: "El problema de fondo es que esas categorías clasifican por tipo de comercio, no por función financiera. Para tu patrimonio importa mucho más saber si un gasto es fijo o variable, si es evitable o estructural, y si compite con tu tasa de ahorro objetivo. Un sistema de IA bien configurado no sustituye las etiquetas del banco por otras más bonitas: cambia el criterio de clasificación para que cada euro quede etiquetado según el papel que juega en tu plan financiero.",
        en: "The underlying problem is that these categories classify by merchant type, not by financial function. What matters for your net worth is knowing whether an expense is fixed or variable, avoidable or structural, and whether it competes with your target savings rate. A well-configured AI system doesn't just replace the bank's labels with prettier ones: it changes the classification criteria so every euro is tagged by the role it plays in your financial plan.",
      },
      {
        es: "Otra limitación habitual es la granularidad fija: el banco decide cuántas categorías existen y no puedes fusionar ni dividir según tu realidad. Si alquilas una plaza de garaje aparte de tu vivienda, o si separas el gasto en mascotas del resto del hogar, necesitas un plan de cuentas propio. La IA que lee el extracto puede adaptarse a esas categorías personalizadas siempre que se las definas con claridad antes de procesar los movimientos, no después.",
        en: "Another common limitation is fixed granularity: the bank decides how many categories exist and you can't merge or split them to fit your reality. If you rent a parking space separately from your home, or want to track pet expenses apart from general household costs, you need your own chart of accounts. AI reading your statement can adapt to those custom categories as long as you define them clearly before processing transactions, not after.",
      },
    ],
  },
  {
    heading: {
      es: "Diseñar un plan de categorías orientado a decisiones",
      en: "Designing a category plan built for decisions",
    },
    paragraphs: [
      {
        es: "Antes de automatizar nada conviene diseñar en papel el plan de categorías que realmente vas a usar para decidir. La estructura más útil tiene cuatro bloques: fijos comprometidos (vivienda, seguros, deuda), variables necesarios (alimentación, transporte, suministros), discrecional (ocio, restauración, compras) y movimientos que no son gasto real (transferencias entre tus cuentas, inversión, devoluciones). Mezclar estos bloques es el motivo por el que muchos análisis de gasto no llevan a ninguna acción concreta.",
        en: "Before automating anything, sketch on paper the category plan you'll actually use to decide. The most useful structure has four blocks: committed fixed costs (housing, insurance, debt), necessary variable costs (food, transport, utilities), discretionary spending (leisure, dining out, shopping), and non-expense movements (transfers between your own accounts, investing, refunds). Mixing these blocks is why so many spending analyses never lead to concrete action.",
      },
      {
        es: "Dentro de cada bloque, limita el número de categorías a entre ocho y quince en total. Más allá de esa cifra, revisar la clasificación cada mes se vuelve tedioso y acabas ignorando el detalle. Es mejor tener «restauración» como categoría única que separar «bares», «restaurantes» y «comida a domicilio» si al final vas a sumar los tres para decidir si te estás pasando del presupuesto asignado a comer fuera.",
        en: "Within each block, cap the total number of categories at eight to fifteen. Beyond that, monthly review becomes tedious and you end up ignoring the detail. It's better to have a single \"dining out\" category than to split \"bars,\" \"restaurants,\" and \"food delivery\" separately if you're ultimately going to add all three together to check whether you're over budget on eating out.",
      },
      {
        es: "Un punto que se olvida con frecuencia es etiquetar explícitamente los gastos anuales o trimestrales, como seguros del coche, impuestos municipales o cuotas de colegios profesionales. Si la IA los mete en el mes en que se cobran, distorsionan la comparación entre meses y pueden parecer un pico de gasto discrecional cuando en realidad es un compromiso previsible. La solución es crear una categoría de «gastos periódicos no mensuales» y prorratearlos manualmente al calcular tu presupuesto medio.",
        en: "A frequently overlooked point is explicitly tagging annual or quarterly expenses, such as car insurance, local taxes, or professional membership fees. If the AI lumps them into the month they're charged, they distort month-to-month comparisons and can look like a discretionary spending spike when they're actually a predictable commitment. The fix is to create a \"non-monthly recurring expenses\" category and manually prorate them when calculating your average budget.",
      },
    ],
    bullets: [
      {
        es: "Fijos comprometidos: vivienda, seguros, cuotas de deuda, suscripciones esenciales.",
        en: "Committed fixed costs: housing, insurance, debt payments, essential subscriptions.",
      },
      {
        es: "Variables necesarios: alimentación, transporte, suministros, salud.",
        en: "Necessary variable costs: food, transport, utilities, health.",
      },
      {
        es: "Discrecional: ocio, restauración, compras no esenciales, viajes.",
        en: "Discretionary: leisure, dining out, non-essential shopping, travel.",
      },
      {
        es: "No es gasto real: transferencias propias, aportaciones a inversión, devoluciones y reembolsos.",
        en: "Not real spending: transfers between your own accounts, investment contributions, refunds and reimbursements.",
      },
    ],
  },
  {
    heading: {
      es: "Cómo lee un extracto un motor de clasificación con IA",
      en: "How an AI classification engine reads a bank statement",
    },
    paragraphs: [
      {
        es: "El primer paso técnico es la normalización del texto del comercio. Un mismo negocio puede aparecer en el extracto como «MERCADONA 3421 MADRID», «COMPRA MERCADON» o «MERCADONA S.A.» según el terminal y el banco. Un motor de IA entrenado para esto limpia sufijos numéricos, códigos de terminal y variaciones ortográficas para reconocer que los tres corresponden al mismo comercio, y a partir de ahí puede asignar la categoría con mucha más consistencia que una regla de texto exacto.",
        en: "The first technical step is normalizing the merchant text. The same business might appear on your statement as \"MERCADONA 3421 MADRID,\" \"COMPRA MERCADON,\" or \"MERCADONA S.A.\" depending on the terminal and the bank. An AI engine trained for this strips numeric suffixes, terminal codes, and spelling variations to recognize all three as the same merchant, then assigns the category far more consistently than an exact-text rule would.",
      },
      {
        es: "El segundo paso es agrupar suscripciones recurrentes aunque el importe varíe ligeramente, como ocurre con planes que suben de precio o servicios con impuestos variables según la región de facturación. Un buen sistema busca patrones de periodicidad —mismo comercio, intervalo de entre 28 y 32 días, importe dentro de un rango razonable— en vez de exigir una coincidencia exacta de cifra. Esto es lo que permite detectar que llevas pagando dos plataformas de streaming casi idénticas sin darte cuenta.",
        en: "The second step is grouping recurring subscriptions even when the amount varies slightly, as happens with plans that raise prices or services with taxes that differ by billing region. A good system looks for periodicity patterns — same merchant, an interval of roughly 28 to 32 days, an amount within a reasonable range — instead of requiring an exact figure match. This is what lets you spot that you've been paying for two nearly identical streaming platforms without noticing.",
      },
      {
        es: "El tercer paso, más avanzado, es la detección de viajes y gastos agrupados por contexto temporal y geográfico. Si en cuatro días aparecen cargos de una aerolínea, dos hoteles y varios restaurantes en una ciudad distinta a tu residencia habitual, un motor de IA puede agruparlos automáticamente bajo un mismo evento de viaje en lugar de dispersarlos entre «transporte», «alojamiento» y «restauración» sin relación aparente. Esto es especialmente útil para calcular el coste real de cada viaje frente al presupuesto que te habías marcado.",
        en: "The third, more advanced step is detecting trips and grouping expenses by temporal and geographic context. If within four days you see charges from an airline, two hotels, and several restaurants in a city other than your usual residence, an AI engine can automatically group them under a single trip event instead of scattering them across \"transport,\" \"lodging,\" and \"dining\" with no apparent link. This is especially useful for calculating the real cost of each trip against the budget you set.",
      },
      {
        es: "Por último, la detección de duplicados y cargos erróneos compara importes, comercios y fechas próximas para señalar cobros dobles, típicos de fallos en terminales de punto de venta o de renovaciones automáticas que se ejecutan dos veces. No siempre son errores del banco: a veces son cargos legítimos que simplemente coinciden en fecha, así que el sistema debe marcarlos como sospechosos para que los revises tú, no eliminarlos automáticamente.",
        en: "Finally, duplicate and erroneous charge detection compares amounts, merchants, and nearby dates to flag double charges, typically caused by point-of-sale terminal glitches or auto-renewals that fire twice. These aren't always bank errors: sometimes they're legitimate charges that simply share a date, so the system should flag them as suspicious for you to review rather than removing them automatically.",
      },
    ],
  },
  {
    heading: {
      es: "Transferencias, ingresos mal marcados y otros falsos positivos",
      en: "Transfers, mislabeled income, and other false positives",
    },
    paragraphs: [
      {
        es: "El error más habitual en cualquier clasificación automática es tratar como gasto un movimiento que en realidad es un traspaso entre tus propias cuentas. Si mueves dinero de tu cuenta corriente a una cuenta remunerada o a un bróker, ese importe no ha salido de tu patrimonio, solo ha cambiado de sitio. Si el sistema lo cuenta como gasto discrecional, tu tasa de ahorro aparente se hunde de forma artificial y puede llevarte a recortar gastos que no necesitan recorte.",
        en: "The most common error in any automated classification is treating a transfer between your own accounts as an expense. If you move money from your checking account to a high-yield savings account or a broker, that amount hasn't left your net worth, it has just changed location. If the system counts it as discretionary spending, your apparent savings rate collapses artificially and can push you to cut expenses that don't need cutting.",
      },
      {
        es: "Para evitarlo, identifica de antemano el IBAN o el alias de cada cuenta tuya y crea una regla explícita que marque como «traspaso interno» cualquier movimiento entre ellas, excluyéndolo tanto de gastos como de ingresos en el cálculo de tu tasa de ahorro. Lo mismo aplica a las aportaciones a inversión: si inviertes 400 euros al mes, ese dinero es ahorro que se ha transformado en activos, no un gasto que reduce tu bienestar financiero, y debe figurar en una categoría separada que sume a tu patrimonio, no que reste de tu presupuesto de vida.",
        en: "To avoid this, identify the IBAN or alias of each of your accounts in advance and create an explicit rule marking any movement between them as an \"internal transfer,\" excluding it from both income and expenses when calculating your savings rate. The same applies to investment contributions: if you invest 400 euros a month, that money is savings that has turned into assets, not an expense reducing your financial well-being, and it should sit in a separate category that adds to your net worth rather than subtracting from your living budget.",
      },
      {
        es: "Los ingresos también se etiquetan mal con frecuencia. Una devolución de Hacienda, un reembolso de un seguro o el dinero que te devuelve un amigo tras un gasto compartido no son «ingresos» en el sentido de renta del trabajo o del capital: son compensaciones que simplemente revierten un gasto anterior. Si los sumas a tus ingresos reales, inflarás artificialmente tu tasa de ahorro del mes y perderás visibilidad sobre tu capacidad de generación de renta recurrente, que es la cifra que de verdad debes seguir para planificar la independencia financiera.",
        en: "Income also gets frequently mislabeled. A tax refund, an insurance payout, or money a friend pays you back after a shared expense are not \"income\" in the sense of employment or capital income: they're compensations that simply reverse a prior expense. If you add them to your real income, you'll artificially inflate your savings rate for the month and lose visibility into your recurring income generation capacity, which is the figure you should actually track to plan financial independence.",
      },
    ],
  },
  {
    heading: {
      es: "Privacidad: qué datos se envían y cómo protegerlos",
      en: "Privacy: what data gets shared and how to protect it",
    },
    paragraphs: [
      {
        es: "Clasificar gastos con IA implica, en la mayoría de herramientas, subir un extracto bancario o conectar una cuenta mediante un agregador financiero. Antes de hacerlo conviene distinguir dos modelos: el que procesa el archivo puntualmente sin guardar una copia permanente, y el que mantiene una conexión continua a tu banco para sincronizar movimientos en tiempo real. El segundo modelo es más cómodo, pero implica ceder credenciales o tokens de acceso a un tercero de forma indefinida, así que exige comprobar con qué proveedor de agregación trabaja el servicio y qué certificaciones de seguridad tiene.",
        en: "Classifying expenses with AI usually means either uploading a bank statement or connecting an account through a financial aggregator. Before doing so, distinguish between two models: one that processes the file once without keeping a permanent copy, and one that maintains a continuous connection to your bank to sync transactions in real time. The second is more convenient, but it means handing over credentials or access tokens to a third party indefinitely, so check which aggregation provider the service uses and what security certifications it holds.",
      },
      {
        es: "Un extracto bancario contiene información sensible que va mucho más allá del gasto: revela dónde vives, dónde trabajas, tu estado de salud si pagas farmacias o consultas médicas, tus creencias si donas a organizaciones, y tus relaciones si compartes gastos con otra persona. Antes de subir un archivo a cualquier herramienta, revisa su política de privacidad para confirmar si los datos se usan para entrenar modelos de terceros, si se anonimizan de verdad o si simplemente se seudonimizan, que es un nivel de protección mucho más débil.",
        en: "A bank statement contains sensitive information that goes far beyond spending: it reveals where you live, where you work, your health status if you pay for pharmacies or medical visits, your beliefs if you donate to organizations, and your relationships if you split expenses with someone else. Before uploading a file to any tool, check its privacy policy to confirm whether the data is used to train third-party models, whether it's genuinely anonymized, or merely pseudonymized, which offers much weaker protection.",
      },
      {
        es: "Una práctica razonable es tachar manualmente el número de cuenta y el titular antes de subir un PDF a una herramienta de terceros, dejando visibles solo fecha, concepto e importe, que es lo mínimo necesario para clasificar. Si usas un asistente de IA de propósito general para pegar movimientos y pedirle que los categorice, evita incluir nombres completos de comercios muy identificables si no es necesario, y prioriza siempre herramientas que procesen los datos localmente o que declaren explícitamente que no retienen el contenido tras la sesión.",
        en: "A reasonable practice is to manually redact the account number and holder's name before uploading a PDF to a third-party tool, leaving only date, description, and amount visible, which is the minimum needed for classification. If you use a general-purpose AI assistant to paste transactions and ask it to categorize them, avoid including highly identifiable full merchant names when unnecessary, and always prioritize tools that process data locally or explicitly state they don't retain content after the session.",
      },
    ],
  },
  {
    heading: {
      es: "El repaso mensual de diez minutos que mantiene el sistema fiable",
      en: "The ten-minute monthly review that keeps the system reliable",
    },
    paragraphs: [
      {
        es: "Ningún clasificador automático acierta al cien por cien de forma permanente, así que un repaso mensual breve es lo que separa un sistema útil de uno que se abandona a los tres meses. Reserva diez minutos, idealmente el mismo día en que revisas tu presupuesto, y céntrate solo en tres cosas: comercios nuevos que la IA no reconoció y quedaron en «sin categorizar», importes atípicos marcados como sospechosos, y la categoría de gasto discrecional, que suele acumular la mayoría de errores por su heterogeneidad.",
        en: "No automated classifier gets it right one hundred percent of the time forever, so a brief monthly review is what separates a useful system from one abandoned after three months. Set aside ten minutes, ideally the same day you review your budget, and focus on just three things: new merchants the AI didn't recognize and left as \"uncategorized,\" unusual amounts flagged as suspicious, and the discretionary spending category, which tends to accumulate most errors due to its variety.",
      },
      {
        es: "Cuando corrijas manualmente una categoría, comprueba si la herramienta permite guardar esa corrección como regla permanente para ese comercio. Si no lo permite, tendrás que repetir la corrección cada mes, lo que anula buena parte del ahorro de tiempo que buscas con la automatización. La mayoría de gestores financieros y asistentes de IA bien diseñados aprenden de tus correcciones y reducen progresivamente el número de movimientos que necesitan revisión manual, normalmente por debajo del cinco por ciento tras dos o tres meses de uso.",
        en: "When you manually correct a category, check whether the tool lets you save that correction as a permanent rule for that merchant. If it doesn't, you'll have to repeat the fix every month, which undermines much of the time savings you're after with automation. Most well-designed financial managers and AI assistants learn from your corrections and progressively reduce the share of transactions needing manual review, typically below five percent after two or three months of use.",
      },
      {
        es: "Aprovecha también este repaso para detectar suscripciones que ya no usas. Es el momento en que aparecen con más claridad porque llevas un mes viendo la categoría de gastos recurrentes agrupada, y es mucho más fácil decidir cancelar algo cuando ves el coste anual proyectado —una suscripción de 9,99 euros al mes son casi 120 euros al año— que cuando solo ves el cargo mensual aislado y parece insignificante.",
        en: "Use this review to spot subscriptions you no longer use, too. This is when they become clearest, since you've spent a month seeing the recurring expenses category grouped together, and it's much easier to decide to cancel something when you see the projected annual cost — a 9.99-euro monthly subscription is nearly 120 euros a year — than when you only see the isolated monthly charge and it looks insignificant.",
      },
    ],
  },
  {
    heading: {
      es: "Las métricas que de verdad importan tras clasificar el gasto",
      en: "The metrics that actually matter once spending is classified",
    },
    paragraphs: [
      {
        es: "Tener el gasto bien clasificado no sirve de nada si luego miras las métricas equivocadas. La primera cifra que debes calcular cada mes es la tasa de ahorro real, definida como ahorro e inversión entre ingresos netos, excluyendo traspasos internos como se explicó antes. Es la métrica que mejor predice cuándo alcanzarás la independencia financiera, muy por encima de cuánto gastas en una categoría concreta, porque conecta directamente con el ritmo al que construyes patrimonio.",
        en: "Having spending properly classified is useless if you then look at the wrong metrics. The first figure to calculate every month is your real savings rate, defined as savings plus investment divided by net income, excluding internal transfers as explained earlier. It's the metric that best predicts when you'll reach financial independence, far more than how much you spend in any single category, because it connects directly to the pace at which you build net worth.",
      },
      {
        es: "La segunda métrica es el peso del gasto discrecional sobre el total, no en euros absolutos sino como porcentaje. Un discrecional del 15 por ciento del gasto total con una tasa de ahorro del 30 por ciento es una situación sana; el mismo 15 por ciento con una tasa de ahorro del 5 por ciento indica que el problema no está en el ocio sino en que tus gastos fijos se están comiendo casi todo el ingreso, y ahí el recorte de discrecional apenas moverá la aguja.",
        en: "The second metric is the share of discretionary spending over the total, not in absolute euros but as a percentage. Discretionary spending at 15 percent of the total with a 30 percent savings rate is a healthy situation; that same 15 percent with a 5 percent savings rate signals the problem isn't leisure but that your fixed costs are eating nearly all your income, in which case cutting discretionary spending will barely move the needle.",
      },
      {
        es: "La tercera métrica, con frecuencia ignorada, es el coste real de suscripciones y servicios recurrentes como porcentaje de tu ingreso, calculado en base anual. Es habitual que quien nunca ha agrupado estos cargos descubra que suman entre el 3 y el 8 por ciento de su ingreso mensual repartidos en diez o quince servicios pequeños, una cifra que rara vez se ve así de junta hasta que la clasificación automática la saca a la luz agrupando todo bajo una sola categoría de recurrentes.",
        en: "The third metric, often overlooked, is the real cost of subscriptions and recurring services as a percentage of income, calculated on an annual basis. It's common for someone who has never grouped these charges to discover they add up to between 3 and 8 percent of monthly income spread across ten or fifteen small services, a figure rarely seen this clearly until automated classification brings it to light by grouping everything under one recurring category.",
      },
    ],
  },
  {
    heading: {
      es: "De la clasificación al recorte sostenible: cómo actuar sin sufrir",
      en: "From classification to sustainable cuts: acting without pain",
    },
    paragraphs: [
      {
        es: "El error más habitual tras clasificar el gasto es intentar recortar todas las categorías discrecionales a la vez con un objetivo agresivo y genérico como «gastar un 30 por ciento menos este mes». Ese enfoque funciona pocas semanas y suele terminar en un rebote de gasto compensatorio al mes siguiente. Funciona mejor elegir una sola categoría con margen claro —normalmente restauración, suscripciones o compras impulsivas— y fijar un límite concreto y sostenible durante tres meses seguidos antes de tocar la siguiente.",
        en: "The most common mistake after classifying spending is trying to cut every discretionary category at once with an aggressive, generic target like \"spend 30 percent less this month.\" That approach works for a few weeks and usually ends in a compensatory spending rebound the following month. It works better to pick a single category with clear room to cut — usually dining out, subscriptions, or impulse purchases — and set a concrete, sustainable cap for three consecutive months before moving to the next one.",
      },
      {
        es: "Apóyate en la clasificación automática para poner un aviso cuando una categoría supere el ochenta por ciento de su límite mensual antes de que termine el mes, en lugar de descubrirlo el día uno con el resumen ya cerrado. Ese margen de reacción, aunque sea de solo unos días, es lo que permite ajustar el comportamiento a tiempo sin necesidad de fuerza de voluntad extraordinaria, porque conviertes una decisión abstracta en una alerta concreta y accionable.",
        en: "Use the automated classification to trigger an alert when a category hits eighty percent of its monthly cap before the month closes, instead of finding out on day one with the summary already final. That reaction window, even if just a few days, is what lets you adjust behavior in time without needing extraordinary willpower, because you turn an abstract decision into a concrete, actionable alert.",
      },
      {
        es: "Por último, destina explícitamente una parte de cualquier ahorro conseguido a inversión automática antes de que se difumine en el gasto corriente del mes siguiente. Si recortas 80 euros mensuales en suscripciones y restauración, programa una transferencia automática de esa misma cantidad a tu cartera de inversión el día que cobras la nómina. La clasificación con IA te ha dado la cifra exacta del ahorro potencial; el paso que realmente construye patrimonio es automatizar su destino para que no dependa de una decisión manual cada mes.",
        en: "Finally, explicitly route part of any savings achieved into automatic investing before it dissolves back into next month's regular spending. If you cut 80 euros a month in subscriptions and dining out, schedule an automatic transfer of that same amount to your investment portfolio on payday. AI classification has given you the exact figure for potential savings; the step that actually builds net worth is automating where it goes so it doesn't depend on a manual decision every month.",
      },
    ],
  },
];

export default sections;
