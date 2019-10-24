<script>
export let opened = true;
export let summary = 'Details';
</script>

<style>
button {
  border: none;
  background: none;
  background-image: url( /img/arrow-down.svg );
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 18px;
  margin: 0;
  outline: none;
  padding: 0;
  width: 40px;
}

button.closed {
  background-position: center left 16px;
  transform: rotate( 180deg );
}

div.pane {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

div.pane.closed {
  flex-grow: initial;
  height: 48px;
}

div.summary {
  background-color: #dcdcdc;  
  display: flex;
  flex-direction: row;
}

p {
  color: #393939;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 48px;
  margin: 0;
  padding: 0 0 0 16px;
}
</style>

<div class="pane" class:closed="{!opened}">
  <div class="summary">
    <p>{summary}</p>
    <button 
      class:closed="{!opened}"
      on:click="{( evt ) => opened = !opened}">
    </button>    
  </div>
  <slot></slot>
</div>
