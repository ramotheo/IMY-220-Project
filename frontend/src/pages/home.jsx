import PostCard from "../components/postCard";
import SiteHeader from "../components/siteHeader";

import { useSocial } from "../context/useSocial";

import "../styles/home.css";

function Home() {
    const { posts, loading, error } = useSocial();
    const publicPosts = posts.filter((post) => !post.hidden && !post.locked);

    return (
        <main className="home">
            <SiteHeader />

            <section className="feed">
                {loading ? <p role="status">Loading posts...</p> : null}
                {!loading && error ? <p role="alert">{error}</p> : null}
                {!loading && !error && publicPosts.map((post) => (
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