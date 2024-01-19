import {
  addUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
} from "../models/userModel";
import { Request, Response, NextFunction } from "express";
import CustomError from "../../classes/CustomError";
import bcrypt from "bcryptjs";
import { User } from "../../types/DBTypes";
import { MessageResponse } from "../../types/MessageTypes";
import { validationResult } from "express-validator";

const userListGet = async (
  _req: Request,
  res: Response<User[]>,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userGet = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const user = await getUser(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// TDOD: create userPost function to add new user
// userPost should use addUser function from userModel
// userPost should use validationResult to validate req.body
// - user_name should be at least 3 characters long
// - email should be a valid email
// - password should be at least 5 characters long
// userPost should use bcrypt to hash password
const userPost = async (
  req: Request<{}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    // Validate the request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(", ");
      throw new CustomError(messages, 400);
    }

    const { user_name, email, password } = req.body;

    if (user_name.length < 3) {
      throw new CustomError(
        "Username should be at least 3 characters long.",
        400
      );
    }
    if (!email.includes("@")) {
      throw new CustomError("Invalid email address.", 400);
    }
    if (password.length < 5) {
      throw new CustomError(
        "Password should be at least 5 characters long.",
        400
      );
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await addUser({
      ...req.body,
      password: hashedPassword,
    });

    res.json({ message: "User added"});
  } catch (error) {
    next(error);
  }
};

const userPut = async (
  req: Request<{ id: number }, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(", ");
    console.log("cat_post validation", messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && req.user.role !== "admin") {
      throw new CustomError("Admin only", 403);
    }

    const user = req.body;

    const result = await updateUser(user, req.params.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// userPutCurrent should use updateUser function from userModel
// userPutCurrent should use validationResult to validate req.body

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(", ");
    console.log("cat_post validation", messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (!req.user?.user_id) {
      throw new CustomError("No user", 400);
    }
    const user = req.body;

    const result = await updateUser(user, req.user.user_id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// userDelete should use deleteUser function from userModel
// userDelete should use validationResult to validate req.params.id
// userDelete should use req.user to get role
const userDelete = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(", ");
    console.log("cat_post validation", messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && req.user.role !== "admin") {
      throw new CustomError("Admin only", 403);
    }

    const result = await deleteUser(Number(req.params.id));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(", ");
    console.log("cat_post validation", messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (!req.user?.user_id) {
      throw new CustomError("No user", 400);
    }
    const result = await deleteUser(req.user.user_id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError("token not valid", 403));
  } else {
    res.json(req.user);
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPut,
  userPutCurrent,
  userDelete,
  userDeleteCurrent,
  checkToken,
};
