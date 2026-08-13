import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-warning">
      Pagos en modo de prueba · Usa la tarjeta 4242 4242 4242 4242
    </div>
  );
}