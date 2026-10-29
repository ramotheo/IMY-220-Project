import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import SiteHeader from "../components/siteHeader";
import { useSocial } from "../context/useSocial";

import "../styles/album.css";

function parseHashtags(value) {
    return [...new Set(value
        .split(/[,\s]+/)
        .map((tag) => tag.trim().replace(/^#+/, "").toLowerCase())
        .filter((tag) => /^[a-z0-9_]+$/.test(tag))
    )].slice(0, 30);
}

function AlbumPage({ createMode = false }) {
    const { albumId } = useParams();
    const { albums, loading } = useSocial();
    const album = albums.find((item) => item.id === albumId);

    if (!createMode && !album) {
        return (
            <div className="album-page">
                <SiteHeader />
                <main className="album-content">
                    <p role="status">{loading ? "Loading album..." : "Album not found."}</p>
                </main>
            </div>
        );
    }

    return <AlbumEditor key={album?.id || "new"} album={album} createMode={createMode} />;
}

function AlbumEditor({ album, createMode }) {
    const navigate = useNavigate();
    const { posts, profile, createAlbum, updateAlbum, deleteAlbum } = useSocial();
    const isOwner = album?.ownerId === profile._id;
    const availablePosts = posts.filter((post) => !post.hidden && !post.locked);
    const [name, setName] = useState(album?.name || "");
    const [description, setDescription] = useState(album?.description || "");
    const [hashtags, setHashtags] = useState((album?.hashtags || []).map((tag) => `#${tag}`).join(", "));
    const [selectedPostIds, setSelectedPostIds] = useState(album?.postIds || []);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const recommendations = useMemo(() => {
        const counts = new Map();
        availablePosts
            .filter((post) => selectedPostIds.includes(post.id))
            .flatMap((post) => post.hashtags || [])
            .forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
        return [...counts.entries()]
            .sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB))
            .map(([tag, count]) => ({ tag, count }));
    }, [availablePosts, selectedPostIds]);
    const albumPosts = (album?.postIds || [])
        .map((id) => availablePosts.find((post) => post.id === id))
        .filter(Boolean);

    function addRecommendedHashtag(tag) {
        const selected = parseHashtags(hashtags);
        if (!selected.includes(tag)) setHashtags([...selected, tag].map((item) => `#${item}`).join(", "));
    }

    function togglePost(postId) {
        setSelectedPostIds((current) => current.includes(postId)
            ? current.filter((id) => id !== postId)
            : [...current, postId]
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!name.trim()) {
            setError("Enter a name for your album.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const values = {
                name: name.trim(),
                description: description.trim(),
                hashtags: parseHashtags(hashtags),
                postIds: selectedPostIds,
            };
            const savedAlbum = createMode
                ? await createAlbum(values)
                : await updateAlbum(album.id, values);
            navigate(`/album/${savedAlbum.id}`);
        } catch (requestError) {
            setError(requestError.message || "Unable to save album.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Delete this album? The posts in it will not be deleted.")) return;
        setSaving(true);
        try {
            await deleteAlbum(album.id);
            navigate("/profile");
        } catch (requestError) {
            setError(requestError.message || "Unable to delete album.");
            setSaving(false);
        }
    }

    return (
        <div className="album-page">
            <SiteHeader />
            <main className="album-content">
                <Link to="/profile" className="album-back-link">← Back to profile</Link>

                {(createMode || isOwner) ? (
                    <form className="album-form" onSubmit={handleSubmit}>
                        <header className="album-page-header">
                            <p>{createMode ? "CURATE YOUR MOMENTS" : "YOUR COLLECTION"}</p>
                            <h1>{createMode ? "Create an album" : "Edit album"}</h1>
                            <span>Gather posts around a place, event, or anything you love.</span>
                        </header>

                        <label>
                            Album name
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={80}
                                placeholder="e.g. Cape Town weekend"
                                required
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                maxLength={500}
                                placeholder="Add a little context to this collection."
                            />
                            <span className="album-field-hint">{description.length}/500</span>
                        </label>

                        <label>
                            Hashtags
                            <input
                                value={hashtags}
                                onChange={(event) => setHashtags(event.target.value)}
                                placeholder="#travel, #friends"
                            />
                            <span className="album-field-hint">Separate hashtags with commas or spaces.</span>
                        </label>

                        <section className="album-recommendations" aria-labelledby="album-recommendations-title">
                            <div>
                                <h2 id="album-recommendations-title">Suggested hashtags</h2>
                                <p>Based on the posts selected for this album.</p>
                            </div>
                            {recommendations.length ? (
                                <div className="album-tag-list">
                                    {recommendations.map(({ tag, count }) => (
                                        <button
                                            type="button"
                                            key={tag}
                                            className="album-tag-suggestion"
                                            onClick={() => addRecommendedHashtag(tag)}
                                            disabled={parseHashtags(hashtags).includes(tag)}
                                            title={`Used in ${count} selected ${count === 1 ? "post" : "posts"}`}
                                        >
                                            #{tag}<span>{count}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="album-field-hint">Select posts with hashtags to see suggestions.</p>
                            )}
                        </section>

                        <fieldset className="album-post-picker">
                            <legend>Add posts <span>{selectedPostIds.length} selected</span></legend>
                            {availablePosts.length ? (
                                <div className="album-picker-grid">
                                    {availablePosts.map((post) => (
                                        <label
                                            key={post.id}
                                            className={selectedPostIds.includes(post.id) ? "album-picker-post selected" : "album-picker-post"}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPostIds.includes(post.id)}
                                                onChange={() => togglePost(post.id)}
                                            />
                                            <img src={post.image} alt="" />
                                            <span>{post.caption || "Untitled post"}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="album-field-hint">There are no available posts to add yet.</p>
                            )}
                        </fieldset>

                        {error && <p className="album-error" role="alert">{error}</p>}
                        <div className="album-form-actions">
                            {!createMode && (
                                <button type="button" className="album-delete-button" onClick={handleDelete} disabled={saving}>
                                    Delete album
                                </button>
                            )}
                            <Link to={createMode ? "/profile" : `/album/${album.id}`} className="album-cancel-button">
                                Cancel
                            </Link>
                            <button type="submit" className="album-save-button" disabled={saving}>
                                {saving ? "Saving..." : createMode ? "Create album" : "Save changes"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <article className="album-view">
                        <header className="album-page-header">
                            <p>ALBUM BY <Link to={`/profile/${encodeURIComponent(album.ownerUsername)}`}>@{album.ownerUsername}</Link></p>
                            <h1>{album.name}</h1>
                            {album.description && <span>{album.description}</span>}
                            {album.hashtags.length > 0 && (
                                <div className="album-tag-list">
                                    {album.hashtags.map((tag) => <span className="album-tag" key={tag}>#{tag}</span>)}
                                </div>
                            )}
                        </header>
                        <section className="album-view-grid">
                            {albumPosts.map((post) => (
                                    <Link to={`/post/${post.id}`} className="album-view-post" key={post.id}>
                                        <img src={post.image} alt={`Post by ${post.username}`} />
                                        <span>{post.caption || "View post"}</span>
                                    </Link>
                                ))}
                            {albumPosts.length === 0 && <p>This album has no available posts.</p>}
                        </section>
                    </article>
                )}
            </main>
        </div>
    );
}

export default AlbumPage;
