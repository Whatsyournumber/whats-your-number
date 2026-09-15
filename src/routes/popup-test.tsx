import { createFileRoute } from "@tanstack/react-router";
import { StatementImporter } from "@/components/statement-importer";

export const Route = createFileRoute("/popup-test")({
  component: PopupTest,
});

function PopupTest() {
  return (
    <div className="min-h-screen bg-background p-8">
      <StatementImporter />
    </div>
  );
}
