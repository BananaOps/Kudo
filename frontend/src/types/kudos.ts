/** Shared domain types for the Kudo frontend. */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  kudosCount: number;
}

/** A single kudo event as returned by the API. */
export interface Kudo {
  id: string;
  workspaceId?: string;
  fromUserId: string;
  fromUserName: string;
  fromAvatarUrl?: string;
  toUserId: string;
  toUserName: string;
  toAvatarUrl?: string;
  kudosCount: number;
  message: string;
  channel?: string;
  createdAt: string;
}

export type KudoItem = Kudo;

export interface KudosStats {
  receivedThisWeek: number;
  receivedThisMonth: number;
  givenThisWeek: number;
  givenThisMonth: number;
  streak?: number;
  quotaRemaining?: number;
}

/** Shape of GET /api/me/kudos */
export interface MyKudosResponse {
  received: Kudo[];
  given: Kudo[];
  stats: KudosStats;
}

export interface ChannelStat {
  name: string;
  count: number;
}

export interface TopUser {
  rank: number;
  userId: string;
  name: string;
  kudosCount: number;
}

export interface HomeData {
  stats: KudosStats;
  recentKudos: Kudo[];
  topUsers: TopUser[];
  channelStats: ChannelStat[];
}

export interface MyKudosData {
  received: Kudo[];
  given: Kudo[];
  stats: KudosStats;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  period: string;
}

/** Shape of GET|PUT /api/admin/settings */
export interface AdminSettings {
  emoji: string;
  currencySingular: string;
  currencyPlural: string;
  dailyAllowance: number;
}

/** Client-side validation errors for AdminSettings. */
export type AdminSettingsErrors = Partial<Record<keyof AdminSettings, string>>;

export type PeriodFilter = 'week' | 'month' | 'allTime';
export type LeaderboardTab = 'receivers' | 'givers';

