FROM node:20 AS build
RUN apt install git
WORKDIR /app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "yarn.lock", ".yarnrc.yml","./"]
RUN yarn install
COPY . .
RUN yarn build

FROM node:20
WORKDIR /app
COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
CMD [ "node", "build" ]
