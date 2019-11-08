const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {website: 'Test'} );
} );

// Read single website by ID
router.get( '/:id', ( req, res ) => {
  let site = req.db.prepare( `
    SELECT
      Website.uuid AS "id",
      Website.created_at, 
      Website.updated_at,
      Developer.uuid AS "developer_id",
      Website.url
    FROM 
      Developer, 
      Website
    WHERE 
      Website.developer_id = Developer.id AND
      Website.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( site === undefined ) {
    site = null;
  }

  res.json( site );
} );

// Read all websites
router.get( '/', ( req, res ) => {
  let sites = req.db.prepare( `
    SELECT
      Website.uuid AS "id",
      Website.created_at, 
      Website.updated_at,
      Developer.uuid AS "developer_id",
      Website.url
    FROM 
      Developer,
      Website
    WHERE Website.developer_id = Developer.id
    ORDER BY datetime( Website.updated_at ) DESC
  ` )
  .all();

  res.json( sites );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.body.developer_id,
    url: req.body.url
  };

  let existing = req.db.prepare( `
    SELECT
      Website.uuid AS "id",
      Website.created_at,
      Website.updated_at,
      Developer.uuid AS "id",
      Website.url
    FROM
      Developer,
      Website
    WHERE 
      Website.developer_id = Developer.id AND
      Website.url = ?
  ` ).get( 
    req.body.url
  );

  if( existing === undefined ) {
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
      INSERT INTO Website
      VALUES ( ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.developer_id,
      record.url
    );

    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
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
    UPDATE Website
    SET 
      updated_at = ?,
      developer_id = ?,
      url = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.developer_id,
    record.url,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Website.uuid AS "id",
      Website.created_at, 
      Website.updated_at,
      Developer.uuid AS "developer_id",
      Website.url
    FROM 
      Developer, 
      Website
    WHERE 
      Website.developer_id = Developer.id AND
      Website.uuid = ?
  ` )
  .get( 
    record.uuid
  );

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Website
    WHERE Website.uuid = ?
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
