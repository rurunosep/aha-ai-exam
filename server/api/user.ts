import express from 'express'
import bcrypt from 'bcrypt'
import sql from '../db.js'
import { validatePassword } from '../utils.js'

const router = express.Router()

// POST api/user/change-password
// Change password of session user
// Request Body: {oldPassword, newPassword}
router.post('/change-password', async (req, res) => {
	const { oldPassword, newPassword } = req.body
	if (typeof oldPassword != 'string' || typeof newPassword != 'string')
		return res.status(400).send()

	if (!validatePassword(newPassword)) return res.status(400).send('Invalid new password')

	const user = req.user
	if (!user) return res.status(401).send('No user logged in.')

	if (!user.passwordHash) return res.status(400).send("User account doesn't use password.")

	if (!(await bcrypt.compare(oldPassword, user.passwordHash)))
		return res.status(401).send('Incorrect old password.')

	const salt = await bcrypt.genSalt()
	const passwordHash = await bcrypt.hash(newPassword, salt)

	await sql`
		UPDATE user_account
		SET password_hash=${passwordHash}
		WHERE id=${user.id}
	`

	res.status(200).send(`Changed password for ${user.email}.`)
})

// POST /api/user/change-display-name
// Change display name of session user
// Request Body: {newName}
router.post('/change-display-name', async (req, res) => {
	const { newName } = req.body
	if (typeof newName != 'string' || newName.length > 255) return res.status(400).send()

	const user = req.user
	if (!user) return res.status(401).send('No user logged in.')

	await sql`
		UPDATE user_account
		SET display_name=${newName}
		WHERE id=${user.id}
	`

	res.status(200).send(`Changed display name to ${newName}.`)
})

export default router
