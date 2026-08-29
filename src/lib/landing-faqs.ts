export interface LandingFaq {
  q: { es: string; en: string };
  a: { es: string; en: string };
}

export const HOME_FAQS: LandingFaq[] = [
  {
    q: {
      es: "¿Cuál es tu número para retiro y cómo se calcula?",
      en: "What is your number for retirement and how is it calculated?",
    },
    a: {
      es: "Tu número para retiro es el patrimonio que necesitas para cubrir tus gastos de por vida sin depender de un salario. WhatsYournumber lo calcula con tus gastos e ingresos, tu patrimonio y tus inversiones, y te muestra en qué año lo alcanzas.",
      en: "Your number for retirement is the net worth you need to cover your living expenses for life without relying on a paycheck. WhatsYournumber calculates it from your income and expenses, your net worth, and your investments, and shows the year you reach it.",
    },
  },
  {
    q: {
      es: "¿Cómo funciona la calculadora de libertad financiera?",
      en: "How does the financial freedom calculator work?",
    },
    a: {
      es: "Cargas o conectas tus movimientos, defines tu estilo de vida y la calculadora de libertad financiera proyecta cuánto necesitas ahorrar e invertir cada mes para llegar a tu número antes de lo que crees.",
      en: "You upload or connect your transactions, define your lifestyle, and the financial freedom calculator projects how much you need to save and invest each month to hit your number sooner than you think.",
    },
  },
  {
    q: {
      es: "¿Sirve como control de gastos e ingresos mensual?",
      en: "Does it work as a personal income and expense tracker?",
    },
    a: {
      es: "Sí. Tienes control de gastos e ingresos con categorización automática por IA, carga manual o desde estados de cuenta, y un flujo de caja mensual que se conecta directamente con tu número de retiro.",
      en: "Yes. It works as a personal income and expense tracker with AI auto-categorization, manual entry or statement upload, and a monthly cash flow that feeds directly into your retirement number.",
    },
  },
  {
    q: {
      es: "¿Incluye calculadora de patrimonio y jubilación?",
      en: "Does it include a net worth and retirement calculator?",
    },
    a: {
      es: "Sí. La calculadora de patrimonio y jubilación suma tus activos, propiedades e inversiones, resta tus deudas y proyecta tu patrimonio neto año a año hasta la edad en la que quieres retirarte.",
      en: "Yes. The net worth and retirement calculator adds up your assets, properties and investments, subtracts your debts, and projects your net worth year by year until the age you want to retire.",
    },
  },
  {
    q: {
      es: "¿Puedo seguir mis inversiones y comparar el costo de vida entre ciudades?",
      en: "Can I track my investments and compare the cost of living between cities?",
    },
    a: {
      es: "Sí. El seguimiento de inversiones y patrimonio muestra tus posiciones con precios en tiempo real, y el comparador de costo de vida calcula cuánto necesitarías en otra ciudad para mantener tu mismo estilo de vida.",
      en: "Yes. The investment and net worth tracker shows your positions with real-time prices, and the cost-of-living comparison calculates how much you'd need in another city to keep the same lifestyle.",
    },
  },
  {
    q: {
      es: "¿Funciona para finanzas personales para familias?",
      en: "Does it work as personal finance for families?",
    },
    a: {
      es: "Sí. El plan Familiar está pensado para finanzas personales para familias: perfiles para tu pareja e hijos con My First Number, metas compartidas y planificación de la universidad de tus hijos.",
      en: "Yes. The Family plan is built for personal finance for families: profiles for your partner and kids with My First Number, shared goals, and planning for your children's college.",
    },
  },
];

export const KIDS_FAQS: LandingFaq[] = [
  {
    q: {
      es: "¿Qué es My First Number, la app de finanzas para niños?",
      en: "What is My First Number, the finance app for kids?",
    },
    a: {
      es: "My First Number es la app de finanzas para niños de WhatsYournumber: enseña educación financiera para niños con metas de ahorro, mesada y tareas, mientras los padres proyectan su patrimonio a los 18 años.",
      en: "My First Number is WhatsYournumber's finance app for kids: it teaches children financial literacy with savings goals, allowance and chores, while parents project their wealth at age 18.",
    },
  },
  {
    q: {
      es: "¿A qué edad empezar con la educación financiera para niños?",
      en: "At what age should kids' financial education start?",
    },
    a: {
      es: "Cuanto antes mejor. Desde los 4 o 5 años ya pueden entender ahorrar para una meta. La app adapta la educación financiera para niños a cada edad, con tareas y objetivos apropiados.",
      en: "The earlier the better. From age 4 or 5 they already grasp saving for a goal. The app adapts kids' financial education to each age with age-appropriate chores and goals.",
    },
  },
  {
    q: {
      es: "¿Cómo enseñar a ahorrar a los niños con la app?",
      en: "How do you teach kids to save with the app?",
    },
    a: {
      es: "Enseñar a ahorrar a los niños se vuelve un juego: crean sus sueños (una bicicleta, un viaje, la universidad), los dividen en aportes y ven cómo el interés compuesto hace crecer su dinero.",
      en: "Teaching kids to save becomes a game: they create dreams (a bike, a trip, college), split them into contributions, and watch compound interest grow their money.",
    },
  },
  {
    q: {
      es: "¿Cómo funciona la app de mesada y tareas para niños?",
      en: "How does the allowance and chores app for kids work?",
    },
    a: {
      es: "En la app de mesada y tareas para niños los padres asignan tareas con su recompensa, el niño las marca como hechas y la mesada se acumula automáticamente en su ahorro o en su cartera de inversión.",
      en: "In the allowance and chores app for kids, parents assign tasks with a reward, the child marks them done, and the allowance automatically flows into their savings or investment portfolio.",
    },
  },
  {
    q: {
      es: "¿Cómo funciona la calculadora de ahorro para hijos?",
      en: "How does the savings calculator for children work?",
    },
    a: {
      es: "La calculadora de ahorro para hijos toma la edad de tu hijo, tu aporte mensual y un rendimiento esperado (por ejemplo el 10% histórico del S&P 500) y proyecta cuánto tendrá a los 18 años.",
      en: "The savings calculator for children takes your child's age, your monthly contribution, and an expected return (for example the S&P 500's historical 10%) and projects how much they'll have at 18.",
    },
  },
  {
    q: {
      es: "¿Incluye calculadora de ahorro para la universidad de los hijos?",
      en: "Does it include a college savings calculator for children?",
    },
    a: {
      es: "Sí. La calculadora de ahorro para universidad de los hijos compara tu proyección con el costo real de cientos de universidades y te muestra a cuáles podría aplicar tu hijo con su número.",
      en: "Yes. The college savings calculator for children compares your projection with the real cost of hundreds of universities and shows which ones your child could afford with their number.",
    },
  },
];

export function buildLandingFaqJsonLd(faqs: LandingFaq[], lang: "es" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q[lang],
      acceptedAnswer: { "@type": "Answer", text: f.a[lang] },
    })),
  };
}
