<script>
import Developers from './Developers.svelte';
import Header from './Header.svelte';
import Repositories from './Repositories.svelte';
import Switcher from './Switcher.svelte';

let panel = 0;
</script>

<Header/>
<Switcher bind:index="{panel}"/>
<Developers hidden="{panel === 0 ? false : true}"/>
<Repositories hidden="{panel === 1 ? false : true}"/>
