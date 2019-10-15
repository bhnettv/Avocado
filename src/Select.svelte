<script>
export let value = 'id';
export let label = 'name';
export let options = [];
export let selected = null;
</script>

<style>
select {
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background: none;
  background-color: #f4f4f4;
  background-image: url( /img/arrow-down.svg );
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;    
  border: none;
  border-bottom: solid 1px #8d8d8d;
  border-radius: 0;
  box-shadow: none;
  color: #171717;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 39px;
  line-height: 40px;
  margin: 0;
  min-width: 100px;
  outline: solid 2px transparent;
  outline-offset: -2px;
  padding: 0 60px 0 16px;  
}

select:focus {
  outline: solid 2px #0062ff;
}

select:hover {
  background-color: #e5e5e5;
}
</style>

<select bind:value="{selected}">

{#each options as option}
  <option value="{option[value]}">{option[label]}</option>
{/each}  

</select>
