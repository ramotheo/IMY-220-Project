import { Link, useLocation, useNavigate } from "react-router-dom";

import ProfilePicture from "./profilePicture";
import { PlusIcon } from "./icon";
import { useSocial } from "../context/useSocial";

import "../styles/navigation.css";

function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();

    const { profile } = useSocial();
    const currentUsername = profile.username;

    return (
        <nav className="feed-navigation">
            {/* Back button */}
            <button
                className="back-button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
            >
                ←
            </button>

            {/* Profile */}
            <Link
                to="/profile"
                className="profile-link"
            >
                <ProfilePicture
                    username={currentUsername}
                    className="navigation-profile-picture"
                />
            </Link>

            {/* Navigation links */}
            <div className="navigation-links">
                <Link
                    to="/home"
                    className={
                        location.pathname === "/home"
                            ? "active"
                            : ""
                    }
                >
                    Home
                </Link>

                <Link
                    to="/following"
                    className={
                        location.pathname === "/following"
                            ? "active"
                            : ""
                    }
                >
                    Following
                </Link>

                <Link
                    to="/explore"
                    className={
                        location.pathname === "/explore" || location.pathname.startsWith("/post/")
                            ? "active"
                            : ""
                    }
                >
                    Explore
                </Link>

                <Link
                    to="/create"
                    className={`create-post-link ${location.pathname === "/create" ? "active" : ""}`}
                >
                    <PlusIcon />
                    <span>&nbsp; Create</span>
                </Link>

                {profile.isAdmin && (
                    <Link
                        to="/admin"
                        className={location.pathname === "/admin" ? "active" : ""}
                    >
                        Admin
                    </Link>
                )}
            </div>
        </nav>
    );
}

export default Navigation;