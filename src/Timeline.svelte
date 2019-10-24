<script>
import { social_index } from './stores.js';
import { tab_index } from './stores.js';
</script>

<div 
  style="display: {( $tab_index === 1 && $social_index === 1 ) ? 'flex' : 'none'}">
  <p>Timeline</p>
</div>
