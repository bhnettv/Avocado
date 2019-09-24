const express = require( 'express' );
const uuidv4 = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {so_answer: 'Test'} );
} );

// Read single answer by ID
router.get( '/:id', ( req, res ) => {
  let answer = req.db.prepare( `
    SELECT
      StackOverflowAnswer.uuid AS "id",
      StackOverflowAnswer.created_at,
      StackOverflowAnswer.updated_at,
      StackOverflow.uuid AS "so_id",
      StackOverflowAnswer.answer,
      StackOverflowAnswer.question,
      StackOverflowAnswer.active_at,
      StackOverflowAnswer.accepted,
      StackOverflowAnswer.score,
      StackOverflowAnswer.link,
      StackOverflowAnswer.title,
      StackOverflowAnswer.tags,
      StackOverflowAnswer.keywords,
      StackOverflowAnswer.concepts,
      StackOverflowAnswer.entities
    FROM 
      StackOverflow,
      StackOverflowAnswer
    WHERE 
      StackOverflowAnswer.so_id = StackOverflow.id AND
      StackOverflowAnswer.uuid = ?
  ` )
  .get( 
    req.params.id 
  );

  if( answer === undefined ) {
    answer = null;
  } else {
    if( answer.tags === null ) {
      answer.tags = [];
    } else {
      answer.tags = answer.tags.split( ',' );
    }

    if( answer.keywords === null ) {
      answer.keywords = [];
    } else {
      answer.keywords = answer.keywords.split( ',' );
    }
    
    if( answer.concepts === null ) {
      answer.concepts = [];
    } else {
      answer.concepts = answer.concepts.split( ',' );
    }
    
    if( answer.entities === null ) {
      answer.entities = [];
    } else {
      answer.entities = answer.entities.split( ',' );
    }    
  }

  res.json( answer );
} );

// Read single answer by Stack Overflow answer ID
router.get( '/id/:id', ( req, res ) => {
  let answer = req.db.prepare( `
    SELECT
      StackOverflowAnswer.uuid AS "id",
      StackOverflowAnswer.created_at,
      StackOverflowAnswer.updated_at,
      StackOverflow.uuid AS "so_id",
      StackOverflowAnswer.answer,
      StackOverflowAnswer.question,
      StackOverflowAnswer.active_at,
      StackOverflowAnswer.accepted,
      StackOverflowAnswer.score,
      StackOverflowAnswer.link,
      StackOverflowAnswer.title,
      StackOverflowAnswer.tags,
      StackOverflowAnswer.keywords,
      StackOverflowAnswer.concepts,
      StackOverflowAnswer.entities
    FROM 
      StackOverflow,
      StackOverflowAnswer
    WHERE 
      StackOverflowAnswer.so_id = StackOverflow.id AND
      StackOverflowAnswer.answer = ?
  ` )
  .get( 
    req.params.id 
  );

  if( answer === undefined ) {
    answer = null;
  } else {
    if( answer.tags === null ) {
      answer.tags = [];
    } else {
      answer.tags = answer.tags.split( ',' );
    }

    if( answer.keywords === null ) {
      answer.keywords = [];
    } else {
      answer.keywords = answer.keywords.split( ',' );
    }
    
    if( answer.concepts === null ) {
      answer.concepts = [];
    } else {
      answer.concepts = answer.concepts.split( ',' );
    }
    
    if( answer.entities === null ) {
      answer.entities = [];
    } else {
      answer.entities = answer.entities.split( ',' );
    } 
  }

  res.json( answer );
} );

// Read all answers
router.get( '/', ( req, res ) => {
  let answers = req.db.prepare( `
    SELECT
      StackOverflowAnswer.uuid AS "id",
      StackOverflowAnswer.created_at,
      StackOverflowAnswer.updated_at,
      StackOverflow.uuid AS "so_id",
      StackOverflowAnswer.answer,
      StackOverflowAnswer.question,
      StackOverflowAnswer.active_at,
      StackOverflowAnswer.accepted,
      StackOverflowAnswer.score,
      StackOverflowAnswer.link,
      StackOverflowAnswer.title,
      StackOverflowAnswer.tags,
      StackOverflowAnswer.keywords,
      StackOverflowAnswer.concepts,
      StackOverflowAnswer.entities
    FROM 
      StackOverflow,
      StackOverflowAnswer
    WHERE StackOverflowAnswer.so_id = StackOverflow.id
    ORDER BY StackOverflowAnswer.active_at DESC
  ` )
  .all();

  for( let a = 0; a < answers.length; a++ ) {
    if( answers[a].tags === null ) {
      answers[a].tags = [];
    } else {
      answers[a].tags = answers[a].tags.split( ',' );
    }

    if( answers[a].keywords === null ) {
      answers[a].keywords = [];
    } else {
      answers[a].keywords = answers[a].keywords.split( ',' );
    }
    
    if( answers[a].concepts === null ) {
      answers[a].concepts = [];
    } else {
      answers[a].concepts = answers[a].concepts.split( ',' );
    }
    
    if( answers[a].entities === null ) {
      answers[a].entities = [];
    } else {
      answers[a].entities = answers[a].entities.split( ',' );
    }    
  }

  res.json( answers );
} );

