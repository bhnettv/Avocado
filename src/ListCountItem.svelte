<script>
export let count = 0;
export let label = '';
</script>

<style>
p {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 46px;
  line-height: 46px;
  margin: 0;
  padding: 0 21px 0 16px;
}

span {
  float: right;
}
</style>

<p>{label} <span>{count}</span></p>
