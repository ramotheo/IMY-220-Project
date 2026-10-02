import { apiRequest } from "../api";
import { FollowingContext } from "./followingContextValue";
import { useSocial } from "./useSocial";

export function FollowingProvider({ children }) {
    const { profile, users, setCurrentUser } = useSocial();
    const followingIds = profile.following || [];
    const following = users
        .filter((user) => followingIds.includes(user._id))
        .map((user) => user.username);

    function isFollowing(username) {
        const user = users.find((item) => item.username === username);
        return user ? followingIds.includes(user._id) : false;
    }

    async function toggleFollow(username) {
        const targetUser = users.find((user) => user.username === username);
        if (!profile._id || !targetUser) return;

        const updatedProfile = await apiRequest(`/api/users/${profile._id}/follow`, {
            method: "POST",
            body: JSON.stringify({ targetUserId: targetUser._id }),
        });
        setCurrentUser({ ...updatedProfile, email: profile.email });
    }

    return (
        <FollowingContext.Provider
            value={{
                following,
                isFollowing,
                toggleFollow,
            }}
        >
            {children}
        </FollowingContext.Provider>
    );
}