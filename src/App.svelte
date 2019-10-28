<script>
import Developers from './Developers.svelte';
import Header from './Header.svelte';
import Repositories from './Repositories.svelte';
import Switcher from './Switcher.svelte';

let panel = 0;
</script>

<Header/>
<Switcher bind:index="{panel}"/>
<Developers style="display: {panel === 0 ? 'flex' : 'none'};"/>
<Repositories style="display: {panel === 1 ? 'flex' : 'none'};"/>
