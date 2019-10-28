<script>
export let placeholder = 'Search';
export let value = '';
</script>

<style>
input {
  background: none;
  background-color: #f4f4f4;  
  background-image: url( /img/search.svg );
  background-position: center left 15px;
  background-repeat: no-repeat;
  background-size: 20px;
  border: none;
  color: #161616;
  flex-grow: 1;  
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 48px;  
  margin: 0;
  min-width: 40px;
  outline: solid 2px transparent;
  outline-offset: -2px;  
  padding: 0 16px 0 40px;    
}

input:focus {
  outline: solid 2px #0062ff;
}
</style>

<input bind:value="{value}" placeholder="{placeholder}" on:keydown>
