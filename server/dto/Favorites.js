import { User } from "./UserClass";
// import movies

const user = new User() //make sure user info gets imported
//const movie = new Movie() (uncomment when movie class available)

class Favorites{
    constructor(user) {
        this.user = User;
        this.movies = [];
    }

    addMovie(movie) {
        this.movies.push(movie);
    }

    removeMovie(movie) {
        this.movies = this.movies.filter(m => m !== movie);
}
}

export { Favorites };