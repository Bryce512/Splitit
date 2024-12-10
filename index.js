let express = require('express');
let app = express();
let path = require('path');
const PORT = process.env.PORT || 3001
let authorized = false;
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
        // Get houses where the current user is the owner
        const houses = await knex('houses')
          .select('houses.*')
          .where('owner_id', req.user.user_id)  // You'll need to implement user sessions
          .orWhereIn('house_id', function() {
            this.select('house_id')
              .from('user_houses')
              .where('user_id', req.user.user_id);
          });

        console.log('Houses passed to template:', houses);

        res.render('newSplit', { 
          houses: houses || [],
          error: null 
        });
    
    // Insert the new split into the database
    await knex('splits').insert({
      split_name: split_name,
      house_id: house_id,
      total_amount: total_amount,
      due_date: due_date,
      created_at: knex.fn.now(), // Optional: add a timestamp for when the split was created
    });
    // Redirect to the home page after success
    res.redirect('/home');
  } catch (err) {
        console.error('Error fetching houses:', err);
        res.render('newSplit', { 
          houses: [],
          error: 'Failed to load houses' 
        })
      }
  } else {
    res.redirect('/login')
  }
  
});

// Route to handle split creation
app.post('/createSplit', async (req, res) => {
  if (authorized) {
    try {
        const [splitId] = await knex('split').insert({
          creator_id: req.user.user_id,  // You'll need to implement user sessions
          house_id: req.body.house_id,
          creator_pays: true,  // Default value
          calc_method: true,   // Default value
          total_amount: req.body.total_amount,
          date_due: req.body.date_due,
          recurring: false,    // For one-time splits
          frequency: null      // For one-time splits
        }).returning('split_id');

        res.redirect('/dashboard');  // Or wherever you want to redirect after success
      } catch (error) {
        console.error('Error creating split:', error);
        res.redirect('/newSplit?error=Failed to create split');
      }
  } else {
    res.redirect('/login')
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

// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));