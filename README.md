# vibekathon

Plataforma para publicar y participar en **vibekathons**: hackatones de vibe coding. Una comunidad o empresa plantea un problema; la gente construye software casi solo conversando con herramientas de IA, envía un repo público, y quien organiza revisa, comenta, puntúa y elige un ganador.

Interfaz en español. Hecho con Next.js (App Router) y Supabase (Postgres + Auth con GitHub).

## Qué puedes hacer en este MVP

- Entrar con GitHub (la misma cuenta organiza y participa).
- Crear y editar un vibekathon (título, problema, fechas, público o privado).
- Ver la lista pública en la portada, con estado próximo / en curso / finalizado.
- Invitar a un evento privado con un link secreto (copiar y regenerar).
- Participar con un repo de GitHub, demo opcional y una nota. Un envío por persona, editable hasta la fecha de fin.
- Panel del organizador: comentarios, puntaje 1–10 y un ganador (se muestra en la página del evento).
- Página [¿Qué es un vibekathon?](/que-es) ligada al movimiento [Personal Software](https://achirinos.com/es/personal-software/).

Fuera de alcance por ahora: premios, pagos, correo, equipos, votación de la comunidad.

## Cómo está organizado el código

Pocas carpetas, a propósito. Si es tu primer Next.js, empieza por aquí:

```
app/                  Páginas. Cada carpeta es una URL.
  page.tsx            Portada / explorar  →  /
  que-es/page.tsx     Explicación         →  /que-es
  login/page.tsx      Inicio de sesión    →  /login
  auth/callback/      GitHub regresa aquí con un "code"
  vibekathons/        Crear, ver, editar y enviar
  invite/[token]/     Link secreto de eventos privados
components/           Pedazos de UI reutilizables (header, formularios…)
lib/
  actions.ts          Server Actions: crear evento, enviar repo, comentar…
  data.ts             Lecturas a Supabase
  auth.ts             Quién está conectado
  helpers.ts          Fechas, estado, validar URLs
  types.ts            Formas de los datos
  supabase/           Clientes de Supabase (navegador, servidor, proxy)
supabase/migrations/  SQL: tablas + políticas RLS
proxy.ts              Next.js 16: refresca la sesión en cada request
```

Reglas simples de Next.js que verás en el código:

- Un archivo `page.tsx` es una página. Por defecto es un **Server Component**: corre en el servidor y puede leer la base de datos.
- Si un archivo empieza con `"use client"`, corre en el navegador (hace falta para el botón de GitHub o para copiar un link).
- Un archivo `actions.ts` con `"use server"` guarda datos cuando envías un formulario. No hace falta una API extra.
- `proxy.ts` (en Next 15 se llamaba `middleware.ts`) mantiene la sesión de Supabase.

## Requisitos

- Node.js 20 o superior
- Una cuenta en [supabase.com](https://supabase.com)
- Una cuenta en GitHub (para crear la app de OAuth)

## 1. Crear el proyecto en Supabase

1. Entra a [https://supabase.com/dashboard](https://supabase.com/dashboard) y pulsa **New project**.
2. Elige organización, nombre (por ejemplo `vibekathon`), una contraseña de base de datos y una región cercana.
3. Espera a que el proyecto termine de provisionarse.

## 2. Activar GitHub como forma de entrar

### App de OAuth en GitHub

1. En GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Rellena:
   - **Application name:** `vibekathon` (o el que quieras)
   - **Homepage URL:** `http://localhost:3000` en local; en producción, `https://tu-dominio.com`
   - **Redirect URI** (antes se llamaba **Authorization callback URL**):  
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`  
     (reemplaza `TU-PROYECTO` por la referencia de tu proyecto; la ves en Settings → API, en Project URL)
3. Crea la app y copia el **Client ID**. Genera un **Client Secret**.

### Proveedor en Supabase

1. En Supabase: **Authentication → Sign In / Providers → GitHub**.
2. Actívalo y pega el Client ID y el Client Secret.
3. En **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (luego la cambias a tu dominio de Vercel)
   - **Redirect URLs:** agrega  
     `http://localhost:3000/**`  
     y, cuando despliegues, `https://tu-dominio.com/**`

## 3. Crear las tablas (migración)

En el dashboard: **SQL Editor → New query**. Abre el archivo

`supabase/migrations/20240927180000_init.sql`

cópialo entero, pégalo y pulsa **Run**.

Eso crea `profiles`, `vibekathons`, `event_access`, `submissions`, `comments`, las funciones auxiliares y las **políticas RLS**. Los eventos privados no se pueden leer si no eres organizador o no redimiste el link de invitación.

Si prefieres la CLI de Supabase:

```bash
npx supabase login
npx supabase link --project-ref TU-PROYECTO
npx supabase db push
```

## 4. Correr el sitio en tu máquina

```bash
git clone <este-repo>
cd vibekathon
cp .env.example .env.local
```

Edita `.env.local` con los valores de **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
  (si tu proyecto todavía muestra la **anon / public** key, usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 5. Desplegar en Vercel

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** y elige el repo.
3. Framework: Next.js (lo detecta solo).
4. En Environment Variables, agrega las mismas que en `.env.local`.
5. Deploy.
6. Vuelve a GitHub OAuth y a Supabase:
   - Homepage / Site URL: `https://tu-proyecto.vercel.app` (o tu dominio)
   - Redirect URLs: agrega `https://tu-proyecto.vercel.app/auth/callback`
   - Si quieres, pon `NEXT_PUBLIC_SITE_URL` con esa misma URL

## Cómo probar el flujo completo

1. Entra con GitHub.
2. Crea un vibekathon **público** y otro **privado**.
3. En otra ventana (o otro usuario de GitHub), confirma que el privado no aparece en la portada.
4. Copia el link de invitación desde la página del evento privado, ábrelo con la otra cuenta y participa.
5. Como organizador: comenta, pon puntaje y elige ganador.

## Scripts

- `npm run dev` — desarrollo en [http://localhost:3000](http://localhost:3000)
- `npm run lint` — ESLint
- `npm run build` — build de producción
- `npm start` — servir el build (mismo puerto 3000)

## Notas para quien organiza el código

- No hay ORM, ni capa de repositorios, ni librería de estado. Las páginas leen con `lib/data.ts` y los formularios escriben con `lib/actions.ts`.
- El estado próximo / en curso / finalizado se calcula por fechas en `lib/helpers.ts`, no se guarda en la base.
- Un evento privado sin invitación responde como 404: no revelamos que existe.
- El token de invitación no viaja en el `SELECT` normal; el organizador lo pide con `get_invite_token`.
