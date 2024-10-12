//app.js

import dotenv from 'dotenv';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { dirname, join } from 'path';
import createError from 'http-errors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import express, { json, urlencoded } from 'express';
import { v4 as uuid4 } from "uuid";

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import setupSocketIO from './socket/socket.js'; 


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

setupSocketIO(server);


const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';

// redisClient.connect();

// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(session({
  secret: '98765rvbd-dj1swy',
  resave: false,
  saveuninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 12 * 60 * 60 * 1000 } // 12 hours
}));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


server.listen((PORT), () => {
  console.log(`Listening live from http://${HOSTNAME}/${PORT}`);
});

export default app;