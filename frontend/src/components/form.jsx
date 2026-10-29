import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import asideImage from "../assets/images/aside.png";

import Input from "./input";
import { apiRequest } from "../api";
import { useSocial } from "../context/useSocial";

import "../styles/Splash.css";

function validateFormData(formData, isLogin) {
  const { email, password, confirmPassword } = formData;

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

function Form({ mode = "login", navigateTo, onModeChange }) {
  const navigate = useNavigate();
  const { setCurrentUser } = useSocial();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isLogin = mode === "login";

  function handleModeLink(event, nextMode) {
    if (onModeChange) {
      event.preventDefault();
      onModeChange(nextMode);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const validationError = validateFormData(formData, isLogin);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const requestData = { email: formData.email.trim(), password: formData.password };
      const data = await apiRequest(`/api/auth/${isLogin ? "login" : "signup"}`, {
        method: "POST",
        body: JSON.stringify(requestData),
      });
      setCurrentUser(data.user);
      navigate(navigateTo);
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form">
      {/* LEFT IMAGE */}
      <section className="login-left">
        <img src={asideImage} alt="Astrea" className="login-image" />
      </section>

      {/* RIGHT FORM */}
      <form className="login-right" onSubmit={handleSubmit}>
        {/* AUTH TOGGLE */}
        <div className="auth-toggle">
          <Link
            to="/login"
            className={isLogin ? "active" : ""}
            onClick={(event) => handleModeLink(event, "login")}
          >
            Login
          </Link>

          <Link
            to="/signup"
            className={!isLogin ? "active" : ""}
            onClick={(event) => handleModeLink(event, "signup")}
          >
            Signup
          </Link>
        </div>

        <div className="auth-form-content">
        {/* HEADER */}
        <div className="auth-header">
          <h1>astrea</h1>

          <p>Share moments that shine</p>

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

        {/* EMAIL */}
        <Input
          id="auth-email"
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
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
            id="auth-password"
            name="password"
            label="Password"
            type="password"
            togglePassword
            autoComplete={isLogin ? "current-password" : "new-password"}
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
              id="auth-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              togglePassword
              autoComplete="new-password"
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
        {error && <p className="form-error">{error}</p>}

        {/* SUBMIT */}
        <button type="submit" disabled={loading}>
          {loading
            ? isLogin
              ? "Logging in..."
              : "Creating account..."
            : isLogin
              ? "Login"
              : "Sign Up"}
        </button>

        {/* BOTTOM LINK */}
        <div className="form-actions">
          {isLogin ? (
            <p>
              Don't have an account? <Link to="/signup" onClick={(event) => handleModeLink(event, "signup")}>Sign Up</Link>
            </p>
          ) : (
            <p>
              Already have an account? <Link to="/login" onClick={(event) => handleModeLink(event, "login")}>Login</Link>
            </p>
          )}
        </div>
        </div>
      </form>
    </main>
  );
}

export default Form;
