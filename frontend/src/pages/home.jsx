import { useMemo } from "react";

import PostCard from "../components/postCard";
import SiteHeader from "../components/siteHeader";

import { useSocial } from "../context/useSocial";

import "../styles/home.css";

function Home() {
    const { posts, loading, error } = useSocial();

    const publicPosts = useMemo(
        () => posts.filter((post) => !post.hidden && !post.locked),
        [posts]
    );

    const feedPosts = useMemo(() => publicPosts, [publicPosts]);

    return (
        <main className="home">
            <SiteHeader />

            <section className="feed">
                {loading ? <p role="status">Loading posts...</p> : null}
                {!loading && error ? <p role="alert">{error}</p> : null}
                {!loading && !error && feedPosts.length === 0 ? (
                    <div className="empty-feed">
                        <div className="empty-feed-content">
                            <h2>No posts to show</h2>
                            <p>There are currently no public posts available.</p>
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