import './modules/env.js';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import sendgrid from '@sendgrid/mail';
import path from 'path';
import sql from './modules/db.js';
import authRoute from './api/auth.js';
import userRoute from './api/user.js';
import dataRoute from './api/data.js';

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

// Session
app.use(
  session({
    store: new (connectPgSimple(session))({
      conString: process.env.POSTGRES_CONNECTION_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  }),
);

// Passport
import('./modules/passport.js');
app.use(passport.initialize());
app.use(passport.session());

// Update user's last active time on each request
app.use((req, res, next) => {
  if (req.user) {
    sql`
    UPDATE user_account
    SET last_active_timestamp = CURRENT_TIMESTAMP
    WHERE id=${req.user.id}
    `.execute();
  }
  next();
});

// API
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/data', dataRoute);

// Start
const port = process.env.PORT;
app.listen(port, () => console.log(`Server started on port ${port}`));
