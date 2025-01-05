const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public')); 

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Registration Page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Login Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Home Page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Registration Route
app.post('/register', (req, res) => {
  const { username, password, email, cuisine, imageUrl } = req.body; 
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.serialize(() => {
    db.run(`
      INSERT INTO users (username, password, email, cuisine, imageUrl)
      VALUES (?, ?, ?, ?, ?)
    `, [username, hashedPassword, email, cuisine, imageUrl], function(err) { 
      if (err) {
        return res.status(500).send({ message: 'Error registering user' });
      }

      const userId = this.lastID; 

      db.get(`SELECT id FROM cuisines WHERE name = ?`, [cuisine], (err, row) => {
        if (err) {
          return res.status(500).send({ message: 'Error checking cuisine' });
        }

        if (row) {
          db.run(`INSERT INTO user_cuisines (user_id, cuisine_id) VALUES (?, ?)`, [userId, row.id], (err) => {
            if (err) {
              return res.status(500).send({ message: 'Error linking user to cuisine' });
            }
            res.send({ message: 'User registered successfully' });
          });
        } else {
          db.run(`INSERT INTO cuisines (name) VALUES (?)`, [cuisine], function(err) {
            if (err) {
              return res.status(500).send({ message: 'Error inserting cuisine' });
            }

            const cuisineId = this.lastID; 

            db.run(`INSERT INTO user_cuisines (user_id, cuisine_id) VALUES (?, ?)`, [userId, cuisineId], (err) => {
              if (err) {
                return res.status(500).send({ message: 'Error linking user to cuisine' });
              }
              res.send({ message: 'User registered successfully' });
            });
          });
        }
      });
    });
  });
});


// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.getUserByUsername(username, (err, user) => {
    if (err || !user) {
      res.status(401).send({ message: 'Invalid credentials' });
    } else {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          res.status(500).send({ message: 'Error logging in' });
        } else if (!result) {
          res.status(401).send({ message: 'Invalid credentials' });
        } else {
          req.session.userId = user.id;
          //res.send({ message: 'Login successful' });
          res.json({ message: 'Login successful', userId: user.id });
        }
      });
    }
  });
});

// Middleware
const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).send('You must be logged in to access this page');
  } else {
    next();
  }
};

// Suggested Users Route
app.get('/suggested-users', isLoggedIn, (req, res) => {
  const userId = req.session.userId;
  
  // Fetch the current user's profile data
  db.getUserById(userId, (err, user) => {
    if (err) {
      return res.status(500).send('Error retrieving user');
    }

    // Fetch suggested users based on shared cuisines
    db.suggestUsers(userId, (err, suggestedUsers) => {
      if (err) {
        return res.status(500).send('Error retrieving suggested users');
      }
      
      // Render the suggested users page and pass the current user's data
      res.render('suggested-users', { suggestedUsers, user });
    });
  });
});
// new --->
app.get('/search', (req, res) => {
  const usernameQuery = req.query.username || '';

  db.getAllUsers((err, allUsers) => {
    if (err) {
      return res.status(500).send('Error retrieving users');
    }

    const filteredUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(usernameQuery.toLowerCase())
    );

    res.render('suggested-users', { suggestedUsers: filteredUsers, username: usernameQuery });
  });
});


// Profile Route
app.get('/profile/:id', isLoggedIn, (req, res) => {
  const userId = req.params.id;

  db.getUserById(userId, (err, user) => {
    if (err || !user) {
      return res.status(404).send('User not found');
    }

    // Fetch the quiz data for the user, including new fields
    db.get(
      `SELECT 
        hobby, dream, pet, adjective_soul, activity, personality_adjective, 
        something_you_love, philosophy, energy, shared_activity 
       FROM user_quiz_2 
       WHERE user_id = ?`,
      [userId],
      (err, quizData) => {
        if (err) {
          console.error('Error retrieving quiz data:', err);
          return res.status(500).send({ message: 'Error retrieving quiz data' });
        }

        // Render the profile page and pass user and quiz data
        res.render('profile', { user, quizData });
      }
    );
  });
});

// Route to get restaurants based on cuisine
app.get('/restaurants', isLoggedIn, (req, res) => {
  const userId = req.session.userId;

  // Fetch the user's preferred cuisine
  db.getUserById(userId, (err, user) => {
    if (err || !user) {
      console.error('Error retrieving user:', err);
      return res.status(500).send('Error retrieving user');
    }

    const preferredCuisine = user.cuisine;

    // Fetch the cuisine ID for the user's preferred cuisine
    db.get(
      `SELECT id FROM cuisines WHERE name = ?`,
      [preferredCuisine],
      (err, cuisineRow) => {
        if (err || !cuisineRow) {
          console.error('Error fetching cuisine:', err);
          return res.status(500).send('Error fetching cuisine');
        }

        const cuisineId = cuisineRow.id;

        // Fetch restaurants matching the cuisine ID
        db.all(
          `SELECT * FROM restaurants WHERE cuisine_id = ?`,
          [cuisineId],
          (err, restaurants) => {
            if (err) {
              console.error('Error fetching restaurants:', err);
              return res.status(500).send('Error fetching restaurants');
            }

            // Render the restaurants page with the list of restaurants
            res.render('restaurants', { user, restaurants });
          }
        );
      }
    );
  });
});


