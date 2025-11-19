import Express from 'express'
import taskRouter from './routes/task.js';
import authRouter from './routes/auth.js'; // Import authentication routes
import connectDB from './DB/connection.js';
import cors from 'cors';
import notFoundHandler from './middlewares/not-found.js';
import errorHandler from './middlewares/errorHandler.js';
import dotenv from 'dotenv'
import { createServer } from 'http';
import { initIO } from './socket.js';

dotenv.config();

const app = Express();

// middleware
app.use(cors()); // to choose which servers or hosts can access this app
app.use(Express.static('./public'));
app.use(Express.json());

connectDB();

// route
const baseRoute = `/api/v1`;
app.use(`${baseRoute}/auth`, authRouter); // Add authentication routes
app.use(`${baseRoute}/tasks`, taskRouter); // This now require authentication

app.use(notFoundHandler)
app.use(errorHandler)

const port = parseInt(process.env.SERVER_PORT);

// create http server & attach socket.io
const httpServer = createServer(app);
initIO(httpServer);

httpServer.listen(port, () => console.log(`server running on port ${port}!`));