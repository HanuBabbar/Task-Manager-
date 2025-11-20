// controllers/task.js
import task from "../DB/models/task.js"
import { createCustomError } from "../errors/custom-error.js";
import asyncWrapper from "../middlewares/asyncWrapper.js";
import { getIO } from "../socket.js";

export const getAllTasks = asyncWrapper(
    async (req, res) => {
        // Only get tasks for the logged-in user
        const tasks = await task.find({ user: req.user.id });
        res.status(200).json({ tasks });
    }
);

export const getTask = asyncWrapper(
    async (req, res, next) => {
        const { id } = req.params;
        // Only find task if it belongs to the logged-in user
        const singleTask = await task.findOne({ _id: id, user: req.user.id });

        if (singleTask) {
            return res.status(200).json({ singleTask });
        }

        const error = createCustomError('Task Not Found', 404);
        next(error);
    }
);

export const editTask = asyncWrapper(
    async (req, res, next) => {
        const { id } = req.params;
        
        // Find task and verify it belongs to the user
        const targetTask = await task.findOne({ _id: id, user: req.user.id });

        // check if the task not found
        if (!targetTask) {
            const error = createCustomError('Task Not Found', 404);
            return next(error);
        }

        // update the chosen one
        const updatedTask = await task.findOneAndUpdate(
            { _id: id, user: req.user.id }, 
            req.body, 
            {
                new: true,
                runValidators: true
            }
        );

        try {
            const io = getIO();
            io.to(`user:${req.user.id}`).emit('task:updated', updatedTask);
        } catch (err) {
            // socket not initialized or emit failed, ignore
        }

        return res.status(200).json({ message: `task updated successfully!`, updatedTask });
    }
);

export const addTask = asyncWrapper(
    async (req, res, next) => {
        const { name } = req.body;
        
        // Check if this task name already exists FOR THIS USER
        const foundTask = await task.findOne({ name, user: req.user.id });

        // check if this task is already existed
        if (foundTask) {
            const error = createCustomError(`this task name already existed!`, 409);
            return next(error);
        }

        // Create task with user reference
        const newTask = await task.create({
            ...req.body,
            user: req.user.id
        });

        try {
            const io = getIO();
            io.to(`user:${req.user.id}`).emit('task:added', newTask);
        } catch (err) {
            // ignore if socket not ready
        }

        return res.status(201).json({
            message: 'added new task successfully!',
            newTask
        });
    }
);

export const deleteTask = asyncWrapper(
    async (req, res, next) => {
        const { id } = req.params;
        
        // Find task and verify it belongs to the user
        const singleTask = await task.findOne({ _id: id, user: req.user.id });

        // check if the task found to delete
        if (!singleTask) {
            const error = createCustomError('Task Not Found to delete!', 404);
            return next(error);
        }

        // delete the chosen one
        await task.findOneAndDelete({ _id: id, user: req.user.id });

        try {
            const io = getIO();
            io.to(`user:${req.user.id}`).emit('task:deleted', { id });
        } catch (err) {
            // ignore
        }

        return res.status(200).json({ message: 'Task Deleted Successfully!' });
    }
);