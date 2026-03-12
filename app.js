const express = require('express');
const authRoutes = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || true,
        credentials: true,
    })
);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);

// Modern Express 5 Catch-all route 
app.use((req, res) => {
    // If it's an API route that wasn't found, send 404. Otherwise, serve index.html
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: "API Route not found" });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

module.exports = app;
