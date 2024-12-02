-- Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,   --add username            
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

--  the Groups table-- 
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,             
    owner_id INT NOT NULL,                  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    FOREIGN KEY (owner_id) REFERENCES users(user_id)  -- Foreign key reference to Users
);

SELECT 
    groups.*, 
    users.name AS owner_name 
FROM groups 
JOIN users ON groups.owner_id = users.user_id;


-- Insert sample data into Users table 
INSERT INTO users (name) VALUES 
    ('John Doe'),
    ('Jane Smith');

-- Insert sample data into Groups table 
INSERT INTO groups (group_name, owner_id) VALUES 
    ('Group A', 1),  
    ('Group B', 2);  




/*-- Groups table with foreign key to Users (owner_id)
CREATE TABLE Groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    owner_id INT REFERENCES Users(user_id) ON DELETE CASCADE,  -- Foreign key to Users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);*/

-- GroupMemberships join table for many-to-many relationship between Users and Groups
CREATE TABLE GroupMemberships (
    group_id INT REFERENCES Groups(group_id) ON DELETE CASCADE,  -- Foreign key to Groups
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,     -- Foreign key to Users
    role VARCHAR(50),  -- E.g., 'member' or 'admin'
    PRIMARY KEY (group_id, user_id)  -- Composite primary key for many-to-many relationship
);

-- Reviews table with foreign keys to Movies and Users
CREATE TABLE movie_reviews (
    review_id SERIAL PRIMARY KEY,
    review TEXT NOT NULL,
    movie_id INT NOT NULL,
    user_id INT NOT NULL,
    movie_name VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (movie_id, user_id)
);

CREATE TABLE movie_rating (
    rating_id SERIAL PRIMARY KEY,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    movie_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (movie_id, user_id)
);

-- Favorites table with composite key to handle many-to-many relationship between Users and Movies
CREATE TABLE Favorites (
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,     -- Foreign key to Users
    movie_id INT REFERENCES Movies(movie_id) ON DELETE CASCADE,  -- Foreign key to Movies
    PRIMARY KEY (user_id, movie_id)  -- Composite primary key to avoid duplicate favorite entries
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Adding this temporarily until I fix my code so that it matches Enni's database!
CREATE TABLE Posts (
    post_id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,  -- The main content of the post
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,  -- Foreign key to Users
    group_id INT REFERENCES Groups(group_id) ON DELETE CASCADE,  -- Foreign key to Groups
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp for post creation
);