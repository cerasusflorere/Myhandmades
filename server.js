const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const mongouri = 'mongodb+srv://'+process.env.USER+':'+process.env.PASS+'@'+process.env.MONGOHOST;

///ログイン機能＆サインアップ機能

// トップ画面
app.get('/', (req, res) => {
  if(req.cookies.user) {
    res.sendFile(__dirname + '/views/main.html');
    return;
  }

  res.sendFile(__dirname + '/views/index.html');
});


// 登録画面
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/views/signup.html');
});

// ログイン画面へ
app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.get('/my_account', function(req, res){
  if(!req.cookies.user) {
    res.sendFile(__dirname + '/views/index.html');
    return;
  }
  res.json(req.cookies.user);
});

// ログイン失敗画面
app.get('/failed', (req, res) => {
  if(req.cookies.user) {
    res.sendFile(__dirname + '/views/success.html');
    return;
  }

  res.sendFile(__dirname + '/views/failed.html');
});

// ホーム画面へ
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/views/home.html')
})

// ログアウト機能
app.get('/logout', (req, res) => {
  res.clearCookie('user'); // クッキーをクリア
  res.redirect('/');
});

//サインアップ機能
app.post('/signup', function(req, res){
  const userName = req.body.userName;
  const password = req.body.password;
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const col = db.collection('users'); // 対象コレクション
    const userid = Math.random(500);
    const user = {name: userName, password:hashed(password), userid: userid}; // 保存対象
    
    col.insertOne(user, function(err, result) {
       res.redirect('/'); // リダイレクト
       client.close(); // DB を閉じる
    });
  });
});

//ログイン機能
app.post('/login', function(req, res){
  const userName = req.body.userName;
  const password = req.body.password;
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const col = db.collection('users'); // 対象コレクション
    // 登録時にパスワードをハッシュ化しているならば
    // ここで password をハッシュ化して検索する
    // ハッシュ化した値同士で比較する
    const condition = {name:{$eq:userName}, password:{$eq:hashed(password)}}; // ユーザ名とパスワードで検索する
    col.findOne(condition, function(err, user){
      if(user) {
        res.cookie('user', user); // ヒットしたらクッキーに保存
        //userid = user.userid;
        res.redirect('/'); // リダイレクト
      }else{
        res.redirect('/failed'); // リダイレクト
      }
      client.close();
    });
  });
});

// ハッシュ化用
const crypto = require('crypto');

function hashed(password) {
  let hash = crypto.createHmac('sha512', password)
  hash.update(password)
  let value = hash.digest('hex')
  return value;
}


///メイン画面

//表示機能findDatas
app.get('/findDatas', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colWork = db.collection('work'); // 対象コレクション

    // 検索条件（ユーザーIDがuserId）
    // 条件の作り方： https://docs.mongodb.com/manual/reference/operator/query/
    const userId = ""+req.cookies.user.userid;
    const condition = {userid:{$eq:userId}};

    colWork.find(condition).toArray(function(err, datas) {
       res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
       client.close(); // DB を閉じる
    });
  });
});

//削除機能deletData
app.post('/deleteData', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('work'); // 対象コレクション
      const target = JSON.parse(received); // 保存対象
      const oid = new ObjectID(target.id);

      colWork.deleteOne({_id:{$eq:oid}}, function(err, result) {
        if(result.deletedCount) {
          res.sendStatus(200); // OK を返す
        }else{
          res.sendStatus(404); // 該当する本が見つからなかった意味で 404 を返す
        }
        client.close(); // DB を閉じる
      });
    });
  });
});

// 編集画面へfindWork
app.post('/findWork', (req, res) => {
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received = chunk;
  });
  console.log(received);
  
  req.on('end', function() {
　  MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('work'); // 対象コレクション
      const target = JSON.parse(received); // 保存対象
      const oid = new ObjectID(target.id);
      const condition = {_id:{$eq:oid}};

      colWork.find(condition).toArray(function(err, datas) {
        res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
        client.close(); // DB を閉じる
      });
    });
  });
});

//追加画面へaddform
app.post('/addform', (req, res) => {
  res.sendFile(__dirname + '/views/add.html');
});

/// 追加画面

// 追加機能fileadd
app.post('/savework', function(req, res){
  const userid = ""+req.cookies.user.userid;
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    chunk["userid"] = userid;
    received += chunk;
  });
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('work'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      data["userid"] = userid;

      if(!data.subject) {
        res.status(400);
        res.send('題名ないと登録できないんです…');
        return;
      }
      
      colWork.insertOne(data, function(err, result) {
        //res.send(decodeURIComponent(result.insertedId)); // 追加したデータの ID を返す
        client.close(); // DB を閉じる
        res.status(200);
        res.send('Success');
      });
    });
  });
});

// タグ取得
app.get('/findTags', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colTag = db.collection('tag'); // 対象コレクション

    // 検索条件（名前が「エクサくん」ではない）
    // 条件の作り方： https://docs.mongodb.com/manual/reference/operator/query/
    const condition = {tag:{$ne:'エクサくん'}};

    colTag.find(condition).toArray(function(err, tags) {
      res.json(tags); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

// タグ追加tagadd
app.post('/savetag', function(req, res){
  const userid = ""+req.cookies.user.userid;
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    chunk["userid"] = userid;
    received += chunk;
  });
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('tag'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      data["userid"] = userid;

      if(!data.tag) {
        res.status(400);
        res.send('Tag名を忘れてる気がするよ！');
        return;
      }
      
      colWork.insertOne(data, function(err, result) {
        client.close(); // DB を閉じる
        res.status(200);
        res.send('Success');
      });
    });
  });
});

/// ホーム画面
// 表示機能findAllDatas
app.get('/findAllDatas', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colWork = db.collection('work'); // 対象コレクション
    const opencode = '1';

    // 検索条件（公開かどうかが1）
    // 条件の作り方： https://docs.mongodb.com/manual/reference/operator/query/
    const condition = {open:{$eq:opencode}};

    colWork.find(condition).toArray(function(err, datas) {
       res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
       client.close(); // DB を閉じる
    });
  });
});

const listener = app.listen(process.env.PORT);
