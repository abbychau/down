# Oekaki Chat

インターン課題用作成した「お絵かきチャット」の汎用モジュールです（多分）　node.js+socket.ioで動きます。


### 使い方
#### インストール
#####1.モジュールをインストール
	cd server
	npm install
	npm

#####2.アプリを起動
	cd server
	node app.js

#####3.クライアントを起動
`/client-sample/index.html`をブラウザで開く

#### プロトコル
#### サンプル

#### リファレンス
基本的にはインスタンス作って、メソッドを書くだけでおｋなはず。
##### OekakiClient(server_url,_room_id)
　お絵かきチャットクライアントクラス。  
　server_urlはアプリを設置しているサーバーのアドレス。  
　_room_idは現在未使用、拡張出来るようにする。

	//サンプル
	var oekaki = new OekakiClient("http://localhost:9000");

##### setClientName(_name)
  クライアント名を_nameに変更する。  
  現在チャットの表示名を変更する部分にのみ使用。

	//サンプル
	oekaki.setClientName("Kodam");

##### setBrashColor(_color)
  ブラシの色を変更する。  
  
  	//サンプル
	oekaki.setBrashColor("rgb(0,0,0)");
	oekaki.setBrashColor("#eeee00");
	
##### setBrashSize(_size)
  ブラシの太さを変更する。  
  
  	//サンプル
	oekaki.setBrashSize(10);
	
	
##### setPoint(_x,_y)
　描画スタックに点をセットする。  

	//100*100の四角を描画するサンプル
	for(var x=0,x<100;x++){
		for(var y=0,y<100;y++){
			oekaki.setPoint(x,y);
		}
	}
	oekaki.sendStroke();

##### setStroke()
　描画スタックにある点をすべて送信し、1ストロークとして認識する。  
　送信が終わるとスタックが空になる。
  
	//100*100の四角を描画するサンプル
	for(var x=0,x<100;x++){
		for(var y=0,y<100;y++){
			oekaki.setPoint(x,y);
		}
	}
	oekaki.sendStroke();

##### sendAllClear()
  Canvasをすべて消すコマンドを送る。

##### sendMessage(_mes)
　_mesのメッセージを他のクライアントに送信する。 

##### receiveAllClear(function(){…})
  すべて消すコマンドを受け取ったときの処理を設定する
  
	//サンプル
	oekaki.receiveAllClear(function(){
		canvasClear(); //キャンバスを白く塗りつぶす
	});
	
##### receiveStroke(function(data){...})
　ストロークを受け取ったときの処理を設定する。

	/*
	 ストロークを受け取ったときのサンプル
		data = {
			id:Number
			,config:{size:Number,color:String}
			,strokes:[{x:Number,y:Number}]
		}
	*/
	oekaki.receiveStroke(function(data){
		drawStroke(data.config,data.strokes);
	});
	
##### receiveMessage(function(data){…})
　メッセージを受け取るコールバック関数を設定する

	/*
	 メッセージを受け取ったときのサンプル
		data = {
			id:Number
			,name:String
			,message:String
		}
	*/
	oekaki.receiveMessage(function(data){
		chat.putMessage(data.name,data.message);
	});

  
### 動作環境
#### サーバー
+ node.js version 0.8.17
+ socket.io version 0.9.11
+ mongodb version 2.2.3
+ mongoose version 3.5.6

#### 対応ブラウザ
+ GoogleChrome version 24


