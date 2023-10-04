import express from 'express'
import bcrypt from 'bcrypt'
import sql from '../db.js'
import { validatePassword } from '../utils.js'

const router = express.Router()

router.post('/change-password', async (req, res) => {
	const { oldPassword, newPassword } = req.body
	if (!oldPassword || !newPassword) return res.status(400).send()

	if (!validatePassword(newPassword)) return res.status(400).send('Invalid new password')

	// TODO more validation?

	const user = req.user
	if (!user) return res.status(401).send('No user logged in')

	if (!user.passwordHash) return res.status(400).send("User account doesn't use password")

	if (!(await bcrypt.compare(oldPassword, user.passwordHash)))
		return res.status(401).send('Incorrect old password')

	const salt = await bcrypt.genSalt()
	const passwordHash = await bcrypt.hash(newPassword, salt)

	await sql`
		UPDATE user_account
		SET password_hash=${passwordHash}
		WHERE id=${user.id}
	`

	res.send(`Changed password for ${user.email}`)
})

router.post('/change-display-name', async (req, res) => {
	const { newName } = req.body
	if (!newName) return res.status(400).send()

	const user = req.user
	if (!user) return res.status(401).send('No user logged in')

	await sql`
		UPDATE user_account
		SET display_name=${newName}
	`

	res.send(`Changed display name to ${newName}`)
})

export default router
