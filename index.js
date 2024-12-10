let express = require('express');
let app = express();
let path = require('path');
const PORT = process.env.PORT || 3000
let authorized = true;
let user;
// grab html form from file 
// allows to pull JSON data from form 
app.use(express.urlencoded( {extended: true} )); 

const knex = require("knex") ({
  client : "pg",
  connection : {
  host : process.env.DB_HOST || "192.168.86.3",
  user : process.env.DB_USER || "admins",
  password : process.env.DB_PASSWORD || "ISAdmins",
  database : process.env.DB_NAME || "postgres",
  port : process.env.RDS_PORT || 5432,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false  // Fixed line
}
})

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// Define route for home page


app.get('/home', async (req, res) => {
  if (authorized && user) {

        let payments = await knex('payment')
                  .select('*')
                  .where('user_id', user.user_id) // Get all the payment for a specific user
          res.render('home', {
            user:user,
            payments:payments
          })
      } else {
        res.redirect('/login')
      } 
});

// Serve the login page (login.ejs)
app.get('/', (req, res) => {
  res.render('welcome', {
    users: []
  });  // Renders 'login.ejs' file
});

// Serve the login page (login.ejs)
app.get('/login', (req, res) => {
  res.render('login', {
    users: []
  });  // Renders 'login.ejs' file
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      // Query the user table to find the record
      user = await knex('users')
          .select('*')
          .where('username', username) // Replace with hashed password comparison in production
          .first(); // Returns the first matching record
          
      if (user && user.password === password) {  // Compare the plain text password
            // Authentication successful
          console.log("Log in Success")
          authorized = true;
          res.redirect("/home");  // Redirect to admin page on success
      } else {
        console.log("Log in failed")
          authorized = false;
          res.render('login', { 
            error: 'Invalid username or password',
            navItems:[],
            layout: false });
      }
  } catch (error) {
      console.error('Database error:', error);
      res.render('login', { 
        error: 'An error occurred. Please try again.',
        layout: false });
  }
});

app.get('/logout', (req, res) => {
    authorized = false;
    return res.redirect('/');  // Changed from '/publicHome' to '/'
});



// Route to display the new house form
app.get('/newHouse', async (req, res) => {
  if (authorized) {
    try {
        const users = await knex('users')
          .select('user_id', 'first_name', 'last_name');
        
        res.render('newHouse', { users: users });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.render('newHouse', { users: [] }); // Provide empty array as fallback
      }
  } else {
    res.redirect('/login')
  }
  
});




// Route to handle the house creation form submission
app.post('/createHouse', async (req, res) => {
  if (authorized) {
    try {
        await knex.transaction(async trx => {
          // Insert into houses table
          const [houseId] = await trx('houses').insert({
            owner_id: req.body.owner_id, // You'll need to pass this from the form
            st_address: req.body.st_address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            house_type: req.body.house_type,
            monthly_total: req.body.monthly_rent
          }).returning('house_id');

          // Insert into user_houses table for each tenant
          const userHousesAssignments = req.body.tenants.map(tenant => ({
            user_id: tenant.userId,
            house_id: houseId
          }));

          await trx('user_houses').insert(userHousesAssignments);

          // Create initial split record
          await trx('split').insert({
            creator_id: req.body.owner_id,  // Same as house owner
            house_id: houseId,
            creator_pays: true,  // Or whatever default you want
            calc_method: true,   // Default calculation method
            total_amount: req.body.monthly_rent,
            date_due: req.body.rent_due_date,
            recurring: true,     // For monthly rent
            frequency: 'monthly' // For rent payments
          });

          // Create payment records for each tenant
          const payments = req.body.tenants.map(tenant => ({
            split_id: splitId,
            user_id: tenant.userId,
            amount_due: (req.body.monthly_rent * (tenant.percentage / 100)),
            pmt_method: 'venmo'  // Default payment method
          }));

          await trx('payment').insert(payments);
        });

        res.redirect('/dashboard');
      } catch (error) {
        console.error('Error creating house:', error);
        res.redirect('/newHouse?error=Failed to create house');
      }
  } else {
    res.redirect('/login')
  }
});
  
