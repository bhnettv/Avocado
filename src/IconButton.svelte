<script>
export let label;
export let icon;
</script>

<style>
button {
  background: none;
  background-color: #0062ff;
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;  
  border: none;
  color: #ffffff;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  height: 48px;
  margin: 0;
  padding: 0 60px 0 16px;
}
</style>

<button style="background-image: url( {icon} )">{label}</button>
