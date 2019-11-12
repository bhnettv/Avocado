<script>
export let id = undefined;
export let channel = undefined;
export let endpoint = undefined;

let deletable = false;
</script>

<style>
button {
  background: none;
  border: none;
  background-image: url( /img/delete.svg );
  background-position: center;
  background-repeat: no-repeat;
  background-size: 20px;
  cursor: pointer;
  height: 46px;
  outline: none;
  width: 46px;
}

div {
  display: flex;
  flex-direction: row;
}

p {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 46px;
  line-height: 46px;
  margin: 0;
  padding: 0 16px 0 32px;
}

p.channel {
  width: 160px;
}

p.endpoint {
  flex-grow: 1; 
  padding: 0 16px 0 11px;
}
</style>

<div
  on:mouseover="{() => deletable = true}"
  on:mouseout="{() => deletable = false}">
  <p class="channel">{channel}</p>
  <p class="endpoint">{endpoint}</p>
  <button style="display: {deletable ? 'initial' : 'none'}" on:click></button>  
</div>
