<script>
export let label = '';
</script>

<style>
p.content {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin: 4px 8px 0 0;
  padding: 0;
}

p.ratings {
  background: none;
  background-position: center left;
  background-repeat: no-repeat;
  background-size: 18px 21px;
  color: #a8a8a8;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  padding: 0 0 0 22px;  
}

p.stamp {
  color: #a8a8a8;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin: 8px 8px 0 0;
  padding: 0;
}

p.title {
  color: #393939;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin: 8px 8px 0 0;
  padding: 0;  
}

p.ratings.favorite {
  background-image: url( /img/favorite.svg );  
  margin-left: 16px;
}

p.ratings.repeat {
  background-image: url( /img/repeat.svg );  
}

div.channel {
  background: none;
  background-position: center left;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 36px;
  height: 36px;
  min-height: 36px;
  min-width: 36px;
  margin: 8px 8px 8px 8px;
  width: 36px;
}

div.channel.blog {
  background-image: url( /img/blog.svg );  
}

div.details {
  display: flex;
  flex-direction: column;
}

div.tile {
  background-color: white;
  display: flex;
  flex-direction: row;
}
</style>

<div class="tile">
  <div class="channel blog"></div>
  <div class="details">
    <div class="tile">
      <p class="title">Recursive Directory Removal in Node.js</p>
      <p class="stamp">1d</p>        
    </div>
    <p class="content">@kleeut Having issues with a mono-repo and updating package versions @kleeut Having issues with a mono-repo and updating package versions</p>
    <div class="tile" style="display: flex; flex-direction: row; margin-bottom: 8px; margin-top: 8px;">
      <p class="ratings repeat">12</p>
      <p class="ratings favorite">34</p>
      <p class="ratings favorite">56</p>      
    </div>
  </div>

</div>
