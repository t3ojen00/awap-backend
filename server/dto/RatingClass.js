import { User } from './UserClass';
import { Review } from './ReviewClass';
//import movies

const user = new User() //make sure user info gets imported
const review = new Review()
//const movie = new Movie() (uncomment when movie class available)

class Rating {

    constructor(user, movie_id, rating, review = ''){

        this.user = user;
        this.movie_id = movie_id;
        this.rating = rating;
        this.review = review;

    }

}

export { Rating };