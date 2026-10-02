import { useCallback, useEffect, useState } from "react";

import { apiRequest, getImageUrl } from "../api";
import { SocialContext } from "./socialContextValue";

const EMPTY_PROFILE = {
    _id: "",
    username: "",
    name: "",
    profilePicture: "",
    bio: "",
    following: [],
    followers: [],
    likes: 0,
};

function loadCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("astrea-user")) || EMPTY_PROFILE;
    } catch {
        localStorage.removeItem("astrea-user");
        return EMPTY_PROFILE;
    }
}

export function SocialProvider({ children }) {
    const [profile, setProfile] = useState(loadCurrentUser);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [likedPostIds, setLikedPostIds] = useState([]);
    const [bookmarkedPostIds, setBookmarkedPostIds] = useState([]);
    const [resharedPostIds, setResharedPostIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const normalizePost = useCallback((post) => {
        const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
        return {
            ...post,
            id: post.id || post._id,
            image: getImageUrl(post.image),
            comments: (post.comments || []).map((comment) => ({
                ...comment,
                id: comment.id || comment._id,
                postId: post.id || post._id,
            })),
            time: createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: createdAt.toLocaleDateString(),
        };
    }, []);

    const normalizeUser = useCallback((user) => ({
        ...user,
        profilePicture: getImageUrl(user.profilePicture),
    }), []);

    const refreshData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [fetchedPosts, fetchedUsers] = await Promise.all([
                apiRequest("/api/posts"),
                apiRequest("/api/users"),
            ]);
            const normalizedPosts = fetchedPosts.map(normalizePost);
            setPosts(normalizedPosts);
            const normalizedUsers = fetchedUsers.map(normalizeUser);
            setUsers(normalizedUsers);

            setProfile((current) => {
                if (!current?._id) return current;
                const freshProfile = normalizedUsers.find((user) => user._id === current._id);
                if (!freshProfile) return current;
                const updatedProfile = { ...freshProfile, email: current.email };
                localStorage.setItem("astrea-user", JSON.stringify(updatedProfile));
                return updatedProfile;
            });
            const currentUser = loadCurrentUser();
            if (currentUser?._id) {
                setLikedPostIds(normalizedPosts
                    .filter((post) => post.likes.includes(currentUser._id))
                    .map((post) => post.id));
            }
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [normalizePost, normalizeUser]);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            apiRequest("/api/posts"),
            apiRequest("/api/users"),
        ]).then(([fetchedPosts, fetchedUsers]) => {
            if (cancelled) return;
            const normalizedPosts = fetchedPosts.map(normalizePost);
            setPosts(normalizedPosts);
            const normalizedUsers = fetchedUsers.map(normalizeUser);
            setUsers(normalizedUsers);
            setProfile((current) => {
                if (!current?._id) return current;
                const freshProfile = normalizedUsers.find((user) => user._id === current._id);
                if (!freshProfile) return current;
                const updatedProfile = { ...freshProfile, email: current.email };
                localStorage.setItem("astrea-user", JSON.stringify(updatedProfile));
                return updatedProfile;
            });
            const currentUser = loadCurrentUser();
            if (currentUser?._id) {
                setLikedPostIds(normalizedPosts
                    .filter((post) => post.likes.includes(currentUser._id))
                    .map((post) => post.id));
            }
        }).catch((requestError) => {
            if (!cancelled) setError(requestError.message);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [normalizePost, normalizeUser]);

    function setCurrentUser(user) {
        const currentUser = user || EMPTY_PROFILE;
        localStorage.setItem("astrea-user", JSON.stringify(currentUser));
        setProfile(currentUser);
        setLikedPostIds(posts
            .filter((post) => post.likes.includes(currentUser._id))
            .map((post) => post.id));
    }

    async function createPost({ imageFile, caption }) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("userId", profile._id);
        formData.append("caption", caption);
        const post = await apiRequest("/api/upload", {
            method: "POST",
            body: formData,
        });
        const normalizedPost = normalizePost(post);
        setPosts((current) => [normalizedPost, ...current]);
        return normalizedPost;
    }

    async function updateProfile(updatedProfile) {
        const savedProfile = await apiRequest(`/api/users/${profile._id}`, {
            method: "PATCH",
            body: JSON.stringify(updatedProfile),
        });
        const nextProfile = {
            ...normalizeUser(savedProfile),
            email: profile.email,
            likes: profile.likes || 0,
        };
        setCurrentUser(nextProfile);
        setUsers((current) => current.map((user) =>
            user._id === nextProfile._id ? nextProfile : user
        ));
        setPosts((current) => current.map((post) =>
            post.authorId === nextProfile._id
                ? { ...post, username: nextProfile.username }
                : post
        ));
        return nextProfile;
    }

    async function uploadProfilePicture(imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const savedProfile = await apiRequest(`/api/users/${profile._id}/profile-picture`, {
            method: "POST",
            body: formData,
        });
        const nextProfile = {
            ...normalizeUser(savedProfile),
            email: profile.email,
        };
        setCurrentUser(nextProfile);
        setUsers((current) => current.map((user) =>
            user._id === nextProfile._id ? nextProfile : user
        ));
        return nextProfile;
    }

    async function deletePost(postId) {
        await apiRequest(`/api/posts/${postId}`, {
            method: "DELETE",
            body: JSON.stringify({ userId: profile._id }),
        });
        setPosts((current) => current.filter((post) => post.id !== postId));
        setLikedPostIds((current) => current.filter((id) => id !== postId));
        setBookmarkedPostIds((current) => current.filter((id) => id !== postId));
        setResharedPostIds((current) => current.filter((id) => id !== postId));
    }

    function togglePostState(key, postId) {
        const setter = key === "bookmarkedPostIds" ? setBookmarkedPostIds : setResharedPostIds;
        setter((current) => current.includes(postId)
            ? current.filter((id) => id !== postId)
            : [...current, postId]
        );
    }

    async function toggleLike(postId) {
        if (!profile._id) return;
        const updatedPost = await apiRequest(`/api/posts/${postId}/like`, {
            method: "PATCH",
            body: JSON.stringify({ userId: profile._id }),
        });
        const normalizedPost = normalizePost(updatedPost);
        setPosts((current) => current.map((post) =>
            post.id === postId ? normalizedPost : post
        ));
        setLikedPostIds((current) => normalizedPost.likes.includes(profile._id)
            ? [...new Set([...current, postId])]
            : current.filter((id) => id !== postId)
        );
    }

    async function addComment(postId, { text, replyTo }) {
        const updatedPost = await apiRequest(`/api/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ userId: profile._id, text, replyTo }),
        });
        const normalizedPost = normalizePost(updatedPost);
        setPosts((current) => current.map((post) =>
            post.id === postId ? normalizedPost : post
        ));
        return normalizedPost.comments;
    }

    async function togglePostVisibility(postId, property) {
        const post = posts.find((item) => item.id === postId);
        if (!post) return;
        const updatedPost = await apiRequest(`/api/posts/${postId}/visibility`, {
            method: "PATCH",
            body: JSON.stringify({
                userId: profile._id,
                property,
                value: !post[property],
            }),
        });
        const normalizedPost = normalizePost(updatedPost);
        setPosts((current) => current.map((item) =>
            item.id === postId ? normalizedPost : item
        ));
    }

    async function deleteAccount() {
        await apiRequest(`/api/users/${profile._id}`, { method: "DELETE" });
        localStorage.removeItem("astrea-user");
        setProfile(EMPTY_PROFILE);
        setUsers((current) => current.filter((user) => user._id !== profile._id));
        setPosts((current) => current.filter((post) => post.authorId !== profile._id));
        setLikedPostIds([]);
        setBookmarkedPostIds([]);
        setResharedPostIds([]);
    }

    const value = {
        profile,
        users,
        posts,
        likedPostIds,
        bookmarkedPostIds,
        resharedPostIds,
        loading,
        error,
        refreshData,
        setCurrentUser,
        isLiked: (postId) => likedPostIds.includes(postId),
        isBookmarked: (postId) => bookmarkedPostIds.includes(postId),
        isReshared: (postId) => resharedPostIds.includes(postId),
        toggleLike,
        toggleBookmark: (postId) => togglePostState("bookmarkedPostIds", postId),
        toggleReshare: (postId) => togglePostState("resharedPostIds", postId),
        addComment,
        createPost,
        updateProfile,
        uploadProfilePicture,
        deletePost,
        togglePostVisibility,
        deleteAccount,
    };

    return (
        <SocialContext.Provider value={value}>
            {children}
        </SocialContext.Provider>
    );
}

