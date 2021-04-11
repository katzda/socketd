// run in a few browser's consoles

var conn = new WebSocket('ws://chitchat.dev.co.uk:8080');
conn.onopen = function(e) {
    console.log("Connection established!");
};

conn.onmessage = function(e) {
    console.log(e.data);
};

//then send a message: conn.send("Hey!");