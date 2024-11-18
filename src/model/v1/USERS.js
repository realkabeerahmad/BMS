const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../utils/DATABASE/v2/SEQUELIZE"); // Import the Sequelize instance

class USERS extends Model {}

// Define the User model with fields matching the table structure
USERS.init(
  {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    middle_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
    },
    gender: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      validate: {
        isIn: [["M", "F"]], // Validate gender
      },
    },
    dob: {
      type: DataTypes.DATE,
    },
    country_code: {
      type: DataTypes.STRING(3),
    },
    state_code: {
      type: DataTypes.STRING(3),
    },
    city_name: {
      type: DataTypes.STRING,
    },
    role_id: {
      type: DataTypes.STRING,
    },
    is_allowed: {
      type: DataTypes.CHAR(1),
      defaultValue: "Y",
      validate: {
        isIn: [["Y", "N"]], // Validate is_allowed field
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "USERS",
    tableName: "users",
    timestamps: false, // Assuming the table doesn't have timestamps (createdAt, updatedAt)
  }
);

module.exports = USERS;
