import { useState } from "react";

import Error from "./error";

export default function Input({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    error,
    togglePassword = false,
    id,
    name,
    autoComplete,
}) {
    const [showPassword, setShowPassword] = useState(false);

    const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);
    const inputType =
        togglePassword && type === "password"
            ? showPassword
                ? "text"
                : "password"
            : type;

    return (
        <div className="input-group">
            <label htmlFor={inputId}>{label}</label>

            <div className="input-wrapper">
                <input
                    id={inputId}
                    name={name || inputId}
                    autoComplete={autoComplete}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />

                {togglePassword && type === "password" && (
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                )}
            </div>

            {error && <Error message={error} />}
        </div>
    );
}