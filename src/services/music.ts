export type MusicDataProvenance = 'live' | 'mock' | 'unavailable';
export type MusicSongId = string;
export type MusicArtistId = string;
export type MusicPlaylistId = string;

export type MusicArtist = {
  id: MusicArtistId;
  name: string;
};

export type MusicSong = {
  id: MusicSongId;
  title: string;
  artist: string;
  artistIds: MusicArtistId[];
  duration: string;
  explicit?: boolean;
  colors: [string, string];
};

export type MusicPlaylist = {
  id: MusicPlaylistId;
  title: string;
  description: string;
  trackIds: MusicSongId[];
  featuredSongId: MusicSongId;
  colors: [string, string];
};

export type MusicSearchResults = {
  artists: MusicArtist[];
  playlists: MusicPlaylist[];
  songs: MusicSong[];
};

export type MusicCatalog = {
  artists: MusicArtist[];
  songs: MusicSong[];
  playlists: MusicPlaylist[];
  recentlyPlayedIds: MusicSongId[];
  trendingIds: MusicSongId[];
  initialSongId: MusicSongId;
  updatedAt: string;
};

export type MusicIntelligenceSummary = {
  playlist?: string;
  tracks?: string[];
};

export type MusicDataResult =
  | { data: MusicCatalog; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export interface MusicDataProvider {
  readonly name: string;
  readonly provenance: 'live' | 'mock';
  getCatalog(): Promise<MusicCatalog>;
}

export const MOCK_MUSIC_ARTISTS: MusicArtist[] = [
  { id: 'artist-nova-lane', name: 'Nova Lane' },
  { id: 'artist-maya-rivers', name: 'Maya Rivers' },
  { id: 'artist-wild-north', name: 'The Wild North' },
  { id: 'artist-soren-blue', name: 'Soren Blue' },
  { id: 'artist-kendrick-lamar', name: 'Kendrick Lamar' },
  { id: 'artist-future', name: 'Future' },
  { id: 'artist-metro-boomin', name: 'Metro Boomin' },
  { id: 'artist-chappell-roan', name: 'Chappell Roan' },
  { id: 'artist-travis-scott', name: 'Travis Scott' },
];

export const MOCK_MUSIC_SONGS: MusicSong[] = [
  { id: 'midnight', title: 'Midnight Drive', artist: 'Nova Lane', artistIds: ['artist-nova-lane'], duration: '3:42', colors: ['#5836A5', '#D85B9B'] },
  { id: 'golden', title: 'Golden Hour', artist: 'Maya Rivers', artistIds: ['artist-maya-rivers'], duration: '3:18', colors: ['#B75B24', '#F1B84B'] },
  { id: 'satellite', title: 'Satellite Hearts', artist: 'The Wild North', artistIds: ['artist-wild-north'], duration: '4:05', colors: ['#176487', '#3BB5A5'] },
  { id: 'afterglow', title: 'Afterglow', artist: 'Soren Blue', artistIds: ['artist-soren-blue'], duration: '2:58', colors: ['#773755', '#E2695D'] },
  { id: 'not-like-us', title: 'Not Like Us', artist: 'Kendrick Lamar', artistIds: ['artist-kendrick-lamar'], duration: '4:34', explicit: true, colors: ['#685A4A', '#C3A77E'] },
  { id: 'like-that', title: 'Like That', artist: 'Future, Metro Boomin, Kendrick Lamar', artistIds: ['artist-future', 'artist-metro-boomin', 'artist-kendrick-lamar'], duration: '4:27', explicit: true, colors: ['#3E4559', '#8391AF'] },
  { id: 'good-luck', title: 'Good Luck, Babe!', artist: 'Chappell Roan', artistIds: ['artist-chappell-roan'], duration: '3:38', colors: ['#A93461', '#F0859D'] },
  { id: 'type-shit', title: 'Type Shit', artist: 'Future, Metro Boomin, Travis Scott', artistIds: ['artist-future', 'artist-metro-boomin', 'artist-travis-scott'], duration: '3:48', explicit: true, colors: ['#49302B', '#B65A3D'] },
];

export const MOCK_MUSIC_PLAYLISTS: MusicPlaylist[] = [
  { id: 'mix-1', title: 'Daily Mix 1', description: 'Nova Lane, Ari Bloom and more', trackIds: ['midnight', 'satellite'], featuredSongId: 'midnight', colors: ['#5B36A5', '#B468DE'] },
  { id: 'mix-2', title: 'Daily Mix 2', description: 'Maya Rivers, June Arcade and more', trackIds: ['golden', 'afterglow'], featuredSongId: 'golden', colors: ['#176846', '#64B86B'] },
  { id: 'chill', title: 'Chill Vibes', description: 'Soft sounds for slower moments', trackIds: ['satellite', 'afterglow'], featuredSongId: 'satellite', colors: ['#195C8C', '#55A9D3'] },
  { id: 'energy', title: 'Energy Shift', description: 'Big hooks and brighter beats', trackIds: ['not-like-us', 'like-that'], featuredSongId: 'afterglow', colors: ['#8C302F', '#E06B4F'] },
];

export const MOCK_MUSIC_CATALOG: MusicCatalog = {
  artists: MOCK_MUSIC_ARTISTS,
  songs: MOCK_MUSIC_SONGS,
  playlists: MOCK_MUSIC_PLAYLISTS,
  recentlyPlayedIds: ['midnight', 'golden', 'satellite', 'afterglow'],
  trendingIds: ['not-like-us', 'like-that', 'good-luck', 'type-shit'],
  initialSongId: 'midnight',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const mockMusicProvider: MusicDataProvider = {
  name: 'LookUP local fixtures',
  provenance: 'mock',
  async getCatalog() {
    return MOCK_MUSIC_CATALOG;
  },
};

export async function getMusic(provider: MusicDataProvider = mockMusicProvider): Promise<MusicDataResult> {
  try {
    const data = await provider.getCatalog();
    return { data, error: null, provenance: provider.provenance };
  } catch {
    return { data: null, error: 'Music information is currently unavailable.', provenance: 'unavailable' };
  }
}

export function searchMusicCatalog(catalog: MusicCatalog, query: string): MusicSearchResults {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { artists: [], playlists: [], songs: [] };

  return {
    artists: catalog.artists.filter((artist) => artist.name.toLowerCase().includes(normalized)),
    playlists: catalog.playlists.filter((playlist) => `${playlist.title} ${playlist.description}`.toLowerCase().includes(normalized)),
    songs: catalog.songs.filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(normalized)),
  };
}

export function getMusicSummary(
  result: MusicDataResult,
  options: { allowMock?: boolean } = {},
): MusicIntelligenceSummary | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;

  const playlist = result.data.playlists[0];
  const songsById = new Map(result.data.songs.map((song) => [song.id, song]));
  return {
    playlist: playlist?.title,
    tracks: playlist?.trackIds.map((id) => songsById.get(id)?.title).filter((title): title is string => Boolean(title)),
  };
}
