const express = require('express');
const { BusStop, BusRoute } = require('../models');
const Joi = require('joi');

const router = express.Router();

// Validation schema
const createStopSchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().allow(''),
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  address: Joi.string().allow(''),
  landmarks: Joi.string().allow('')
});

// GET all bus stops
router.get('/', async (req, res) => {
  try {
    const stops = await BusStop.findAll({
      attributes: [
        'id', 'name', 'description', 'address', 'landmarks', 'status',
        ['coordinates', 'coordinates']
      ],
      include: [{
        model: BusRoute,
        as: 'routes',
        attributes: ['id', 'name', 'code', 'color'],
        through: { attributes: [] }
      }]
    });

    const formattedStops = stops.map(stop => ({
      ...stop.toJSON(),
      latitude: stop.coordinates?.coordinates?.[1],
      longitude: stop.coordinates?.coordinates?.[0],
      routeCount: stop.routes?.length || 0
    }));

    res.json(formattedStops);
  } catch (err) {
    console.error('Error fetching stops:', err);
    res.status(500).json({error: 'Failed to fetch bus stops'});
  }
});

// GET single bus stop
router.get('/:id', async (req, res) => {
  try {
    const stop = await BusStop.findByPk(req.params.id, {
      include: [{
        model: BusStop,
        as: 'routeStops',
        include: [{
          model: BusRoute,
          as: 'route',
          attributes: ['id', 'name', 'code', 'color', 'description']
        }]
      }]
    });

    if (!stop) {
      return res.status(404).json({error: 'Bus stop not found'});
    }

    const formattedStop = {
      ...stop.toJSON(),
      latitude: stop.coordinates?.coordinates?.[1],
      longitude: stop.coordinates?.coordinates?.[0],
      routes: stop.routeStops?.map(rs => ({
        ...rs.route.toJSON(),
        stopOrder: rs.stopOrder,
        direction: rs.direction,
        averageArrivalTime: rs.averageArrivalTime,
        distanceFromPrevious: rs.distanceFromPrevious
      }))
    };

    res.json(formattedStop);
  } catch (err) {
    console.error('Error fetching stop:', err);
    res.status(500).json({ error: 'Failed to fetch bus stop' });
  }
});

// POST create new bus stop
router.post('/', async (req, res) => {
  try {
    const { error, value } = createStopSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, latitude, longitude, address, landmarks } = value;

    const stop = await BusStop.create({
      name,
      description,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      address,
      landmarks
    });

    res.status(201).json({
      ...stop.toJSON(),
      latitude,
      longitude
    });
  } catch (error) {
    console.error('Error creating stop:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Bus stop with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create bus stop' });
  }
});

module.exports = router;
