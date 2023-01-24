import { Request, Response } from "express"
import { UploadedFile } from "express-fileupload";
import Menu from "../../models/Menu";
import path from "path"
import mime from "mime-types"
import { v4 } from "uuid"

export async function createMenu(req: Request, res: Response) {
    try {
        const store_id = req.app.locals.storeId

        const { label, price, description } = req.body

        //field가 모두 채워지지 않았으면 reject
        if ((label && price && description) == undefined) {
            return res.status(400).json({
                error: "required field is not provided",
                message: "입력하지 않은 필드가 있습니다."
            })
        }

        //image file이 제출되지 않았으면 reject
        if (!req.files) {
            return res.status(400).json({
                error: "image file is required",
                message: "상품의 이미지가 제출되지 않았습니다."
            })
        }

        if (await Menu.findOne({ where: { label } })) {
            return res.status(409).json({
                error: "conflict label name",
                message: "동일한 이름의 상품이 존재합니다."
            })
        }

        const image: UploadedFile = req.files.image as UploadedFile

        const extension = mime.extension(image.mimetype)
        const filename = image.md5 + "." + extension

        //make serving path
        const servingPath = path.join("/images/menu", filename)

        //make upload path
        const mediaPath = path.join(process.cwd(), "media")

        //generate uuid for id of menu
        const id = v4()

        //upload image
        await image.mv(path.join(mediaPath, servingPath))

        //create menu
        const registeredMenu = await Menu.create({
            id,
            label,
            price,
            image: servingPath,
            store_id,
            description,
            buser_id: req.session.buser.id
        })

        const publicMenuInfo = registeredMenu.toJSON();
        delete publicMenuInfo.createdAt;
        delete publicMenuInfo.updatedAt;
        delete publicMenuInfo.buser_id;


        res.status(201).json({
            data: publicMenuInfo,
            message: "성공적으로 상품이 등록되었습니다."
        })
    } catch (err) {
        res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export async function getMenu(req: Request, res: Response) {
    try {
        const targetStoreId = req.app.locals.storeId
        const targetMenuId = req.params.menuId

        const targetMenu = await Menu.findOne({
            where: {
                id: targetMenuId,
                store_id: targetStoreId,
                buser_id: req.session.buser.id
            },
            attributes: {
                exclude: ["createdAt", "updatedAt", "buser_id"]
            }
        })

        if (!targetMenu) {
            return res.status(404).json({
                error: "Not Found",
                message: "상품을 찾을 수 없습니다."
            })
        }

        return res.status(200).json({
            data: targetMenu,
            message: "OK",
        })
    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}

export async function getMenus(req: Request, res: Response) {
    try {
        const targetStoreId = req.app.locals.storeId

        const menus = await Menu.findAll({
            where: {
                store_id: targetStoreId,
                buser_id: req.session.buser.id
            },
            attributes: {
                exclude: ["createdAt", "updatedAt", "buser_id"]
            }
        },)

        if (!menus.length) {
            return res.status(404).json({
                error: "Not Found",
                message: "상품을 찾을 수 없습니다."
            })
        }

        return res.status(200).json({
            data: menus,
            message: "OK"
        })
    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
}
export async function deleteMenu(req: Request, res: Response) {
    try {
        const targetStoreId = req.app.locals.storeId
        const targetMenuId = req.params.menuId

        const targetMenu = await Menu.findOne({
            where: {
                id: targetMenuId,
                store_id: targetStoreId
            }
        })

        if (!targetMenu) {
            return res.status(404).json({
                error: "Not Found",
                message: "상품을 찾을 수 없습니다."
            })
        }

        await targetMenu.destroy()

        return res.status(204).json({
            message: "상품이 정상적으로 삭제되었습니다."
        })

    } catch (err) {
        return res.status(500).json({
            error: "server error",
            message: "서버에서 문제가 발생했습니다, 잠시후에 시도해주세요."
        })
    }
} 