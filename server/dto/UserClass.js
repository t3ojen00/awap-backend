class User {
    #user_id;
    #email;
    #token;

    constructor (user_id = undefined, email = undefined, token = undefined){

        this.#user_id = user_id;
        this.#email = email;
        this.#token = token;

    }

    get user_id(){
        this.user_id
    return}

    get email(){
        this.user_id
    return }

    get token(){
        this.token
    return }  //token is gonna come back later on user authentication :) kinda replaces password so those stay secret / safe

}

export { User };