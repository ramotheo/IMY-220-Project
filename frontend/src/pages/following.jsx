import Navigation from "../components/navigation";
import PostCard from "../components/postCard";
import { NotificationIcon } from "../components/icon";

import { posts } from "../data/posts";

import { useFollowing } from "../context/followingContext";

import "../styles/home.css";

function Following() {
    const { following } = useFollowing();

    const followingPosts = posts.filter((post) =>
        following.includes(post.username)
    );

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
                {followingPosts.length > 0 ? (
                    followingPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                        />
                    ))
                ) : (
                    <div className="empty-feed">
                        <div className="empty-feed-content">
                            <h2>No posts yet</h2>

                            <p>
                                Posts from people you follow
                                will appear here.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default Following;