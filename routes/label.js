const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {label: 'Test'} );
} );

// Read single label by ID
router.get( '/id/:id', ( req, res ) => {
  let label = req.db.prepare( `
    SELECT
      Label.uuid AS "id",
      Label.created_at, 
      Label.updated_at,
      Label.name
    FROM Label
    WHERE Label.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( label === undefined ) {
    label = null;
  }

  res.json( label );
} );

// Labels a given developer belongs to
router.get( '/developer/:id', ( req, res ) => {
  let labels = req.db.prepare( `
    SELECT
      Label.uuid AS "id",
      Label.created_at, 
      Label.updated_at,
      Label.name
    FROM 
      Developer,
      DeveloperLabel,
      Label
    WHERE
      Developer.uuid = ? AND
      Developer.id = DeveloperLabel.developer_id AND
      DeveloperLabel.label_id = Label.id
  ` )
  .all( 
    req.params.id 
  );

  if( labels === undefined ) {
    labels = null;
  }

  res.json( labels );
} );

// Read all labels
router.get( '/', ( req, res ) => {
  let labels = req.db.prepare( `
    SELECT
      Label.uuid AS "id",
      Label.created_at, 
      Label.updated_at,
      Label.name
    FROM Label
    ORDER BY name ASC
  ` )
  .all();

  res.json( labels );
} );

// Associate label with developer
router.post( '/:label/developer/:developer', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    label_uuid: req.params.label
  };

  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Label.id AS "label_id"
    FROM
      Developer,
      Label
    WHERE
      Developer.uuid = ? AND
      Label.uuid = ?
  ` )
  .get( 
    record.developer_uuid,
    record.label_uuid
  );
  record.developer_id = ids.developer_id;
  record.label_id = ids.label_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperLabel
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.label_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    label_id: record.label_uuid
  } );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: req.body.name.toLowerCase()
  };

  let info = req.db.prepare( `
    INSERT INTO Label
    VALUES ( ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.name
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    name: record.name
  } );
} );

// Update
router.put( '/id/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    name: req.body.name.toLowerCase()
  };

  let info = req.db.prepare( `
    UPDATE Label
    SET 
      updated_at = ?,
      name = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.name,
    record.uuid
  );

  res.json( {
    id: record.uuid,
    updated_at: record.updated_at,
    name: record.name
  } );  
} );

// Delete
router.delete( '/id/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Label
    WHERE Label.uuid = ?
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
