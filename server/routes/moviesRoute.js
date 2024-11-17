const express = require('express');
const axios = require('axios'); // Fetching Finnkino API with axios
const xml2js = require('xml2js'); // Library to parse XML data
const moviesRouter = express.Router();

console.log('movie router running');

// Endpoint to fetch and filter movies by genre
moviesRouter.get('/movies/genre/:genre', async (req, res) => {
    const { genre } = req.params; // Get the genre from the URL

    try {
        // Fetch Finnkino movie data (modify the URL for your region if needed)
        const response = await axios.get('https://www.finnkino.fi/xml/Schedule');

        // Parse the XML response to JSON
        xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Failed to parse XML' });
            }

            // Extract all movies from the parsed JSON
            const movies = result.Schedule.Shows.Show;

            // Filter movies by genre
            const filteredMovies = movies.filter((movie) =>
                movie.Genres.toLowerCase().includes(genre.toLowerCase())
            );

            // Return the filtered movies
            res.json(filteredMovies);
        });
    } catch (error) {
        console.error('Error fetching Finnkino data:', error.message);
        res.status(500).json({ error: 'Failed to fetch movie data' });
    }
});

module.exports = { moviesRouter };
