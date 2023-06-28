FROM node:18.16.0-alpine
COPY . /app
WORKDIR /app
EXPOSE 9968
VOLUME ["/public"]
RUN npm config set registry https://registry.npm.taobao.org && sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories && apk add git && apk add openssh-client && npm i && mkdir -p tmp
ENTRYPOINT npm run start

