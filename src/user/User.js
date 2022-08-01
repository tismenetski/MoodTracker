const Sequelize = require('sequelize');
const sequelize = require('../config/database');


const Model = Sequelize.Model;

class User extends Model {}


User.init({
    name : {
        type : Sequelize.STRING,
    },
    email : {
        type : Sequelize.STRING,
    },
    password : {
        type : Sequelize.STRING,
    }
} ,{sequelize, modelName : 'user'} )

module.exports = User;