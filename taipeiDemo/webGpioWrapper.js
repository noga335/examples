/*
  WebGPIO API Simulator
  https://rawgit.com/browserobo/WebGPIO/master/index.html
*/

'use strict';

function requestGPIOAccess() {
  return new Promise(function(resolve, reject) {
    var ws = new WebSocket(host);
    ws.onopen = function(evt) {
      console.log('requestGPIOAccess CONNECTED');
      ws.close();

      var gpioAccess = new Object();
      gpioAccess.ports = new Object();
      gpioAccess.ports.get = getPort;
      resolve(gpioAccess);
    };

    ws.onerror = function(evt) {
      var str = '';
      for (var i in evt) {
        str += i + '=' + evt[i] + '<br/>';
      }
      reject(str);
    };
  });
};

function getPort(portno) {
  return new Promise(function(resolve, reject) {
    var ws = new WebSocket(host);
    ws.onopen = function(evt) {
      console.log('getPort CONNECTED');
      ws.send(JSON.stringify({
       'command': 'GET',
       'portno': portno
      }));
    };
    ws.onmessage = function(evt) {
      console.log(evt.data);
      var message = JSON.parse(evt.data);
      if (message.succeeded) {
        var portObj = new Object();
        portObj.portno = portno;
        portObj.export = exportPort;
        portObj.onchange = null;
        
        portObj.read = function() {
          return new Promise(function(resolve, reject) {
            readValue(portObj.portno).then(
              function(value) { resolve(value); },
              function() { reject(); }
            );
          });
        };
        portObj.write = function(value) {
          return new Promise(function(resolve, reject) {
            writeValue(portObj.portno, value).then(
              function() { resolve(); },
              function() { reject(); }
            );
          });
        };
        resolve(portObj);
      } else
        reject('NG');
      ws.close();
    };
    ws.onerror = function(evt) {
      var str = '';
      for (var i in evt) {
        str += i + '=' + evt[i] + '<br/>';
      }
      reject(str);
    };
  });
};

function exportPort(dest) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var ws = new WebSocket(host);
    ws.onopen = function(evt) {
      console.log('exportPort CONNECTED');
      var portno = self.portno;
      ws.send(JSON.stringify({
       'command': 'EXPORT',
       'dest': dest,
       'portno': portno
      }));
    };
    ws.onmessage = function(evt) {
      var message = JSON.parse(evt.data);
      if (message.succeeded) {
        if(dest == "in"){
          _Timer[self.portno] = setInterval(_checkValue,_Interval,self);
        }else{
          console.log("out");
          if(_Timer[self.portno]){
            clearInterval(_Timer[self.portno]);            
          }
          console.log("time");
        }
        resolve();
      } else
        reject(message);
      ws.close();
    };
    ws.onerror = function(evt) {
      var str = '';
      for (var i in evt) {
        str += i + '=' + evt[i] + '<br/>';
      }
      reject(str);
    };
  });
};

function readValue(portno) {
  return new Promise(function(resolve, reject) {
    var ws = new WebSocket(host);
    ws.onopen = function(evt) {
      //console.log('readValue CONNECTED');
      ws.send(JSON.stringify({
       'command': 'READ',
       'portno': portno
      }));
    };
    ws.onmessage = function(evt) {
      var message = JSON.parse(evt.data);
      if (message.succeeded)
        resolve(message.message);
      else
        reject(message);
      ws.close();
    };
    ws.onerror = function(evt) {
      var str = '';
      for (var i in evt) {
        str += i + '=' + evt[i] + '<br/>';
      }
      reject(str);
    };
  });
};

function writeValue(portno, value) {
  return new Promise(function(resolve, reject) {
    var ws = new WebSocket(host);
    ws.onopen = function(evt) {
      console.log('writeValue CONNECTED');
      ws.send(JSON.stringify({
       'command': 'WRITE',
       'portno': portno,
       'value': value
      }));
    };
    ws.onmessage = function(evt) {
      var message = JSON.parse(evt.data);
      if (message.succeeded) {
        resolve();
      } else
        reject(message);
      ws.close();
    };
    ws.onerror = function(evt) {
      var str = '';
      for (var i in evt) {
        str += i + '=' + evt[i] + '<br/>';
      }
      reject(str);
    };
  });
};

var _Timer = {"196":null,"197":null,"198":null,"199":null};
var _Interval = 100;
var _readValue = {"196":null,"197":null,"198":null,"199":null};
function _checkValue(port){
  port.read().then(
    function(value){
      //console.log("check value success " + value + ":" + _readValue[port.portno]);
      if(_readValue[port.portno] != null){
        if(parseInt(value) != parseInt(_readValue[port.portno])){
          console.log("onchange");
          if(typeof(port.onchange) === "function"){
            port.onchange(value);  
          }else{
            console.log("port.onchange is not a function.");
          }
        }        
      }
      _readValue[port.portno] = value;
    },
    function(){
      console.log("check value error");
    }
  );
}

//var host = "ws://127.0.0.1:8000/";
var host = "ws://10.11.12.178:8000/";
navigator.requestGPIOAccess = requestGPIOAccess;

