import { Response } from 'express'
import { userService } from '../services/user.service'
import { AuthenticatedRequest } from '../types/index'

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id
    const user = await userService.findById(userId)

    if (!user) {
      return res.status(404).json({
        code: 1004,
        data: null,
        message: '用户不存在',
      })
    }

    res.json({
      code: 0,
      data: user,
      message: '获取用户信息成功',
    })
  }

  async getUserById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const user = await userService.findById(id)

    if (!user) {
      return res.status(404).json({
        code: 1004,
        data: null,
        message: '用户不存在',
      })
    }

    res.json({
      code: 0,
      data: user,
      message: '获取用户信息成功',
    })
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    const users = await userService.findAll()

    res.json({
      code: 0,
      data: users,
      message: '获取用户列表成功',
    })
  }
}

export const userController = new UserController()
