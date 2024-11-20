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
  host : process.env.RDS_HOSTNAME || "localhost",
  user : process.env.RDS_USERNAME || "postgres",
  password : process.env.RDS_PASSWORD || "admin",
  database : process.env.RDS_DB_NAME || "assignment3",
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
  knex('users')
    .select(
      'users.userID',
      'users.userFirstName'
    )
    .then(pokemon => {
      // Render the index.ejs template and pass the data
      res.render('home', { pokemon });
    })
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


// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));
