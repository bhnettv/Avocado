<script>
import IconButton from './IconButton.svelte';

export let visible = true;
</script>

<style>
div {
  border-top: solid 1px #f3f3f3;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
</style>

<div style="display: {visible ? 'flex' : 'none'}">
  <IconButton label="Edit" icon="/img/edit.svg"/>
</div>
