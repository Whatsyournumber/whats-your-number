import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y condiciones — WhatsYournumber" },
      { name: "description", content: "Términos y condiciones de uso de WhatsYournumber: cuenta, licencia, pagos vía Paddle, suspensión y responsabilidad." },
      { property: "og:title", content: "Términos y condiciones — WhatsYournumber" },
      { property: "og:description", content: "Condiciones de uso, pagos y responsabilidades del servicio WhatsYournumber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://whatsyour-number.com/terminos" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://whatsyour-number.com/terminos" }],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  const t = useT();
  return (
    <LegalPage
      eyebrow={t("Legal", "Legal")}
      title={t("Términos y condiciones", "Terms and conditions")}
      subtitle={t(
        "Al usar WhatsYournumber aceptas estas condiciones. Léelas con calma.",
        "By using WhatsYournumber you accept these terms. Please read them carefully.",
      )}
    >
      <LegalSection title={t("1. Quién presta el servicio", "1. Who provides the service")}>
        <p>
          {t(
            "WhatsYournumber es operado por Oscar Alvarez. Al usar el servicio contratas directamente con Oscar Alvarez.",
            "WhatsYournumber is operated by Oscar Alvarez. By using the service you contract directly with Oscar Alvarez.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("2. Aceptación", "2. Acceptance")}>
        <p>
          {t(
            "El uso continuado del servicio implica la aceptación de estos términos. Debes tener la edad legal en tu país y, si actúas por una empresa, contar con autoridad para obligarla.",
            "Continued use of the service means you accept these terms. You must be of legal age in your country and, if acting for a company, have authority to bind it.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("3. Qué ofrecemos", "3. What we offer")}>
        <p>
          {t(
            "WhatsYournumber es un software de finanzas personales: análisis de gastos, patrimonio, portafolio, proyección de retiro y sugerencias generadas por IA. No somos asesores financieros, fiscales ni legales; la información es educativa y las decisiones son tuyas.",
            "WhatsYournumber is personal finance software: expense analysis, net worth, portfolio, retirement projections and AI-generated suggestions. We are not financial, tax or legal advisers; the information is educational and decisions are yours.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("4. Uso aceptable", "4. Acceptable use")}>
        <ul>
          <li>{t("No usar el servicio con fines ilegales, fraudulentos o de spam.", "No unlawful, fraudulent or spam use.")}</li>
          <li>{t("No infringir derechos de propiedad intelectual de terceros.", "No infringing third-party intellectual property.")}</li>
          <li>{t("No interferir con la seguridad: malware, sondeos, scraping o accesos no autorizados.", "No interfering with security: malware, probing, scraping or unauthorized access.")}</li>
          <li>{t("No revender, redistribuir ni hacer ingeniería inversa del servicio.", "No reselling, redistributing or reverse engineering the service.")}</li>
          <li>{t("Eres responsable de la confidencialidad de tus credenciales y de la exactitud de tus datos.", "You are responsible for your credentials and for the accuracy of your data.")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("5. Contenido e IA", "5. Content and AI")}>
        <p>
          {t(
            "Conservas los derechos sobre los documentos y datos que subes y nos concedes una licencia limitada para alojarlos y procesarlos con el único fin de prestarte el servicio. Eres responsable de tener derechos sobre lo que subes. Las respuestas de IA pueden contener errores: verifícalas antes de tomar decisiones. Podemos filtrar, restringir o eliminar contenido y suspender cuentas por uso indebido reiterado.",
            "You keep the rights to the documents and data you upload and grant us a limited license to host and process them solely to provide the service. You are responsible for holding rights over what you upload. AI answers may be inaccurate: verify them before acting. We may filter, restrict or remove content and suspend accounts for repeated misuse.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("6. Propiedad intelectual", "6. Intellectual property")}>
        <p>
          {t(
            "El software, la marca, el diseño y la documentación son propiedad del Proveedor. Recibes un derecho limitado, no exclusivo e intransferible de uso dentro del plan contratado.",
            "The software, brand, design and documentation belong to the Provider. You receive a limited, non-exclusive, non-transferable right to use it within your plan.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("7. Pagos y suscripciones", "7. Payments and subscriptions")}>
        <p>
          {t(
            "Nuestro proceso de pedidos es realizado por nuestro revendedor online Paddle.com. Paddle.com es el Merchant of Record de todos nuestros pedidos. Paddle atiende todas las consultas de servicio al cliente y gestiona las devoluciones.",
            "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.",
          )}
        </p>
        <p>
          {t(
            "Los pagos, impuestos, facturación, renovaciones, cancelaciones y reembolsos se rigen además por los Términos de Comprador de Paddle: paddle.com/legal/checkout-buyer-terms. Las suscripciones se renuevan automáticamente al final de cada periodo hasta que las canceles.",
            "Payments, taxes, invoicing, renewals, cancellations and refunds are also governed by Paddle's Buyer Terms: paddle.com/legal/checkout-buyer-terms. Subscriptions renew automatically at the end of each period until you cancel.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("8. Suspensión y terminación", "8. Suspension and termination")}>
        <p>
          {t(
            "Podemos suspender o terminar el acceso por incumplimiento material, impago, riesgo de fraude o seguridad, o violaciones graves o repetidas de estos términos. Al terminar, podrás exportar tus datos durante un periodo razonable antes de su eliminación.",
            "We may suspend or terminate access for material breach, non-payment, fraud or security risk, or serious or repeated violations of these terms. On termination you may export your data for a reasonable window before deletion.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("9. Garantías y responsabilidad", "9. Warranties and liability")}>
        <p>
          {t(
            "El servicio se presta “tal cual”, sin garantía de funcionamiento ininterrumpido o libre de errores. En la máxima medida permitida por la ley excluimos las garantías implícitas. Nuestra responsabilidad agregada se limita a los importes pagados en los 12 meses anteriores, y no respondemos por daños indirectos o consecuenciales (lucro cesante, pérdida de datos o reputación). No se excluye la responsabilidad por fraude, dolo, muerte o daños personales.",
            "The service is provided “as is”, with no guarantee of uninterrupted or error-free operation. To the fullest extent permitted by law we disclaim implied warranties. Our aggregate liability is capped at the fees paid in the previous 12 months, and we are not liable for indirect or consequential damages (lost profits, data or goodwill). Liability for fraud, wilful misconduct, death or personal injury is not excluded.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("10. Ley aplicable", "10. Governing law")}>
        <p>
          {t(
            "Estos términos se rigen por la legislación del país de residencia del Proveedor, y las disputas se someterán a sus tribunales competentes. Podemos ceder el contrato en caso de fusión o adquisición; tú necesitas nuestro consentimiento para cederlo.",
            "These terms are governed by the laws of the Provider's country of residence, and disputes are subject to its competent courts. We may assign this contract in a merger or acquisition; you need our consent to assign it.",
          )}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
