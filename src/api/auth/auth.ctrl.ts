import Router from 'koa-router';
import Joi from 'joi';
import { TUser } from '../../types';
import User from '../../models/user';

/*
    POST /api/auth/register
    {
        username : 'seobe',
        password : 'mypass123'
    }
*/

export const register = async (ctx: Router.IRouterContext) => {
  const schema = await Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { username, password } = <TUser>ctx.request.body;

  try {
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409;
      return;
    }
    const user = new User({
      username,
    });
    await user.setPassword(password);
    await user.save();

    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    if (e instanceof Error) {
      ctx.throw(e.message, 500);
    } else {
      ctx.throw(String(e), 500);
    }
  }
};
export const login = async (ctx: Router.IRouterContext) => {
  const { username, password } = <TUser>ctx.request.body;

  if (!username || !password) {
    ctx.status = 401;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    if (e instanceof Error) {
      ctx.throw(e.message, 500);
    } else {
      ctx.throw(String(e), 500);
    }
  }
};

/*
  GET /api/auth/check
*/

export const check = async (ctx: Router.IRouterContext) => {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};

/*
    POST /api/auth/logout
*/
export const logout = async (ctx: Router.IRouterContext) => {
  ctx.cookies.set('access_token');
  ctx.status = 204;
};
