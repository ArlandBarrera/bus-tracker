const express = require('express');
const { BusRoute, BusStop, RouteStop, Bus, sequelize } = require('../models');
const Joi = require('joi');

const router = express.Router();

// Validation schema
const createRouteSchema = Joi.object({
  name: Joi.string().required().max(255),
  code: Joi.string().required().max(50),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  description: Joi.string().allow(''),
  operatingHours: Joi.object({
    start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    days: Joi.array().items(Joi.string())
  }),
  farePrice: Joi.number().min(0).max(999.99)
});

// GET all bus routes
router.get('/', async (req, res) => {
  try {
    const routes = await BusRoute.findAll({
      include: [
        {
          model: BusStop,
          as: 'stops',
          attributes: ['id', 'name'],
          through: {
            model: RouteStop,
            attributes: ['stopOrder', 'direction', 'distanceFromPrevious']
          }
        },
        {
          model: Bus,
          as: 'buses',
          attributes: ['id', 'plateNumber', 'status']
        }
      ],
      order: [['name', 'ASC']]
    });

    const formattedRoutes = routes.map(route => ({
      ...route.toJSON(),
      totalStops: route.stops?.length || 0,
      activeBuses: route.buses?.filter(bus => bus.status === 'active').length || 0
    }));

    res.json(formattedRoutes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch bus routes' });
  }
});

// GET single route with details
router.get('/:id', async (req, res) => {
  try {
    const route = await BusRoute.findByPk(req.params.id, {
      include: [{
        model: RouteStop,
        as: 'routeStops',
        include: [{
          model: BusStop,
          as: 'stop',
          attributes: ['id', 'name', 'coordinates', 'address']
        }],
        order: [['direction', 'ASC'], ['stopOrder', 'ASC']]
      }]
    });

    if (!route) {
      return res.status(404).json({ error: 'Bus route not found' });
    }

    const outboundStops = route.routeStops
      ?.filter(rs => rs.direction === 'outbound')
      ?.map(rs => ({
        ...rs.stop.toJSON(),
        stopOrder: rs.stopOrder,
        averageArrivalTime: rs.averageArrivalTime,
        distanceFromPrevious: rs.distanceFromPrevious,
        latitude: rs.stop.coordinates?.coordinates?.[1],
        longitude: rs.stop.coordinates?.coordinates?.[0]
      })) || [];

    const inboundStops = route.routeStops
      ?.filter(rs => rs.direction === 'inbound')
      ?.map(rs => ({
        ...rs.stop.toJSON(),
        stopOrder: rs.stopOrder,
        averageArrivalTime: rs.averageArrivalTime,
        distanceFromPrevious: rs.distanceFromPrevious,
        latitude: rs.stop.coordinates?.coordinates?.[1],
        longitude: rs.stop.coordinates?.coordinates?.[0]
      })) || [];

    res.json({
      ...route.toJSON(),
      outboundStops,
      inboundStops,
      totalDistance: {
        outbound: outboundStops.reduce((sum, stop) => sum + (parseFloat(stop.distanceFromPrevious) || 0), 0),
        inbound: inboundStops.reduce((sum, stop) => sum + (parseFloat(stop.distanceFromPrevious) || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch bus route' });
  }
});

// POST create new route
router.post('/', async (req, res) => {
  try {
    const { error, value } = createRouteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const route = await BusRoute.create(value);
    res.status(201).json(route);
  } catch (error) {
    console.error('Error creating route:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Bus route with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create bus route' });
  }
});

// POST add stop to route
router.post('/:routeId/stops', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { stopId, stopOrder, direction, distanceFromPrevious, averageArrivalTime } = req.body;

    const route = await BusRoute.findByPk(req.params.routeId);
    const stop = await BusStop.findByPk(stopId);

    if (!route || !stop) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Route or stop not found' });
    }

    const routeStop = await RouteStop.create({
      routeId: req.params.routeId,
      stopId,
      stopOrder: stopOrder || 1,
      direction: direction || 'outbound',
      distanceFromPrevious: distanceFromPrevious || 0,
      averageArrivalTime
    }, { transaction });

    await transaction.commit();
    res.status(201).json(routeStop);
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding stop to route:', error);
    res.status(500).json({ error: 'Failed to add stop to route' });
  }
});

module.exports = router;
