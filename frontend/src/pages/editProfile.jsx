import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import SiteHeader from "../components/siteHeader";
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
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const cancelDeleteRef = useRef(null);

    useEffect(() => {
        if (!picturePreview) return undefined;
        return () => URL.revokeObjectURL(picturePreview);
    }, [picturePreview]);

    useEffect(() => {
        if (!confirmDelete) return undefined;

        cancelDeleteRef.current?.focus();
        function handleKeyDown(event) {
            if (event.key === "Escape" && !isDeleting) {
                setConfirmDelete(false);
                setDeleteError("");
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [confirmDelete, isDeleting]);

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
        setIsDeleting(true);
        setDeleteError("");
        try {
            await deleteAccount();
            navigate("/login", { replace: true });
        } catch (requestError) {
            setDeleteError(requestError.message);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="account-page">
            <SiteHeader />
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
                    <button
                        type="button"
                        onClick={() => {
                            setDeleteError("");
                            setConfirmDelete(true);
                        }}
                    >
                        Delete account
                    </button>
                </section>
            </main>

            {confirmDelete && (
                <div
                    className="delete-account-backdrop"
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !isDeleting) {
                            setConfirmDelete(false);
                            setDeleteError("");
                        }
                    }}
                >
                    <section
                        className="delete-account-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-account-title"
                        aria-describedby="delete-account-description"
                    >
                        <h2 id="delete-account-title">Delete account?</h2>
                        <p id="delete-account-description">
                            This permanently removes your profile and posts. This action cannot be undone.
                        </p>
                        {deleteError && <p className="account-error" role="alert">{deleteError}</p>}
                        <div className="delete-account-dialog-actions">
                            <button
                                ref={cancelDeleteRef}
                                type="button"
                                className="delete-account-cancel"
                                disabled={isDeleting}
                                onClick={() => {
                                    setConfirmDelete(false);
                                    setDeleteError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="delete-account-confirm"
                                disabled={isDeleting}
                                onClick={handleDeleteAccount}
                            >
                                {isDeleting ? "Deleting..." : "Delete account"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default EditProfile;