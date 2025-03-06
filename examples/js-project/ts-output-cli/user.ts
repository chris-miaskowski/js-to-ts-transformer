// User module for managing user data

/**
 * Create a new user
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {number} age - User's age
 * @returns {Object} The created user object
 */
function createUser(name, email, age): any {
  return {
    name,
    email,
    age,
    createdAt: new Date()
  };
}

/**
 * Validate user data
 * @param {Object} user - User object to validate
 * @returns {boolean} Whether the user is valid
 */
function validateUser(user): any {
  if (!user.name || typeof user.name !== 'string') {
    return false;
  }

  if (!user.email || !user.email.includes('@')) {
    return false;
  }

  if (!user.age || typeof user.age !== 'number' || user.age < 0) {
    return false;
  }

  return true;
}

// Create a user database
const userDatabase = [];

/**
 * Add a user to the database
 * @param {Object} user - User to add
 * @returns {boolean} Whether the user was added successfully
 */
function addUser(user): any {
  if (!validateUser(user)) {
    return false;
  }

  userDatabase.push(user);
  return true;
}

/**
 * Find a user by email
 * @param {string} email - Email to search for
 * @returns {Object|null} The found user or null
 */
function findUserByEmail(email): any {
  return userDatabase.find((user) => user.email === email) || null;
}

// Export the user module
module.exports = {
  createUser,
  validateUser,
  addUser,
  findUserByEmail
};