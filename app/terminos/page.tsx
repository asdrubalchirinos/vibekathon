import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Términos",
};

export default function TerminosPage() {
  return (
    <article className="prose-simple mx-auto max-w-2xl">
      <h1 className="font-display text-4xl leading-tight">Términos de uso</h1>
      <p className="text-sm text-[var(--muted)]">
        Borrador para este MVP. No es asesoría legal.
      </p>

      <h2 className="font-display text-2xl">Qué es este sitio</h2>
      <p>
        vibekathon es una plataforma experimental para publicar y participar en
        hackatones de vibe coding. El servicio se ofrece como está, sin
        garantía de disponibilidad ni de que un evento concreto se complete.
      </p>

      <h2 className="font-display text-2xl">Tu responsabilidad</h2>
      <ul>
        <li>Entras con tu cuenta de GitHub y eres responsable de esa cuenta.</li>
        <li>
          El contenido que publicas (problema, repos, demos, comentarios) es
          tuyo. No subas secretos, material ilegal ni enlaces que no debas
          compartir.
        </li>
        <li>
          Los repos deben ser públicos en GitHub. Revisa que no expongan claves
          ni datos personales de terceros.
        </li>
        <li>
          Quien organiza un evento decide puntaje y ganador después de la fecha
          de cierre. vibekathon no media en disputas.
        </li>
      </ul>

      <h2 className="font-display text-2xl">Cuentas y borrado</h2>
      <p>
        Puedes borrar tu envío, tus comentarios y los eventos que organizas.
        Nos reservamos el derecho de quitar contenido o cuentas si hace falta
        para proteger el servicio o a otras personas.
      </p>

      <h2 className="font-display text-2xl">Contacto</h2>
      <p>
        Para dudas sobre estos términos:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        {CONTACT_EMAIL.includes("CAMBIAR")
          ? " (marcador: cámbialo en lib/constants.ts)."
          : "."}
      </p>
      <p>
        <Link href="/privacidad">Política de privacidad</Link>
      </p>
    </article>
  );
}
