"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { isLikelyGithubRepoUrl, isValidHttpUrl, newInviteToken } from "./helpers";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createVibekathon(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/vibekathons/new");

  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const startsAt = readString(formData, "starts_at");
  const endsAt = readString(formData, "ends_at");
  const visibility = readString(formData, "visibility") === "private" ? "private" : "public";

  if (!title) fail("/vibekathons/new", "El título es obligatorio.");
  if (!startsAt || !endsAt) fail("/vibekathons/new", "Indica las fechas de inicio y fin.");

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    fail("/vibekathons/new", "Las fechas no son válidas.");
  }
  if (end <= start) {
    fail("/vibekathons/new", "La fecha de fin debe ser posterior a la de inicio.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vibekathons")
    .insert({
      organizer_id: me.id,
      title,
      description,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      visibility,
      invite_token: newInviteToken(),
    })
    .select("id")
    .single();

  if (error || !data) {
    fail("/vibekathons/new", error?.message || "No se pudo crear el vibekathon.");
  }

  revalidatePath("/");
  redirect(`/vibekathons/${data.id}`);
}

export async function updateVibekathon(formData: FormData) {
  const id = readString(formData, "id");
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/vibekathons/${id}/edit`);

  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const startsAt = readString(formData, "starts_at");
  const endsAt = readString(formData, "ends_at");
  const visibility = readString(formData, "visibility") === "private" ? "private" : "public";

  if (!id) fail("/", "Falta el identificador del evento.");
  if (!title) fail(`/vibekathons/${id}/edit`, "El título es obligatorio.");
  if (!startsAt || !endsAt) {
    fail(`/vibekathons/${id}/edit`, "Indica las fechas de inicio y fin.");
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    fail(`/vibekathons/${id}/edit`, "Las fechas no son válidas.");
  }
  if (end <= start) {
    fail(`/vibekathons/${id}/edit`, "La fecha de fin debe ser posterior a la de inicio.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vibekathons")
    .update({
      title,
      description,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      visibility,
    })
    .eq("id", id)
    .eq("organizer_id", me.id);

  if (error) {
    fail(`/vibekathons/${id}/edit`, error.message);
  }

  revalidatePath("/");
  revalidatePath(`/vibekathons/${id}`);
  redirect(`/vibekathons/${id}`);
}

export async function regenerateInviteToken(formData: FormData) {
  const id = readString(formData, "id");
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("vibekathons")
    .update({ invite_token: newInviteToken() })
    .eq("id", id)
    .eq("organizer_id", me.id);

  if (error) {
    fail(`/vibekathons/${id}`, error.message);
  }

  revalidatePath(`/vibekathons/${id}`);
  redirect(`/vibekathons/${id}`);
}

export async function upsertSubmission(formData: FormData) {
  const eventId = readString(formData, "vibekathon_id");
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/vibekathons/${eventId}/submit`);

  const repoUrl = readString(formData, "repo_url");
  const demoUrl = readString(formData, "demo_url");
  const description = readString(formData, "description");

  if (!isLikelyGithubRepoUrl(repoUrl)) {
    fail(
      `/vibekathons/${eventId}/submit`,
      "El repo debe ser una URL pública de GitHub, por ejemplo https://github.com/usuario/proyecto.",
    );
  }
  if (demoUrl && !isValidHttpUrl(demoUrl)) {
    fail(`/vibekathons/${eventId}/submit`, "La URL del demo no parece válida.");
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("vibekathon_id", eventId)
    .eq("participant_id", me.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("submissions")
      .update({
        repo_url: repoUrl,
        demo_url: demoUrl || null,
        description,
      })
      .eq("id", existing.id)
      .eq("participant_id", me.id);

    if (error) fail(`/vibekathons/${eventId}/submit`, error.message);
  } else {
    const { error } = await supabase.from("submissions").insert({
      vibekathon_id: eventId,
      participant_id: me.id,
      repo_url: repoUrl,
      demo_url: demoUrl || null,
      description,
    });

    if (error) fail(`/vibekathons/${eventId}/submit`, error.message);
  }

  revalidatePath(`/vibekathons/${eventId}`);
  redirect(`/vibekathons/${eventId}`);
}

export async function setSubmissionScoreAction(formData: FormData) {
  const eventId = readString(formData, "vibekathon_id");
  const submissionId = readString(formData, "submission_id");
  const raw = readString(formData, "score");
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const score = raw === "" ? null : Number(raw);
  if (score !== null && (Number.isNaN(score) || score < 1 || score > 10)) {
    fail(`/vibekathons/${eventId}`, "El puntaje debe ser un número del 1 al 10.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_submission_score", {
    sub_id: submissionId,
    new_score: score,
  });

  if (error) fail(`/vibekathons/${eventId}`, error.message);

  revalidatePath(`/vibekathons/${eventId}`);
  redirect(`/vibekathons/${eventId}`);
}

export async function setWinnerAction(formData: FormData) {
  const eventId = readString(formData, "vibekathon_id");
  const submissionId = readString(formData, "submission_id");
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_winner", {
    event_id: eventId,
    sub_id: submissionId || null,
  });

  if (error) fail(`/vibekathons/${eventId}`, error.message);

  revalidatePath(`/vibekathons/${eventId}`);
  redirect(`/vibekathons/${eventId}`);
}

export async function addComment(formData: FormData) {
  const eventId = readString(formData, "vibekathon_id");
  const submissionId = readString(formData, "submission_id");
  const body = readString(formData, "body");
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  if (!body) fail(`/vibekathons/${eventId}`, "El comentario no puede estar vacío.");

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    submission_id: submissionId,
    author_id: me.id,
    body,
  });

  if (error) fail(`/vibekathons/${eventId}`, error.message);

  revalidatePath(`/vibekathons/${eventId}`);
  redirect(`/vibekathons/${eventId}`);
}
