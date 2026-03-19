// FILE: server/src/controllers/videoController.ts

import { Request, Response } from 'express';
import { uploadFileToCloudinary } from '../utils/cloudinary';
import { uploadToIpfs } from '../utils/ipfs';
import knex from '../db/knex';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

interface VideoUploadRequest {
  tokenMint: string;
  title?: string;
  description?: string;
}

interface VideoInteractionRequest {
  interactionType: 'like' | 'comment' | 'share';
  commentContent?: string;
}

// Upload video for a token
// export async function uploadVideo(req: Request, res: Response): Promise<void> {
//   try {
//     const { tokenMint, title, description, userId } = req.body as VideoUploadRequest & { userId: string };
//     const userPrivyId = userId;

//     if (!userPrivyId) {
//       res.status(401).json({ success: false, error: 'Unauthorized - missing userId' });
//       return;
//     }

//     if (!tokenMint) {
//       res.status(400).json({ success: false, error: 'Token mint is required' });
//       return;
//     }

//     if (!req.file) {
//       res.status(400).json({ success: false, error: 'Video file is required' });
//       return;
//     }

//     // Check if token exists
//     const token = await knex('tokens').where('mint_address', tokenMint).first();
//     if (!token) {
//       res.status(404).json({ success: false, error: 'Token not found' });
//       return;
//     }

//     // Generate unique filename
//     const videoId = uuidv4();
//     const fileExtension = req.file.originalname.split('.').pop() || 'mp4';
//     const videoFileName = `videos/${videoId}.${fileExtension}`;

//     // Upload video to Cloudinary
//     // Use a folder path to keep uploads organized
//     const cloudinaryPublicId = `token_videos/${videoId}`;
//     const videoUrl = await uploadFileToCloudinary(
//       req.file.buffer,
//       cloudinaryPublicId,
//       'token_videos',
//     );
//     // const thumbnailUrl = videoUrl.replace(
//     //   '/upload/',
//     //   '/upload/so_1,f_jpg/' 
//     // );

//     const thumbnailUrl = videoUrl.replace(
//       '/upload/',
//       '/upload/so_1,f_jpg,w_400,h_600,c_fill/'
//     );
//     // Create video record
//     const videoData = {
//       id: videoId,
//       token_mint: tokenMint,
//       user_privy_id: userPrivyId,
//       video_url: videoUrl,
//       thumbnail_url: thumbnailUrl, // ✅ ADD THIS LINE
//       title: title || null,
//       description: description || null,
//       metadata: JSON.stringify({
//         originalName: req.file.originalname,
//         size: req.file.size,
//         mimeType: req.file.mimetype,
//       }),
//     };

//     await knex('videos').insert(videoData);

//     // Update token with video URL
//     await knex('tokens')
//       .where('mint_address', tokenMint)
//       .update({ video_url: videoUrl });

//     res.json({
//       success: true,
//       video: videoData,
//     });
//   } catch (err: any) {
//     console.error('[uploadVideo] Error:', err);
//     res.status(500).json({
//       success: false,
//       error: err?.message || 'Unknown error uploading video.',
//     });
//   }
// }

export async function uploadVideo(req: Request, res: Response): Promise<void> {
  try {
    console.log("vedio upload started00");
    const { tokenMint, title, description, userId } =
      req.body as VideoUploadRequest & { userId: string };

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized - missing userId' });
      return;
    }

    if (!tokenMint) {
      res.status(400).json({ success: false, error: 'Token mint is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'Video file is required' });
      return;
    }

    const token = await knex('tokens')
      .where('mint_address', tokenMint)
      .first();

    if (!token) {
      res.status(404).json({ success: false, error: 'Token not found' });
      return;
    }

    const videoId = uuidv4();
    const filePath = req.file.path; // ✅ use file path
    const cloudinaryPublicId = `token_videos/${videoId}`;
    console.log("vedio upload filepath", filePath);
    console.log("vedio upload cloudinaryPublicId", cloudinaryPublicId);
    
    // ✅ upload using file path (stream)
    const videoUrl = await uploadFileToCloudinary(
      filePath,
      cloudinaryPublicId,
      'token_videos'
    );
    console.log("vedio upload videoUrl", videoUrl);
    // ✅ delete local file after upload
    fs.unlinkSync(filePath);

    const thumbnailUrl = videoUrl.replace(
      '/upload/',
      '/upload/so_1,f_jpg,w_400,h_600,c_fill/'
    );

    const videoData = {
      id: videoId,
      token_mint: tokenMint,
      user_privy_id: userId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      title: title || null,
      description: description || null,
      metadata: JSON.stringify({
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      }),
    };

    await knex('videos').insert(videoData);

    await knex('tokens')
      .where('mint_address', tokenMint)
      .update({ video_url: videoUrl });

    res.json({
      success: true,
      video: videoData,
    });
    console.log("vedio upload completed");
  } catch (err: any) {
    console.error('[uploadVideo] Error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Unknown error uploading video.',
    });
  }
}

