import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import bcrypt from 'bcrypt'
import sql from './db.js'
import { IUser } from './types'

passport.use(
	new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
		const user = (
			await sql<IUser[]>`
				SELECT id,
					email,
					password_hash AS "passwordHash",
					display_name AS "displayName"
				FROM user_account
				WHERE email=${email} AND password_hash IS NOT NULL
			`
		)[0]
		if (!user) return done(null, false)

		if (!(await bcrypt.compare(password, user.passwordHash!))) return done(null, false)

		return done(null, user)
	})
)

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL: '/api/auth/google/callback',
		},
		async (accessToken, refreshToken, profile, done) => {
			const user = (
				await sql<IUser[]>`
					SELECT id,
						email,
						google_id AS "googleId",
						display_name AS "displayName"
					FROM user_account
					WHERE google_id=${profile.id}
				`
			)[0]

			// New Google user
			if (!user) {
				// I'm assuming it's impossible for a Google account to have no email
				const email = profile.emails?.[0].value!
				const newUser = (
					await sql<IUser[]>`
						INSERT INTO user_account (email, google_id, display_name)
						VALUES (${email}, ${profile.id}, ${profile.name?.givenName || ''})
						RETURNING id,
							email,
							google_id AS "googleId",
							display_name AS "displayName"
					`
				)[0]
				return done(null, newUser)
			}

			return done(null, user)
		}
	)
)

passport.serializeUser((user, done) => {
	done(null, user.id)
})

passport.deserializeUser((id: number, done) => {
	sql<IUser[]>`
		SELECT id,
			email,
			password_hash AS "passwordHash",
			google_id AS "googleId",
			display_name AS "displayName"
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
