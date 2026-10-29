import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { apiRequest } from "../api";
import SiteHeader from "../components/siteHeader";
import { useSocial } from "../context/useSocial";

import "../styles/admin.css";

const defaultReportReasons = [
    "Spam",
    "Harassment",
    "Misleading content",
    "Hate speech",
    "Inappropriate content",
];

function Admin() {
    const {
        profile,
        users,
        posts,
        albums,
        deletePost,
        deleteAlbum,
        deleteUserAccountByAdmin,
        toggleUserVerification,
        addReportReason,
    } = useSocial();

    const [reportReasons, setReportReasons] = useState(defaultReportReasons);
    const [newReason, setNewReason] = useState("");
    const [feedback, setFeedback] = useState("");
    const [postEdits, setPostEdits] = useState({});
    const [albumEdits, setAlbumEdits] = useState({});

    useEffect(() => {
        apiRequest("/api/admin/report-reasons")
            .then((reasons) => {
                if (Array.isArray(reasons) && reasons.length > 0) {
                    setReportReasons(reasons.map((item) => item.reason));
                }
            })
            .catch(() => undefined);
    }, []);

    if (!profile.isAdmin) {
        return <Navigate to="/home" replace />;
    }

    const reportedPosts = posts.filter((post) => (post.reports || []).length > 0);

    async function handleAddReason(event) {
        event.preventDefault();
        const trimmedReason = newReason.trim();
        if (!trimmedReason) return;

        try {
            const createdReason = await addReportReason(trimmedReason);
            setReportReasons((current) => [...new Set([...current, createdReason.reason])]);
            setNewReason("");
            setFeedback("New report reason added.");
        } catch (error) {
            setFeedback(error.message || "Unable to add the reason.");
        }
    }

    async function handleDeletePost(postId) {
        if (!window.confirm("Remove this post from the platform?")) return;
        try {
            await deletePost(postId);
            setFeedback("Post deleted successfully.");
        } catch (error) {
            setFeedback(error.message || "Unable to delete this post.");
        }
    }

    async function handleDeleteAlbum(albumId) {
        if (!window.confirm("Delete this album?")) return;
        try {
            await deleteAlbum(albumId);
            setFeedback("Album deleted successfully.");
        } catch (error) {
            setFeedback(error.message || "Unable to delete this album.");
        }
    }

    async function handleDeleteUser(userId) {
        if (!window.confirm("This will delete the selected account and their content. Continue?")) return;
        try {
            await deleteUserAccountByAdmin(userId);
            setFeedback("User account deleted.");
        } catch (error) {
            setFeedback(error.message || "Unable to delete this account.");
        }
    }

    async function handleToggleVerification(userId, currentValue) {
        try {
            await toggleUserVerification(userId, !currentValue);
            setFeedback("Verification status updated.");
        } catch (error) {
            setFeedback(error.message || "Unable to update verification status.");
        }
    }

    async function handleEditPost(post) {
        const updatedCaption = (postEdits[post.id] ?? post.caption).trim();
        try {
            await apiRequest(`/api/posts/${post.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    userId: profile._id,
                    actingUserId: profile._id,
                    caption: updatedCaption,
                    hashtags: post.hashtags,
                }),
            });
            setFeedback("Post updated successfully.");
        } catch (error) {
            setFeedback(error.message || "Unable to update this post.");
        }
    }

    async function handleEditAlbum(album) {
        const updatedName = (albumEdits[album.id]?.name ?? album.name).trim();
        if (!updatedName) return;
        try {
            await apiRequest(`/api/albums/${album.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    userId: profile._id,
                    actingUserId: profile._id,
                    name: updatedName,
                    description: album.description,
                    hashtags: album.hashtags,
                    postIds: album.postIds,
                }),
            });
            setFeedback("Album updated successfully.");
        } catch (error) {
            setFeedback(error.message || "Unable to update this album.");
        }
    }

    return (
        <main className="admin-page">
            <SiteHeader />
            <div className="admin-content">
                <section className="admin-panel">
                    <h1>Admin moderation</h1>
                    <p className="admin-summary">
                        {reportedPosts.length} reported post(s), {users.length} user(s), {posts.length} post(s), {albums.length} album(s)
                    </p>
                    {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
                </section>

                <section className="admin-panel">
                    <h2>Reported posts</h2>
                    {reportedPosts.length === 0 ? (
                        <p>No reported posts.</p>
                    ) : (
                        <div className="admin-list">
                            {reportedPosts.map((post) => (
                                <article key={post.id} className="admin-card">
                                    <div className="admin-card-header">
                                        <strong>{post.username}</strong>
                                        <span>{(post.reports || []).length} reports</span>
                                    </div>
                                    <p>{post.caption || "No caption"}</p>
                                    <div className="admin-card-meta">
                                        {post.reports?.map((report, index) => (
                                            <span key={`${post.id}-${report.reporterId || index}`}>
                                                {report.reason}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="admin-card-actions">
                                        <input
                                            type="text"
                                            value={postEdits[post.id] ?? post.caption}
                                            onChange={(event) => setPostEdits((current) => ({
                                                ...current,
                                                [post.id]: event.target.value,
                                            }))}
                                        />
                                        <button type="button" onClick={() => handleEditPost(post)}>Save edit</button>
                                        <button type="button" className="danger" onClick={() => handleDeletePost(post.id)}>Delete</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="admin-panel">
                    <h2>Report reasons</h2>
                    <form onSubmit={handleAddReason} className="admin-reason-form">
                        <input
                            type="text"
                            value={newReason}
                            onChange={(event) => setNewReason(event.target.value)}
                            placeholder="Add a new reason"
                        />
                        <button type="submit">Add reason</button>
                    </form>
                    <div className="tag-list">
                        {reportReasons.map((reason) => (
                            <span key={reason} className="tag">{reason}</span>
                        ))}
                    </div>
                </section>

                <section className="admin-panel">
                    <h2>Posts</h2>
                    <div className="admin-list compact-list">
                        {posts.slice(0, 8).map((post) => (
                            <article key={post.id} className="admin-card admin-inline-card">
                                <strong>{post.username}</strong>
                                <span>{post.caption}</span>
                                <div className="admin-card-actions">
                                    <button type="button" onClick={() => handleEditPost(post)}>Edit</button>
                                    <button type="button" className="danger" onClick={() => handleDeletePost(post.id)}>Delete</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="admin-panel">
                    <h2>Albums</h2>
                    <div className="admin-list compact-list">
                        {albums.slice(0, 8).map((album) => (
                            <article key={album.id} className="admin-card admin-inline-card">
                                <strong>{album.name}</strong>
                                <span>{album.description || "No description"}</span>
                                <div className="admin-card-actions">
                                    <input
                                        type="text"
                                        value={albumEdits[album.id]?.name ?? album.name}
                                        onChange={(event) => setAlbumEdits((current) => ({
                                            ...current,
                                            [album.id]: { ...current[album.id], name: event.target.value },
                                        }))}
                                    />
                                    <button type="button" onClick={() => handleEditAlbum(album)}>Edit</button>
                                    <button type="button" className="danger" onClick={() => handleDeleteAlbum(album.id)}>Delete</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="admin-panel">
                    <h2>Users</h2>
                    <div className="admin-list compact-list">
                        {users.map((user) => (
                            <article key={user._id} className="admin-card admin-inline-card">
                                <strong>{user.name || user.username}</strong>
                                <span>@{user.username}</span>
                                <div className="admin-card-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleVerification(user._id, Boolean(user.verified))}
                                    >
                                        {user.verified ? "Unverify" : "Verify"}
                                    </button>
                                    <button type="button" className="danger" onClick={() => handleDeleteUser(user._id)}>
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Admin;
