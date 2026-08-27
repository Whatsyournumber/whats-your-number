import type { BlogSection } from "@/lib/blog-posts";

const sections: BlogSection[] = [
  {
    heading: {
      es: "Cómo calcular tu runway con precisión: gasto de supervivencia vs. gasto actual",
      en: "How to calculate your runway precisely: survival spending vs. current spending",
    },
    paragraphs: [
      {
        es: "El runway solo sirve si el denominador es honesto. La mayoría de la gente calcula su gasto mensual mirando el saldo de la cuenta corriente, que mezcla gastos fijos, caprichos y pagos puntuales como el seguro anual del coche. Para un número útil necesitas dos cifras distintas: el gasto de mantenimiento (tu tren de vida real, con ocio y suscripciones) y el gasto de supervivencia (vivienda, suministros, comida básica, transporte imprescindible, seguros, deuda mínima y salud). La diferencia entre ambos suele ser de un 25% a un 40%, y es el margen que tienes para reaccionar sin cambiar de vida drásticamente.",
      },
      {
        es: "Revisa los últimos seis meses de movimientos bancarios y clasifica cada línea en una de las dos categorías. No te fíes de la memoria: la gente subestima su gasto real en un 15-20% de media porque olvida pagos anuales, regalos y gastos en efectivo. Divide los gastos anuales entre doce y súmalos a la media mensual. Este ejercicio de una tarde te da el número exacto que vas a dividir entre tus activos líquidos, y evita el error más común: calcular el runway con un gasto que ya llevas meses sin cumplir.",
      },
      {
        es: "Una vez tengas las dos cifras, calcula dos runways paralelos: el de supervivencia (activos líquidos ÷ gasto de supervivencia) te dice cuánto tiempo tienes antes de tocar fondo real; el de mantenimiento te dice cuánto puedes aguantar sin cambiar nada. La distancia entre ambos es tu colchón de decisión: el tiempo extra que ganas si actúas rápido y recortas en cuanto detectas el problema, en vez de esperar a que el dinero se agote solo.",
      },
    ],
    bullets: [
      {
        es: "Gasto de supervivencia: vivienda, suministros, comida, transporte imprescindible, seguros, deuda mínima, salud.",
        en: "Survival spending: housing, utilities, food, essential transport, insurance, minimum debt, health.",
      },
      {
        es: "Gasto de mantenimiento: el anterior más ocio, suscripciones, restaurantes y compras discrecionales.",
        en: "Maintenance spending: the above plus leisure, subscriptions, restaurants and discretionary purchases.",
      },
      {
        es: "Revisa seis meses de extractos reales, no una estimación mental: la diferencia media es del 15-20%.",
        en: "Review six months of real statements, not a mental estimate: the average gap is 15-20%.",
      },
    ],
  },
  {
    heading: {
      es: "Dónde guardar el colchón: cuenta remunerada, fondo monetario, letras y depósitos escalonados",
      en: "Where to keep the cushion: high-yield accounts, money-market funds, T-bills and laddered deposits",
    },
    paragraphs: [
      {
        es: "El dinero del runway tiene un único trabajo: estar disponible cuando lo necesites, sin depender de qué esté haciendo el mercado ese día. Eso descarta la bolsa y limita las opciones a cuatro vehículos: cuentas remuneradas, fondos monetarios, letras del Tesoro y depósitos a plazo escalonados. Ninguno te va a hacer rico, y esa es precisamente la idea: el colchón no busca rentabilidad, busca certeza. La rentabilidad la persigues con el resto de tu patrimonio, no con este tramo.",
      },
      {
        es: "Las cuentas remuneradas de bancos online ofrecen liquidez inmediata y tipos que en 2024 han rondado el 2-3% TAE en las mejores ofertas, aunque suelen ser promociones limitadas a los primeros meses o a un importe máximo. Los fondos monetarios (categoría FI de renta fija a muy corto plazo) replican de cerca el tipo de interés oficial del BCE, tienen liquidez en 24-48 horas y, si los mantienes más de un año, permiten diferir la fiscalidad mediante traspasos entre fondos sin tributar, una ventaja fiscal que ninguna cuenta remunerada iguala.",
      },
      {
        es: "Las letras del Tesoro a 3, 6 o 12 meses ofrecen tipos similares o algo superiores a los fondos monetarios y están exentas de retención en origen, aunque tributan igual en la declaración. Su inconveniente es la liquidez: si necesitas el dinero antes del vencimiento debes venderlas en el mercado secundario, con una pequeña penalización. Una estrategia de depósitos escalonados (dividir el colchón en tramos que vencen cada uno o dos meses) combina algo más de rentabilidad con acceso parcial constante, útil si tu runway supera los ocho o diez meses y quieres exprimir algo el tramo que no vas a tocar pronto.",
      },
      {
        es: "La fiscalidad importa más de lo que parece en un colchón grande. Los intereses de cuentas remuneradas y el cupón de las letras tributan como rendimiento del capital mobiliario en la base del ahorro, entre el 19% y el 28% según el importe. Los fondos monetarios, en cambio, solo tributan cuando reembolsas, no en cada devengo de intereses, lo que te da control sobre en qué ejercicio fiscal declaras la ganancia. Para colchones superiores a 20.000-30.000 euros, repartir entre dos o tres vehículos reduce tanto el riesgo de contraparte como la factura fiscal si sabes escalonar los reembolsos.",
      },
    ],
    bullets: [
      {
        es: "Cuenta remunerada: liquidez inmediata, TAE variable, tributa en cada liquidación de intereses.",
        en: "High-yield account: instant liquidity, variable AER, taxed on every interest payout.",
      },
      {
        es: "Fondo monetario: liquidez en 24-48h, sigue el tipo del BCE, difiere la fiscalidad hasta el reembolso.",
        en: "Money-market fund: 24-48h liquidity, tracks the ECB rate, defers taxation until redemption.",
      },
      {
        es: "Letras del Tesoro: tipos competitivos, sin retención en origen, menos líquidas si vendes antes de vencimiento.",
        en: "Treasury bills: competitive rates, no withholding at source, less liquid if sold before maturity.",
      },
      {
        es: "Depósitos escalonados: reparte el colchón en vencimientos mensuales para ganar algo de tipo sin perder acceso.",
        en: "Laddered deposits: spread the cushion across monthly maturities to earn a bit more without losing access.",
      },
    ],
  },
  {
    heading: {
      es: "Cuántos meses de runway necesitas según tu perfil de ingresos",
      en: "How many months of runway you need based on your income profile",
    },
    paragraphs: [
      {
        es: "El estándar genérico de tres a seis meses ignora que la volatilidad de tu ingreso importa tanto como su cuantía. Un funcionario y un comercial con variable representan riesgos completamente distintos aunque ganen lo mismo, y tratar su runway con la misma regla es un error de cálculo, no de prudencia. El runway debe ser proporcional a la probabilidad y velocidad con la que tu ingreso puede caer a cero, no a una cifra que leíste en un artículo genérico.",
      },
    ],
    subsections: [
      {
        heading: { es: "Asalariado con contrato indefinido en sector estable", en: "Salaried employee with a permanent contract in a stable sector" },
        paragraphs: [
          { es: "Tres a cuatro meses de gasto de supervivencia suelen bastar. El riesgo de despido es bajo, existe indemnización legal (20 o 33 días por año trabajado según el tipo de despido) y la prestación por desempleo cubre parte del bache. El runway aquí funciona más como amortiguador de la búsqueda de empleo que como red frente a una caída total de ingresos.", en: "Three to four months of survival spending is usually enough. Layoff risk is low, there is statutory severance (20 or 33 days per year worked depending on the dismissal type) and unemployment benefits cover part of the gap. Runway here works more as a job-search buffer than as a safety net against total income loss." },
        ],
      },
      {
        heading: { es: "Autónomo o freelance con ingresos irregulares", en: "Self-employed or freelancer with irregular income" },
        paragraphs: [
          { es: "Seis a nueve meses, calculados sobre el mes más bajo de los últimos dos años, no sobre la media. Sin indemnización y con una prestación por cese de actividad limitada y difícil de cobrar en la práctica, el autónomo absorbe el cien por cien del riesgo. Además, cobrar facturas con retraso es habitual, así que el runway también compensa el desfase entre facturar y cobrar, que puede ser de 60 o 90 días.", en: "Six to nine months, calculated on the lowest month of the past two years, not the average. Without severance and with a cessation-of-activity benefit that is limited and hard to claim in practice, the self-employed person absorbs one hundred percent of the risk. Late invoice payments are also common, so runway also compensates for the gap between billing and collecting, which can run 60 to 90 days." },
        ],
      },
      {
        heading: { es: "Ingresos con comisión o variable elevado", en: "Commission-based or high-variable income" },
        paragraphs: [
          { es: "Cinco a siete meses, calculados sobre el escenario en el que solo cobras el fijo. Si tu variable representa más del 30% del total, tu gasto de supervivencia debería poder cubrirse con el fijo en solitario durante ese periodo; si no es así, el runway real es más corto de lo que crees porque un mal trimestre comercial puede recortar tus ingresos a la mitad sin que exista ningún despido de por medio.", en: "Five to seven months, calculated on the scenario where you only receive the fixed portion. If your variable pay is over 30% of the total, your survival spending should be coverable by the fixed salary alone during that period; otherwise your real runway is shorter than you think, because one bad sales quarter can halve your income with no layoff involved." },
        ],
      },
      {
        heading: { es: "Pareja con dos ingresos frente a un único sustentador", en: "Dual-income couples vs. a single breadwinner" },
        paragraphs: [
          { es: "Una pareja con dos nóminas independientes puede reducir el runway conjunto a tres o cuatro meses si ambos empleos son estables y no correlacionados (distinto sector, distinta empresa), porque la probabilidad de perder ambos ingresos a la vez es baja. Si un único sueldo sostiene el hogar, el runway debe subir a ocho o doce meses, y conviene sumar un colchón adicional si hay hijos o hipoteca con cuota alta, porque el margen de reacción es mucho menor.", en: "A couple with two separate paychecks can lower their combined runway to three or four months if both jobs are stable and uncorrelated (different sector, different employer), since the odds of losing both incomes at once are low. If a single salary supports the household, runway should rise to eight or twelve months, and it is worth adding an extra cushion if there are children or a high mortgage payment, since the room to react is much smaller." },
        ],
      },
      {
        heading: { es: "Sector cíclico o expuesto a recortes masivos", en: "Cyclical sector or one exposed to mass layoffs" },
        paragraphs: [
          { es: "Nueve a doce meses si trabajas en construcción, turismo, tecnología en fase de ajuste o cualquier sector que históricamente hace ERE cada crisis. No es pesimismo, es estadística: estos sectores despiden en oleadas y contratan despacio, así que el tiempo medio hasta recolocarte suele duplicar el de sectores estables. Un runway corto en un sector cíclico te obliga a aceptar la primera oferta que llegue, casi siempre peor pagada.", en: "Nine to twelve months if you work in construction, tourism, tech going through a correction, or any sector that historically runs layoff waves during every crisis. This is not pessimism, it is statistics: these sectors cut staff in waves and hire back slowly, so the average time to re-employment tends to double that of stable sectors. A short runway in a cyclical sector forces you to accept the first offer that comes along, almost always worse paid." },
        ],
      },
    ],
  },
  {
    heading: {
      es: "Runway y despido: cómo encajan la indemnización y el paro",
      en: "Runway and layoffs: how severance pay and unemployment benefits fit in",
    },
    paragraphs: [
      {
        es: "Un error habitual es calcular el runway ignorando que un despido trae consigo dinero adicional: la indemnización y la prestación por desempleo. Ignorarlas te lleva a sobreahorrar de forma innecesaria; contar con ellas de más te deja expuesto. La forma correcta es tratarlas como un runway secundario que se activa solo si el escenario de despido se cumple, y calcular tu colchón base sin ellas para cubrir el peor de los casos: una renuncia, un despido sin indemnización reconocida o un litigio que retrase el cobro.",
      },
      {
        es: "En un despido improcedente la indemnización legal son 33 días de salario por año trabajado con un máximo de 24 mensualidades; en uno objetivo o por causas económicas, 20 días por año con un máximo de 12 mensualidades. La prestación contributiva por desempleo cubre entre el 70% (los primeros 180 días) y el 50% (a partir del día 181) de la base reguladora, con un tope que en 2024 ronda los 1.400-1.700 euros mensuales según cargas familiares, y su duración depende de los años cotizados, con un máximo de dos años si acumulas seis años cotizados o más.",
      },
      {
        es: "La combinación real suele ser mejor de lo que parece a corto plazo: una indemnización de seis meses de salario más dos años de paro cubre, sobre el papel, un runway larguísimo. El problema es la certeza y el momento del cobro. La indemnización puede demorarse si hay conciliación o juicio, el paro tarda de dos a cuatro semanas en empezar a pagarse tras la solicitud, y ambos importes suelen ser inferiores al salario neto que dejabas de percibir. Tu colchón personal debe cubrir ese primer mes de incertidumbre y la diferencia entre lo que cobrabas y lo que vas a cobrar, no sustituir por completo estas ayudas.",
      },
    ],
    bullets: [
      {
        es: "Despido improcedente: 33 días de salario por año trabajado, máximo 24 mensualidades.",
        en: "Unfair dismissal: 33 days of salary per year worked, capped at 24 monthly payments.",
      },
      {
        es: "Despido objetivo o por causas económicas: 20 días por año, máximo 12 mensualidades.",
        en: "Objective or economic dismissal: 20 days per year worked, capped at 12 monthly payments.",
      },
      {
        es: "Paro: 70% de la base reguladora los primeros 180 días, 50% después, con topes según cargas familiares.",
        en: "Unemployment benefit: 70% of the reference base for the first 180 days, 50% after that, capped by family dependents.",
      },
      {
        es: "El colchón propio cubre el primer mes sin cobrar nada y la diferencia entre tu salario anterior y las ayudas.",
        en: "Your own cushion covers the first month with no income at all and the gap between your old salary and the benefits.",
      },
    ],
  },
  {
    heading: {
      es: "Cómo alargar tu runway en 30 días sin arruinarte la vida",
      en: "How to extend your runway in 30 days without wrecking your life",
    },
    paragraphs: [
      {
        es: "No hace falta mudarte a un pueblo ni dejar de salir nunca más para ganar meses de runway. Actúa sobre las partidas de mayor impacto y menor sacrificio antes de tocar las que más duelen. En un mes puedes revisar seguros y compararlos (ahorro medio de 100 a 300 euros al año solo en coche y hogar), cancelar suscripciones duplicadas o sin uso (la media de un hogar español paga entre tres y cinco servicios que apenas usa), renegociar la hipoteca variable a fijo si los tipos bajan, o pasar de tarifa de energía sin permanencia a la más barata disponible.",
      },
      {
        es: "El segundo bloque de acciones exige algo más de esfuerzo pero da resultados en semanas: vender objetos que no usas (electrónica, ropa, muebles), activar el modo austero de tu presupuesto (eliminar restaurantes, entregas a domicilio y compras impulsivas durante 30 días), y congelar aportaciones a inversión a largo plazo mientras dure la emergencia, redirigiendo ese dinero al colchón. Ninguna de estas medidas te obliga a cambiar de vivienda ni a renunciar a ingresos futuros, y juntas suelen añadir entre uno y tres meses de runway en cuestión de semanas.",
      },
      {
        es: "El tercer bloque, más drástico, se reserva para cuando el runway baja de dos meses: subarrendar una habitación, pedir un adelanto de nómina, aceptar trabajo temporal aunque no sea tu sector, o negociar con el banco una carencia de capital en la hipoteca durante unos meses. Son medidas de emergencia real, no de optimización habitual, y conviene tenerlas identificadas de antemano para no perder tiempo decidiendo cuando el reloj ya corre en tu contra.",
      },
    ],
    bullets: [
      {
        es: "Semana 1: compara y cancela seguros y suscripciones innecesarias.",
        en: "Week 1: compare and cancel unnecessary insurance policies and subscriptions.",
      },
      {
        es: "Semana 2: activa el modo austero de gasto variable durante 30 días.",
        en: "Week 2: switch to austerity mode on variable spending for 30 days.",
      },
      {
        es: "Semana 3: vende lo que no usas y congela aportaciones a inversión a largo plazo.",
        en: "Week 3: sell what you do not use and pause long-term investment contributions.",
      },
      {
        es: "Semana 4: si el runway sigue bajo dos meses, valora medidas de emergencia real (subarriendo, adelanto de nómina, carencia hipotecaria).",
        en: "Week 4: if runway is still under two months, consider real emergency measures (subletting, salary advance, mortgage payment holiday).",
      },
    ],
  },
  {
    heading: {
      es: "El error de invertir el colchón en bolsa (y por qué te sale caro)",
      en: "The mistake of investing your cushion in stocks (and why it costs you)",
    },
    paragraphs: [
      {
        es: "Meter el runway en un fondo indexado o en acciones parece rentable sobre el papel: el S&P 500 ha rentado de media un 10% anual histórico, muy por encima del 2-3% de una cuenta remunerada. El problema no es la rentabilidad media, es la correlación de riesgos. Las caídas de mercado del 20-30% suelen coincidir con recesiones económicas, que son precisamente cuando más probable es que pierdas tu empleo. Es decir: justo cuando más necesitas el colchón, es cuando más vale menos.",
      },
      {
        es: "En la crisis de 2008 el mercado global cayó más del 40% desde máximos, y en el shock del covid en 2020 un 34% en apenas cinco semanas. Alguien que necesitara vender su colchón invertido en esos momentos habría materializado pérdidas justo en el peor momento posible, transformando dinero destinado a sobrevivir en una pérdida permanente de capital. El colchón no está para batir a la inflación: está para estar entero el día que lo necesites, sea cual sea el estado del mercado ese día.",
      },
      {
        es: "La solución no es elegir entre rentabilidad y seguridad, es separar los propósitos: el runway va en activos líquidos y estables (cuenta remunerada, fondo monetario, letras), y el resto de tu ahorro, el que no vas a necesitar en los próximos doce meses pase lo que pase, va a inversión a largo plazo. Mezclar ambos objetivos en la misma cartera es la razón por la que mucha gente vende en el peor momento: no vende porque quiera, vende porque necesita el dinero para vivir y el mercado eligió ese mes para caer un 30%.",
      },
    ],
  },
  {
    heading: {
      es: "Runway para emprender o cambiar de carrera: cuánto necesitas de verdad",
      en: "Runway to start a business or change careers: how much you really need",
    },
    paragraphs: [
      {
        es: "Dejar un empleo estable para emprender o para formarte en una nueva profesión exige un runway distinto al de una simple red de seguridad: aquí el objetivo no es sobrevivir a un imprevisto, es financiar un periodo sin ingresos que planificas tú mismo. La regla informal del sector es de doce a dieciocho meses de gasto de supervivencia, porque la mayoría de negocios tarda entre nueve y catorce meses en generar ingresos estables, y una recolocación tras una formación intensiva suele llevar de tres a seis meses adicionales de búsqueda activa.",
      },
      {
        es: "Antes de dar el salto, calcula tres escenarios: el optimista (ingresos a los seis meses), el realista (a los doce) y el pesimista (nada en dieciocho meses, momento en el que necesitas un plan B). Si tu runway solo cubre el escenario optimista, no estás preparado para emprender, estás apostando. Muchos negocios viables mueren no porque la idea fuera mala, sino porque el fundador se quedó sin colchón en el mes diez, justo antes de que las ventas empezaran a despegar.",
      },
      {
        es: "Una estrategia intermedia que reduce el riesgo es el runway parcial: mantener un ingreso de transición (trabajo a tiempo parcial, freelance ocasional, un cliente ancla) que cubra el gasto de supervivencia mientras desarrollas el proyecto o completas la formación. Esto estira tu colchón real varias veces, porque no lo consumes al ritmo del gasto total sino solo en la diferencia entre lo que ingresas y lo que gastas, y reduce la presión psicológica de ver la cuenta bajar cada mes sin ningún ingreso que la compense.",
      },
    ],
    bullets: [
      {
        es: "Emprender: doce a dieciocho meses de gasto de supervivencia como referencia general.",
        en: "Starting a business: twelve to eighteen months of survival spending as a general benchmark.",
      },
      {
        es: "Cambio de carrera con formación intensiva: seis a nueve meses, sumando tiempo de estudio y de búsqueda posterior.",
        en: "Career change with intensive training: six to nine months, adding study time plus the following job search.",
      },
      {
        es: "Calcula escenario optimista, realista y pesimista antes de decidir la fecha de salida.",
        en: "Model an optimistic, realistic and pessimistic scenario before deciding your exit date.",
      },
      {
        es: "El runway parcial con ingreso de transición estira el colchón varias veces frente a vivir sin ningún ingreso.",
        en: "Partial runway with a transition income stretches your cushion several times over compared to living with zero income.",
      },
    ],
  },
  {
    heading: {
      es: "Cómo reconstruir el runway después de haberlo usado",
      en: "How to rebuild your runway after using it",
    },
    paragraphs: [
      {
        es: "Haber consumido el colchón no es un fracaso, es exactamente para lo que estaba ahí. El error viene después, si no lo reconstruyes con la misma disciplina con la que lo creaste la primera vez. En cuanto vuelvas a tener ingresos estables, trata la reposición del runway como una deuda prioritaria, al mismo nivel que un préstamo, y automatiza una transferencia mensual fija hasta recuperar al menos el nivel mínimo para tu perfil (tres a seis meses según los criterios anteriores).",
      },
      {
        es: "Reconstruir suele ser más rápido que la primera vez porque ya conoces tu gasto real con precisión, ya tienes montada la cuenta o el fondo donde guardarlo y probablemente hayas ajustado gastos durante la crisis que no vuelves a reactivar del todo. Aprovecha ese gasto reducido: si vivías con 2.300 euros al mes y durante la emergencia bajaste a 1.900, mantener parte de ese recorte mientras reconstruyes el colchón puede recuperar seis meses de runway en la mitad de tiempo que tardaste la primera vez.",
      },
      {
        es: "Por último, documenta qué pasó: cuánto tiempo estuviste sin ingresos, qué gastos resultaron innegociables, qué imprevistos no habías anticipado y cuánto tardaste en recolocarte o en generar ingresos de nuevo. Esa información vale más que cualquier cifra genérica de un artículo: es tu propio dato histórico, y te permite ajustar tu runway objetivo a un número basado en tu experiencia real, no en una media que quizá no se ajuste a tu situación ni a tu sector.",
      },
    ],
  },
];

export default sections;
