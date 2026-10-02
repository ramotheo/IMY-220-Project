import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { LogoutIcon } from "./icon";
import Navigation from "./navigation";
import { useSocial } from "../context/useSocial";

import "../styles/siteHeader.css";

function SiteHeader() {
    const navigate = useNavigate();
    const { logout } = useSocial();
    const [confirmLogout, setConfirmLogout] = useState(false);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!confirmLogout) return undefined;

        cancelButtonRef.current?.focus();
        function handleKeyDown(event) {
            if (event.key === "Escape") setConfirmLogout(false);
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [confirmLogout]);

    function handleLogout() {
        logout();
        setConfirmLogout(false);
        navigate("/login", { replace: true });
    }

    return (
        <header className="site-header">
            <Link to="/home" className="site-brand" aria-label="Astrea home">
                astrea
            </Link>

            <Navigation />

            <button
                className="site-logout-button"
                type="button"
                aria-label="Log out"
                title="Log out"
                onClick={() => setConfirmLogout(true)}
            >
                <LogoutIcon />
            </button>

            {confirmLogout && (
                <div
                    className="logout-backdrop"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setConfirmLogout(false);
                    }}
                >
                    <section
                        className="logout-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                        aria-describedby="logout-dialog-description"
                    >
                        <h2 id="logout-dialog-title">Log out?</h2>
                        <p id="logout-dialog-description">
                            Are you sure you want to log out of your account?
                        </p>
                        <div className="logout-dialog-actions">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                className="logout-cancel-button"
                                onClick={() => setConfirmLogout(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="logout-confirm-button"
                                onClick={handleLogout}
                            >
                                Log out
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </header>
    );
}

export default SiteHeader;