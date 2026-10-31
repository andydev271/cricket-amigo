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
