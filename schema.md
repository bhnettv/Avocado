
    Label
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - name

    Developer
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - first
    - last
    - nickname
    - email
    - notes

    DeveloperLabel
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - developer_id (*)
    - label_id (*)

    Blog
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - developer_id (*)
    - url
    - feed

    BlogPost
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - blog_id (*)
    - published_at
    - guid
    - link
    - title
    - summary
    - views
    - category
    - keywords
    - concepts
    - entities

