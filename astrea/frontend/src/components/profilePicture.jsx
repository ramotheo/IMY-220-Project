import { UserIcon } from "./icon";
import { users } from "../data/users";

function ProfilePicture({ username, className = "" }) {
    const user = users.find(
        (user) => user.username === username
    );

    if (!user?.profilePicture) {
        return (
            <div className={className}>
                <UserIcon />
            </div>
        );
    }

    return (
        <img
            src={user.profilePicture}
            alt={`${username}'s profile`}
            className={className}
        />
    );
}

export default ProfilePicture;