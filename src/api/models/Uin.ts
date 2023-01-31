import { sequelize } from "./index"
import { DataTypes } from "sequelize";

const Uin = sequelize.define("uin", {
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    uin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    updatedAt: false,
})

export default Uin