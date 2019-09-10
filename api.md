
    Label
    ===
    GET     /api/label                      Read all labels   
    GET     /api/label/id/:id               Read label by ID   
    GET     /api/label/developer/:id        Read labels for developer   
    POST    /api/label                      Create label   
            Body: {
              "name": "IBM"
            }
    POST    /api/label/:id/developer/:id    Assign developer to label   
    PUT     /api/label/id/:id               Replace label by ID
            Body: {
              "name": "IBM"
            }
    DELETE  /api/label/id/:id               Delete label by ID   

    Developer
    ===
    GET     /api/developer                  Read all developers
    GET     /api/developer/id/:id           Read developer by ID
    GET     /api/developer/label/:id        Read developers for label
    POST    /api/developer                  Create developer
            Body: {
              "first": "Kevin", 
              "last": "Hoyt", 
              "nickname": null, 
              "email": "krhoyt@us.ibm.com", 
              "notes": null
            }
    POST    /api/developer/:id/label/:id    Assign label to developer
    PUT     /api/developer/id/:id           Replace developer by ID
            Body: {
              "first": "Kevin", 
              "last": "Hoyt", 
              "nickname": null, 
              "email": "krhoyt@us.ibm.com", 
              "notes": null
            }
    DELETE  /api/developer/:id/label/:id    Remove developer from label
    DELETE  /api/developer/id/:id           Delete developer by ID

    Blog
    ===
    GET     /api/blog                       Read all blogs
    GET     /api/blog/post                  Read all blog posts
    GET     /api/blog/id/:id                Read blog by ID
    GET     /api/blog/post/id/:id           Read blog post by ID
    GET     /api/blog/post/guid/:id         Read blog post by GUID
    POST    /api/blog                       Create blog
            Body: {
              "developer_id": "abc123", 
              "url": "something.com", 
              "feed": "something.com/rss"
            }
    POST    /api/blog/post                  Create blog post
            Body: {
              "blog_id": "abc123", 
              "published_at": "2019-01-01", 
              "guid": "abc+123", 
              "link": "something.com",
              "title": "Title", 
              "summary": "Something", 
              "views": 0, 
              "category": "one,two", 
              "keywords": "one,two", 
              "concepts": "one,two", 
              "entities": "one,two"
            }    
    PUT     /api/blog/id/:id                Replace blog by ID
            Body: {
              "developer_id": "abc123", 
              "url": "something.com", 
              "feed": "something.com/rss"
            }    
    PUT     /api/blog/post/id/:id           Replace blog post by ID
            Body: {
              "blog_id": "abc123", 
              "published_at": "2019-01-01", 
              "guid": "abc+123", 
              "link": "something.com",
              "title": "Title", 
              "summary": "Something", 
              "views": 0, 
              "category": "one,two", 
              "keywords": "one,two", 
              "concepts": "one,two", 
              "entities": "one,two"
            }        
    DELETE  /api/blog/id/:id                Delete blog by ID
    DELETE  /api/blog/post/id/:id           Delete blog post by ID

    Dev
    ===
    GET     /api/dev                        Read all Dev accounts
    GET     /api/dev/post                   Read all account posts
    GET     /api/dev/id/:id                 Read account by ID
    GET     /api/dev/post/id/:id            Read account post by ID
    GET     /api/dev/post/guid/:id          Read account post by GUID
    POST    /api/dev/post/reactions         Read account post reactions
            Body: {
              "url": "dev.to/post"
            }      
    POST    /api/dev                        Create Dev account
            Body: {
              "developer_id": "abc123", 
              "user_name": "joe_smith"
            }
    POST    /api/dev/post                   Create account post
            Body: {
              "dev_id": "abc123", 
              "published_at": "2019-01-01", 
              "guid": "abc+123", 
              "link": "something.com",
              "title": "Title", 
              "summary": "Something", 
              "likes": 0,
              "reading": 0,
              "unicorns": 0,
              "keywords": "one,two", 
              "concepts": "one,two", 
              "entities": "one,two"
            }    
    PUT     /api/dev/id/:id                 Replace Dev account by ID
            Body: {
              "developer_id": "abc123", 
              "user_name": "joe_smith"
            }    
    PUT     /api/dev/post/id/:id            Replace account post by ID
            Body: {
              "dev_id": "abc123", 
              "published_at": "2019-01-01", 
              "guid": "abc+123", 
              "link": "something.com",
              "title": "Title", 
              "summary": "Something", 
              "likes": 0,
              "reading": 0,
              "unicorns": 0,
              "keywords": "one,two", 
              "concepts": "one,two", 
              "entities": "one,two"
            }        
    DELETE  /api/dev/id/:id                 Delete Dev account by ID
    DELETE  /api/dev/post/id/:id            Delete account post by ID

    Medium
    ===
    GET     /api/medium                     Read all Medium accounts
    GET     /api/medium/post                Read all account posts
    GET     /api/medium/id/:id              Read account by ID
    GET     /api/medium/post/id/:id         Read account post by ID
    GET     /api/medium/post/guid/:id       Read account post by GUID
    POST    /api/medium/statistics          Read account social statistics
            Body: {
              "user_name": "jamesthom.as"
            }      
    POST    /api/medium/post/claps          Read account post claps
            Body: {
              "url": "medium.com/post"
            }                  
    POST    /api/medium                     Create Medium account
            Body: {
              "developer_id": "abc123", 
              "user_name": "joe_smith",
              "following": 0,
              "followed_by": 0
            }
    POST    /api/medium/post                Create account post
            Body: {
              "medium_id": "abc123", 
              "published_at": "2019-01-01", 
              "guid": "abc+123", 
              "link": "something.com",
              "title": "Title", 
              "summary": "Something", 
              "claps": 0,
              "category": "one,two",
              "keywords": "one,two", 
              "concepts": "one,two", 
              "entities": "one,two"
            }    
    PUT     /api/medium/id/:id              Replace Medium account by ID
            Body: {
              "developer_id": "abc123", 
              "user_name": "joe_smith",
              "following": 0,
              "followed_by": 0
            }    
    PUT     /api/medium/post/id/:id         Replace account post by ID
            Body: {
              "medium_id": "abc123", 
              "published_at": "2019-01-01", 
              "guid": "abc+123", 
              "link": "something.com",
              "title": "Title", 
              "summary": "Something", 
              "claps": 0,
              "category": "one,two",
              "keywords": "one,two", 
              "concepts": "one,two", 
              "entities": "one,two"
            }        
    DELETE  /api/medium/id/:id              Delete Medium account by ID
    DELETE  /api/medium/post/id/:id         Delete account post by ID    

    Watson
    ===
    POST    /api/watson/nlu                 Watson Natural Language Understanding (NLU)
            Body: {
              "url": "something.com/page/with/content"
            }
