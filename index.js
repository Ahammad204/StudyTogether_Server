 //Initial index.js setup for server
 const express = require('express');
 const cors = require('cors');
 require ('dotenv').config();
 const app = express();

 //Middleware
 app.use(cors());
 app.use(express.json());

//port
const port = process.env.PORT || 5000;

//For knowing that server is working or not
app.get("/", (req, res) => {

  res.send("Server is Running....")

});

//For knowing which port we are use
app.listen(port, () => {

  console.log(`Server is running on port ${port}`);

})