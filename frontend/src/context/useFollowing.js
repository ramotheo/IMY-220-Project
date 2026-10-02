import { useContext } from "react";

import { FollowingContext } from "./followingContextValue";

export function useFollowing() {
    return useContext(FollowingContext);
}