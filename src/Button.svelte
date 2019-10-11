<script>
export let label;
export let icon;
</script>

<style>
button {
  background: none;
  background-color: #0062ff;
  border: none;
  color: #ffffff;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  height: 48px;
  margin: 0;
  padding: 0 60px 0 16px;
}

button.icon {
  background-image: url( '/img/add.svg' );
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;
}
</style>

<button class:icon="{icon === null ? false : true}">{label}</button>
