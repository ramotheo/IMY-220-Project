import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import asideImage from "../assets/images/aside.png";

import Input from "./input";

import "../styles/Splash.css";


function validateFormData(formData, isLogin) {
    const {
        username,
        email,
        password,
        confirmPassword
    } = formData;

    // Username
    if (!username.trim()) {
        return "Username is required.";
    }

    // Email
    if (!email.trim()) {
        return "Email is required.";
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        return "Please enter a valid email address.";
    }

    // Password
    if (!password) {
        return "Password is required.";
    }

    // Password length
    if (password.length < 8) {
        return "Password must be at least 8 characters.";
    }

    // Confirm password - signup only
    if (!isLogin) {
        if (!confirmPassword) {
            return "Please confirm your password.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }
    }

    // No errors
    return null;
}


function Form({ mode = "login", navigateTo }) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const isLogin = mode === "login";

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        const validationError = validateFormData(
            formData,
            isLogin
        );

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `http://localhost:3000/api/auth/${
                    isLogin ? "login" : "signup"
                }`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Something went wrong."
                );
            }

            console.log("Server response:", data);

            setLoading(false);

            navigate(navigateTo);
        } catch (error) {
            console.error(
                "Error submitting form:",
                error
            );

            setLoading(false);
            setError(
                "Unable to connect to the server. Please try again."
            );
        }
    }

    return (
        <main className="form">

            {/* LEFT IMAGE */}
            <section className="login-left">
                <img
                    src={asideImage}
                    alt="Astrea"
                    className="login-image"
                />
            </section>


            {/* RIGHT FORM */}
            <form className="login-right" onSubmit={handleSubmit} >

                {/* AUTH TOGGLE */}
                <div className="auth-toggle">
                    <Link
                        to="/login"
                        className={isLogin ? "active" : ""}
                    >
                        Login
                    </Link>

                    <Link
                        to="/signup"
                        className={!isLogin ? "active" : ""}
                    >
                        Signup
                    </Link>
                </div>


                {/* HEADER */}
                <div className="auth-header">
                    <h1>astrea</h1>

                    <p>
                        Share moments that shine
                    </p>

                    {/* <span>
                        {isLogin ? (
                            <>
                                WELCOME BACK TO<br />
                                THE MOMENTS THAT MATTER.
                            </>
                        ) : (
                            <>
                                JOIN THOUSANDS OF<br />
                                PHOTOGRAPHERS SHARING<br />
                                THE MOMENTS THAT MATTER.
                            </>
                        )}
                    </span> */}
                </div>


                {/* USERNAME */}
                <Input
                    label="Username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(value) => {
                        setFormData({
                            ...formData,
                            username: value,
                        });

                        setError("");
                    }}
                />

                {/* EMAIL */}
                <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(value) => {
                        setFormData({
                            ...formData,
                            email: value,
                        });

                        setError("");
                    }}
                />


                {/* PASSWORD */}
                <div className="password-input-wrapper">
                    <Input
                        label="Password"
                        type="password"
                        togglePassword
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(value) => {
                            setFormData({
                                ...formData,
                                password: value,
                            });

                            setError("");
                        }}
                    />
                </div>

                {/* CONFIRM PASSWORD - SIGNUP ONLY */}
                {!isLogin && (
                    <div className="password-input-wrapper">
                        <Input
                            label="Confirm Password"
                            type="password"
                            togglePassword
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(value) => {
                                setFormData({
                                    ...formData,
                                    confirmPassword: value,
                                });

                                setError("");
                            }}
                        />
                    </div>
                )}


                {/* VALIDATION ERROR */}
                {error && (
                    <p className="form-error">
                        {error}
                    </p>
                )}


                {/* SUBMIT */}
                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? isLogin
                            ? "Logging in..."
                            : "Creating account..."
                        : isLogin
                            ? "Login"
                            : "Sign Up"
                    }
                </button>


                {/* BOTTOM LINK */}
                <div className="form-actions">

                    {isLogin ? (
                        <p>
                            Don't have an account?{" "}
                            <Link to="/signup">
                                Sign Up
                            </Link>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <Link to="/login">
                                Login
                            </Link>
                        </p>
                    )}

                </div>

            </form>

        </main>
    );
}

export default Form;