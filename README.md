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
- Borrar lo propio: el participante su envío y sus comentarios; el organizador su evento.
- Páginas de [privacidad](/privacidad) y [términos](/terminos) (borrador para el MVP).

Fuera de alcance por ahora: premios, pagos, equipos, votación de la comunidad, CAPTCHA, deploy. El correo de contacto aún es un marcador en `lib/constants.ts`.

## Cómo está organizado el código

Pocas carpetas, a propósito. Si es tu primer Next.js, empieza por aquí:

```
app/                  Páginas. Cada carpeta es una URL.
  page.tsx            Portada / explorar  →  /
  que-es/page.tsx     Explicación         →  /que-es
  privacidad/         Aviso de privacidad →  /privacidad
  terminos/           Términos (borrador) →  /terminos
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
  constants.ts        Límites de texto y correo de contacto
  types.ts            Formas de los datos
  supabase/           Clientes de Supabase (navegador, servidor, proxy)
scripts/test-rls.mjs  Pruebas de reglas de acceso (RLS)
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

Si **ya corriste la migración inicial** (es tu caso si el sitio ya funciona), **no la vuelvas a pegar**. Aplica solo la segunda:

`supabase/migrations/20260928140000_seguridad_beta.sql`

misma idea: New query → pegar todo → Run. Esta segunda migración recorta textos demasiado largos, anula `demo_url` inválidas, y deja `NOT VALID` la regla de `repo_url` por si hay envíos viejos con un formato raro. Las filas nuevas sí tienen que cumplir el formato de GitHub.

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

## Cómo probar el flujo completo (manual, dos cuentas de GitHub)

Usa tu cuenta y otra en una **ventana de incógnito** (o otro navegador).

1. Entra con GitHub (cuenta A) y crea un vibekathon **público** en curso (inicio en el pasado, fin en el futuro).
2. En incógnito, entra con la cuenta B. Deberías ver el público en la portada y poder abrir el formulario de envío.
3. Con A, crea un vibekathon **privado** también en curso. En la portada (B) no debe aparecer. Si B pega la URL del evento, debe verse como si no existiera (404).
4. Con A, copia el link de invitación y ábrelo con B. B entra al evento. Envía un repo `https://github.com/usuario/repo`.
5. Con A, pulsa **Regenerar link**. B debería seguir viendo el evento (porque ya envió). Crea otro privado, invita a B **sin** que envíe nada, regenera: B pierde el acceso y el link viejo deja de servir.
6. Antes de la fecha de inicio, B no ve el formulario de envío (mensaje de que aún no empieza). Después del cierre, tampoco puede editar.
7. Con A, antes del cierre: el panel deja comentar pero **no** muestra puntaje ni ganador. Cuando el evento ya terminó, A puntúa y elige ganador. B no puede puntuar.
8. B borra su comentario (confirmación) y, si quiere, su envío. A puede borrar el evento desde Editar.
9. Mira `/privacidad` y `/terminos` en el pie de página.

## Pruebas automáticas de RLS

El script `scripts/test-rls.mjs` crea dos (en realidad tres) usuarios temporales y comprueba las reglas en la base. Lo más simple es apuntarlo a un **proyecto de prueba** en supabase.com, no al de producción.

1. Aplica las dos migraciones en ese proyecto (SQL Editor).
2. En `.env.local` pon la URL, la anon/publishable key y, **solo para este script**:

```
SUPABASE_SERVICE_ROLE_KEY=...   # Settings → API → service_role
```

3. Corre:

```bash
npm run test:rls
```

Si usas Supabase en tu máquina (hace falta Docker):

```bash
npx supabase start
# copia la URL, anon key y service_role que imprime el comando
npm run test:rls
```

Deberías ver una línea `OK` por cada caso y al final `Resultado: N ok, 0 fallos.` El script borra los usuarios de prueba al terminar.

## Scripts

- `npm run dev` — desarrollo en [http://localhost:3000](http://localhost:3000)
- `npm run lint` — ESLint
- `npm run build` — build de producción
- `npm start` — servir el build (mismo puerto 3000)
- `npm run test:rls` — pruebas de RLS (hace falta la service_role key)

## Notas para quien organiza el código

- No hay ORM, ni capa de repositorios, ni librería de estado. Las páginas leen con `lib/data.ts` y los formularios escriben con `lib/actions.ts`.
- El estado próximo / en curso / finalizado se calcula por fechas en `lib/helpers.ts`, no se guarda en la base. La base también lo exige: envíos solo entre `starts_at` y `ends_at`; puntaje y ganador solo después de `ends_at`.
- Un evento privado sin invitación responde como 404: no revelamos que existe.
- El token de invitación no viaja en el `SELECT` normal; el organizador lo pide con `get_invite_token`. Regenerar el link llama a `regenerate_invite`, que rota el token y quita el acceso a quien no haya enviado.
- El correo de contacto está en `lib/constants.ts` (`CONTACT_EMAIL`). Cámbialo ahí; las páginas legales lo leen de ese archivo.
- Los envíos y comentarios de un participante, y el evento de un organizador, se pueden borrar. Si se borra el envío ganador, `winner_submission_id` queda vacío (`on delete set null`).
