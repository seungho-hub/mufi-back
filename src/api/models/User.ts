import { sequelize } from "./index"
import { DataTypes, Model, ValidationError } from 'sequelize';
import Payment from "./Payment"
import UIN from "./Uin"
import Order from "./Order"
import { isStrongPassword } from "../../lib/validator/userValidator"
import bcrypt from "bcrypt"

const User = sequelize.define("User", {
    id: {
        //uuid v4 => 36byte
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
    },
    username: {
        //korean 12lenght username => 36byte
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: false,
        validate: {
            len: {
                args: [1, 30],
                msg: "username은 1글자 이상 30글자 이하여야 합니다."
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
        allowNull: true
    },
    tel: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isNumeric: true,
            len: [8, 8]
        }
    },
    pfp: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "/images/default/pfp.png"
    },
    provider: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            isIn: [["kakao", "local"]]
        }
    },
}, {
    hooks: {
        beforeCreate: async (user: any) => {
            if (user.password)
                user.encrypted_password = await bcrypt.hash(user.password, 10)
        },
        beforeUpdate: async (user: any) => {
            if (user.changed('password')) {
                user.encrypted_password = await bcrypt.hash(user.password, 10)
            }
        }
    }
}
)

User.hasMany(Payment, {
    foreignKey: {
        allowNull: false,
        name: "user_id"
    }
})

User.hasOne(UIN, {
    foreignKey: {
        name: "user_id",
        allowNull: false
    }
})

User.hasMany(Order, {
    foreignKey: {
        name: "user_id",
        allowNull: false
    }
})

export default User
