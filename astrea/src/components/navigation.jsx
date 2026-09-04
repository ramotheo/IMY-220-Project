import { Link, useLocation } from "react-router-dom";

import ProfilePicture from "./profilePicture";

import "../styles/navigation.css";

function Navigation() {
    const location = useLocation();

    const currentUsername = "motheom";

    return (
        <nav className="feed-navigation">
            <Link
                to="/profile"
                className="profile-link"
            >
                <ProfilePicture
                    username={currentUsername}
                    className="navigation-profile-picture"
                />
            </Link>

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
        </nav>
    );
}

export default Navigation;