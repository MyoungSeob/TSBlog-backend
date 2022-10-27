import mongoose, { Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface IUser {
  username: string;
  hashedPassword: string;
}

interface IUserDocument extends IUser, Document {
  setPassword: (password: string) => Promise<void>;
  checkPassword: (password: string) => Promise<boolean>;
  generateToken: () => string;
  serialize: () => unknown;
}

interface IUserModel extends Model<IUserDocument> {
  findByUsername: (username: string) => Promise<IUserDocument>;
}

const UserSchema = new Schema({
  username: { type: String, required: true },
  hashedPassword: { type: String, required: true },
});

UserSchema.methods.setPassword = async function (password: string) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password: string) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username });
};

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

UserSchema.methods.generateToken = function () {
  const token = jwt.sign(
    {
      _id: this.id,
      username: this.username,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: '7d',
    },
  );
  return token;
};

const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);
export default User;
