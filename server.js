require("dotenv").config();
const app = require("./app");
const connectdb = require("./db/db");

const PORT = process.env.PORT || 3000;

connectdb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Server startup failed:", error);
        process.exit(1);
    });
