import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import passport from 'passport'
import sendgrid from '@sendgrid/mail'
import sql from '../db.js'

const router = express.Router()

router.post('/login', (req, res) => {
	passport.authenticate('local', (err: any, user: any) => {
		req.login(user, () => {
			if (!user) return res.status(401).send('Invalid username or password')
			res.send(`Logged in ${user.email}`)
			// TODO redirect to dashboard
		})
	})(req, res)
})

router.get('/logout', (req, res) => {
	const userBeforeLogout = req.user
	req.logout((err) => {
		if (!userBeforeLogout) return res.status(401).send('No user logged in')
		res.send(`Logged out ${userBeforeLogout.email}`)
		// TODO redirect to landing page
	})
})

router.post('/register', async (req, res) => {
	const { email, password } = req.body
	if (!email || !password) return res.status(400).send()
	// TODO more validation

	if ((await sql`SELECT email FROM user_account WHERE email=${email}`).count > 0)
		return res.status(400).send('User already exists')

	const salt = await bcrypt.genSalt()
	const password_hash = await bcrypt.hash(password, salt)

	const inserted = (
		await sql`
    INSERT INTO user_account (email, password_hash, verified)
    VALUES (${email}, ${password_hash}, false)
    RETURNING *
  `
	)[0]
	if (!inserted) return res.status(500).send()

	const verification_key = crypto.randomUUID()

	await sql`
		INSERT INTO user_verification (user_id, verification_key)
		VALUES (${inserted.id}, ${verification_key})
	`

	const verification_url = `${process.env.SERVER_URL}/api/auth/verify?key=${verification_key}`

	sendgrid.send({
		to: email,
		from: 'rurunosep@gmail.com',
		subject: 'Aha AI Exam - Email Verification',
		html: `<a href="${verification_url}">${verification_url}</a>`,
	})

	res.send(`Registered ${email}`)
})

router.get('/verify', async (req, res) => {
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

// TODO move these routes somewhere else?

router.post('/change-password', async (req, res) => {
	const { oldPassword, newPassword } = req.body
	if (!oldPassword || !newPassword) return res.status(400).send()
	// TODO more validation

	const user = req.user
	if (!user) return res.status(401).send('No user logged in')

	const isMatch = await bcrypt.compare(oldPassword, user.password_hash)
	if (!isMatch) return res.status(401).send('Incorrect old password')

	const salt = await bcrypt.genSalt()
	const password_hash = await bcrypt.hash(newPassword, salt)

	await sql`
	UPDATE user_account
	SET password_hash=${password_hash}
	WHERE id=${user.id}
	`

	res.send(`Changed password for ${user.email}`)
})

router.post('/change-name', async (req, res) => {
	const { newName } = req.body
	if (!newName) return res.status(400).send()

	const user = req.user
	if (!user) return res.status(401).send('No user logged in')

	await sql`
	UPDATE user_account
	SET name=${newName}
	`

	res.send(`Changed name to ${newName}`)
})
export default router
