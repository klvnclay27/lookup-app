import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEVELOPMENT_STARTER_WARDROBE, type ClosetCategory, type ClothingItem } from '@/constants/starter-wardrobe';

export type LockerDataProvenance = 'live' | 'local' | 'mock' | 'unavailable';
export type LockerUserId = string;
export type ClosetId = string;
export type WardrobeItemId = string;
export type WishlistItemId = string;
export type OutfitId = string;
export type ItemCategory = ClosetCategory;
export type ItemColor = string;
export type ItemBrand = string;
export type OutfitSlotKey = 'top' | 'jacket' | 'bottom' | 'shoes' | 'accessory';

export type ItemImage = {
  uri: string;
  kind: 'local' | 'remote' | 'asset';
  alt?: string;
};

export type StylePreference = {
  id: string;
  userId: LockerUserId;
  name: string;
  value: string;
};

export type LockerProfile = {
  id: string;
  userId: LockerUserId;
  displayName: string;
  defaultClosetId: ClosetId;
  stylePreferences: StylePreference[];
};

export type Closet = {
  id: ClosetId;
  userId: LockerUserId;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type WardrobeItem = ClothingItem & {
  userId: LockerUserId;
  closetId: ClosetId;
  image?: ItemImage;
};

export type WishlistItem = {
  id: WishlistItemId;
  userId: LockerUserId;
  closetId: ClosetId;
  name: string;
  brand: ItemBrand;
  color?: ItemColor;
  category?: ItemCategory;
  image?: ItemImage;
  createdAt: string;
};

export type OutfitSelection = Record<OutfitSlotKey, WardrobeItem | null>;

export type Outfit = {
  id: OutfitId;
  userId: LockerUserId;
  closetId: ClosetId;
  name: string;
  items: OutfitSelection;
  mannequinType?: 'male' | 'female';
  createdAt: string;
  updatedAt: string;
};

export type LockerScope = { userId: LockerUserId };
export type LockerResult<T> =
  | { data: T; error: null; provenance: 'live' | 'local' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export interface LockerDataProvider {
  readonly name: string;
  readonly provenance: 'live' | 'local' | 'mock';
  getLockerProfile(scope: LockerScope): Promise<LockerProfile>;
  getClosets(scope: LockerScope): Promise<Closet[]>;
  getWardrobeItems(scope: LockerScope, closetId?: ClosetId): Promise<WardrobeItem[]>;
  addWardrobeItem(scope: LockerScope, item: WardrobeItem): Promise<WardrobeItem[]>;
  updateWardrobeItem(scope: LockerScope, item: WardrobeItem): Promise<WardrobeItem[]>;
  removeWardrobeItem(scope: LockerScope, itemId: WardrobeItemId): Promise<WardrobeItem[]>;
  getWishlist(scope: LockerScope): Promise<WishlistItem[]>;
  addWishlistItem(scope: LockerScope, item: WishlistItem): Promise<WishlistItem[]>;
  removeWishlistItem(scope: LockerScope, itemId: WishlistItemId): Promise<WishlistItem[]>;
  getOutfits(scope: LockerScope): Promise<Outfit[]>;
  saveOutfit(scope: LockerScope, outfit: Outfit): Promise<Outfit[]>;
  removeOutfit(scope: LockerScope, outfitId: OutfitId): Promise<Outfit[]>;
  updateClosetName(scope: LockerScope, closetId: ClosetId, name: string): Promise<Closet>;
}

export const LOCAL_DEMO_USER_ID = 'local-demo-user';
export const DEFAULT_LOCKER_SCOPE: LockerScope = { userId: LOCAL_DEMO_USER_ID };
export const DEFAULT_CLOSET_ID = 'default-closet';

const LEGACY_NAME_KEY = 'lookup.myLocker.name';
const LEGACY_WARDROBE_KEY = 'lookup.myLocker.wardrobe.v1';
const LEGACY_OUTFITS_KEY = 'lookup.myLocker.savedOutfits';
const keyFor = (scope: LockerScope, resource: string) => `lookup.myLocker.${scope.userId}.${resource}.v1`;

const emptySelection = (): OutfitSelection => ({ top: null, jacket: null, bottom: null, shoes: null, accessory: null });
const parseArray = <T>(value: string | null): T[] => {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed as T[] : [];
};
const scopeItem = (item: ClothingItem, scope: LockerScope, closetId = DEFAULT_CLOSET_ID): WardrobeItem => ({ ...item, userId: scope.userId, closetId });
export const LOCAL_STARTER_WARDROBE: WardrobeItem[] = DEVELOPMENT_STARTER_WARDROBE.map((item) => scopeItem(item, DEFAULT_LOCKER_SCOPE));
const normalizeSelection = (items: Partial<Record<OutfitSlotKey, ClothingItem | null>> | undefined, scope: LockerScope, closetId: ClosetId): OutfitSelection => {
  const selection = emptySelection();
  (Object.keys(selection) as OutfitSlotKey[]).forEach((slot) => {
    const item = items?.[slot];
    selection[slot] = item ? scopeItem(item, scope, closetId) : null;
  });
  return selection;
};

async function readWithLegacyMigration(scope: LockerScope, resource: string, legacyKey: string) {
  const scopedKey = keyFor(scope, resource);
  const current = await AsyncStorage.getItem(scopedKey);
  if (current !== null) return current;
  const legacy = scope.userId === LOCAL_DEMO_USER_ID ? await AsyncStorage.getItem(legacyKey) : null;
  if (legacy !== null) await AsyncStorage.setItem(scopedKey, legacy);
  return legacy;
}

export const localLockerProvider: LockerDataProvider = {
  name: 'LookUP device storage',
  provenance: 'local',
  async getLockerProfile(scope) {
    const closets = await this.getClosets(scope);
    return { id: `profile-${scope.userId}`, userId: scope.userId, displayName: closets[0]?.name ?? 'My Locker', defaultClosetId: closets[0]?.id ?? DEFAULT_CLOSET_ID, stylePreferences: [] };
  },
  async getClosets(scope) {
    const storedName = await readWithLegacyMigration(scope, 'closet-name', LEGACY_NAME_KEY);
    const now = new Date().toISOString();
    return [{ id: DEFAULT_CLOSET_ID, userId: scope.userId, name: storedName?.trim() || 'My Locker', createdAt: now, updatedAt: now }];
  },
  async getWardrobeItems(scope, closetId = DEFAULT_CLOSET_ID) {
    const stored = await readWithLegacyMigration(scope, 'wardrobe', LEGACY_WARDROBE_KEY);
    if (stored === null) {
      const starter = scope.userId === LOCAL_DEMO_USER_ID && closetId === DEFAULT_CLOSET_ID
        ? LOCAL_STARTER_WARDROBE
        : DEVELOPMENT_STARTER_WARDROBE.map((item) => scopeItem(item, scope, closetId));
      await AsyncStorage.setItem(keyFor(scope, 'wardrobe'), JSON.stringify(starter));
      return starter;
    }
    return parseArray<ClothingItem>(stored).map((item) => scopeItem(item, scope, closetId));
  },
  async addWardrobeItem(scope, item) {
    const items = await this.getWardrobeItems(scope, item.closetId);
    const next = [...items.filter((current) => current.id !== item.id), { ...item, userId: scope.userId }];
    await AsyncStorage.setItem(keyFor(scope, 'wardrobe'), JSON.stringify(next));
    return next;
  },
  async updateWardrobeItem(scope, item) {
    const items = await this.getWardrobeItems(scope, item.closetId);
    const next = items.map((current) => current.id === item.id ? { ...item, userId: scope.userId } : current);
    await AsyncStorage.setItem(keyFor(scope, 'wardrobe'), JSON.stringify(next));
    return next;
  },
  async removeWardrobeItem(scope, itemId) {
    const items = await this.getWardrobeItems(scope);
    const next = items.filter((item) => item.id !== itemId);
    await AsyncStorage.setItem(keyFor(scope, 'wardrobe'), JSON.stringify(next));
    return next;
  },
  async getWishlist(scope) {
    return parseArray<WishlistItem>(await AsyncStorage.getItem(keyFor(scope, 'wishlist'))).filter((item) => item.userId === scope.userId);
  },
  async addWishlistItem(scope, item) {
    const items = await this.getWishlist(scope);
    const next = [...items.filter((current) => current.id !== item.id), { ...item, userId: scope.userId }];
    await AsyncStorage.setItem(keyFor(scope, 'wishlist'), JSON.stringify(next));
    return next;
  },
  async removeWishlistItem(scope, itemId) {
    const next = (await this.getWishlist(scope)).filter((item) => item.id !== itemId);
    await AsyncStorage.setItem(keyFor(scope, 'wishlist'), JSON.stringify(next));
    return next;
  },
  async getOutfits(scope) {
    const stored = await readWithLegacyMigration(scope, 'outfits', LEGACY_OUTFITS_KEY);
    return parseArray<Partial<Outfit>>(stored).map((outfit) => {
      const createdAt = outfit.createdAt ?? new Date().toISOString();
      const closetId = outfit.closetId ?? DEFAULT_CLOSET_ID;
      return { id: outfit.id ?? `outfit-${createdAt}`, userId: scope.userId, closetId, name: outfit.name ?? 'Untitled Outfit', items: normalizeSelection(outfit.items, scope, closetId), mannequinType: outfit.mannequinType, createdAt, updatedAt: outfit.updatedAt ?? createdAt };
    });
  },
  async saveOutfit(scope, outfit) {
    const outfits = await this.getOutfits(scope);
    const scopedOutfit = { ...outfit, userId: scope.userId };
    const next = [scopedOutfit, ...outfits.filter((current) => current.id !== outfit.id)];
    await AsyncStorage.setItem(keyFor(scope, 'outfits'), JSON.stringify(next));
    return next;
  },
  async removeOutfit(scope, outfitId) {
    const next = (await this.getOutfits(scope)).filter((outfit) => outfit.id !== outfitId);
    await AsyncStorage.setItem(keyFor(scope, 'outfits'), JSON.stringify(next));
    return next;
  },
  async updateClosetName(scope, closetId, name) {
    const closet = { id: closetId, userId: scope.userId, name: name.trim() || 'My Locker', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(keyFor(scope, 'closet-name'), closet.name);
    return closet;
  },
};

async function run<T>(operation: (provider: LockerDataProvider, scope: LockerScope) => Promise<T>, scope = DEFAULT_LOCKER_SCOPE, provider: LockerDataProvider = localLockerProvider): Promise<LockerResult<T>> {
  try {
    return { data: await operation(provider, scope), error: null, provenance: provider.provenance };
  } catch {
    return { data: null, error: 'My Locker data is currently unavailable.', provenance: 'unavailable' };
  }
}

export const getLockerProfile = (scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.getLockerProfile(user), scope, provider);
export const getClosets = (scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.getClosets(user), scope, provider);
export const getWardrobeItems = (scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.getWardrobeItems(user), scope, provider);
export const addWardrobeItem = (item: WardrobeItem, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.addWardrobeItem(user, item), scope, provider);
export const updateWardrobeItem = (item: WardrobeItem, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.updateWardrobeItem(user, item), scope, provider);
export const removeWardrobeItem = (itemId: WardrobeItemId, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.removeWardrobeItem(user, itemId), scope, provider);
export const getWishlist = (scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.getWishlist(user), scope, provider);
export const addWishlistItem = (item: WishlistItem, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.addWishlistItem(user, item), scope, provider);
export const removeWishlistItem = (itemId: WishlistItemId, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.removeWishlistItem(user, itemId), scope, provider);
export const getOutfits = (scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.getOutfits(user), scope, provider);
export const saveOutfit = (outfit: Outfit, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.saveOutfit(user, outfit), scope, provider);
export const removeOutfit = (outfitId: OutfitId, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.removeOutfit(user, outfitId), scope, provider);
export const updateClosetName = (closetId: ClosetId, name: string, scope = DEFAULT_LOCKER_SCOPE, provider?: LockerDataProvider) => run((source, user) => source.updateClosetName(user, closetId, name), scope, provider);
