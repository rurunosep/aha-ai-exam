import express from 'express';
import sql from '../db.js';

const router = express.Router();

// GET /api/data/global-stats
// Get total number of users, number active today, and number active within 7 days
// Response JSON: {totalUsers, usersActiveToday, usersActiveLast7Days}
router.get('/global-stats', async (req, res) => {
  // Confirm login and verification status
  if (!req.user) {
    res.status(401).send();
    return;
  }
  if (!req.user.verified) {
    res.status(403).send();
    return;
  }

  // Return results
  const row = (
    await sql`
    SELECT (
      SELECT COUNT(*)
      FROM user_account
    ) AS "totalUsers",
    (
      SELECT COUNT(*)
      FROM user_account
      WHERE last_active_timestamp > (CURRENT_TIMESTAMP - INTERVAL '1 day')
    ) AS "usersActiveToday",
    (
      SELECT COUNT(*)
      FROM user_account
      WHERE last_active_timestamp > (CURRENT_TIMESTAMP - INTERVAL '7 days')
    ) AS "usersActiveLast7Days";
  `
  )[0];

  res.status(200).send(row);
});

// GET /api/data/user-list
// Get id, email, sign-up timestamp, times logged in, and last-active timestamp
// for a subset of users
// Query Params: page, limit (both required)
// Response JSON: {id, email, registered, timesLoggedIn, lastActive}[]
router.get('/user-list', async (req, res) => {
  // Validate inputs
  if (typeof req.query.page !== 'string' || typeof req.query.limit !== 'string') {
    res.status(400).send();
    return;
  }

  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  if (!(page >= 1) || !(limit >= 1)) {
    res.status(400).send();
    return;
  }

  // Confirm login and verification status
  if (!req.user) {
    res.status(401).send();
    return;
  }
  if (!req.user.verified) {
    res.status(403).send();
    return;
  }

  // Return results
  const rows = await sql`
  SELECT id,
    email,
    register_timestamp AS "registered",
    times_logged_in AS "timesLoggedIn",
    last_active_timestamp AS "lastActive"
  FROM user_account
  ORDER BY id
  LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;

  res.status(200).send(rows);
});

export default router;
