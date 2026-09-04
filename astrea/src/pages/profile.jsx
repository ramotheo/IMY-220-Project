import { useState } from "react";

import PostCard from "../components/postCard";
import Navigation from "../components/navigation";

import { posts } from "../data/posts";

import "../styles/profile.css";

function Profile() {
    const [activeTab, setActiveTab] = useState("grid");

    const profile = {
        username: "motheom",
        name: "Motheo Morena",
        profilePicture:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=90",
        following: 600,
        followers: "23.3k",
        likes: "800k",
        bio: "Exploring the world, one postcard at a time.",
    };

    const tabs = [
        { id: "grid", label: "Grid" },
        { id: "hidden", label: "Hidden / Locked" },
        { id: "reshared", label: "Reshared" },
        { id: "liked", label: "Liked" },
    ];

    const currentUsername = profile.username;

    function getPosts() {
        switch (activeTab) {
            case "hidden":
                return posts.filter(
                    (post) =>
                        post.username === currentUsername &&
                        post.hidden
                );

            case "reshared":
                return posts.filter(
                    (post) =>
                        post.username === currentUsername &&
                        post.reshared
                );

            case "liked":
                return posts.filter(
                    (post) => post.liked
                );

            case "grid":
            default:
                return posts.filter(
                    (post) => post.username === currentUsername
                );
        }
    }

    return (
        <div className="profile-page">
            <Navigation />

            <main className="profile-content">

                {/* Profile Header */}
                <section className="profile-header">

                    <div className="profile-top">
                        <div className="profile-picture">
                            {profile.profilePicture ? (
                                <img
                                    src={profile.profilePicture}
                                    alt={profile.name}
                                />
                            ) : (
                                <div className="profile-picture-placeholder">
                                    M
                                </div>
                            )}
                        </div>

                        <div className="profile-stats">

                            <div className="profile-stat">
                                <strong>{profile.following}</strong>
                                <span>following</span>
                            </div>

                            <div className="profile-stat">
                                <strong>{profile.followers}</strong>
                                <span>followers</span>
                            </div>

                            <div className="profile-stat">
                                <strong>{profile.likes}</strong>
                                <span>likes</span>
                            </div>

                        </div>
                    </div>

                    {/* Bio */}
                    <div className="profile-bio">
                        <h1>{profile.name}</h1>
                        <p>@{profile.username}</p>
                        <span>{profile.bio}</span>
                    </div>

                    {/* Actions */}
                    <div className="profile-actions">
                        <button className="profile-button">
                            Edit Profile
                        </button>

                        <button className="profile-button">
                            View Archive
                        </button>
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
                    {getPosts().map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                        />
                    ))}
                </section>

            </main>
        </div>
    );
}

export default Profile;