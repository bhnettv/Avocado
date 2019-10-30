const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {developer: 'Test'} );
} );

// Read all developers for given organization
router.get( '/organization/:id', ( req, res ) => {
  let developers = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.name,
      Developer.email,
      Developer.description,
      Developer.image,
      Developer.location,
      Developer.latitude,
      Developer.longitude,
      Developer.public
    FROM 
      Developer,
      DeveloperOrganization,
      Organization
    WHERE 
      Developer.id = DeveloperOrganization.developer_id AND
      DeveloperOrganization.organization_id = Organization.id AND
      Organization.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  res.json( developers );
} );

// Read organizations for given developer
router.get( '/:id/organization', ( req, res ) => {
  let organizations = req.db.prepare( `
    SELECT 
      Organization.uuid AS "id",
      Organization.created_at, 
      Organization.updated_at, 
      Organization.name
    FROM 
      Developer, DeveloperOrganization, Organization
    WHERE 
      Organization.id = DeveloperOrganization.organization_id AND
      DeveloperOrganization.developer_id = Developer.id AND
      Developer.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  res.json( organizations );
} );

// Read notes for given developer
router.get( '/:id/note', ( req, res ) => {
  let notes = req.db.prepare( `
    SELECT 
      DeveloperNote.uuid AS "id",
      DeveloperNote.created_at, 
      DeveloperNote.updated_at, 
      Developer.uuid AS "developer_id",
      Activity.uuid AS "activity_id",
      Activity.name AS "activity_name",
      DeveloperNote.full_text
    FROM 
      Activity, Developer, DeveloperNote
    WHERE 
      Developer.id = DeveloperNote.developer_id AND
      DeveloperNote.activity_id = Activity.id AND
      Developer.uuid = ?
    ORDER BY datetime( DeveloperNote.updated_at ) DESC
  ` )
  .all( 
    req.params.id 
  );

  res.json( notes );
} );

// Read single developer by ID
router.get( '/:id', ( req, res ) => {
  let developer = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.name,
      Developer.email,
      Developer.description,
      Developer.image,
      Developer.location,
      Developer.latitude,
      Developer.longitude,
      Developer.public      
    FROM 
      Developer
    WHERE 
      Developer.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( developer === undefined ) {
    developer = null;
  }

  res.json( developer );
} );

// Read all developers
router.get( '/', ( req, res ) => {
  let developers = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.name,
      Developer.email,
      Developer.description,
      Developer.image,
      Developer.location,
      Developer.latitude,
      Developer.longitude,
      Developer.public      
    FROM 
      Developer
    ORDER BY name ASC
  ` )
  .all();

  res.json( developers );
} );

