//app.js
import logger from 'morgan';
import { fileURLToPath } from 'url';
// import { createServer } from 'http';
import { dirname, join } from 'path';
import createError from 'http-errors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import express, { json, urlencoded } from 'express';

import config from './config.js';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import setupSocketIO from './socket/socket.js';
import { redisStore, connectToDataBase, connectRedis } from './routes/database.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const expresServer = app.listen((config.server.port), () => {
  console.log(`Listening live from http://${config.server.hostname}:${config.server.port}`);
});


setupSocketIO(expresServer);

async function initializeDatabases() {
  try {
    await connectToDataBase();
    await connectRedis();

  } catch (error) {
    console.error('Failed to connect to databases:', error);
    process.exit(1);
  }
}

initializeDatabases();

// view engine setup
app.set('views', join(__dirname, 'views'));
console.log(join(__dirname, 'views'));

app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(session({
  store: redisStore,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: config.session.cookie
}));

app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404)); 
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', err.message);
  res.render('error');
});


export default app;