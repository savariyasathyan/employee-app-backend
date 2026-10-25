
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Task 1: Middleware and static frontend
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// Task 2: MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err.message));

// Employee schema and model
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true }
});

const Employee = mongoose.model('Employee', employeeSchema);

// GET: Retrieve all employees
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve employees' });
    }
});

// GET: Retrieve one employee by ID
app.get('/api/employeelist/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid employee ID' });
        }

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve employee' });
    }
});

// POST: Add a new employee
app.post('/api/employeelist', async (req, res) => {
    try {
        const { name, location, position, salary } = req.body;

        if (!name || !location || !position ||
            salary === undefined || salary === null || salary === '') {
            return res.status(400).json({ error: 'All employee fields are required' });
        }

        const employee = new Employee({
            name,
            location,
            position,
            salary
        });

        const savedEmployee = await employee.save();
        res.status(201).json(savedEmployee);
    } catch (err) {
        res.status(400).json({ error: 'Failed to add employee' });
    }
});

// DELETE: Delete one employee by ID
app.delete('/api/employeelist/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid employee ID' });
        }

        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee deleted successfully',
            employee
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

// PUT: Update an employee using its ID in the request body
app.put('/api/employeelist', async (req, res) => {
    try {
        const { _id, id, name, location, position, salary } = req.body;
        const employeeId = _id || id;

        if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
            return res.status(400).json({
                error: 'A valid employee ID is required'
            });
        }

        const updates = {};

        if (name !== undefined) updates.name = name;
        if (location !== undefined) updates.location = location;
        if (position !== undefined) updates.position = position;

        if (salary !== undefined) {
            if (salary === '' || !Number.isFinite(Number(salary))) {
                return res.status(400).json({ error: 'Invalid salary' });
            }
            updates.salary = Number(salary);
        }

        const employee = await Employee.findByIdAndUpdate(
            employeeId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update employee' });
    }
});

// Keep the original frontend connection route
app.get('/{*path}', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'Frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
