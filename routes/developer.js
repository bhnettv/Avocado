const express = require( 'express' );
const rp = require( 'request-promise-native' );
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

// Associate developer with organization(s)
router.post( '/:developer/organization', ( req, res ) => {
  let organizations = [];

  // Loop through organizations provided as array
  for( let a = 0; a < req.body.length; a++ ) {
    let record = {
      id: null,
      organization_uuid: req.body[a].id,
      developer_uuid: req.params.developer,
      name: req.body[a].name
    }

    // Check if organization exists
    // By name
    // Case-insensitive
    let existing = req.db.prepare( `
      SELECT
        Organization.uuid AS "id",
        Organization.created_at,
        Organization.updated_at,
        Organization.name
      FROM
        Organization
      WHERE
        LOWER( Organization.name ) = ?
    ` )
    .get(
      record.name.trim().toLowerCase()
    );

    // Organization does not exist
    if( existing === undefined ) {
      // Assign external UUID
      // Assign created and updated stamps
      record.organization_uuid = uuidv4();
      record.created_at = new Date().toISOString();
      record.updated_at = new Date().toISOString();

      // Create organization
      let info = req.db.prepare( `
        INSERT INTO Organization
        VALUES ( ?, ?, ?, ?, ? )
      ` )
      .run(
        record.id,
        record.organization_uuid,
        record.created_at,
        record.updated_at,
        record.name
      );
    } else {
      // Carry over existing organization data
      record.organization_uuid = existing.id;
      record.created_at = existing.created_at;
      record.updated_at = existing.updated_at;        
      record.name = existing.name;
    }

    // Organization now exists
    // Get internal IDs
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

    // Assign IDs
    record.developer_id = ids.developer_id;
    record.organization_id = ids.organization_id;
    record.relation_uuid = uuidv4();

    // Create relationship
    let info = req.db.prepare( `
      INSERT INTO DeveloperOrganization
      VALUES ( ?, ?, ?, ?, ?, ? )
    ` )
    .run(
      record.id,
      record.relation_uuid,
      record.created_at,
      record.updated_at,
      record.developer_id,
      record.organization_id
    );

    // Mirror organization record
    // Hydrated with complete details
    organizations.push( {
      id: record.organization_uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      name: record.name
    } );
  }

  res.json( organizations );
} );

