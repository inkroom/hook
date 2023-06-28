// 定时器
const fs = require('fs');
const got = require('got');
const { createWriteStream } = require("fs");
const Queue = require('queue');
const minio = require('minio');
var COS = require('cos-nodejs-sdk-v5');
const retry = require('retry-as-promised').default;
var cos = new COS({
    SecretId: process.env.COS_SECRET_ID, // 推荐使用环境变量获取；用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
    SecretKey: process.env.COS_SECRET_KEY, // 推荐使用环境变量获取；用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
});

var minioClient = new minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: 443,
    useSSL: true,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECERT_KEY
});




const queue = new Queue({ concurrency: 1, autoStart: true, results: [] })






function downloadRelease(p) {
    return new Promise((resolve, reject) => {



        console.log('下载 release', p);
        // 下载文件
        const url = p.assets.url;
        const fileName = './tmp/' + p.assets.name;
        let fileKey = p.tag + "/" + p.assets.name;
        let cosFileName = fileName;
        let minioFileName = fileName;
        const downloadStream = got.stream(url, {
            // timeout: {
            //     lookup: 100,
            //     connect: 50,
            //     secureConnect: 50,
            //     socket: 1000,
            //     send: 10000,
            //     response: 1000
            // }
        });
        const fileWriterStream = createWriteStream(fileName);

        downloadStream
            .on("downloadProgress", ({ transferred, total, percent }) => {
                const percentage = Math.round(percent * 100);
                console.info(`progress: ${fileName} ${transferred}/${total} (${percentage}%)`);
            })
            .on("error", (error) => {
                console.info(`Download failed: ${fileName} ${error.message}`);
                reject(p, error);
            });

        fileWriterStream
            .on("error", (error) => {
                console.error(`Could not write file to system: ${fileName} ${error.message}`);
                reject(p, error);
            })
            .on("finish", () => {
                console.log(`File downloaded to ${fileName}`);

                if (fileName.endsWith("version.json")) {
                    // 需要处理一下
                    cosFileName = fileName + ".cos";
                    fs.writeFileSync(cosFileName, fs.readFileSync(fileName, { encoding: 'utf-8' }).toString().split('https://github.com/inkroom/flutter-netease-music/releases/download').join('https://quiet-1252774288.cos.ap-chengdu.myqcloud.com'), { encoding: 'utf-8' })

                    minioFileName = fileName + ".minio";
                    fs.writeFileSync(minioFileName, fs.readFileSync(fileName, { encoding: 'utf-8' }).toString().split('https://github.com/inkroom/flutter-netease-music/releases/download').join('https://temp1.inkroom.cn/temp/quiet'), { encoding: 'utf-8' })

                    fileKey = p.assets.name;


                }

                // 上传 到 对应服务器
                // 上传到cos
                cos.putObject({
                    Bucket: process.env.COS_BUCKET, /* 必须 */
                    Region: process.env.COS_REGION,    /* 必须 */
                    Key: fileKey,              /* 必须 */
                    StorageClass: 'STANDARD',
                    Body: fs.createReadStream(cosFileName), // 上传文件对象
                    onProgress: function (progressData) {
                        progressData.fileName = fileName;
                        console.log(JSON.stringify(progressData));
                    }
                }, function (err, data) {
                    // console.log(err || data);
                    if (err) {
                        console.log(err);
                        reject(p, err);
                    } else {
                        console.log("Cos Success", fileName);
                        let type = {
                            "apk": 'application/vnd.android.package-archive',
                            'json': 'application/json',
                            'zip': 'application/zip',
                            'deb': 'application/x-debian-package'
                        }
                        var metaData = {
                            'Content-Type': type[fileName.substring(fileName.lastIndexOf('.') + 1)],
                        }

                        // 上传到minio
                        minioClient.fPutObject(process.env.MINIO_BUCKET, process.env.MINIO_PREFIX + '/' + fileKey, minioFileName, metaData, function (err, objInfo) {
                            if (err) {
                                reject(p, err);
                                return console.log(err)
                            }
                            console.log("Minio Success", fileName)

                            // 清除队列
                            // queue.splice(0, 1);//移除队顶
                            fs.unlinkSync(fileName);
                            fs.existsSync(cosFileName) && fs.unlinkSync(cosFileName);
                            fs.existsSync(minioFileName) && fs.unlinkSync(minioFileName);

                            resolve(p);


                        })

                    }



                    // fs.unlink(tmp,()=>{});
                });


            });

        downloadStream.pipe(fileWriterStream);


    })

}


function t(p) {

    return new Promise((resolve, reject) => {
        console.log('开始', p);

        if (Math.random() > 0.5) {
            setTimeout(() => {
                console.log('成功', p);
                resolve(p);
            }, 5000);

        } else {
            console.log("失败", p);
            reject(p);
        }
        // Math.random()
    });

}

module.exports = (p) => {
    queue.push(() => {
        return retry(() => {
            return downloadRelease(p);
        }, {
            backoffBase: 5000,// 延时 5 秒，每次重试 1.1 倍
            max: 10,
            report: (msg, obj, err) => {
                console.log('rep', JSON.stringify(msg), obj, err);
            },
            name: p.assets.name
        })
            .catch((e, err) => {
                console.log('返回e', e, err);
            });
    })
    queue.start();
    // queue.start();
};

