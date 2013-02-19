//オブジェクトコピー
function copy(obj) {
  var hoge = function(){};
  hoge.prototype = obj;
  return hoge;
}

var OekakiClient = function(server_url,_room_id){
	//クライアント情報
	var client = {id:0,name:'no name',room_id:0};
	//ストロークの時系列情報
	var stroke_log = new Array();

	//描画用
	var config = {size:10,color:'rgb(0,0,0)'};
	//1ストロークスタック
	var stroke_stack = new Array();



	//ルームIDがあればそこに接続、現在は必ず0になっており設定する必要が無い
	if(_room_id){
		this.client.room_id = _room_id;
	}

	//WebSocket
	var socket = io.connect(server_url);

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
		this.client.id = data.id;
		socket.emit('init',{id:this.client.id,name:this.client.name});
		stroke_log = copy(data.stroke);
	});


	/*
	 全消しコマンドを受け取ったとき
		data = {}
	*/
	var call_back_allclear = function(){};
	socket.on('all-clear',function (data){
		stroke_log.length = 0;
		call_back_allclear();
	});

	/*
	 ストロークを受け取ったとき
		data = {
			id:Number
			,config:{size:Number,color:String}
			,strokes:[{x:Number,y:Number}]
		}
	*/
	var call_back_stroke = function(){};
	socket.on('stroke',function (data) {
		stroke_log.push(data);
		call_back_stroke(data);
	});

	/*
	 メッセージを受け取ったとき
		data = {
			id:Number
			,name:String
			,message:String
		}
	*/
	var call_back_message = function(){};
	socket.on('message',function (data) {
		call_back_message(data);
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
			strokes:this.stroke_stack
		});
	},
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
		this.call_back_allclear = _callback;
	},
	receiveStroke:function(_callback){
		this.call_back_stroke = _callback;
	},
	receiveMessage:function(_callback){
		this.call_back_message = _callback;
	}
};