import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type {
  CommentWithAuthor,
  EventStatus,
  SubmissionWithParticipant,
  VibekathonWithOrganizer,
} from "./types";
import { eventStatus } from "./helpers";

const EVENT_SELECT = `
  id,
  organizer_id,
  title,
  description,
  starts_at,
  ends_at,
  visibility,
  winner_submission_id,
  created_at,
  updated_at,
  organizer:profiles!organizer_id (
    id,
    github_username,
    avatar_url,
    created_at
  )
`;

function asEvent(row: unknown): VibekathonWithOrganizer {
  const r = row as VibekathonWithOrganizer & {
    organizer?: VibekathonWithOrganizer["organizer"] | VibekathonWithOrganizer["organizer"][];
  };
  const organizer = Array.isArray(r.organizer) ? r.organizer[0] : r.organizer;
  return { ...r, organizer: organizer ?? null };
}

export async function listPublicVibekathons(filter: EventStatus | "all" = "all") {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vibekathons")
    .select(EVENT_SELECT)
    .eq("visibility", "public")
    .order("starts_at", { ascending: false });

  if (error || !data) return [];

  const events = data.map(asEvent);
  if (filter === "all") return events;
  return events.filter((event) => eventStatus(event.starts_at, event.ends_at) === filter);
}

export async function getInviteToken(eventId: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invite_token", {
    event_id: eventId,
  });
  if (error || !data) return null;
  return String(data);
}

export async function getVibekathon(id: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vibekathons")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return asEvent(data);
}

export async function listSubmissions(vibekathonId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      vibekathon_id,
      participant_id,
      repo_url,
      demo_url,
      description,
      score,
      created_at,
      updated_at,
      participant:profiles!participant_id (
        id,
        github_username,
        avatar_url,
        created_at
      )
    `,
    )
    .eq("vibekathon_id", vibekathonId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as SubmissionWithParticipant & {
      participant?: SubmissionWithParticipant["participant"] | SubmissionWithParticipant["participant"][];
    };
    const participant = Array.isArray(r.participant) ? r.participant[0] : r.participant;
    return { ...r, participant: participant ?? null };
  });
}

export async function getMySubmission(vibekathonId: string, userId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("vibekathon_id", vibekathonId)
    .eq("participant_id", userId)
    .maybeSingle();

  return (data as import("./types").Submission | null) ?? null;
}

export async function listComments(submissionIds: string[]) {
  if (!isSupabaseConfigured() || submissionIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      submission_id,
      author_id,
      body,
      created_at,
      author:profiles!author_id (
        id,
        github_username,
        avatar_url,
        created_at
      )
    `,
    )
    .in("submission_id", submissionIds)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as CommentWithAuthor & {
      author?: CommentWithAuthor["author"] | CommentWithAuthor["author"][];
    };
    const author = Array.isArray(r.author) ? r.author[0] : r.author;
    return { ...r, author: author ?? null };
  });
}

