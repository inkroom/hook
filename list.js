const fs = require('fs')


var dirs = fs.readdirSync('/public/project/image');


dirs.forEach(element => {
    if(!element.startsWith('.')){

        if(fs.statSync(`/public/project/image/${element}`).isDirectory()){

        console.log(`${element}`)
       var files =  fs.readdirSync(`/public/project/image/${element}`);
       fs.writeFileSync(`/public/project/list/${element}/list`,files.join('\r\n'));

        }
        

    }
});


