import {Request, Response } from "express"
import Menu from "../../models/Menu"

export async function getMenu(req: Request, res: Response) {
    try {
        const menu = await Menu.findOne({
            where: {
                id: req.params.menuId,
                store_id: req.session.kiosk.store_id,
            },
            attributes: {
                exclude: ["createdAt", "updatedAt", "buser_id"]
            }
        })

        if (!menu) {
            return res.status(404).json({
                error: "Not Found",
                message: "상품을 찾을 수 없습니다."
            })
        }

        return res.status(200).json({
            data: menu,
            message: "OK",
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export async function getMenus(req: Request, res: Response) {
    try {
        const menus = await Menu.findAll({
            where: {
                store_id: req.session.kiosk.store_id
            },
            attributes: {
                exclude: ["createdAt", "updatedAt", "buser_id"]
            }
        })

        return res.status(200).json({
            data: menus,
            message: "OK"
        })
    } catch (err) {
        return res.status(500).json({
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}