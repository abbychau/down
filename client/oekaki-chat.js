var OekakiClient = null;

(function() {

//オブジェクトコピー
function copy(obj) {
  var hoge = function(){};
  hoge.prototype = obj;
  return hoge;
}

OekakiClient = function(server_url,_room_id){
	//クライアント情報
	var client = {id:0,name:'no name',room_id:0};
	this.client = client;

	//ストロークの時系列情報
	var stroke_log = new Array();
	this.stroke_log = stroke_log;

	//描画用
	var config = {size:10,color:'rgb(0,0,0)'};
	this.config = config;

	//1ストロークスタック
	var stroke_stack = new Array();
	this.stroke_stack = stroke_stack;



	//ルームIDがあればそこに接続、現在は必ず0になっており設定する必要が無い
	if(_room_id){
		this.client.room_id = _room_id;
	}

	//WebSocket
	var socket = io.connect(server_url);
	this.socket = socket;

	/*
	 初期化コマンド
		data = {
			id:Number
			,stroke:[{ //過去のログデータ
				id:Number
				,config:{
					size:Number
					,color:String
				}
				,strokes[{
					x:Number
					,y:Number
				}]
			}]
		}
	*/
	socket.on('init', function (data) {
		client.id = data.id;
		socket.emit('init',{id:client.id,name:client.name});
		stroke_log = copy(data.stroke);
	});

	//タイムアウトしないように、定期的にidを送り続ける
	setInterval(function(){
		if(client.id>0){
			socket.emit('timeout',{id:client.id});
		}
	}, 100);
};

OekakiClient.prototype = {
	setClientName:function(_name){
		this.client.name = _name;
		this.socket.emit('init',{id:this.client.id,name:this.client.name});
	},
	setBrashColor:function(_color){
		this.config.color = _color;
	},
	setBrashSize:function(_size){
		this.config.size = _size;
	},
	setPoint:function(_x,_y){
		this.stroke_stack.push({x:_x,y:_y});
	},
	sendStroke:function(){
		this.socket.emit('stroke',{
			id:this.client.id,
			config:this.config,
			strokes:copy(this.stroke_stack)
		});
		this.stroke_stack.length = 0;
	},
	//全消しコマンドを受け取ったとき
	sendAllClear:function(){
		this.socket.emit('all-clear',{
			id:this.client.id,
			name:this.client.name
		});
	},
	sendMessage:function(_mes){
		this.socket.emit('message',{
			id:this.client.id,
			name:this.client.name,
			message:_mes
		});
	},
	receiveAllClear:function(_callback){
		/*
		 全消しコマンドを受け取ったとき
			data = {}
		*/
		this.socket.on('all-clear',function (data){
			stroke_log.length = 0;
			_callback();
		});
	},
	receiveStroke:function(_callback){
		/*
		 ストロークを受け取ったとき
			data = {
				id:Number
				,config:{size:Number,color:String}
				,strokes:[{x:Number,y:Number}]
			}
		*/
		this.socket.on('stroke',function (data) {
			stroke_log.push(data);
			_callback(data);
		});
	},
	receiveMessage:function(_callback){
		/*
		 メッセージを受け取ったとき
			data = {
				id:Number
				,name:String
				,message:String
			}
		*/
		this.socket.on('message',_callback);
	}
};

})();