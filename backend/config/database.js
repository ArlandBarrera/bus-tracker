const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bus_tracker',
  username: process.env.DB_USER || 'busapp',
  password: process.env.DB_PASSWORD || 'busapp123',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
