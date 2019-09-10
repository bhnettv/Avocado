const express = require( 'express' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {medium: 'Test'} );
} );

// Read single Medium account by ID
router.get( '/id/:id', ( req, res ) => {
  let medium = req.db.prepare( `
    SELECT
      Medium.uuid AS "id",
      Medium.created_at, 
      Medium.updated_at,
      Developer.uuid AS "developer_id",
      Medium.user_name
    FROM 
      Developer, 
      Medium
    WHERE 
      Medium.developer_id = Developer.id AND
      Medium.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( medium === undefined ) {
    medium = null;
  }

  res.json( medium );
} );

// Read all Medium accounts
router.get( '/', ( req, res ) => {
  let mediums = req.db.prepare( `
    SELECT
      Medium.uuid AS "id",
      Medium.created_at, 
      Medium.updated_at,
      Developer.uuid AS "developer_id",
      Medium.user_name
    FROM 
      Developer,
      Medium
    WHERE Medium.developer_id = Developer.id
    ORDER BY Medium.updated_at DESC
  ` )
  .all();

  res.json( mediums );
} );

// Get statistics for account
router.post( '/statistics', async ( req, res ) => {
  const FOLLOWING = 'followingCount":';
  const FOLLOWED = 'followerCount":';

  let body = await rp( {
    url: `https://medium.com/@${req.body.user_name}`,
    method: 'GET'
  } );

  let start = body.indexOf( FOLLOWING ) + FOLLOWING.length;
  let end = body.indexOf( ',', start );
  const following = parseInt( body.substring( start, end ) );

  start = body.indexOf( FOLLOWED ) + FOLLOWED.length;
  end = body.indexOf( ',', start );
  const followed = parseInt( body.substring( start, end ) );

  res.json( {
    following: following,
    followed_by: followed
  } );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user_name: req.body.user_name,
    following: req.body.following,
    followed_by: req.body.followed_by
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
    INSERT INTO Medium
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.user_name,
    record.following,
    record.followed_by
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    user_name: record.user_name,
    following: record.following,
    followed_by: record.followed_by
  } );
} );

// Update
router.put( '/id/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user_name: req.body.user_name,
    following: req.body.following,
    followed_by: req.body.followed_by
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
    UPDATE Medium
    SET 
      updated_at = ?,
      developer_id = ?,
      user_name = ?,
      following = ?,
      followed_by = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.user_name,
    record.following,
    record.followed_by,
    record.uuid
  );

  res.json( {
    id: record.uuid,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    user_name: record.user_name,
    following: record.following,
    followed_by: record.followed_by
  } );  
} );

// Delete
router.delete( '/id/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Medium
    WHERE Medium.uuid = ?
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
