const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('dating-site.db');

db.serialize(() => {
  // Create or update the Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      imageUrl TEXT,
      ques1 TEXT NOT NULL,
      ques2 TEXT NOT NULL,
      ques3 TEXT NOT NULL
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
      JOIN user_cuisines uc2 ON uc.cuisine_id = uc2.cuisine_id
      WHERE uc2.user_id = ? AND u.id != ?
  `;
  db.all(query, [userId, userId], (err, rows) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, rows);
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

// Function to Get User by ID
db.getUserById = (userId, callback) => {
  const query = `
    SELECT *
    FROM users
    WHERE id = ?;
  `;
  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Error retrieving user by ID:', err);
    }
    callback(err, row);
  });
};

// Create Restaurants Table
db.run(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine_id INTEGER NOT NULL,
    description TEXT,
    imageUrl TEXT,
    FOREIGN KEY (cuisine_id) REFERENCES cuisines (id)
  );
`);






const cuisines = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'French', 'Thai'];

const restaurantData = {
  Italian: [
    { name: 'Olive Garden', description: 'Classic Italian dishes in a relaxed, family-friendly setting.', imageUrl: '/images/olive.jpeg' },
    { name: 'Carbone', description: 'New York-style Italian with house-made pastas.', imageUrl: '/images/carbone.jpeg' },
    { name: 'Da Vinci', description: 'Authentic Italian pizza and pasta.', imageUrl: '/images/davinci.jpeg' },
    { name: 'The Italian Kitchen', description: 'Handmade pastas, fresh pizzas, and delicious antipasti.', imageUrl: '/images/eatly.jpeg' },
    { name: 'Café Gratitude', description: 'Vegan Italian dishes using fresh, locally sourced ingredients.', imageUrl: '/images/italian.jpeg' },
    { name: 'Eataly', description: 'A large selection of Italian restaurants and markets under one roof.', imageUrl: '/images/romana.jpeg' },
    { name: 'Lupa Osteria Romana', description: 'Traditional Roman dishes and rustic Italian wines.', imageUrl: '/images/lupa.jpeg' }
  ],
  Chinese: [
    { name: 'P.F. Chang\'s', description: 'Asian-inspired dishes served in a contemporary setting.', imageUrl: '/images/PF_Changs.jpeg' },
    { name: 'Din Tai Fung', description: 'Famous for their soup dumplings.', imageUrl: '/images/din.jpeg' },
    { name: 'Xi\'an Famous Foods', description: 'Hand-pulled noodles and delicious street-style Chinese dishes.', imageUrl: '/images/xi.jpeg' },
    { name: 'Hakkasan', description: 'Modern Cantonese dining with an upscale atmosphere.', imageUrl: '/images/hakka.jpeg' },
    { name: 'Nobu', description: 'A mix of Japanese and Chinese cuisines with a global twist.', imageUrl: '/images/nobu.jpeg' },
    { name: 'Mott 32', description: 'Elegant dim sum and authentic Cantonese dishes.', imageUrl: '/images/mot.jpeg' },
    { name: 'The Chinese Restaurant', description: 'Traditional Chinese food with a focus on regional specialties.', imageUrl: '/images/chin.jpeg'}
  ],
  Mexican: [
    { name: 'El Camino', description: 'Tacos, burritos, and more, served in a cozy, rustic setting.', imageUrl: '/images/camino.jpeg' },
    { name: 'Taco Bell', description: 'Fast food Mexican-inspired dishes.', imageUrl: '/images/taco.jpeg' },
    { name: 'La Taqueria', description: 'Famous for its San Francisco-style burritos.', imageUrl: '/images/la.jpeg' },
    { name: 'Mi Cocina', description: 'Traditional Mexican cuisine in a vibrant, modern space.', imageUrl: '/images/toros.jpeg' },
    { name: 'Dos Toros', description: 'Fast casual Mexican with delicious tacos and bowls.', imageUrl: '/images/coci.jpeg' },
    { name: 'La Condesa', description: 'A mix of modern and traditional Mexican dishes with a laid-back ambiance.', imageUrl: '/images/condesa.jpeg' },
    { name: 'Cantina Laredo', description: 'Authentic Mexican food and signature margaritas.', imageUrl: '/images/laredo.jpeg' }
  ],
  Indian: [
    { name: 'Bombay Sapphire', description: 'Traditional Indian curries, tandoori dishes, and an elegant atmosphere.', imageUrl: '/images/bombay.jpeg' },
    { name: 'Taj Mahal', description: 'Authentic Indian food with a rich blend of spices.', imageUrl: '/images/taj.jpeg' },
    { name: 'Indigo', description: 'Innovative Indian cuisine in a stylish and contemporary setting.', imageUrl: '/images/indigo.jpeg' },
    { name: 'Curry House', description: 'A casual restaurant with delicious, flavorful curries from all regions of India.', imageUrl: '/images/curry.jpeg' },
    { name: 'Chutney Mary', description: 'Fine dining Indian cuisine with a mix of street food flavors.', imageUrl: '/images/chutney.jpeg' },
    { name: 'Benares', description: 'Award-winning Indian cuisine with contemporary twists.', imageUrl: '/images/ben.jpeg' },
    { name: 'Dabbawala', description: 'Traditional Indian meals served in a charming, homey setting.', imageUrl: '/images/dabba.jpeg' }
  ],
  Japanese: [
    { name: 'Sushi Samba', description: 'Fusion of Japanese, Brazilian, and Peruvian flavors with an upscale twist.', imageUrl: '/images/sushi.jpeg' },
    { name: 'Ramen-ya', description: 'Authentic Japanese ramen and sushi in a casual setting.', imageUrl: '/images/ramen.jpeg' },
    { name: 'Nobu', description: 'Luxury dining with a mix of Japanese and global flavors.', imageUrl: '/images/nobu.jpeg' },
    { name: 'Ichiryu', description: 'Traditional Japanese cuisine including sushi, sashimi, and donburi bowls.', imageUrl: '/images/ich.jpeg' },
    { name: 'Jinya Ramen Bar', description: 'Classic ramen and Japanese comfort food in a modern setting.', imageUrl: '/images/jin.jpeg' },
    { name: 'Tomo Sushi', description: 'Fresh sushi with a wide selection of rolls and sashimi.', imageUrl: '/images/tomo.jpeg' },
    { name: 'Oro Sushi', description: 'Creative sushi and Asian-inspired dishes with a contemporary touch.', imageUrl: '/images/ora.jpeg' }
  ],
  French: [
    { name: 'Le Bernardin', description: 'A Michelin-starred seafood restaurant with exquisite French cuisine.', imageUrl: '/images/le.jpeg' },
    { name: 'Bouchon', description: 'A rustic French bistro offering classic French dishes.', imageUrl: '/images/bou.jpeg' },
    { name: 'L’Atelier de Joël Robuchon', description: 'Fine dining French cuisine with a modern twist.', imageUrl: '/images/joel.jpeg' },
    { name: 'Le Relais de l’Entrecôte', description: 'French steakhouse known for its simple yet delicious offerings.', imageUrl: '/images/relais.jpeg' },
    { name: 'Café de la Paix', description: 'Iconic Parisian brasserie offering a wide range of traditional French dishes.', imageUrl: '/images/paix.jpeg' },
    { name: 'La Petite Maison', description: 'Charming French restaurant with Mediterranean-inspired dishes.', imageUrl: '/images/maison.jpeg' },
    { name: 'Au Pied de Cochon', description: 'Classic French food with a focus on hearty, comforting dishes.', imageUrl: '/images/pied.jpeg' }
  ],
  Thai: [
    { name: 'Pad Thai', description: 'Traditional Thai noodles and curry dishes in a casual space.', imageUrl: '/images/pad.jpeg' },
    { name: 'Siam Cuisine', description: 'Delicious Thai food with a modern flair and vibrant flavors.', imageUrl: '/images/siam.jpeg' },
    { name: 'Chada Thai', description: 'Award-winning Thai dishes with an emphasis on street food-inspired flavors.', imageUrl: '/images/chada.jpeg' },
    { name: 'Somtum Der', description: 'Specializes in authentic Thai papaya salads and curries.', imageUrl: '/images/der.jpeg' },
    { name: 'Bangkok City', description: 'Taste authentic Thai dishes with an upscale twist.', imageUrl: '/images/city.jpeg' },
    { name: 'Thai Spice', description: 'Known for its aromatic curries and fragrant rice dishes.', imageUrl: '/images/spice.jpeg' },
    { name: 'Pok Pok', description: 'A modern Thai restaurant offering spicy and flavorful dishes.', imageUrl: '/images/pok.jpeg' }
  ]
};


