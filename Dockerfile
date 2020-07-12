FROM node:0.10.48

RUN mkdir -p /usr/src/app
RUN mkdir -p /var/lib/www

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install deps
RUN npm install

# Copy app source
COPY . .

CMD [ "sh", "-c", "node shnapps.js -a /var/lib/www -c config.js -e $SHNAPPS_ENV -s false" ]
