import { Link, useParams } from "react-router-dom";
import { useRef, useState } from "react";

import {
    LikeIcon,
    CommentIcon,
    ReshareIcon,
    BookmarkIcon,
} from "../components/icon";

import { useFollowing } from "../context/useFollowing";
import { useSocial } from "../context/useSocial";

import ProfilePicture from "../components/profilePicture";
import SiteHeader from "../components/siteHeader";

import "../styles/post.css";


function Post() {
    const { postId } = useParams();
    const { isFollowing, toggleFollow } = useFollowing();
    const {
        posts,
        users,
        profile,
        isLiked,
        isReshared,
        isBookmarked,
        toggleLike,
        toggleReshare,
        toggleBookmark,
        addComment,
    } = useSocial();

    const post = posts.find(
        (post) => post.id === postId
    );

    const postComments = post?.comments || [];
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replyTarget, setReplyTarget] = useState(null);
    const [likedCommentIds, setLikedCommentIds] = useState([]);
    const commentsRef = useRef(null);

    const following = isFollowing(post?.username);
    const liked = post ? isLiked(post.id) : false;
    const reshared = post ? isReshared(post.id) : false;
    const reshareCount = post
        ? users.filter((user) => (user.resharedPostIds || []).includes(post.id)).length
        : 0;
    const bookmarked = post ? isBookmarked(post.id) : false;
    const hasReplied = postComments.some(
        (comment) => comment.postId === post?.id && comment.username === profile.username
    );

    function openReply(target = null) {
        setReplyTarget(target);
        setReplyOpen(true);
    }

    async function handleReplySubmit(event) {
        event.preventDefault();

        const text = replyText.trim();
        if (!text) return;

        await addComment(postId, { text, replyTo: replyTarget?.id ?? null });
        setReplyText("");
        setReplyTarget(null);
        setReplyOpen(false);
    }

    if (!post) {
        return (
            <main className="post-page">
                <SiteHeader />
                <div className="post-page-content">
                    <h1>Post not found</h1>
                </div>
            </main>
        );
    }

    if ((post.hidden || post.locked) && post.username !== profile.username) {
        return (
            <main className="post-page">
                <SiteHeader />
                <div className="post-page-content">
                    <h1>This post is hidden or locked.</h1>
                    <Link to="/home">Back to feed</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="post-page">
            <SiteHeader />
            <div className="post-page-content">
            {/* ====================== POST ====================== */}
            <section className="single-post">
                <header className="single-post-header">
                    <Link
                        to={`/profile/${encodeURIComponent(post.username)}`}
                        className="single-post-user"
                    >
                        <ProfilePicture
                            username={post.username}
                            className="post-avatar"
                        />
                        
                        <div>
                            <strong>
                                {post.username}
                            </strong>

                            <span>
                                @{post.username}
                            </span>
                        </div>
                    </Link>

                    <button
                        className="follow-button"
                        type="button"
                        onClick={() => toggleFollow(post.username)}
                    >
                        {following ? "Following" : "Follow"}
                    </button>
                </header>


                <div className="single-post-image">
                    <img
                        src={post.image}
                        alt={`Post by ${post.username}`}
                    />
                </div>


                <div className="post-meta">
                    <span>
                        {post.time} • {post.date}
                    </span>

                    <strong>
                        • {post.views} views
                    </strong>
                </div>


                <div className="single-post-actions">
                    <button
                        type="button"
                        aria-label="View comments"
                        onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth" })}
                    >
                        <CommentIcon />
                        <span>{postComments.length}</span>
                    </button>

                    <button
                        type="button"
                        aria-label={reshared ? "Remove reshare" : "Reshare post"}
                        aria-pressed={reshared}
                        className={reshared ? "active" : ""}
                        onClick={() => toggleReshare(post.id)}
                    >
                        <ReshareIcon />
                        <span>{reshareCount}</span>
                    </button>

                    <button
                        type="button"
                        aria-label={liked ? "Unlike post" : "Like post"}
                        aria-pressed={liked}
                        className={liked ? "active" : ""}
                        onClick={() => toggleLike(post.id)}
                    >
                        <LikeIcon />
                        <span>{post.likes.length}</span>
                    </button>

                    <button
                        type="button"
                        aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
                        aria-pressed={bookmarked}
                        className={
                            bookmarked ? "active" : ""
                        }
                        onClick={() => toggleBookmark(post.id)}
                    >
                        <BookmarkIcon />
                    </button>

                    <button
                        type="button"
                        className={`reply-button ${hasReplied ? "active" : ""}`}
                        aria-pressed={hasReplied}
                        onClick={() => openReply()}
                    >
                        Reply...
                    </button>

                </div>


                <div className="single-post-caption">
                    <Link
                        to={`/profile/${encodeURIComponent(post.username)}`}
                        className="single-post-author"
                    >
                        <strong>{post.username}</strong>
                    </Link>{" "}
                    {post.caption}
                </div>
            </section>


            {/* ====================== COMMENTS ====================== */}
            <section className="comments" ref={commentsRef}>
                {postComments.map((comment) => {
                    const replyUsername = postComments.find(
                        (parent) => parent.id === comment.replyTo
                    )?.username || post.username;
                    return (
                    <article
                        className="comment"
                        key={comment.id}
                    >
                        <Link
                            to={`/profile/${encodeURIComponent(comment.username)}`}
                            className="comment-avatar-link"
                            aria-label={`View ${comment.username}'s profile`}
                        >
                            <ProfilePicture
                                username={comment.username}
                                className="comment-avatar"
                            />
                        </Link>

                        <div className="comment-content">
                            <div className="comment-user">
                                <Link to={`/profile/${encodeURIComponent(comment.username)}`}>
                                    <strong>{comment.username}</strong>
                                </Link>

                                <span>
                                    {comment.handle} •{" "}
                                    {comment.time}
                                </span>
                            </div>

                            <p>
                                {comment.text}
                            </p>
                            {comment.replyTo && (
                                <span className="comment-reply-target">
                                    Replying to @
                                    <Link to={`/profile/${encodeURIComponent(replyUsername)}`}>
                                        {replyUsername}
                                    </Link>
                                </span>
                            )}
                        </div>

                        <div className="comment-actions">
                            <button
                                type="button"
                                onClick={() => openReply(comment)}
                            >
                                Reply
                            </button>

                            <button
                                type="button"
                                className={likedCommentIds.includes(comment.id) ? "active" : ""}
                                aria-label={likedCommentIds.includes(comment.id) ? "Unlike comment" : "Like comment"}
                                aria-pressed={likedCommentIds.includes(comment.id)}
                                onClick={() => setLikedCommentIds((current) =>
                                    current.includes(comment.id)
                                        ? current.filter((id) => id !== comment.id)
                                        : [...current, comment.id]
                                )}
                            >
                                <LikeIcon />
                            </button>
                        </div>
                    </article>
                    );
                })}
            </section>

            {replyOpen && (
                <div
                    className="reply-backdrop"
                    onClick={() => setReplyOpen(false)}
                >
                    <section
                        className="reply-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reply-dialog-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="reply-dialog-header">
                            <h2 id="reply-dialog-title">Reply to post</h2>
                            <button
                                type="button"
                                aria-label="Close reply form"
                                onClick={() => setReplyOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <p className="reply-context">
                            {replyTarget
                                ? `Replying to @${replyTarget.username}`
                                : `Replying to @${post.username}`}
                        </p>
                        <form onSubmit={handleReplySubmit}>
                            <textarea
                                autoFocus
                                aria-label="Your reply"
                                placeholder="Write a reply..."
                                maxLength={500}
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                            />
                            <div className="reply-dialog-footer">
                                <span>{replyText.length}/500</span>
                                <button type="submit" disabled={!replyText.trim()}>
                                    Reply
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            </div>
        </main>
    );
}

export default Post;