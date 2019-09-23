const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {twitter_status: 'Test'} );
} );

// Read single status by ID
router.get( '/:id', ( req, res ) => {
  let status = req.db.prepare( `
    SELECT
      TwitterStatus.uuid AS "id",
      TwitterStatus.created_at,
      TwitterStatus.updated_at,
      Twitter.uuid AS "twitter_id",
      TwitterStatus.published_at,
      TwitterStatus.status,
      TwitterStatus.link,
      TwitterStatus.full_text,
      TwitterStatus.favorite,
      TwitterStatus.retweet,
      TwitterStatus.hashtags,
      TwitterStatus.mentions,
      TwitterStatus.urls
    FROM 
      Twitter,
      TwitterStatus
    WHERE 
      TwitterStatus.twitter_id = Twitter.id AND
      TwitterStatus.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( status === undefined ) {
    status = null;
  } else {
    if( status.hashtags === null ) {
      status.hashtags = [];
    } else {
      status.hashtags = status.hashtags.split( ',' );
    }

    if( status.mentions === null ) {
      status.mentions = [];
    } else {
      status.mentions = status.mentions.split( ',' );
    }

    if( status.urls === null ) {
      status.urls = [];
    } else {
      status.urls = status.urls.split( ',' );
    }    
  }

  res.json( status );
} );

// Read all media for specific status
router.get( '/:id/media', ( req, res ) => {
  let medias = req.db.prepare( `
    SELECT
      Media.uuid AS "id",
      Media.created_at,
      Media.updated_at,
      Media.url,
      Media.keywords
    FROM 
      Media,
      TwitterStatus,
      TwitterStatusMedia
    WHERE 
      Media.id = TwitterStatusMedia.media_id AND
      TwitterStatusMedia.status_id = TwitterStatus.id AND
      TwitterStatus.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  for( let m = 0; m < medias.length; m++ ) {
    if( medias[m].keywords === null ) {
      medias[m].keywords = [];
    } else {
      medias[m].keywords = medias[m].keywords.split( ',' );
    }
  }

  res.json( medias );
} );

// Read single status by Twitter's status ID
router.get( '/id/:id', ( req, res ) => {
  let status = req.db.prepare( `
    SELECT
      TwitterStatus.uuid AS "id",
      TwitterStatus.created_at,
      TwitterStatus.updated_at,
      Twitter.uuid AS "twitter_id",
      TwitterStatus.published_at,
      TwitterStatus.status,
      TwitterStatus.link,
      TwitterStatus.full_text,
      TwitterStatus.favorite,
      TwitterStatus.retweet,
      TwitterStatus.hashtags,
      TwitterStatus.mentions,
      TwitterStatus.urls
    FROM 
      Twitter,
      TwitterStatus
    WHERE 
      TwitterStatus.twitter_id = Twitter.id AND
      TwitterStatus.status = ?
  ` )
  .get( 
    req.params.id
  );

  if( status === undefined ) {
    status = null;
  } else {
    if( status.hashtags === null ) {
      status.hashtags = [];
    } else {
      status.hashtags = status.hashtags.split( ',' );
    }

    if( status.mentions === null ) {
      status.mentions = [];
    } else {
      status.mentions = status.mentions.split( ',' );
    }

    if( status.urls === null ) {
      status.urls = [];
    } else {
      status.urls = status.urls.split( ',' );
    }    
  }

  res.json( status );
} );

// Read all status updates
router.get( '/', ( req, res ) => {
  let updates = req.db.prepare( `
    SELECT
      TwitterStatus.uuid AS "id",
      TwitterStatus.created_at,
      TwitterStatus.updated_at,
      Twitter.uuid AS "twitter_id",
      TwitterStatus.published_at,
      TwitterStatus.status,
      TwitterStatus.link,
      TwitterStatus.full_text,
      TwitterStatus.favorite,
      TwitterStatus.retweet,
      TwitterStatus.hashtags,
      TwitterStatus.mentions
    FROM 
      Twitter,
      TwitterStatus
    WHERE TwitterStatus.twitter_id = Twitter.id
    ORDER BY TwitterStatus.published_at DESC
  ` )
  .all();

  for( let u = 0; u < updates.length; u++ ) {
    if( updates[u].hashtags === null ) {
      updates[u].hashtags = [];
    } else {
      updates[u].hashtags = updates[u].hashtags.split( ',' );
    }

    if( updates[u].mentions === null ) {
      updates[u].mentions = [];
    } else {
      updates[u].mentions = updates[u].mentions.split( ',' );
    }

    if( updates[u].urls === null ) {
      updates[u].urls = [];
    } else {
      updates[u].urls = updates[u].urls.split( ',' );
    }    
  }

  res.json( updates );
} );

// Associate media with post
router.post( '/:id/media', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status_uuid: req.params.id,
    media_uuid: req.body.media_id
  };

  let ids = req.db.prepare( `
    SELECT
      TwitterStatus.id AS "status_id",
      Media.id AS "media_id"
    FROM
      TwitterStatus,   
      Media
    WHERE
      TwitterStatus.uuid = ? AND
      Media.uuid = ?
  ` )
  .get( 
    record.status_uuid,
    record.media_uuid
  );
  record.status_id = ids.status_id;
  record.media_id = ids.media_id;

  let info = req.db.prepare( `
    INSERT INTO TwitterStatusMedia
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.status_id,
    record.media_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    status_id: record.status_uuid,
    media_id: record.media_uuid
  } );  
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    twitter_uuid: req.body.twitter_id,
    published_at: req.body.published_at,
    status: req.body.status,
    link: req.body.link,
    full_text: req.body.full_text,
    favorite: req.body.favorite,
    retweet: req.body.retweet,
    hashtags: req.body.hashtags,
    mentions: req.body.mentions,
    urls: req.body.urls
  };

  if( record.hashtags.length === 0 ) {
    record.hashtags = null;
  } else {
    record.hashtags = record.hashtags.join( ',' );
  }

  if( record.mentions.length === 0 ) {
    record.mentions = null;
  } else {
    record.mentions = record.mentions.join( ',' );
  }    

  if( record.urls.length === 0 ) {
    record.urls = null;
  } else {
    record.urls = record.urls.join( ',' );
  }      

  let twitter = req.db.prepare( `
    SELECT Twitter.id
    FROM Twitter
    WHERE Twitter.uuid = ?
  ` )
  .get( 
    record.twitter_uuid
  );
  record.twitter_id = twitter.id;

  let info = req.db.prepare( `
    INSERT INTO TwitterStatus
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.twitter_id,
    record.published_at,
    record.status,
    record.link,
    record.full_text,
    record.favorite,
    record.retweet,
    record.hashtags,
    record.mentions,
    record.urls
  );

  if( record.hashtags === null ) {
    record.hashtags = [];
  } else {
    record.hashtags = record.hashtags.split( ',' );
  }

  if( record.mentions === null ) {
    record.mentions = [];
  } else {    
    record.mentions = record.mentions.split( ',' );
  }  

  if( record.urls === null ) {
    record.urls = [];
  } else {    
    record.urls = record.urls.split( ',' );
  }    

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    twitter_id: record.twitter_uuid,
    published_at: record.published_at,
    status: record.status,
    link: record.link,
    full_text: record.full_text,
    favorite: record.favorite,
    retweet: record.retweet,
    hashtags: record.hashtags,
    mentions: record.mentions,
    urls: record.urls
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    twitter_uuid: req.body.twitter_id,
    published_at: req.body.published_at,
    status: req.body.status,
    link: req.body.link,
    full_text: req.body.full_text,
    favorite: req.body.favorite,
    retweet: req.body.retweet,
    hashtags: req.body.hashtags,
    mentions: req.body.mentions,
    urls: req.body.urls
  };

  if( record.hashtags.length === 0 ) {
    record.hashtags = null;
  } else {
    record.hashtags = record.hashtags.join( ',' );
  }

  if( record.mentions.length === 0 ) {
    record.mentions = null;
  } else {
    record.mentions = record.mentions.join( ',' );
  }    

  if( record.urls.length === 0 ) {
    record.urls = null;
  } else {
    record.urls = record.urls.join( ',' );
  }      

  let twitter = req.db.prepare( `
    SELECT Twitter.id
    FROM Twitter
    WHERE Twitter.uuid = ?
  ` )
  .get( 
    record.twitter_uuid
  );
  record.twitter_id = twitter.id;

  let info = req.db.prepare( `
    UPDATE TwitterStatus
    SET 
      updated_at = ?,
      twitter_id = ?,
      published_at = ?,
      status = ?,
      link = ?,
      full_text = ?,
      favorite = ?,
      retweet = ?,
      hashtags = ?,
      mentions = ?,
      urls = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.twitter_id,
    record.published_at,
    record.status,
    record.link,
    record.full_text,
    record.favorite,
    record.retweet,
    record.hashtags,
    record.mentions,
    record.urls,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      TwitterStatus.uuid AS "id",
      TwitterStatus.created_at,
      TwitterStatus.updated_at,
      Twitter.uuid AS "twitter_id",
      TwitterStatus.published_at,
      TwitterStatus.status,
      TwitterStatus.link,
      TwitterStatus.full_text,
      TwitterStatus.favorite,
      TwitterStatus.retweet,
      TwitterStatus.hashtags,
      TwitterStatus.mentions,
      TwitterStatus.urls
    FROM 
      Twitter,
      TwitterStatus
    WHERE 
      TwitterStatus.twitter_id = Twitter.id AND
      TwitterStatus.uuid = ?
  ` )
  .get( 
    record.uuid 
  );

  if( record.hashtags === null ) {
    record.hashtags = [];
  } else {
    record.hashtags = record.hashtags.split( ',' );
  }

  if( record.mentions === null ) {
    record.mentions = [];
  } else {    
    record.mentions = record.mentions.split( ',' );
  }  

  if( record.urls === null ) {
    record.urls = [];
  } else {    
    record.urls = record.urls.split( ',' );
  }    

  res.json( record );  
} );

// Remove media associated with post
router.delete( '/:status/media/:media', ( req, res ) => {
  let ids = req.db.prepare( `
    SELECT
      TwitterStatus.id AS "status_id",
      Media.id AS "media_id"
    FROM
      Media,
      TwitterStatus
    WHERE
      TwitterStatus.uuid = ? AND
      Media.uuid = ?    
  ` )
  .get( 
    req.params.status_id,
    req.params.media
  );

  let info = req.db.prepare( `
    DELETE FROM TwitterStatusMedia
    WHERE 
      TwitterStatusMedia.status_id = ? AND
      TwitterStatusMedia.media_id = ?
  ` )
  .run(
    ids.status_id,
    ids.media_id
  );  

  res.json( {
    status_id: req.params.status,
    media_id: req.params.media
  } );
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM TwitterStatus
    WHERE TwitterStatus.uuid = ?
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
