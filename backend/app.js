require('dotenv').config();

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const cron = require('node-cron');

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const eventManagementRoutes = require('./routes/event-management');
const hallRoutes = require('./routes/hall');
const hostCategoriesRoutes = require('./routes/hostCategory');
const eventRoutes = require('./routes/event');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/report');

const User = require('./models/user');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';

const app = express();

// const store = new MongoDBStore({
//   uri: MONGODB_URI,
//   collection: 'sessions'
// });
// const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/admin', adminRoutes);
app.use('/host', eventManagementRoutes);
app.use('/auth', authRoutes);
app.use('/halls', hallRoutes);
app.use('/host-categories', hostCategoriesRoutes);
app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.use('/profile', profileRoutes);
app.use('/reports', reportRoutes);

// app.use(
//   session({
//     secret: 'my secret ',
//     resave: false,
//     saveUninitialized: false,
//     store: store
//   })
// );
// app.use(csrfProtection);
// app.use(flash());

// app.use((req, res, next) => {
//   res.locals.isAuthenticated = req.session.isLoggedIn;
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

// app.use((req, res, next) => {
//   if (!req.session.user) {
//     return next();
//   }
//   User.findById(req.session.user._id)
//     .then(user => {
//       if(!user){
//         return next();
//       }
//       req.user = user;
//       next();
//     })
//     .catch(err => {
//       next(new Error(err));
//     });
// });

// app.use('/admin', adminRoutes.routes);
// app.use(shopRoutes);
// app.use(authRoutes);

// app.get('/500', errorController.get500);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(8080);

    require('./jobs/freeExpiredHalls');
  })
  .catch((err) => console.log(err));
