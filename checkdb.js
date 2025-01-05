const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dating-site.db'); // Adjust the path if necessary

db.serialize(() => {
  // Delete all data from the restaurantData table
  db.run(`DELETE FROM restaurants`, (err) => {
    if (err) {
      console.error('Error clearing the restaurantData table:', err.message);
    } else {
      console.log('All records have been deleted from the restaurantData table.');
    }
  });
});

db.close();
