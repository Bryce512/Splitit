let express = require('express');
let app = express();
let path = require('path');
const PORT = process.env.PORT || 3000
// grab html form from file 
// allows to pull JSON data from form 
app.use(express.urlencoded( {extended: true} )); 

const knex = require("knex") ({
  client : "pg",
  connection : {
  host : process.env.DB_HOST || "192.168.86.3",
  user : process.env.DB_USER || "admins",
  password : process.env.DB_PASSWORD || "ISAdmins",
  database : process.env.DB_NAME || "splitit_db",
  port : process.env.RDS_PORT || 5432,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false  // Fixed line
}
})

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// Define route for home page
app.get('/', (req, res) => {
  res.render('home')
  // knex('users')
  //   .select(
  //     'users.userID',
  //     'users.userFirstName'
  //   )
  //   .then(pokemon => {
  //     // Render the index.);
  //   })
});

// Serve the login page (login.ejs)
app.get('/login', (req, res) => {
  res.render('login');  // Renders 'login.ejs' file
});

//Submit Login Request
app.post('/sendLogin', (req,res) => {
  res.redirect('/');
})

// Serve static files (e.g., CSS) if needed
app.use(express.static('public'));

// Route to display the new house form
app.get('/newHouse', (req, res) => {
  // Get list of potential users from your users table
  knex('users')
    .select('user_id', 'first_name', 'last_name')  // Updated column names
    .then(users => {
      res.render('newHouse', { users: users });
    })
    .catch(err => {
      console.error('Error fetching users:', err);
      res.render('newHouse', { users: [], error: 'Failed to load users' });
    });
});

// Route to handle the house creation form submission
app.post('/createHouse', async (req, res) => {
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
});

// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));