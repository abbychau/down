var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

app.listen(9001);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

var clients = new Object();
var stroke_log = new Array();
var new_id = 0;
const N_TIMEOUT = 30;

function makeClient(){
  var client = {
    id:++new_id,
    name:'No name',
    timeout_count:N_TIMEOUT
  };
  return client;
};

io.sockets.on('connection', function (socket) {
  var c = makeClient();
  clients[c.id] = c;

  //初期化
  // ストロークの再生
  socket.emit('init',{id:c.id,stroke:stroke_log});

  //ログイン通知
  socket.on('init', function (data) {
    clients[data.id].name = data.name;
    socket.broadcast.emit('message',{id:0,name:'アナウンス',message:data.name+'('+data.id+')'+'さんがログインしました。'});
  });

  //ストローク転送
  socket.on('stroke', function (data) {
    stroke_log.push(data);
    socket.broadcast.emit('stroke',data);
  });

  //メッセージ転送
  socket.on('message', function (data) {
    socket.broadcast.emit('message',data);
    socket.emit('message',data);
  });

  //生存確認
  socket.on('timeout', function (data) {
    if(clients[data.id]){
      clients[data.id].timeout_count = N_TIMEOUT;
    }
  });

  //タイムアウト
  setInterval(function(){
    if(clients[c.id] && --clients[c.id].timeout_count < 0){
      //退出したことを通知
      socket.broadcast.emit('message',{id:0,name:'アナウンス',message:c.name+'('+c.id+')'+'さんがログアウトしました。'});
      delete clients[c.id];
    }
  }, 100);
});

//debug
setInterval(function(){
  console.log(clients);
}, 1000);