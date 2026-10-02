import PostCard from "../components/postCard";
import SiteHeader from "../components/siteHeader";

import { useFollowing } from "../context/useFollowing";
import { useSocial } from "../context/useSocial";

import "../styles/home.css";

function Following() {
    const { following } = useFollowing();
    const { posts } = useSocial();

    const followingPosts = posts.filter((post) =>
        following.includes(post.username) && !post.hidden && !post.locked
    );

    return (
        <main className="home">
            <SiteHeader />

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