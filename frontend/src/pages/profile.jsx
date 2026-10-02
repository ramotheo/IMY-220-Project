import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import PostCard from "../components/postCard";
import SiteHeader from "../components/siteHeader";
import { useFollowing } from "../context/useFollowing";

import { useSocial } from "../context/useSocial";

import "../styles/profile.css";

function Profile() {
    const [activeTab, setActiveTab] = useState("grid");
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

                            <div className="profile-stat">
                                <strong>{viewedProfile.following?.length ?? viewedProfile.following ?? 0}</strong>
                                <span>following</span>
                            </div>

                            <div className="profile-stat">
                                <strong>{viewedProfile.followers?.length ?? viewedProfile.followers ?? 0}</strong>
                                <span>followers</span>
                            </div>

                            <div className="profile-stat">
                                <strong>{viewedProfile.likes}</strong>
                                <span>likes</span>
                            </div>

                        </div>
                    </div>

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