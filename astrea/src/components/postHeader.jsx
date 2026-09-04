import { useEffect, useRef, useState } from "react";

import {
    UserIcon,
    MoreIcon,
} from "./icon";

import ProfilePicture from "./profilePicture";

import { useFollowing } from "../context/followingContext";
import { users } from "../data/users";

function PostHeader({ username }) {
    const user = users.find(
        (user) => user.username === username
    );

    return (
        <div className="post-header">
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
        </div>
    );
}

export default PostHeader;