import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import passport from 'passport';
import sendgrid from '@sendgrid/mail';
import sql from '../db.js';
import { validatePassword } from '../utils.js';
import { IUser } from '../types.js';

const router = express.Router();

function incrementLoginCount(user: IUser) {
  sql`
  UPDATE user_account
  SET times_logged_in = times_logged_in + 1
  WHERE id=${user.id}
  `.execute();
}

// GET /api/auth/user
// Get the user of the current session
// Response JSON: {id, email, displayName, verified}
// (Empty response body if no user)
router.get('/user', (req, res) => {
  if (!req.user) {
    res.status(200).send();
    return;
  }

  res.status(200).send({
    id: req.user.id,
    email: req.user.email,
    displayName: req.user.displayName,
    verified: req.user.verified,
  });
});

// POST /api/auth/login
// Log in user with email and password
// Request JSON: {email, password}
router.post('/login', (req, res) => {
  passport.authenticate('local', (err: any, user: IUser | false) => {
    if (!user) {
      res.status(401).send('Invalid username or password.');
      return;
    }

    req.logIn(user, () => {
      incrementLoginCount(user);
      res.status(200).send(`Logged in ${user.email}.`);
    });
  })(req, res);
});

// GET /api/auth/google
// Log in with Google OAuth
router.get('/google', passport.authenticate('google'));

// GET /api/auth/google/callback
// The callback URL that Google sends authentication result to
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
  if (req.user) incrementLoginCount(req.user);
  res.redirect('/');
});

// GET /api/auth/logout
// Log out the current session user
router.get('/logout', (req, res) => {
  const { user } = req;
  if (!user) {
    res.status(200).send('No user logged in.');
    return;
  }
  req.logout(() => res.status(200).send(`Logged out ${user.email}`));
});

// POST /api/auth/register
// Register a new user with email and password
// Request Body: {email, password}
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || email.length > 255 || typeof password !== 'string') {
    res.status(400).send();
    return;
  }

  if (!validatePassword(password)) {
    res.status(400).send('Invalid password.');
    return;
  }

  if (
    (
      await sql`
      SELECT 1
      FROM user_account
      WHERE email=${email} AND google_id IS NULL
      `
    ).count > 0
  ) {
    res.status(409).send('User already exists.');
    return;
  }

  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  const inserted = (
    await sql<{ id: number }[]>`
    INSERT INTO user_account (email, password_hash, verified)
    VALUES (${email}, ${passwordHash}, false)
    RETURNING id
    `
  )[0];

  const verificationKey = crypto.randomUUID();

  await sql`
  INSERT INTO user_verification (user_id, verification_key)
  VALUES (${inserted.id}, ${verificationKey})
  `;

  const verificationUrl = `${process.env.SERVER_URL}/api/auth/verify-email?key=${verificationKey}`;

  sendgrid.send({
    to: email,
    from: 'rurunosep@gmail.com',
    subject: 'Aha AI Exam - Email Verification',
    html: `<a href="${verificationUrl}">${verificationUrl}</a>`,
  });

  res.status(201).send(`Registered ${email} and sent verification email.`);
});

// GET /api/auth/verify-email
// Verify the email of an unverified user
// Query Params: key
router.get('/verify-email', async (req, res) => {
  if (typeof req.query.key !== 'string') {
    res.status(400).send();
    return;
  }

  const user = (
    await sql<{ id: number; email: string }[]>`
    SELECT a.id, a.email
    FROM user_verification v
    INNER JOIN user_account a ON a.id = v.user_id 
    WHERE verification_key=${req.query.key}
    `
  )[0];
  if (!user) {
    res.status(400).send();
    return;
  }

  await sql`
  UPDATE user_account
  SET verified=true
  WHERE id=${user.id}
  `;

  await sql`
  DELETE FROM user_verification
  WHERE user_id=${user.id}
  `;

  res.redirect('/');
});

// GET /api/auth/resend-verification-email
// Resend verification email to current unverified session user
router.get('/resend-verification-email', async (req, res) => {
  if (!req.user) {
    res.status(401).send('No user logged in.');
    return;
  }

  const key = (
    await sql`
    SELECT verification_key
    FROM user_verification
    WHERE user_id = ${req.user.id}
    `
  )[0]?.verification_key;

  if (!key) {
    res.status(400).send('User already verified.');
    return;
  }

  const url = `${process.env.SERVER_URL}/api/auth/verify-email?key=${key}`;

  sendgrid.send({
    to: req.user.email,
    from: 'rurunosep@gmail.com',
    subject: 'Aha AI Exam - Email Verification',
    html: `<a href="${url}">${url}</a>`,
  });

  res.status(200).send('Verification email sent.');
});

export default router;
