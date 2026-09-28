#!/usr/bin/env node
/**
 * Pruebas de las reglas de acceso (RLS) y de las funciones de la base.
 *
 * Lo más simple: un proyecto de prueba (o `npx supabase start`) y:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run test:rls
 *
 * Lee también .env.local si existe. Necesita:
 *   NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role, ¡secreta!)
 *
 * Crea usuarios temporales y los borra al terminar.
 */

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !anon || !service) {
  console.error(`
Faltan variables de entorno.

  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY (o PUBLISHABLE_KEY)
  SUPABASE_SERVICE_ROLE_KEY

Ponlas en .env.local o expórtalas. La service_role está en
Supabase → Project Settings → API. No la subas a GitHub.
`);
  process.exit(1);
}

if (service === anon) {
  console.error("SUPABASE_SERVICE_ROLE_KEY no puede ser la anon key.");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GITHUB_REPO = "https://github.com/octocat/Hello-World";
const stamp = Date.now();

let passed = 0;
let failed = 0;
const createdUserIds = [];

function loadEnvFile(name) {
  if (!existsSync(name)) return;
  for (const line of readFileSync(name, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function asUser(accessToken) {
  return createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function createTestUser(label) {
  const email = `rls-${label}-${stamp}@vibekathon.test`;
  const password = `Prueba-${stamp}-Aa1`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { user_name: `rls_${label}`, avatar_url: "" },
  });
  if (error || !data.user) {
    throw new Error(`No se pudo crear el usuario ${label}: ${error?.message}`);
  }
  createdUserIds.push(data.user.id);

  const browser = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: signError } = await browser.auth.signInWithPassword({
    email,
    password,
  });
  if (signError || !session.session) {
    throw new Error(`No se pudo entrar como ${label}: ${signError?.message}`);
  }

  return {
    id: data.user.id,
    token: session.session.access_token,
    db: asUser(session.session.access_token),
  };
}

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  OK     ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FALLO  ${name}`);
    console.log(`         ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function insertEvent(user, fields) {
  const { data, error } = await user.db
    .from("vibekathons")
    .insert({
      organizer_id: user.id,
      title: fields.title ?? "Evento de prueba",
      description: fields.description ?? "desc",
      starts_at: fields.starts_at,
      ends_at: fields.ends_at,
      visibility: fields.visibility ?? "public",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`No se pudo crear evento: ${error?.message}`);
  }
  return data.id;
}

async function main() {
  console.log("Creando usuarios de prueba A, B, C y D…");
  const A = await createTestUser("a");
  const B = await createTestUser("b");
  const C = await createTestUser("c");
  const D = await createTestUser("d");
  console.log("Corriendo pruebas:\n");

  const active = { starts_at: hoursFromNow(-2), ends_at: hoursFromNow(4) };
  const upcoming = { starts_at: hoursFromNow(4), ends_at: hoursFromNow(8) };
  const finished = { starts_at: hoursFromNow(-8), ends_at: hoursFromNow(-1) };

  let privateId;
  let privateToken;

  await test("B no ve un evento privado de A sin invitación", async () => {
    privateId = await insertEvent(A, {
      ...active,
      visibility: "private",
      title: "Privado sin invitar",
    });
    const { data } = await B.db.from("vibekathons").select("id").eq("id", privateId).maybeSingle();
    assert(data === null, "B vio el evento privado");
  });

  await test("B sí ve el evento privado después de canjear la invitación", async () => {
    const { data: token, error } = await A.db.rpc("get_invite_token", { event_id: privateId });
    if (error || !token) throw new Error(error?.message || "A no obtuvo el token");
    privateToken = token;
    const { data: redeemed, error: redeemError } = await B.db.rpc("redeem_invite", {
      token: privateToken,
    });
    if (redeemError) throw new Error(redeemError.message);
    assert(redeemed === privateId, "redeem_invite no devolvió el evento");
    const { data } = await B.db.from("vibekathons").select("id").eq("id", privateId).maybeSingle();
    assert(data?.id === privateId, "B sigue sin ver el evento tras canjear");
  });

  await test("Regenerar el link saca a B si no envió un repo", async () => {
    const { data: newToken, error } = await A.db.rpc("regenerate_invite", {
      event_id: privateId,
    });
    if (error) throw new Error(error.message);
    const { data } = await B.db.from("vibekathons").select("id").eq("id", privateId).maybeSingle();
    assert(data === null, "B siguió viendo el evento sin haber enviado");
    const { error: oldTokenError } = await B.db.rpc("redeem_invite", { token: privateToken });
    assert(oldTokenError, "El link viejo todavía funcionó");
    const { error: newRedeemError } = await B.db.rpc("redeem_invite", { token: newToken });
    if (newRedeemError) throw new Error(newRedeemError.message);
  });

  let privateWithSubmit;
  await test("Regenerar el link mantiene a B si ya envió un repo", async () => {
    privateWithSubmit = await insertEvent(A, {
      ...active,
      visibility: "private",
      title: "Privado con envío",
    });
    const { data: token, error: tokenError } = await A.db.rpc("get_invite_token", {
      event_id: privateWithSubmit,
    });
    if (tokenError || !token) throw new Error(tokenError?.message || "sin token");
    const { error: redeemError } = await B.db.rpc("redeem_invite", { token });
    if (redeemError) throw new Error(redeemError.message);
    const { error: submitError } = await B.db.from("submissions").insert({
      vibekathon_id: privateWithSubmit,
      participant_id: B.id,
      repo_url: GITHUB_REPO,
      description: "mi proyecto",
    });
    if (submitError) throw new Error(submitError.message);
    const { error: regenError } = await A.db.rpc("regenerate_invite", {
      event_id: privateWithSubmit,
    });
    if (regenError) throw new Error(regenError.message);
    const { data } = await B.db
      .from("vibekathons")
      .select("id")
      .eq("id", privateWithSubmit)
      .maybeSingle();
    assert(data?.id === privateWithSubmit, "B perdió acceso aunque ya había enviado");
  });

  let scoreEventId;
  let bSubmissionId;
  await test("B no puede ponerse puntaje", async () => {
    scoreEventId = await insertEvent(A, { ...active, title: "Puntaje" });
    const { data, error } = await B.db
      .from("submissions")
      .insert({
        vibekathon_id: scoreEventId,
        participant_id: B.id,
        repo_url: GITHUB_REPO,
        description: "para puntaje",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message || "B no pudo enviar");
    bSubmissionId = data.id;
    const { error: scoreError } = await B.db.rpc("set_submission_score", {
      sub_id: bSubmissionId,
      new_score: 10,
    });
    assert(scoreError, "B pudo ponerse puntaje");
    const { error: updateError } = await B.db
      .from("submissions")
      .update({ score: 9 })
      .eq("id", bSubmissionId);
    assert(updateError, "B pudo cambiar score con UPDATE directo");
  });

  await test("B no lee comentarios de otro participante", async () => {
    const { data: aSub, error: aErr } = await A.db
      .from("submissions")
      .insert({
        vibekathon_id: scoreEventId,
        participant_id: A.id,
        repo_url: GITHUB_REPO,
        description: "envío del organizador",
      })
      .select("id")
      .single();
    if (aErr || !aSub) throw new Error(aErr?.message || "A no pudo enviar");
    const { error: commentError } = await A.db.from("comments").insert({
      submission_id: aSub.id,
      author_id: A.id,
      body: "comentario privado del organizador sobre su envío",
    });
    if (commentError) throw new Error(commentError.message);
    const { data: seen } = await B.db.from("comments").select("id, body").eq("submission_id", aSub.id);
    assert(!seen || seen.length === 0, "B leyó comentarios de otro envío");
  });

  await test("Envío rechazado antes del inicio", async () => {
    const eventId = await insertEvent(D, { ...upcoming, title: "Aún no empieza" });
    const { error } = await B.db.from("submissions").insert({
      vibekathon_id: eventId,
      participant_id: B.id,
      repo_url: GITHUB_REPO,
      description: "temprano",
    });
    assert(error, "Se aceptó un envío antes de starts_at");
  });

  await test("Envío rechazado después del cierre", async () => {
    const eventId = await insertEvent(D, { ...finished, title: "Ya cerró" });
    const { error } = await B.db.from("submissions").insert({
      vibekathon_id: eventId,
      participant_id: B.id,
      repo_url: GITHUB_REPO,
      description: "tarde",
    });
    assert(error, "Se aceptó un envío después de ends_at");
  });

  await test("Puntaje rechazado antes del cierre", async () => {
    const { error } = await A.db.rpc("set_submission_score", {
      sub_id: bSubmissionId,
      new_score: 8,
    });
    assert(error, "El organizador pudo puntuar antes de ends_at");
    assert(
      /terminó|terminado|puntaje/i.test(error.message),
      `Mensaje inesperado: ${error.message}`,
    );
  });

  await test("Límite de largo del título", async () => {
    const { error } = await D.db.from("vibekathons").insert({
      organizer_id: A.id,
      title: "x".repeat(121),
      description: "",
      starts_at: active.starts_at,
      ends_at: active.ends_at,
      visibility: "public",
    });
    assert(error, "Se aceptó un título de 121 caracteres");
  });

  await test("repo_url debe ser GitHub https y demo_url http(s)", async () => {
    const eventId = await insertEvent(D, { ...active, title: "URLs" });
    const { error: gitlab } = await B.db.from("submissions").insert({
      vibekathon_id: eventId,
      participant_id: B.id,
      repo_url: "https://gitlab.com/alguien/proyecto",
      description: "no github",
    });
    assert(gitlab, "Se aceptó un repo que no es de GitHub");
    const { error: demo } = await B.db.from("submissions").insert({
      vibekathon_id: eventId,
      participant_id: B.id,
      repo_url: GITHUB_REPO,
      demo_url: "ftp://ejemplo.com/demo",
      description: "demo mala",
    });
    assert(demo, "Se aceptó un demo_url que no es http(s)");
  });

  await test("Límite de 5 eventos por usuario cada 24 horas", async () => {
    for (let i = 0; i < 5; i += 1) {
      const { error } = await C.db.from("vibekathons").insert({
        organizer_id: C.id,
        title: `Cupo ${i + 1}`,
        description: "",
        starts_at: active.starts_at,
        ends_at: active.ends_at,
        visibility: "public",
      });
      if (error) throw new Error(`El evento ${i + 1} de C falló: ${error.message}`);
    }
    const { error } = await C.db.from("vibekathons").insert({
      organizer_id: C.id,
      title: "El sexto no debe pasar",
      description: "",
      starts_at: active.starts_at,
      ends_at: active.ends_at,
      visibility: "public",
    });
    assert(error, "C pudo crear un sexto evento en 24 horas");
    assert(/límite de 5/i.test(error.message), `Mensaje inesperado: ${error.message}`);
  });

  await test("El organizador no puede fijar ganador de otro evento", async () => {
    const event1 = await insertEvent(D, { ...finished, title: "Finalizado 1" });
    const event2 = await insertEvent(D, { ...finished, title: "Finalizado 2" });
    const { data: sub, error: subError } = await admin
      .from("submissions")
      .insert({
        vibekathon_id: event1,
        participant_id: B.id,
        repo_url: GITHUB_REPO,
        description: "envío en evento 1",
      })
      .select("id")
      .single();
    if (subError || !sub) throw new Error(subError?.message || "admin no insertó envío");
    const { error: wrong } = await D.db.rpc("set_winner", {
      event_id: event2,
      sub_id: sub.id,
    });
    assert(wrong, "set_winner aceptó un envío de otro evento");
    const { error: direct } = await D.db
      .from("vibekathons")
      .update({ winner_submission_id: sub.id })
      .eq("id", event1);
    assert(direct, "D pudo escribir winner_submission_id con UPDATE directo");
    const { error: ok } = await D.db.rpc("set_winner", {
      event_id: event1,
      sub_id: sub.id,
    });
    if (ok) throw new Error(`set_winner legítimo falló: ${ok.message}`);
  });

  console.log(`\nResultado: ${passed} ok, ${failed} fallos.`);
}

async function cleanup() {
  console.log("\nBorrando usuarios de prueba…");
  for (const id of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.log(`  no se pudo borrar ${id}: ${error.message}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    failed += 1;
  })
  .finally(async () => {
    await cleanup();
    process.exit(failed === 0 ? 0 : 1);
  });
