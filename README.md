# Myhandmades アプリ

## <<アプリ概要>>  
Myhandmandes アプリは手芸作品投稿 SNS です。  
私の趣味は手芸作品を作成することなのですが、他の方が作られた作品についても見てみたい、デザインの参考にしたいと考えています。  
しかし、そういった情報を得ようとすると Twitter や Instagram で投稿を探すことになりますが、購入作品も多く、探しにくいというのが実情です。  
そこで手芸作品に特化した SNS があれば良いのではと考えました。  
また、匿名性が高い（公開したときにアカウント名が出ない）ほうがユーザーは使いやすいのではないか、全作品を公開したくないユーザーもいるのではないかとか考えました。

## <<アプリ機能>>  
### <ログイン前>  
起動するとログイン画面が表示されます。

#### ログイン画面（Login）について  
・「Gest」ボタン：Gestアカウントにログインします。username、passwordは不要です。  
・Create an account：サインアップ画面（Sign up）へ遷移します。  
・Just look?：ログインすることなく、投稿作品を閲覧できる画面（All User）へ遷移します。  

#### サインアップ画面（Sign up）について  
・ユーザー名が未登録かつパスワードと再入力されたパスワードが一致、それぞれ8文字以上であると、アカウントが作成できます。  
　ユーザー名が登録済みの場合、パスワードと再入力されたパスワードが一致しない場合などに警告が出ます。  
・Let’s login!：ログイン画面（Login）へ遷移します。  

#### ログインすることなく、投稿作品を閲覧できる画面（All User）について  
・公開可とした投稿作品が新着順で表示されます。  
・ヘッダーメニュー内右端のハンバーガーメニューをクリックすると、ログイン画面（Login）とサインアップ画面（Sign up）へ向かうメニューが表示されます。  
・この画面では絞り込み検索は行えません。

### <ログイン後>  
ログイン後、ホーム画面が表示されます。

#### ホーム画面（Home）について  
・他のユーザーが投稿した公開設定の作品を閲覧できます。  
・左上部のドロップダウン検索からタグによる絞り込みができます。Allは全作品閲覧モードです。  
・ただし、各作品右上の星ボタンを押すと、お気に入り登録できます。
・ハンバーガーメニューの左隣のボタンは左から、ホーム画面（Home）、お気に入り画面（Favorite）、個人画面（Private）へ向かうボタンです。  
・ハンバーガーメニューを押すと、個人情報画面（Profile）へ向かうことができ、ログアウトも行えます。

#### お気に入り画面（Favorite）について
・お気に入り登録した作品の一覧です。  
・タグによる絞り込みができます。

#### 個人画面（Private）について  
・アカウント保有者の投稿作品が投稿順に表示されます。  
・各作品の右上の「人アイコン」は公開可の作品であることを表します。ホバーするとアイコン下に「公開！」と表示されます。  
・各作品の左下の「ごみ箱アイコン」は各作品の削除ボタンです。ホバーするとアイコン下に「Delete」と表示されます。  
・各作品の右下の「ペンアイコン」は各作品の編集ボタンです。ホバーするとアイコン下に「Edit」と表示されます。  
・ヘッダーメニュー右下の「+Add」ボタンを押すと、作品が追加できます。  
　表示される投稿フォーム右上は作品を公開するかのボタンです。  
　チェックボックスで選択するタグは作品の作成方法です。  
・追加画面及び編集画面のタグ群右下の「+TagAdd」ボタンからユーザー側がタグを追加できます。追加されたタグは追加したユーザーのみが削除、編集できます。

#### 個人情報画面（Profile）について
・ユーザーの個人情報（username等）、全投稿数、タグごとの投稿数、ユーザが追加したタグが表示されます。  
・ユーザーが追加したタグを削除、編集できます。  
・退会作業が行えます。


## <<こだわりポイント>>   
#### 1.制作方法でのタグ設定  
「手芸が趣味の人が、手芸が趣味の人（自分含む）のために使うアプリ」であるため、制作方法が一番肝になると考えました。    
##### 2.タグをユーザーが追加できる  
私は様々な技法を身に着けることを意識してはいますが、すべての技法を知っているとは言い難いため、すべてを網羅することはできないと考えました。  
そこでユーザー側が追加できるようにしました。  
 しかし追加したタグ名が誤ってしまう可能性も考え、あとから編集できるようにしましたが、全ユーザーが全てのタグの編集を行えると混乱をきたすため、追加したユーザーのみが削除、編集できるようにしました。  
#### 3.ログインせずに閲覧できる  
アカウント作成が絶対とすると、アカウントを作成したくないユーザーの使用機会を逸するため、ログインせずに閲覧する機能を作りました。
