import {
  addCat,
  deleteCat,
  getAllCats,
  getCat,
  updateCat,
} from "../models/catModel";
import { Request, Response, NextFunction } from "express";
import CustomError from "../../classes/CustomError";
import { validationResult } from "express-validator";
import { Cat} from "../../types/DBTypes";
import { MessageResponse } from "../../types/MessageTypes";

const catListGet = async (_req: Request, res: Response<Cat[]>, next: NextFunction) => {
  try {
    const cats = await getAllCats();
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGet = async (req: Request, res: Response<Cat>, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const cat = await getCat(id);
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

const catPost = async (
  req: Request<{}, {}, Omit<Cat, "owner"> & { owner: number }>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const messages: string = validationErrors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(", ");
      throw new CustomError(messages, 400);
    }

    const { lat, lng } = req.body.coords;
    const catData = {
      ...req.body,
      filename: req.file ? req.file.filename : undefined,
      owner: req.user?.user_id,
      coords: { lat, lng },
    };

    const result = await addCat(catData);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const catPut = async (
  req: Request<{ id: string }, {}, Cat>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const messages: string = validationErrors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(", ");
      throw new CustomError(messages, 400);
    }

    const id = Number(req.params.id);
    const cat = req.body;
    const result = await updateCat(cat, id, req.user.user_id, req.user.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const catDelete = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const messages: string = validationErrors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(", ");
      throw new CustomError(messages, 400);
    }

    const id = Number(req.params.id);
    const result = await deleteCat(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export { catListGet, catGet, catPost, catPut, catDelete };

