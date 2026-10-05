export interface InstagramUser {
  username: string;
  profileUrl: string;
  timestamp?: string; // When they followed / were followed
}

export interface Snapshot {
  id: string;
  date: string; // ISO date string
  label: string;
  followers: InstagramUser[];
  following: InstagramUser[];
  followerCount: number;
  followingCount: number;
  hasExtendedData?: boolean;
}

export interface ComparisonResult {
  unfollowedMe: InstagramUser[]; // Were in old followers, not in new
  iDontFollowBack: InstagramUser[]; // Follow me but I don't follow them
  theyDontFollowBack: InstagramUser[]; // I follow but they don't follow me
  newFollowers: InstagramUser[]; // In new followers, not in old
  mutualFollowers: InstagramUser[]; // We follow each other
}

export type CategoryType =
  | 'unfollowedMe'
  | 'iDontFollowBack'
  | 'theyDontFollowBack'
  | 'newFollowers'
  | 'mutualFollowers';

export interface CategoryInfo {
  key: CategoryType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export type ThemeMode = 'light' | 'dark';

export interface AppState {
  snapshots: Snapshot[];
  currentComparison: ComparisonResult | null;
  selectedCategory: CategoryType | null;
  whitelistedUsers: string[];
  unfollowedInSession: string[];
  isLoading: boolean;
  error: string | null;
}
