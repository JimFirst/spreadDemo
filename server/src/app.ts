import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { authMiddleware, errorMiddleware, mockAuthMiddleware } from './middleware'
import { jsonMiddleware, urlencodedMiddleware } from './middleware/body-parser.middleware'
import { logger, morganMiddleware } from './logger/index'
import userRoutes from './routes/user.routes'
import documentRoutes from './routes/document.routes'
import snapshotRoutes from './routes/snapshot.routes'
import changesetRoutes from './routes/changeset.routes'
import { documentAccessMiddleware } from './middleware/document-access.middleware'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(compression())
app.use(jsonMiddleware)
app.use(urlencodedMiddleware)
app.use(morganMiddleware)

app.use('/api/users', mockAuthMiddleware, userRoutes)
app.use('/api/documents', mockAuthMiddleware, documentRoutes)
app.use('/api/documents/:documentId/snapshots', mockAuthMiddleware, snapshotRoutes)
app.use(
  '/api/documents/:documentId/changesets',
  mockAuthMiddleware,
  documentAccessMiddleware,
  changesetRoutes
)

app.use(errorMiddleware)

export default app
