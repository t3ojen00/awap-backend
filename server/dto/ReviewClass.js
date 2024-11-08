import { User } from './UserClass';
//import movie

const user = new User() //make sure user info gets imported
//const movie = new Movie() (uncomment when movie class available)

class Review {

    constructor (user, movie_id, review_text ){

        this.user = user;
        this.movie_id = movie_id;
        this.review_text = review_text;

    }


    getReviewDetails() {
        return {
            user: this.user.email,
            movie_id: this.movie_id,
            review_text: this.review_text
        };
    }
}


export { Review };