app.get('/home', async (req, res) => {
  if (authorized) {
    try {
      const payments = await knex('payment')
        .select(
          'split.split_name',
          'payment.amount_due',
          'payment.status',
          'split.date_due',
        )
        .leftJoin('split', 'split.split_id', '=', 'payment.split_id')
        .where('payment.user_id', user.user_id); // Get payments for the logged-in user

      res.render('home', {
        user,
        payments,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});


// Route to display the new profile form
app.get('/newProfile', (req, res) => {
  res.render('newProfile', { error: null });
});

// Route to handle profile creation
app.post('/createProfile', async (req, res) => {
  try {
    // Check if username already exists
    const existingUser = await knex('users')
      .where('username', req.body.username)
      .first();

    if (existingUser) {
      return res.render('newProfile', { 
        error: 'Username already exists' 
      });
    }

    // Insert new user
    const [userId] = await knex('users')
      .insert({
        username: req.body.username,
        password: req.body.password, // In production, you should hash this
        venmo_id: req.body.venmo_id,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        cellphone: req.body.cellphone,
        email: req.body.email,
        acct_balance: 0 // Default starting balance
      })
      .returning('user_id');

    // If they're creating a profile to join a house, you might want to handle that here
    if (req.query.house_id) {
      await knex('user_houses').insert({
        user_id: userId,
        house_id: req.query.house_id
      });
    }

    // Redirect to login page or dashboard
    res.redirect('/login');
  } catch (error) {
    console.error('Error creating profile:', error);
    res.render('newProfile', { 
      error: 'Failed to create profile. Please try again.' 
    });
  }
});

// Route to display the new split form
app.get('/newSplit', async (req, res) => {
  if (authorized) {
    try {
      // Get houses with their splits
      const houses = await knex('houses')
        .select(
          'houses.*',
          'split.split_id',
          'split.split_name',
          'split.total_amount',
          'split.date_due'
        )
        .where('houses.owner_id', user.user_id)
        .orWhereIn('houses.house_id', function() {
          this.select('house_id')
            .from('user_houses')
            .where('user_id', user.user_id);
        })
        .leftJoin('split', 'houses.house_id', 'split.house_id')
        .orderBy('houses.house_id', 'split.date_due');

      // Group splits by house
      const housesWithSplits = houses.reduce((acc, row) => {
        const house = acc.find(h => h.house_id === row.house_id);
        if (house) {
          if (row.split_id) {
            house.splits = house.splits || [];
            house.splits.push({
              split_id: row.split_id,
              split_name: row.split_name,
              total_amount: row.total_amount,
              date_due: row.date_due
            });
          }
        } else {
          const newHouse = {
            house_id: row.house_id,
            st_address: row.st_address,
            city: row.city,
            state: row.state,
            splits: row.split_id ? [{
              split_id: row.split_id,
              split_name: row.split_name,
              total_amount: row.total_amount,
              date_due: row.date_due
            }] : []
          };
          acc.push(newHouse);
        }
        return acc;
      }, []);

      res.render('newSplit', { 
        houses: housesWithSplits || [],
        error: null 
      });
    } catch (err) {
      console.error('Error fetching houses and splits:', err);
      res.render('newSplit', { 
        houses: [],
        error: 'Failed to load houses and splits' 
      });
    }
  } else {
    res.redirect('/login');
  }
});

// Route to handle split creation
app.post('/createSplit', async (req, res) => {
  if (!authorized) {
    return res.redirect('/login');
  }

  try {
    await knex.transaction(async (trx) => {
      // Create the split
      const [splitResult] = await trx('split').insert({
        creator_id: user.user_id,
        house_id: req.body.house_id,
        split_name: req.body.split_name,
        creator_pays: true,
        calc_method: true,
        total_amount: req.body.total_amount,
        date_due: req.body.date_due,
        recurring: req.body.recurring === 'on',
        frequency: req.body.recurring === 'on' ? req.body.frequency : null
      }).returning('split_id');

      // Extract the actual split_id value
      const splitId = splitResult.split_id;
      console.log('Split created with ID:', splitId);

      // Get all users in the house
      const houseUsers = await trx('user_houses')
        .select('user_id')
        .where('house_id', req.body.house_id);

      console.log('House users found:', houseUsers);

      // Calculate equal share for each user
      const equalShare = parseFloat(req.body.total_amount) / houseUsers.length;

      // Create payment records for each user in the house
      const payments = houseUsers.map(houseUser => ({
        split_id: splitId, // Use the actual integer value
        user_id: houseUser.user_id,
        amount_due: equalShare,
        status: 'pending',
        pmt_method: 'venmo'
      }));

      console.log('Creating payments:', payments);

      // Insert all payment records
      await trx('payment').insert(payments);
    });

    res.redirect('/newSplit');

  } catch (error) {
    console.error('Detailed error creating split:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    res.render('newSplit', { 
      houses: [],
      error: 'Failed to create split: ' + error.message 
    });
  }
});

// About page route
app.get('/about', (req, res) => {
  res.render('about');
});

// Contact page route
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Add this delete route after your other routes
app.delete('/deleteProfile/:userId', async (req, res) => {
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Start a transaction since we'll be deleting from multiple tables
    await knex.transaction(async (trx) => {
      const userId = req.params.userId;

      // First delete from user_houses table (foreign key relationship)
      await trx('user_houses')
        .where('user_id', userId)
        .del();

      // Delete from payment table
      await trx('payment')
        .where('user_id', userId)
        .del();

      // Delete from split table where user is creator
      await trx('split')
        .where('creator_id', userId)
        .del();

      // Finally delete the user
      const deletedCount = await trx('users')
        .where('user_id', userId)
        .del();

      if (deletedCount === 0) {
        throw new Error('User not found');
      }
    });

    // If user deleted themselves, log them out
    if (user.user_id === parseInt(req.params.userId)) {
      authorized = false;
      return res.json({ message: 'Profile deleted successfully', redirect: '/login' });
    }

    res.json({ message: 'Profile deleted successfully' });

  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ 
      error: 'Failed to delete profile',
      details: error.message 
    });
  }
});

