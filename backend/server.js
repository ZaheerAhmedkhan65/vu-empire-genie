<<<<<<< Updated upstream
//server.js
=======
>>>>>>> Stashed changes
const app = require('./config/app');
require("dotenv").config();
const PORT = process.env.PORT;


app.listen(PORT, () => {
<<<<<<< Updated upstream
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/quiz/save`);
=======
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/quiz/save-bulk`);
>>>>>>> Stashed changes
});