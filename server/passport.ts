import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import sql from './db.js'
import { IUser } from './types'

passport.use(
	new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
		const user = (
			await sql<IUser[]>`
		SELECT id, email, password_hash, name
		FROM user_account
		WHERE email=${email}
		`
		)[0]
		if (!user) return done(null, false)

		const isMatch = await bcrypt.compare(password, user.password_hash)
		if (!isMatch) return done(null, false)

		return done(null, user)
	})
)

passport.serializeUser((user, done) => {
	done(null, user.id)
})

passport.deserializeUser((id: number, done) => {
	sql<IUser[]>`
	SELECT id, email, password_hash, name
	FROM user_account
	WHERE id=${id}
	`.then((rows) => {
		if (rows.count < 1) {
			return done(null, false)
		} else {
			return done(null, rows[0])
		}
	})
})
