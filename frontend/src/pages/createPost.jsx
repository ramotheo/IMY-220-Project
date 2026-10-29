import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import SiteHeader from "../components/siteHeader";
import { useSocial } from "../context/useSocial";

import "../styles/account.css";

function CreatePost() {
    const navigate = useNavigate();
    const { createPost } = useSocial();
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [caption, setCaption] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!imagePreview) return undefined;
        return () => URL.revokeObjectURL(imagePreview);
    }, [imagePreview]);

    async function handleSubmit(event) {
        event.preventDefault();
        const cleanCaption = caption.trim();

        if (!imageFile || !cleanCaption) {
            setError("Choose an image and add a caption to publish.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createPost({
                imageFile,
                caption: cleanCaption,
                hashtags: hashtags.split(/[,\s]+/).map((tag) => tag.trim().replace(/^#+/, "")).filter(Boolean),
            });
            navigate("/profile");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="account-page">
            <SiteHeader />

            <main className="account-content">
                <header className="account-page-header">
                    <p>SHARE A MOMENT</p>
                    <h1>Create post</h1>
                </header>

                <form className="account-form" onSubmit={handleSubmit}>
                    <label>
                        Image
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                if (file && file.size > 5 * 1024 * 1024) {
                                    setError("Choose an image smaller than 5 MB.");
                                    event.target.value = "";
                                    return;
                                }
                                setImageFile(file);
                                setImagePreview(file ? URL.createObjectURL(file) : "");
                                setError("");
                            }}
                            required
                        />
                    </label>

                    <label>
                        Hashtags
                        <input
                            type="text"
                            value={hashtags}
                            onChange={(event) => setHashtags(event.target.value)}
                            placeholder="travel, friends, sunset"
                            aria-describedby="post-hashtag-hint"
                        />
                        <span id="post-hashtag-hint" className="field-counter">
                            Separate hashtags with commas.
                        </span>
                    </label>

                    {imagePreview && (
                        <div className="post-preview">
                            <img src={imagePreview} alt="Post preview" />
                        </div>
                    )}

                    <label>
                        Caption
                        <textarea
                            value={caption}
                            onChange={(event) => setCaption(event.target.value)}
                            maxLength={280}
                            placeholder="What would you like to share?"
                            required
                        />
                        <span className="field-counter">
                            {caption.length}/280
                        </span>
                    </label>

                    {error && (
                        <p className="account-error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="account-form-actions">
                        <Link
                            to="/profile"
                            className="account-secondary-button"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="account-primary-button"
                            disabled={isSubmitting || !imageFile || !caption.trim()}
                        >
                            {isSubmitting ? "Publishing..." : "Publish post"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default CreatePost;