import { useMemo, useState } from "react";

import PostCard from "../components/postCard";
import SiteHeader from "../components/siteHeader";

import { useSocial } from "../context/useSocial";

import "../styles/home.css";

function Home() {
    const { posts, profile, loading, error } = useSocial();
    const [feedMode, setFeedMode] = useState("global");

    const publicPosts = useMemo(
        () => posts.filter((post) => !post.hidden && !post.locked),
        [posts]
    );

    const feedPosts = useMemo(() => {
        if (feedMode === "local") {
            const followedUsernames = new Set(profile.following || []);
            return publicPosts.filter((post) => {
                const authorMatches = followedUsernames.has(post.authorId);
                const isOwnPost = post.authorId === profile._id;
                return authorMatches || isOwnPost;
            });
        }

        return publicPosts;
    }, [feedMode, profile._id, profile.following, publicPosts]);

    return (
        <main className="home">
            <SiteHeader />

            <section className="feed-controls" aria-label="Feed filters">
                <div className="feed-toggle" role="tablist" aria-label="Feed mode">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={feedMode === "global"}
                        className={feedMode === "global" ? "active" : ""}
                        onClick={() => setFeedMode("global")}
                    >
                        Global
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={feedMode === "local"}
                        className={feedMode === "local" ? "active" : ""}
                        onClick={() => setFeedMode("local")}
                    >
                        Local
                    </button>
                </div>
            </section>

            <section className="feed">
                {loading ? <p role="status">Loading posts...</p> : null}
                {!loading && error ? <p role="alert">{error}</p> : null}
                {!loading && !error && feedPosts.length === 0 ? (
                    <div className="empty-feed">
                        <div className="empty-feed-content">
                            <h2>No posts to show</h2>
                            <p>
                                {feedMode === "local"
                                    ? "Follow friends or create a post to populate your local feed."
                                    : "There are currently no public posts available."}
                            </p>
                        </div>
                    </div>
                ) : null}
                {!loading && !error && feedPosts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                    />
                ))}
            </section>
        </main>
    );
}

export default Home;