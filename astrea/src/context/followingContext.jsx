import {
    createContext,
    useContext,
    useState,
} from "react";

const FollowingContext = createContext(null);

export function FollowingProvider({ children }) {

    const [following, setFollowing] = useState([
        "alex",
        "sarah",
        "jordan",
    ]);

    function isFollowing(username) {
        return following.includes(username);
    }

    function toggleFollow(username) {
        setFollowing((currentFollowing) => {

            if (currentFollowing.includes(username)) {
                return currentFollowing.filter(
                    (user) => user !== username
                );
            }

            return [
                ...currentFollowing,
                username,
            ];
        });
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

export function useFollowing() {
    return useContext(FollowingContext);
}