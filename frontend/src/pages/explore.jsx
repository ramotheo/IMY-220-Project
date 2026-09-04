import { useState } from "react";
import { Link } from "react-router-dom";

import Navigation from "../components/navigation";
import {
    NotificationIcon,
    SearchIcon,
    UserIcon,
} from "../components/icon";

import { posts } from "../data/posts";

import "../styles/explore.css";

function Explore() {
    const [search, setSearch] = useState("");

    /*
     * Get unique usernames from the posts.
     *
     * This means we don't need a separate users.js file yet.
     */
    const users = [
        ...new Set(
            posts.map((post) => post.username)
        ),
    ];

    const filteredUsers = users.filter((username) =>
        username
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <main className="explore-page">
            {/* ====================== HEADER ====================== */}
            <header className="explore-header">
                <h1>astrea</h1>

                <button
                    className="notification-button"
                    type="button"
                    aria-label="Notifications"
                >
                    <NotificationIcon />
                </button>
            </header>

            {/* ====================== NAVIGATION ====================== */}

            <Navigation />

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
                {search.trim() !== "" ? (
                    <section className="explore-results">
                        {filteredUsers.length > 0 ? (

                            filteredUsers.map((username) => (
                                <Link
                                    to={`/profile/${username}`}
                                    className="explore-user"
                                    key={username}
                                >
                                    <div className="explore-user-avatar">
                                        <UserIcon />
                                    </div>

                                    <div className="explore-user-info">
                                        <strong>
                                            {username}
                                        </strong>

                                        <span>
                                            Astrea user •{" "}
                                            {posts.filter(
                                                (post) =>
                                                    post.username === username
                                            ).length}{" "}
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
                        {posts.map((post) => (
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