const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('dating-site.db');

db.serialize(() => {
  // Create Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      imageUrl TEXT
    );
`);


  // Create Cuisines Table
  db.run(`
    CREATE TABLE IF NOT EXISTS cuisines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  // Create User_Cuisines Table (for many-to-many relationship)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_cuisines (
      user_id INTEGER NOT NULL,
      cuisine_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, cuisine_id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (cuisine_id) REFERENCES cuisines (id)
    );
  `);
});

// Function to Suggest Users Based on Shared Cuisines
db.suggestUsers = (userId, callback) => {
  const query = `
    SELECT u.*
    FROM users u
    JOIN user_cuisines uc ON u.id = uc.user_id
    JOIN cuisines c ON uc.cuisine_id = c.id
    WHERE u.id != ? AND c.id IN (
      SELECT cuisine_id
      FROM user_cuisines
      WHERE user_id = ?
    )
    GROUP BY u.id
    HAVING COUNT(DISTINCT c.id) > 0
    LIMIT 10;
  `;

  db.all(query, [userId, userId], (err, rows) => {
    if (err) {
      console.error('Error suggesting users:', err);
    }
    callback(err, rows);
  });
};

// Function to Get User by Username
db.getUserByUsername = (username, callback) => {
  const query = `
    SELECT *
    FROM users
    WHERE username = ?;
  `;

  db.get(query, [username], (err, row) => {
    if (err) {
      console.error('Error retrieving user:', err);
    }
    callback(err, row);
  });
};

module.exports = db;
