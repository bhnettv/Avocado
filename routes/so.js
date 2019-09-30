const express = require( 'express' );
const rp = require( 'request-promise-native' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {so: 'Test'} );
} );

// Read answers for a given user
// Part of API surface due to authentication
router.get( '/answers/:account', async ( req, res ) => {
  let answers = await rp( {
    url: `https://api.stackexchange.com/2.2/users/${req.params.account}/answers`,
    method: 'GET',
    headers: {
      Authorization: `${req.twitter.token_type} ${req.twitter.access_token}`
    },
    qs: {
      order: 'desc',
      sort: 'activity',
      site: 'stackoverflow',
      pagesize: 100,
      key: req.config.stackoverflow.key
    },
    gzip: true,
    json: true      
  } );

  res.json( answers.items );
} );

// Read single Stack Overflow account by ID
router.get( '/:id', ( req, res ) => {
  let so = req.db.prepare( `
    SELECT
      StackOverflow.uuid AS "id",
      StackOverflow.created_at, 
      StackOverflow.updated_at,
      Developer.uuid AS "developer_id",
      StackOverflow.user,
      StackOverflow.account,
      StackOverflow.joined_at,
      StackOverflow.reputation,
      StackOverflow.accept_rate,
      StackOverflow.name,
      StackOverflow.location,
      StackOverflow.website,
      StackOverflow.link,
      StackOverflow.image
    FROM 
      Developer, 
      StackOverflow
    WHERE 
      StackOverflow.developer_id = Developer.id AND
      StackOverflow.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( so === undefined ) {
    so = null;
  }

  res.json( so );
} );

// Read all Stack Overflow accounts
router.get( '/', ( req, res ) => {
  let sos = req.db.prepare( `
    SELECT
      StackOverflow.uuid AS "id",
      StackOverflow.created_at, 
      StackOverflow.updated_at,
      Developer.uuid AS "developer_id",
      StackOverflow.user,
      StackOverflow.account,
      StackOverflow.joined_at,
      StackOverflow.reputation,
      StackOverflow.accept_rate,
      StackOverflow.name,
      StackOverflow.location,
      StackOverflow.website,
      StackOverflow.link,
      StackOverflow.image
    FROM 
      Developer,
      StackOverflow
    WHERE StackOverflow.developer_id = Developer.id
    ORDER BY datetime( StackOverflow.updated_at ) DESC
  ` )
  .all();

  res.json( sos );
} );

// Create
router.post( '/', async ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    user: req.body.user,
    account: 0,
    joined_at: null,
    reputation: 0,
    accept_rate: 0,
    name: null,
    location: null,
    website: null,
    link: null,
    image: null
  };

  let existing = req.db.prepare( `
    SELECT
      StackOverflow.uuid AS "id",
      StackOverflow.created_at,
      StackOverflow.updated_at,
      Developer.uuid AS "developer_id",
      StackOverflow.user,
      StackOverflow.account,
      StackOverflow.joined_at,
      StackOverflow.reputation,
      StackOverflow.accept_rate,
      StackOverflow.name,
      StackOverflow.location,
      StackOverflow.website,
      StackOverflow.link,
      StackOverflow.image
    FROM
      Developer,
      StackOverflow
    WHERE
      StackOverflow.developer_id = Developer.id AND
      StackOverflow.user = ?
  `). get( 
    record.user
  );

  if( existing === undefined ) {
    let profile = await rp( {
      url: `https://api.stackexchange.com/2.2/users/${req.body.user}`,
      method: 'GET',
      qs: {
        order: 'desc',
        sort: 'reputation',
        site: 'stackoverflow',
        key: req.config.stackoverflow.key
      },
      gzip: true,
      json: true
    } );
  
    record.account = profile.items[0].account_id;
    record.joined_at = new Date( profile.items[0].creation_date * 1000 ).toISOString();
    record.reputation = profile.items[0].reputation;
    record.accept_rate = profile.items[0].accept_rate ? profile.items[0].accept_rate : 0;
    record.name = profile.items[0].display_name;
    record.location = profile.items[0].location;
    record.website = profile.items[0].website_url;
    record.link = profile.items[0].link;
    record.image = profile.items[0].profile_image;
  
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
      INSERT INTO StackOverflow
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.developer_id,
      record.user,
      record.account,
      record.joined_at,
      record.reputation,
      record.accept_rate,
      record.name,
      record.location,
      record.website,
      record.link,
      record.image
    );
  
    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      user: record.user,
      account: record.account,
      joined_at: record.joined_at,
      reputation: record.reputation,
      accept_rate: record.accept_rate,
      name: record.name,
      location: record.location,
      website: record.website,
      link: record.link,
      image: record.image
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
      StackOverflow.uuid AS "id",
      StackOverflow.created_at, 
      StackOverflow.updated_at,
      Developer.uuid AS "developer_id",
      StackOverflow.user,
      StackOverflow.account,
      StackOverflow.joined_at,
      StackOverflow.reputation,
      StackOverflow.accept_rate,
      StackOverflow.name,
      StackOverflow.location,
      StackOverflow.website,
      StackOverflow.link,
      StackOverflow.image
    FROM 
      Developer, 
      StackOverflow
    WHERE 
      StackOverflow.developer_id = Developer.id AND
      StackOverflow.uuid = ?
  ` )
  .get( 
    req.params.id
  );

  let profile = await rp( {
    url: `https://api.stackexchange.com/2.2/users/${record.user}`,
    method: 'GET',
    qs: {
      order: 'desc',
      sort: 'reputation',
      site: 'stackoverflow',
      key: req.config.stackoverflow.key
    },
    gzip: true,
    json: true
  } );

  record.updated_at = new Date().toISOString();
  record.reputation = profile.items[0].reputation;
  record.accept_rate = profile.items[0].accept_rate ? profile.items[0].accept_rate : 0;
  record.name = profile.items[0].display_name;
  record.location = profile.items[0].location;
  record.website = profile.items[0].website_url;
  record.link = profile.items[0].link;
  record.image = profile.items[0].profile_image;

  let info = req.db.prepare( `
    UPDATE StackOverflow
    SET 
      updated_at = ?,
      reputation = ?,
      accept_rate = ?,
      name = ?,
      location = ?,
      website = ?,
      link = ?,
      image = ?
    WHERE user = ?
  ` )
  .run(
    record.updated_at,
    record.reputation,
    record.accept_rate,
    record.name,
    record.location,
    record.website,
    record.link,
    record.image,
    record.user
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
    account: req.body.account,
    joined_at: req.body.joined_at,
    reputation: req.body.reputation,
    accept_rate: req.body.accept_rate,
    name: req.body.name,
    location: req.body.location,
    website: req.body.website,
    link: req.body.link,
    image: req.body.image
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
    UPDATE StackOverflow
    SET 
      updated_at = ?,
      developer_id = ?,
      user = ?,
      account = ?,
      joined_at = ?,
      reputation = ?,
      accept_rate = ?,
      name = ?,
      location = ?,
      website = ?,
      link = ?,
      image = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.user,
    record.account,
    record.joined_at,
    record.reputation,
    record.accept_rate,
    record.name,
    record.location,
    record.website,
    record.link,
    record.image,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      StackOverflow.uuid AS "id",
      StackOverflow.created_at, 
      StackOverflow.updated_at,
      Developer.uuid AS "developer_id",
      StackOverflow.user,
      StackOverflow.account,
      StackOverflow.joined_at,
      StackOverflow.reputation,
      StackOverflow.accept_rate,
      StackOverflow.name,
      StackOverflow.location,
      StackOverflow.website,
      StackOverflow.link,
      StackOverflow.image
    FROM 
      Developer, 
      StackOverflow
    WHERE 
      StackOverflow.developer_id = Developer.id AND
      StackOverflow.uuid = ?
  ` )
  .get( 
    record.uuid
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM StackOverflow
    WHERE StackOverflow.uuid = ?
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
