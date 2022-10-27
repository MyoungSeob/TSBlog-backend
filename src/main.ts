import Koa from 'koa';
import Router from 'koa-router';
import api from './api';
import bodyParser from 'koa-bodyparser';
import mongoose, { Error } from 'mongoose';
import 'dotenv/config';
import jwtMiddleware from './lib/jwtMiddleware';

const app = new Koa();
const router = new Router();
const test = api;
const { PORT, MONGO_URI } = process.env;

if (typeof MONGO_URI === 'string') {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('connected to mongoDB');
    })
    .catch((e: Error) => {
      console.error(e);
    });
}

router.use('/api', test.routes());

app.use(bodyParser());
app.use(jwtMiddleware);
app.use(router.routes()).use(router.allowedMethods());

const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listening to port %d', port);
});
