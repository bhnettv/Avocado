class Team {
  constructor() {
    this._root = document.querySelector( '#advocates div.team' );

    this.$list = this._root.querySelector( 'cv-datatable' );  
    this.$list.addEventListener( 'itemEditEnd', ( evt ) => this.doListEdit( evt ) );

    this.load();
  }

  load() {
    fetch( '/api/team' )
    .then( response => response.json() )
    .then( data => {
      this.$list.dataProvider = data.splice( 0 );
    } );      
  }

  doListEdit( evt ) {
    console.log( evt.detail );
  }
}
