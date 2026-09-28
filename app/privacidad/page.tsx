import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacidad",
};

export default function PrivacidadPage() {
  return (
    <article className="prose-simple mx-auto max-w-2xl">
      <h1 className="font-display text-4xl leading-tight">Privacidad</h1>
      <p className="text-sm text-[var(--muted)]">
        Borrador para este MVP. No es asesoría legal.
      </p>

      <h2 className="font-display text-2xl">Qué datos guardamos</h2>
      <p>
        vibekathon guarda lo mínimo para que el sitio funcione. Al entrar con
        GitHub se crea un perfil con tu identificador de usuario, tu nombre de
        usuario de GitHub y la URL de tu avatar.
      </p>
      <ul>
        <li>Eventos que publicas (título, descripción, fechas, visibilidad).</li>
        <li>Envíos (URL del repo, demo opcional, descripción y puntaje).</li>
        <li>Comentarios entre organizador y participante sobre un envío.</li>
        <li>
          En eventos privados, quién canjeó el link de invitación (para saber
          quién puede verlos).
        </li>
      </ul>
      <p>
        El inicio de sesión lo gestiona Supabase Auth con GitHub. No pedimos
        contraseña propia ni guardamos el contenido de tus repositorios: solo
        la URL que tú envías.
      </p>

      <h2 className="font-display text-2xl">Quién puede ver qué</h2>
      <p>
        Los eventos públicos y sus envíos se ven en el sitio. Los privados solo
        los ven quien organiza y quienes aceptaron el link. Los comentarios de
        un envío los ven el participante de ese envío y el organizador, no el
        resto.
      </p>

      <h2 className="font-display text-2xl">Borrar lo tuyo</h2>
      <p>
        Puedes borrar tu envío y tus comentarios desde el sitio. Quien organiza
        puede borrar su evento (y con él, los envíos y comentarios de ese
        evento). Si se borra el envío ganador, el evento queda sin ganador. Si
        quieres borrar tu cuenta de GitHub asociada, escríbenos.
      </p>

      <h2 className="font-display text-2xl">Contacto</h2>
      <p>
        Para preguntas sobre tus datos:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        {CONTACT_EMAIL.includes("CAMBIAR")
          ? " (este correo es un marcador: hay que sustituirlo antes de la beta)."
          : "."}
      </p>
      <p>
        <Link href="/terminos">Términos de uso</Link>
      </p>
    </article>
  );
}
