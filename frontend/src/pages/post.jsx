import { useParams } from "react-router-dom";
import { useState } from "react";

import {
    LikeIcon,
    CommentIcon,
    ReshareIcon,
    BookmarkIcon,
} from "../components/icon";

import { posts } from "../data/posts";
import { comments } from "../data/comments";

import { useFollowing } from "../context/followingContext";
import ProfilePicture from "../components/profilePicture";

import "../styles/post.css";


function Post() {
    const { postId } = useParams();
    const { isFollowing, toggleFollow } = useFollowing();

    const post = posts.find(
        (post) => post.id === Number(postId)
    );

    const postComments = comments.filter(
        (comment) => comment.postId === Number(postId)
    );

    const following = isFollowing(post.username)
    const [liked, setLiked] = useState(false);
    const [reshared, setReshared] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);

    if (!post) {
        return (
            <main className="post-page">
                <h1>Post not found</h1>
            </main>
        );
    }

    return (
        <main className="post-page">
            {/* ====================== POST ====================== */}
            <section className="single-post">
                <header className="single-post-header">
                    <div className="single-post-user">
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
                    </div>

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
                    <button type="button">
                        <CommentIcon />
                        <span>{postComments.length}</span>
                    </button>

                    <button
                        type="button"
                        className={reshared ? "active" : ""}
                        onClick={() =>
                            setReshared(!reshared)
                        }
                    >
                        <ReshareIcon />
                        <span>2</span>
                    </button>

                    <button
                        type="button"
                        className={liked ? "active" : ""}
                        onClick={() =>
                            setLiked(!liked)
                        }
                    >
                        <LikeIcon />
                        <span>{post.likes}</span>
                    </button>

                    <button
                        type="button"
                        className={
                            bookmarked ? "active" : ""
                        }
                        onClick={() =>
                            setBookmarked(!bookmarked)
                        }
                    >
                        <BookmarkIcon />
                    </button>

                    <button
                        type="button"
                        className="reply-button"
                    >
                        Reply...
                    </button>

                </div>


                <div className="single-post-caption">
                    <strong>{post.username}</strong>{" "}
                    {post.caption}
                </div>
            </section>


            {/* ====================== COMMENTS ====================== */}
            <section className="comments">
                {postComments.map((comment) => (
                    <article
                        className="comment"
                        key={comment.id}
                    >
                        <div className="comment-avatar">
                            <UserIcon />
                        </div>

                        <div className="comment-content">
                            <div className="comment-user">
                                <strong>
                                    {comment.username}
                                </strong>

                                <span>
                                    {comment.handle} •{" "}
                                    {comment.time}
                                </span>
                            </div>

                            <p>
                                {comment.text}
                            </p>
                        </div>

                        <div className="comment-actions">
                            <button type="button">
                                Reply
                            </button>

                            <button type="button">
                                <LikeIcon />
                            </button>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
}

export default Post;