<script>
export let placeholder = 'Search';
export let value = '';
</script>

<style>
input {
  background: none;
  background-image: url( /img/search.svg );
  background-position: center left 15px;
  background-repeat: no-repeat;
  background-size: 20px;
  border: none;
  color: #171717;
  flex-grow: 1;  
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 48px;  
  margin: 0;
  min-width: 40px;
  padding: 0 16px 0 40px;    
}
</style>

<input bind:value="{value}" placeholder="{placeholder}" on:keydown>
