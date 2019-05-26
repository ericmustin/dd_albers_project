require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer')
const dogapi = require("dogapi");
const fs = require('fs')


const LOGS_LIST_ENDPOINT = "/logs-queries/list"

//initialize dogapi
let config = { dd_options: { api_key: process.env.API_KEY, app_key: process.env.APP_KEY}};
dogapi.initialize(config.dd_options)


console.log(config)
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());

// An api endpoint that returns a short list of items
app.get('/api', async (req,res) => {
	dogapi.client.request("POST", "/logs-queries/list", { body: {"query": "service:nodejs status:info @state_name:* @state_id:* @revenue:*","time": {"from": "1558310400", "to": "now"}, "sort": "desc", "limit": 1000}},function(err, results){
    	console.dir('err',err)
    	console.dir(results);
	    
	    var list = ["item1", "item2", "item3"];
	    res.json(results);
	    console.log('Sent list of items');
    })
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

app.get('/svg_response_api', async (req,res) => {
	console.log('ok going')
	const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 800 })
    await page.goto('http://localhost:5000/', {waitUntil: 'networkidle0'});
    await page.waitFor(3000)
    const svg = await page.$("svg");
    const html = await page.evaluate(svg =>{ svg.setAttribute('xmlns',"http://www.w3.org/2000/svg"); return svg.outerHTML}, svg)
  	await browser.close();
 
  	console.dir('response is ')
  	console.log(html)

    res.setHeader('Content-Type', 'image/svg+xml');
  	res.send(html)
})

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ok' + port);