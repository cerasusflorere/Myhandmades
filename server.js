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

/// Cloudinaryと接続
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
}); 
module.exports = cloudinary;

// ほぼ確実に重複することないユニークなIDであるUUIDを作成する、uuidパッケージの定義
// multerでファイル名を生成するときに同じファイル名の画像がアップロードされた時も
// 別物として扱いたいので、それぞれの画像をユニークなファイル名に変換するため必要
const { v4: uuid } = require('uuid');

// multerの定義
// multerを使うとmultipartなデータを扱えるようになり、指定したディレクトリへの保存も自動で行う
const multer = require('multer');
// アプロード先ディレクトリ、ファイル名の定義
const storage = multer.diskStorage({
  destination: function(req, file, cb) { // アップロード先はpublic(ユーザがアクセス可能な場所)にする
    cb(null, __dirname + '/public/');
  },
  filename: function(req, file, cb) {
    // UUIDを生成し、それに元画像の拡張子を付けたものをファイル名として保存する
    const filename = uuid();
    const extension = file.originalname.split('.')[1];
    cb(null, filename + '.' + extension);
  }
});
const upload = multer({ 
  storage: storage
});


require('date-utils');


///ログイン機能＆サインアップ機能

// トップ画面
app.get('/', (req, res) => {
  if(req.cookies.user) {
    res.sendFile(__dirname + '/views/home.html');
    return;
  }
  res.sendFile(__dirname + '/views/index.html');
});

// サインアップ画面へ
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/views/signup.html');
});

// ログイン画面へ
app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ログイン失敗画面
app.get('/failed', (req, res) => {
  if(req.cookies.user) {
    res.sendFile(__dirname + '/views/home.html');
    return;
  }

  res.sendFile(__dirname + '/views/failed.html');
});

// サインアップ失敗画面
app.get('/failed_signup', (req, res) => {
  res.sendFile(__dirname + '/views/failed_signup.html');
});

// ログインせずに投稿を見るページへ
app.get('/alluser', (req, res) =>{
  res.sendFile(__dirname + '/views/alluser.html');
})

// Home画面へ
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/views/home.html');
})

// Favorite画面へ
app.get('/favorite', (req, res) => {
  res.sendFile(__dirname + '/views/favorite.html');
})

// Private画面へ
app.get('/private', (req, res) => {
  if(req.cookies.user) {
    res.sendFile(__dirname + '/views/private.html');
    return;
  }
  res.sendFile(__dirname + '/views/index.html');
})

// Profile画面へ
app.get('/profile', (req, res) => {
  if(req.cookies.user) {
    res.sendFile(__dirname + '/views/profile.html');
    return;
  }
  res.sendFile(__dirname + '/views/index.html');
})

// Cancel画面へ
app.get('/cancel', (req, res) => {
  res.clearCookie('user'); // クッキーをクリア
  res.sendFile(__dirname + '/views/cancel.html');
})


// ログアウト機能
app.get('/logout', (req, res) => {
  res.clearCookie('user'); // クッキーをクリア
  res.redirect('/');
});


//サインアップ機能
app.post('/signup', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const col = db.collection('users'); // 対象コレクション
      const user = JSON.parse(received); // 保存対象

      if(!user.name) {
        res.status(400);
        res.send('ユーザー名が入力されてないので登録できません…');
        return;
      }else if(!user.password){
        res.status(400);
        res.send('パスワードの入力をお願いします');
        return;        
      }else if(!user.repassword){
        res.status(400);
        res.send('パスワードの再確認ができません');
        return;             
      }else if(user.password != user.repassword){
        res.status(400);
        res.send('パスワードが一致しませんねぇ…');
        return;          
      }
      
      const dt = new Date();
      const date = String(dt.toFormat("YYYY/MM/DD")); // これを元に日付を登録
      
      // パスワードをハッシュ化する (この手の情報は平文で保存するべきではない)
      const userinfo = {name: user.name, password:hashed(user.password)}; // 保存対象
      
      const condition = {name:{$eq:user.name}}; // ユーザ名で検索する
      col.findOne(condition, function(err, users){
        if(users) {
          res.status(400);
          res.send('既にそのユーザー名は登録されているので、別の名前で登録して欲しいです…');
          return;
        }else{
          col.insertOne(userinfo, (errs, result) => {
            client.close();
            res.status(200);
            res.send('Success');        
          });          
        }        
      });      
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
    
    const dt = new Date();
    const date = String(dt.toFormat("YYYY/MM/DD")); // これを元に日付を登録
    const data = {update_date: date};
    
    // ユーザ名、ハッシュ化したパスワード値で検索する
    const condition = {name:{$eq:userName}, password:{$eq:hashed(password)}};
    col.findOne(condition, function(err, user){
      if(user) {
        col.updateOne(condition, {$set:data}, function(err, result) {
          client.close();
          res.cookie('user', user._id); // ヒットしたらクッキーに保存
          res.redirect('/'); // リダイレクト
        });
      }else{
        client.close();
        res.redirect('/failed'); // リダイレクト
      }
    });
  });
});

