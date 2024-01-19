type User = {
  user_id: number;
  user_name: string;
  email: string;
  role: "user" | "admin";
  password: string;
};

type Cat = {
  // owner should be a User or a number
  cat_id: number;
  cat_name: string;
  owner: User | number;
  weight: number;
  filename: string;
  birthdate: string;
  coords: { lat: number; lng: number };
};

export type CatData = Omit<Cat, "cat_id" | "owner"> & {
  owner: number | User;
};
export { Cat, User };
export type NewUserData = Omit<User, "user_id">;

