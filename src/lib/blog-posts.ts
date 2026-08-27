import netWorthImg from "@/assets/blog/net-worth.jpg";
import runwayImg from "@/assets/blog/runway.jpg";
import benchmarkImg from "@/assets/blog/benchmark.jpg";
import aiExpensesImg from "@/assets/blog/ai-expenses.jpg";
import freedomImg from "@/assets/blog/freedom-number.jpg";
import reviewImg from "@/assets/blog/review.jpg";
import netWorth2Img from "@/assets/blog/net-worth-2.jpg";
import runway2Img from "@/assets/blog/runway-2.jpg";
import benchmark2Img from "@/assets/blog/benchmark-2.jpg";
import aiExpenses2Img from "@/assets/blog/ai-expenses-2.jpg";
import freedom2Img from "@/assets/blog/freedom-number-2.jpg";
import review2Img from "@/assets/blog/review-2.jpg";
import richVsWealthyImg from "@/assets/blog/rich-vs-wealthy.jpg";
import richVsWealthy2Img from "@/assets/blog/rich-vs-wealthy-2.jpg";
import kids100kImg from "@/assets/blog/kids-sp500-100k.jpg";
import kids100k2Img from "@/assets/blog/kids-sp500-100k-2.jpg";
import boringCoverImg from "@/assets/blog/boring-business-cover.jpg";
import boring2Img from "@/assets/blog/boring-business-2.jpg";
import boringAgencyImg from "@/assets/blog/boring-agency.jpg";
import boringVendingImg from "@/assets/blog/boring-vending.jpg";
import boringFlipImg from "@/assets/blog/boring-house-flipping.jpg";
import boringLaundryImg from "@/assets/blog/boring-laundromat.jpg";
import boringStorageImg from "@/assets/blog/boring-self-storage.jpg";

export type BlogSubsection = {
  heading: { es: string; en: string };
  paragraphs?: { es: string; en: string }[];
  bullets?: { es: string; en: string }[];
};

