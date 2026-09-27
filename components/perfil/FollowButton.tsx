"use client";
import { useState } from "react";
import { toggleFollow } from "@/lib/mockFollow";

type FollowButtonProps = {
  /** Email of the currently logged-in user (the one doing the following). */
  viewerEmail: string;
  /** ID of the profile being viewed (the one being followed). */
  targetUserId: string;
  /** Whether the viewer already follows this user, from the initial page load. */
  initialFollowing: boolean;
  /** Called after a successful toggle, so the parent can update counters. */
  onChange?: (following: boolean) => void;
};

export default function FollowButton({
  viewerEmail,
  targetUserId,
  initialFollowing,
  onChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;

    // Optimistic update: flip the UI immediately, before the API responds.
    const optimisticNext = !following;
    setFollowing(optimisticNext);
    setPending(true);

    try {
      const result = await toggleFollow(viewerEmail, targetUserId);
      setFollowing(result.following);
      onChange?.(result.following);
    } catch {
      // Roll back to the previous state if the request fails.
      setFollowing(!optimisticNext);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-pressed={following}
      className="px-5 py-2 rounded-full text-xs font-medium transition-colors disabled:opacity-60"
      style={
        following
          ? {
              backgroundColor: "white",
              color: "#8D6E63",
              border: "1px solid #D7CCC8",
            }
          : {
              backgroundColor: "#8D6E63",
              color: "white",
              border: "1px solid #8D6E63",
            }
      }
    >
      {following ? "Siguiendo" : "Seguir"}
    </button>
  );
}
