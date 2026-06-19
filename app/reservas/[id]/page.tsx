import { use } from "react";
import { ReservaDetail } from "@/components/reservas/ReservaDetail";
export default function ReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReservaDetail id={id} />;
}
