// FILE: server/src/routes/videoRoutes.ts

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadVideo, getVideoFeed, getVideoDetails, interactWithVideo } from '../controllers/videoController';

const videoRouter = Router();

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     // Accept video files
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files are allowed'));
//     }
//   },
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  },
});
// Upload video for a token
videoRouter.post('/upload', upload.single('video'), uploadVideo);

// Get video feed (latest videos)
videoRouter.get('/feed', getVideoFeed);

// Get video details with interactions
videoRouter.get('/:id', getVideoDetails);

// Handle video interactions (like, comment, share)
videoRouter.post('/:id/interact', interactWithVideo);

export default videoRouter;