// FILE: server/src/routes/videoRoutes.ts

import { Router } from 'express';
import multer from 'multer';
import { uploadVideo, getVideoFeed, getVideoDetails, interactWithVideo } from '../controllers/videoController';

const videoRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
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