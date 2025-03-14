import parseExpression from'../../lib/custom/parsers/parser.js'

class MessageService {
    constructor() {
      this.sequenceFlowConditions = [];
      this.simIsRunning = false
    } 
  
    add(id, cond) {
      this.sequenceFlowConditions.push({ id, cond });
    }
    begin(){
      this.simIsRunning=true
    }
    end(){
      this.simIsRunning=false;
    }
    remove(id) {
      this.sequenceFlowConditions = this.sequenceFlowConditions.filter(item => item.id !== id);
    }
  
    getValue(id) {
      const tuple = this.sequenceFlowConditions.find(item => item.id === id);
      console.log(tuple.cond)
      try {
        if (tuple) {
          const parsedValue = parseExpression(tuple.cond, [], []);
          return parsedValue;
        }
      } catch (err) {
        console.log(err)
        return err;
      }
      return undefined;
    }
    
    exist(id) {
        const tuple = this.sequenceFlowConditions.find(item => item.id === id);
        return tuple ? tuple.id : null; // Return the id if found, or null if not found
      }
      
  }
  
  // Create a single instance of the service
  const messageService = new MessageService();
  
  export default messageService;
  