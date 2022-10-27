import Application from 'koa';
import Router from 'koa-router';

export type TPost = {
  title: string;
  body: string;
  tags: string[];
};
export interface DBUser {
  username: string;
  hashedPassword: string;
}
export type TUser = {
  username: string;
  password: string;
};
export interface DBPost {
  title: string;
  body: string;
  tags: string[];
  publishedDate: {
    type: DateConstructor;
    default: () => number;
  };
  user: {
    _id: string;
    username: string;
  };
}
export type Ctx = Application.ParameterizedContext<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  Router.IRouterParamContext<any, {}>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;
