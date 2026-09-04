import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "../pages/splash/login";
import Signup from "../pages/splash/signup";
import Profile from "../pages/profile";
import Home from "../pages/home";
import Following from "../pages/following";
import Explore from "../pages/explore";
import Post from "../pages/post";
import NotFound from "../pages/notFound";

import { FollowingProvider } from "../context/followingContext";

export default function Router() {
    return (
        <BrowserRouter>
            <FollowingProvider>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />}/>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/following" element={<Following />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/post/:postId" element={<Post />}/>
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </FollowingProvider>
        </BrowserRouter>
    );
}