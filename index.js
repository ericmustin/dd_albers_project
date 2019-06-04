require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const util = require('util');
const dogapi = require("dogapi");
const axios = require('axios')
const rateLimit = require("express-rate-limit");
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html


const LOGS_LIST_ENDPOINT = "/logs-queries/list"

//initialize dogapi
let config = { dd_options: { api_key: process.env.API_KEY, app_key: process.env.APP_KEY}};
dogapi.initialize(config.dd_options)

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250 // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);

// An api endpoint that returns a short list of items
app.get('/api', async (req,res) => {
  let query_body = {}
  let sorting_key = undefined
  let aggregation = undefined

  // console.log(decodeURI(req.query.query))
  if(req.query.query !== undefined) {
    query_body['query'] = decodeURI(req.query.query)
    query_body['time'] = {from: req.query.start_date, to: 'now'}
    query_body['sort'] = 'desc'
    query_body['limit'] = 1000
    sorting_key = req.query.sorting_key
    aggregation = req.query.aggregation
  } 


  if (req.query.config) {
    let config_data = await axios.get(req.query.config)
    
    if (config_data.data) {
      query_body = config_data.data.request_body
      sorting_key = config_data.data.sorting_key
      aggregation = config_data.data.aggregation
    }
  }
  
	dogapi.client.request("POST", "/logs-queries/list", { body: query_body},function(err, results){
    res.json({logs: results.logs, aggregation: aggregation, sorting_key: sorting_key });
  })
});

// Handles any requests that don't match the ones above
app.get('/graph', (req,res) =>{
  
  app.use(express.static(path.join(__dirname, 'client/build')));
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

app.get('/', (req,res) => {

  res.redirect(`/graph?config=${req.query.config}`)
})


const port = process.env.PORT || 5000;
var listener = app.listen(port);


console.log('App is listening on port ok' + port);