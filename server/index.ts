if (process.env.NODE_ENV !== 'production') require('dotenv').config()

import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import passport from 'passport'
import path from 'path'
import authRoute from './api/auth.js'

const app = express()

// Misc
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))

// Session
const sessionStore = new (connectPgSimple(session))({
	conString: process.env.POSTGRES_CONNECTION_URL,
	createTableIfMissing: true,
	// Keep expired sessions for 8 days (required 7, + 1 more for good measure)
	pruneSessionInterval: 60 * 60 * 24 * 8,
	pruneSessionRandomizedInterval: false,
	// Type definition is missing pruneSessionRandomizedInterval, so we have to assert it
} as connectPgSimple.PGStoreOptions)

app.use(
	session({
		store: sessionStore,
		secret: process.env.SESSION_SECRET!,
		resave: false,
		saveUninitialized: true,
	})
)

// Passport
import('./passport.js')
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/api/auth', authRoute)

// Start
const port = process.env.PORT
app.listen(port, () => console.log(`Server started on port ${port}`))
