const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Login endpoint
app.post("/api/auth/login", (req, res) => {
    const { username, email, password } = req.body;

    console.log("Login:", {
        username,
        email,
        password,
    });

    res.json({
        success: true,
        message: "Login successful",
        user: {
            username: username,
            email: email,
        },
    });
});

// Signup endpoint
app.post("/api/auth/signup", (req, res) => {
    const {
        username,
        email,
        password,
    } = req.body;

    console.log("Signup:", {
        username,
        email,
        password,
    });

    res.status(201).json({
        success: true,
        message: "Account created successfully",
        user: {
            username: username,
            email: email,
        },
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});