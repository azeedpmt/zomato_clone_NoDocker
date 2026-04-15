import DataURIParser from "datauri/parser.js";
import { Path } from "mongoose";
import path from 'path'
const getBuffer=(file:any)=>{
    const parser=new DataURIParser()
    const extName=path.extname(file.originalname).toString();
    return parser.format(extName,file.buffer);
};

export default getBuffer;