
    Label
    ===
    GET     /api/label                      Read all labels   
    GET     /api/label/id/:id               Read label by ID   
    GET     /api/label/developer/:id        Read labels for developer   
    POST    /api/label                      Create label   
            Body: {"name": "IBM"}
    POST    /api/label/:id/developer/:id    Assign developer to label   
    PUT     /api/label/id/:id               Replace label by ID
            Body: {"name": "IBM"}
    DELETE  /api/label/id/:id               Delete label by ID   