app.get('/gest', function(req, res){
  const userName = "a";
  const password = "a";
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const col = db.collection('users'); // 対象コレクション
    
    // ユーザ名、ハッシュ化したパスワード値で検索する
    const condition = {name:{$eq:userName}, password:{$eq:hashed(password)}};
    col.findOne(condition, function(err, user){
      client.close();
      if(user) {
        res.cookie('user', user._id); // ヒットしたらクッキーに保存
        res.redirect('/'); // リダイレクト
      }else{
        res.redirect('/failed'); // リダイレクト
      }
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



/// Home画面
// お気に入り捜索
app.get('/findFavorites', function(req, res){
  MongoClient.connect(mongouri, function(error, client){
    const db = client.db(process.env.DB); // 対象DB
    const colFavorite = db.collection('favorite'); // 対象コレクション(favorite)
    const userid = req.cookies.user;
    
    const condition = {userid: userid};
    colFavorite.find(condition).toArray(function(err, datas){
      res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

// 表示機能fetchAllData 
app.get('/fetchAllData', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colWork = db.collection('work'); // 対象コレクション
    const opencode = '1';

    // 検索条件（公開する場合1）
    const condition = {open:{$eq:opencode}};

    colWork.find(condition).toArray(function(err, datas) {
      res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

// お気に入り登録registerfavorite
app.post('/registerfavorite', function(req, res){
  const userid = req.cookies.user;
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colFavorite = db.collection('favorite'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      data['userid'] = userid;

      if(!data.workid) {
        res.status(400);
        res.send('何か間違えちゃったみたいです');
        return;
      }

      colFavorite.findOne(data, function(err, work){
        if(work) {
          colFavorite.deleteOne(data, function(err, result) {
            res.status(400);
            res.send('お気に入り登録を外しました');
            client.close(); // DB を閉じる
          });
          return;
        }else{
          colFavorite.insertOne(data, function(err, result) {
            client.close(); // DB を閉じる
            res.status(200);
            res.send('Success');
          });
        }
      });
    });
  });
});


/// Favorite画面
// 表示機能findFavoriteDatas
app.post('/findFavoriteDatas', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('work'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      const oid = new ObjectID(data.id);

      // 検索条件（idが一致するか）
      const condition = {_id:{$eq:oid}};

      colWork.find(condition).toArray(function(err, datas) {
        res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
        client.close(); // DB を閉じる
      });
    });
  });
});



///Private画面
//表示機能findData
app.get('/findData', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colWork = db.collection('work'); // 対象コレクション

    // 検索条件（ユーザーIDがuserId）
    const userId = req.cookies.user;
    const condition = {userid:{$eq:userId}};

    colWork.find(condition).toArray(function(err, datas) {
       res.json(datas); // レスポンスとしてユーザを JSON 形式で返却
       client.close(); // DB を閉じる
    });
  });
});

/// 追加画面
// 画像を追加する // 編集でも使用
app.post('/urlimagsave', upload.single('file'), (req, res) => {
  const userid = req.cookies.user;
  cloudinary.uploader.upload(req.file.path, {folder: 'Myhandmades', tags: userid}, function(error, result) { 
    console.log(result, error);
    
    const url_add = result.secure_url; // httpsはsecure_url
    const public_id_add = result.public_id;
    const data = {url:url_add, public_id:public_id_add};
    res.json(data); // レスポンスとしてユーザを JSON 形式で返却
  });
});

// 追加機能fileadd
app.post('/savework', function(req, res){
  const userid = req.cookies.user;
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('work'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      data["userid"] = userid;
      console.log(data);

      if(!data.subject) {
        res.status(400);
        res.send('題名ないと登録できないんです…');
        return;
      }
      
      colWork.insertOne(data, function(err, result) {
        cloudinary.uploader.add_tag(decodeURIComponent(result.insertedId), 
          data.public_id,
          function(error, result) {console.log(result, error)});
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

    // 検索条件（なし）
    const condition = {};

    colTag.find(condition).toArray(function(err, tags) {
      res.json(tags); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

// タグ追加tagadd
app.post('/savetag', function(req, res){
  const userid = req.cookies.user;
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('tag'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      data['userid'] = userid;

      if(!data.tag) {
        res.status(400);
        res.send('Tag名を忘れてる気がするよ！');
        return;
      }
      
      colWork.insertOne(data, function(err, result) {
        client.close(); // DB を閉じる
        res.status(200);
        res.send(decodeURIComponent(result.insertedId)); // 追加したデータの ID を返す
      });
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
          cloudinary.api.delete_resources_by_tag(target.id,
  　　　　　　function(error, result) {console.log(result, error); });
          res.sendStatus(200); // OK を返す
        }else{
          res.sendStatus(404); // 該当する作品が見つからなかった意味で 404 を返す
        }
        client.close(); // DB を閉じる
      });
    });
  });
});

// 編集機能editwork 
app.post('/editwork', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  console.log(received);
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('work'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      const oid = new ObjectID(data.id);
      console.log(oid);
      const id = data.id;
      delete data.id;
      
      if(!data.subject) {
        res.status(400);
        res.send('題名ないと登録できないんです…');
        return;
      }
      
      colWork.find({_id:oid}).toArray(function(errs, datas) {
        if((datas.url && data.url) || data.url == ''){
          cloudinary.api.delete_resources_by_tag(id,
  　　　　　　function(error, results) {console.log(results, error); });
        }
        colWork.updateOne({_id:oid}, {$set:data}, function(err, result) {
          if(data.url){
            cloudinary.uploader.add_tag(oid, 
              data.public_id,
              function(error, results) {console.log(results, error)});  
          }          
          //res.send(decodeURIComponent(result.insertedId)); // 追加したデータの ID を返す
          console.log(err);
          res.status(200);
          res.send('Success');
        });
        client.close(); // DB を閉じる
      });
    });
  });
});



