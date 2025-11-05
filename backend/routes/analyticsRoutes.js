const express = require('express');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// GET system overview
router.get('/system-overview', async (req, res) => {
  try {
    const [overview] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM bus_stops WHERE status = 'active') as total_stops,
        (SELECT COUNT(*) FROM bus_routes WHERE status = 'active') as total_routes,
        (SELECT COUNT(*) FROM buses WHERE status = 'active') as total_buses,
        (SELECT ROUND(AVG(route_count)::numeric, 2)
        FROM (
          SELECT COUNT(DISTINCT route_id) as route_count
          FROM route_stops
          GROUP BY stop_id
        ) as stop_routes) as avg_routes_per_stop,
        (SELECT ROUND(SUM(distance_from_previous)::numeric, 2)
        FROM route_stops) as total_network_distance
    `, { type: QueryTypes.SELECT });

    res.json(overview);
  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({ error: 'Failed to fetch system overview' });
  }
});

module.exports = router;
