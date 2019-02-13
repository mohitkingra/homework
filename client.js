class clientLib {

  constructor(callback = null){
  	this.ws = null;
  	this.isSubscribed = false;
  	this.callback = callback;
  }

  connect() {
    console.log("connecting...");

    this.ws = new WebSocket("wss://localhost:3000");

    let handle = this;

    this.ws.onopen = function() {
      console.log("connected");

      if (handle.isSubscribed) {
        console.log("resubscribing...");
        handle.subscribe();
      }
    };

    this.ws.onerror = function() {
      console.log("error");
      this.reconnect();
    };

    this.ws.onclose = function() {
      console.log("disconnected");
    };

    this.ws.onmessage = function(event) {
      let json = JSON.parse(event.data);

      if(handle.callback)
      	handle.callback(json);
    };
  }

  disconnect() {
    if (this.ws.readyState === WebSocket.OPEN) {
      console.log("disconnecting...");
      this.ws.close();
    }
  }

  reconnect() {
    if (this.ws.readyState === WebSocket.CLOSED) {
      console.log("reconnecting...");

      let handle = this;
      setTimeout(function() {
        handle.connect();
      }, 300);
    }
  }

  publish() {
    let url = "/";
    let data = {
      topic: document.getElementById("topic").value,
      value: document.getElementById("value").value
    };

    fetch(url, {
      method: "POST", // or 'PUT'
      body: JSON.stringify(data), // data can be `string` or {object}!
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(response => console.log("Success:", JSON.stringify(response)))
      .catch(error => console.error("Error:", error));
  }

  subscribe() {
    this.ws.send("subscribe");
    this.isSubscribed = true;
  }

  unsubscribe() {
    this.ws.send("unsubscribe");
    this.isSubscribed = false;

    let divId = document.getElementById("data");
    divId.innerHTML = "";
  }
};
