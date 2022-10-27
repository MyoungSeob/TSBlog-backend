import jwt from 'jsonwebtoken';
import Router from 'koa-router';
import User from '../models/user';

interface IDecoded {
  _id: string;
  username: string;
  iat: number;
  exp: number;
}

const jwtMiddleware = async (
  ctx: Router.IRouterContext,
  next: () => Promise<void>,
) => {
  const token = ctx.cookies.get('access_token');
  if (!token) return next();
  try {
    const decoded = <IDecoded>(
      jwt.verify(token, process.env.JWT_SECRET as string)
    );
    ctx.state.user = {
      _id: decoded._id,
      username: decoded.username,
    };

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 60 * 60 * 24 * 3.5) {
      const user = await User.findById(decoded._id);
      const token = user?.generateToken();
      ctx.cookies.set('access_token', token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });
    }

    return next();
  } catch (e) {
    return next();
  }
};

export default jwtMiddleware;
