<script>
export let index = -1;
export let labelField = 'label';
export let options = [];
export let top = 0;
</script>

<style>
button {
  background: none;
  border: none;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 40px;
  text-align: left;
  width: 100%;
}

ul {
  background-color: #f4f4f4;
  box-shadow: 0 2px 6px 0 rgba( 0, 0, 0, 0.3 );
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  width: 100%;
  z-index: 100;
}

li {
  outline: solid 2px transparent;    
  outline-offset: -2px;    
  width: 100%;
}

li.selected {
  background-color: #e5e5e5; 
  outline: solid 2px #0062ff;  
}

li:hover {
  background-color: #e5e5e5;
}
</style>

<ul style="top: {top}px;">

  {#each options as item, i}    

    <li class:selected="{index === i ? true : false}">
      <button type="button">{item[labelField]}</button>
    </li>

  {/each}

</ul>
