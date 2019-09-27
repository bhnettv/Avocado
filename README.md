Consumer off-the-shelf (COTS) developer relations tooling.

Install

    # Python 3+
    # Node.js 12+
    pip install -r requirements.txt
    npm install

Configure

- Google YouTube API key
- Twitter key
- Twitter secret
- Stack Apps application key
- GitHub access token

Start

    npm start

Manage

    http://localhost:3000

Populate

- Add some developers
- Add endpoints for each developer
  - Blog
  - Dev.to
  - Medium
  - YouTube
  - Twitter
  - Stack Overflow
  - GitHub
- Add some repositories to monitor
  - Code samples
  - SDKs

Aggregate

    python blog.py
    python dev.py
    python medium.py
    python youtube.py
    python twitter.py
    python so.py
    python github.py
    python repository.py
