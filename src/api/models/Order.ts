import { sequelize } from "./index"
import { DataTypes, NOW } from "sequelize";
import Store from "./Store"
import Menus from "./Menu"
import Photo from "./Photo"

const Order = sequelize.define("order", {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
    },
    paymentKey: {
        type: DataTypes.STRING(200),
        unique: true,
        allowNull: false,
    },
    orderName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    method: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    suppliedAmount: {
        type: DataTypes.INTEGER,
    },
    vat: {
        type: DataTypes.INTEGER,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    requestedAt: {
        type: DataTypes.DATE,
    },
    approvedAt: {
        type: DataTypes.DATE,
    }
}, {
    createdAt: false,
    updatedAt: false,
})

Order.hasOne(Photo, {
    foreignKey: {
        name: "order_id",
        allowNull: false,
    }
})

export default Order
