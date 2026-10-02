import { Link } from "react-router-dom";

import ProfilePicture from "./profilePicture";
import { UserIcon } from "./icon";

import { useSocial } from "../context/useSocial";

function PostHeader({ username }) {
    const { users } = useSocial();
    const user = users.find(
        (user) => user.username === username
    );

    return (
        <div className="post-header">
            <Link
                to={`/profile/${encodeURIComponent(username)}`}
                className="post-user-link"
            >
                <div className="post-user">
                    {user?.profilePicture ? (
                        <ProfilePicture
                            username={username}
                            className="post-avatar"
                        />
                    ) : (
                        <UserIcon />
                    )}

                    <span>{username}</span>
                </div>
            </Link>
        </div>
    );
}

export default PostHeader;