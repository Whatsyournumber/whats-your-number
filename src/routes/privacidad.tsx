import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT } from "@/hooks/use-language";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Aviso de privacidad — WhatsYournumber" },
      { name: "description", content: "Qué datos personales tratamos en WhatsYournumber, para qué, con quién los compartimos y cómo ejercer tus derechos." },
      { property: "og:title", content: "Aviso de privacidad — WhatsYournumber" },
      { property: "og:description", content: "Tratamiento de datos, base legal, destinatarios, conservación y derechos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://whatsyour-number.com/privacidad" },
      { property: "og:image", content: "https://whatsyour-number.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://whatsyour-number.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://whatsyour-number.com/privacidad" }],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  const t = useT();
  return (
    <LegalPage
      eyebrow={t("Legal", "Legal")}
      title={t("Aviso de privacidad", "Privacy notice")}
      subtitle={t(
        "Tus datos financieros son tuyos. Esto es todo lo que hacemos con ellos.",
        "Your financial data is yours. Here is everything we do with it.",
      )}
    >
      <LegalSection title={t("1. Responsable del tratamiento", "1. Data controller")}>
        <p>
          {t(
            "Oscar Alvarez, operador de WhatsYournumber, actúa como responsable del tratamiento de tus datos personales. Puedes gestionar tus datos y ejercer tus derechos desde tu perfil.",
            "Oscar Alvarez, operator of WhatsYournumber, acts as the data controller for your personal data. You can manage your data and exercise your rights from your profile.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("2. Datos que tratamos y para qué", "2. Data we process and why")}>
        <ul>
          <li>{t("Identidad y contacto (nombre, email, teléfono, foto de perfil): crear y gestionar tu cuenta. Base: ejecución del contrato.", "Identity and contact (name, email, phone, profile photo): create and manage your account. Basis: performance of the contract.")}</li>
          <li>{t("Credenciales de acceso y datos de sesión: autenticación y seguridad. Base: interés legítimo y obligación legal.", "Login credentials and session data: authentication and security. Basis: legitimate interest and legal obligation.")}</li>
          <li>{t("Datos financieros que aportas (ingresos, gastos, activos, deudas, estados de cuenta subidos): prestar el servicio de análisis y proyección. Base: ejecución del contrato.", "Financial data you provide (income, expenses, assets, debts, uploaded statements): to deliver the analysis and projection service. Basis: performance of the contract.")}</li>
          <li>{t("Mensajes de soporte y conversaciones con el asistente de IA: atenderte y mejorar el producto. Base: contrato e interés legítimo.", "Support messages and AI assistant conversations: to help you and improve the product. Basis: contract and legitimate interest.")}</li>
          <li>{t("Datos de uso, dispositivo e IP: seguridad, prevención de fraude y mejora del producto. Base: interés legítimo.", "Usage, device and IP data: security, fraud prevention and product improvement. Basis: legitimate interest.")}</li>
          <li>{t("Comunicaciones comerciales: solo con tu consentimiento, revocable en cualquier momento.", "Marketing communications: only with your consent, which you can withdraw anytime.")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("3. Con quién los compartimos", "3. Who we share them with")}>
        <ul>
          <li>{t("Proveedores tecnológicos (alojamiento, base de datos, autenticación y modelos de IA) que actúan como encargados bajo contrato.", "Technology providers (hosting, database, authentication and AI models) acting as processors under contract.")}</li>
          <li>{t("Paddle.com, nuestro Merchant of Record, para la venta, gestión de suscripciones, pagos, facturación y cumplimiento fiscal.", "Paddle.com, our Merchant of Record, for the sale, subscription management, payments, invoicing and tax compliance.")}</li>
          <li>{t("Asesores profesionales (legales o contables) y autoridades cuando la ley lo exija.", "Professional advisers (legal or accounting) and authorities where required by law.")}</li>
        </ul>
        <p>
          {t(
            "No vendemos tus datos personales. Si los datos se transfieren fuera del EEE o Reino Unido, se aplican salvaguardas como cláusulas contractuales tipo o decisiones de adecuación.",
            "We do not sell your personal data. Where data is transferred outside the EEA or UK, safeguards such as standard contractual clauses or adequacy decisions apply.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("4. Conservación", "4. Retention")}>
        <p>
          {t(
            "Conservamos tus datos mientras tengas cuenta activa y, tras su cierre, el tiempo necesario para cumplir obligaciones legales y contables. Después se eliminan o anonimizan.",
            "We keep your data while your account is active and, after closure, for as long as needed to meet legal and accounting obligations. Afterwards it is deleted or anonymised.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("5. Tus derechos", "5. Your rights")}>
        <p>
          {t(
            "Puedes solicitar acceso, rectificación, supresión, limitación, portabilidad, oposición y retirar tu consentimiento desde tu perfil. Responderemos en un plazo máximo de un mes. Si resides en el EEE o Reino Unido, también puedes reclamar ante tu autoridad de control.",
            "You can request access, rectification, erasure, restriction, portability, objection and withdraw consent from your profile. We respond within one month. If you live in the EEA or UK you may also complain to your supervisory authority.",
          )}
        </p>
      </LegalSection>

      <LegalSection title={t("6. Seguridad y cookies", "6. Security and cookies")}>
        <p>
          {t(
            "Aplicamos medidas técnicas y organizativas apropiadas: cifrado en tránsito y en reposo, control de accesos y aislamiento de datos por usuario. Usamos cookies y almacenamiento local esenciales para la sesión y tus preferencias (idioma, moneda, tema); no usamos cookies publicitarias. Puedes borrarlas desde tu navegador.",
            "We apply appropriate technical and organisational measures: encryption in transit and at rest, access control and per-user data isolation. We use cookies and local storage that are essential for your session and preferences (language, currency, theme); we do not use advertising cookies. You can clear them from your browser.",
          )}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