/// Profile画面
//プロフィール表示機能findUserData
app.get('/findUserData', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colUsers = db.collection('users'); // 対象コレクション1
    const colWork = db.collection('work'); // 対象コレクショ2

    // 検索条件（ユーザーIDがuserId）
    const userId = req.cookies.user;
    const oid = new ObjectID(userId);
    const conditionusers = {_id:{$eq:oid}};
    const conditionworks = {userid:{$eq:userId}};

    colUsers.find(conditionusers).toArray(function(err, datausers) {
      colWork.find(conditionworks).toArray(function(err, dataworks) {
        let data = datausers.concat(dataworks);
        res.json(data); // レスポンスとしてユーザを JSON 形式で返却
        client.close(); // DB を閉じる
      })
    });
  });
});

// ユーザーが追加したタグ取得
app.get('/findUserTag', function(req, res){
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colTag = db.collection('tag'); // 対象コレクション

    // 検索条件（useridが一致）
    const userId = req.cookies.user;
    const condition = {userid:{$eq:userId}};

    colTag.find(condition).toArray(function(err, tags) {
      res.json(tags); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

// タグ編集機能edittag
app.post('/edittag', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('tag'); // 対象コレクション
      const data = JSON.parse(received); // 保存対象
      const oid = new ObjectID(data.id);
      delete data.id;

      if(!data.tag) {
        res.status(400);
        res.send('tag名を編集するんだよね…？空欄…？');
        return;
      }
      
      colWork.updateOne({_id:oid}, {$set:data}, function(err, result) {
          //res.send(decodeURIComponent(result.insertedId)); // 追加したデータの ID を返す
          client.close(); // DB を閉じる
          res.status(200);
          res.send('Success');
      });
    });
  });
});

