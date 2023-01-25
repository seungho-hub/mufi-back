import { sequelize } from "./index"
import { DataTypes } from "sequelize";

const SIN = sequelize.define("SIN", {
    sin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    store_id: {
        type: DataTypes.UUID,
        allowNull: false,
    }
}, {
    updatedAt: false,
})

export default SIN