//server.js
const app = require('./config/app');
require("dotenv").config();
const PORT = process.env.PORT;


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/quiz/save`);
});