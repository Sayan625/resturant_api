// Import required modules
const router = require('express').Router();
const resturant_model = require('../models/resturant_model.js');
const authentication = require('../middlewere/authentication.js');

// Apply authentication middleware for all routes in this router
// router.use(authentication);

// Route to get outlets within a certain radius from provided latitude and longitude
router.get('/outlet',authentication, async (req, res) => {
    try {
        // Calculate latitude and longitude range based on provided radius
        const lats = find_lat_min_max(req.body.latitude, req.body.Radius);
        const longs = find_long_min_max(req.body.longitude, req.body.latitude, req.body.Radius);
        console.log(lats);
        console.log(longs);

        // Query restaurants within latitude range
        const all_data = await resturant_model.find({
            $and: [
                { "address.coord.0": { $gte: lats[0] } },
                { "address.coord.0": { $lte: lats[1] } },
            ]
        }).lean();
        
        // Query restaurants within longitude range
        const all_data1 = await resturant_model.find({
            $and: [
                { "address.coord.1": { $gte: longs[0] } },
                { "address.coord.1": { $lte: longs[1] } }
            ]
        }).lean();

        // Combine results from both latitude and longitude queries
        const all_data_combined = all_data.concat(all_data1);
        
        // Calculate distance for each restaurant, compute average rating, and filter based on radius
        const data = all_data_combined.map(item => {
            const distance = calculateDistance(req.body.latitude, req.body.longitude, item.address.coord[0], item.address.coord[1]);
            let rating = 0;
            item.grades.forEach(item => rating += item.score)

            return { id: item._id, name: item.name, location: item.address.coord, desc: item.cuisine, avg_rating: rating / item.grades.length, nos_rating: item.grades.length, distance };

        });

        // Sort data by distance and filter by radius
        const data_filtered = data.filter(item => item.distance <= req.body.Radius);
        data_filtered.sort((a, b) => a.distance - b.distance);

        res.json(data_filtered);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

// Route to get outlet details by ID
router.get('/outlet/:id',authentication, async (req, res) => {
    try {
        const all_data = await resturant_model.find({ _id: req.params.id }).lean();
        res.json(all_data);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

// Route to get outlets within a range of radius
router.get('/outlet_by_range',authentication, async (req, res) => {
    try {
        // Calculate latitude and longitude range based on provided maximum radius
        const max_lats = find_lat_min_max(req.body.latitude, req.body.maxRadius);
        const max_longs = find_long_min_max(req.body.longitude, req.body.latitude, req.body.maxRadius);

        // Query restaurants within latitude range
        const all_data_ns_max = await resturant_model.find({
            $and: [
                { "address.coord.0": { $gte: max_lats[0] } },
                { "address.coord.0": { $lte: max_lats[1] } },
            ]
        }).lean();
        
        // Query restaurants within longitude range
        const all_data_ew_max = await resturant_model.find({
            $and: [
                { "address.coord.1": { $gte: max_longs[0] } },
                { "address.coord.1": { $lte: max_longs[1] } }
            ]
        }).lean();

        // Combine results from both latitude and longitude queries
        const all_data_combined = all_data_ns_max.concat(all_data_ew_max);
        
        // Calculate distance for each restaurant, compute average rating, and filter based on radius range
        const data = all_data_combined.map(item => {
            const distance = calculateDistance(req.body.latitude, req.body.longitude, item.address.coord[0], item.address.coord[1]);
            let rating = 0;
            item.grades.forEach(item => rating += item.score)

            return { id: item._id, name: item.name, location: item.address.coord, desc: item.cuisine, avg_rating: rating / item.grades.length, nos_rating: item.grades.length, distance };

        });
        
        // Filter data based on minimum and maximum radius
        const data_filtered = data.filter(item => item.distance > req.body.minRadius && item.distance < req.body.maxRadius);
        data_filtered.sort((a, b) => a.distance - b.distance);

        res.json(data_filtered);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

// Route to create a new outlet
router.post('/create_outlet',authentication, async (req, res) => {
    try {
        console.log(req.body);
        const new_outlet = new resturant_model(req.body);
        await new_outlet.save();
        res.json(new_outlet);
    } catch (error) {
        res.json(error.message);
    }
});

// Route to update an outlet by ID
router.put('/update_outlet/:id',authentication, async (req, res) => {
    const id = req.params.id;
    
    try {
        const outlet = await resturant_model.findById(id);
        const { rating, address, ...update } = req.body;
        
        // Update outlet details
        await outlet.updateOne(update, { new: true });
        
        // If rating provided, update outlet's ratings
        if (rating)
            await outlet.updateOne({ $push: { grades: { date: Date.now(), score: rating } } }, { new: true });
        
        // If address coordinates provided, update outlet's coordinates
        if (address.coords)
            await outlet.updateOne({ $set: { 'address.coord': address.coords } }, { new: true });
        
        res.json("updated");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to delete an outlet by ID
router.delete('/delete_outlet/:id',authentication, async (req, res) => {
    const id = req.params.id;
    try {
        const outlet = await resturant_model.findById(id);
        await outlet.deleteOne();
        res.json("outlet deleted");
    } catch (error) {
        res.send(error.message);
    }
});

// Function to calculate latitude range based on distance
function find_lat_min_max(lat, distance) {
    const lat_min = lat * 1 - (distance / 6378000) * (180 / Math.PI);
    const lat_max = lat * 1 + (distance / 6378000) * (180 / Math.PI);
    return [(lat_min), (lat_max)];
}

// Function to calculate longitude range based on distance
function find_long_min_max(long, lat, distance) {
    const long_min = long * 1 - (distance / 6378000) / Math.cos(lat * (Math.PI / 180));
    const long_max = long * 1 + (distance / 6378000) / Math.cos(lat * (Math.PI / 180));
    return [(long_min), (long_max)];
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
}

module.exports = router;
