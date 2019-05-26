require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer')
const dogapi = require("dogapi");
const fs = require('fs');
const axios = require('axios')


const LOGS_LIST_ENDPOINT = "/logs-queries/list"
console.log(process.env.APP_KEY)
//initialize dogapi
let config = { dd_options: { api_key: process.env.API_KEY, app_key: process.env.APP_KEY}};
dogapi.initialize(config.dd_options)

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());

// An api endpoint that returns a short list of items
app.get('/api', async (req,res) => {
  let query_body = {}
  if (req.query.config) {
    let config_data = await axios.get(req.query.config)
    
    if (config_data.data) {
      query_body = config_data.data
    }
  }
  
	dogapi.client.request("POST", "/logs-queries/list", { body: query_body},function(err, results){
	    res.json({logs: results.logs});
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

app.get('/svg_response_api', async (req,res) => {
	const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let hostname = req.headers.host

    await page.setViewport({ width: 1200, height: 800 })
    await page.goto(`http://${hostname}?config=${req.query.config}`, {waitUntil: 'networkidle0'});
    await page.waitFor(3000)
    const svg = await page.$("svg");
    const html = await page.evaluate(svg =>{ svg.setAttribute('xmlns',"http://www.w3.org/2000/svg"); return svg.outerHTML}, svg)
  	await browser.close();

    res.setHeader('Content-Type', 'image/svg+xml');
  	res.send(html)
})

const port = process.env.PORT || 5000;
var listener = app.listen(port);


console.log('App is listening on port ok' + port);