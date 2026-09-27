import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "¿Qué es un vibekathon?",
};

export default function QueEsPage() {
  return (
    <article className="prose-simple mx-auto max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--teal)]">
        La idea
      </p>
      <h1 className="font-display text-4xl leading-tight">¿Qué es un vibekathon?</h1>
      <p className="text-lg text-[var(--muted)]">
        Un vibekathon es un hackatón de vibe coding: se publica un problema y
        la gente construye software casi solo conversando con herramientas de
        inteligencia artificial.
      </p>

      <h2 className="font-display text-2xl">De esperar a resolver</h2>
      <p>
        Durante años, la mayoría de las personas aprendió a esperar. Esperar
        una función nueva. Esperar que alguien más construyera la herramienta
        que necesitaban. El software se volvió asunto de especialistas, y el
        resto se quedó del lado de los usuarios.
      </p>
      <p>
        Eso está cambiando. Hoy una persona puede partir de un problema real —
        el suyo, el de su comunidad, el de su empresa — y convertir la
        intención en un prototipo sin pedirle permiso a un equipo de producto.
        No porque el código deje de importar, sino porque ya no es la única
        puerta de entrada.
      </p>

      <h2 className="font-display text-2xl">Vibe coding, el medio</h2>
      <p>
        Vibe coding es la práctica de construir software guiando a un modelo de
        IA: defines, priorizas, pruebas y ajustas. El centro se mueve de la
        sintaxis al problema. El programador no desaparece; aparece otra
        figura, la de quien vive el problema y decide resolverlo.
      </p>
      <p>
        Un vibekathon pone esa práctica en público y con fecha. No es un curso.
        No es un ranking eterno. Es un llamado concreto: aquí hay algo que
        vale la pena construir, en este plazo, y alguien va a revisar lo que
        hiciste.
      </p>

      <h2 className="font-display text-2xl">Por qué importa</h2>
      <p>
        Importa porque cambia quién puede participar. Una comunidad puede
        convocar soluciones a un dolor local. Una empresa puede abrir un
        problema interno sin montar un concurso caro. Una persona puede
        demostrar que resolvió algo, con un repo público, no con una
        presentación vacía.
      </p>
      <ul>
        <li>El organizador plantea el problema y elige un ganador.</li>
        <li>Quien participa envía un repositorio público y, si quiere, un demo.</li>
        <li>La conversación de revisión queda en comentarios sobre ese envío.</li>
      </ul>
      <p>
        Esta plataforma nace junto al movimiento{" "}
        <a
          href="https://achirinos.com/es/personal-software/"
          target="_blank"
          rel="noreferrer"
        >
          Personal Software
        </a>
        , que propone devolver el control creativo a las personas: software
        pequeño, específico y cercano a la vida real, hecho por quien vive el
        problema. El vibe coding es el medio; resolver es el objetivo.
      </p>
      <blockquote>
        No se trata de reemplazar a quien programa. Se trata de que más
        personas puedan pasar de la espera a la solución.
      </blockquote>
      <p>
        Si quieres profundizar en ese marco —el Solver, la diferencia entre
        optimizar plataformas y optimizar soluciones personales— lee el
        manifiesto en{" "}
        <a
          href="https://achirinos.com/es/personal-software/"
          target="_blank"
          rel="noreferrer"
        >
          achirinos.com/es/personal-software
        </a>
        .
      </p>

      <p className="pt-2">
        <Link href="/vibekathons/new" className="btn btn-primary">
          Publicar un vibekathon
        </Link>
      </p>
    </article>
  );
}
