import { useState } from "react";
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
    const { posts, users, loading, error } = useSocial();
    const publicPosts = posts.filter((post) => !post.hidden && !post.locked);
    const filteredUsers = users.filter((user) =>
        `${user.username} ${user.name}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <main className="explore-page">
            <SiteHeader />

            {/* ====================== SEARCH ====================== */}
            <section className="explore-content">
                <div className="explore-search">
                    <SearchIcon />

                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                {/* ====================== RESULTS ====================== */}
                {loading ? (
                    <p role="status">Loading from database...</p>
                ) : error ? (
                    <p role="alert">{error}</p>
                ) : search.trim() !== "" ? (
                    <section className="explore-results">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <Link
                                    to={`/profile/${encodeURIComponent(user.username)}`}
                                    className="explore-user"
                                    key={user._id}
                                >
                                    <div className="explore-user-avatar">
                                        <ProfilePicture username={user.username} />
                                    </div>

                                    <div className="explore-user-info">
                                        <strong>{user.username}</strong>

                                        <span>
                                            Astrea user •{" "}
                                            {publicPosts.filter((post) => post.authorId === user._id).length}{" "}
                                            posts
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="explore-no-results">
                                <h2>
                                    No results
                                </h2>

                                <p>
                                    No users found for "{search}".
                                </p>
                            </div>
                        )}
                    </section>
                ) : (
                    /* ====================== POST GRID ====================== */
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