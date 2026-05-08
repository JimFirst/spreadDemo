import { Router } from 'express'
import { snapshotController } from '../controllers/snapshot.controller'
import { documentAccessMiddleware } from '../middleware/document-access.middleware'

const router = Router({ mergeParams: true })

router.use(documentAccessMiddleware)

router.post('/', (req, res, next) =>
  snapshotController
    .create(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/', (req, res, next) =>
  snapshotController
    .findAll(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/:snapshotId', (req, res, next) =>
  snapshotController
    .findById(req, res, next)
    .then(() => next())
    .catch(next)
)
router.post('/changesets', (req, res, next) =>
  snapshotController
    .addChangeSet(req, res, next)
    .then(() => next())
    .catch(next)
)

export default router
