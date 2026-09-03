import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "../pages/splash/login";
import Signup from "../pages/splash/signup";
import Home from "../pages/home";
import Profile from "../pages/profile";
import Post from "../pages/post";
import NotFound from "../pages/notfound";
import Navigation from "../components/navigation";

export default function Router() {
    return (
        <BrowserRouter>
            <Navigation />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/post" element={<Post />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}