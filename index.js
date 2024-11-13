let express = require('express');
let app = express();
let path = require('path');

// grab html form from file 
// allows to pull JSON data from form 
app.use(express.urlencoded( {extended: true} )); 

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// Define route for home page
app.get('/', (req, res) => {
  res.render('home'); // Render the home.ejs file
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
app.listen(3000, () => console.log('server started'));
