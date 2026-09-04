import { Link, useLocation, useNavigate } from "react-router-dom";

import ProfilePicture from "./profilePicture";

import "../styles/navigation.css";

function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentUsername = "motheom";

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
                        location.pathname === "/explore"
                            ? "active"
                            : ""
                    }
                >
                    Explore
                </Link>
            </div>

        </nav>
    );
}

export default Navigation;