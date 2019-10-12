<script>
export let selectedIndex = 0;
</script>

<style>
div {
  background-color: #171717;
}

button {
  background: none;
  border: none;
  border-top: solid 2px transparent;  
  color: #bebebe;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 46px;
  margin: 0;
  outline: none;
  padding: 0 16px 0 16px;
  transition: all 0.60s;
}

button.selected {
  background-color: #282828;
  border-top: solid 2px #0062ff;
  color: #ffffff;
}
</style>

<div>
  <button 
    class:selected="{selectedIndex === 0}"
    on:click="{() => selectedIndex = 0}">Developers</button>
  <button 
    class:selected="{selectedIndex === 1}"
    on:click="{() => selectedIndex = 1}">Repositories</button>
</div>
