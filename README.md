
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

    Developer
    ===
    GET     /api/developer                  Read all developers
    GET     /api/developer/id/:id           Read developer by ID
    GET     /api/developer/label/:id        Read developers for label
    POST    /api/developer                  Create developer
            Body: {"first": "Kevin", "last": "Hoyt", "nickname": null, "email": "krhoyt@us.ibm.com", "notes": null}
    POST    /api/developer/:id/label/:id    Assign label to developer
    PUT     /api/developer/id/:id           Replace developer by ID
            Body: {"first": "Kevin", "last": "Hoyt", "nickname": null, "email": "krhoyt@us.ibm.com", "notes": null}
    DELETE  /api/developer/:id/label/:id    Remove developer from label
    DELETE  /api/developer/id/:id           Delete developer by ID
