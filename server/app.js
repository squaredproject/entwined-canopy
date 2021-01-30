const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const socketAPI = require('./socketAPI');

const indexRouter = require('./routes/index');

// TODO: add a real secret instead of this fake secret
const sessionMiddleware = session({
    secret: 'entwinedisthebest',
    name: 'entwined.sid',
    resave: false,
    saveUninitialized: true
});
// use the same sessions for Socket.io as for Express
socketAPI.io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessionMiddleware);

app.use('/', indexRouter);

module.exports = app;
