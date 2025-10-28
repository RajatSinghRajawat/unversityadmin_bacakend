const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log("data in multer")
    cb(null, "public/Uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + " " + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /avif|jpeg|jpg|png|webp|gif|mp4/; 
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb("invalid file type" , false)
      // const error = {
      //   message: "Incorrect file type",
      //   details: {
      //     allowedExtensions: ["jpeg", "jpg", "png", "gif", "mp4"],
      //     receivedExtension: path.extname(file.originalname),
      //   },
      // };
      // return cb({ error, status: 0 });
    }
  },
});

// Excel file filter for uploads
const excelFileFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel' ||
                   file.mimetype === 'application/octet-stream';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb("Only Excel files (.xlsx, .xls) are allowed", false);
  }
};

const uploadExcel = multer({
  storage: storage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = {
  upload: upload,
  uploadExcel: uploadExcel
};
