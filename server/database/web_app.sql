-- Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE Movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    release_date DATE,
    tmdb_id INT UNIQUE,  -- Unique ID from TMDB to avoid duplicates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Showtimes table with foreign key to Movies
CREATE TABLE Showtimes (
    showtime_id SERIAL PRIMARY KEY,
    movie_id INT REFERENCES Movies(movie_id) ON DELETE CASCADE,  -- Foreign key to Movies
    theater_location VARCHAR(255),
    showtime TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table with foreign key to Users (owner_id)
CREATE TABLE Groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    owner_id INT REFERENCES Users(user_id) ON DELETE CASCADE,  -- Foreign key to Users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GroupMemberships join table for many-to-many relationship between Users and Groups
CREATE TABLE GroupMemberships (
    group_id INT REFERENCES Groups(group_id) ON DELETE CASCADE,  -- Foreign key to Groups
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,     -- Foreign key to Users
    role VARCHAR(50),  -- E.g., 'member' or 'admin'
    PRIMARY KEY (group_id, user_id)  -- Composite primary key for many-to-many relationship
);

-- Reviews table with foreign keys to Movies and Users
CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    movie_id INT REFERENCES Movies(movie_id) ON DELETE CASCADE,  -- Foreign key to Movies
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,     -- Foreign key to Users
    rating INT CHECK (rating >= 1 AND rating <= 5),              -- Rating between 1 and 5
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favorites table with composite key to handle many-to-many relationship between Users and Movies
CREATE TABLE Favorites (
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,     -- Foreign key to Users
    movie_id INT REFERENCES Movies(movie_id) ON DELETE CASCADE,  -- Foreign key to Movies
    PRIMARY KEY (user_id, movie_id)  -- Composite primary key to avoid duplicate favorite entries
);
