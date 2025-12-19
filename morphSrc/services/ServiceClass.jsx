class ServiceClass {

  constructor( apis ) {
    this.apis = apis;
    console.log( 'Service Class Initialized' );
  }

  sayHi() {
    console.log('hallo from service!');
  }

}

export default ServiceClass;