// Delete routes for various entities
// Add these after your other routes

// Delete House
app.delete('/deleteHouse/:houseId', async (req, res) => {
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await knex.transaction(async (trx) => {
      const houseId = req.params.houseId;

      // Check if user is house owner
      const house = await trx('houses')
        .where('house_id', houseId)
        .andWhere('owner_id', user.user_id)
        .first();

      if (!house) {
        throw new Error('House not found or you are not the owner');
      }

      // Delete related records in order
      await trx('payment')
        .whereIn('split_id', function() {
          this.select('split_id')
            .from('split')
            .where('house_id', houseId);
        })
        .del();

      await trx('split')
        .where('house_id', houseId)
        .del();

      await trx('user_houses')
        .where('house_id', houseId)
        .del();

      await trx('houses')
        .where('house_id', houseId)
        .del();
    });

    res.json({ message: 'House deleted successfully' });

  } catch (error) {
    console.error('Error deleting house:', error);
    res.status(500).json({ 
      error: 'Failed to delete house',
      details: error.message 
    });
  }
});

// Delete Split
app.delete('/deleteSplit/:splitId', async (req, res) => {
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await knex.transaction(async (trx) => {
      const splitId = req.params.splitId;

      // Check if user is split creator
      const split = await trx('split')
        .where('split_id', splitId)
        .andWhere('creator_id', user.user_id)
        .first();

      if (!split) {
        throw new Error('Split not found or you are not the creator');
      }

      // Delete payments first
      await trx('payment')
        .where('split_id', splitId)
        .del();

      // Delete the split
      await trx('split')
        .where('split_id', splitId)
        .del();
    });

    res.json({ message: 'Split deleted successfully' });

  } catch (error) {
    console.error('Error deleting split:', error);
    res.status(500).json({ 
      error: 'Failed to delete split',
      details: error.message 
    });
  }
});

// Delete Payment
app.delete('/deletePayment/:paymentId', async (req, res) => {
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const paymentId = req.params.paymentId;

    // Check if user owns this payment
    const payment = await knex('payment')
      .where('pmt_id', paymentId)
      .andWhere('user_id', user.user_id)
      .first();

    if (!payment) {
      throw new Error('Payment not found or you are not authorized');
    }

    await knex('payment')
      .where('pmt_id', paymentId)
      .del();

    res.json({ message: 'Payment deleted successfully' });

  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ 
      error: 'Failed to delete payment',
      details: error.message 
    });
  }
});

// Delete User from House
app.delete('/leaveHouse/:houseId', async (req, res) => {
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await knex.transaction(async (trx) => {
      const houseId = req.params.houseId;

      // Check if user is in this house
      const userHouse = await trx('user_houses')
        .where({
          house_id: houseId,
          user_id: user.user_id
        })
        .first();

      if (!userHouse) {
        throw new Error('You are not a member of this house');
      }

      // Delete user's payments for this house's splits
      await trx('payment')
        .where('user_id', user.user_id)
        .whereIn('split_id', function() {
          this.select('split_id')
            .from('split')
            .where('house_id', houseId);
        })
        .del();

      // Remove user from house
      await trx('user_houses')
        .where({
          house_id: houseId,
          user_id: user.user_id
        })
        .del();
    });

    res.json({ message: 'Successfully left the house' });

  } catch (error) {
    console.error('Error leaving house:', error);
    res.status(500).json({ 
      error: 'Failed to leave house',
      details: error.message 
    });
  }
});

// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));