import Router from 'koa-router';

const checkLoggedIn = (
  ctx: Router.IRouterContext,
  next: () => Promise<void>,
) => {
  if (!ctx.state.user) {
    ctx.status = 401;
    return;
  }
  return next();
};

export default checkLoggedIn;
