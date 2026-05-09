import { Router } from 'express'
import { documentController } from '../controllers/document.controller'
import {
  documentAccessMiddleware,
  documentOwnerMiddleware,
} from '../middleware/document-access.middleware'

const router = Router()

router.post('/', (req, res, next) =>
  documentController
    .create(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/', (req, res, next) =>
  documentController
    .findAll(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/share-link/:token', (req, res, next) =>
  documentController
    .validateShareLink(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/:id', documentAccessMiddleware, (req, res, next) =>
  documentController
    .findById(req, res, next)
    .then(() => next())
    .catch(next)
)
router.put('/:id', documentAccessMiddleware, (req, res, next) =>
  documentController
    .update(req, res, next)
    .then(() => next())
    .catch(next)
)
router.delete('/:id', documentAccessMiddleware, documentOwnerMiddleware, (req, res, next) =>
  documentController
    .delete(req, res, next)
    .then(() => next())
    .catch(next)
)
router.post('/:id/share', documentAccessMiddleware, documentOwnerMiddleware, (req, res, next) =>
  documentController
    .share(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/:id/members', documentAccessMiddleware, (req, res, next) =>
  documentController
    .getMembers(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/:id/my-role', documentAccessMiddleware, (req, res, next) =>
  documentController
    .getMyRole(req, res, next)
    .then(() => next())
    .catch(next)
)
router.delete(
  '/:id/members/:userId',
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) =>
    documentController
      .removeMember(req, res, next)
      .then(() => next())
      .catch(next)
)
router.patch(
  '/:id/members/:userId',
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) =>
    documentController
      .updateMemberRole(req, res, next)
      .then(() => next())
      .catch(next)
)
router.post('/:id/share-link', documentAccessMiddleware, (req, res, next) =>
  documentController
    .createShareLink(req, res, next)
    .then(() => next())
    .catch(next)
)
router.get('/:id/share-links', documentAccessMiddleware, (req, res, next) =>
  documentController
    .getShareLinks(req, res, next)
    .then(() => next())
    .catch(next)
)
router.delete(
  '/:id/share-links/:linkId',
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) =>
    documentController
      .deleteShareLink(req, res, next)
      .then(() => next())
      .catch(next)
)

export default router
