class Team {
  constructor() {
    this._root = document.querySelector( '#advocates div.team' );
    this.$list = this._root.querySelector( 'cv-datatable' );  
    this.$list.addEventListener( 'change', ( evt ) => this.doListChange( evt ) );
    this.load();
  }

  load() {
    fetch( '/api/team' )
    .then( response => response.json() )
    .then( data => {
      this.$list.dataProvider = data.splice( 0 );
    } );      
  }

  doListChange( evt ) {
    console.log( evt.detail.selectedItem.id );
  }
}
