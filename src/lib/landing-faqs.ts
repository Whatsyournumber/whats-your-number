export interface LandingFaq {
  q: { es: string; en: string };
  a: { es: string; en: string };
}

export const HOME_FAQS: LandingFaq[] = [
  {
    q: {
      es: "¿Qué significa 'cuál es tu número para retiro'?",
      en: "What does 'what is your number for retirement' mean?",
    },
    a: {
      es: "Es la cantidad de patrimonio que necesitas para cubrir tus gastos de por vida sin depender de un salario. WhatsYournumber calcula ese número basado en tu estilo de vida, gastos, ingresos e inversiones.",
      en: "It's the net worth you need to cover your living expenses for life without relying on a paycheck. WhatsYournumber calculates that number based on your lifestyle, expenses, income, and investments.",
    },
  },
  {
    q: {
      es: "¿Cómo funciona la calculadora de libertad financiera?",
      en: "How does the financial freedom calculator work?",
    },
    a: {
      es: "Conectas o cargas manualmente tus gastos e ingresos, añades tu patrimonio e inversiones, y la IA proyecta cuánto necesitas ahorrar cada mes para alcanzar tu libertad financiera.",
      en: "You connect or manually enter your expenses and income, add your net worth and investments, and the AI projects how much you need to save each month to reach financial freedom.",
    },
  },
  {
    q: {
      es: "¿Es gratis usar WhatsYournumber?",
      en: "Is WhatsYournumber free to use?",
    },
    a: {
      es: "Sí. El plan FREE incluye tu número de retiro, control de gastos e ingresos, y patrimonio básico. Los planes PRO y FAMILY desbloquean IA, comparador de costo de vida, universidades y el plan familiar.",
      en: "Yes. The FREE plan includes your retirement number, income and expense tracking, and basic net worth. PRO and FAMILY plans unlock AI, cost-of-living comparison, university planning, and the family plan.",
    },
  },
  {
    q: {
      es: "¿Qué tan seguros están mis datos financieros?",
      en: "How secure are my financial data?",
    },
    a: {
      es: "Tus datos se almacenan cifrados en la base de datos, solo tú puedes acceder a ellos mediante autenticación segura. No vendemos ni compartimos tu información.",
      en: "Your data is stored encrypted in the database, and only you can access it through secure authentication. We do not sell or share your information.",
    },
  },
  {
    q: {
      es: "¿Puedo usar WhatsYournumber para toda mi familia?",
      en: "Can I use WhatsYournumber for my whole family?",
    },
    a: {
      es: "Sí. El plan Familiar incluye perfiles para tus hijos con My First Number: aprenden a ahorrar, gestionan tareas y mesada, y proyectan su patrimonio a los 18 años.",
      en: "Yes. The Family plan includes profiles for your kids with My First Number: they learn to save, manage chores and allowance, and project their wealth at age 18.",
    },
  },
];

export const KIDS_FAQS: LandingFaq[] = [
  {
    q: {
      es: "¿Qué es My First Number y cómo enseña finanzas a los niños?",
      en: "What is My First Number and how does it teach kids about money?",
    },
    a: {
      es: "My First Number es la versión infantil de WhatsYournumber. Ayuda a los niños a entender el ahorro, la mesada y las tareas mientras los padres proyectan su patrimonio futuro.",
      en: "My First Number is the kids' version of WhatsYournumber. It helps children understand saving, allowance, and chores while parents project their future wealth.",
    },
  },
  {
    q: {
      es: "¿A qué edad debería empezar a enseñar finanzas a mi hijo?",
      en: "At what age should I start teaching my child about money?",
    },
    a: {
      es: "Cuanto antes mejor. Desde los 4 o 5 años los niños pueden entender conceptos básicos como ahorrar para una meta. La app se adapta a cada edad con tareas y metas adecuadas.",
      en: "The earlier the better. From age 4 or 5, kids can grasp basic concepts like saving for a goal. The app adapts to each age with appropriate chores and goals.",
    },
  },
  {
    q: {
      es: "¿Cómo ayuda la app a mi hijo a ahorrar?",
      en: "How does the app help my child save?",
    },
    a: {
      es: "Los niños crean sueños (una bicicleta, un videojuego, la universidad), completan tareas para ganar mesada y ven cómo crece su dinero con el tiempo gracias a la inversión.",
      en: "Kids create dreams (a bike, a video game, college), complete chores to earn allowance, and see how their money grows over time through investing.",
    },
  },
  {
    q: {
      es: "¿Es segura la app de finanzas para niños?",
      en: "Is the finance app for kids safe?",
    },
    a: {
      es: "Sí. Los padres controlan las cuentas, los movimientos y los permisos. Los niños solo ven su espacio diseñado para ellos, sin acceso a datos bancarios reales.",
      en: "Yes. Parents control accounts, transactions, and permissions. Kids only see their own kid-friendly space, with no access to real banking data.",
    },
  },
  {
    q: {
      es: "¿Cómo funciona la calculadora de ahorro para la universidad de mis hijos?",
      en: "How does the college savings calculator for my children work?",
    },
    a: {
      es: "Ingresas la edad de tu hijo, cuánto puedes aportar mensualmente y el crecimiento esperado. La app calcula cuánto tendrá a los 18 años y a qué universidades podría aplicar.",
      en: "You enter your child's age, how much you can contribute monthly, and expected growth. The app calculates how much they'll have at 18 and which universities they could apply to.",
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
