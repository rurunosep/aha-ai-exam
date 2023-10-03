import express from 'express'
import bcrypt from 'bcrypt'
import passport from 'passport'
import sql from '../db.js'

const router = express.Router()

router.post('/login', (req, res) => {
	passport.authenticate('local', (err: any, user: any) => {
		req.login(user, () => {
			if (!user) return res.status(401).send('Invalid username or password')
			res.send(`Successfully logged in ${user.email}`)
			// TODO redirect to dashboard
		})
	})(req, res)
})

router.get('/logout', (req, res) => {
	const userBeforeLogout = req.user
	req.logout((err) => {
		if (!userBeforeLogout) return res.status(400).send('No user logged in.')
		res.send(`Successfully logged out ${userBeforeLogout.email}`)
		// TODO redirect to landing page
	})
})

router.post('/register', async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) return res.status(400).send('Invalid request.')

	// TODO more validation

	if ((await sql`SELECT email FROM user_account WHERE email=${email}`).count > 0)
		return res.status(400).send('User already exists.')

	const salt = await bcrypt.genSalt()
	const password_hash = await bcrypt.hash(password, salt)

	const inserted = await sql`
    INSERT INTO user_account (email, password_hash)
    VALUES (${email}, ${password_hash})
    RETURNING *
  `
	if (inserted.count < 1) return res.status(500)

	res.send(`Registered ${email}.`)
})

export default router
