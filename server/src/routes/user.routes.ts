import { Router } from 'express'
import { userController } from '../controllers/user.controller'

const router = Router()

router.get('/', (req, res, next) => userController.getAll(req, res, next).catch(next))
router.get('/me', (req, res, next) => userController.getMe(req, res, next).catch(next))
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next).catch(next))

export default router
