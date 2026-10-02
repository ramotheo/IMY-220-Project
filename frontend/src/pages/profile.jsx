import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import PostCard from "../components/postCard";
import ProfilePicture from "../components/profilePicture";
import SiteHeader from "../components/siteHeader";
import { useFollowing } from "../context/useFollowing";

import { useSocial } from "../context/useSocial";

import "../styles/profile.css";

function Profile() {
    const [activeTab, setActiveTab] = useState("grid");
    const [connectionsType, setConnectionsType] = useState("");
    const { username } = useParams();
    const { isFollowing, toggleFollow } = useFollowing();
    const {
        profile,
        users,
        posts,
        loading,
    } = useSocial();
    const viewedUsername = username || profile.username;
    const isOwnProfile = viewedUsername === profile.username;
    const viewedProfile = isOwnProfile
        ? profile
        : users.find((user) => user.username === viewedUsername);

    if (!viewedProfile) {
        return (
            <div className="profile-page">
                <SiteHeader />
                <main className="profile-content">
                    <p role="status">{loading ? "Loading profile..." : "Profile not found."}</p>
                </main>
            </div>
        );
    }

    const tabs = [
        { id: "grid", label: "Grid" },
        { id: "reshared", label: "Reshared" },
        { id: "liked", label: "Liked" },
        { id: "bookmarked", label: "Saved" },
        ...(isOwnProfile
            ? [{ id: "hidden", label: "Hidden / Locked" }]
            : []),
    ];

    function getPosts() {
        switch (activeTab) {
            case "hidden":
                return posts.filter(
                    (post) =>
                        isOwnProfile &&
                        post.username === viewedUsername &&
                        (post.hidden || post.locked)
                );

            case "reshared":
                return posts.filter(
                    (post) => (viewedProfile.resharedPostIds || []).includes(post.id) &&
                        !post.hidden && !post.locked
                );

            case "liked":
                return posts.filter((post) => (post.likes || []).includes(viewedProfile._id) &&
                    !post.hidden && !post.locked);

            case "bookmarked":
                return posts.filter((post) => (viewedProfile.bookmarkedPostIds || []).includes(post.id) &&
                    !post.hidden && !post.locked);

            case "grid":
            default:
                return posts.filter(
                    (post) =>
                        post.username === viewedUsername &&
                        (activeTab !== "grid" || (!post.hidden && !post.locked))
                );
        }
    }

    const visiblePosts = getPosts();
    const connectionIds = connectionsType === "followers"
        ? viewedProfile.followers || []
        : viewedProfile.following || [];
    const connectionUsers = connectionIds
        .map((id) => users.find((user) => user._id === id))
        .filter(Boolean);

    return (
        <div className="profile-page">
            <SiteHeader />

            <main className="profile-content">

                {/* Profile Header */}
                <section className="profile-header">

                    <div className="profile-top">
                            <div className="profile-picture">
                                {viewedProfile.profilePicture ? (
                                <img
                                    src={viewedProfile.profilePicture}
                                    alt={viewedProfile.name}
                                />
                            ) : (
                                <div className="profile-picture-placeholder">
                                    {viewedProfile.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                        </div>

                        <div className="profile-stats">

                            <button
                                type="button"
                                className="profile-stat profile-stat-button"
                                aria-expanded={connectionsType === "following"}
                                onClick={() => setConnectionsType(
                                    connectionsType === "following" ? "" : "following"
                                )}
                            >
                                <strong>{viewedProfile.following?.length || 0}</strong>
                                <span>following</span>
                            </button>

                            <button
                                type="button"
                                className="profile-stat profile-stat-button"
                                aria-expanded={connectionsType === "followers"}
                                onClick={() => setConnectionsType(
                                    connectionsType === "followers" ? "" : "followers"
                                )}
                            >
                                <strong>{viewedProfile.followers?.length || 0}</strong>
                                <span>followers</span>
                            </button>

                            <div className="profile-stat">
                                <strong>{viewedProfile.likes}</strong>
                                <span>likes</span>
                            </div>

                        </div>
                    </div>

                    {connectionsType && (
                        <section className="profile-connections" aria-labelledby="connections-title">
                            <header>
                                <h2 id="connections-title">
                                    {connectionsType === "followers" ? "Followers" : "Following"}
                                </h2>
                                <button type="button" onClick={() => setConnectionsType("")}>
                                    Close
                                </button>
                            </header>
                            {connectionUsers.length > 0 ? (
                                <ul>
                                    {connectionUsers.map((user) => (
                                        <li key={user._id}>
                                            <Link to={`/profile/${encodeURIComponent(user.username)}`}>
                                                <ProfilePicture
                                                    username={user.username}
                                                    className="connections-avatar"
                                                />
                                                <span>{user.name || user.username}</span>
                                                <span>@{user.username}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No {connectionsType} yet.</p>
                            )}
                        </section>
                    )}

                    {/* Bio */}
                    <div className="profile-bio">
                        <h1>{viewedProfile.name}</h1>
                        <p>@{viewedProfile.username}</p>
                        <span>{viewedProfile.bio || "No bio yet."}</span>
                    </div>

                    {/* Actions */}
                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <>
                            <Link to="/profile/edit" className="profile-button">
                                Edit Profile
                            </Link>
                            <Link to="/create" className="profile-button">
                                Create Post
                            </Link>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="profile-button"
                                onClick={() => toggleFollow(viewedUsername)}
                            >
                                {isFollowing(viewedUsername) ? "Following" : "Follow"}
                            </button>
                        )}
                    </div>

                </section>

                {/* Tabs */}
                <nav className="profile-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={
                                activeTab === tab.id
                                    ? "profile-tab active"
                                    : "profile-tab"
                            }
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Post Grid */}
                <section className="profile-post-grid">
                    {visiblePosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                        />
                    ))}
                    {visiblePosts.length === 0 && (
                        <p className="profile-empty-state">
                            {activeTab === "grid" ? "No posts yet." : "Nothing here yet."}
                        </p>
                    )}
                </section>

            </main>
        </div>
    );
}

export default Profile;