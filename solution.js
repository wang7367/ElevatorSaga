{        
    //Passing rate: 95%

    //Same idea as the solution for challenge #2
	//but change the direction of the elevator once we find out there is no more requests on its way of the current direction
	//instead of only change the direction when it reaches the top floor or the groud floor, to reduce the waiting time
    init: function(elevators, floors) {
        var elevator = elevators[0]; 

        let up = false;  //indicate the direction the elevator is going, true for up, false for down.

        let topFloor=floors.length-1; //hold the number of the top floor

        let nextRoundUp=[];  //hold any floors which the elevator doesn't go this round for up
        let nextRoundDown=[]; //hold any floors which the elevator doesn't go this round for down

        //When the elevator is idle 
        //let it stay on the groud floor if the elevator currently is going down
        //let it leave the ground floor if a passenger pressed a down button on a floor 
        elevator.on("idle",function(){
            if(!up) {
                elevator.goToFloor(0);
            }else{
                if(nextRoundDown.length!=0){
                    elevator.goToFloor(nextRoundDown[0]);
                }else{
                        up=!up;
                        elevator.goToFloor(0);
                } 
            }
        });
        
        //After a passenger presses a button inside the elevator
        //Add that floor number to the queue 
        //and sort the queue in ascending order if the elevator is going up
        //sort the queue in descending order if the elevator is going down
        elevator.on("floor_button_pressed", function(floorNum){
            if(!elevator.destinationQueue.includes(floorNum)) {
                elevator.goToFloor(floorNum,true);        
                if(up) sortInAscending();                  
                else sortInDescending();
            }
        });

        //After the elevator is done transporting all the passengers,
        //instead of must go to the top floor or the groud floor and then change the direction,
        //check if there is no one needs to be picked up beyond the floor the elevator currently is on
        //if yes, then change the direction right away
        elevator.on("stopped_at_floor", function(floorNum){
            if(doneTrans()){
                if(up) turnDown(floorNum);
                else   turnUp(floorNum);
            } 
        });


        //using forEach to set events for each floor of the building
        floors.forEach(function (floor,floorNum) {
            //if a passenger presses the up button
            floor.on("up_button_pressed", function () {
                //if the elevator is going up
                //check if the passenger can be picked up on its way
                //If can't, we leave that floor to the next round when the elevator goes up again
                if(canBePickedUp(floorNum, "up")){ 
                    //make sure the elevator was not planning to that floor
                    if(!elevator.destinationQueue.includes(floorNum)){
                        elevator.goToFloor(floorNum,true);  
                        sortInAscending();
                    }
                }else{
                    if(!isQueued(up,floorNum)){
                        nextRoundUp.push(floorNum);
                        nextRoundUp.sort(function(a, b){return a - b});  // sort the array in ascending order we will use for the next round
                    }
                }
            });

            //if a passenger presses the down button
            floor.on("down_button_pressed", function () {
                //if the elevator is going down
                //check if the passenger can be picked up on its way
                //If can't, we leave that floor to the next round when the elevator goes down again
                if(canBePickedUp(floorNum, "down")){ 
                    //make sure the elevator was not going to that floor
                    if(!elevator.destinationQueue.includes(floorNum)){
                        elevator.goToFloor(floorNum,true);
                        sortInDescending();
                    }
                }else{
                    if(!isQueued(up,floorNum)){
                        nextRoundDown.push(floorNum);
                        nextRoundDown.sort(function(a, b){return b - a});  // sort the array in descending order we will use for the next round
                    }
                }
            });

        }); 

        //To check if the elevator has passed the floor
        function isPassed(floorNum){
            if(up) return floorNum<=elevator.currentFloor();
            else return floorNum>=elevator.currentFloor();
        }


        //To check if the floor is already in the destination queue
        function isQueued(up,floorNum){
            if(up) return nextRoundUp.includes(floorNum);
            else return nextRoundDown.includes(floorNum);
        }


        //To check if the elevator still has a floor to go
        function doneTrans(){
            return elevator.destinationQueue.length==0;
        }

        //To check if the elevator is full
        function isNotFull(){
            return elevator.loadFactor()<1;
        }  


        //To merge the nextRoundUp or nextRoundDown array with the queue
        function merge(){
            if(up){
                elevator.destinationQueue=nextRoundUp;
                elevator.checkDestinationQueue();
                nextRoundUp=[];
            }else{
                elevator.destinationQueue=nextRoundDown;
                elevator.checkDestinationQueue();
                nextRoundDown=[];
            }
        }

        //change the direction of the elevator to down if it meets all the conditions
        //or goes to the floor where a passenger needs to be pick up beyond its current floor
        function turnDown(floorNum){
            //if no one requests beyond its current floor on the opposite direction or it has reached to the top floor
            if(nextRoundDown.length==0||nextRoundDown[0]<=floorNum||floorNum==topFloor){
                up=!up;
                elevator.goingUpIndicator(up);
                elevator.goingDownIndicator(!up);
                merge();
            }else{
                elevator.goToFloor(nextRoundDown[0]);
            }   
        }
        
        //change the direction of the elevator to up if it meets one of the conditions
        //or goes to the floor where a passenger needs to be pick up beyond its current floor
        function turnUp(floorNum){
            //if no one requests beyond its current floor on the opposite direction or it has reached to the groud floor
            if(nextRoundUp.length==0||floorNum<=nextRoundUp[0]||floorNum==0){
                up=!up;
                elevator.goingUpIndicator(up);
                elevator.goingDownIndicator(!up);
                merge();
            }else{
                elevator.goToFloor(nextRoundUp[0]);
            }  
        }

        //sort the queue in ascending order
        function sortInAscending(){
            elevator.destinationQueue.sort(function(a, b){return a - b});  
            elevator.checkDestinationQueue();
        }

        //sort the queue in descending order
        function sortInDescending(){
            elevator.destinationQueue.sort(function(a, b){return b - a});  
            elevator.checkDestinationQueue();
        }

        //tell if the elevator can pick a passenger up on its way to some floor
        //yes if the elevator is going to the same direction as where the passenger is at
        //and is not passed yet and not full
        function canBePickedUp(floorNum, dir){
            if(dir==="up"){
                if(up && !isPassed(floorNum) && isNotFull()){
                    return true;
                }else{
                    return false;
                }
            }   

            if(dir==="down"){ 
                if(!up && !isPassed(floorNum) && isNotFull()){
                    return true;
                }else{
                    return false;
                }
            }
        }
         


    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}