-- Sample users
INSERT INTO Users (email, password_hash)
VALUES 
    ('user1@example.com', 'hashed_password1'),
    ('user2@example.com', 'hashed_password2'),
    ('user3@example.com', 'hashed_password3');

-- Sample movies
INSERT INTO Movies (title, genre, release_date, tmdb_id)
VALUES 
    ('Inception', 'Sci-Fi', '2010-07-16', 12345),
    ('The Matrix', 'Sci-Fi', '1999-03-31', 12346),
    ('The Godfather', 'Crime', '1972-03-24', 12347),
    ('Pulp Fiction', 'Crime', '1994-10-14', 12348);

-- Sample showtimes for movies
INSERT INTO Showtimes (movie_id, theater_location, showtime)
VALUES 
    (1, 'Finnkino Helsinki', '2024-11-10 19:00:00'),
    (2, 'Finnkino Tampere', '2024-11-11 20:00:00'),
    (1, 'Finnkino Oulu', '2024-11-12 18:30:00'),
    (3, 'Finnkino Espoo', '2024-11-13 21:00:00');

-- Sample groups created by users
INSERT INTO Groups (group_name, owner_id)
VALUES 
    ('Sci-Fi Enthusiasts', 1),
    ('Crime Movie Lovers', 2);

-- Sample group memberships (many-to-many relationship between users and groups)
INSERT INTO GroupMemberships (group_id, user_id, role)
VALUES 
    (1, 1, 'owner'),   -- User 1 is the owner of Sci-Fi Enthusiasts
    (1, 2, 'member'),  -- User 2 is a member of Sci-Fi Enthusiasts
    (2, 2, 'owner'),   -- User 2 is the owner of Crime Movie Lovers
    (2, 3, 'member');  -- User 3 is a member of Crime Movie Lovers

-- Sample reviews for movies
INSERT INTO Reviews (movie_id, user_id, rating, review_text)
VALUES 
    (1, 1, 5, 'Amazing movie with a mind-bending plot.'),
    (2, 2, 4, 'A classic that redefined Sci-Fi.'),
    (3, 3, 5, 'Masterpiece in every sense of the word.'),
    (4, 1, 4, 'One of the best dialogues in cinema history.');

-- Sample favorite movies (many-to-many relationship between users and movies)
INSERT INTO Favorites (user_id, movie_id)
VALUES 
    (1, 1),  -- User 1 likes Inception
    (1, 2),  -- User 1 also likes The Matrix
    (2, 3),  -- User 2 likes The Godfather
    (3, 4);  -- User 3 likes Pulp Fiction
