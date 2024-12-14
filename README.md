## Setup .env file

```js
// post
PORT=...
// mongodb
MONGO_URI=...
// json web token
JWT_SECRET=...
// cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
// email app password
EMAIL_APP_PASSWORD=...
EMAIL_NAME=...
```

## Build the app

```shell
npm run build
```

## Start the app

```shell
npm start
```

## Start the app development

```shell
npm run dev
```

## Install the entire library

```shell
npm install --save
# if error
npm install --save --force
# or
npm install --save --legacy-peer-deps
```

## Setup uplaod cloudinary, email app password

- [@Visit Cloudinary](https://cloudinary.com/) -> Login/Register -> Getting started -> Click View API Key to get the key in .env format

- [@Email app password](https://myaccount.google.com/apppasswords) -> Enter gmail password to continue (<b>Note</b>: You must enable step verification before doing this part.) -> <b>Enter characters in the Project Name box</b> -> Click the generate button. A box will appear showing the characters to enter in the EMAIL_APP_PASSWORD of the .env file.

## Node version

```js
v20.16.0
```
