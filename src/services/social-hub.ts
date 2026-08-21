export type SocialPlatform = 'Instagram' | 'X' | 'Facebook' | 'TikTok';

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  initiallyConnected: boolean;
};

export type SocialUpdate = {
  id: string;
  platform: SocialPlatform;
  summary: string;
};

export type SocialMessagePreview = {
  id: string;
  platform: SocialPlatform;
  preview: string;
};

export type SocialLiveUpdate = {
  id: string;
  label: string;
  summary: string;
};

// Future provider integrations can replace these local fixtures without moving
// OAuth, access tokens, or third-party request logic into the Entertainment UI.
export const MOCK_SOCIAL_ACCOUNTS: SocialAccount[] = [
  { id: 'instagram', platform: 'Instagram', initiallyConnected: true },
  { id: 'x', platform: 'X', initiallyConnected: false },
  { id: 'facebook', platform: 'Facebook', initiallyConnected: false },
  { id: 'tiktok', platform: 'TikTok', initiallyConnected: false },
];

export const MOCK_SOCIAL_UPDATES: SocialUpdate[] = [
  { id: 'instagram-messages', platform: 'Instagram', summary: '3 new messages' },
  { id: 'x-mentions', platform: 'X', summary: '2 new mentions' },
  { id: 'facebook-comment', platform: 'Facebook', summary: '1 new comment' },
  { id: 'tiktok-followers', platform: 'TikTok', summary: 'New follower activity' },
];

export const MOCK_SOCIAL_MESSAGES: SocialMessagePreview[] = [
  { id: 'instagram-preview', platform: 'Instagram', preview: '“Yo, did you see this?”' },
  { id: 'x-preview', platform: 'X', preview: '“Thanks for the reply”' },
  { id: 'facebook-preview', platform: 'Facebook', preview: '“New message received”' },
];

export const MOCK_SOCIAL_LIVE_UPDATES: SocialLiveUpdate[] = [
  { id: 'conversation', label: 'Trending conversation', summary: 'A new entertainment topic is gaining momentum.' },
  { id: 'creator', label: 'Creator live', summary: 'A creator you follow started a demo live session.' },
  { id: 'mentions', label: 'Mention activity', summary: 'New demo mentions are ready to review.' },
];
