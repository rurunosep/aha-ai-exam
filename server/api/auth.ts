import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import passport from 'passport'
import sendgrid from '@sendgrid/mail'
import sql from '../db.js'
import { validatePassword } from '../utils.js'
import { IUser } from '../types.js'

const router = express.Router()

// POST /api/auth/login
// TODO failure redirect
router.post('/login', (req, res) => {
	passport.authenticate('local', (err: any, user: IUser | false) => {
		if (!user) return res.status(401).send('Invalid username or password')
		req.login(user, () => {
			console.log(req.user)
			res.send(`Logged in ${user.email}`)
			// TODO redirect to dashboard
		})
	})(req, res)
})

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// GET /api/auth/google/callback
// TODO failure redirect
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
	res.send(`Logged in ${req.user?.displayName} with Google`)
	// TODO redirect to dashboard
})

// GET /api/auth/logout
router.get('/logout', (req, res) => {
	const userBeforeLogout = req.user
	req.logout((err) => {
		if (!userBeforeLogout) return res.status(401).send('No user logged in')
		res.send(`Logged out ${userBeforeLogout.email}`)
		// TODO redirect to landing page
	})
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
	const { email, password } = req.body
	if (!email || !password) return res.status(400).send()

	if (!validatePassword(password)) return res.status(400).send('Invalid password')

	if (
		(
			await sql`
				SELECT 1
				FROM user_account
				WHERE email=${email} AND google_id IS NULL
			`
		).count > 0
	)
		return res.status(400).send('User already exists')

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

	res.send(`Registered ${email}`)
})

// GET /api/auth/verify-email
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

	res.send(`Verified ${user.email}`)
})

export default router
