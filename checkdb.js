const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dating-site.db');

// Recreate tables with the new structure
db.serialize(() => {
  // Drop existing tables if they exist
  db.run('DROP TABLE IF EXISTS user_cuisines');
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS cuisines');

  // Recreate users table with imageUrl
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      imageUrl TEXT  -- New column for storing image URLs
    )
  `);

  // Recreate cuisines table
  db.run(`
    CREATE TABLE cuisines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Recreate user_cuisines table
  db.run(`
    CREATE TABLE user_cuisines (
      user_id INTEGER NOT NULL,
      cuisine_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cuisine_id) REFERENCES cuisines(id)
    )
  `);

  // Verify the tables were created successfully and show their current data
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log('Users:', rows);
  });

  db.all('SELECT * FROM cuisines', [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log('Cuisines:', rows);
  });

  db.all('SELECT * FROM user_cuisines', [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log('User Cuisines:', rows);
  });
});

db.close();

