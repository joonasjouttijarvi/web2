import { promisePool } from '../../database/db';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Cat } from '../../types/DBTypes';
import { MessageResponse, UploadResponse } from '../../types/MessageTypes';

const getAllCats = async (): Promise<Cat[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Cat[]>(
    `
    SELECT cat_id, cat_name, weight, filename, birthdate, ST_X(coords) as lat, ST_Y(coords) as lng,
    JSON_OBJECT('user_id', sssf_user.user_id, 'user_name', sssf_user.user_name) AS owner 
	  FROM sssf_cat 
	  JOIN sssf_user 
    ON sssf_cat.owner = sssf_user.user_id
    `
  );
  if (rows.length === 0) {
    throw new CustomError('No cats found', 404);
  }
  const cats = (rows as Cat[]).map((row) => ({
    ...row,
    owner: JSON.parse(row.owner?.toString() || '{}'),
  }));

  return cats;
};

// TODO: create getCat function to get single cat
const getCat = async (catId: number): Promise<Cat> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Cat[]>(
    `
    SELECT cat_id, cat_name, weight, filename, birthdate, ST_X(coords) as lat, ST_Y(coords) as lng,
    JSON_OBJECT('user_id', sssf_user.user_id, 'user_name', sssf_user.user_name) AS owner 
    FROM sssf_cat 
    JOIN sssf_user 
    ON sssf_cat.owner = sssf_user.user_id
    WHERE cat_id = ?;
    `,
    [catId]
  );
  if (rows.length === 0) {
    throw new CustomError('Cat not found', 404);
  }
  const cat = {
    ...rows[0],
    owner: JSON.parse(rows[0].owner?.toString() || '{}'),
  };

  return cat;
};

// TODO: use Utility type to modify Cat type for 'data'.
type CatData = Omit<Cat, 'owner'> & { owner: number };
// Note that owner is not User in this case. It's just a number (user_id)
const addCat = async (data: CatData): Promise<MessageResponse> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `
    INSERT INTO sssf_cat (cat_name, weight, owner, filename, birthdate, coords) 
    VALUES (?, ?, ?, ?, ?, POINT(?, ?))
    `,
    [
      data.cat_name,
      data.weight,
      data.owner, 
      data.filename,
      data.birthdate,
      data.lat,
      data.lng,
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('No cats added', 400);
  }
  return { message: 'Cat added' };
};

// TODO: create updateCat function to update single cat
// if role is admin, update any cat
// if role is user, update only cats owned by user
// You can use updateUser function from userModel as a reference for SQL
const updateCat = async (
  catId: number,
  data: Partial<Cat>,
  userId: number,
  userRole: string
): Promise<MessageResponse> => {
  let sql = '';
  const params = [];

  if (userRole === 'admin') {
    sql = 'UPDATE sssf_cat SET ? WHERE cat_id = ?;';
    params.push(data, catId);
  } else {
    sql = 'UPDATE sssf_cat SET ? WHERE cat_id = ? AND owner = ?;';
    params.push(data, catId, userId);
  }

  const [headers] = await promisePool.execute<ResultSetHeader>(sql, params);
  if (headers.affectedRows === 0) {
    throw new CustomError('No cats updated or you do not have permission', 400);
  }
  return { message: 'Cat updated' };
};

const deleteCat = async (catId: number): Promise<MessageResponse> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `
    DELETE FROM sssf_cat 
    WHERE cat_id = ?;
    `,
    [catId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('No cats deleted', 400);
  }
  return { message: 'Cat deleted' };
};

export { getAllCats, getCat, addCat, updateCat, deleteCat };
