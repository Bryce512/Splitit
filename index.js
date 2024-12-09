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


// Serve the login page (login.ejs)
app.get('/newHouse', (req, res) => {
  res.render('newHouse');  // Renders 'login.ejs' file
});




// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));
