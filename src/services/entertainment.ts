export type EntertainmentDataProvenance = 'live' | 'mock' | 'unavailable';
export type EntertainmentCategory = 'For You' | 'Movies' | 'TV' | 'Music News' | 'Celebrity' | 'Gaming';
export type EntertainmentContentCategory = Exclude<EntertainmentCategory, 'For You'>;
export type EntertainmentContentId = string;
export type StreamingServiceName = 'Netflix' | 'Hulu' | 'Max' | 'Peacock' | 'Disney+' | 'Prime Video' | 'Tubi' | 'Paramount+';
export type CreatorCategory = 'Travel' | 'Fashion & Style' | 'Food' | 'Pets' | 'Tech' | 'Lifestyle' | 'Sports';

export type EntertainmentCreator = {
  id: EntertainmentContentId;
  name: string;
  handle: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram';
  category: CreatorCategory;
  description: string;
  colors: [string, string];
};

export type EntertainmentLocalEvent = {
  id: EntertainmentContentId;
  title: string;
  category: 'Concert' | 'Festival' | 'Comedy' | 'Pop-up' | 'Family' | 'Exhibit' | 'Sports' | 'Market';
  date: string;
  area: string;
  description: string;
  colors: [string, string];
};

export type EntertainmentStory = {
  id: EntertainmentContentId;
  category: EntertainmentContentCategory;
  headline: string;
  summary: string;
  source: string;
  time: string;
  colors: [string, string];
  imageUrl?: string;
  detailsRoute?: string;
  trending: boolean;
};

export type EntertainmentMediaTitle = {
  id: EntertainmentContentId;
  category: 'Movies' | 'TV';
  title: string;
  year: string;
  releaseDate?: string;
  genre: string;
  rating: string;
  colors: [string, string];
  posterUrl?: string;
  trending: boolean;
};

export type EntertainmentUpcoming = {
  id: EntertainmentContentId;
  category: EntertainmentContentCategory;
  title: string;
  date: string;
  releaseDate?: string;
  genre: string;
  description: string;
  colors: [string, string];
  detailsRoute?: string;
};

export type EntertainmentStreamingPick = {
  platform: 'Netflix' | 'Disney+' | 'Max' | 'Hulu' | 'Apple TV+';
  titles: [string, string];
  colors: [string, string];
};

export type EntertainmentSnapshot = {
  categories: EntertainmentCategory[];
  creators: EntertainmentCreator[];
  aroundYou: EntertainmentLocalEvent[];
  stories: EntertainmentStory[];
  media: EntertainmentMediaTitle[];
  upcoming: EntertainmentUpcoming[];
  streamingPicks: EntertainmentStreamingPick[];
  updatedAt: string;
  dataProvider: string;
};

