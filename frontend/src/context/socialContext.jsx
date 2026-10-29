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
    bookmarkedPostIds: [],
    resharedPostIds: [],
    likes: 0,
};

function loadCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem("astrea-user"));
        return user
            ? { ...user, profilePicture: getImageUrl(user.profilePicture) }
            : EMPTY_PROFILE;
    } catch {
        localStorage.removeItem("astrea-user");
        return EMPTY_PROFILE;
    }
}

export function SocialProvider({ children }) {
    const [profile, setProfile] = useState(loadCurrentUser);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [likedPostIds, setLikedPostIds] = useState([]);
    const [bookmarkedPostIds, setBookmarkedPostIds] = useState(() =>
        loadCurrentUser().bookmarkedPostIds || []
    );
    const [resharedPostIds, setResharedPostIds] = useState(() =>
        loadCurrentUser().resharedPostIds || []
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const normalizePost = useCallback((post) => {
        const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
        return {
            ...post,
            id: post.id || post._id,
            hashtags: post.hashtags || [],
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
            const [fetchedPosts, fetchedUsers, fetchedAlbums] = await Promise.all([
                apiRequest("/api/posts"),
                apiRequest("/api/users"),
                apiRequest("/api/albums"),
            ]);
            const normalizedPosts = fetchedPosts.map(normalizePost);
            setPosts(normalizedPosts);
            setAlbums(fetchedAlbums);
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
            const freshProfile = normalizedUsers.find((user) => user._id === currentUser?._id);
            if (freshProfile) {
                setBookmarkedPostIds(freshProfile.bookmarkedPostIds || []);
                setResharedPostIds(freshProfile.resharedPostIds || []);
            }
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
            apiRequest("/api/albums"),
        ]).then(([fetchedPosts, fetchedUsers, fetchedAlbums]) => {
            if (cancelled) return;
            const normalizedPosts = fetchedPosts.map(normalizePost);
            setPosts(normalizedPosts);
            setAlbums(fetchedAlbums);
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
            const freshProfile = normalizedUsers.find((user) => user._id === currentUser?._id);
            if (freshProfile) {
                setBookmarkedPostIds(freshProfile.bookmarkedPostIds || []);
                setResharedPostIds(freshProfile.resharedPostIds || []);
            }
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
        const currentUser = user
            ? normalizeUser(user)
            : EMPTY_PROFILE;
        localStorage.setItem("astrea-user", JSON.stringify(currentUser));
        setProfile(currentUser);
        setLikedPostIds(posts
            .filter((post) => post.likes.includes(currentUser._id))
            .map((post) => post.id));
        setBookmarkedPostIds(currentUser.bookmarkedPostIds || []);
        setResharedPostIds(currentUser.resharedPostIds || []);
    }

    async function createPost({ imageFile, caption, hashtags = [] }) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("userId", profile._id);
        formData.append("caption", caption);
        formData.append("hashtags", hashtags.join(","));
        const post = await apiRequest("/api/upload", {
            method: "POST",
            body: formData,
        });
        const normalizedPost = normalizePost(post);
        setPosts((current) => [normalizedPost, ...current]);
        return normalizedPost;
    }

    async function createAlbum(albumData) {
        const album = await apiRequest("/api/albums", {
            method: "POST",
            body: JSON.stringify({ ...albumData, userId: profile._id }),
        });
        setAlbums((current) => [album, ...current]);
        return album;
    }

    async function updateAlbum(albumId, albumData) {
        const album = await apiRequest(`/api/albums/${albumId}`, {
            method: "PATCH",
            body: JSON.stringify({ ...albumData, userId: profile._id }),
        });
        setAlbums((current) => current.map((item) => item.id === album.id ? album : item));
        return album;
    }

    async function deleteAlbum(albumId) {
        await apiRequest(`/api/albums/${albumId}`, {
            method: "DELETE",
            body: JSON.stringify({ userId: profile._id }),
        });
        setAlbums((current) => current.filter((album) => album.id !== albumId));
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

    async function addReportReason(reason) {
        const createdReason = await apiRequest("/api/admin/report-reasons", {
            method: "POST",
            body: JSON.stringify({ reason, userId: profile._id }),
        });
        return createdReason;
    }

    async function reportPost(postId, reason) {
        const updatedPost = await apiRequest(`/api/posts/${postId}/report`, {
            method: "POST",
            body: JSON.stringify({ userId: profile._id, reason }),
        });
        const normalizedPost = normalizePost(updatedPost);
        setPosts((current) => current.map((item) =>
            item.id === postId ? normalizedPost : item
        ));
        return normalizedPost;
    }

    async function deleteUserAccountByAdmin(userId) {
        await apiRequest(`/api/users/${userId}`, {
            method: "DELETE",
            body: JSON.stringify({ actingUserId: profile._id }),
        });
        setUsers((current) => current.filter((user) => user._id !== userId));
        setPosts((current) => current.filter((post) => post.authorId !== userId));
        setAlbums((current) => current.filter((album) => album.ownerId !== userId));
    }

    async function toggleUserVerification(userId, verified) {
        const savedUser = await apiRequest(`/api/users/${userId}/verification`, {
            method: "PATCH",
            body: JSON.stringify({ actingUserId: profile._id, verified }),
        });
        const normalizedUser = normalizeUser(savedUser);
        setUsers((current) => current.map((user) =>
            user._id === userId ? normalizedUser : user
        ));
        setProfile((current) => current?._id === userId
            ? { ...current, ...normalizedUser, email: current.email }
            : current);
        return normalizedUser;
    }

    async function deletePost(postId) {
        await apiRequest(`/api/posts/${postId}`, {
            method: "DELETE",
            body: JSON.stringify({ userId: profile._id }),
        });
        setPosts((current) => current.filter((post) => post.id !== postId));
        setAlbums((current) => current.map((album) => ({
            ...album,
            postIds: album.postIds.filter((id) => id !== postId),
        })));
        setLikedPostIds((current) => current.filter((id) => id !== postId));
        setBookmarkedPostIds((current) => current.filter((id) => id !== postId));
        setResharedPostIds((current) => current.filter((id) => id !== postId));
    }

    async function togglePostState(collection, postId) {
        if (!profile._id) return;
        const updatedUser = await apiRequest(`/api/users/${profile._id}/post-state`, {
            method: "PATCH",
            body: JSON.stringify({ postId, collection }),
        });
        const nextProfile = {
            ...normalizeUser(updatedUser),
            email: profile.email,
            likes: profile.likes || 0,
        };
        setCurrentUser(nextProfile);
        setUsers((current) => current.map((user) =>
            user._id === nextProfile._id ? nextProfile : user
        ));
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
        setAlbums((current) => current
            .filter((album) => album.ownerId !== profile._id)
            .map((album) => ({
                ...album,
                postIds: album.postIds.filter((id) =>
                    !posts.some((post) => post.id === id && post.authorId === profile._id)
                ),
            }))
        );
        setLikedPostIds([]);
        setBookmarkedPostIds([]);
        setResharedPostIds([]);
    }

    function logout() {
        localStorage.removeItem("astrea-user");
        setProfile(EMPTY_PROFILE);
        setLikedPostIds([]);
        setBookmarkedPostIds([]);
        setResharedPostIds([]);
    }

    const value = {
        profile,
        users,
        posts,
        albums,
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
        createAlbum,
        updateAlbum,
        deleteAlbum,
        updateProfile,
        uploadProfilePicture,
        deletePost,
        togglePostVisibility,
        deleteAccount,
        addReportReason,
        reportPost,
        deleteUserAccountByAdmin,
        toggleUserVerification,
        logout,
    };

    return (
        <SocialContext.Provider value={value}>
            {children}
        </SocialContext.Provider>
    );
}
