/**
 * User interface representing a user in the system
 */
interface User {
  /** User's name */
  name: string;
  
  /** User's email address */
  email: string;
  
  /** User's age */
  age: number;
  
  /** When the user was created */
  createdAt: Date;
}

/**
 * Create a new user
 * @param name - User's name
 * @param email - User's email
 * @param age - User's age
 * @returns The created user object
 */
declare function createUser(name: string, email: string, age: number): User;

/**
 * Validate user data
 * @param user - User object to validate
 * @returns Whether the user is valid
 */
declare function validateUser(user: User): boolean;

/**
 * Add a user to the database
 * @param user - User to add
 * @returns Whether the user was added successfully
 */
declare function addUser(user: User): boolean;

/**
 * Find a user by email
 * @param email - Email to search for
 * @returns The found user or null
 */
declare function findUserByEmail(email: string): User | null;

declare const userModule: {
  createUser: typeof createUser;
  validateUser: typeof validateUser;
  addUser: typeof addUser;
  findUserByEmail: typeof findUserByEmail;
};

export = userModule;
