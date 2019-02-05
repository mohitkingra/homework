const https = require ('https');
const WebSocket = require('ws');

const fs = require('fs');

const MongoClient = require('mongodb').MongoClient; 
const url = "mongodb://localhost:27017/assignment"; //Mongodb Database Url

let db = null;
let collection = null;

MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
  if(err) throw err;

  db = client.db('assignment');
  collection = db.collection('payload');
});

let subscribers = []; //Subscriber's WS Client Object Array 

const server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
},function(req, res) {

     if(req.method === 'GET') {
      
      if(req.url === '/'){ //load index html
        res.writeHeader(200, {"Content-Type": "text/html"});
        fs.readFile('./index.html', "utf-8", function(error, data){
          if(error){
            res.writeHeader(404);
            res.write('File not found');
          }
          else{
            res.write(data);
          }
          res.end();
        });
      }
      else if(req.url === '/client.js'){ //load client js
        res.writeHeader(200, {"Content-Type": "text/javascript"});
        fs.readFile('./client.js', "utf-8", function(error, data){
          if(error){
            res.writeHeader(404);
            res.write('File not found');
          }
          else{
            res.write(data);
          }
          res.end();
        });
      }
     }
     else if(req.method === 'POST') {//POST API Endpoint 
      let data = []
      req.on('data', chunk => {
        data.push(chunk)
      });

      req.on('end', () => {
        
          let jsonObject =  JSON.parse(data);

          collection.findOneAndUpdate({topic: jsonObject.topic}, {$set: {value: jsonObject.value}}, //Publish JSON Payload
            {upsert: true}, function(err, doc) {
            if(err) throw err;

            console.log("published");
            collection.find().toArray(function(e, d) {
              subscribers.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(d)); //Notify Subscribers of Update
                }
              });
            });
          });
        });
    }
});

const wss = new WebSocket.Server({server});
 
function heartbeat() {
  this.isAlive = true;

  console.log("pong");
}
 
wss.on('connection', function connection(ws, req) { //WSS Endpoint

  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', function incoming(data) {

    if(data === "subscribe") {
      
      subscribers.push(ws);

      collection.find().toArray(function(e, d) {  
          ws.send(JSON.stringify(d)); //Notify on New Subscriber or on ReSubscibe/Reconnect
        });            
    }
    else if(data === "unsubscribe") {
        subscribers.pop(ws);
    }
  }); 
});

function noop() {}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;

    console.log("ping");
    ws.ping(noop);
  });
}, 3000);


server.listen(3000, function(){
  console.log('Listening on https://localhost:3000');
});
