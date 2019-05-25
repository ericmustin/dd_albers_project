const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());

// An api endpoint that returns a short list of items
app.get('/api', (req,res) => {
    var list = ["item1", "item2", "item3"];
    res.json(list);
    console.log('Sent list of items');
});

// Handles any requests that don't match the ones above
app.get('/graph', (req,res) =>{
  console.log('alright')
  console.log('reqquery in grpah', req.query)
  app.use(express.static(path.join(__dirname, 'client/build')));
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

app.get('/', (req,res) => {
  console.log('ok')
  console.log('reqquery', req.query)
  res.redirect(`/graph?details=5`)
})

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ok' + port);