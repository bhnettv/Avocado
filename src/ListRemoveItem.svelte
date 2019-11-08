<script>
export let label = '';

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
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 46px;
  line-height: 46px;
  margin: 0;
  padding: 0 21px 0 16px;
}

span {
  float: right;
}
</style>

<div 
  on:mouseover="{() => deletable = true}"
  on:mouseout="{() => deletable = false}">
  <p>{label}</p>
  <button style="display: {deletable ? 'initial' : 'none'}" on:click></button>
</div>

