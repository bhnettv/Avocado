const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {role: 'Test'} );
} );

// Read single role by ID
router.get( '/:id', ( req, res ) => {
  let role = req.db.prepare( `
    SELECT
      Role.uuid AS "id",
      Role.created_at, 
      Role.updated_at,
      Role.name
    FROM Role
    WHERE Role.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( role === undefined ) {
    role = null;
  }

  res.json( role );
} );

// Search for role with a given start
router.get( '/name/:prefix', ( req, res ) => {
  let roles = req.db.prepare( `
    SELECT
      Role.uuid AS "id",
      Role.created_at, 
      Role.updated_at,
      Role.name
    FROM 
      Role  
    WHERE
      Role.name LIKE ?
  ` )
  .all( 
    req.params.prefix + '%'
  );

  if( roles === undefined ) {
    roles = null;
  }

  res.json( roles );
} );

// Roles a given developer belongs to
router.get( '/developer/:id', ( req, res ) => {
  let roles = req.db.prepare( `
    SELECT
      Role.uuid AS "id",
      Role.created_at, 
      Role.updated_at,
      Role.name
    FROM 
      Developer,
      DeveloperRole,
      Role
    WHERE
      Developer.uuid = ? AND
      Developer.id = DeveloperRole.developer_id AND
      DeveloperRole.role_id = Role.id
  ` )
  .all( 
    req.params.id 
  );

  if( roles === undefined ) {
    roles = null;
  }

  res.json( roles );
} );

// Read all roles
router.get( '/', ( req, res ) => {
  let roles = req.db.prepare( `
    SELECT 
      Role.uuid AS "id", 
      Role.created_at,
      Role.updated_at,
      Role.name,
      COUNT( DeveloperRole.id ) AS "count"
    FROM Role
    LEFT JOIN DeveloperRole ON Role.id = DeveloperRole.role_id
    GROUP BY Role.id
    ORDER BY Role.name ASC
  ` )
  .all();

  res.json( roles );
} );

// Associate role with developer
router.post( '/:role/developer/:developer', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    role_uuid: req.params.role
  };

  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Role.id AS "role_id"
    FROM
      Developer,
      Role
    WHERE
      Developer.uuid = ? AND
      Role.uuid = ?
  ` )
  .get( 
    record.developer_uuid,
    record.role_uuid
  );
  record.developer_id = ids.developer_id;
  record.role_id = ids.role_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperRole
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.role_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    role_id: record.role_uuid
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
      Role.uuid AS "id",
      Role.created_at,
      Role.updated_at,
      Role.name
    FROM Role
    WHERE Role.name = ?
  ` )
  .get( record.name );

  if( existing === undefined ) {
    let info = req.db.prepare( `
      INSERT INTO Role
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
    UPDATE Role
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
      Role.uuid AS "id",
      Role.created_at, 
      Role.updated_at,
      Role.name
    FROM Role
    WHERE Role.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Role
    WHERE Role.uuid = ?
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
