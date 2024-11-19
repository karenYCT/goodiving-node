import multer from "multer";
import { v4 } from "uuid";

// 1. 篩選檔案, 2. 決定副檔名
const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const fileFilter = (req, file, cb) => {
  // 檢查檔案類型
  if (!extMap[file.mimetype]) {
    cb(new Error('不支援的檔案格式'), false);
    return;
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img");
  },
  filename: (req, file, cb) => {
    const f = v4() + extMap[file.mimetype];
    cb(null, f);
  },
});

// 新增加的：設定 multer 選項
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 設定為 10MB
    files: 3 // 最多 3 個檔案
  }
});

// 匯出一個包裝過的 middleware
export default upload;
// export default multer({ fileFilter, storage });
