const fs = require("fs");
const path = require("path");
const { BusStop, BusRoute, RouteStop, sequelize } = require("../models");

// colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
}

// import stops
async function importStops(filename) {
  console.log(`\n${colors.blue}Importing bus stops...${colors.reset}`);

  const filePath = path.join(__dirname, "..", "data", filename);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let created = 0;
  let skipped = 0;

  for (const stop of data) {
    try {
      const existing = await BusStop.findOne({ where: { name: stop.name } });

      if (existing) {
        console.log(`${colors.yellow}Skipped (exists): ${stop.name}${colors.reset}`);
        skipped++;
        continue;
      }

      await BusStop.create({
        name: stop.name,
        description: stop.description,
        coordinates: {
          type: "Point",
          coordinates: [stop.longitude, stop.latitude]
        },
        address: stop.address,
        landmarks: stop.landmarks
      });

      console.log(`${colors.green}Created: ${stop.name}${colors.reset}`);
      created++;
    } catch (error) {
      console.error(`${colors.red}Error creating ${stop.name}: ${error.message}${colors.reset}`);
    }
  }

  console.log(`\n${colors.blue}Created: ${created}, Skipped: ${skipped}${colors.reset}`);
  return { created, skipped };
}

// import routes
async function importRoutes(filename) {
  console.log(`\n${colors.blue}Importing routes...${colors.reset}`);

  const filePath = path.join(__dirname, "..", "data", filename);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let created = 0;
  let skipped = 0;

  for (const route of data) {
    try {
      const exists = await BusRoute.findOne({ where: { code: route.code } });

      if (exists) {
        console.log(`${colors.yellow}Skipped (exists): ${route.code} - ${route.name}${colors.reset}`);
        skipped++;
        continue;
      }

      await BusRoute.create(route);
      console.log(`${colors.green}Created: ${route.code} - ${route.name}${colors.reset}`);
      created++;
    } catch (error) {
      console.log(`\n${colors.red}Error creating ${route.code}: ${error.message}${colors.reset}`);
    }
  }

  console.log(`\n${colors.blue}Created: ${created}, Skipped: ${skipped}${colors.reset}`);
  return { created, skipped };
}

// import stops and routes
async function importRouteStops(filename) {
  console.log(`${colors.blue}Linking routes and stops...${colors.reset}`);

  const filePath = path.join(__dirname, "..", "data", filename);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const rs of data) {
    try {
      const route = await BusRoute.findOne({ where: { code: rs.routeCode } });
      const stop = await BusStop.findOne({ where: { name: rs.stopName } });

      if (!route) {
        console.log(`${colors.red}Route not found ${rs.routeCode}${colors.reset}`);
        errors++;
        continue;
      }

      if (!stop) {
        console.log(`${colors.red}Stop not found ${rs.stopName}${colors.reset}`);
        errors++;
        continue;
      }

      const existing = await RouteStop.findOne({
        where: {
          routeId: route.id,
          stopId: stop.id,
          direction: rs.direction,
          stopOrder: rs.stopOrder
        }
      });

      if (existing) {
        console.log(`${colors.yellow}Skipped (exists): ${rs.routeCode} - ${rs.stopName}${colors.reset}`);
        skipped++;
        continue;
      }

      await RouteStop.create({
        routeId: route.id,
        stopId: stop.id,
        stopOrder: rs.stopOrder,
        direction: rs.direction,
        distanceFromPrevious: rs.distanceFromPrevious,
        averageArrivalTime: rs.averageArrivalTime
      });

      console.log(`${colors.green}Created: ${rs.routeCode} - ${rs.stopName} (${rs.direction} - #${rs.stopOrder})${colors.reset}`)
      created++;
    } catch (error) {
      console.log(`${colors.red}Error linking ${rs.routeCode} - ${rs.stopName}: ${error.message}${colors.reset}`);
      console.log(error);
      errors++;
    }
  }
  console.log(`${colors.blue}\nCreated: ${created}, Skipped: ${skipped}, Errors: ${errors}${colors.reset}`);
  return { created, skipped, errors };
}

async function clearAllData() {
  console.log(`${colors.red}CLEARING ALL DATA...${colors.reset}`);

  await RouteStop.destroy({ where: {} });
  console.log(`${colors.yellow}Cleared route_stops${colors.reset}`);

  await BusRoute.destroy({ where: {} });
  console.log(`${colors.yellow}Cleared routes${colors.reset}`);

  await BusStop.destroy({ where: {} });
  console.log(`${colors.yellow}Cleared stops${colors.reset}`);

  console.log(`${colors.green}All data cleared${colors.reset}`);
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log(`${colors.green}Database connected${colors.reset}`);

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === "clear") {
      await clearAllData();
    } else if (command === "stops") {
      await importStops("stops.json");
    } else if (command === "routes") {
      await importRoutes("routes.json");
    } else if (command === "route-stops") {
      await importRouteStops("route_stops.json");
    } else if (command === "all") {
      await importStops("stops.json");
      await importRoutes("routes.json");
      await importRouteStops("route_stops.json");
    } else {
      console.log(`
${colors.blue}Usage:${colors.reset}
  node scripts/importData.js stops         # Import bus stops only
  node scripts/importData.js routes        # Import routes only
  node scripts/importData.js route-stops   # Link stops to routes
  node scripts/importData.js all           # Import everything
  node scripts/importData.js clear         # Clear all data (DANGEROUS!)

${colors.yellow}Example:${colors.reset}
  node scripts/importData.js all
      `);
      process.exit(0);
    }

    console.log(`\n${colors.green}Import completed!${colors.reset}`);
    process.exit(0);
  } catch (error) {
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    console.log(error);
    process.exit(1);
  }
}

main();