// Get video feed (latest videos)
export async function getVideoFeed(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const videos = await knex('videos')
      .select(
        'videos.*',
        'tokens.name as token_name',
        'tokens.symbol as token_symbol',
        'tokens.image as token_image',
        'users.username',
        'users.profile_image_url'
      )
      .join('tokens', 'videos.token_mint', 'tokens.mint_address')
      .join('users', 'videos.user_privy_id', 'users.privy_id')
      .orderBy('videos.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get token stats for each video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const stats = await knex('token_stats')
          .where('token_mint', video.token_mint)
          .first();

        return {
          ...video,
          tokenStats: stats || null,
        };
      })
    );

    res.json({
      success: true,
      videos: videosWithStats,
      hasMore: videos.length === limit,
    });
  } catch (err: any) {
    console.error('[getVideoFeed] Error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to load video feed',
    });
  }
}

// Get video details with interactions
export async function getVideoDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.query as { userId?: string };
    const userPrivyId = userId;

    if (!id) {
      res.status(400).json({ success: false, error: 'Video ID is required' });
      return;
    }

    // Get video with token and user info
    const video = await knex('videos')
      .select(
        'videos.*',
        'tokens.name as token_name',
        'tokens.symbol as token_symbol',
        'tokens.image as token_image',
        'users.username',
        'users.profile_image_url'
      )
      .join('tokens', 'videos.token_mint', 'tokens.mint_address')
      .join('users', 'videos.user_privy_id', 'users.privy_id')
      .where('videos.id', id)
      .first();

    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    // Get token stats
    const tokenStats = await knex('token_stats')
      .where('token_mint', video.token_mint)
      .first();

    // Get user's interactions with this video
    let userInteractions = null;
    if (userPrivyId) {
      userInteractions = await knex('video_interactions')
        .where({
          video_id: id,
          user_privy_id: userPrivyId,
        })
        .select('interaction_type');
    }

    // Get recent comments
    const comments = await knex('video_interactions')
      .select(
        'video_interactions.*',
        'users.username',
        'users.profile_image_url'
      )
      .join('users', 'video_interactions.user_privy_id', 'users.privy_id')
      .where({
        video_id: id,
        interaction_type: 'comment',
      })
      .orderBy('video_interactions.created_at', 'desc')
      .limit(20);

    // Increment view count
    await knex('videos')
      .where('id', id)
      .increment('views_count', 1);

    res.json({
      success: true,
      video: {
        ...video,
        tokenStats,
        userInteractions: userInteractions?.map(i => i.interaction_type) || [],
        comments,
      },
    });
  } catch (err: any) {
    console.error('[getVideoDetails] Error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to load video details',
    });
  }
}

// Handle video interactions (like, comment, share)
export async function interactWithVideo(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { interactionType, commentContent, userId } = req.body as VideoInteractionRequest & { userId: string };
    const userPrivyId = userId;

    if (!userPrivyId) {
      res.status(401).json({ success: false, error: 'Unauthorized - missing userId' });
      return;
    }

    if (!id || !interactionType) {
      res.status(400).json({ success: false, error: 'Video ID and interaction type are required' });
      return;
    }

    if (!['like', 'comment', 'share'].includes(interactionType)) {
      res.status(400).json({ success: false, error: 'Invalid interaction type' });
      return;
    }

    if (interactionType === 'comment' && !commentContent?.trim()) {
      res.status(400).json({ success: false, error: 'Comment content is required' });
      return;
    }

    // Check if video exists
    const video = await knex('videos').where('id', id).first();
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    // Check if interaction already exists
    const existingInteraction = await knex('video_interactions')
      .where({
        video_id: id,
        user_privy_id: userPrivyId,
        interaction_type: interactionType,
      })
      .first();

    if (existingInteraction) {
      // Remove interaction (unlike/uncomment)
      await knex('video_interactions')
        .where('id', existingInteraction.id)
        .del();

      // Decrement count
      const countField = `${interactionType}s_count`;
      await knex('videos')
        .where('id', id)
        .decrement(countField, 1);

      res.json({
        success: true,
        action: 'removed',
        interactionType,
      });
    } else {
      // Add interaction
      const interactionData: any = {
        video_id: id,
        user_privy_id: userPrivyId,
        interaction_type: interactionType,
      };

      if (interactionType === 'comment') {
        interactionData.comment_content = (commentContent || '').trim();
      }

      await knex('video_interactions').insert(interactionData);

      // Increment count
      const countField = `${interactionType}s_count`;
      await knex('videos')
        .where('id', id)
        .increment(countField, 1);

      res.json({
        success: true,
        action: 'added',
        interactionType,
      });
    }
  } catch (err: any) {
    console.error('[interactWithVideo] Error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to process interaction',
    });
  }
}