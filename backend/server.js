const app = require('./src/app');
const cors = require('cors');
require('dotenv').config();
const express = require('express');
const TodoRoutes = require('./src/routes/TodoRoutes');
const connectToDB = require('./src/db/db');
const port = 3000;

app.use(cors());
app.use(express.json());
connectToDB();

app.use('/api/todos', TodoRoutes);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
