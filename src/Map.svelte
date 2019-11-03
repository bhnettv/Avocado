<script>    
export let latitude = null;
export let longitude = null;
export let zoom = 11;

let container = undefined;
let map = undefined;
let view = undefined;

$: if( view !== undefined ) {
  view.goTo( [
    longitude === null ? -73.7182409 : longitude, 
    latitude === null ? 41.1135751 : latitude
  ] );
}

require( [
  'esri/Map',
  'esri/views/MapView'
], function( Map, MapView ) {
  map = new Map( {
    basemap: 'streets-navigation-vector'
  } );

  view = new MapView( {
    container: container,
    map: map,
    center: [longitude, latitude],
    zoom: zoom
  } );
  view.ui.components = ['attribution'];
} );
</script>

<style>
div {
  flex-grow: 1;
}
</style>

<div bind:this="{container}"></div>
