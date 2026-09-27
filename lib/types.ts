// Tipos que coinciden con las tablas de supabase/migrations.
// Los escribimos a mano para no depender de generar tipos.

export type Visibility = "public" | "private";
export type EventStatus = "upcoming" | "active" | "finished";

export type Profile = {
  id: string;
  github_username: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Vibekathon = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  visibility: Visibility;
  invite_token: string | null;
  winner_submission_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  vibekathon_id: string;
  participant_id: string;
  repo_url: string;
  demo_url: string | null;
  description: string;
  score: number | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  submission_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type VibekathonWithOrganizer = Vibekathon & {
  organizer: Profile | null;
};

export type SubmissionWithParticipant = Submission & {
  participant: Profile | null;
};

export type CommentWithAuthor = Comment & {
  author: Profile | null;
};
