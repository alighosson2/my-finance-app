import { users } from "@prisma/client";
import { UserEntity } from "../model/Usermodel";

export type id = number;

export interface ID {
  getId(): id;
}

export interface initializable {
  init(): Promise<void>;
}

export interface IRepository<T> {
  create(item: T): Promise<T>;
  get(id: id): Promise<T>;
  getAll(): Promise<T[]>;
  delete(id: id): Promise<void>;
  getByEmail(email: string): Promise<T>; // Now required*/
  update(id: id, item: T): Promise<T | null>;
}

export interface initializableRepository<T> extends IRepository<T>, initializable {
  init(): Promise<void>;
}