// Create
router.post( '/', ( req, res ) => {
  let record = {
    id: null,
    uuid: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    so_uuid: req.body.so_id,
    answer: req.body.answer.toString( 10 ),
    question: req.body.question.toString( 10 ),
    active_at: req.body.active_at,
    accepted: req.body.accepted,
    score: req.body.score,
    link: req.body.link,
    title: req.body.title,
    tags: req.body.tags,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities
  };

  if( record.tags.length === 0 ) {
    record.tags = null;
  } else {
    record.tags = record.tags.join( ',' );
  }    

  if( record.keywords.length === 0 ) {
    record.keywords = null;
  } else {
    record.keywords = record.keywords.join( ',' );
  }    

  if( record.concepts.length === 0 ) {
    record.concepts = null;
  } else {
    record.concepts = record.concepts.join( ',' );
  }    
  
  if( record.entities.length === 0 ) {
    record.entities = null;
  } else {
    record.entities = record.entities.join( ',' );
  }    

  let so = req.db.prepare( `
    SELECT StackOverflow.id
    FROM StackOverflow
    WHERE StackOverflow.uuid = ?
  ` )
  .get( 
    record.so_uuid
  );
  record.so_id = so.id;

  let info = req.db.prepare( `
    INSERT INTO StackOverflowAnswer
    VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
  ` )
  .run(
    record.id,
    record.uuid,
    record.created_at,
    record.updated_at,
    record.so_id,
    record.answer,
    record.question,
    record.active_at,
    record.accepted,
    record.score,
    record.link,
    record.title,
    record.tags,
    record.keywords,
    record.concepts,
    record.entities
  );

  if( record.tags === null ) {
    record.tags = [];
  } else {    
    record.tags = record.tags.split( ',' );
  }  

  if( record.keywords === null ) {
    record.keywords = [];
  } else {    
    record.keywords = record.keywords.split( ',' );
  }  

  if( record.concepts === null ) {
    record.concepts = [];
  } else {    
    record.concepts = record.concepts.split( ',' );
  }

  if( record.entities === null ) {
      record.entities = [];
  } else {    
    record.entities = record.entities.split( ',' );
  }  

  res.json( {
    id: record.uuid,
    created_at: record.created_at,
    updated_at: record.updated_at,
    so_id: record.so_uuid,
    answer: record.answer,
    question: record.question,
    active_at: record.active_at,
    accepted: record.accepted,
    score: record.score,
    link: record.link,
    title: record.title,
    tags: record.tags,
    keywords: record.keywords,
    concepts: record.concepts,
    entities: record.entities
  } );
} );

// Update
router.put( '/:id', ( req, res ) => {
  let record = {
    uuid: req.params.id,
    updated_at: new Date().toISOString(),
    so_uuid: req.body.so_id,
    answer: req.body.answer.toString( 10 ),
    question: req.body.question.toString( 10 ),
    active_at: req.body.active_at,
    accepted: req.body.accepted,
    score: req.body.score,
    link: req.body.link,
    title: req.body.title,
    tags: req.body.tags,
    keywords: req.body.keywords,
    concepts: req.body.concepts,
    entities: req.body.entities
  };

  if( record.tags.length === 0 ) {
    record.tags = null;
  } else {
    record.tags = record.tags.join( ',' );
  }    

  if( record.keywords.length === 0 ) {
    record.keywords = null;
  } else {
    record.keywords = record.keywords.join( ',' );
  }    

  if( record.concepts.length === 0 ) {
    record.concepts = null;
  } else {
    record.concepts = record.concepts.join( ',' );
  }    
  
  if( record.entities.length === 0 ) {
    record.entities = null;
  } else {
    record.entities = record.entities.join( ',' );
  }    

  let so = req.db.prepare( `
    SELECT StackOverflow.id
    FROM StackOverflow
    WHERE StackOverflow.uuid = ?
  ` )
  .get( 
    record.so_uuid
  );
  record.so_id = so.id;

  let info = req.db.prepare( `
    UPDATE StackOverflowAnswer
    SET 
      updated_at = ?,
      so_id = ?,
      answer = ?,
      question = ?,
      active_at = ?,
      accepted = ?,
      score = ?,
      link = ?,
      title = ?,
      tags = ?,
      keywords = ?,
      concepts = ?,
      entities = ?
    WHERE uuid = ?
  ` )
  .run(
    record.updated_at,
    record.so_id,
    record.answer,
    record.question,
    record.active_at,
    record.accepted,
    record.score,
    record.link,
    record.title,
    record.tags,
    record.keywords,
    record.concepts,
    record.entities,
    record.uuid
  );

  record = req.db.prepare( `
    SELECT
      StackOverflowAnswer.uuid AS "id",
      StackOverflowAnswer.created_at,
      StackOverflowAnswer.updated_at,
      StackOverflow.uuid AS "so_id",
      StackOverflowAnswer.answer,
      StackOverflowAnswer.question,
      StackOverflowAnswer.active_at,
      StackOverflowAnswer.accepted,
      StackOverflowAnswer.score,
      StackOverflowAnswer.link,
      StackOverflowAnswer.title,
      StackOverflowAnswer.tags,
      StackOverflowAnswer.keywords,
      StackOverflowAnswer.concepts,
      StackOverflowAnswer.entities
    FROM 
      StackOverflow,
      StackOverflowAnswer
    WHERE 
      StackOverflowAnswer.so_id = StackOverflow.id AND
      StackOverflowAnswer.uuid = ?
  ` )
  .get( 
    record.uuid 
  );

  if( record.tags === null ) {
    record.tags = [];
  } else {    
    record.tags = record.tags.split( ',' );
  }  

  if( record.keywords === null ) {
    record.keywords = [];
  } else {    
    record.keywords = record.keywords.split( ',' );
  }  

  if( record.concepts === null ) {
    record.concepts = [];
  } else {    
    record.concepts = record.concepts.split( ',' );
  }

  if( record.entities === null ) {
      record.entities = [];
  } else {    
    record.entities = record.entities.split( ',' );
  }

  res.json( record );  
} );

// Delete
router.delete( '/:id', ( req, res ) => {
  let info = req.db.prepare( `
    DELETE FROM StackOverflowAnswer
    WHERE StackOverflowAnswer.uuid = ?
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
