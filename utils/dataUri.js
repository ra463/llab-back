import DtaUriParser from "datauri/parser.js";
import path from "path";

const getDataUri = (file) => {
  const parser = new DtaUriParser();
  const pathName = path.extname(file.originalname).toString();

  return parser.format(pathName, file.buffer);
};

export default getDataUri;
