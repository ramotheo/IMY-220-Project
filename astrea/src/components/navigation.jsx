import { Link } from "react-router-dom";

function Navigation () {
    return (
        <nav className="nav">
            <Link to="/">Login</Link>
            <Link to="/signup">Signup</Link>
            <Link to="/home">Home</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/post">Post</Link>
        </nav>
    );
}

export default Navigation;