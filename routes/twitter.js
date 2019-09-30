const express = require( 'express' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {twitter: 'Test'} );
} );

// Read timeline for a given user
// Part of API surface due to authentication
router.get( '/timeline/:screen_name', async ( req, res ) => {
  let timeline = await rp( {
    url: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
    method: 'GET',
    headers: {
      Authorization: `${req.twitter.token_type} ${req.twitter.access_token}`
    },
    qs: {
      screen_name: req.params.screen_name,
      count: 100,
      tweet_mode: 'extended'
    },
    json: true      
  } );

  res.json( timeline );
} );

// Read single Twitter account by ID
router.get( '/:id', ( req, res ) => {
  let twitter = req.db.prepare( `
    SELECT
      Twitter.uuid AS "id",
      Twitter.created_at, 
      Twitter.updated_at,
      Developer.uuid AS "developer_id",
      Twitter.user,
      Twitter.joined_at,
      Twitter.name,
      Twitter.screen_name,
      Twitter.image,
      Twitter.followers,
      Twitter.friends,
      Twitter.favorites,
      Twitter.count,
      Twitter.location,
      Twitter.description,
      Twitter.url
    FROM 
      Developer, 
      Twitter
    WHERE 
      Twitter.developer_id = Developer.id AND
      Twitter.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( twitter === undefined ) {
    twitter = null;
  }

  res.json( twitter );
} );

// Read all Twitter accounts
router.get( '/', ( req, res ) => {
  let twitters = req.db.prepare( `
    SELECT
      Twitter.uuid AS "id",
      Twitter.created_at, 
      Twitter.updated_at,
      Developer.uuid AS "developer_id",
      Twitter.user,
      Twitter.joined_at,
      Twitter.name,
      Twitter.screen_name,
      Twitter.image,
      Twitter.followers,
      Twitter.friends,
      Twitter.favorites,
      Twitter.count,
      Twitter.location,
      Twitter.description,
      Twitter.url
    FROM 
      Developer,
      Twitter
    WHERE Twitter.developer_id = Developer.id
    ORDER BY datetime( Twitter.updated_at ) DESC
  ` )
  .all();

  res.json( twitters );
} );

// Create
router.post( '/', async ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user: 0,
    joined_at: null,
    name: null,
    screen_name: req.body.screen_name,
    image: null,
    followers: 0,
    friends: 0,
    favorites: 0,
    count: 0,
    location: null,
    description: null,
    url: null
  };  

  let existing = req.db.prepare( `
    SELECT
      Twitter.uuid AS "id",
      Twitter.created_at,
      Twitter.updated_at,
      Developer.uuid AS "developer_id",
      Twitter.user,
      Twitter.joined_at,
      Twitter.name,
      Twitter.screen_name,
      Twitter.image,
      Twitter.followers,
      Twitter.friends,
      Twitter.favorites,
      Twitter.count,
      Twitter.location,
      Twitter.description,
      Twitter.url
    FROM
      Developer,
      Twitter
    WHERE
      Twitter.developer_id = Developer.id AND
      Twitter.screen_name = ?
  ` ).get(
    record.screen_name
  );

  if( existing === undefined ) {
    let profile = await rp( {
      url: 'https://api.twitter.com/1.1/users/show.json',
      method: 'GET',
      headers: {
        Authorization: `${req.twitter.token_type} ${req.twitter.access_token}`
      },
      qs: {
        screen_name: record.screen_name
      },
      json: true
    } );
  
    record.user = profile.id;
    record.joined_at = new Date( profile.created_at ).toISOString();
    record.name = profile.name;
    record.image = profile.profile_image_url_https;
    record.followers = profile.followers_count;
    record.friends = profile.friends_count;
    record.favorites = profile.favourites_count;
    record.count = profile.statuses_count;
    record.location = profile.location;
    record.description = profile.description;
    record.url = profile.url;
  
    let developer = req.db.prepare( `
      SELECT Developer.id
      FROM Developer
      WHERE Developer.uuid = ?
    ` )
    .get( 
      record.developer_uuid
    );
    record.developer_id = developer.id;
  
    let info = req.db.prepare( `
      INSERT INTO Twitter
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.developer_id,
      record.user,
      record.joined_at,
      record.name,
      record.screen_name,
      record.image,
      record.followers,
      record.friends,
      record.favorites,
      record.count,
      record.location,
      record.description,
      record.url
    );
  
    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      user: record.user,
      joined_at: record.joined_at,
      name: record.name,
      screen_name: record.screen_name,
      image: record.image,
      followers: record.followers,
      friends: record.friends,
      favorites: record.favorites,
      count: record.count,
      location: record.location,
      description: record.description,
      url: record.url
    };
  } else {
    record = existing;
  }

  res.json( record );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user: req.body.user,
    joined_at: req.body.joined_at,
    name: req.body.name,
    screen_name: req.body.screen_name,
    image: req.body.image,
    followers: req.body.followers,
    friends: req.body.friends,
    favorites: req.body.favorites,
    count: req.body.count,
    location: req.body.location,
    description: req.body.description,
    url: req.body.url
  };

  let developer = req.db.prepare( `
    SELECT Developer.id
    FROM Developer
    WHERE Developer.uuid = ?
  ` )
  .get( 
    record.developer_uuid
  );
  record.developer_id = developer.id;

  let info = req.db.prepare( `
    UPDATE Twitter
    SET 
      updated_at = ?,
      developer_id = ?,
      user = ?,
      joined_at = ?,
      name = ?,
      screen_name = ?,
      image = ?,
      followers = ?,
      friends = ?,
      favorites = ?,
      count = ?,
      location = ?,
      description = ?,
      url = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.user,
    record.joined_at,
    record.name,
    record.screen_name,
    record.image,
    record.followers,
    record.friends,
    record.favorites,
    record.count,
    record.location,
    record.description,
    record.url,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Twitter.uuid AS "id",
      Twitter.created_at, 
      Twitter.updated_at,
      Developer.uuid AS "developer_id",
      Twitter.user,
      Twitter.joined_at,
      Twitter.name,
      Twitter.screen_name,
      Twitter.image,
      Twitter.followers,
      Twitter.friends,
      Twitter.favorites,
      Twitter.count,
      Twitter.location,
      Twitter.description,
      Twitter.url
    FROM 
      Developer, 
      Twitter
    WHERE 
      Twitter.developer_id = Developer.id AND
      Twitter.uuid = ?
  ` )
  .get( 
    record.uuid
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Twitter
    WHERE Twitter.uuid = ?
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
