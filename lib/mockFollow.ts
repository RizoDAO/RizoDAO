/**
 * lib/mockFollow.ts
 *
 * TEMPORARY client-side mock for the follow/unfollow feature (#14).
 *
 * Issue #12 (the real follow API + DB model) has not been merged yet, and
 * this issue is explicitly frontend-only ("The API endpoints will be
 * handled in a separate issue (#12)... Requires issue #12 to be merged
 * first, or mock the response locally"). Building a real Follow table /
 * API route here would duplicate #12's work, so this module stores follow
 * relationships in localStorage instead — good enough to exercise every
 * UI state (optimistic toggle, counters, Following tab, empty state)
 * without a backend.
 *
 * Known limitation: localStorage is per-browser, so two accounts tested in
 * two separate browser profiles/incognito windows will NOT see each
 * other's follow state live. That's expected for a local mock; real
 * cross-account persistence arrives with #12.
 *
 * TO REPLACE WITH THE REAL API (once #12 merges):
 *   - toggleFollow()      -> POST /api/follow/:userId (or similar)
 *   - isFollowing()       -> derive from the real API's response
 *   - getFollowingIds()   -> GET /api/follow/following?userId=...
 *   - getFollowerCount()  -> included in the user's profile payload
 *   - getFollowingCount() -> included in the user's profile payload
 * The FollowButton component only calls the functions below, so swapping
 * their internals for real fetch() calls is the only change needed.
 */

const STORAGE_KEY = "rizo_mock_follows_v1";

// Map of "follower's email" -> array of followed user IDs.
type FollowStore = Record<string, string[]>;

function readStore(): FollowStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FollowStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: FollowStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Whether `followerEmail` currently follows `targetUserId`. */
export function isFollowing(followerEmail: string, targetUserId: string): boolean {
  const store = readStore();
  return (store[followerEmail] ?? []).includes(targetUserId);
}

/**
 * Toggles the follow relationship and returns the new state.
 * Simulates a network round-trip so callers can exercise optimistic-update
 * and rollback logic the same way they will against the real API.
 */
export async function toggleFollow(
  followerEmail: string,
  targetUserId: string,
): Promise<{ following: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const store = readStore();
  const current = new Set(store[followerEmail] ?? []);
  const willFollow = !current.has(targetUserId);

  if (willFollow) {
    current.add(targetUserId);
  } else {
    current.delete(targetUserId);
  }

  store[followerEmail] = Array.from(current);
  writeStore(store);

  return { following: willFollow };
}

/** All user IDs that `followerEmail` currently follows. */
export function getFollowingIds(followerEmail: string): string[] {
  const store = readStore();
  return store[followerEmail] ?? [];
}

/** How many users `followerEmail` currently follows. */
export function getFollowingCount(followerEmail: string): number {
  return getFollowingIds(followerEmail).length;
}

/**
 * How many (mocked) followers `targetUserId` has, counted across every
 * follower list in the local store. Only reflects follows made in this
 * browser — a real count will come from #12's API.
 */
export function getFollowerCount(targetUserId: string): number {
  const store = readStore();
  return Object.values(store).filter((followedIds) => followedIds.includes(targetUserId)).length;
}
