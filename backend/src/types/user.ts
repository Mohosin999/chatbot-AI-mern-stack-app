export interface IUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  password: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDoc {
  _doc: IUser;
  id: string;
  name: string;
  email: string;
  password: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
}

export interface IUserWithoutPassword {
  id: string;
  name: string;
  email: string;
}
