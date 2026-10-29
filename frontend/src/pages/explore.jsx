import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SiteHeader from "../components/siteHeader";
import {
    SearchIcon,
} from "../components/icon";
import ProfilePicture from "../components/profilePicture";

import { useSocial } from "../context/useSocial";

import "../styles/explore.css";

function Explore() {
    const [search, setSearch] = useState("");
    const { posts, users, albums, loading, error } = useSocial();
    const publicPosts = useMemo(
        () => posts.filter((post) => !post.hidden && !post.locked),
        [posts]
    );
    const normalizedSearch = search.trim().toLowerCase();

    const filteredUsers = useMemo(() => {
        if (!normalizedSearch) return [];
        return users.filter((user) =>
            `${user.username} ${user.name} ${user.bio || ""}`
                .toLowerCase()
                .includes(normalizedSearch)
        );
    }, [normalizedSearch, users]);

    const filteredPosts = useMemo(() => {
        if (!normalizedSearch) return [];
        return publicPosts.filter((post) => {
            const searchableText = [
                post.caption,
                post.username,
                (post.hashtags || []).join(" "),
            ].join(" ").toLowerCase();
            return searchableText.includes(normalizedSearch);
        });
    }, [normalizedSearch, publicPosts]);

    const filteredAlbums = useMemo(() => {
        if (!normalizedSearch) return [];
        return albums.filter((album) => {
            const searchableText = [
                album.name,
                album.description,
                album.ownerUsername,
                (album.hashtags || []).join(" "),
            ].join(" ").toLowerCase();
            return searchableText.includes(normalizedSearch);
        });
    }, [albums, normalizedSearch]);

    return (
        <main className="explore-page">
            <SiteHeader />

            <section className="explore-content">
                <div className="explore-search">
                    <SearchIcon />

                    <input
                        type="text"
                        placeholder="Search users, posts, albums or hashtags"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                {loading ? (
                    <p role="status">Loading from database...</p>
                ) : error ? (
                    <p role="alert">{error}</p>
                ) : normalizedSearch ? (
                    <section className="explore-results">
                        {filteredUsers.length > 0 && (
                            <div className="explore-results-group">
                                <h2>Users</h2>
                                {filteredUsers.map((user) => (
                                    <Link
                                        to={`/profile/${encodeURIComponent(user.username)}`}
                                        className="explore-user"
                                        key={user._id}
                                    >
                                        <div className="explore-user-avatar">
                                            <ProfilePicture
                                                username={user.username}
                                                className="explore-user-avatar-image"
                                            />
                                        </div>

                                        <div className="explore-user-info">
                                            <strong>{user.username}</strong>
                                            <span>
                                                Astrea user • {publicPosts.filter((post) => post.authorId === user._id).length} posts
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {filteredPosts.length > 0 && (
                            <div className="explore-results-group">
                                <h2>Posts</h2>
                                {filteredPosts.map((post) => (
                                    <Link
                                        to={`/post/${post.id}`}
                                        className="explore-post-result"
                                        key={post.id}
                                    >
                                        <img src={post.image} alt={post.caption || "Post result"} />
                                        <div>
                                            <strong>{post.username}</strong>
                                            <span>{post.caption || "Shared a moment"}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {filteredAlbums.length > 0 && (
                            <div className="explore-results-group">
                                <h2>Albums</h2>
                                {filteredAlbums.map((album) => (
                                    <Link
                                        to={`/album/${album.id}`}
                                        className="explore-album-result"
                                        key={album.id}
                                    >
                                        <div>
                                            <strong>{album.name}</strong>
                                            <span>{album.description || "Album collection"}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {filteredUsers.length === 0 && filteredPosts.length === 0 && filteredAlbums.length === 0 && (
                            <div className="explore-no-results">
                                <h2>No results</h2>
                                <p>No users, posts, or albums matched “{search}”.</p>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="explore-grid">
                        {publicPosts.map((post) => (
                            <Link
                                to={`/post/${post.id}`}
                                className="explore-grid-item"
                                key={post.id}
                            >
                                <img
                                    src={post.image}
                                    alt={`Post by ${post.username}`}
                                />
                            </Link>
                        ))}
                    </section>
                )}
            </section>
        </main>
    );
}

export default Explore;