import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navigation from "../components/navigation";
import { useSocial } from "../context/useSocial";

import "../styles/account.css";

function EditProfile() {
    const navigate = useNavigate();
    const { profile, updateProfile, uploadProfilePicture, deleteAccount } = useSocial();
    const [formData, setFormData] = useState({
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [picturePreview, setPicturePreview] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!picturePreview) return undefined;
        return () => URL.revokeObjectURL(picturePreview);
    }, [picturePreview]);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setError("");
    }

    function handlePictureChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Choose an image smaller than 5 MB.");
            event.target.value = "";
            return;
        }

        setProfilePictureFile(file);
        setPicturePreview(URL.createObjectURL(file));
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const username = formData.username.trim().replace(/^@/, "");
        const name = formData.name.trim();

        if (!username || !name) {
            setError("Name and username are required.");
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                ...profile,
                ...formData,
                name,
                username,
                bio: formData.bio.trim(),
            });
            if (profilePictureFile) {
                await uploadProfilePicture(profilePictureFile);
            }
            navigate("/profile");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteAccount() {
        if (!window.confirm("Delete this account and its posts from the database? This cannot be undone.")) {
            return;
        }

        try {
            await deleteAccount();
            navigate("/login", { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    return (
        <div className="account-page">
            <Navigation />
            <main className="account-content">
                <header className="account-page-header">
                    <p>YOUR ACCOUNT</p>
                    <h1>Edit profile</h1>
                </header>

                <form className="account-form" onSubmit={handleSubmit}>
                    <label>
                        Display name
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={60}
                            required
                        />
                    </label>
                    <label>
                        Username
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            maxLength={30}
                            required
                        />
                    </label>
                    <label>
                        Profile picture
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePictureChange}
                        />
                    </label>
                    {(picturePreview || profile.profilePicture) && (
                        <div className="post-preview">
                            <img
                                src={picturePreview || profile.profilePicture}
                                alt="Profile picture preview"
                            />
                        </div>
                    )}
                    <label>
                        Bio
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            maxLength={160}
                        />
                        <span className="field-counter">{formData.bio.length}/160</span>
                    </label>

                    {error && <p className="account-error" role="alert">{error}</p>}

                    <div className="account-form-actions">
                        <Link to="/profile" className="account-secondary-button">
                            Cancel
                        </Link>
                        <button type="submit" className="account-primary-button" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>

                <section className="account-danger-zone">
                    <div>
                        <h2>Delete account</h2>
                        <p>Remove this profile and its posts from the database.</p>
                    </div>
                    <button type="button" onClick={handleDeleteAccount}>
                        Delete account
                    </button>
                </section>
            </main>
        </div>
    );
}

export default EditProfile;