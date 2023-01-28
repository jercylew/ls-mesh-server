const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv/config');

//const mogoServerUrl = 'mongodb+srv://ls-admin:tkt1qazm%2C.%2F@cluster-jercy.hxoov.azure.mongodb.net/ls-test?retryWrites=true&w=majority'
const mogoServerUrl = 'mongodb://127.0.0.1:27017/ls-test?retryWrites=true&w=majority&directConnection=true&serverSelectionTimeoutMS=2000'


const indexRouter = require('./routes/index');
const bebebusAppFrontRouter = require('./routes/bebebus-app-front');
const bebebusCmsCenterRouter = require('./routes/bebebus-cms');
const lsCloudPlatformRouter = require('./routes/ls-cloud-platform');
const jiulongDataPlatformRouter = require('./routes/jiulong-data-platform');
const kaipudunDataPlatformRouter = require('./routes/kaipudun-data-platform');
const lsSchoolSystemRouter = require('./routes/ls-school-system');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json())

app.use('/bebebus-app-front', bebebusAppFrontRouter);
app.use('/bebebus-cms-center', bebebusCmsCenterRouter);
app.use('/ls-cloud-platform', lsCloudPlatformRouter);
app.use('/jiulong-data-platform', jiulongDataPlatformRouter);
app.use('/kaipudun-data-platform', kaipudunDataPlatformRouter);
app.use('/ls-school-system', lsSchoolSystemRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

//Demo user token
app.post('/login', (req, res) => {
  console.log('Got body:', req.body);
  let userCredential = req.body;
  if (userCredential.username === 'admin' && userCredential.password === 'bebebus123') {
    res.send({
      token: 'test123'
    });
  } else {
    res.send({});
  }
});

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
  res.render('error');
});

// Connect to mogodb
mongoose.connect(mogoServerUrl, { useUnifiedTopology: true, useNewUrlParser: true }, (err) => {
  if (err) {
    console.log("Failed to connect to DB " + mogoServerUrl + ": " + err);
  }
  else {
    console.log('Connect to DB succeed!');
  }
});

module.exports = app;
