import { useState } from "react";
import { Link } from "react-router-dom";

import PostHeader from "./postHeader";

import {
    LikeIcon,
    CommentIcon,
    ReshareIcon,
    BookmarkIcon,
    MoreIcon,
} from "./icon";
import { useSocial } from "../context/useSocial";
import { useFollowing } from "../context/useFollowing";

function PostCard({ post }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const {
        profile,
        users,
        isLiked,
        isBookmarked,
        isReshared,
        toggleLike,
        toggleBookmark,
        toggleReshare,
        togglePostVisibility,
        deletePost,
    } = useSocial();
    const { isFollowing, toggleFollow } = useFollowing();

    const liked = isLiked(post.id);
    const commented = post.comments.length > 0;
    const bookmarked = isBookmarked(post.id);
    const reshared = isReshared(post.id);
    const isOwner = post.username === profile.username;
    const following = isFollowing(post.username);

    function getLikeCount() {
        const count = post.likes.length;
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return String(count);
    }

    function getReshareCount() {
        return users.filter((user) => (user.resharedPostIds || []).includes(post.id)).length;
    }

    return (
        <article className="post-card">
            <PostHeader
                username={post.username}
            />

            {!isOwner && (
                <button
                    type="button"
                    className="follow-button post-follow-button"
                    aria-pressed={following}
                    onClick={() => toggleFollow(post.username)}
                >
                    {following ? "Following" : "Follow"}
                </button>
            )}

            {isOwner && (
                <div className="post-card-menu">
                    <button
                        type="button"
                        aria-label="Post options"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <MoreIcon />
                    </button>
                    {menuOpen && (
                        <div className="post-card-menu-items">
                            <button
                                type="button"
                                onClick={() => togglePostVisibility(post.id, "hidden")}
                            >
                                {post.hidden ? "Show on profile" : "Hide from profile"}
                            </button>
                            <button
                                type="button"
                                onClick={() => togglePostVisibility(post.id, "locked")}
                            >
                                {post.locked ? "Unlock post" : "Lock post"}
                            </button>
                            <button
                                type="button"
                                className="delete-post-action"
                                onClick={() => {
                                    if (window.confirm("Delete this post? This cannot be undone.")) {
                                        deletePost(post.id);
                                    }
                                    setMenuOpen(false);
                                }}
                            >
                                Delete post
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Link
                to={`/post/${post.id}`}
                className="post-link"
            >
                <div className="post-image">
                    <img
                        src={post.image}
                        alt={`Post by ${post.username}`}
                    />
                </div>
            </Link>

            <div className="post-actions">
                <button
                    type="button"
                    className={`like-button ${
                        liked ? "active" : ""
                    }`}
                    aria-label={liked ? "Unlike post" : "Like post"}
                    aria-pressed={liked}
                    onClick={() => toggleLike(post.id)}
                >
                    <LikeIcon />
                    <span>{getLikeCount()}</span>
                </button>

                <Link
                    to={`/post/${post.id}`}
                    className={`comment-button ${
                        commented ? "active" : ""
                    }`}
                    aria-label="View comments"
                >
                    <CommentIcon />
                    <span>{post.comments.length}</span>
                </Link>

                <button
                    type="button"
                    className={`reshare-button ${
                        reshared ? "active" : ""
                    }`}
                    aria-label={reshared ? "Remove reshare" : "Reshare post"}
                    aria-pressed={reshared}
                    onClick={() => toggleReshare(post.id)}
                >
                    <ReshareIcon />
                    <span>{getReshareCount()}</span>
                </button>

                <button
                    type="button"
                    className={`bookmark-button ${
                        bookmarked ? "active" : ""
                    }`}
                    aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
                    aria-pressed={bookmarked}
                    onClick={() => toggleBookmark(post.id)}
                >
                    <BookmarkIcon />
                </button>
            </div>

            <Link
                to={`/post/${post.id}`}
                className="post-caption-link"
            >
                <div className="post-caption">
                    <p>
                        <strong>{post.username}</strong>{" "}
                        {post.caption}
                    </p>

                    <span>
                        Load more comments...
                    </span>
                </div>
            </Link>
        </article>
    );
}

export default PostCard;