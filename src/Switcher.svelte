<script>
export let index = 0;
</script>

<style>
div {
  background-color: #171717;
  display: flex;
  flex-direction: row;
}

button {
  background: none;
  border: none;
  border-top: solid 3px #282828;  
  color: #bebebe;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 48px;
  line-height: 48px;
  margin: 0 2px 0 0;
  min-width: 125px;
  outline: none;
  padding: 0;
  transition: all 0.60s;
}

button:hover {
  border-top: solid 3px #bebebe;
  color: #ffffff;
}

button.selected {
  background-color: #282828;
  border-top: solid 3px #0062ff;
  color: #ffffff;
  font-weight: 600;
}
</style>

<div>
  <button 
    class:selected="{index === 0}"
    on:click="{() => index = 0}">Developers</button>
  <button 
    class:selected="{index === 1}"
    on:click="{() => index = 1}">Repositories</button>
</div>
