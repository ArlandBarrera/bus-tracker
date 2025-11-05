const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ============================================
// BUS STOP MODEL
// ============================================
const BusStop = sequelize.define('BusStop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  landmarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'under_construction'),
    defaultValue: 'active'
  }
}, {
  tableName: 'bus_stops',
  timestamps: true
});

// ============================================
// BUS ROUTE MODEL
// ============================================
const BusRoute = sequelize.define('BusRoute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#3498db'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  operatingHours: {
    type: DataTypes.JSON,
    allowNull: true
  },
  farePrice: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'seasonal'),
    defaultValue: 'active'
  }
}, {
  tableName: 'bus_routes',
  timestamps: true
});

// ============================================
// ROUTE STOP MODEL (Junction Table)
// ============================================
const RouteStop = sequelize.define('RouteStop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BusRoute,
      key: 'id'
    }
  },
  stopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BusStop,
      key: 'id'
    }
  },
  stopOrder: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('outbound', 'inbound'),
    allowNull: false
  },
  averageArrivalTime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  distanceFromPrevious: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  }
}, {
  tableName: 'route_stops',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['route_id', 'direction', 'stop_order']
    }
  ]
});

// ============================================
// BUS MODEL
// ============================================
const Bus = sequelize.define('Bus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BusRoute,
      key: 'id'
    }
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  busType: {
    type: DataTypes.ENUM('standard', 'articulated', 'minibus'),
    defaultValue: 'standard'
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'retired'),
    defaultValue: 'active'
  },
  lastKnownPosition: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'buses',
  timestamps: true
});

// ============================================
// DEFINE ASSOCIATIONS
// ============================================
BusRoute.hasMany(RouteStop, { foreignKey: 'routeId', as: 'routeStops' });
BusStop.hasMany(RouteStop, { foreignKey: 'stopId', as: 'routeStops' });
RouteStop.belongsTo(BusRoute, { foreignKey: 'routeId', as: 'route' });
RouteStop.belongsTo(BusStop, { foreignKey: 'stopId', as: 'stop' });

BusRoute.hasMany(Bus, { foreignKey: 'routeId', as: 'buses' });
Bus.belongsTo(BusRoute, { foreignKey: 'routeId', as: 'route' });

BusRoute.belongsToMany(BusStop, {
  through: RouteStop,
  foreignKey: 'routeId',
  otherKey: 'stopId',
  as: 'stops'
});

BusStop.belongsToMany(BusRoute, {
  through: RouteStop,
  foreignKey: 'stopId',
  otherKey: 'routeId',
  as: 'routes'
});

// ============================================
// EXPORT MODELS
// ============================================
module.exports = {
  BusStop,
  BusRoute,
  RouteStop,
  Bus,
  sequelize
};
