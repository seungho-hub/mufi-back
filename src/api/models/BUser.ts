import { sequelize } from "./index"
import { DataTypes, NOW } from "sequelize";
import Store from "./Store"
import Menus from "./Menu"

const BUsers = sequelize.define("bUser", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true,
        },
        allowNull: false
    },
    encrypted_password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    registeredAt: {
        type: DataTypes.DATE,
        defaultValue: NOW
    }
})

BUsers.hasMany(Store, {
    foreignKey: "buser_id",
})

BUsers.hasMany(Menus, {
    foreignKey: "buser_id"
})

export default BUsers
