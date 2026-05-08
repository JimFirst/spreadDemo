import { Router } from 'express'
import { snapshotController } from '../controllers/snapshot.controller'

const router = Router({ mergeParams: true })

router.get('/', (req, res, next) =>
  snapshotController
    .getChangeSets(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/:changesetId', (req, res, next) =>
  snapshotController
    .getChangeSetById(req, res, next)
    .then(() => next())
    .catch(next)
)

export default router
