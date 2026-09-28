import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/Header";
import { SetupBanner } from "@/components/SetupBanner";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "vibekathon",
    template: "%s · vibekathon",
  },
  description:
    "Publica y participa en vibekathons: hackatones de vibe coding para construir software conversando con IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SetupBanner />
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          vibekathon ·{" "}
          <Link href="/privacidad" className="underline hover:text-[var(--teal)]">
            Privacidad
          </Link>
          {" · "}
          <Link href="/terminos" className="underline hover:text-[var(--teal)]">
            Términos
          </Link>
        </footer>
      </body>
    </html>
  );
}
