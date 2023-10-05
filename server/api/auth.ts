import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import passport from 'passport'
import sendgrid from '@sendgrid/mail'
import sql from '../db.js'
import { validatePassword } from '../utils.js'
import { IUser } from '../types.js'

const router = express.Router()

// GET /api/auth/user
// Get the user of the current session
// Response JSON: {id, email, displayName, verified}
// (Empty response body if no user)
router.get('/user', (req, res) => {
	if (!req.user) return res.status(200).send()

	res.status(200).send({
		id: req.user.id,
		email: req.user.email,
		displayName: req.user.displayName,
		verified: req.user.verified,
	})
})

// POST /api/auth/login
// Log in user with email and password
// Request JSON: {email, password}
router.post('/login', (req, res) => {
	passport.authenticate('local', (err: any, user: IUser | null) => {
		if (!user) return res.status(401).send('Invalid username or password.')
		req.logIn(user, () => {
			res.status(200).send(`Logged in ${user.email}.`)
		})
	})(req, res)
})

// GET /api/auth/google
// Log in with Google OAuth
router.get('/google', passport.authenticate('google'))

// GET /api/auth/google/callback
// The callback URL that Google sends authentication result to
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
	// TODO
	res.redirect('http://localhost:5173')
})

// GET /api/auth/logout
// Log out the current session user
router.get('/logout', (req, res) => {
	const user = req.user
	if (!user) return res.status(200).send('No user logged in.')
	req.logout((err) => {
		res.status(200).send(`Logged out ${user.email}`)
	})
})

// POST /api/auth/register
// Register a new user with email and password
// Request Body: {email, password}
router.post('/register', async (req, res) => {
	const { email, password } = req.body
	if (typeof email != 'string' || email.length > 255 || typeof password != 'string')
		return res.status(400).send()

	if (!validatePassword(password)) return res.status(400).send('Invalid password.')

	if (
		(
			await sql`
				SELECT 1
				FROM user_account
				WHERE email=${email} AND google_id IS NULL
			`
		).count > 0
	)
		return res.status(409).send('User already exists.')

	const salt = await bcrypt.genSalt()
	const password_hash = await bcrypt.hash(password, salt)

	const inserted = (
		await sql<{ id: number }[]>`
			INSERT INTO user_account (email, password_hash, verified)
			VALUES (${email}, ${password_hash}, false)
			RETURNING id
  	`
	)[0]

	const verification_key = crypto.randomUUID()

	await sql`
		INSERT INTO user_verification (user_id, verification_key)
		VALUES (${inserted.id}, ${verification_key})
	`

	const verification_url = `${process.env.SERVER_URL}/api/auth/verify-email?key=${verification_key}`

	sendgrid.send({
		to: email,
		from: 'rurunosep@gmail.com',
		subject: 'Aha AI Exam - Email Verification',
		html: `<a href="${verification_url}">${verification_url}</a>`,
	})

	res.status(201).send(`Registered ${email} and sent verification email.`)
})

// GET /api/auth/verify-email
// Verify the email of an unverified user
router.get('/verify-email', async (req, res) => {
	const key = req.query.key?.toString()
	if (!key) return res.status(400).send()

	const user = (
		await sql<{ id: number; email: string }[]>`
			SELECT a.id, a.email
			FROM user_verification v
			INNER JOIN user_account a ON a.id = v.user_id 
			WHERE verification_key=${key}
	`
	)[0]
	if (!user) return res.status(400).send()

	await sql`
		UPDATE user_account
		SET verified=true
		WHERE id=${user.id}
	`

	await sql`
		DELETE FROM user_verification
		WHERE user_id=${user.id}
	`

	res.status(200).send(`Verified ${user.email}.`)
})

export default router