app.post('/select-restaurant', (req, res) => {
  const { userId, restaurantName } = req.body;

  // Find restaurant ID by name
  db.get(`SELECT id FROM restaurants WHERE name = ?`, [restaurantName], (err, restaurant) => {
    if (err) {
      console.error('Error finding restaurant:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurantId = restaurant.id;

    // Insert selection into the user_selections table
    db.run(
      `INSERT INTO user_selections (user_id, restaurant_id) VALUES (?, ?)`,
      [userId, restaurantId],
      (err) => {
        if (err) {
          console.error('Error saving selection:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(200).json({ message: 'Selection saved successfully' });
      }
    );
  });
});

// new

app.get('/update-profile', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'update-profile.html'));
});


app.put('/profile', isLoggedIn, (req, res) => {
  const userId = req.session.userId; 
  const updates = req.body; 

  
  delete updates.password; 
  
  // Update user in the database
  db.updateUser(userId, updates, (err, changes) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).send({ message: 'Error updating profile' });
    }

    if (changes === 0) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send({ message: 'Profile updated successfully' });
  });
});

app.put('/profile/password', isLoggedIn, (req, res) => {
  const userId = req.session.userId;
  const { currentPassword, newPassword } = req.body;

  // Fetch the user's current hashed password
  db.getUserById(userId, (err, user) => {
    if (err || !user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Compare current password
    bcrypt.compare(currentPassword, user.password, (err, match) => {
      if (err || !match) {
        return res.status(401).send({ message: 'Invalid current password' });
      }

      // Hash the new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      // Update the password in the database
      db.updateUser(userId, { password: hashedNewPassword }, (err) => {
        if (err) {
          return res.status(500).send({ message: 'Error updating password' });
        }
        res.send({ message: 'Password updated successfully' });
      });
    });
  });
});

// Profile Route
app.get('/myprofile/:id', isLoggedIn, (req, res) => {
  const userId = req.params.id;

  db.getUserById(userId, (err, user) => {
    if (err || !user) {
      return res.status(404).send('User not found');
    }

    // Fetch the quiz data for the user, including new fields
    db.get(
      `SELECT 
        hobby, dream, pet, adjective_soul, activity, personality_adjective, 
        something_you_love, philosophy, energy, shared_activity 
       FROM user_quiz_2 
       WHERE user_id = ?`,
      [userId],
      (err, quizData) => {
        if (err) {
          console.error('Error retrieving quiz data:', err);
          return res.status(500).send({ message: 'Error retrieving quiz data' });
        }

        // Render the profile page and pass user and quiz data
        res.render('myprofile', { user, quizData });
      }
    );
  });
});

// Display the quiz
app.get('/quiz', isLoggedIn, (req, res) => {
  res.render('quiz');
});

// Handle quiz submission
app.post('/quiz', (req, res) => {
  const {
    hobby, dream, pet, adjective_soul, activity, personality_adjective,
    something_you_love, philosophy, energy, shared_activity
  } = req.body;
  const userId = req.session.userId; // Ensure this is set correctly in your session handling

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User not authenticated' });
  }

  // Use db.run() to insert data into the database
  db.run(`
    INSERT INTO user_quiz_2 (
      user_id, hobby, dream, pet, adjective_soul, activity, personality_adjective, 
      something_you_love, philosophy, energy, shared_activity
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, hobby, dream, pet, adjective_soul, activity, personality_adjective,
     something_you_love, philosophy, energy, shared_activity],
    function(err) {
      if (err) {
        console.error('Error saving quiz data:', err);
        return res.status(500).json({ success: false, message: 'Error saving quiz data' });
      }

      // Respond with a success message or redirect
      res.status(200).json({ success: true, userId: userId });
    });
});

// Retrieve user's quiz data
app.get('/user-quiz', isLoggedIn, (req, res) => {
  const userId = req.session.userId;

  db.get(
    `SELECT 
      hobby, dream, pet, adjective_soul, activity, personality_adjective, 
      something_you_love, philosophy, energy, shared_activity 
     FROM user_quiz_2 
     WHERE user_id = ?`,
    [userId],
    (err, quizData) => {
      if (err) {
        console.error('Error retrieving quiz data:', err);
        return res.status(500).send({ message: 'Error retrieving quiz data' });
      }
      res.send(quizData);
    }
  );
});



app.delete('/user_quiz', async (req, res) => {
  try {
    const userId = req.session.userId; // Replace with your authentication logic if needed
    await db.run('DELETE FROM user_quiz_2 WHERE user_id = ?', [userId]);
    res.status(200).json({ message: 'Quiz data deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting quiz data' });
  }
});

app.get('/payment', isLoggedIn, (req, res) => {
  res.render('payment');
});




app.listen(8008, () => {
  console.log('Server is running on http://localhost:8008');
});
