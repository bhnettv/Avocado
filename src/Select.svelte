<script>
export let value = 'id';
export let label = 'name';
export let options = [];
</script>

<style>
select {
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background: none;
  background-color: #f3f3f3;
  background-image: url( /img/arrow-down.svg );
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;    
  border: none;
  border-bottom: solid 1px #8c8c8c;
  border-radius: 0;
  box-shadow: none;
  color: #171717;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 39px;
  line-height: 40px;
  margin: 0;
  min-width: 100px;
  padding: 0 60px 0 16px;  
}
</style>

<select>

{#each options as option}
  <option value="{option[value]}">{option[label]}</option>
{/each}  

</select>
