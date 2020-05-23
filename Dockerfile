FROM node:0.10.48

RUN mkdir -p /usr/src/app
RUN mkdir -p /var/lib/www

WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD [ "node", "shnapps.js", "-a", "/var/lib/www", "-c", "config.js", "-e", "production", "-s", "false" ]
