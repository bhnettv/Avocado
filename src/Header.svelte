<script>
export let version = '2019.10.21';
</script>

<style>
div {
  background-color: #171717;
  display: flex;
  flex-direction: row;
  padding: 0 16px 0 16px;
  height: 48px;
}

p {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;  
  line-height: 48px;
  margin: 0;
  padding: 0;
}

p:first-of-type {
  color: #ffffff;
  flex-grow: 1;
}

p:last-of-type {
  color: #bebebe;
}

p > span {
  font-weight: 600;
}
</style>

<div>
  <p>Avocado <span>Developer Relations</span></p>
  <p>{version}</p>
</div>
