require('dotenv/config');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

const productsRouter = require('./routers/products');
const categoriesRouter = require('./routers/categories');
const ordersRouter = require('./routers/orders');
const usersRouter = require('./routers/users');
const authJwt = require('./helpers/jwt');
const { errorHandler } = require('./helpers/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(`${__dirname}/public/uploads`));
app.use(errorHandler);

const api = process.env.API_URL;

// Routers
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);

// Database
mongoose
	.connect(process.env.CONNECTION_STRING, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: process.env.DB_NAME,
	})
	.then(() => console.log('database connection is ready...'))
	.catch((err) => console.log(err));

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
	console.log(`server is running in http://localhost:${PORT}`);
});