// Associate developer with organization
router.post( '/:developer/organization', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    organization_uuid: req.body.organization_id
  };

  let existing = req.db.prepare( `
    SELECT
      DeveloperOrganization.uuid AS "id",
      DeveloperOrganization.created_at,
      DeveloperOrganization.updated_at,
      Developer.uuid AS "developer_id",
      Organization.uuid AS "organization_id"
    FROM
      Developer,
      DeveloperOrganization,
      Organization
    WHERE
      Developer.id = DeveloperOrganization.developer_id AND
      DeveloperOrganization.organization_id = Organization.id AND
      Developer.uuid = ? AND
      Organization.uuid = ?
  ` )
  .get(
    record.developer_uuid,
    record.organization_uuid
  );

  if( existing === undefined ) {
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

    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      organization_id: record.organization_uuid
    };    
  } else {
    record = existing;
  }

  res.json( record );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: req.body.name,
    email: req.body.email,
    description: req.body.description,
    image: req.body.image,
    location: req.body.location,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    public: req.body.public
  };

  let info = req.db.prepare( `
    INSERT INTO Developer
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.name,
    record.email,
    record.description,
    record.image,
    record.location,
    record.latitude,
    record.longitude,
    record.public
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    name: record.name,
    email: record.email,
    description: record.description,
    image: record.image,
    location: record.location,
    latitude: record.latitude,
    longitude: record.longitude,
    public: record.public
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    name: req.body.name,
    email: req.body.email,
    description: req.body.description,
    image: req.body.image,
    location: req.body.location,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    public: req.body.public    
  };

  let info = req.db.prepare( `
    UPDATE Developer
    SET 
      updated_at = ?,
      name = ?,
      email = ?,
      description = ?,
      image = ?,
      location = ?,
      latitude = ?,
      longitude = ?,
      public = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.name,
    record.email,
    record.description,
    record.image,
    record.location,
    record.latitude,
    record.longitude,
    record.public,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at,
      Developer.updated_at,
      Developer.name,
      Developer.email,
      Developer.description,
      Developer.image,
      Developer.location,
      Developer.latitude,
      Developer.longitude,
      Developer.public
    FROM
      Developer
    WHERE
      Developer.uuid = ?
  ` )
  .get( 
    record.uuid
  );    

  res.json( record );  
} );

// Remove developer from organization
router.delete( '/:developer/organization/:organization', ( req, res ) => {
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
    req.params.developer,
    req.params.organization
  );

  let info = req.db.prepare( `
    DELETE FROM DeveloperOrganization
    WHERE 
      DeveloperOrganization.developer_id = ? AND
      DeveloperOrganization.organization_id = ?
  ` )
  .run(
    ids.developer_id,
    ids.organization_id
  );  

  res.json( {
    developer_id: req.params.developer,
    organization_id: req.params.organization
  } );
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let deep = true;

  if( req.query.deep ) {
    if( req.query.deep === 'false' ) {
      deep = false;
    }
  }

  // Get developer ID (not UUID)
  let developer = req.db.prepare( `
    SELECT id
    FROM Developer
    WHERE uuid = ?
  ` )
  .get(
    req.params.id
  );

  // Languages
  let info = req.db.prepare( `
    DELETE FROM DeveloperLanguage
    WHERE DeveloperLanguage.developer_id = ?
  ` )
  .run(
    developer.id
  );    

  // Organizations
  info = req.db.prepare( `
    DELETE FROM DeveloperOrganization
    WHERE DeveloperOrganization.developer_id = ?
  ` )
  .run(
    developer.id
  );  

  // Notes
  info = req.db.prepare( `
    DELETE FROM DeveloperNote
    WHERE DeveloperNote.developer_id = ?
  ` )
  .run(
    developer.id
  );    
  
  // Skills
  info = req.db.prepare( `
    DELETE FROM DeveloperSkill
    WHERE DeveloperSkill.developer_id = ?
  ` )
  .run(
    developer.id
  );  

  // Account
  info = req.db.prepare( `
    DELETE FROM Developer
    WHERE Developer.id = ?
  ` )
  .run(
    developer.id
  );  

  // Deep deletion
  // Defaults to true
  if( deep ) {
    // Other sources
    let source = [{
      social: 'Blog',
      post: 'BlogPost',
      media: 'BlogPostMedia'
    }, {    
      social: 'Dev',
      post: 'DevPost',
      media: 'DevPostMedia'
    }, {    
      social: 'Medium',
      post: 'MediumPost',
      media: 'MediumPostMedia'
    }, {
      social: 'GitHub',
      post: 'GitHubEvent'
    }, {
      social: 'Reddit',
      post: 'RedditPost'
    }, {
      social: 'StackOverflow',
      short: 'so',
      post: 'StackOverflowAnswer'
    }, {
      social: 'Twitter',
      post: 'TwitterStatus',
      media: 'TwitterStatusMedia'
    }, {
      social: 'YouTube',
      post: 'YouTubeVideo'
    }];

    // Iterate sources
    for( let s = 0; s < source.length; s++ ) {
      // StackOverflow shortened to "so"
      // Otherwise lowercase post entity
      let key = source[s].short !== undefined ? source[s].short : source[s].social.toLowerCase();

      // Get details
      let content = req.db.prepare( `
        SELECT 
          ${source[s].social}.id AS "record_id", 
          ${source[s].post}.id AS "post_id"
        FROM
          ${source[s].social},
          ${source[s].post}
        WHERE 
          ${source[s].post}.${key}_id = ${source[s].social}.id AND
          ${source[s].social}.developer_id = ?
      ` )
      .get(
        developer.id
      );

      // Content exists
      if( content ) {
        // If there is media storage
        if( source[s].media !== undefined ) {
          // Remove media
          // TODO: DELETE Media
          // TODO: Then DELETE PostMedia
          // TODO: May require a SELECT
          info = req.db.prepare( `
            DELETE FROM ${source[s].media}
            WHERE ${source[s].media}.post_id = ?
          ` )
          .run(
            content.post_id
          );    
        }

        // Remove posts
        info = req.db.prepare( `
          DELETE FROM ${source[s].post}
          WHERE ${source[s].post}.${key}_id = ?
        ` )
        .run(
          content.record_id
        );    

        // Remove social
        info = req.db.prepare( `
          DELETE FROM ${source[s].social}
          WHERE ${source[s].social}.id = ?
        ` )
        .run(
          content.record_id
        );
      }      
    }
  }

  res.json( {
    id: req.params.id
  } );
} );

// Export
module.exports = router;
