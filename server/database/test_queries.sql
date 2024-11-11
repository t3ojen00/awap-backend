-- Movies with their showtime
SELECT 
    m.title AS movie_title,
    m.genre,
    s.theater_location,
    s.showtime
FROM 
    Movies m
JOIN 
    Showtimes s ON m.movie_id = s.movie_id
ORDER BY 
    m.title, s.showtime;

-- Members of a specific group
SELECT 
    g.group_name,
    u.user_id,
    u.email,
    gm.role
FROM 
    Groups g
JOIN 
    GroupMemberships gm ON g.group_id = gm.group_id
JOIN 
    Users u ON gm.user_id = u.user_id
WHERE 
    g.group_id = 1;  -- Replace with the group_id you want to query

-- All reviews for a specific movie
SELECT 
    m.title AS movie_title,
    r.rating,
    r.review_text,
    u.email AS reviewer_email,
    r.created_at AS review_date
FROM 
    Reviews r
JOIN 
    Movies m ON r.movie_id = m.movie_id
JOIN 
    Users u ON r.user_id = u.user_id
WHERE 
    m.movie_id = 1  -- Replace with the movie_id you want to query
ORDER BY 
    r.created_at DESC;

-- All favourite movies for a specific user
SELECT 
    u.email AS user_email,
    m.title AS favorite_movie_title,
    m.genre,
    m.release_date
FROM 
    Favorites f
JOIN 
    Users u ON f.user_id = u.user_id
JOIN 
    Movies m ON f.movie_id = m.movie_id
WHERE 
    u.user_id = 1;  -- Replace with the user_id you want to query

-- Search movies by multiple criteria
SELECT 
    movie_id,
    title,
    genre,
    release_date
FROM 
    Movies
WHERE 
    genre = 'Sci-Fi' 
    AND release_date >= '2010-07-16' 
    AND title ILIKE '%Inception%'
ORDER BY 
    release_date DESC;

-- Get Showtimes for a specific movie in a specific theater
SELECT 
    m.title AS movie_title,
    s.theater_location,
    s.showtime
FROM 
    Showtimes s
JOIN 
    Movies m ON s.movie_id = m.movie_id
WHERE 
    m.title = 'Inception'  -- Replace with the movie title you want to query
    AND s.theater_location = 'Finnkino Helsinki'  -- Replace with the theater location
ORDER BY 
    s.showtime;

-- Find Groups a User belongs to
SELECT 
    u.email AS user_email,
    g.group_name,
    gm.role
FROM 
    GroupMemberships gm
JOIN 
    Users u ON gm.user_id = u.user_id
JOIN 
    Groups g ON gm.group_id = g.group_id
WHERE 
    u.user_id = 1;  -- Replace with the user_id you want to query

-- List all reviews with Movie Detail
SELECT 
    r.review_id,
    m.title AS movie_title,
    r.rating,
    r.review_text,
    u.email AS reviewer_email,
    r.created_at AS review_date
FROM 
    Reviews r
JOIN 
    Movies m ON r.movie_id = m.movie_id
JOIN 
    Users u ON r.user_id = u.user_id
ORDER BY 
    r.created_at DESC;



