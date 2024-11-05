let express = require('express');
let app = express();
let path = require('path');

// grab html form from file 
// allows to pull JSON data from form 
app.use(express.urlencoded( {extended: true} )); 

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.get('path to route', (req,res) => res.sendFile(path.join(__dirname + "/path to html")));
// app.get("/", (req,res) => res.sendFile(path.join(__dirname + "/home.html")));
// Define route for home page
app.get('/', (req, res) => {
  res.render('home'); // Render the home.ejs file
});

// Serve static files (e.g., CSS) if needed
app.use(express.static('public'));

app.post("/storeIt", (req,res) => res.send(req.body));


// port number, (parameters) => what you want it to do.
app.listen(3000, () => console.log('server started'));
