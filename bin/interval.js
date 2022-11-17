// 定时器
const SPAWN = require('child_process').exec;
const fs = require('fs');

const blogPath = '/public/project/blog/';
const imagePath = '/public/project/image/';


const queue = [];

setInterval(() => {

    if (queue.length != 0) {

        //取对顶元素
        var p = queue[0];


        if (p.id == 263783934) {//博客，直接拉取项目就行


            SPAWN(`cd ${blogPath} && git pull`, function (error, stdout, stderr) {
                if (error) {
                    console.error('blog',error);
                }
                else {
                    console.log("blog success");
                    queue.splice(0, 1);//移除队顶
                }
            });

        } else if (p.id == 181795472) {//image，这里逻辑比较复杂，

            // 首先获取当前新增的文件

            //更新项目
            console.log('更新项目')

            SPAWN(`cd ${imagePath} && git pull`, (error, stdout, stderr) => {
                if (error) {
                    console.error('image',error);
                }
                else {
                    var added = [];
                    var removed = [];

                    p.commits.forEach(commit => {
                        added = added.concat(commit.added);
                        removed = removed.concat(commit.removed);
                    });

                    //根据目录前缀分组
                    const ex = new RegExp('([^/]+)/(.*)');
                    var addGroup = {};
                    added.forEach(add => {
                        var r = ex.exec(add);
                        if (!addGroup[r[1]]) {
                            addGroup[r[1]] = [];
                        }
                        addGroup[r[1]].push(r[2]);
                    });

                    var removeGroup = {};
                    removed.forEach(re => {
                        var r = ex.exec(re);
                        if (!removeGroup[r[1]]) {
                            removeGroup[r[1]] = [];
                        }
                        removeGroup[r[1]].push(r[2]);
                    });

                    //修改对应的文件
                    for (const key in removeGroup) {
                        if (Object.hasOwnProperty.call(removeGroup, key)) {
                            const element = removeGroup[key];

                            //读取文件，然后剔除存在的值
                            var content = fs.readFileSync(`/public/project/list/${key}/list`).toString().split('\r\n');
                            // var content = fs.readFileSync(`/mnt/d/image/${key}/list`,{encoding:'utf8'}).toString().split('\r\n');
                            content = content.filter(c => element.indexOf(c) < 0);
                            //再写入文件
                            fs.writeFileSync(`/public/project/list/${key}/list`, content.join('\r\n'));

                        }
                    }

                    for (const key in addGroup) {
                        if (Object.hasOwnProperty.call(addGroup, key)) {
                            const element = addGroup[key];

                            //读取文件，然后加到开头
                            var content = fs.readFileSync(`/public/project/list/${key}/list`, { encoding: 'utf8' }).toString().split('\r\n');
                            content =  element.concat(content.filter(c => element.indexOf(c) < 0));
                            //再写入文件
                            fs.writeFileSync(`/public/project/list/${key}/list`, content.join('\r\n'));
                        }
                    }
                    queue.splice(0, 1);//移除队顶
                }
            });



        }

    }



}, 5000);

module.exports = queue;

