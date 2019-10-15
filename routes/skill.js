const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {skill: 'Test'} );
} );

// Read single skill by ID
router.get( '/:id', ( req, res ) => {
  let skill = req.db.prepare( `
    SELECT
      Skill.uuid AS "id",
      Skill.created_at, 
      Skill.updated_at,
      Skill.name
    FROM Skill
    WHERE Skill.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( skill === undefined ) {
    skill = null;
  }

  res.json( skill );
} );

// Search for skills with a given start
router.get( '/name/:prefix', ( req, res ) => {
  let skills = req.db.prepare( `
    SELECT
      Skill.uuid AS "id",
      Skill.created_at, 
      Skill.updated_at,
      Skill.name
    FROM 
      Skill
    WHERE
      Skill.name LIKE ?
    ORDER BY
      Skill.name ASC
  ` )
  .all( 
    req.params.prefix + '%'
  );

  if( skills === undefined ) {
    skills = null;
  }

  res.json( skills );
} );

// Skills a given developer belongs to
router.get( '/developer/:id', ( req, res ) => {
  let skills = req.db.prepare( `
    SELECT
      Skill.uuid AS "id",
      Skill.created_at, 
      Skill.updated_at,
      Skill.name
    FROM 
      Developer,
      DeveloperSkill,
      Skill
    WHERE
      Developer.uuid = ? AND
      Developer.id = DeveloperSkill.developer_id AND
      DeveloperSkill.skill_id = Skill.id
  ` )
  .all( 
    req.params.id 
  );

  if( skills === undefined ) {
    skills = null;
  }

  res.json( skills );
} );

// Read all skills
router.get( '/', ( req, res ) => {
  let skills = req.db.prepare( `
    SELECT 
      Skill.uuid AS "id", 
      Skill.created_at,
      Skill.updated_at,
      Skill.name,
      COUNT( DeveloperSkill.id ) AS "count"
    FROM Skill
    LEFT JOIN DeveloperSkill ON Skill.id = DeveloperSkill.skill_id
    GROUP BY Skill.id
    ORDER BY Skill.name ASC
  ` )
  .all();

  res.json( skills );
} );

// Associate skill with developer
router.post( '/:skill/developer/:developer', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    developer_uuid: req.params.developer,
    skill_uuid: req.params.skill
  };

  let ids = req.db.prepare( `
    SELECT
      Developer.id AS "developer_id",
      Skill.id AS "skill_id"
    FROM
      Developer,
      Skill
    WHERE
      Developer.uuid = ? AND
      Skill.uuid = ?
  ` )
  .get( 
    record.developer_uuid,
    record.skill_uuid
  );
  record.developer_id = ids.developer_id;
  record.skill_id = ids.skill_id;

  let info = req.db.prepare( `
    INSERT INTO DeveloperSkill
    VALUES ( ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.developer_id,
    record.skill_id
  );

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    developer_id: record.developer_uuid,
    skill_id: record.skill_uuid
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
      Skill.uuid AS "id",
      Skill.created_at,
      Skill.updated_at,
      Skill.name
    FROM Skill
    WHERE Skill.name = ?
  ` )
  .get( record.name );

  if( existing === undefined ) {
    let info = req.db.prepare( `
      INSERT INTO Skill
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
    UPDATE Skill
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
      Skill.uuid AS "id",
      Skill.created_at, 
      Skill.updated_at,
      Skill.name
    FROM Skill
    WHERE Skill.uuid = ?
  ` )
  .get( 
    record.uuid
  );  

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM Skill
    WHERE Skill.uuid = ?
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