//タグ削除機能deletTag
app.post('/deleteTag', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  
  req.on('end', function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colWork = db.collection('tag'); // 対象コレクション
      const target = JSON.parse(received); // 保存対象
      const oid = new ObjectID(target.id);

      colWork.deleteOne({_id:{$eq:oid}}, function(err, result) {
        if(result.deletedCount) {
          res.sendStatus(200); // OK を返す
        }else{
          res.sendStatus(404); // 該当するタグが見つからなかった意味で 404 を返す
        }
        client.close(); // DB を閉じる
      });
    });
  });
});

// パスワード変更
app.post('/change', function(req, res){
  const userName = req.body.change_username;
  const password = req.body.nowpassword;
  const newpassword = req.body.newpassword;
  const renewpassword = req.body.renewpassword;
  
  if(userName == 'a' || password == 'a'){
    res.redirect('/profile'); // リダイレクト
  }else if(userName == ''){
    res.redirect('/profile');
  }else if(password == ''){
    res.redirect('/profile'); // リダイレクト
  }else if(newpassword == ''){
    res.redirect('/profile'); // リダイレクト
  }else if(renewpassword == ''){
    res.redirect('/profile'); // リダイレクト
  }else if(newpassword !== renewpassword){
    res.redirect('/profile'); // リダイレクト
  }else if(password === newpassword){
    res.redirect('/profile'); // リダイレクト
  }else{
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const col = db.collection('users'); // 対象コレクション
      const redata = {password:newpassword};
      const data = JSON.parse(JSON.stringify(redata)); // 保存対象
      const afterdata = {password:hashed(data.password)};
    
      const userId = req.cookies.user;
      const oid = new ObjectID(userId);
      const condition = {_id:{$eq:oid}, name:{$eq:userName}, password:{$eq:hashed(password)}};
      
      col.findOne(condition, function(err, users){
        if(users) {
          // ユーザ名、ハッシュ化したパスワード値で検索する
          col.updateOne({_id:oid}, {$set:afterdata}, function(err, result) {
          client.close(); // DB を閉じる
          res.status(200);
          res.redirect('/profile'); // リダイレクト
          });
        }else{
          res.redirect('/profile'); // リダイレクト
        }
        client.close();
      });
    });
  }
});

//退会機能
app.post('/cancel', function(req, res){
  const userName = req.body.username;
  const password = req.body.password;
  
  if(userName == 'a' || password == 'a'){
    res.redirect('/profile'); // リダイレクト
  }else if(userName == ''){
    res.redirect('/profile');
  }else if(password == ''){
    res.redirect('/profile'); // リダイレクト
  }else{
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const col = db.collection('users'); // 対象コレクション（users）
      const colWork = db.collection('work'); // 対象コレクション（work）
    
      const userId = req.cookies.user;
      const oid = new ObjectID(userId);
      const condition = {_id:{$eq:oid}, name:{$eq:userName}, password:{$eq:hashed(password)}};
      
      col.deleteOne(condition, function(err, result) {
        // userコレクションから消した
        if(result.deletedCount) {
          colWork.deleteMany({userid:{$eq:userId}}, function(errs, results) {
            // workコレクションから消した
            if(results.deletedCount) {
              // 写真たちを消す
              cloudinary.api.delete_resources_by_tag(oid,
  　　　　　　   function(error, result_img) {console.log(result_img, error); });
            }
          });
          res.redirect('/cancel');
        }else{
          res.redirect('/profile'); // リダイレクト
        }
        client.close(); // DB を閉じる
      });
    });
  }
});


const listener = app.listen(process.env.PORT);
