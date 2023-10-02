if (process.env.NODE_ENV !== 'production') require('dotenv').config()

import express from 'express'
import path from 'path'

const app = express()
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))

const port = process.env.PORT
app.listen(port, () => console.log(`Server started on port ${port}`))
