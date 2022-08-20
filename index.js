const express=require('express');
const socketIO=require('socket.io');
const http=require('http')
const tcp =require('net')
const port=3000
var app=express();
var app2=express();
let server = http.createServer(app);
let tcp_server = tcp.createServer(onClientConnection);

let sockets = [];

const broadcast = (msg) => {
  //Loop through the active clients object
  sockets.forEach((client) => {
      client.write(msg);
  });
};
// var io=socketIO(server);
 
app.get('/lighton/:imei', (req, res) => {
  res.send('<h1>lights_on</h1>');
  broadcast(`*SCOS,LZ,${req.params.imei},S7,2,3,0,0#\n`);
});

app.get('/lightoff/:imei', (req, res) => {
  res.send('<h1>lights_off</h1>');
  broadcast(`*SCOS,LZ,${req.params.imei},S7,1,3,0,0#\n`);
});

app.get('/unlock/:imei', (req, res) => {
  res.send('<h1>unlocked</h1>');
	broadcast(`*SCOS,LZ,${req.params.imei},R0,0,20,0,${Date.now()}}#\n`);
});

app.get('/lock/:imei', (req, res) => {
  res.send('<h1>locked</h1>');
	broadcast(`*SCOS,LZ,${req.params.imei},R0,1,20,0,1660139841#\n`);
});

function getcommand(raw_data,socket){
  sock = socket;
  data = raw_data.toString().split(",");
  command = data[3];
  imei = data[2];
  
  if (command == "Q0") {
     let serverResp = `*SCOS,LZ,${imei},S7,2,3,0,0#\n`;
     sock.write(serverResp);
      serverResp = `SCOS,LZ,${imei},R0,0,20,0,1660139841#\n`;
      sock.write(serverResp);
  }

  else if (command == "R0") {
     handle_R0(data); 
  }

  else if (command == "L0"){
      console.log("i got L0");
      let serverResp = `*SCOS,LZ,${imei},L0#\n`;
  sock.write(serverResp);
  }

  else if (command == "L1"){
      console.log("i got L1");
      let serverResp = `*SCOS,LZ,${imei},L1#\n`
  sock.write(serverResp);
  }
  else if (command == "W0"){
      console.log("i got W0");
      let serverResp = `*SCOS,LZ,${imei},W0#\n`;
      sock.write(serverResp);
  }

}

function handle_R0(data){
  imei = data[2];
  requested_operation = data[4];
  operation_key = data[5];
  user_id = data[6];
  operation_timestamp=data[7];

  if (requested_operation == "1"){
      let serverResp = `*SCOS,LZ,${imei},L1,${operation_key}#\n`;
      sock.write(serverResp);
      console.log(`locking scooter! with ${serverResp}`);}
  
  else if (requested_operation == "0"){
      let serverResp = `*SCOS,LZ,${imei},L0,${operation_key},0,${operation_timestamp}`;
      sock.write(serverResp);
      console.log(`unlocking scooter! with ${serverResp}`);}
  
  console.log("hey i recieved R0 command !");
}

//the client handling callback
function onClientConnection(sock){
  sockets.push(sock);
  //Log when a client connnects.
  console.log(`${sock.remoteAddress}:${sock.remotePort} Connected`);
  
//Handle the client data.
  sock.on('data',function(data){
      //Log data received from the client
      console.log(`>> data received : ${data} `);
      getcommand(data,sock);
  
  //prepare and send a response to the client 
  // let serverResp = "Hello from the server"
  // sock.write(serverResp);
  
  //close the connection 
  // sock.end()        
});
  
//Handle when client connection is closed
  sock.on('close',function(){
    const index = sockets.indexOf(sock);
    if (index > -1) { // only splice sockets when item is found
      sockets.splice(index, 1); // 2nd parameter means remove one item only
    }
      console.log(`${sock.remoteAddress}:${sock.remotePort} Connection closed`);
  });
  
//Handle Client connection error.
  sock.on('error',function(error){
      console.error(`${sock.remoteAddress}:${sock.remotePort} Connection Error ${error}`);
  });
};

app.listen(3000, () => {
  console.log('listening on *:3000');
});
tcp_server.listen(8080, () => {
  console.log('listening on *:8080');
});



