const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const app = express();
const bcrypt = require('bcrypt');
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mikawa2021',
  database: 'list_app'
});
connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = 'ゲスト';
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

app.get('/', (req, res) => {
      res.render('login.ejs');
    }
  );
app.get('/article/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
      'SELECT * FROM articles WHERE id = ?',
      [id],
      (error, results) => {
        res.render('article.ejs', { article: results[0] });
      }
    );
  });
  
  app.get('/signup', (req, res) => {
    res.render('signup.ejs', { errors: [] });
  });
  
  app.post('/signup', 
    (req, res, next) => {
      console.log('入力値の空チェック');
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      const errors = [];
  
      if (username === '') {
        errors.push('ユーザー名が空です');
      }
  
      if (email === '') {
        errors.push('メールアドレスが空です');
      }
  
      if (password === '') {
        errors.push('パスワードが空です');
      }
  
      if (errors.length > 0) {
        res.render('signup.ejs', { errors: errors });
      } else {
        next();
      }
    },
    (req, res, next) => {
      console.log('メールアドレスの重複チェック');
      // 定数emailを定義してください
      const email = req.body.email;
      
      // 配列errorsを定義してください
      const errors = [];
      
      // メールアドレスの重複をチェックするためのコードを貼り付けてください
      connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, results) => {
          if (results.length > 0) {
            // 配列errorsに'ユーザー登録に失敗しました'を追加してください
            errors.push('ユーザー登録に失敗しました');
            
            // res.renderを用いて、新規登録画面を表示してください
            res.render('signup.ejs',{errors : errors});
            
          } else {
            // next関数を呼び出してください
            next();
            
          }
        }
      );
      
      

    },
    (req, res) => {
      console.log('ユーザー登録');
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      bcrypt.hash(password, 10, (error, hash) =>{
        connection.query(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hash],
          (error, results) => {
            req.session.userId = results.insertId;
            req.session.username = username;
            res.redirect('/list');
          }
        );
      });
    }
  );
  
  app.get('/login', (req, res) => {
    res.render('login.ejs');
  });
  
  app.post('/login', (req, res) => {
    const email = req.body.email;
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          // 定数plainを定義してください
          const plain = req.body.password;
          
          // 定数hashを定義してください
          const hash = results[0].password;
          
          // パスワードを比較するためのcompareメソッドを追加してください
          bcrypt.compare(plain,hash,(error,isEqual) =>{
            if (isEqual){
              req.session.userId = results[0].id;
              req.session.username = results[0].username;
              res.redirect('/itemlist');
            }else{
              res.redirect('/login');
            }
          });  
        } else {
          res.redirect('/login');
        }
      }
    );
  });
  
  app.get('/logout', (req, res) => {
    req.session.destroy(error => {
      res.redirect('/list');
    });
  });

  app.get('/itemList', (req, res) => {
    connection.query(
      'SELECT * FROM categorys',
      (error, results) => {
        res.render('itemList.ejs', {categorys: results});
      }
    );
  });

  app.get('/list', (req, res) => {
    connection.query(
      'SELECT * FROM articles',
      (error, results) => {
        res.render('list.ejs', { articles: results });
      }
    );
  });
  app.get('/new/:id', (req, res) => {
      res.render('new.ejs',{req: req});
  });
  app.get('/new', (req, res) => {
    res.render('new.ejs',{req: req});
});

  app.post('/create', (req, res) => {
    
    if(req.body.categoryName !== "" || req.body.subcategoryName === NULL){
      connection.query(
        'INSERT INTO categorys (name) VALUES (?)',
        [req.body.categoryName],
        (error, results) => {
          res.redirect('/itemlist');


      }
    );
    
 /*     if(req.body.subcategoryName !== "" || req.body.subcategoryName !== NULL){
       
      } else {
          connection.query(
            'INSERT INTO items (name,categoryid,subcategoryid) VALUES (?,?,?)',
            [req.body.itemName,req.body.categoryId,req.body.subcategoryId],
            (error, results) => {
              res.redirect('/itemlist');
              console.log("商品登録した");
    
          }
        );
        }*/
      }else{
         res.redirect('/new',error);
      }

    
 });
  
  app.post('/create/:id',(req,res) => {
    connection.query(
    'INSERT INTO subcategorys (name,category_id) VALUES (?,?)',
    [req.body.subcategoryName,req.body.categoryId],
    (error, results) => {
      res.redirect('/itemlist');
     
     }
    );
  });

  app.post('/delete/:id', (req, res) => {
    if(req.body.subcategoryId > 0 ){
      connection.query(
        'DELETE FROM subcategorys WHERE id = ?',
        [req.body.subcategoryId],
        (error, results) => {
          res.redirect('/itemlist');
        }
      );
      if(req.body.itemId > 0){
        connection.query(
          'DELETE FROM items WHERE id = ?',
          [req.body.itemId],
          (error, results) => {
            res.redirect('/itemlist');
          }
        );
      }else{
        connection.query(
          'DELETE FROM categorys WHERE id = ?',
          [req.params.id],
          (error, results) => {
            res.redirect('/itemlist');
          }
        );
      }
    }
  });
  
  app.get('/edit/:id', (req, res) => {
    // 選択されたメモをデータベースから取得する処理を書いてください
    connection.query('SELECT * FROM categorys WHERE id=?',[req.params.id],(error,results)=>{
      res.render('edit.ejs',{category: results[0]});
    })
  });
  
  app.post('/update/:id', (req, res) => {
    // 選択されたメモを更新する処理を書いてください
    connection.query('UPDATE categorys SET name=? WHERE id=?',[req.body.categoryName,req.params.id],(error,results) =>{
      res.redirect('/itemlist');
      })
  });
  
app.listen(3000);
