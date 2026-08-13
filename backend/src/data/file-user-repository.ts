import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  NewUserProfile,
  UserId,
  UserPreferences,
  UserPreferencesChanges,
  UserProfile,
  UserProfileChanges,
} from '../models/user.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import { DEMO_USER_PROFILE } from './in-memory-user-repository.ts';

type UserStoreDocument = {
  profiles: Record<UserId, UserProfile>;
  version: 1;
};

const DEFAULT_STORE_PATH = fileURLToPath(new URL('../../data/users.json', import.meta.url));

function copyProfile(profile: UserProfile): UserProfile {
  return { ...profile };
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isUserProfile(value: unknown, expectedUserId: string): value is UserProfile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const profile = value as Partial<UserProfile>;
  return profile.userId === expectedUserId
    && typeof profile.displayName === 'string'
    && profile.displayName.trim().length > 0
    && typeof profile.smartModeEnabled === 'boolean'
    && isIsoDate(profile.createdAt)
    && isIsoDate(profile.updatedAt);
}

function parseStore(contents: string): UserStoreDocument {
  let value: unknown;
  try {
    value = JSON.parse(contents) as unknown;
  } catch {
    throw new Error('The local user store contains invalid JSON.');
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('The local user store has an invalid structure.');
  }

  const document = value as Partial<UserStoreDocument>;
  if (document.version !== 1 || typeof document.profiles !== 'object' || document.profiles === null || Array.isArray(document.profiles)) {
    throw new Error('The local user store has an unsupported structure or version.');
  }

  for (const [userId, profile] of Object.entries(document.profiles)) {
    if (!isUserProfile(profile, userId)) throw new Error(`The local user store contains an invalid profile for "${userId}".`);
  }

  return {
    version: 1,
    profiles: Object.fromEntries(
      Object.entries(document.profiles).map(([userId, profile]) => [userId, copyProfile(profile)]),
    ),
  };
}

function createSeedStore(): UserStoreDocument {
  return {
    version: 1,
    profiles: { [DEMO_USER_PROFILE.userId]: copyProfile(DEMO_USER_PROFILE) },
  };
}

export class FileUserRepository implements UserRepository {
  private readonly filePath: string;
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(filePath = DEFAULT_STORE_PATH) {
    this.filePath = filePath;
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async writeStore(document: UserStoreDocument): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;

    try {
      await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await rename(temporaryPath, this.filePath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }

  private async readStore(): Promise<UserStoreDocument> {
    try {
      return parseStore(await readFile(this.filePath, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const seed = createSeedStore();
      await this.writeStore(seed);
      return seed;
    }
  }

  createUserProfile(profile: NewUserProfile): Promise<UserProfile> {
    return this.runExclusive(async () => {
      const store = await this.readStore();
      const existing = store.profiles[profile.userId];
      if (existing) return copyProfile(existing);

      const now = new Date().toISOString();
      const created: UserProfile = { ...profile, createdAt: now, updatedAt: now };
      store.profiles[created.userId] = created;
      await this.writeStore(store);
      return copyProfile(created);
    });
  }

  getUserProfile(userId: UserId): Promise<UserProfile | null> {
    return this.runExclusive(async () => {
      const profile = (await this.readStore()).profiles[userId];
      return profile ? copyProfile(profile) : null;
    });
  }

  updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null> {
    return this.runExclusive(async () => {
      const store = await this.readStore();
      const current = store.profiles[userId];
      if (!current) return null;

      const updated: UserProfile = {
        ...current,
        ...changes,
        userId: current.userId,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      store.profiles[userId] = updated;
      await this.writeStore(store);
      return copyProfile(updated);
    });
  }

  getUserPreferences(userId: UserId): Promise<UserPreferences | null> {
    return this.runExclusive(async () => {
      const profile = (await this.readStore()).profiles[userId];
      return profile ? { smartModeEnabled: profile.smartModeEnabled } : null;
    });
  }

  updateUserPreferences(userId: UserId, changes: UserPreferencesChanges): Promise<UserPreferences | null> {
    return this.runExclusive(async () => {
      const store = await this.readStore();
      const current = store.profiles[userId];
      if (!current) return null;

      const updated: UserProfile = {
        ...current,
        ...changes,
        userId: current.userId,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      store.profiles[userId] = updated;
      await this.writeStore(store);
      return { smartModeEnabled: updated.smartModeEnabled };
    });
  }
}

export const fileUserRepository = new FileUserRepository();
