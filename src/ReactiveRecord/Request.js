export default class ReactiveRecordRequest {
  constructor({ status=null, body=null }){
    this.status=status;
    this.body=body;
  }

  get clear(){
    return () => {
      this.status=null;
      this.body=null;
    }
  }
}
