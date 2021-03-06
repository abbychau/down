var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , mongoose = require('mongoose');

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

//localhostのpixiv-oekaki-chatのデータベースに接続。
var db = mongoose.connect('mongodb://localhost/pixiv-oekaki-chat');
//お絵かき用のスキーマを宣言。
var OekakiSchema = new mongoose.Schema({
  id:Number
  ,name:String
  ,description:String
  ,clients:{}
  ,stroke_log:[mongoose.Schema.Types.Mixed]
});

//スキーマからモデルを生成。
var Oekaki = db.model('Oekaki',OekakiSchema);
//ひとつも部屋がなければ作成
Oekaki.find(function(err,items){
  if(err){console.log(err);}
  if(items.length==0){
    Oekaki.remove({},function(err){});
    var oekaki = new Oekaki({
      id:0
      ,name:"テストルーム"
      ,description:"テスト用のお絵かきデータです"
      ,clients:{}
      ,stroke_log:[]
    });
    oekaki.save();
  }
});

const DEFAULT_ROOM_ID = 0;
var clients = new Object();
var stroke_log = new Array();
var new_id = 0;
const N_TIMEOUT = 30;

//DBから状態をロード
Oekaki.findOne({id:DEFAULT_ROOM_ID},function(err,item){
  if(err){console.log(err);}
  stroke_log = item.stroke_log;
});

function makeClient(){
  var client = {
    id:++new_id,
    name:'no name',
    room_id:DEFAULT_ROOM_ID,
    timeout_count:N_TIMEOUT
  };
  return client;
};

function saveClient(_id){
  Oekaki.findOne({id:_id},function(err,item){
    if(err){console.log(err);}
    item.clients = clients;
    item.save();
  });
}

function saveStroke(_id){
  Oekaki.findOne({id:_id},function(err,item){
    if(err){console.log(err);}
    item.stroke_log = stroke_log;
    item.save();
  });
}

io.sockets.on('connection', function (socket) {
  var c = makeClient();
  clients[c.id] = c;
  saveClient(c.room_id);

  //初期化
  // ストロークの再生
  socket.emit('init',{id:c.id,stroke:stroke_log});

  //ストロークのログを取得
  socket.on('stroke_log',function (data){
    Oekaki.findOne({id:data.room_id},function(err,item){
      if(err){console.log(err);}
      socket.emit('stroke_log',{id:item.id,name:item.name,description:item.description,stroke:item.stroke_log});
    });
  });

  //メンバー取得
  socket.on('members', function (data) {
    Oekaki.findOne({id:data.room_id},function(err,item){
      if(err){console.log(err);}
      socket.emit('members',{id:item.id,name:item.name,description:item.description,clients:item.clients});
    });
  });

  //ログイン通知
  socket.on('init', function (data) {
    clients[data.id].name = data.name;
    saveClient(DEFAULT_ROOM_ID);

    if(data.name!='no name')
      socket.broadcast.emit('message',{id:0,name:'アナウンス',message:data.name+'('+data.id+')'+'さんがログインしました。'});
  });

  //ログ削除
  socket.on('all-clear', function (data) {
    stroke_log.length = 0;
    saveStroke(DEFAULT_ROOM_ID);

    socket.broadcast.emit('message',{id:0,name:'アナウンス',message:data.name+'('+data.id+')'+'さんが全消しを実行しました。'});
    socket.broadcast.emit('all-clear',data);
    socket.emit('all-clear',data);
  });

  //ストローク転送
  socket.on('stroke', function (data) {
    stroke_log.push(data);
    saveStroke(DEFAULT_ROOM_ID);

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
      if(c.name!='no name')
        socket.broadcast.emit('message',{id:0,name:'アナウンス',message:c.name+'('+c.id+')'+'さんがログアウトしました。'});
      delete clients[c.id];
      //DB更新
      saveClient(DEFAULT_ROOM_ID);
    }
  }, 100);
});

//debug
setInterval(function(){
  Oekaki.findOne({id:DEFAULT_ROOM_ID},function(err,item){
    if(err){console.log(err);}
    console.log(item.clients)
  });
}, 1000);