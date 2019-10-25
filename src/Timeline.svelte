<script>
import { social_index } from './stores.js';
import { tab_index } from './stores.js';
</script>

<style>
div {
  flex-grow: 1;
}
</style>

<div 
  style="display: {( $tab_index === 1 && $social_index === 1 ) ? 'flex' : 'none'}">
  <p>Timeline</p>
</div>
