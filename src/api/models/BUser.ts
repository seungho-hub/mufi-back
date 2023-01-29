import { sequelize } from "./index"
import { DataTypes, NOW, ValidationError } from "sequelize";
import Store from "./Store"
import Menus from "./Menu"
import { isStrongPassword } from "../../lib/validator/userValidator"
import bcrypt from "bcrypt"
const bUser = sequelize.define("bUser", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: {
                args: [2, 20],
                msg: "username은 2글자 이상 20글자 이하여야합니다."
            }
        }
    },
    password: {
        type: DataTypes.VIRTUAL,
        allowNull: false,
        validate: {
            len: {
                args: [10, 30],
                msg: "비밀번호는 10자 이상 30글자 이하여야 합니다.",
            },
            isStrongPassword(value: string) {
                if (!isStrongPassword(value)) {
                    throw new ValidationError("비밀번호는 대,소문자와 숫자를 적어도 하나씩 포함하며 공백이 있어선 안됩니다.", undefined)
                }
            }
        }
    },
    encrypted_password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tel: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isNumeric: true,
            len: [8, 8]
        }
    },
},
    {
        hooks: {
            beforeCreate: async (buser: any) => {
                if (buser.password)
                    buser.encrypted_password = await bcrypt.hash(buser.password, 10)
            },
            beforeUpdate: async (buser: any) => {
                if (buser.changed('password')) {
                    buser.encrypted_password = await bcrypt.hash(buser.password, 10)
                }
            }
        }
    }
)

bUser.hasMany(Store, {
    foreignKey: "buser_id",
})

bUser.hasMany(Menus, {
    foreignKey: "buser_id"
})

export default bUser
