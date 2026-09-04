import { useState } from "react";
import { Link } from "react-router-dom";

import PostHeader from "./postHeader";

import {
    LikeIcon,
    CommentIcon,
    ReshareIcon,
    BookmarkIcon,
} from "./icon";

function PostCard({ post }) {
    const [liked, setLiked] = useState(false);
    const [commented, setCommented] = useState(false);
    const [reshared, setReshared] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);

    return (
        <article className="post-card">
            <PostHeader
                username={post.username}
            />

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
                    onClick={() => setLiked(!liked)}
                >
                    <LikeIcon />
                    <span>{post.likes}</span>
                </button>

                <button
                    type="button"
                    className={`comment-button ${
                        commented ? "active" : ""
                    }`}
                    onClick={() => setCommented(!commented)}
                >
                    <CommentIcon />
                    <span>{post.comments}</span>
                </button>

                <button
                    type="button"
                    className={`reshare-button ${
                        reshared ? "active" : ""
                    }`}
                    onClick={() => setReshared(!reshared)}
                >
                    <ReshareIcon />
                </button>

                <button
                    type="button"
                    className={`bookmark-button ${
                        bookmarked ? "active" : ""
                    }`}
                    onClick={() =>
                        setBookmarked(!bookmarked)
                    }
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