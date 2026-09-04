import Navigation from "../components/navigation";
import PostCard from "../components/postCard";
import { NotificationIcon } from "../components/icon";

import { posts } from "../data/posts";

import "../styles/home.css";

function Home() {
    return (
        <main className="home">
            <header className="home-header">
                <h1>astrea</h1>

                <button
                    className="notification-button"
                    type="button"
                >
                    <NotificationIcon />
                </button>
            </header>

            <Navigation />

            <section className="feed">
                {posts.map((post) => (
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