var express = require('express');
var router = express.Router();
const SPAWN = require('child_process').exec;
const interval  = require('../bin/interval');

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

module.exports = router;
