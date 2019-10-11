<script>
export let selectedIndex = 0;
</script>

<style>
div {
  border-bottom: solid 1px #f3f3f3;
}

button {
  background: none;
  border: none;
  border-bottom: solid 2px transparent;  
  color: #565656;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 44px;
  margin: 0;
  outline: none;
  padding: 2px 16px 0 16px;
  transition: all 0.60s;
}

button.selected {
  border-bottom: solid 2px #0062ff;
  color: #171717;
}
</style>

<div>
  <button 
    class:selected="{selectedIndex === 0}"
    on:click="{() => selectedIndex = 0}">Overview</button>
  <button 
    class:selected="{selectedIndex === 1}"
    on:click="{() => selectedIndex = 1}">Social</button>
  <button 
    class:selected="{selectedIndex === 2}"
    on:click="{() => selectedIndex = 2}">Notes</button>
</div>
