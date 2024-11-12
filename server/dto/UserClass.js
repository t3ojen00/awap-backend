class User {
    #user_id;
    #email;
    #token;
  
    constructor(user_id = undefined, email = undefined, token = undefined) {
      this.#user_id = user_id;
      this.#email = email;
      this.#token = token;
    }
  
    get user_id() {
      return this.#user_id;
    }
  
    get email() {
      return this.#email;
    }
  
    get token() {
      return this.#token;
    }
  }
  
  module.exports = User;