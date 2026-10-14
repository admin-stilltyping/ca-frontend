export type MatchType = 'contains' | 'exact' | 'any';

export interface Stats {
  total_sent: number;
  sent_7d: number;
  failed_7d: number;
}

export interface Me {
  ig_user_id: string;
  username: string;
  name: string | null;
  profile_picture_url: string | null;
  token_expires_at: string;
  webhook_subscribed: boolean;
  webhook_error: string | null;
  stats: Stats;
}

export interface Media {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
}

export interface Rule {
  id: string;
  name: string;
  media_id: string | null;
  media_label: string | null;
  media_thumbnail_url: string | null;
  match_type: MatchType;
  keywords: string[];
  dm_message: string;
  public_reply: string | null;
  enabled: boolean;
  sent_count: number;
  created_at: string;
}

export interface RuleInput {
  name: string;
  media_id: string | null;
  media_label: string | null;
  media_thumbnail_url: string | null;
  match_type: MatchType;
  keywords: string;
  dm_message: string;
  public_reply: string;
}

export interface Activity {
  id: number;
  rule_id: string | null;
  rule_name: string | null;
  comment_id: string;
  media_id: string | null;
  username: string | null;
  comment_text: string | null;
  status: 'sent' | 'failed';
  error: string | null;
  created_at: string;
}

export interface TestResult {
  matched: boolean;
  rule: Rule | null;
  dm: string | null;
  public_reply: string | null;
}
