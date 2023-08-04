var express = require('express');
var router = express.Router();
const SPAWN = require('child_process').exec;
const interval  = require('../bin/interval');
const download = require('../bin/queue');

const blogPath = '/public/project/blog/';
const imagePath = '/public/project/image/';

router.post('/', function (req, res, next) {


var id = (req.body.repository || JSON.parse(req.body.payload).repository).id;
  if (id == 263783934) {//博客，直接拉取项目就行
    interval.push({id:id});

  } else if (req.body.repository.id == 181795472) {//image，这里逻辑比较复杂，
    interval.push({id:id,commits:req.body.commits || JSON.parse(req.body.payload).commits});
  } 
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end('ok');
});

router.post('/flutter', function (req, res, next) {



    console.log(req.body);

    let json = (req.body)
    if(json.action=='published'){

      let tag = json.release.tag_name;

      let p = [];

      for(let i =0 ;i<json.release.assets.length;i++){

        let assets = {
          name:json.release.assets[i].name,
          url:` https://ghproxy.com/${json.release.assets[i].browser_download_url}`

          // url:`https://hub.gitmirror.com/${json.release.assets[i].browser_download_url}`
        };

        download({id:470989261,tag:tag,assets:assets})

        // https://ghproxy.com/https://github.com/inkroom/flutter-netease-music/releases/download/v0.10.2/quiet-android-v0.10.2-armeabi-v7a.apk

        // interval.push({id:470989261,tag:tag,assets:assets})

        // https://js.xxooo.ml/https://github.com/inkroom/flutter-netease-music/releases/download/v0.9.7/quiet-android-v0.9.7-arm64-v8a.apk

      }
      



      // https://hub.gitmirror.com/https://github.com/inkroom/flutter-netease-music/releases/download/v0.9.6/quiet-windows-v0.9.6.zip

    }

    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end('ok');

  });

module.exports = router;
