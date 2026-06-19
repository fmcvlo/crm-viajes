import { use } from "react";
import { ContactoDetail } from "@/components/contactos/ContactoDetail";

export default function ContactoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ContactoDetail id={id} />;
}