// Update developer association to organization(s)
router.put( '/:developer/organization', ( req, res ) => {
  let organizations = [];

  // Preserve existing relationships
  // Between developer and organization
  let relationships = req.db.prepare( `
    SELECT 
      DeveloperOrganization.id,
      Organization.uuid AS "organization_id"
    FROM 
      Developer,
      DeveloperOrganization,
      Organization
    WHERE 
      Organization.id = DeveloperOrganization.organization_id AND
      DeveloperOrganization.developer_id = Developer.id AND
      Developer.uuid = ?
  ` )
  .all(
    req.params.developer
  );

  // Loop through organizations provided as array
  for( let a = 0; a < req.body.length; a++ ) {
    let record = {
      id: null,
      organization_uuid: req.body[a].id,
      developer_uuid: req.params.developer,
      name: req.body[a].name
    }

    // Check if organization exists
    // By name
    // Case-insensitive
    let existing = req.db.prepare( `
      SELECT
        Organization.uuid AS "id",
        Organization.created_at,
        Organization.updated_at,
        Organization.name
      FROM
        Organization
      WHERE
        LOWER( Organization.name ) = ?
    ` )
    .get(
      record.name.trim().toLowerCase()
    );

    // Organization does not exist
    if( existing === undefined ) {
      // Assign external UUID
      // Assign created and updated stamps
      record.organization_uuid = uuidv4();
      record.created_at = new Date().toISOString();
      record.updated_at = new Date().toISOString();

      // Create organization
      let info = req.db.prepare( `
        INSERT INTO Organization
        VALUES ( ?, ?, ?, ?, ? )
      ` )
      .run(
        record.id,
        record.organization_uuid,
        record.created_at,
        record.updated_at,
        record.name
      );
    } else {
      // Carry over existing organization data
      record.organization_uuid = existing.id;
      record.created_at = existing.created_at;
      record.updated_at = existing.updated_at;        
      record.name = existing.name;
    }

    // Organization exists
    // Check if relationship to developer exists
    let relates = req.db.prepare( `
      SELECT
        DeveloperOrganization.uuid AS "id",
        DeveloperOrganization.created_at,
        DeveloperOrganization.updated_at,
        Developer.uuid AS "developer_id",
        Organization.uuid AS "organization_id",
        Organization.name
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

    // No existing relationship
    if( relates === undefined ) {
      // Get internal IDs
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

      // Assign IDs
      record.developer_id = ids.developer_id;
      record.organization_id = ids.organization_id;
      record.relation_uuid = uuidv4();
  
      // Create relationship
      let info = req.db.prepare( `
        INSERT INTO DeveloperOrganization
        VALUES ( ?, ?, ?, ?, ?, ? )
      ` )
      .run(
        record.id,
        record.relation_uuid,
        record.created_at,
        record.updated_at,
        record.developer_id,
        record.organization_id
      );
    }

    // Mirror organization record
    // Hydrated with complete details
    organizations.push( {
      id: record.organization_uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      name: record.name
    } );
  }

  // Now check for orphans
  // Organizations that used to have an association
  // That are no longer desired to have an association
  for( let a = 0; a < relationships.length; a++ ) {
    let found = false;

    // Name matches
    for( let b = 0; b < organizations.length; b++ ) {
      if( relationships[a].organization_id === organizations[b].id ) {
        found = true;
        break;
      }
    }

    // Not found in new associations
    if( !found ) {
      let removed = req.db.prepare( `
        DELETE FROM DeveloperOrganization
        WHERE DeveloperOrganization.id = ?
      ` )
      .run(
        relationships[a].id
      );
    }
  }

  res.json( organizations );
} );

// Create
router.post( '/', async ( req, res ) => {
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

  // Location provided
  if( record.location !== null ) {
    // But specifics are unknown
    // Lookup some data
    if( record.latitude === null ) {
      // Get access token
      // Tokens only good for two hours
      let auth = await rp( 'https://www.arcgis.com/sharing/rest/oauth2/token', {
        method: 'POST',
        form: {
          client_id: req.config.esri.client_id,
          client_secret: req.config.esri.client_secret,
          grant_type: 'client_credentials'
        },
        json: true
      } );

      // Geocode provided location
      let results = await rp( 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates', {
        qs: {
          f: 'json',
          SingleLine: record.location,
          forStorage: req.config.esri.storage,
          token: auth.access_token
        },
        json: true
      } );

      // Geolocation
      record.latitude = results.candidates[0].location.y;
      record.longitude = results.candidates[0].location.x;
    }
  }

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
router.put( '/:id', async ( req, res ) => {
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

  // Location provided
  if( record.location !== null ) {
    // What is currently stored
    let existing = req.db.prepare( `
      SELECT Developer.location
      FROM Developer
      WHERE Developer.uuid = ?
    ` ).get(
      record.uuid  
    )
    
    // May be null in the database
    // Force to empty string for easy compare
    if( existing.location === null ) {
      existing.location = '';
    }

    // If the location entries do not match (case-insensitive)
    // Then update geolocation (latitude, longitude)
    if( existing.location.trim().toLowerCase() !== record.location.trim().toLowerCase() ) {
      // Get access token
      // Tokens only good for two hours
      let auth = await rp( 'https://www.arcgis.com/sharing/rest/oauth2/token', {
        method: 'POST',
        form: {
          client_id: req.config.esri.client_id,
          client_secret: req.config.esri.client_secret,
          grant_type: 'client_credentials'
        },
        json: true
      } );

      // Geocode provided location
      let results = await rp( 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates', {
        qs: {
          f: 'json',
          SingleLine: record.location,
          forStorage: req.config.esri.storage,
          token: auth.access_token
        },
        json: true
      } );

      // Geolocation
      record.latitude = results.candidates[0].location.y;
      record.longitude = results.candidates[0].location.x;
    }
  }

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

  // Roles
  info = req.db.prepare( `
    DELETE FROM DeveloperRole
    WHERE DeveloperRole.developer_id = ?
  ` )
  .run(
    developer.id
  );    

  // Notes
  info = req.db.prepare( `
    DELETE FROM Note
    WHERE Note.developer_id = ?
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

  // Website
  info = req.db.prepare( `
    DELETE FROM Website
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
