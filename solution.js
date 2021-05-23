{       
    //Passing rate: 15%, failure cases mostly need to transport seven more person to pass
	 
    //same idea as the solution of challenge #4
    init: function(elevators, floors) {
        let ups=[]; //indicate the direction each elevator is going, true for up, false for down.

        //initialize the ups array
        for(let i=0; i<elevators.length;i++){ 
            ups.push(false);
        }    

        let topFloor=floors.length-1;  //hold the number of the top floor

        let nextRoundUpMap = new Map();  //hold any floors which each elevator doesn't go this round for up
        let nextRoundDownMap = new Map();  //hold any floors which each elevator doesn't go this round for down

        //initialize both arrays
        for(let i=0; i<elevators.length;i++){
            nextRoundUpMap.set(i,[]);
            nextRoundDownMap.set(i,[]);
        }    

        //using forEach to set events for each elevators
        elevators.forEach(function(elevator,index){
            //When the elevator is idle 
            //let it stay on the groud floor if the elevator currently is going down
            //let it leave the ground floor if a passenger pressed a down button on a floor 
            elevator.on("idle",function(){
                let nextRoundUp=nextRoundUpMap.get(index);
                let nextRoundDown=nextRoundDownMap.get(index);  
                let up=ups[index];
                if(!up) {
                    elevator.goToFloor(0);
                }else{
                    if(nextRoundDown.length!=0){
                        elevator.goToFloor(nextRoundDown[0]);
                    }else{
                        ups[index]=!ups[index];
                        elevator.goingUpIndicator(ups[index]);
                        elevator.goingDownIndicator(!ups[index]);
                        elevator.goToFloor(0);
                    }   
                }
            });

            //After a passenger presses a button inside the elevator
            //Add that floor number to the queue 
            //and sort the queue in ascending order if the elevator is going up
            //sort the queue in descending order if the elevator is going down
            elevator.on("floor_button_pressed", function(floorNum){
                let up=ups[index];
                if(!elevator.destinationQueue.includes(floorNum)) {
                    elevator.goToFloor(floorNum,true);        
                    if(up) sortInAscending(elevator);
                    else sortInDescending(elevator);
                }
            });

            //After the elevator is done transporting all the passengers,
            //instead of must go to the top floor or the groud floor and then change the direction,
            //check if there is no one needs to be picked up beyond the floor the elevator currently is on
            //if yes, then change the direction right away
            elevator.on("stopped_at_floor", function(floorNum){
                let nextRoundUp=nextRoundUpMap.get(index);
                let nextRoundDown=nextRoundDownMap.get(index);  
                let up = ups[index];
                if(doneTrans(elevator)){
                    if(up) turnDown(elevator, floorNum, nextRoundDown, index);
                    else   turnUp(elevator, floorNum, nextRoundUp, index);
                } 
            });

        });


        //using forEach to set events for each floor of the building.
        floors.forEach(function (floor,floorNum) {
            //if a passenger presses the up button
            floor.on("up_button_pressed", function () {
                //Go through each elevator to see which one can pick the passenger up
                for(let i=0; i<elevators.length;i++){
                    let nextRoundUp=nextRoundUpMap.get(i);
                    let elevator = elevators[i];
                    let up = ups[i];                    
                    //if the elevator is going up
                    //check if the passenger can be picked up on its way
                    //If can't, we leave that floor to the next round when the elevator goes up again
                    if(canBePickedUp(elevator,floorNum, up, "up")){
                        if(!elevator.destinationQueue.includes(floorNum)){
                            elevator.goToFloor(floorNum,true);  
                            sortInAscending(elevator);
                            break;
                        }     
                    }
                    //At the end of the last loop, if no elevators can pick the passenger up this round
                    //check if the passenger can be picked up in the next round by any elevator
                    if(i==elevators.length-1){
                        for(let j=0; j<elevators.length;j++){
                            let nextRoundUp=nextRoundUpMap.get(j);
                            let up=ups[j];
                            if(!isQueued(up,floorNum,j)){
                                nextRoundUp.push(floorNum);
                                nextRoundUp.sort(function(a, b){return a - b});  
                                break;
                            }
                        }
                    }
                }

            }); 

            //if a passenger presses the down button
            floor.on("down_button_pressed", function () {
                //Go through each elevator to see which one can pick the passenger up
                for(let i=0; i<elevators.length;i++){
                    let nextRoundDown=nextRoundDownMap.get(i);
                    let elevator = elevators[i];
                    let up = ups[i];
                    //if the elevator is going down
                    //check if the passenger can be picked up on its way
                    //If can't, we leave that floor to the next round when the elevator goes down again
                    if(canBePickedUp(elevator,floorNum, up, "down")){
                        if(!elevator.destinationQueue.includes(floorNum)){
                            elevator.goToFloor(floorNum,true);  
                            sortInDescending(elevator);
                            break;
                        }
                    }
                    //At the end of the last loop, if no elevators can pick the passenger up this round
                    //check if the passenger can be picked up in the next round by any elevator
                    if(i==elevators.length-1){
                        for(let j=0; j<elevators.length;j++){
                            let nextRoundDown=nextRoundDownMap.get(j);
                            let up=ups[j];
                            if(!isQueued(up,floorNum,j)){
                                nextRoundDown.push(floorNum);
                                nextRoundDown.sort(function(a, b){return b - a});  
                                break;
                            }
                        }
                    }
                }
            }); 

        });




        //To check if the elevator has passed the floor
        function isPassed(elevator,floorNum,up){
            if(up) return floorNum<=elevator.currentFloor();
            else return floorNum>=elevator.currentFloor();
        }


        //To check if the floor is already in the destination queue
        function isQueued(up,floorNum,index){
            let nextRoundUp=nextRoundUpMap.get(index);
            let nextRoundDown=nextRoundUpMap.get(index);
            if(up) return nextRoundUp.includes(floorNum);
            else return nextRoundDown.includes(floorNum);

        }


        //To check if the elevator still has a floor to go
        function doneTrans(elevator){
            return elevator.destinationQueue.length==0;
        }

        //To check if the elevator is full
        function isNotFull(elevator){
            return elevator.loadFactor()<1;
        }  


        //To merge the nextRoundUp or nextRoundDown array with the queue
        function merge(elevator, up, nextRound, index){
            if(up){
                elevator.destinationQueue=nextRound;
                elevator.checkDestinationQueue();
                nextRoundUpMap.set(index,[]);
            }else{
                elevator.destinationQueue=nextRound;
                elevator.checkDestinationQueue();
                nextRoundDownMap.set(index,[]);
            }
        }

        //change the direction of the elevator to down if it meets all the conditions
        //or goes to the floor where a passenger needs to be pick up beyond its current floor
        function turnDown(elevator, floorNum, nextRoundDown, index){
            //if no one requests beyond its current floor on the opposite direction or it has reached to the top floor
            if(nextRoundDown.length==0||nextRoundDown[0]<=floorNum||floorNum==topFloor){
                ups[index]=!ups[index];
                elevator.goingUpIndicator(ups[index]);
                elevator.goingDownIndicator(!ups[index]);
                merge(elevator,ups[index],nextRoundDown,index);
            }else{
                elevator.goToFloor(nextRoundDown[0]);
            }   
        }

        //change the direction of the elevator to up if it meets one of the conditions
        //or goes to the floor where a passenger needs to be pick up beyond its current floor
        function turnUp(elevator, floorNum, nextRoundUp, index){
            //if no one requests beyond its current floor on the opposite direction or it has reached to the groud floor
            if(nextRoundUp.length==0||floorNum<=nextRoundUp[0]||floorNum==0){
                ups[index]=!ups[index];
                elevator.goingUpIndicator(ups[index]);
                elevator.goingDownIndicator(!ups[index]);
                merge(elevator,ups[index],nextRoundUp,index);
            }else{
                elevator.goToFloor(nextRoundUp[0]);
            }  
        }

        //sort the queue in ascending order
        function sortInAscending(elevator){
            elevator.destinationQueue.sort(function(a, b){return a - b});  
            elevator.checkDestinationQueue();
        }

        //sort the queue in descending order
        function sortInDescending(elevator){
            elevator.destinationQueue.sort(function(a, b){return b - a});  
            elevator.checkDestinationQueue();
        }

        //tell if the elevator can pick a passenger up on its way to some floor
        //yes if the elevator is going to the same direction as where the passenger is at
        //and is not passed yet and not full
        function canBePickedUp(elevator, floorNum, up, dir){
            if(dir==="up"){
                if(up && !isPassed(elevator,floorNum,up) && isNotFull(elevator)){
                    return true;
                }else{
                    return false;
                }
            }   

            if(dir==="down"){ 
                if(!up && !isPassed(elevator,floorNum,up) && isNotFull(elevator)){
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