export type BlogSection = {
  heading: { es: string; en: string };
  paragraphs: { es: string; en: string }[];
  bullets?: { es: string; en: string }[];
  /** Optional in-section illustration (rendered after the paragraphs). */
  image?: string;
  imageAlt?: { es: string; en: string };
  imageCaption?: { es: string; en: string };
  /** Optional H3 blocks rendered after the section body. */
  subsections?: BlogSubsection[];
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
    slug: "boring-business-comprar-libertad-financiera",
    image: boringCoverImg,
    imageAlt: {
      es: "Emprendedor con las llaves de un pequeño negocio local al atardecer, ejemplo de boring business que genera flujo de caja",
      en: "Entrepreneur holding the keys of a small local business at dusk, an example of a boring business that generates cash flow",
    },
    keyword: { es: "boring business", en: "boring business" },
    toc: true,
    readMinutes: 14,
    tag: { es: "Business ideas", en: "Business ideas" },
    date: { es: "27 ago 2026", en: "Aug 27, 2026" },
    title: {
      es: "Los 5 boring businesses que puedes comprar para alcanzar tu libertad financiera (empezando con poco dinero)",
      en: "The 5 boring businesses you can buy to reach financial freedom (starting with little money)",
    },
    excerpt: {
      es: "Agencia de ventas, vending especializado, house flipping, lavanderías y self storage: capital inicial, tiempo, potencial mensual y cómo modernizarlos con IA para acercar tu número de libertad financiera.",
      en: "Sales agency, specialized vending, house flipping, laundromats and self storage: upfront capital, timeline, monthly potential and how to modernize them with AI to bring your freedom number closer.",
    },
    intro: {
      es: "Mientras las redes hablan de crear la próxima startup unicornio o de hacerse millonario con criptomonedas, existe otra forma de construir riqueza mucho más silenciosa y mucho más predecible: los boring businesses. Negocios sencillos, poco glamurosos, con flujo de caja constante, clientes recurrentes, demanda estable y fáciles de automatizar. Lo mejor es que no necesitas inventarlos: la verdadera oportunidad está en comprar negocios que ya facturan, cuyos dueños se acercan a la jubilación, y modernizarlos con tecnología e inteligencia artificial. Esa estrategia se llama Entrepreneurship Through Acquisition (ETA) y cada vez es más popular en Estados Unidos y Europa. En este artículo verás cinco negocios concretos, cuánto capital necesitas, cuánto tardan en dar dinero y cómo cada uno de ellos reduce los años que te separan de tu libertad financiera.",
      en: "While social media obsesses over the next unicorn startup or getting rich with crypto, there is a much quieter and far more predictable way to build wealth: boring businesses. Simple, unglamorous businesses with steady cash flow, recurring customers, stable demand and easy automation. The best part is you do not need to invent them: the real opportunity is buying businesses that already generate revenue from owners approaching retirement, then modernizing them with technology and AI. That strategy is called Entrepreneurship Through Acquisition (ETA) and it keeps growing in the US and Europe. In this article you will see five concrete businesses, how much capital you need, how long they take to pay off and how each one cuts the years between you and financial freedom.",
    },
    sections: [
      {
        heading: { es: "Qué es un boring business y por qué funciona", en: "What a boring business is and why it works" },
        paragraphs: [
          {
            es: "Un boring business es un negocio que nadie presume en redes sociales pero que cobra todos los meses: una lavandería, un taller, una empresa de limpieza, una ruta de vending, un self storage. No hay hype, no hay ronda de inversión y no hay que educar al mercado. Alguien ya paga por ese servicio desde hace veinte años y seguirá pagando el mes que viene.",
            en: "A boring business is one nobody brags about online but that collects money every month: a laundromat, a repair shop, a cleaning company, a vending route, a self-storage facility. No hype, no funding round, no need to educate the market. Someone has been paying for that service for twenty years and will keep paying next month.",
          },
          {
            es: "Esa previsibilidad es exactamente lo que un inversor busca. En una startup el riesgo principal es que el producto no interese a nadie. En un boring business rentable el riesgo es operativo: gestionarlo mal. El primero es un riesgo que no controlas; el segundo sí.",
            en: "That predictability is exactly what an investor wants. In a startup the main risk is that nobody wants the product. In a profitable boring business the risk is operational: running it badly. The first risk is outside your control; the second one is not.",
          },
        ],
        bullets: [
          { es: "Flujo de caja constante y clientes recurrentes.", en: "Steady cash flow and recurring customers." },
          { es: "Demanda estable, poco dependiente de modas.", en: "Stable demand, barely affected by trends." },
          { es: "Fácil de automatizar con software e IA.", en: "Easy to automate with software and AI." },
          { es: "Posibilidad de crecer y comprar el siguiente durante décadas.", en: "Room to grow and buy the next one for decades." },
        ],
      },
      {
        heading: { es: "Por qué ahora es el mejor momento para comprar", en: "Why now is the best moment to buy" },
        paragraphs: [
          {
            es: "Durante los próximos años, millones de pequeños empresarios alcanzarán la edad de jubilación. Muchos tienen negocios rentables que funcionan desde hace 20 o 30 años y no tienen a quién dejárselos: sus hijos no quieren continuar, nunca digitalizaron el negocio, no usan IA, no tienen presencia online y gestionan todo de forma manual, muchas veces en papel.",
            en: "Over the coming years, millions of small business owners will reach retirement age. Many run profitable businesses built over 20 or 30 years with nobody to hand them to: their children do not want to continue, they never digitized, they use no AI, they have no online presence and they run everything manually, often on paper.",
          },
          {
            es: "Ahí está la oportunidad. No necesitas reinventar el negocio: solo hacerlo un 10 o un 20 % mejor. Una web decente, reseñas en Google, pago con móvil, un CRM y precios revisados suelen bastar para mover el beneficio de forma notable en el primer año.",
            en: "That is the opportunity. You do not need to reinvent the business: you only need to make it 10 or 20% better. A decent website, Google reviews, mobile payments, a CRM and revised prices are usually enough to move profit meaningfully in the first year.",
          },
        ],
      },
      {
        heading: { es: "La estrategia: generar caja, comprar, automatizar, repetir", en: "The strategy: generate cash, buy, automate, repeat" },
        paragraphs: [
          {
            es: "La secuencia es sencilla y funciona igual con 500 € que con 500.000 €: generas flujo de caja con un negocio barato de arrancar, compras un pequeño negocio existente, lo automatizas, aumentas beneficios y usas esa caja para comprar el siguiente. Así es como muchas personas construyen patrimonios importantes sin haber lanzado nunca un producto nuevo.",
            en: "The sequence is simple and works the same with €500 or €500,000: you generate cash flow with a cheap-to-start business, buy a small existing business, automate it, increase profits and use that cash to buy the next one. That is how many people build serious wealth without ever launching a new product.",
          },
          {
            es: "Lo importante es el orden. Empezar por el negocio caro sin saber vender es la forma más rápida de quedarte sin capital. Empezar por el que te enseña a vender es la forma más rápida de financiar todos los demás.",
            en: "Order matters. Starting with the expensive business before you know how to sell is the fastest way to run out of capital. Starting with the one that teaches you to sell is the fastest way to fund all the others.",
          },
        ],
        bullets: [
          { es: "1. Generar flujo de caja con un negocio de bajo capital.", en: "1. Generate cash flow with a low-capital business." },
          { es: "2. Comprar un pequeño negocio ya rentable.", en: "2. Buy a small business that is already profitable." },
          { es: "3. Automatizarlo y digitalizarlo con IA.", en: "3. Automate and digitize it with AI." },
          { es: "4. Aumentar beneficios y márgenes.", en: "4. Increase profit and margins." },
          { es: "5. Reinvertir esa caja en el siguiente negocio.", en: "5. Reinvest that cash into the next business." },
        ],
      },
      {
        heading: { es: "1. Agencia de growth marketing (solo ventas)", en: "1. Growth marketing agency (sales only)" },
        image: boringAgencyImg,
        imageAlt: {
          es: "Emprendedor con auriculares cerrando una venta desde su portátil para su agencia de growth marketing",
          en: "Entrepreneur with a headset closing a sale from his laptop for his growth marketing agency",
        },
        imageCaption: {
          es: "Inversión inicial: 0–500 USD. El único activo que necesitas es aprender a vender.",
          en: "Upfront investment: $0–500. The only asset you need is learning how to sell.",
        },
        paragraphs: [
          {
            es: "Inversión: 0–500 USD. Si hoy empezara desde cero, este sería mi primer negocio. No necesitas empleados, ni diseñadores, ni programadores, ni ejecutar campañas. Solo necesitas conseguir clientes. Miles de agencias buscan personas capaces de traer negocio y pagan comisión recurrente por ello.",
            en: "Investment: $0–500. If I started from scratch today, this would be my first business. No employees, no designers, no developers, no campaigns to run. You only need to bring clients. Thousands of agencies are looking for people who can source business and pay a recurring commission for it.",
          },
          {
            es: "Tú consigues el cliente, la agencia presta el servicio y tú cobras cada mes mientras el cliente siga activo. Con apenas 10 clientes puedes generar entre 3.000 y 8.000 USD mensuales según el tipo de servicio. Tiempo estimado hasta ingresos estables: de 3 a 9 meses.",
            en: "You bring the client, the agency delivers the service and you get paid monthly while the client stays. With just 10 clients you can generate $3,000–8,000 a month depending on the service. Estimated time to stable income: 3 to 9 months.",
          },
        ],
        bullets: [
          { es: "Puedes especializarte en SEO, Google Ads, Meta Ads, IA, desarrollo web, automatizaciones o CRM.", en: "You can specialize in SEO, Google Ads, Meta Ads, AI, web development, automation or CRM." },
          { es: "Aprendes la habilidad más importante de cualquier empresario: vender.", en: "You learn the single most important skill of any entrepreneur: selling." },
          { es: "Caso típico: un fundador, un portátil, LinkedIn, email y mucha prospección antes de contratar a nadie.", en: "Typical case: one founder, a laptop, LinkedIn, email and a lot of prospecting before hiring anyone." },
        ],
      },
      {
        heading: { es: "2. Máquinas expendedoras especializadas (vending)", en: "2. Specialized vending machines" },
        image: boringVendingImg,
        imageAlt: {
          es: "Máquina expendedora especializada en un gimnasio con proteínas y bebidas, con pago contactless",
          en: "Specialized vending machine in a gym selling protein and drinks with contactless payment",
        },
        imageCaption: {
          es: "Inversión inicial: 2.000–8.000 USD. La especialización sube el ticket y baja la competencia.",
          en: "Upfront investment: $2,000–8,000. Specialization raises the ticket and lowers competition.",
        },
        paragraphs: [
          {
            es: "Inversión: 2.000–8.000 USD. Olvídate de la típica máquina de refrescos: hoy el dinero está en especializarse por ubicación. Gimnasios (proteína, creatina, aminoácidos, bebidas energéticas, barritas), hoteles (cargadores, adaptadores, snacks premium, kits de viaje), hospitales (higiene, café, agua), mascotas (snacks, bolsas, juguetes, pelotas), clubes deportivos (pelotas, toallas, isotónicas) y playas (protector solar, gafas, agua, toallas).",
            en: "Investment: $2,000–8,000. Forget the classic soda machine: today the money is in specializing by location. Gyms (protein, creatine, amino acids, energy drinks, bars), hotels (chargers, adapters, premium snacks, travel kits), hospitals (hygiene, coffee, water), pet spots (treats, bags, toys, balls), sports clubs (balls, towels, isotonic drinks) and beaches (sunscreen, sunglasses, water, towels).",
          },
          {
            es: "La especialización permite mayor ticket medio, menos competencia y mayor margen. Tiempo hasta ingresos estables: 6–18 meses. Puedes comprar máquinas ya instaladas con contrato de ubicación, que es la parte difícil del negocio.",
            en: "Specialization means a higher average ticket, less competition and better margins. Time to stable income: 6–18 months. You can buy machines that already have a location contract, which is the hard part of this business.",
          },
        ],
        subsections: [
          {
            heading: { es: "Cómo aumentar los beneficios", en: "How to increase profits" },
            bullets: [
              { es: "Pago con tarjeta y pago móvil en todas las máquinas.", en: "Card and mobile payments on every machine." },
              { es: "Cámaras inteligentes y control remoto de inventario.", en: "Smart cameras and remote inventory control." },
              { es: "IA para prever reposiciones y evitar rutas vacías.", en: "AI to forecast restocks and avoid empty routes." },
              { es: "Precios por ubicación en lugar de un precio único.", en: "Location-based pricing instead of a single price." },
            ],
          },
        ],
      },
      {
        heading: { es: "3. House flipping", en: "3. House flipping" },
        image: boringFlipImg,
        imageAlt: {
          es: "Inversor y contratista revisando planos en una vivienda en reforma para house flipping",
          en: "Investor and contractor reviewing plans inside a house being renovated for flipping",
        },
        imageCaption: {
          es: "Inversión variable: puedes empezar con financiación bancaria o socios.",
          en: "Variable investment: you can start with bank financing or partners.",
        },
        paragraphs: [
          {
            es: "Muchos creen que el negocio consiste en reformar casas. No: el negocio consiste en comprar bien. La reforma solo materializa el valor que ya estaba en el precio de compra. La rentabilidad está en detectar oportunidades que otros no ven: herencias, divorcios, adjudicaciones bancarias, propiedades muy deterioradas y zonas en crecimiento.",
            en: "Many think the business is renovating houses. It is not: the business is buying well. The renovation only unlocks value that was already in the purchase price. The return comes from spotting deals others miss: inheritances, divorces, bank repossessions, badly deteriorated properties and up-and-coming areas.",
          },
          {
            es: "La rentabilidad habitual está entre el 15 % y el 30 % por operación, con un ciclo de 12 a 24 meses si cuentas búsqueda, obra y venta. Es el negocio menos pasivo de la lista y el que más capital inmoviliza, pero también el que más rápido puede multiplicar una operación bien comprada.",
            en: "Typical returns run between 15% and 30% per deal, with a 12 to 24 month cycle once you count sourcing, works and sale. It is the least passive business on the list and the one that locks up the most capital, but also the one where a well-bought deal compounds fastest.",
          },
        ],
        bullets: [
          { es: "El margen se gana el día que compras, no el día que vendes.", en: "The margin is earned the day you buy, not the day you sell." },
          { es: "Presupuesta la obra con un 20 % de colchón: siempre aparece algo.", en: "Budget works with a 20% buffer: something always shows up." },
          { es: "Referencia conocida: Tarek El Moussa empezó comprando y reformando viviendas tras la crisis de 2008 y convirtió esa estrategia en una empresa inmobiliaria.", en: "A known reference: Tarek El Moussa started buying and renovating homes after the 2008 crash and turned that strategy into a real estate company." },
        ],
      },
      {
        heading: { es: "4. Lavanderías automáticas", en: "4. Self-service laundromats" },
        image: boringLaundryImg,
        imageAlt: {
          es: "Interior de una lavandería automática moderna con cliente pagando desde el móvil",
          en: "Interior of a modern self-service laundromat with a customer paying from his phone",
        },
        imageCaption: {
          es: "Inversión inicial: 40.000–150.000 USD. El cliente paga antes de usar el servicio.",
          en: "Upfront investment: $40,000–150,000. The customer pays before using the service.",
        },
        paragraphs: [
          {
            es: "Inversión: 40.000–150.000 USD. Es uno de los negocios favoritos de muchos inversores porque prácticamente funciona solo: los clientes pagan antes de usar el servicio, no hay inventario complicado, no hay cuentas por cobrar y casi todo puede automatizarse. Tiempo hasta madurar: 12–24 meses.",
            en: "Investment: $40,000–150,000. It is a favorite among investors because it practically runs itself: customers pay before using the service, there is no complex inventory, no accounts receivable and almost everything can be automated. Time to maturity: 12–24 months.",
          },
          {
            es: "La jugada inteligente no es montar una desde cero, sino comprar una lavandería cuyo propietario quiera jubilarse. Muchas veces ni siquiera necesitas cambiar las máquinas: solo mejorar la gestión.",
            en: "The smart move is not building one from scratch but buying a laundromat whose owner wants to retire. Often you do not even need to replace the machines: you just need better management.",
          },
        ],
        subsections: [
          {
            heading: { es: "Cómo modernizar una lavandería antigua", en: "How to modernize an old laundromat" },
            bullets: [
              { es: "Pago desde el móvil y reservas online.", en: "Mobile payments and online booking." },
              { es: "Cámaras con IA y sensores de mantenimiento predictivo.", en: "AI cameras and predictive maintenance sensors." },
              { es: "Precios dinámicos por franja horaria.", en: "Dynamic pricing by time slot." },
              { es: "Google Reviews automatizadas, CRM y programa de fidelización.", en: "Automated Google reviews, CRM and a loyalty program." },
            ],
          },
        ],
      },
      {
        heading: { es: "5. Self storage (el bonus para cuando ya tienes caja)", en: "5. Self storage (the bonus once you already have cash)" },
        image: boringStorageImg,
        imageAlt: {
          es: "Instalación moderna de self storage con puertas naranjas y acceso mediante código QR al atardecer",
          en: "Modern self-storage facility with orange doors and QR code access at dusk",
        },
        imageCaption: {
          es: "Inversión inicial: 150.000 USD o más. Probablemente el negocio más pasivo de la lista.",
          en: "Upfront investment: $150,000 or more. Probably the most passive business on the list.",
        },
        paragraphs: [
          {
            es: "Inversión: 150.000 USD o más. No lo usaría para empezar; lo compraría cuando ya dispusiera de flujo de caja. Es probablemente uno de los negocios más pasivos del mundo: los clientes pagan mensualmente, las visitas son mínimas, el mantenimiento es reducido y todo puede automatizarse. Horizonte realista: 2–5 años hasta ocupación óptima.",
            en: "Investment: $150,000 or more. I would not use it to start; I would buy it once I already had cash flow. It is probably one of the most passive businesses in the world: customers pay monthly, visits are rare, maintenance is low and everything can be automated. Realistic horizon: 2–5 years to optimal occupancy.",
          },
        ],
        subsections: [
          {
            heading: { es: "Cómo automatizarlo casi por completo", en: "How to automate it almost entirely" },
            bullets: [
              { es: "Acceso mediante QR y cerraduras electrónicas.", en: "QR access and electronic locks." },
              { es: "Aplicación móvil y facturación automática recurrente.", en: "Mobile app and automatic recurring billing." },
              { es: "Cámaras inteligentes y atención al cliente con IA.", en: "Smart cameras and AI customer support." },
            ],
          },
        ],
      },
      {
        heading: { es: "Lo que hacen los mejores inversores", en: "What the best investors actually do" },
        paragraphs: [
          {
            es: "Los mejores empresarios rara vez crean un negocio desde cero. Compran negocios aburridos y rentables y después los automatizan, los digitalizan, mejoran el marketing, incorporan IA, ajustan precios y mejoran la experiencia del cliente. Luego repiten el proceso con la caja que generan.",
            en: "The best operators rarely build from zero. They buy boring, profitable businesses and then automate them, digitize them, improve the marketing, add AI, adjust prices and upgrade the customer experience. Then they repeat the process with the cash it throws off.",
          },
          {
            es: "Ninguno de esos pasos requiere genialidad. Requiere criterio y constancia, que es exactamente lo que falta en la mayoría de negocios que están a la venta ahora mismo.",
            en: "None of those steps requires genius. They require judgment and consistency, which is exactly what is missing in most businesses currently for sale.",
          },
        ],
      },
      {
        heading: { es: "Del negocio a tu número: cómo esto acelera tu libertad financiera", en: "From business to your number: how this speeds up your freedom" },
        paragraphs: [
          {
            es: "El objetivo no es tener un negocio: es construir patrimonio. Cada negocio que compras no es solo una fuente de ingresos, es un activo que se suma a tu patrimonio y una máquina que aumenta tu tasa de ahorro. Y la tasa de ahorro es la variable que más manda sobre los años que te faltan para ser libre.",
            en: "The goal is not owning a business: it is building wealth. Every business you buy is not just income, it is an asset on your balance sheet and a machine that raises your savings rate. And your savings rate is the variable that dominates how many years you still owe the system.",
          },
          {
            es: "Con un gasto de 3.000 € al mes, tu número ronda los 900.000 € al 4 % de retiro seguro. Si tu trabajo te deja ahorrar 1.000 € al mes, tardas décadas. Si un boring business añade 2.000 € netos mensuales y los reinviertes íntegros, el mismo objetivo se acerca más de diez años. Eso es lo que hace el flujo de caja: no te hace rico, te compra tiempo.",
            en: "With €3,000 a month in spending, your number sits around €900,000 at a 4% safe withdrawal rate. If your job lets you save €1,000 a month, it takes decades. If a boring business adds €2,000 net a month and you reinvest all of it, the same goal moves more than ten years closer. That is what cash flow does: it does not make you rich, it buys you time.",
          },
        ],
        bullets: [
          { es: "Empieza con un negocio que puedas lanzar con poco dinero y aprende a vender.", en: "Start with a business you can launch cheaply and learn how to sell." },
          { es: "Reinvierte cada euro de beneficio en lugar de subir tu nivel de vida.", en: "Reinvest every euro of profit instead of upgrading your lifestyle." },
          { es: "Compra un negocio existente y modernízalo con tecnología e IA.", en: "Buy an existing business and modernize it with technology and AI." },
          { es: "Usa esa caja para adquirir el siguiente y repite el ciclo.", en: "Use that cash to acquire the next one and repeat the cycle." },
        ],
      },
    ],
    takeaway: {
      es: "No necesitas la próxima gran idea: necesitas activos que generen caja. Empieza por el negocio que te enseña a vender, reinvierte todo, compra el siguiente y mide cada mes cuántos años le quitas a tu número de libertad financiera.",
      en: "You do not need the next big idea: you need assets that generate cash. Start with the business that teaches you to sell, reinvest everything, buy the next one and measure every month how many years you shave off your freedom number.",
    },
  },

  {
    slug: "100k-hijo-18-anos-sp500",
    image: kids100kImg,
    imageAlt: {
      es: "Padre e hija pequeña frente a un portátil con la curva ascendente del S&P 500 y una hucha sobre la mesa",
      en: "Father and young daughter in front of a laptop showing a rising S&P 500 chart with a piggy bank on the table",
    },
    keyword: { es: "ahorrar para tus hijos e invertir en el S&P 500", en: "investing for kids in the S&P 500" },
    toc: true,
    readMinutes: 13,
    tag: { es: "Finanzas para niños", en: "Kids & money" },
    date: { es: "27 ago 2026", en: "Aug 27, 2026" },
    title: {
      es: "Cómo conseguir que tu hijo tenga 100.000 € a los 18 años invirtiendo en el S&P 500",
      en: "How to give your child €100,000 by age 18 by investing in the S&P 500",
    },
    excerpt: {
      es: "Con 210 € al mes desde que nace, un índice global y cero intervenciones, tu hijo llega a los 18 con seis cifras. Aquí están los números, los años y los errores que lo arruinan.",
      en: "With €210 a month from birth, one index fund and zero meddling, your child hits six figures at 18. Here are the numbers, the years and the mistakes that ruin it.",
    },
    intro: {
      es: "Regalar dinero a un hijo es fácil; regalarle tiempo invertido es lo que de verdad cambia su vida. Un niño que nace hoy tiene el activo más escaso del mundo financiero: dieciocho años de interés compuesto por delante, y luego otros cincuenta más si no toca el capital. Este artículo responde a una pregunta muy concreta: cuánto hay que aportar cada mes, desde qué edad y en qué instrumento para que tu hijo llegue a los 18 años con al menos 100.000 € invertidos. Verás las cifras exactas según la edad a la que empiezas, qué rentabilidad es razonable esperar del S&P 500, cómo enseñarle a no gastárselo el primer año y qué dicen los inversores más respetados del mundo sobre invertir a muy largo plazo.",
      en: "Giving a child money is easy; giving them invested time is what actually changes their life. A child born today owns the scarcest asset in finance: eighteen years of compounding ahead, and another fifty after that if the capital is left alone. This article answers one very specific question: how much to contribute each month, from what age and in which instrument, so your child reaches 18 with at least €100,000 invested. You will see the exact figures by starting age, what return is reasonable to expect from the S&P 500, how to teach them not to blow it in the first year, and what the world's most respected investors say about investing for the very long run.",
    },
    sections: [
      {
        heading: { es: "Por qué 100.000 € a los 18 lo cambia todo", en: "Why €100,000 at 18 changes everything" },
        paragraphs: [
          {
            es: "Cien mil euros a los 18 años no son cien mil euros. Si tu hijo no los toca y siguen invertidos al 7% real, a los 30 años son unos 225.000 €, a los 40 rondan los 443.000 € y a los 60 superan el 1,7 millones sin aportar un solo euro más. Ese capital compra dos cosas que el dinero rara vez compra: opciones y calma. Puede estudiar sin deuda, montar un negocio, mudarse de país o simplemente decir que no a un mal trabajo.",
            en: "One hundred thousand euros at 18 is not one hundred thousand euros. If your child leaves it invested at a 7% real return, it becomes roughly €225,000 by age 30, about €443,000 by 40 and over €1.7 million by 60 without a single extra contribution. That capital buys two things money rarely buys: options and calm. They can study debt-free, start a business, move abroad or simply say no to a bad job.",
          },
          {
            es: "El objetivo, por tanto, no es que gaste ese dinero a los 18. Es que llegue a la mayoría de edad con una base que ya trabaja sola y con la educación necesaria para no destruirla. Lo primero es matemática; lo segundo es crianza, y es la parte difícil.",
            en: "The goal, then, is not for them to spend that money at 18. It is to reach adulthood with a base that already works on its own, plus the education needed not to destroy it. The first part is maths; the second is parenting, and that is the hard part.",
          },
        ],
        bullets: [
          { es: "100.000 € a los 18 = universidad cubierta sin préstamos en la mayoría de países europeos.", en: "€100,000 at 18 = university covered with no loans in most European countries." },
          { es: "Si no lo toca, ese capital se multiplica por 17 antes de que cumpla 60.", en: "Left untouched, that capital multiplies about 17x before they turn 60." },
          { es: "El activo real que le regalas no es el dinero: son los años de mercado.", en: "The real asset you gift is not the money: it is the years in the market." },
        ],
      },
      {
        heading: { es: "Cuánto tienes que aportar cada mes según la edad de tu hijo", en: "How much to contribute monthly by your child's age" },
        paragraphs: [
          {
            es: "Usamos una rentabilidad anual del 8% nominal, que es conservadora frente al histórico del S&P 500 (alrededor del 10% nominal anual desde 1957, y cerca del 7% descontando inflación). Con esa hipótesis, la aportación mensual necesaria para llegar a 100.000 € el día que cumple 18 años depende brutalmente de cuándo empiezas.",
            en: "We use an 8% nominal annual return, conservative versus the S&P 500's history (around 10% nominal a year since 1957, and close to 7% after inflation). Under that assumption, the monthly contribution needed to reach €100,000 on their 18th birthday depends brutally on when you start.",
          },
          {
            es: "Empezar el mes que nace cuesta unos 210 € al mes. Esperar a que cumpla 6 años sube la cuota a 380 €. Esperar a los 12 la dispara a 900 €. No es que el dinero sea más caro: es que has quemado los años que hacían el trabajo por ti. Cada año de retraso encarece la misma meta entre un 12% y un 20%.",
            en: "Starting the month they are born costs about €210 a month. Waiting until age 6 raises it to €380. Waiting until 12 pushes it to €900. Money did not get more expensive: you burned the years that were doing the work for you. Every year of delay makes the same goal 12-20% more costly.",
          },
        ],
        bullets: [
          { es: "Desde 0 años: ~210 €/mes (aportado total: 45.400 €).", en: "From age 0: ~€210/mo (total contributed: €45,400)." },
          { es: "Desde 3 años: ~285 €/mes (aportado total: 51.300 €).", en: "From age 3: ~€285/mo (total contributed: €51,300)." },
          { es: "Desde 6 años: ~380 €/mes (aportado total: 54.700 €).", en: "From age 6: ~€380/mo (total contributed: €54,700)." },
          { es: "Desde 12 años: ~900 €/mes (aportado total: 64.800 €).", en: "From age 12: ~€900/mo (total contributed: €64,800)." },
        ],
      },
      {
        heading: { es: "Por qué el S&P 500 (y no acciones sueltas)", en: "Why the S&P 500 (and not single stocks)" },
        paragraphs: [
          {
            es: "El S&P 500 agrupa las 500 mayores compañías cotizadas de Estados Unidos y se renueva solo: las empresas que dejan de importar salen del índice y entran las nuevas. Eso convierte un fondo indexado en la apuesta más aburrida y más difícil de batir a 18 años vista. Entre 1957 y hoy ha entregado en torno a un 10% anual nominal, con caídas fuertes por el camino (–37% en 2008, –34% en semanas en 2020) que siempre se recuperaron en horizontes largos.",
            en: "The S&P 500 holds the 500 largest listed companies in the United States and renews itself: firms that stop mattering drop out and new ones come in. That makes an index fund the most boring and hardest-to-beat bet over an 18-year horizon. From 1957 to today it has delivered around 10% nominal a year, with brutal drawdowns along the way (–37% in 2008, –34% in weeks in 2020) that always recovered over long horizons.",
          },
          {
            es: "Para una cuenta de un niño, la implementación importa poco pero los costes importan mucho. Busca un fondo o ETF indexado al S&P 500 (o, si prefieres diversificar más, a un índice mundial tipo MSCI World o All-Country) con comisión total por debajo del 0,20%, acumulación de dividendos y aportación automática mensual. Un 1% extra de comisión durante 18 años se come más de 15.000 € del resultado final.",
            en: "For a child's account the implementation matters little, but costs matter a lot. Look for an S&P 500 index fund or ETF (or, if you prefer wider diversification, a global index such as MSCI World or All-Country) with a total fee below 0.20%, accumulating dividends and an automatic monthly contribution. An extra 1% in fees over 18 years eats more than €15,000 of the final result.",
          },
        ],
        bullets: [
          { es: "Fondo o ETF indexado, acumulación, coste total <0,20%.", en: "Index fund or ETF, accumulating, total cost <0.20%." },
          { es: "Aportación automática el mismo día de cada mes. Sin decidir, sin dudar.", en: "Automatic contribution the same day every month. No decisions, no doubts." },
          { es: "Nada de acciones sueltas ni cripto en la cuenta del objetivo. Eso va aparte y con dinero simbólico.", en: "No single stocks or crypto in the goal account. Keep that separate and symbolic." },
          { es: "Cuenta a nombre del menor o cuenta tuya etiquetada: lo importante es que nunca se mezcle con tu día a día.", en: "A minor's account or an earmarked account of yours: the key is never mixing it with daily money." },
        ],
      },
      {
        heading: { es: "Lo que dicen los que llevan décadas en esto", en: "What people who have done this for decades say" },
        paragraphs: [
          {
            es: "No hace falta inventar una estrategia nueva. Los inversores que más dinero han generado para familias corrientes llevan cincuenta años repitiendo el mismo mensaje: compra el mercado entero, hazlo barato, hazlo siempre y no lo toques. John Bogle fundó Vanguard sobre esa idea; Warren Buffett dejó instrucciones para que el 90% del dinero de su familia se invierta en un fondo indexado al S&P 500 de bajo coste.",
            en: "There is no need to invent a new strategy. The investors who have created the most wealth for ordinary families have repeated the same message for fifty years: buy the whole market, buy it cheaply, buy it always and do not touch it. John Bogle built Vanguard on that idea; Warren Buffett left instructions for 90% of his family's money to go into a low-cost S&P 500 index fund.",
          },
          {
            es: "El otro consenso, menos citado, es sobre la conducta: el mayor enemigo del plan no es el mercado, es el adulto que lo interrumpe. Morgan Housel lo resume diciendo que invertir bien no consiste en tomar buenas decisiones, sino en no interrumpir el interés compuesto innecesariamente.",
            en: "The other, less quoted consensus is about behaviour: the plan's biggest enemy is not the market, it is the adult who interrupts it. Morgan Housel puts it simply: investing well is not about making great decisions, it is about not interrupting compounding unnecessarily.",
          },
        ],
      },
      {
        heading: { es: "Los cuatro errores que arruinan el plan", en: "The four mistakes that ruin the plan" },
        paragraphs: [
          {
            es: "El primero es empezar tarde esperando a tener más dinero: 50 € al mes desde que nace valen más que 300 € desde los doce. El segundo es parar en las caídas; las tres crisis que verás durante esos 18 años son precisamente donde compras barato. El tercero es pagar comisiones altas por un producto vendido en el banco con la palabra 'infantil' en el nombre. El cuarto es contárselo mal al niño y entregarle 100.000 € a los 18 sin ninguna preparación.",
            en: "The first is starting late while waiting for more money: €50 a month from birth beats €300 a month from age twelve. The second is stopping during crashes; the three downturns you will see in those 18 years are exactly when you buy cheap. The third is paying high fees for a bank product with the word 'junior' in the name. The fourth is framing it badly and handing over €100,000 at 18 with zero preparation.",
          },
          {
            es: "La solución al cuarto error es sencilla: haz al niño partícipe desde los 6 o 7 años. Que vea el saldo una vez al mes, que entienda que baja algunos meses y sube otros, y que aporte él una parte simbólica de su paga. Un niño que ha visto una caída del 20% y ha seguido aportando no vende con pánico a los 25.",
            en: "The fix for the fourth mistake is simple: involve the child from age 6 or 7. Let them see the balance once a month, understand that it falls some months and rises others, and contribute a symbolic slice of their pocket money. A child who has lived through a 20% drop and kept contributing will not panic-sell at 25.",
          },
        ],
        bullets: [
          { es: "Empieza hoy con lo que puedas y sube la aportación un 5% cada año.", en: "Start today with whatever you can and raise the contribution 5% each year." },
          { es: "Automatiza: la transferencia sale el día de la nómina.", en: "Automate: the transfer leaves on payday." },
          { es: "Revisa una vez al año, no una vez a la semana.", en: "Review once a year, not once a week." },
          { es: "A los 16-17 años, plan de entrega por tramos, no un cheque único.", en: "At 16-17, plan a staged handover, not a single cheque." },
        ],
      },
      {
        heading: { es: "Cómo entregarlo a los 18 sin que desaparezca", en: "How to hand it over at 18 without it vanishing" },
        paragraphs: [
          {
            es: "La entrega en un solo pago es el momento de mayor riesgo de todo el plan: 18 años de disciplina pueden evaporarse en dos años de coche, viajes y malas decisiones. Un esquema que funciona bien es dividir el capital en tres tramos: uno disponible a los 18 para estudios o formación, otro a los 21 para un proyecto concreto y justificado (negocio, entrada de vivienda, máster), y un tercero que sigue invertido y solo se toca a los 25.",
            en: "A single lump-sum handover is the riskiest moment of the whole plan: 18 years of discipline can evaporate in two years of cars, trips and bad decisions. A scheme that works well is splitting the capital into three tranches: one available at 18 for education or training, another at 21 for a specific, justified project (business, home deposit, master's), and a third that stays invested and is only touched at 25.",
          },
          {
            es: "Y una condición cultural, no legal: para tocar cada tramo tiene que presentar un plan escrito de una página con el destino del dinero y el retorno esperado. No se trata de controlar, se trata de que la primera decisión de capital de su vida sea razonada. En WhatsYourNumber puedes crearle su propio perfil infantil, ver cómo crece el fondo y trabajar juntos su primer número.",
            en: "Plus one cultural, not legal, condition: to unlock each tranche they must present a one-page written plan with the use of the money and the expected return. It is not about control, it is about making the first capital decision of their life a reasoned one. In WhatsYourNumber you can create their own kids profile, watch the fund grow and work on their first number together.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Abre hoy una cuenta indexada al S&P 500 a nombre de tu hijo, automatiza 210 € al mes (o lo que puedas y súbelo un 5% cada año) y no la toques hasta los 18. El dinero es lo de menos: lo que le estás regalando son dieciocho años de interés compuesto que él ya no podrá comprar.",
      en: "Open an S&P 500 index account for your child today, automate €210 a month (or whatever you can, raised 5% each year) and do not touch it until 18. The money is the small part: what you are gifting is eighteen years of compounding they can never buy back.",
    },
  },
  {
    slug: "rico-vs-adinerado",
    image: richVsWealthyImg,
    imageAlt: {
      es: "Composición dividida: a la izquierda un profesional estresado atrapado en la rutina del salario; a la derecha una persona serena y libre al amanecer, sin pensar en dinero",
      en: "Split composition: on the left a stressed professional trapped in the salary grind; on the right a serene person free at sunrise, no longer thinking about money",
    },
    keyword: { es: "ser rico o ser adinerado", en: "rich vs wealthy" },
    toc: true,
    readMinutes: 14,
    tag: { es: "Libertad financiera", en: "Financial freedom" },
    date: { es: "21 ago 2026", en: "Aug 21, 2026" },
    title: {
      es: "Ser rico vs. ser adinerado: cuánto necesitas para dejar de pensar en dinero",
      en: "Rich vs. wealthy: how much you need to stop thinking about money",
    },
    excerpt: {
      es: "Rico es cuánto ganas. Adinerado es cuántos meses puedes vivir sin ganar nada. Aquí tienes las cifras, los años y la estrategia de inversión.",
      en: "Rich is how much you earn. Wealthy is how many months you can live without earning. Here are the figures, the years and the investing strategy.",
    },
    intro: {
      es: "Casi todo el mundo persigue ser rico: un sueldo más alto, un bonus mejor, una facturación mayor. Pero un ingreso alto solo compra un estilo de vida alto, y el estilo de vida se lleva el dinero antes de que llegue a convertirse en patrimonio. Ser adinerado es otra cosa: es tener suficiente capital invertido para que tu vida se pague sola aunque mañana dejes de trabajar. La pregunta útil no es cuánto puedes ganar, sino cuánto necesitas acumular para cubrir tu línea base y dejar de pensar en dinero. En este artículo verás, con gráficas, cuánto capital exige cada estándar de vida (3.000 €, 5.000 €, 7.000 € o 10.000 € al mes), en cuántos años lo alcanzas según tu tasa de ahorro y cómo invertirlo de forma inteligente para llegar antes.",
      en: "Almost everyone chases being rich: a bigger salary, a better bonus, higher revenue. But high income only buys a high lifestyle, and lifestyle eats the money before it ever becomes wealth. Being wealthy is different: it means holding enough invested capital that your life pays for itself even if you stop working tomorrow. The useful question is not how much you can earn, but how much you need to accumulate to cover your baseline and stop thinking about money. This article shows, with charts, how much capital each standard of living demands (€3,000, €5,000, €7,000 or €10,000 a month), how many years it takes depending on your savings rate, and how to invest intelligently to get there sooner.",
    },
    sections: [
      {
        heading: { es: "Rico es un flujo. Adinerado es un stock", en: "Rich is a flow. Wealthy is a stock" },
        paragraphs: [
          {
            es: "Rico describe tu cuenta de resultados: cuánto entra cada mes. Adinerado describe tu balance: cuánto capital tienes trabajando. Son dos cosas independientes. Hay directivos con 250.000 € al año y tres meses de colchón, y hay profesores con 45.000 € al año y veinte años de gastos cubiertos. El primero necesita seguir yendo a la oficina; el segundo, no.",
            en: "Rich describes your income statement: how much comes in each month. Wealthy describes your balance sheet: how much capital you have working. They are independent. There are executives earning €250,000 a year with three months of buffer, and teachers earning €45,000 a year with twenty years of expenses covered. The first one must keep showing up; the second one does not.",
          },
          {
            es: "La métrica que separa ambos mundos es simple: patrimonio invertido dividido entre tu gasto mensual. Ese cociente son meses de libertad. Todo lo que aumente el numerador o reduzca el denominador te acerca; todo lo demás es ruido.",
            en: "The metric that separates both worlds is simple: invested net worth divided by your monthly spending. That ratio is months of freedom. Anything that raises the numerator or lowers the denominator moves you closer; everything else is noise.",
          },
        ],
        bullets: [
          { es: "Ingreso alto + gasto alto = rico y atrapado.", en: "High income + high spending = rich and trapped." },
          { es: "Ingreso medio + gasto controlado + inversión = adinerado.", en: "Mid income + controlled spending + investing = wealthy." },
          { es: "Lo que no inviertes no compra libertad, compra semanas.", en: "What you do not invest buys weeks, not freedom." },
        ],
      },
      {
        heading: { es: "Tu línea base: el número que casi nadie calcula", en: "Your baseline: the number almost nobody calculates" },
        paragraphs: [
          {
            es: "Antes de hablar de millones necesitas una cifra honesta: cuánto cuesta un mes normal de tu vida. No el mes ideal ni el mes de emergencia, sino el real, con vivienda, comida, transporte, seguros, colegios, ocio y los gastos anuales prorrateados (IBI, seguros, vacaciones, revisiones del coche).",
            en: "Before talking millions you need an honest figure: what a normal month of your life costs. Not the ideal month nor the emergency month, but the real one, with housing, food, transport, insurance, schools, leisure and annualised costs spread monthly (property tax, insurance, holidays, car servicing).",
          },
          {
            es: "Después divide ese gasto en dos capas. La capa base es lo que necesitas para vivir con dignidad y sin estrés: normalmente entre el 55% y el 70% del total. La capa opcional es lo que hace la vida más agradable: viajes, restaurantes, suscripciones, caprichos. Tu libertad financiera empieza el día en que el capital cubre la capa base; el resto es lujo negociable.",
            en: "Then split that spending into two layers. The base layer is what you need to live with dignity and without stress: usually 55-70% of the total. The optional layer is what makes life nicer: travel, restaurants, subscriptions, treats. Financial freedom starts the day your capital covers the base layer; the rest is negotiable luxury.",
          },
        ],
      },
      {
        heading: { es: "Cuánto capital necesitas según tu estándar de vida", en: "How much capital each standard of living needs" },
        paragraphs: [
          {
            es: "La regla es directa: capital necesario = gasto anual ÷ tasa de retiro. Con una tasa del 4% necesitas 25 veces tu gasto anual; con una tasa más conservadora del 3,5%, unas 28,6 veces. La diferencia parece pequeña en porcentaje y es enorme en euros: en un gasto de 7.000 € al mes son casi 300.000 € más de capital.",
            en: "The rule is direct: capital needed = annual spending ÷ withdrawal rate. At 4% you need 25 times your annual spending; at a more conservative 3.5%, about 28.6 times. The gap looks small in percentage terms and is huge in euros: at €7,000 a month it is nearly €300,000 of extra capital.",
          },
          {
            es: "Mira la gráfica: cada 2.000 € más de estándar de vida mensual añaden entre 600.000 € y 686.000 € al objetivo. Ese es el precio real de subir de nivel de vida. No es que no puedas permitírtelo: es que cada subida te cuesta años de trabajo obligatorio.",
            en: "Look at the chart: every extra €2,000 of monthly lifestyle adds €600,000-686,000 to the target. That is the real price of lifestyle inflation. It is not that you cannot afford it: it is that every upgrade costs you years of mandatory work.",
          },
        ],
        bullets: [
          { es: "3.000 €/mes → 900.000 € al 4% · 1.030.000 € al 3,5%.", en: "€3,000/mo → €900,000 at 4% · €1,030,000 at 3.5%." },
          { es: "5.000 €/mes → 1.500.000 € al 4% · 1.715.000 € al 3,5%.", en: "€5,000/mo → €1,500,000 at 4% · €1,715,000 at 3.5%." },
          { es: "7.000 €/mes → 2.100.000 € al 4% · 2.400.000 € al 3,5%.", en: "€7,000/mo → €2,100,000 at 4% · €2,400,000 at 3.5%." },
          { es: "10.000 €/mes → 3.000.000 € al 4% · 3.430.000 € al 3,5%.", en: "€10,000/mo → €3,000,000 at 4% · €3,430,000 at 3.5%." },
        ],
      },
      {
        heading: { es: "Cuántos años tardas: manda la tasa de ahorro", en: "How many years it takes: the savings rate rules" },
        paragraphs: [
          {
            es: "El dato más contraintuitivo de las finanzas personales es este: el tiempo hasta la libertad depende mucho más del porcentaje que ahorras que de cuánto ganas. Si ahorras el 10% de tu ingreso necesitas más de cuarenta años; si ahorras el 50%, unos dieciséis; con el 70%, menos de diez. La razón es doble: ahorrar más aumenta el capital y, a la vez, reduce el gasto que ese capital tendrá que financiar.",
            en: "The most counterintuitive fact in personal finance is this: time to freedom depends far more on the share you save than on how much you earn. Saving 10% of your income takes over forty years; saving 50%, about sixteen; at 70%, under ten. The reason is twofold: saving more grows capital and simultaneously shrinks the spending that capital must fund.",
          },
          {
            es: "Por eso una subida de sueldo solo acelera tu libertad si no la conviertes en gasto. Un aumento del 20% que se va íntegro en un coche nuevo no mueve tu fecha ni un mes; el mismo aumento invertido puede adelantarla tres o cuatro años.",
            en: "That is why a raise only accelerates your freedom if you do not turn it into spending. A 20% raise fully absorbed by a new car does not move your date by a single month; the same raise invested can pull it forward three or four years.",
          },
        ],
      },
      {
        heading: { es: "Cómo invertir de forma inteligente para llegar antes", en: "How to invest intelligently to arrive sooner" },
        paragraphs: [
          {
            es: "Invertir bien aquí no significa acertar acciones: significa capturar la rentabilidad del mercado con costes bajos, riesgo ajustado a tu horizonte y sin interrumpir el proceso. La combinación que ha funcionado durante décadas es aburrida: fondos indexados globales, aportación automática cada mes, rebalanceo una o dos veces al año y no vender en las caídas.",
            en: "Investing well here does not mean picking winners: it means capturing market returns with low costs, risk matched to your horizon, and never interrupting the process. The combination that has worked for decades is boring: global index funds, an automatic monthly contribution, rebalancing once or twice a year and not selling in drawdowns.",
          },
          {
            es: "La gráfica de aportaciones frente a intereses lo resume todo: en los primeros cinco años casi todo tu capital viene de lo que aportas, y a partir del año quince el interés compuesto aporta más que tú. La paciencia no es una virtud moral en inversión, es el motor matemático del resultado.",
            en: "The contributions-versus-interest chart says it all: in the first five years nearly all your capital comes from what you put in, and from year fifteen onwards compounding contributes more than you do. Patience is not a moral virtue in investing, it is the mathematical engine of the outcome.",
          },
        ],
        bullets: [
          { es: "Núcleo 70-90% en renta variable global indexada, coste total por debajo del 0,25%.", en: "Core 70-90% in global equity index funds, total cost under 0.25%." },
          { es: "Colchón de 6-12 meses en liquidez remunerada, fuera de la cartera.", en: "A 6-12 month buffer in cash-like yield, outside the portfolio." },
          { es: "Renta fija o monetario creciendo a medida que te acercas a tu número.", en: "Bonds or money market growing as you approach your number." },
          { es: "Aportación automática el día de cobro: primero inviertes, luego gastas.", en: "Automatic contribution on payday: invest first, spend later." },
          { es: "Alternativos (inmobiliario, cripto) como satélite, nunca como núcleo.", en: "Alternatives (real estate, crypto) as a satellite, never as the core." },
        ],
      },
      {
        heading: { es: "Escapar del sistema por fases, no de golpe", en: "Escaping the system in phases, not in one jump" },
        paragraphs: [
          {
            es: "No hace falta llegar al 100% del número para que tu vida cambie. Con 25 veces tu gasto mensual (unos dos años de colchón) puedes rechazar un mal trabajo. Con 10 veces tu gasto anual ya puedes bajar de jornada o cambiar de sector con margen. Con la capa base cubierta al 100% trabajas porque quieres. Cada fase compra un tipo distinto de tranquilidad.",
            en: "You do not need 100% of your number for your life to change. With 25 times your monthly spending (about two years of buffer) you can turn down a bad job. With 10 times your annual spending you can already cut hours or switch industries with room to breathe. With your base layer fully covered you work because you want to. Each phase buys a different kind of calm.",
          },
          {
            es: "Define tus fases, ponles fecha estimada y revísalas una vez al mes. La libertad financiera deja de ser una fantasía cuando se convierte en un porcentaje que sube.",
            en: "Define your phases, give them an estimated date and review them once a month. Financial freedom stops being a fantasy when it becomes a percentage that goes up.",
          },
        ],
      },
    ],
    takeaway: {
      es: "Calcula tu línea base mensual, multiplícala por 300 (25 años de gasto) y conviértela en un plan de aportación automática. Ese número, no tu sueldo, es el que decide cuándo dejas de pensar en dinero.",
      en: "Work out your monthly baseline, multiply it by 300 (25 years of spending) and turn it into an automatic contribution plan. That number, not your salary, decides when you stop thinking about money.",
    },
  },
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

export type BlogTable = {
  title: { es: string; en: string };
  note?: { es: string; en: string };
  columns: { es: string; en: string }[];
  rows: { cells: { es: string; en: string }[]; highlight?: boolean }[];
};

export type BlogExtras = {
  image2: string;
  image2Alt: { es: string; en: string };
  image2Caption: { es: string; en: string };
  table: BlogTable;
};

/** Second photo + comparative table shown mid-article. */
export const postExtras: Record<string, BlogExtras> = {
  "100k-hijo-18-anos-sp500": {
    image2: kids100k2Img,
    image2Alt: {
      es: "Joven de 18 años revisando en una tablet la cartera indexada que sus padres construyeron durante su infancia",
      en: "An 18-year-old checking on a tablet the index portfolio his parents built through his childhood",
    },
    image2Caption: {
      es: "El objetivo no es entregarle dinero a los 18: es entregarle un capital que ya sabe usar.",
      en: "The goal is not handing over money at 18: it is handing over capital they already know how to use.",
    },
    table: {
      title: { es: "Aportación mensual necesaria para llegar a 100.000 €", en: "Monthly contribution needed to reach €100,000" },
      note: {
        es: "Rentabilidad del 8% anual, aportación constante hasta el día que cumple 18 años.",
        en: "8% annual return, constant contribution until their 18th birthday.",
      },
      columns: [
        { es: "Edad a la que empiezas", en: "Age when you start" },
        { es: "Aportación mensual", en: "Monthly contribution" },
        { es: "Total aportado", en: "Total contributed" },
        { es: "Lo que pone el mercado", en: "What the market adds" },
      ],
      rows: [
        { cells: [{ es: "Recién nacido", en: "Newborn" }, { es: "210 €", en: "€210" }, { es: "45.400 €", en: "€45,400" }, { es: "54.600 €", en: "€54,600" }], highlight: true },
        { cells: [{ es: "3 años", en: "3 years" }, { es: "285 €", en: "€285" }, { es: "51.300 €", en: "€51,300" }, { es: "48.700 €", en: "€48,700" }] },
        { cells: [{ es: "6 años", en: "6 years" }, { es: "380 €", en: "€380" }, { es: "54.700 €", en: "€54,700" }, { es: "45.300 €", en: "€45,300" }] },
        { cells: [{ es: "9 años", en: "9 years" }, { es: "550 €", en: "€550" }, { es: "59.400 €", en: "€59,400" }, { es: "40.600 €", en: "€40,600" }] },
        { cells: [{ es: "12 años", en: "12 years" }, { es: "900 €", en: "€900" }, { es: "64.800 €", en: "€64,800" }, { es: "35.200 €", en: "€35,200" }] },
      ],
    },
  },

  "rico-vs-adinerado": {
    image2: richVsWealthy2Img,
    image2Alt: {
      es: "Manos anotando el coste mensual de vida en una libreta junto a un portátil con la distribución de la cartera",
      en: "Hands writing monthly living costs in a notebook next to a laptop showing portfolio allocation",
    },
    image2Caption: {
      es: "Primero la línea base mensual, después el capital. Nunca al revés.",
      en: "The monthly baseline first, the capital second. Never the other way round.",
    },
    table: {
      title: { es: "Rico vs. adinerado: dos vidas con el mismo ingreso", en: "Rich vs. wealthy: two lives on the same income" },
      note: {
        es: "Ambos ingresan 8.000 € netos al mes durante 15 años.",
        en: "Both earn €8,000 net per month for 15 years.",
      },
      columns: [
        { es: "Concepto", en: "Item" },
        { es: "Perfil \"rico\"", en: "\"Rich\" profile" },
        { es: "Perfil \"adinerado\"", en: "\"Wealthy\" profile" },
      ],
      rows: [
        { cells: [{ es: "Gasto mensual", en: "Monthly spending" }, { es: "7.400 €", en: "€7,400" }, { es: "4.800 €", en: "€4,800" }] },
        { cells: [{ es: "Ahorro invertido", en: "Invested savings" }, { es: "600 €/mes", en: "€600/mo" }, { es: "3.200 €/mes", en: "€3,200/mo" }] },
        { cells: [{ es: "Capital a 15 años (7%)", en: "Capital after 15 years (7%)" }, { es: "190.000 €", en: "€190,000" }, { es: "1.014.000 €", en: "€1,014,000" }] },
        { cells: [{ es: "Meses de vida cubiertos", en: "Months of life covered" }, { es: "26", en: "26" }, { es: "211", en: "211" }] },
        { cells: [{ es: "¿Puede dejar de trabajar?", en: "Can they stop working?" }, { es: "No", en: "No" }, { es: "Casi (72% del número)", en: "Almost (72% of the number)" }], highlight: true },
      ],
    },
  },
  "calcular-patrimonio-neto-real": {
    image2: netWorth2Img,
    image2Alt: {
      es: "Persona comparando el balance impreso de activos y deudas con la gráfica de patrimonio neto en el portátil",
      en: "Person comparing a printed balance sheet of assets and debts with the net worth chart on a laptop",
    },
    image2Caption: {
      es: "El mismo activo puede valer tres cifras distintas según cómo lo valores.",
      en: "The same asset can be worth three different figures depending on how you value it.",
    },
    table: {
      title: { es: "Valoración optimista vs. valoración conservadora", en: "Optimistic vs. conservative valuation" },
      note: {
        es: "Ejemplo con un patrimonio declarado de 400.000 €. La diferencia es del 27%.",
        en: "Example on a declared net worth of €400,000. The gap is 27%.",
      },
      columns: [
        { es: "Partida", en: "Item" },
        { es: "Cálculo optimista", en: "Optimistic" },
        { es: "Cálculo conservador", en: "Conservative" },
      ],
      rows: [
        { cells: [{ es: "Vivienda", en: "Home" }, { es: "350.000 €", en: "€350,000" }, { es: "322.000 € (−8% costes)", en: "€322,000 (−8% costs)" }] },
        { cells: [{ es: "Coche", en: "Car" }, { es: "25.000 €", en: "€25,000" }, { es: "17.000 € (mercado real)", en: "€17,000 (real market)" }] },
        { cells: [{ es: "Cartera", en: "Portfolio" }, { es: "90.000 €", en: "€90,000" }, { es: "78.000 € (−impuestos)", en: "€78,000 (−taxes)" }] },
        { cells: [{ es: "Tarjetas y financiación", en: "Cards & financing" }, { es: "No contada", en: "Not counted" }, { es: "−11.000 €", en: "−€11,000" }] },
        { cells: [{ es: "Patrimonio neto", en: "Net worth" }, { es: "465.000 €", en: "€465,000" }, { es: "406.000 €", en: "€406,000" }], highlight: true },
      ],
    },
  },
  "runway-personal": {
    image2: runway2Img,
    image2Alt: {
      es: "Joven profesional calculando en su cuaderno cuántos meses de gastos cubre su ahorro",
      en: "Young professional working out in a notebook how many months of expenses his savings cover",
    },
    image2Caption: {
      es: "El mismo colchón dura el doble en modo austero que con el tren de vida actual.",
      en: "The same buffer lasts twice as long in austere mode as at your current lifestyle.",
    },
    table: {
      title: { es: "Runway según perfil y modo de gasto", en: "Runway by profile and spending mode" },
      note: {
        es: "Colchón de 18.000 € líquidos en los tres casos.",
        en: "€18,000 liquid buffer in all three cases.",
      },
      columns: [
        { es: "Perfil", en: "Profile" },
        { es: "Gasto actual", en: "Current spending" },
        { es: "Modo austero", en: "Austere mode" },
        { es: "Objetivo", en: "Target" },
      ],
      rows: [
        { cells: [{ es: "Empleado, doble ingreso", en: "Employee, dual income" }, { es: "5 meses", en: "5 months" }, { es: "9 meses", en: "9 months" }, { es: "4-6", en: "4-6" }] },
        { cells: [{ es: "Ingreso único con hijos", en: "Single income, kids" }, { es: "3 meses", en: "3 months" }, { es: "6 meses", en: "6 months" }, { es: "9-12", en: "9-12" }], highlight: true },
        { cells: [{ es: "Autónomo", en: "Freelancer" }, { es: "4 meses", en: "4 months" }, { es: "8 meses", en: "8 months" }, { es: "12", en: "12" }] },
      ],
    },
  },
  "portafolio-vs-sp500": {
    image2: benchmark2Img,
    image2Alt: {
      es: "Inversor analizando la rentabilidad de su cartera frente al índice en dos pantallas a oscuras",
      en: "Investor analysing his portfolio return against the index on two screens in the dark",
    },
    image2Caption: {
      es: "El mismo año, cuatro formas de medirlo y cuatro conclusiones distintas.",
      en: "The same year, four ways to measure it and four different conclusions.",
    },
    table: {
      title: { es: "Cómo cambia tu resultado según cómo lo midas", en: "How your result changes with the method" },
      note: {
        es: "Cartera de ejemplo con aportaciones mensuales durante 12 meses.",
        en: "Sample portfolio with monthly contributions over 12 months.",
      },
      columns: [
        { es: "Método", en: "Method" },
        { es: "Tu cartera", en: "Your portfolio" },
        { es: "S&P 500", en: "S&P 500" },
        { es: "Diferencia", en: "Gap" },
      ],
      rows: [
        { cells: [{ es: "Retorno simple", en: "Simple return" }, { es: "+14,0%", en: "+14.0%" }, { es: "+11,5% (price)", en: "+11.5% (price)" }, { es: "+2,5", en: "+2.5" }] },
        { cells: [{ es: "TIR sobre flujos", en: "IRR on cash flows" }, { es: "+9,1%", en: "+9.1%" }, { es: "+10,4%", en: "+10.4%" }, { es: "−1,3", en: "−1.3" }] },
        { cells: [{ es: "Con dividendos y comisiones", en: "With dividends & fees" }, { es: "+7,6%", en: "+7.6%" }, { es: "+12,3% (total return)", en: "+12.3% (total return)" }, { es: "−4,7", en: "−4.7" }], highlight: true },
        { cells: [{ es: "En moneda de gasto (EUR)", en: "In spending currency (EUR)" }, { es: "+5,2%", en: "+5.2%" }, { es: "+9,8%", en: "+9.8%" }, { es: "−4,6", en: "−4.6" }] },
      ],
    },
  },
  "clasificacion-automatica-gastos-ia": {
    image2: aiExpenses2Img,
    image2Alt: {
      es: "Móvil mostrando movimientos bancarios ya categorizados junto a recibos en papel",
      en: "Phone showing already categorised bank transactions next to paper receipts",
    },
    image2Caption: {
      es: "Reglas para lo repetitivo, IA para la cola larga: cada una en lo que gana.",
      en: "Rules for the repetitive, AI for the long tail: each where it wins.",
    },
    table: {
      title: { es: "Reglas vs. IA: quién gana en cada caso", en: "Rules vs. AI: who wins where" },
      columns: [
        { es: "Tipo de movimiento", en: "Transaction type" },
        { es: "Reglas", en: "Rules" },
        { es: "IA", en: "AI" },
        { es: "Mejor opción", en: "Best" },
      ],
      rows: [
        { cells: [{ es: "Nómina e hipoteca", en: "Payroll & mortgage" }, { es: "100%", en: "100%" }, { es: "95%", en: "95%" }, { es: "Reglas", en: "Rules" }] },
        { cells: [{ es: "Traspaso entre tus cuentas", en: "Transfer between your accounts" }, { es: "98%", en: "98%" }, { es: "60%", en: "60%" }, { es: "Reglas", en: "Rules" }], highlight: true },
        { cells: [{ es: "Comercio desconocido", en: "Unknown merchant" }, { es: "0%", en: "0%" }, { es: "93%", en: "93%" }, { es: "IA", en: "AI" }] },
        { cells: [{ es: "Gasto de viaje mixto", en: "Mixed travel spending" }, { es: "35%", en: "35%" }, { es: "88%", en: "88%" }, { es: "IA + etiqueta", en: "AI + tag" }] },
      ],
    },
  },
  "numero-libertad-financiera": {
    image2: freedom2Img,
    image2Alt: {
      es: "Persona revisando en una tablet la proyección de su capital y su fecha de independencia financiera",
      en: "Person reviewing on a tablet the projection of their capital and financial independence date",
    },
    image2Caption: {
      es: "Un cuarto de punto en la tasa de retiro cambia tu número en decenas de miles.",
      en: "A quarter point in the withdrawal rate moves your number by tens of thousands.",
    },
    table: {
      title: { es: "Tu número según la tasa de retiro", en: "Your number by withdrawal rate" },
      note: {
        es: "Para un gasto anual de 40.000 €, antes de impuestos sobre plusvalías.",
        en: "For €40,000 annual spending, before capital gains tax.",
      },
      columns: [
        { es: "Tasa de retiro", en: "Withdrawal rate" },
        { es: "Capital necesario", en: "Capital needed" },
        { es: "Múltiplo", en: "Multiple" },
        { es: "Horizonte cómodo", en: "Comfortable horizon" },
      ],
      rows: [
        { cells: [{ es: "4,0%", en: "4.0%" }, { es: "1.000.000 €", en: "€1,000,000" }, { es: "25×", en: "25×" }, { es: "30 años", en: "30 years" }] },
        { cells: [{ es: "3,5%", en: "3.5%" }, { es: "1.142.000 €", en: "€1,142,000" }, { es: "28,6×", en: "28.6×" }, { es: "40 años", en: "40 years" }], highlight: true },
        { cells: [{ es: "3,25%", en: "3.25%" }, { es: "1.230.000 €", en: "€1,230,000" }, { es: "30,8×", en: "30.8×" }, { es: "45-50 años", en: "45-50 years" }] },
        { cells: [{ es: "3,0%", en: "3.0%" }, { es: "1.333.000 €", en: "€1,333,000" }, { es: "33,3×", en: "33.3×" }, { es: "50+ años", en: "50+ years" }] },
      ],
    },
  },
  "revision-financiera-20-minutos": {
    image2: review2Img,
    image2Alt: {
      es: "Mujer con café revisando su calendario financiero mensual en el portátil",
      en: "Woman with coffee reviewing her monthly financial calendar on a laptop",
    },
    image2Caption: {
      es: "Veinte minutos al mes, cuatro horas al año, doce decisiones ejecutadas.",
      en: "Twenty minutes a month, four hours a year, twelve executed decisions.",
    },
    table: {
      title: { es: "Qué revisar y cada cuánto", en: "What to review and how often" },
      columns: [
        { es: "Frecuencia", en: "Frequency" },
        { es: "Tiempo", en: "Time" },
        { es: "Qué haces", en: "What you do" },
      ],
      rows: [
        { cells: [{ es: "Mensual", en: "Monthly" }, { es: "20 min", en: "20 min" }, { es: "Saldos, 3 métricas y 1 decisión", en: "Balances, 3 metrics and 1 decision" }], highlight: true },
        { cells: [{ es: "Trimestral", en: "Quarterly" }, { es: "+20 min", en: "+20 min" }, { es: "Rebalanceo y gastos fijos", en: "Rebalancing and fixed costs" }] },
        { cells: [{ es: "Anual", en: "Annual" }, { es: "1 h", en: "1 h" }, { es: "Número objetivo, seguros, fiscalidad", en: "Target number, insurance, taxes" }] },
      ],
    },
  },
};

export type BlogChart = {
  id: string;
  kind: "bar" | "area";
  stacked?: boolean;
  unit?: "money" | "years" | "percent";
  title: { es: string; en: string };
  note?: { es: string; en: string };
  series: { key: string; label: { es: string; en: string } }[];
  data: ({ label: { es: string; en: string } } & Record<string, unknown>)[];
  /** Index of the section this chart is rendered after. */
  after: number;
};

/** Charts rendered inside specific articles. */
export const postCharts: Record<string, BlogChart[]> = {
  "100k-hijo-18-anos-sp500": [
    {
      id: "aporte-edad",
      kind: "bar",
      unit: "money",
      after: 1,
      title: {
        es: "Aportación mensual necesaria según la edad a la que empiezas",
        en: "Monthly contribution needed by starting age",
      },
      note: {
        es: "Objetivo: 100.000 € el día que cumple 18 años, con una rentabilidad del 8% anual.",
        en: "Goal: €100,000 on their 18th birthday, at an 8% annual return.",
      },
      series: [{ key: "cuota", label: { es: "Aportación mensual (€)", en: "Monthly contribution (€)" } }],
      data: [
        { label: { es: "0 años", en: "Age 0" }, cuota: 210 },
        { label: { es: "3 años", en: "Age 3" }, cuota: 285 },
        { label: { es: "6 años", en: "Age 6" }, cuota: 380 },
        { label: { es: "9 años", en: "Age 9" }, cuota: 550 },
        { label: { es: "12 años", en: "Age 12" }, cuota: 900 },
        { label: { es: "15 años", en: "Age 15" }, cuota: 2350 },
      ],
    },
    {
      id: "crecimiento",
      kind: "area",
      stacked: true,
      unit: "money",
      after: 2,
      title: {
        es: "Cómo se construyen los 100.000 €: tú vs. el interés compuesto",
        en: "How the €100,000 is built: you vs. compounding",
      },
      note: {
        es: "210 € al mes desde el nacimiento, rentabilidad del 8% anual en un indexado al S&P 500.",
        en: "€210 a month from birth, 8% annual return in an S&P 500 index fund.",
      },
      series: [
        { key: "aportado", label: { es: "Lo que aportas tú", en: "What you contribute" } },
        { key: "mercado", label: { es: "Lo que aporta el mercado", en: "What the market adds" } },
      ],
      data: [
        { label: { es: "3 años", en: "Age 3" }, aportado: 7560, mercado: 950 },
        { label: { es: "6 años", en: "Age 6" }, aportado: 15120, mercado: 4200 },
        { label: { es: "9 años", en: "Age 9" }, aportado: 22680, mercado: 10600 },
        { label: { es: "12 años", en: "Age 12" }, aportado: 30240, mercado: 21400 },
        { label: { es: "15 años", en: "Age 15" }, aportado: 37800, mercado: 37900 },
        { label: { es: "18 años", en: "Age 18" }, aportado: 45400, mercado: 54600 },
      ],
    },
    {
      id: "despues18",
      kind: "bar",
      unit: "money",
      after: 5,
      title: {
        es: "Si no toca el capital a los 18: valor futuro sin aportar nada más",
        en: "If they leave it untouched at 18: future value with no extra contributions",
      },
      note: {
        es: "100.000 € invertidos al 7% real anual, sin nuevas aportaciones.",
        en: "€100,000 invested at a 7% real annual return, with no new contributions.",
      },
      series: [{ key: "valor", label: { es: "Capital acumulado", en: "Accumulated capital" } }],
      data: [
        { label: { es: "18 años", en: "Age 18" }, valor: 100000 },
        { label: { es: "25 años", en: "Age 25" }, valor: 160600 },
        { label: { es: "30 años", en: "Age 30" }, valor: 225200 },
        { label: { es: "40 años", en: "Age 40" }, valor: 443000 },
        { label: { es: "50 años", en: "Age 50" }, valor: 871000 },
        { label: { es: "60 años", en: "Age 60" }, valor: 1713000 },
      ],
    },
  ],

  "rico-vs-adinerado": [
    {
      id: "capital",
      kind: "bar",
      unit: "money",
      after: 2,
      title: {
        es: "Capital necesario según tu estándar de vida",
        en: "Capital needed by standard of living",
      },
      note: {
        es: "Gasto mensual objetivo convertido en capital con tasa de retiro del 4% y del 3,5%.",
        en: "Target monthly spending converted into capital at a 4% and a 3.5% withdrawal rate.",
      },
      series: [
        { key: "wr4", label: { es: "Tasa 4%", en: "4% rate" } },
        { key: "wr35", label: { es: "Tasa 3,5%", en: "3.5% rate" } },
      ],
      data: [
        { label: { es: "3.000 €/mes", en: "€3,000/mo" }, wr4: 900000, wr35: 1030000 },
        { label: { es: "5.000 €/mes", en: "€5,000/mo" }, wr4: 1500000, wr35: 1715000 },
        { label: { es: "7.000 €/mes", en: "€7,000/mo" }, wr4: 2100000, wr35: 2400000 },
        { label: { es: "10.000 €/mes", en: "€10,000/mo" }, wr4: 3000000, wr35: 3430000 },
      ],
    },
    {
      id: "years",
      kind: "bar",
      unit: "years",
      after: 3,
      title: {
        es: "Años hasta la libertad según tu tasa de ahorro",
        en: "Years to freedom by savings rate",
      },
      note: {
        es: "Partiendo de cero, con una rentabilidad real del 5% anual y gasto constante.",
        en: "Starting from zero, with a 5% real annual return and constant spending.",
      },
      series: [{ key: "years", label: { es: "Años de trabajo necesarios", en: "Years of work needed" } }],
      data: [
        { label: { es: "10%", en: "10%" }, years: 43 },
        { label: { es: "20%", en: "20%" }, years: 32 },
        { label: { es: "30%", en: "30%" }, years: 25 },
        { label: { es: "40%", en: "40%" }, years: 20 },
        { label: { es: "50%", en: "50%" }, years: 16 },
        { label: { es: "60%", en: "60%" }, years: 12 },
        { label: { es: "70%", en: "70%" }, years: 9 },
      ],
    },
    {
      id: "compound",
      kind: "area",
      stacked: true,
      unit: "money",
      after: 4,
      title: {
        es: "Aportaciones vs. interés compuesto",
        en: "Contributions vs. compound interest",
      },
      note: {
        es: "2.000 € invertidos cada mes con una rentabilidad del 7% anual.",
        en: "€2,000 invested every month at a 7% annual return.",
      },
      series: [
        { key: "aportado", label: { es: "Lo que aportas tú", en: "What you contribute" } },
        { key: "interes", label: { es: "Lo que aporta el interés", en: "What compounding adds" } },
      ],
      data: [
        { label: { es: "Año 5", en: "Year 5" }, aportado: 120000, interes: 23000 },
        { label: { es: "Año 10", en: "Year 10" }, aportado: 240000, interes: 106000 },
        { label: { es: "Año 15", en: "Year 15" }, aportado: 360000, interes: 274000 },
        { label: { es: "Año 20", en: "Year 20" }, aportado: 480000, interes: 562000 },
        { label: { es: "Año 25", en: "Year 25" }, aportado: 600000, interes: 1021000 },
      ],
    },
  ],
};


export type BlogQuote = {
  text: { es: string; en: string };
  author: string;
  role: { es: string; en: string };
  /** Index of the section this quote is rendered after. */
  after: number;
};

/** Expert quotes rendered inside specific articles. */
export const postQuotes: Record<string, BlogQuote[]> = {
  "100k-hijo-18-anos-sp500": [
    {
      after: 0,
      author: "Warren Buffett",
      role: { es: "Presidente de Berkshire Hathaway", en: "Chairman of Berkshire Hathaway" },
      text: {
        es: "Mi consejo para el fideicomiso de mi familia es este: pon el 10% en bonos del Estado a corto plazo y el 90% en un fondo indexado al S&P 500 de muy bajo coste.",
        en: "My advice to the trustee of my family's estate is this: put 10% in short-term government bonds and 90% in a very low-cost S&P 500 index fund.",
      },
    },
    {
      after: 2,
      author: "John C. Bogle",
      role: { es: "Fundador de Vanguard", en: "Founder of Vanguard" },
      text: {
        es: "No busques la aguja en el pajar: compra directamente el pajar. En la inversión, obtienes exactamente aquello por lo que no pagas.",
        en: "Don't look for the needle in the haystack: just buy the haystack. In investing, you get precisely what you don't pay for.",
      },
    },
    {
      after: 3,
      author: "Morgan Housel",
      role: { es: "Autor de 'La psicología del dinero'", en: "Author of 'The Psychology of Money'" },
      text: {
        es: "Invertir bien no consiste en tomar buenas decisiones, sino en no interrumpir el interés compuesto de forma innecesaria.",
        en: "Investing well is not about making good decisions; it's about consistently not screwing up — never interrupting compounding unnecessarily.",
      },
    },
    {
      after: 4,
      author: "Burton Malkiel",
      role: { es: "Autor de 'Un paseo aleatorio por Wall Street'", en: "Author of 'A Random Walk Down Wall Street'" },
      text: {
        es: "El tiempo en el mercado es mucho más importante que acertar el momento de entrar. Empezar pronto y aportar de forma periódica es la ventaja que sí está a tu alcance.",
        en: "Time in the market matters far more than timing the market. Starting early and contributing regularly is the edge that is actually available to you.",
      },
    },
  ],
};
