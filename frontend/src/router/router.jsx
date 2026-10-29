import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Splash from "../pages/splash/landing";
import Login from "../pages/splash/login";
import Signup from "../pages/splash/signup";
import Profile from "../pages/profile";
import Home from "../pages/home";
import Following from "../pages/following";
import Explore from "../pages/explore";
import Post from "../pages/post";
import NotFound from "../pages/notFound";
import EditProfile from "../pages/editProfile";
import CreatePost from "../pages/createPost";
import AlbumPage from "../pages/album";

import { FollowingProvider } from "../context/followingContext";
import { SocialProvider } from "../context/socialContext";

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("astrea-user") || "null");
    } catch {
        return null;
    }
}

function RequireAuth({ children }) {
    const user = getStoredUser();
    return user?._id ? children : <Navigate to="/" replace />;
}

function GuestOnly({ children }) {
    const user = getStoredUser();
    return !user?._id ? children : <Navigate to="/home" replace />;
}

export default function Router() {
    return (
        <BrowserRouter>
            <SocialProvider>
                <FollowingProvider>
                    <Routes>
                        <Route path="/" element={<GuestOnly><Splash /></GuestOnly>} />
                        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                        <Route path="/profile/:username" element={<RequireAuth><Profile /></RequireAuth>} />
                        <Route path="/profile/edit" element={<RequireAuth><EditProfile /></RequireAuth>} />
                        <Route path="/create" element={<RequireAuth><CreatePost /></RequireAuth>} />
                        <Route path="/albums/new" element={<RequireAuth><AlbumPage createMode /></RequireAuth>} />
                        <Route path="/album/:albumId" element={<RequireAuth><AlbumPage /></RequireAuth>} />
                        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
                        <Route path="/following" element={<RequireAuth><Following /></RequireAuth>} />
                        <Route path="/explore" element={<RequireAuth><Explore /></RequireAuth>} />
                        <Route path="/post/:postId" element={<RequireAuth><Post /></RequireAuth>} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </FollowingProvider>
            </SocialProvider>
        </BrowserRouter>
    );
}