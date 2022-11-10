import { TPost } from '../../types';
import Post from '../../models/post';
import mongoose from 'mongoose';
import Router from 'koa-router';
import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';

const { ObjectId } = mongoose.Types;
const sanitizeOption: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'u',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};

export const getPostById = async (
  ctx: Router.IRouterContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next: () => Promise<any>,
) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400;
    return;
  }
  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.status = 404;
      return;
    }
    console.log(post);
    ctx.state.post = post;
    return next();
  } catch (e) {
    if (e instanceof Error) {
      ctx.throw(e.message, 500);
    } else {
      ctx.throw(String(e), 500);
    }
  }
};

/*
  POST /api/posts
  {
    title : '제목',
    body : '내용',
    tags : ['태그1', '태그 2'],
  }
*/

export const write = async (ctx: Router.IRouterContext) => {
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
  });

  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { body, tags, title } = <TPost>ctx.request.body;
  const post = new Post({
    title,
    body: sanitizeHtml(body, sanitizeOption),
    tags,
    user: ctx.state.user,
  });
  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    if (e instanceof Error) {
      ctx.throw(e.message, 500);
    } else {
      ctx.throw(String(e), 500);
    }
  }
};

/*
  GET /api/posts?username=&tag=&page=
*/

const removeHtmlAndShorten = (body: any) => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });

  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

export const list = async (ctx: Router.IRouterContext) => {
  const page = parseInt((ctx.query.page as string) || '1', 10);

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  const { tag, username } = ctx.query;
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: tag } : {}),
  };

  try {
    const posts = await Post.find()
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .exec();
    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last_Page', String(Math.ceil(postCount / 10)));
    ctx.body = posts.map((item) => {
      return {
        user: {
          _id: item.user._id,
          username: item.user.username,
        },
        _id: item._id,
        title: item.title,
        body: removeHtmlAndShorten(item.body),
        tags: item.tags,
        publishedDate: item.publishedDate,
        __v: item.__v,
      };
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
  GET /api/posts/:id
*/

export const read = async (ctx: Router.IRouterContext) => {
  console.log(ctx.state);
  ctx.body = ctx.state.post;
};

/*
  DELETE /api/posts/:id
*/

export const remove = async (ctx: Router.IRouterContext) => {
  const { id } = ctx.params;
  try {
    await Post.findByIdAndRemove(id).exec();
    ctx.status = 204;
  } catch (e) {
    if (e instanceof Error) {
      ctx.throw(e.message, 500);
    } else {
      ctx.throw(String(e), 500);
    }
  }
};

/*
  PATCH /api/posts/:id
  {
    title : "수정",
    body : "수정 내용",
    tags : ["수정", "태그"]
  }
*/

export const update = async (ctx: Router.IRouterContext) => {
  const { id } = ctx.params;

  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const nextData: Record<string, unknown> | undefined = { ...ctx.request.body };
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body as string, sanitizeOption);
  }

  try {
    const post = await Post.findByIdAndUpdate(id, nextData, {
      new: true,
    }).exec();
    console.log(post);
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    if (e instanceof Error) {
      ctx.throw(e.message, 500);
    } else {
      ctx.throw(String(e), 500);
    }
  }
};

export const checkOwnPost = (
  ctx: Router.IRouterContext,
  next: () => Promise<void>,
) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};