export type EntertainmentDataResult =
  | { data: EntertainmentSnapshot; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export type EntertainmentIntelligenceSummary = {
  headline: string;
  category: EntertainmentContentCategory;
  source: string;
};

export interface EntertainmentDataProvider {
  readonly provenance: 'live' | 'mock';
  getEntertainment(): Promise<EntertainmentSnapshot>;
}

export const STREAMING_SERVICES: StreamingServiceName[] = ['Netflix', 'Hulu', 'Max', 'Peacock', 'Disney+', 'Prime Video', 'Tubi', 'Paramount+'];

export const MOCK_ENTERTAINMENT_CATEGORIES: EntertainmentCategory[] = ['For You', 'Movies', 'TV', 'Music News', 'Celebrity', 'Gaming'];

export const MOCK_ENTERTAINMENT_STORIES: EntertainmentStory[] = [
  { id: 'summer-screen', category: 'Movies', headline: 'The films everyone will be talking about this summer', summary: 'From sweeping adventures to intimate dramas, these are the releases shaping the season.', source: 'LookUP Culture', time: '12m ago', colors: ['#39245F', '#C65C7B'], trending: true },
  { id: 'prestige-tv', category: 'TV', headline: 'Prestige television enters a bold new era', summary: 'Creators are taking bigger swings as the year’s most anticipated series arrive.', source: 'Screen Daily', time: '28m ago', colors: ['#174A68', '#50A6A2'], trending: true },
  { id: 'album-surprise', category: 'Music News', headline: 'A surprise album is already changing the sound of summer', summary: 'The unannounced release became an overnight favorite with listeners and critics.', source: 'Soundcheck', time: '41m ago', colors: ['#673437', '#E09A4C'], trending: true },
  { id: 'red-carpet', category: 'Celebrity', headline: 'Inside the week’s most memorable red-carpet moments', summary: 'Designers and stars delivered a sharp new take on modern event style.', source: 'The Edit', time: '1h ago', colors: ['#653348', '#E17682'], trending: true },
  { id: 'director-profile', category: 'Celebrity', headline: 'The director behind this year’s breakout hit opens up', summary: 'A candid conversation about creative risks, collaboration, and what comes next.', source: 'The Close-Up', time: '1h ago', colors: ['#4C355E', '#B878B7'], trending: false },
  { id: 'studio-return', category: 'Celebrity', headline: 'A beloved screen duo is heading back to the studio', summary: 'The pair confirmed their next project after weeks of speculation.', source: 'Scene & Heard', time: '2h ago', colors: ['#684233', '#D88A62'], trending: false },
  { id: 'festival-moment', category: 'Celebrity', headline: 'The candid festival moment fans cannot stop sharing', summary: 'A quiet exchange away from the cameras became the night’s defining image.', source: 'Spotlight', time: '3h ago', colors: ['#394C67', '#7EA0CB'], trending: false },
  { id: 'indie-games', category: 'Gaming', headline: 'Five inventive indie games worth adding to your list', summary: 'Small studios are building some of the year’s most ambitious worlds.', source: 'Next Level', time: '2h ago', colors: ['#244C3B', '#71B263'], trending: true },
  { id: 'box-office', category: 'Movies', headline: 'The weekend box office delivered a genuine surprise', summary: 'An unexpected breakout reshuffled forecasts across the industry.', source: 'Reel Report', time: '3h ago', colors: ['#6B482B', '#D3A24D'], trending: true },
  { id: 'finale', category: 'TV', headline: 'Why that season finale has viewers comparing theories', summary: 'The closing moments left just enough clues for a dozen interpretations.', source: 'Episode Guide', time: '4h ago', colors: ['#2F386A', '#737AD0'], trending: true },
  { id: 'tour', category: 'Music News', headline: 'The year’s biggest arena tour adds ten new dates', summary: 'Demand continues to grow after a record-setting opening run.', source: 'Soundcheck', time: '5h ago', colors: ['#5F275B', '#B955A4'], trending: true },
];

export const MOCK_ENTERTAINMENT_MEDIA: EntertainmentMediaTitle[] = [
  { id: 'north-star', category: 'Movies', title: 'North Star', year: '2026', genre: 'Adventure', rating: '8.7', colors: ['#173E62', '#E0A74A'], trending: true },
  { id: 'after-hours', category: 'TV', title: 'After Hours', year: '2026', genre: 'Drama', rating: '9.1', colors: ['#542D5D', '#D26078'], trending: true },
  { id: 'wild-coast', category: 'Movies', title: 'The Wild Coast', year: '2025', genre: 'Thriller', rating: '8.4', colors: ['#174E4C', '#67B899'], trending: false },
  { id: 'signal', category: 'TV', title: 'Signal Lost', year: '2026', genre: 'Sci-Fi', rating: '8.9', colors: ['#303D75', '#7793DB'], trending: true },
  { id: 'sunday-table', category: 'Movies', title: 'Sunday Table', year: '2025', genre: 'Comedy', rating: '8.2', colors: ['#74402D', '#D89355'], trending: false },
  { id: 'undertow', category: 'TV', title: 'Undertow', year: '2026', genre: 'Mystery', rating: '8.6', colors: ['#1C3C56', '#4C8CA1'], trending: false },
];

export const MOCK_ENTERTAINMENT_UPCOMING: EntertainmentUpcoming[] = [
  { id: 'atlas', category: 'Movies', title: 'Atlas Rising', date: 'August 21', genre: 'Sci-Fi', description: 'A new science-fiction epic arrives in theaters.', colors: ['#263B70', '#6D87D4'] },
  { id: 'room-seven', category: 'TV', title: 'Room Seven', date: 'September 4', genre: 'Mystery', description: 'The mystery series returns for season two.', colors: ['#593452', '#BD6A7D'] },
  { id: 'echoes', category: 'Music News', title: 'Echoes / Vol. II', date: 'September 12', genre: 'Alternative', description: 'Ari Bloom’s anticipated new album.', colors: ['#245C47', '#6DB67B'] },
  { id: 'awards', category: 'Celebrity', title: 'The Horizon Awards', date: 'October 2', genre: 'Live Event', description: 'Film, television, and music share one stage.', colors: ['#6C4525', '#D4A34F'] },
  { id: 'realm', category: 'Gaming', title: 'Realm / Reborn', date: 'October 18', genre: 'Adventure', description: 'Explore a rebuilt open world with friends.', colors: ['#49306D', '#9C6AC8'] },
];

export const MOCK_ENTERTAINMENT_CREATORS: EntertainmentCreator[] = [
  { id: 'creator-roam', name: 'Maya Roams', handle: '@mayaroams', platform: 'YouTube', category: 'Travel', description: 'Practical city guides, weekend escapes, and thoughtful travel stories.', colors: ['#174A68', '#50A6A2'] },
  { id: 'creator-thread', name: 'The Daily Thread', handle: '@dailytthread', platform: 'Instagram', category: 'Fashion & Style', description: 'Wearable style ideas, closet edits, and independent designer discoveries.', colors: ['#653348', '#E17682'] },
  { id: 'creator-table', name: 'One More Plate', handle: '@onemoreplate', platform: 'TikTok', category: 'Food', description: 'Neighborhood food finds and approachable recipes for busy weeks.', colors: ['#74402D', '#D89355'] },
  { id: 'creator-byte', name: 'Everyday Byte', handle: '@everydaybyte', platform: 'YouTube', category: 'Tech', description: 'Clear reviews and useful technology explained without the jargon.', colors: ['#303D75', '#7793DB'] },
  { id: 'creator-paws', name: 'City Paws', handle: '@citypaws', platform: 'Instagram', category: 'Pets', description: 'Pet-friendly places, care tips, and uplifting rescue stories.', colors: ['#244C3B', '#71B263'] },
  { id: 'creator-courtside', name: 'Courtside Notes', handle: '@courtsidenotes', platform: 'TikTok', category: 'Sports', description: 'Fast game breakdowns, player stories, and fan culture.', colors: ['#6B482B', '#D3A24D'] },
  { id: 'creator-reset', name: 'The Sunday Reset', handle: '@sundayreset', platform: 'YouTube', category: 'Lifestyle', description: 'Home, routines, wellness, and realistic ways to reset the week.', colors: ['#4C355E', '#B878B7'] },
];

export const MOCK_ENTERTAINMENT_LOCAL_EVENTS: EntertainmentLocalEvent[] = [
  { id: 'event-river-sounds', title: 'Riverfront Summer Sounds', category: 'Concert', date: 'Friday · 7:30 PM', area: 'Downtown', description: 'An outdoor evening of local music and food vendors.', colors: ['#263B70', '#6D87D4'] },
  { id: 'event-night-market', title: 'Neighborhood Night Market', category: 'Market', date: 'Saturday · 5 PM', area: 'Midtown', description: 'Independent makers, street food, and live performances.', colors: ['#245C47', '#6DB67B'] },
  { id: 'event-comedy', title: 'New Voices Comedy Showcase', category: 'Comedy', date: 'Saturday · 8 PM', area: 'Arts District', description: 'A compact showcase featuring emerging local comedians.', colors: ['#593452', '#BD6A7D'] },
  { id: 'event-design', title: 'Design in Motion', category: 'Exhibit', date: 'Sunday · 11 AM', area: 'Museum Row', description: 'An interactive exhibit exploring design, sound, and movement.', colors: ['#49306D', '#9C6AC8'] },
  { id: 'event-family', title: 'Family Discovery Day', category: 'Family', date: 'Sunday · 1 PM', area: 'Central Park', description: 'Hands-on activities, performances, and outdoor games.', colors: ['#174E4C', '#67B899'] },
  { id: 'event-sports', title: 'City Summer Classic', category: 'Sports', date: 'Sunday · 4 PM', area: 'Community Arena', description: 'A local summer tournament with community activities.', colors: ['#6C4525', '#D4A34F'] },
  { id: 'event-popup', title: 'Independent Style Pop-up', category: 'Pop-up', date: 'Next Thursday · 6 PM', area: 'Warehouse District', description: 'Local labels and vintage sellers in one evening market.', colors: ['#673437', '#E09A4C'] },
  { id: 'event-festival', title: 'City Lights Festival', category: 'Festival', date: 'Next Weekend', area: 'Waterfront', description: 'Art installations, music, food, and family programming.', colors: ['#173E62', '#E0A74A'] },
];

export const MOCK_ENTERTAINMENT_STREAMING_PICKS: EntertainmentStreamingPick[] = [
  { platform: 'Netflix', titles: ['After Hours', 'The Wild Coast'], colors: ['#641E2A', '#E50914'] },
  { platform: 'Disney+', titles: ['North Star', 'Beyond the Blue'], colors: ['#172B67', '#4A79DE'] },
  { platform: 'Max', titles: ['Signal Lost', 'City of Glass'], colors: ['#3C246B', '#7356D9'] },
  { platform: 'Hulu', titles: ['Undertow', 'Sunday Table'], colors: ['#164B3A', '#3ED29A'] },
  { platform: 'Apple TV+', titles: ['Still Light', 'The Long Way'], colors: ['#33363B', '#8D98A5'] },
];

export const MOCK_ENTERTAINMENT_SNAPSHOT: EntertainmentSnapshot = {
  categories: MOCK_ENTERTAINMENT_CATEGORIES,
  creators: MOCK_ENTERTAINMENT_CREATORS,
  aroundYou: MOCK_ENTERTAINMENT_LOCAL_EVENTS,
  stories: MOCK_ENTERTAINMENT_STORIES,
  media: MOCK_ENTERTAINMENT_MEDIA,
  upcoming: MOCK_ENTERTAINMENT_UPCOMING,
  streamingPicks: MOCK_ENTERTAINMENT_STREAMING_PICKS,
  updatedAt: new Date(0).toISOString(),
  dataProvider: 'LookUP local entertainment fixtures',
};

export const mockEntertainmentProvider: EntertainmentDataProvider = {
  provenance: 'mock',
  async getEntertainment() {
    return { ...MOCK_ENTERTAINMENT_SNAPSHOT, updatedAt: new Date().toISOString() };
  },
};

export async function getEntertainment(provider: EntertainmentDataProvider = mockEntertainmentProvider): Promise<EntertainmentDataResult> {
  try {
    return { data: await provider.getEntertainment(), error: null, provenance: provider.provenance };
  } catch {
    return { data: null, error: 'Entertainment information is currently unavailable.', provenance: 'unavailable' };
  }
}

export function getEntertainmentSummary(
  result: EntertainmentDataResult,
  options: { allowMock?: boolean } = {},
): EntertainmentIntelligenceSummary | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;
  const story = result.data.stories.find((item) => item.trending) ?? result.data.stories[0];
  return story ? { headline: story.headline, category: story.category, source: story.source } : undefined;
}

export function searchEntertainment(snapshot: EntertainmentSnapshot, query: string) {
  const normalized = query.trim().toLowerCase();
  return {
    stories: snapshot.stories.filter((story) => `${story.headline} ${story.source} ${story.category}`.toLowerCase().includes(normalized)),
    media: snapshot.media.filter((item) => `${item.title} ${item.category} ${item.genre}`.toLowerCase().includes(normalized)),
    upcoming: snapshot.upcoming.filter((item) => `${item.title} ${item.category} ${item.genre} ${item.description}`.toLowerCase().includes(normalized)),
  };
}
