let client = {
	
	ws : null, 
	
	isSubscribed : false,

	connect : function() {
		console.log("connecting...");

		ws = new WebSocket('wss://localhost:3000');

  		ws.onopen = function() {
  			console.log("connected");

  			if(this.isSubscribed){
				console.log("resubscribing...");
				this.subscribe();
			}
  		};

  		ws.onerror = function(){
  			console.log("error");
 			this.reconnect();
  		};

		ws.onclose  = function() {
		  	console.log("disconnected");
		};

		ws.onmessage = function(event) {
		
			let json = JSON.parse(event.data);
		
			let divId = document.getElementById("data");		
			divId.innerHTML = "";
			
			for(let i=0; i< json.length; i++){
				divId.innerHTML += "<br> Topic:" + json[i].topic + "  Value: " + json[i].value + "</br>";
			}
		};

	},
	
	disconnect : function() {

		if(ws.readyState===WebSocket.OPEN){
			console.log("disconnecting...");
			ws.close();		
		}
	},

	reconnect : function() {

		if(ws.readyState===WebSocket.CLOSED){
			console.log("reconnecting...");

			let handle = this;
			setTimeout(function(){handle.connect();}, 300);
		}
	},

	publish : function() {

		let url = '/';
  		let data = {"topic": document.getElementById("topic").value,
                    "value": document.getElementById("value").value};

		fetch(url, {
  			method: 'POST', // or 'PUT'
  			body: JSON.stringify(data), // data can be `string` or {object}!
  			headers:{
    				'Content-Type': 'application/json'
  			}
		}).then(res => res.json())
		.then(response => console.log('Success:', JSON.stringify(response)))
		.catch(error => console.error('Error:', error));	
		
	},
	
	subscribe : function() {
		ws.send("subscribe");
		isSubscribed = true;
	},

	unsubscribe : function() {
		ws.send("unsubscribe");
		isSubscribed = false;


		let divId = document.getElementById("data");		
		divId.innerHTML = "";
		
	}

 };