
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

    Media
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - url
    - keywords (comma-separated)

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
    - category (comma-separated)
    - keywords (comma-separated)
    - concepts (comma-separated)
    - entities (comma-separated)

    BlogPostMedia
    ===
    - id
    - guid
    - created_at
    - updated_at
    - post_id (*)
    - media_id (*)

    Dev
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - developer_id (*)
    - user_name

    DevPost
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - dev_id (*)
    - published_at
    - guid
    - link
    - title
    - summary
    - likes
    - reading
    - unicorn
    - keywords (comma-separated)
    - concepts (comma-separated)
    - entities (comma-separated)

    Medium
    ===
    - id
    - uuuid
    - created_at
    - updated_at
    - developer_id (*)
    - user_name
    - following
    - followed_by

    MediumPost
    ===
    - id
    - uuid
    - created_at
    - updated_at
    - medium_id (*)
    - published_at
    - guid
    - link
    - title
    - summary
    - claps
    - category (comma-separated)
    - keywords (comma-separated)
    - concepts (comma-separated)
    - entities (comma-separated)
