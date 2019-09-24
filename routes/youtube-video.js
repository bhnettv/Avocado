const express = require( 'express' );
const moment = require( 'moment' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {youtube_video: 'Test'} );
} );

// Read duration of video
// Provided as REST API due to authentication
router.get( '/duration/:video', async ( req, res ) => {
  let details = await rp( {
    url: 'https://www.googleapis.com/youtube/v3/videos',
    method: 'GET',
    qs: {
      id: req.params.video,
      part: 'contentDetails',
      key: req.config.google.youtube
    },
    json: true
  } );
  
  const duration = moment.duration( details.items[0].contentDetails.duration );

  res.json( {
    duration: details.items[0].contentDetails.duration,
    seconds: duration.asSeconds()
  } );
} );

// Read single video by ID
router.get( '/:id', ( req, res ) => {
  let video = req.db.prepare( `
    SELECT
      YouTubeVideo.uuid AS "id",
      YouTubeVideo.created_at,
      YouTubeVideo.updated_at,
      YouTube.uuid AS "youtube_id",
      YouTubeVideo.published_at,
      YouTubeVideo.guid,
      YouTubeVideo.video,
      YouTubeVideo.link,
      YouTubeVideo.title,
      YouTubeVideo.views,
      YouTubeVideo.stars,
      YouTubeVideo.duration,
      YouTubeVideo.thumbnail,
      YouTubeVideo.summary
    FROM 
      YouTube,
      YouTubeVideo
    WHERE 
      YouTubeVideo.youtube_id = YouTube.id AND
      YouTubeVideo.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( video === undefined ) {
    video = null;
  }

  res.json( video );
} );

// Read single video by GUID
// GUIDs are often URLs
// Base64 encoded
router.get( '/guid/:id', ( req, res ) => {
  let buffer = new Buffer.from( req.params.id, 'base64' );
  let guid = buffer.toString( 'utf8' );  

  let video = req.db.prepare( `
    SELECT
      YouTubeVideo.uuid AS "id",
      YouTubeVideo.created_at,
      YouTubeVideo.updated_at,
      YouTube.uuid AS "youtube_id",
      YouTubeVideo.published_at,
      YouTubeVideo.guid,
      YouTubeVideo.video,
      YouTubeVideo.link,
      YouTubeVideo.title,
      YouTubeVideo.views,
      YouTubeVideo.stars,
      YouTubeVideo.duration,
      YouTubeVideo.thumbnail,
      YouTubeVideo.summary
    FROM 
      YouTube,
      YouTubeVideo
    WHERE 
      YouTubeVideo.youtube_id = YouTube.id AND
      YouTubeVideo.guid = ?
  ` )
  .get( 
    guid 
  );

  if( video === undefined ) {
    video = null;
  }

  res.json( video );
} );

// Read all videos
router.get( '/', ( req, res ) => {
  let videos = req.db.prepare( `
    SELECT
      YouTubeVideo.uuid AS "id",
      YouTubeVideo.created_at,
      YouTubeVideo.updated_at,
      YouTube.uuid AS "youtube_id",
      YouTubeVideo.published_at,
      YouTubeVideo.guid,
      YouTubeVideo.video,
      YouTubeVideo.link,
      YouTubeVideo.title,
      YouTubeVideo.views,
      YouTubeVideo.stars,
      YouTubeVideo.duration,
      YouTubeVideo.thumbnail,
      YouTubeVideo.summary
    FROM 
      YouTube,
      YouTubeVideo
    WHERE YouTubeVideo.youtube_id = YouTube.id
    ORDER BY YouTubeVideo.published_at DESC
  ` )
  .all();

  res.json( videos );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    youtube_uuid: req.body.youtube_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    video: req.body.video,
    link: req.body.link,
    title: req.body.title,
    views: req.body.views,
    stars: req.body.stars,
    duration: req.body.duration,
    thumbnail: req.body.thumbnail,
    summary: req.body.summary
  };

  let youtube = req.db.prepare( `
    SELECT YouTube.id
    FROM YouTube
    WHERE YouTube.uuid = ?
  ` )
  .get( 
    record.youtube_uuid
  );
  record.youtube_id = youtube.id;

  let info = req.db.prepare( `
    INSERT INTO YouTubeVideo
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.youtube_id,
    record.published_at,
    record.guid,
    record.video,
    record.link,
    record.title,
    record.views,
    record.stars,
    record.duration,
    record.thumbnail,
    record.summary
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    youtube_id: record.youtube_uuid,
    published_at: record.published_at,
    guid: record.guid,
    video: record.video,
    link: record.link,
    title: record.title,
    views: record.views,
    stars: record.stars,
    duration: record.duration,
    thumbnail: record.thumbnail,
    summary: record.summary
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    youtube_uuid: req.body.youtube_id,
    published_at: req.body.published_at,
    guid: req.body.guid,
    video: req.body.video,
    link: req.body.link,
    title: req.body.title,
    views: req.body.views,
    stars: req.body.stars,
    duration: req.body.duration,
    thumbnail: req.body.thumbnail,
    summary: req.body.summary
  };

  let youtube = req.db.prepare( `
    SELECT YouTube.id
    FROM YouTube
    WHERE YouTube.uuid = ?
  ` )
  .get( 
    record.youtube_uuid
  );
  record.youtube_id = youtube.id;

  let info = req.db.prepare( `
    UPDATE YouTubeVideo
    SET 
      updated_at = ?,
      youtube_id = ?,
      published_at = ?,
      guid = ?,
      video = ?,
      link = ?,
      title = ?,
      views = ?,
      stars = ?,
      duration = ?,
      thumbnail = ?,
      summary = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.youtube_id,
    record.published_at,
    record.guid,
    record.video,
    record.link,
    record.title,
    record.views,
    record.stars,
    record.duration,
    record.thumbnail,
    record.summary,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      YouTubeVideo.uuid AS "id",
      YouTubeVideo.created_at,
      YouTubeVideo.updated_at,
      YouTube.uuid AS "youtube_id",
      YouTubeVideo.published_at,
      YouTubeVideo.guid,
      YouTubeVideo.video,
      YouTubeVideo.link,
      YouTubeVideo.title,
      YouTubeVideo.views,
      YouTubeVideo.stars,
      YouTubeVideo.duration,
      YouTubeVideo.thumbnail,
      YouTubeVideo.summary
    FROM 
      YouTube,
      YouTubeVideo
    WHERE 
      YouTubeVideo.youtube_id = YouTube.id AND
      YouTubeVideo.uuid = ?
  ` )
  .get( 
    record.uuid 
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM YouTubeVideo
    WHERE YouTubeVideo.uuid = ?
  ` )
  .run(
    req.params.id
  );  

  res.json( {
    id: req.params.id
  } );
} );

// Export
module.exports = router;
