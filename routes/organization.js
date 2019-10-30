const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {organization: 'Test'} );
} );

// Read single organization by ID
router.get( '/:id', ( req, res ) => {
  let organization = req.db.prepare( `
    SELECT
      Organization.uuid AS "id",
      Organization.created_at, 
      Organization.updated_at,
      Organization.name
    FROM Organization
    WHERE Organization.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( organization === undefined ) {
    organization = null;
  }

  res.json( organization );
} );

// Search for organizations with a given start
router.get( '/name/:prefix', ( req, res ) => {
  let organizations = req.db.prepare( `
    SELECT
      Organization.uuid AS "id",
      Organization.created_at, 
      Organization.updated_at,
      Organization.name
    FROM 
      Organization
    WHERE
      Organization.name LIKE ?
  ` )
  .all( 
    req.params.prefix + '%'
  );

  if( organizations === undefined ) {
    organizations = null;
  }

  res.json( organizations );
} );

// Organizations a given developer belongs to
router.get( '/developer/:id', ( req, res ) => {
  let organizations = req.db.prepare( `
    SELECT
      Organization.uuid AS "id",
      Organization.created_at, 
      Organization.updated_at,
      Organization.name
    FROM 
      Developer,
      DeveloperOrganization,
      Organization
    WHERE
      Developer.uuid = ? AND
      Developer.id = DeveloperOrganization.developer_id AND
      DeveloperOrganization.organization_id = Organization.id
  ` )
  .all( 
    req.params.id 
  );

  if( organizations === undefined ) {
    organizations = null;
  }

  res.json( organizations );
} );

// Read all organizations
router.get( '/', ( req, res ) => {
  let organizations = req.db.prepare( `
    SELECT 
      Organization.uuid AS "id", 
      Organization.created_at,
      Organization.updated_at,
      Organization.name,
      COUNT( DeveloperOrganization.id ) AS "count"
    FROM Organization
    LEFT JOIN DeveloperOrganization ON Organization.id = DeveloperOrganization.organization_id
    GROUP BY Organization.id
    ORDER BY Organization.name ASC
  ` )
  .all();

  res.json( organizations );
} );

// Associate organization with developer
router.post( '/:organization/developer/:developer', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    organization_uuid: req.params.organization
  };

  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Organization.id AS "organization_id"
    FROM
      Developer,
      Organization
    WHERE
      Developer.uuid = ? AND
      Organization.uuid = ?
  ` )
  .get( 
    record.developer_uuid,
    record.organization_uuid
  );
  record.developer_id = ids.developer_id;
  record.organization_id = ids.organization_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperOrganization
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.organization_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    organization_id: record.organization_uuid
  } );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: req.body.name
  };

  let existing = req.db.prepare( `
    SELECT 
      Organization.uuid AS "id",
      Organization.created_at,
      Organization.updated_at,
      Organization.name
    FROM Organization
    WHERE Organization.name = ?
  ` )
  .get( record.name );

  if( existing === undefined ) {
    let info = req.db.prepare( `
      INSERT INTO Organization
      VALUES ( ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.uuid,
      record.created_at,
      record.updated_at,
      record.name
    );

    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      name: record.name
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
    name: req.body.name
  };

  let info = req.db.prepare( `
    UPDATE Organization
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

  record = req.db.prepare( `
    SELECT
      Organization.uuid AS "id",
      Organization.created_at, 
      Organization.updated_at,
      Organization.name
    FROM Organization
    WHERE Organization.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Organization
    WHERE Organization.uuid = ?
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
