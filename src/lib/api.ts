import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth.token";
const DEVICE_KEY = "device.id";

const baseUrl: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "https://cricketamigo.test";

async function getDeviceId(): Promise<string> {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_KEY);
    if (!id) {
      id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await SecureStore.setItemAsync(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Platform.OS}-anonymous`;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; form?: FormData } = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.form ??
      (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  const json = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json as { message?: string } | null)?.message ?? `HTTP ${res.status}`,
      (json as { errors?: Record<string, string[]> } | null)?.errors,
    );
  }

  return json as T;
}

export interface ApiUser {
  id: number;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  locale: string;
  city: string | null;
  country: string | null;
  dominant_hand: string | null;
  /** Spatie app roles (member, super-admin, ...) — access control */
  roles: string[];
  /** Cricket profile tags (player, coach, scorer, fan) — display metadata */
  sport_roles: string[] | null;
  interests: string[] | null;
  credits: number;
  is_admin: boolean;
  is_guest: boolean;
  onboarded: boolean;
  friend_count?: number;
}

export interface Team {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  member_count: number;
  my_role: string;
  members?: Array<{
    id: number;
    name: string;
    username: string | null;
    avatar_url: string | null;
    role: string;
  }>;
}

export interface InvitePreview {
  usable: boolean;
  team: { name: string; city: string | null; member_count: number };
  role: string;
  expires_at: string | null;
}

export interface CreditTx {
  id: number;
  amount: number;
  balance_after: number;
  kind: string;
  created_at: string;
}

export interface MatchPlayer {
  id: number;
  side: "a" | "b";
  name: string;
  is_captain: boolean;
  is_keeper: boolean;
  batting_order: number;
}

export interface MatchInnings {
  id: number;
  number: number;
  batting: "a" | "b";
  runs: number;
  wickets: number;
  overs: string;
  target: number | null;
  status: "in_progress" | "completed";
}

export interface MatchDetail {
  id: number;
  status: "scheduled" | "live" | "completed" | "abandoned";
  can_score: boolean;
  team_a: { id: number | null; name: string };
  team_b: { id: number | null; name: string };
  overs_limit: number;
  ball_type: string;
  ground: string | null;
  city: string | null;
  toss_winner: "a" | "b" | null;
  toss_decision: "bat" | "bowl" | null;
  result: { winner: "a" | "b" | null; text: string } | null;
  stream_status: "off" | "live" | "ended";
  players: MatchPlayer[];
  innings: MatchInnings[];
}

export interface ScoreSummary {
  id: number;
  status: MatchDetail["status"];
  team_a: string;
  team_b: string;
  ground: string | null;
  overs_limit: number;
  innings: Array<{
    number: number;
    batting: string;
    runs: number;
    wickets: number;
    overs: string;
    target: number | null;
    status: string;
    extras: { wides: number; no_balls: number; byes: number; leg_byes: number };
  }>;
  current: {
    striker: { id: number; name: string; runs: number; balls: number } | null;
    non_striker: {
      id: number;
      name: string;
      runs: number;
      balls: number;
    } | null;
    bowler: {
      id: number;
      name: string;
      overs: string;
      runs: number;
      wickets: number;
    } | null;
    last_balls: string[];
    required: { runs: number; balls: number } | null;
  } | null;
  result: MatchDetail["result"];
  stream_url: string | null;
}

export interface MatchListItem {
  id: number;
  team_a: string;
  team_b: string;
  ground: string | null;
  overs_limit: number;
  status: MatchDetail["status"];
  result: MatchDetail["result"];
  innings: Array<{
    number: number;
    batting: string;
    runs: number;
    wickets: number;
    overs: string;
  }>;
  can_score: boolean;
}

export interface BallInput {
  striker_id: number;
  non_striker_id: number;
  bowler_id: number;
  bat_runs?: number;
  extra_type?: "none" | "wide" | "no_ball" | "bye" | "leg_bye";
  extra_runs?: number;
  wicket_type?:
    | "bowled"
    | "caught"
    | "lbw"
    | "run_out"
    | "stumped"
    | "hit_wicket"
    | null;
  out_player_id?: number | null;
  fielder_id?: number | null;
}

export interface TournamentListItem {
  id: number;
  name: string;
  city: string | null;
  format: string;
  overs_limit: number;
  status: string;
  teams_count: number;
  max_teams: number;
  starts_on: string | null;
}

export interface TournamentDetail {
  id: number;
  name: string;
  city: string | null;
  format: string;
  overs_limit: number;
  ball_type: string;
  max_teams: number;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  is_organizer: boolean;
  teams: Array<{ id: number; team_id: number | null; name: string }>;
  fixtures: Array<{
    id: number;
    match_id: number;
    round: string;
    team_a: string;
    team_b: string;
    status: MatchDetail["status"];
    score: Array<{
      batting: string;
      runs: number;
      wickets: number;
      overs: string;
    }>;
    result: MatchDetail["result"];
  }>;
}

export interface StandingRow {
  tournament_team_id: number;
  team_id: number | null;
  name: string;
  p: number;
  w: number;
  l: number;
  t: number;
  nr: number;
  pts: number;
  nrr: number;
}

export interface BoardPost {
  id: number;
  kind: string;
  city: string | null;
  text: string;
  user: Pick<ApiUser, "id" | "name" | "username" | "avatar_url"> | null;
  team: { id: number; name: string } | null;
  mine: boolean;
  created_at: string;
}

export interface MatchRequestItem {
  id: number;
  from: { id: number; name: string } | null;
  to: { id: number; name: string } | null;
  message: string | null;
  proposed_at: string | null;
  status: string;
  match_id: number | null;
  can_respond: boolean;
}

export interface LeaderboardEntry {
  user: Pick<ApiUser, "id" | "name" | "username" | "avatar_url" | "city">;
  runs?: number;
  balls?: number;
  wickets?: number;
}

export interface Flags {
  free_mode: boolean;
  min_supported_version: string;
  locales: string[];
  default_locale: string;
  features: Record<string, boolean>;
  ads: Record<string, boolean | number>;
  credits: Record<string, number>;
}

export const api = {
  baseUrl,
  getDeviceId,

  flags: () => request<Flags>("/flags"),

  auth: {
    device: (locale?: string) =>
      getDeviceId().then((device_id) =>
        request<{ token: string; user: ApiUser }>("/auth/device", {
          method: "POST",
          body: {
            device_id,
            platform: Platform.OS,
            app_version: Constants.expoConfig?.version,
            locale,
          },
        }),
      ),
    register: (input: {
      name: string;
      username: string;
      email: string;
      password: string;
      password_confirmation: string;
      locale?: string;
    }) =>
      getDeviceId().then((device_id) =>
        request<{ token: string; user: ApiUser }>("/auth/register", {
          method: "POST",
          body: { ...input, device_id },
        }),
      ),
    login: (login: string, password: string) =>
      getDeviceId().then((device_id) =>
        request<{ token: string; user: ApiUser }>("/auth/login", {
          method: "POST",
          body: { login, password, device_id },
        }),
      ),
    logout: () => request("/auth/logout", { method: "POST" }),
  },

  me: {
    get: () => request<ApiUser>("/me"),
    update: (data: Partial<ApiUser>) =>
      request<ApiUser>("/me", { method: "PUT", body: data }),
    updateLocale: (locale: string) =>
      request<ApiUser>("/me/locale", { method: "PUT", body: { locale } }),
    uploadAvatar: (uri: string, name = "avatar.jpg", type = "image/jpeg") => {
      const form = new FormData();
      form.append("avatar", { uri, name, type } as unknown as Blob);
      return request<ApiUser>("/me/avatar", { method: "POST", form });
    },
  },

  users: {
    search: (q: string) =>
      request<
        Array<Pick<ApiUser, "id" | "name" | "username" | "avatar_url" | "city">>
      >(`/users/search?q=${encodeURIComponent(q)}`),
    show: (id: number) => request<ApiUser>(`/users/${id}`),
  },

  friends: {
    list: () => request<Array<Record<string, unknown>>>("/friends"),
    requests: () =>
      request<Array<Record<string, unknown>>>("/friends/requests"),
    suggestions: () =>
      request<Array<Record<string, unknown>>>("/friends/suggestions"),
    send: (userId: number) =>
      request(`/friends/request/${userId}`, { method: "POST" }),
    respond: (requestId: number, action: "accept" | "decline") =>
      request(`/friends/respond/${requestId}`, {
        method: "POST",
        body: { action },
      }),
  },

  teams: {
    list: () => request<Team[]>("/teams"),
    create: (data: { name: string; city?: string; country?: string }) =>
      request<Team>("/teams", { method: "POST", body: data }),
    get: (id: number) => request<Team>(`/teams/${id}`),
    leave: (id: number) => request(`/teams/${id}/leave`, { method: "POST" }),
    removeMember: (id: number, userId: number) =>
      request(`/teams/${id}/members/${userId}`, { method: "DELETE" }),
    createInvite: (id: number, opts?: { role?: string; max_uses?: number }) =>
      request<{ token: string; path: string }>(`/teams/${id}/invites`, {
        method: "POST",
        body: opts ?? {},
      }),
  },

  invites: {
    preview: (token: string) => request<InvitePreview>(`/invites/${token}`),
    accept: (token: string) =>
      request<{ joined: boolean; team_id: number; team: string; role: string }>(
        `/invites/${token}/accept`,
        { method: "POST" },
      ),
  },

  matches: {
    list: () =>
      request<{ data: MatchListItem[] }>("/matches").then((r) => r.data),
    create: (data: {
      team_a: {
        id?: number;
        name?: string;
        players: Array<{
          name: string;
          is_captain?: boolean;
          is_keeper?: boolean;
        }>;
      };
      team_b: {
        id?: number;
        name?: string;
        players: Array<{
          name: string;
          is_captain?: boolean;
          is_keeper?: boolean;
        }>;
      };
      overs_limit?: number;
      ball_type?: string;
      ground?: string;
      city?: string;
      toss_winner?: "a" | "b";
      toss_decision?: "bat" | "bowl";
    }) => request<MatchDetail>("/matches", { method: "POST", body: data }),
    get: (id: number) => request<MatchDetail>(`/matches/${id}`),
    score: (id: number) => request<ScoreSummary>(`/matches/${id}/score`),
    start: (id: number) =>
      request<MatchDetail>(`/matches/${id}/start`, { method: "POST" }),
    ball: (matchId: number, inningsId: number, ball: BallInput) =>
      request<{ delivery: unknown; score: ScoreSummary }>(
        `/matches/${matchId}/innings/${inningsId}/balls`,
        { method: "POST", body: ball },
      ),
    undo: (id: number) =>
      request<{ undone: number; score: ScoreSummary }>(`/matches/${id}/undo`, {
        method: "POST",
      }),
    setStream: (
      id: number,
      data: {
        stream_url?: string;
        stream_key?: string;
        stream_status: "off" | "live" | "ended";
      },
    ) =>
      request<{ stream_status: string; stream_url: string | null }>(
        `/matches/${id}/stream`,
        { method: "POST", body: data },
      ),
    end: (id: number, status: "completed" | "abandoned") =>
      request<{ status: string }>(`/matches/${id}`, {
        method: "PUT",
        body: { status },
      }),
  },

  tournaments: {
    list: (params?: { city?: string; status?: string }) => {
      const qs = params
        ? "?" +
          new URLSearchParams(
            Object.entries(params).filter(([, v]) => v) as [string, string][],
          ).toString()
        : "";
      return request<{ data: TournamentListItem[] }>(`/tournaments${qs}`).then(
        (r) => r.data,
      );
    },
    create: (data: {
      name: string;
      city?: string;
      format?: string;
      overs_limit?: number;
      ball_type?: string;
      max_teams?: number;
      starts_on?: string;
      ends_on?: string;
    }) =>
      request<TournamentDetail>("/tournaments", { method: "POST", body: data }),
    get: (id: number) => request<TournamentDetail>(`/tournaments/${id}`),
    registerTeam: (id: number, data: { team_id?: number; name?: string }) =>
      request(`/tournaments/${id}/teams`, { method: "POST", body: data }),
    generateFixtures: (id: number) =>
      request<{ fixtures: number }>(`/tournaments/${id}/fixtures`, {
        method: "POST",
      }),
    standings: (id: number) =>
      request<StandingRow[]>(`/tournaments/${id}/standings`),
    setStatus: (id: number, status: string) =>
      request(`/tournaments/${id}`, { method: "PUT", body: { status } }),
  },

  community: {
    follow: (type: "team" | "user", id: number) =>
      request<{ following: boolean }>("/follows", {
        method: "POST",
        body: { type, id },
      }),
    board: (params?: { kind?: string; city?: string }) => {
      const qs = params
        ? "?" +
          new URLSearchParams(
            Object.entries(params).filter(([, v]) => v) as [string, string][],
          ).toString()
        : "";
      return request<{ data: BoardPost[] }>(`/looking-for${qs}`).then(
        (r) => r.data,
      );
    },
    post: (data: {
      kind: string;
      team_id?: number;
      city?: string;
      text: string;
    }) => request<BoardPost>("/looking-for", { method: "POST", body: data }),
    closePost: (id: number) =>
      request(`/looking-for/${id}/close`, { method: "POST" }),
    challenge: (
      teamId: number,
      data: { to_team_id: number; message?: string; proposed_at?: string },
    ) => request(`/teams/${teamId}/challenges`, { method: "POST", body: data }),
    requests: () =>
      request<{ data: MatchRequestItem[] }>("/match-requests").then(
        (r) => r.data,
      ),
    respond: (id: number, action: "accept" | "decline" | "cancel") =>
      request<{ status: string; match_id?: number }>(
        `/match-requests/${id}/respond`,
        {
          method: "POST",
          body: { action },
        },
      ),
    leaderboards: () =>
      request<{ batting: LeaderboardEntry[]; bowling: LeaderboardEntry[] }>(
        "/leaderboards",
      ),
  },

  credits: {
    get: () => request<{ balance: number; recent: CreditTx[] }>("/credits"),
    history: () =>
      request<{ data: CreditTx[]; next_cursor: string | null }>(
        "/credits/history",
      ),
    earn: (kind: "rewarded_ad" | "daily_bonus", ref?: string) =>
      request<{ balance: number; granted: number }>("/credits/earn", {
        method: "POST",
        body: { kind, ref },
      }),
  },
};
