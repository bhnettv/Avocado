const express = require( 'express' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {reddit: 'Test'} );
} );

// Read single Reddit account by ID
router.get( '/:id', ( req, res ) => {
  let reddit = req.db.prepare( `
    SELECT
      Reddit.uuid AS "id",
      Reddit.created_at,
      Reddit.updated_at,
      Developer.uuid AS "developer_id",
      Reddit.user,
      Reddit.name,
      Reddit.joined_at,
      Reddit.image,
      Reddit.link,
      Reddit.comment
    FROM 
      Developer, 
      Reddit
    WHERE 
      Reddit.developer_id = Developer.id AND
      Reddit.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( reddit === undefined ) {
    reddit = null;
  }

  res.json( reddit );
} );

// Read all Reddit accounts
router.get( '/', ( req, res ) => {
  let reddits = req.db.prepare( `
    SELECT
      Reddit.uuid AS "id",
      Reddit.created_at,
      Reddit.updated_at,
      Developer.uuid AS "developer_id",
      Reddit.user,
      Reddit.name,
      Reddit.joined_at,
      Reddit.image,
      Reddit.link,
      Reddit.comment
    FROM 
      Developer,
      Reddit
    WHERE Reddit.developer_id = Developer.id
    ORDER BY datetime( Reddit.updated_at ) DESC
  ` )
  .all();

  res.json( reddits );
} );

// Create
router.post( '/', async ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user: null,
    name: req.body.name,
    joined_at: null,
    image: null,
    link: 0,
    comment: 0
  };

  let existing = req.db.prepare( `
    SELECT
      Reddit.uuid AS "id",
      Reddit.created_at,
      Reddit.updated_at,
      Developer.uuid AS "developer_id",
      Reddit.user,
      Reddit.name,
      Reddit.joined_at,
      Reddit.image,
      Reddit.link,
      Reddit.comment
    FROM
      Developer,
      Reddit
    WHERE
      Reddit.developer_id = Developer.id AND
      Reddit.name = ?
  ` ).get( 
    record.name
  );

  if( existing === undefined ) {
    let profile = await rp( {
      url: `https://www.reddit.com/user/${record.name}/about.json`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node:Avocado:v1'
      },
      json: true
    } );
  
    record.user = profile.data.id;
    record.joined_at = new Date( profile.data.created_utc * 1000 ).toISOString();
    record.image = profile.data.icon_img;
    record.link = profile.data.link_karma;
    record.comment = profile.data.comment_karma;
 
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
      INSERT INTO Reddit
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.developer_id,
      record.user,
      record.name,
      record.joined_at,
      record.image,
      record.link,
      record.comment
    );
  
    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      user: record.user,
      name: record.name,
      joined_at: record.joined_at,
      image: record.image,
      link: record.link,
      comment: record.comment
    };
  } else {
    record = existing;
  }

  res.json( record );
} );

// Update using API
router.patch( '/:id', async ( req, res ) => {
  let record = req.db.prepare( `
    SELECT
      Reddit.uuid AS "id",
      Reddit.created_at, 
      Reddit.updated_at,
      Developer.uuid AS "developer_id",
      Reddit.user,
      Reddit.name,
      Reddit.joined_at,
      Reddit.image,
      Reddit.link,
      Reddit.comment
    FROM 
      Developer, 
      Reddit
    WHERE 
      Reddit.developer_id = Developer.id AND
      Reddit.uuid = ?
  ` )
  .get( 
    req.params.id
  );

  let profile = await rp( {
    url: `https://www.reddit.com/user/${record.name}/about.json`,
    method: 'GET',
    headers: {
      'User-Agent': 'Node:Avocado:v1'
    },
    json: true
  } );

  record.updated_at = new Date().toISOString();
  record.user = profile.data.id;
  record.joined_at = new Date( profile.data.created_utc * 1000 ).toISOString();
  record.image = profile.data.icon_img;
  record.link = profile.data.link_karma;
  record.comment = profile.data.comment_karma;

  let info = req.db.prepare( `
    UPDATE Reddit
    SET 
      updated_at = ?,
      image = ?,
      link = ?,
      comment = ?
    WHERE name = ?
  ` )
  .run(
    record.updated_at,
    record.image,
    record.link,
    record.comment,
    record.name
  );  

  res.json( record );    
} );

// Update directly
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user: req.body.user,
    name: req.body.name,
    joined_at: req.body.joined_at,
    image: req.body.image,
    link: req.body.link,
    comment: req.body.comment
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
    UPDATE Reddit
    SET 
      updated_at = ?,
      developer_id = ?,
      user = ?,
      name = ?,
      joined_at = ?,
      image = ?,
      link = ?,
      comment = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.user,
    record.name,
    record.joined_at,
    record.image,
    record.link,
    record.comment,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Reddit.uuid AS "id",
      Reddit.created_at, 
      Reddit.updated_at,
      Developer.uuid AS "developer_id",
      Reddit.user,
      Reddit.name,
      Reddit.joined_at,
      Reddit.image,
      Reddit.link,
      Reddit.comment
    FROM 
      Developer, 
      Reddit
    WHERE 
      Reddit.developer_id = Developer.id AND
      Reddit.uuid = ?
  ` )
  .get( 
    record.uuid
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Reddit
    WHERE Reddit.uuid = ?
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
