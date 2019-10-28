const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {developer: 'Test'} );
} );

// Read all developers for given label
router.get( '/label/:id', ( req, res ) => {
  let developers = req.db.prepare( `
    SELECT
      Developer.uuid AS "id",
      Developer.created_at, 
      Developer.updated_at,
      Developer.name,
      Developer.email,
      Developer.description,
      Developer.image
    FROM 
      Developer,
      DeveloperLabel,
      Label
    WHERE 
      Developer.id = DeveloperLabel.developer_id AND
      DeveloperLabel.label_id = Label.id AND
      Label.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  res.json( developers );
} );

// Read labels for given developer
router.get( '/:id/label', ( req, res ) => {
  let labels = req.db.prepare( `
    SELECT 
      Label.uuid AS "id",
      Label.created_at, 
      Label.updated_at, 
      Label.name
    FROM 
      Developer, DeveloperLabel, Label
    WHERE 
      Label.id = DeveloperLabel.label_id AND
      DeveloperLabel.developer_id = Developer.id AND
      Developer.uuid = ?
  ` )
  .all( 
    req.params.id 
  );

  res.json( labels );
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
      Developer.image
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
      Developer.image
    FROM 
      Developer
    ORDER BY name ASC
  ` )
  .all();

  res.json( developers );
} );

// Associate developer with label
router.post( '/:developer/label', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    label_uuid: req.body.label_id
  };

  let existing = req.db.prepare( `
    SELECT
      DeveloperLabel.uuid AS "id",
      DeveloperLabel.created_at,
      DeveloperLabel.updated_at,
      Developer.uuid AS "developer_id",
      Label.uuid AS "label_id"
    FROM
      Developer,
      DeveloperLabel,
      Label
    WHERE
      Developer.id = DeveloperLabel.developer_id AND
      DeveloperLabel.label_id = Label.id AND
      Developer.uuid = ? AND
      Label.uuid = ?
  ` )
  .get(
    record.developer_uuid,
    record.label_uuid
  );

  if( existing === undefined ) {
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

    record = {
      id: record.uuid,
      created_at: record.created_at,
      updated_at: record.updated_at,
      developer_id: record.developer_uuid,
      label_id: record.label_uuid
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
    image: req.body.image
  };

  let info = req.db.prepare( `
    INSERT INTO Developer
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.name,
    record.email,
    record.description,
    record.image
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    name: record.name,
    email: record.email,
    description: record.description,
    image: record.image
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
    image: req.body.image
  };

  let info = req.db.prepare( `
    UPDATE Developer
    SET 
      updated_at = ?,
      name = ?,
      email = ?,
      description = ?,
      image = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.name,
    record.email,
    record.description,
    record.image,
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
      Developer.image
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

// Remove developer from label
router.delete( '/:developer/label/:label', ( req, res ) => {
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
    req.params.developer,
    req.params.label
  );

  let info = req.db.prepare( `
    DELETE FROM DeveloperLabel
    WHERE 
      DeveloperLabel.developer_id = ? AND
      DeveloperLabel.label_id = ?
  ` )
  .run(
    ids.developer_id,
    ids.label_id
  );  

  res.json( {
    developer_id: req.params.developer,
    label_id: req.params.label
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

  // Labels
  let info = req.db.prepare( `
    DELETE FROM DeveloperLabel
    WHERE DeveloperLabel.developer_id = ?
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