db.serialize(() => {
  cuisines.forEach((cuisine) => {
    db.get(
      `SELECT id FROM cuisines WHERE name = ?`, 
      [cuisine], 
      (err, row) => {
        if (err) {
          console.error(`Error fetching cuisine ${cuisine}:`, err);
          return;
        }

        if (row) {
          // Insert predefined restaurants for each cuisine
          restaurantData[cuisine].forEach((restaurant) => {
            db.run(
              `
              INSERT INTO restaurants (name, cuisine_id, description, imageUrl)
              VALUES (?, ?, ?, ?)
              `,
              [restaurant.name, row.id, restaurant.description, restaurant.imageUrl],
              (err) => {
                if (err) {
                  console.error(`Error inserting restaurant for ${cuisine}:`, err);
                } 
              }
            );
          });
        } else {
          console.warn(`Cuisine not found in the database: ${cuisine}`);
        }
      }
    );
  });
});


// new 
db.updateUser = (userId, updates, callback)  => {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), userId];

  db.run(
    `UPDATE users SET ${fields} WHERE id = ?`,
    values,
    function (err) {
      if (err) return callback(err);
      callback(null, this.changes); // `this.changes` indicates the number of rows updated
    }
  );
}

db.getAllUsers = (callback) => {
  const query = `SELECT id, username, imageUrl, cuisine FROM users`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
};

db.run(`
CREATE TABLE IF NOT EXISTS user_quiz_2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  hobby TEXT,
  dream TEXT,
  pet TEXT,
  adjective_soul TEXT,
  activity TEXT,
  personality_adjective TEXT,
  something_you_love TEXT,
  philosophy TEXT,
  energy TEXT,
  shared_activity TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);


  `);





module.exports = db;