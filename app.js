window.onload = ()=>{
    const slope = new Image();
    slope.src = './Assets/Slopes.png'
    const cloud = new Image();
    cloud.src = './Assets/Cloud.png'
    const rain = new Image();
    rain.src = './Assets/Flow.png'
    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d');

    let toolState = 'walls';

    const gridStats = {    //Grid Stats
        _screenSize : 2000,     //Default Value
        _gridRowNum : 20,       //Default Value
        _gridSquareSize : 100,  //Default Value
        _noOfGrid : 200,
        set screenSize(para = 2000){
            this._screenSize = para;
            this._gridSquareSize = this._screenSize/this._gridRowNum;
            this._gridRowNum = this._screenSize/this._gridSquareSize;
        },
        set gridRowNum(para = 20){
            this._gridRowNum = para;
            this._gridSquareSize = this._screenSize/para;
        },
        get noOfGrid(){
            this._noOfGrid = this._gridRowNum * this._gridRowNum;
            return this._noOfGrid;
        },
        set gridSquareSize(para = 100){
            this._gridSquareSize = para;
            this._gridRowNum = this._screenSize/para;
        },
        get screenSize(){
            return this._screenSize;
        },
        get gridRowNum(){
            return this._gridRowNum;
        },
        get gridSquareSize(){
            return this._gridSquareSize;
        },
    }
    const gridData = [];
    let staticWallsIndex = [];
    let particlesData = [];
    // let inlets = [];
    // let outlets = [];

    let mouseX = 0;
    let mouseY = 0;

    gridStats.screenSize = 500;
    gridStats.gridSquareSize = 10;
    canvas.width = gridStats.screenSize;
    canvas.height = gridStats.screenSize;
    canvas.style.width = gridStats.screenSize;
    canvas.style.height = gridStats.screenSize;
    
    {   //initialize gridData {index,rowNum,colNum,xMin,xMax,yMin,yMax,xCenter,yCenter}
        let rowNo = 0;
        let x = 0;
        let y = 0;
        let colNo = 0;
        for(let i=0;i<gridStats.noOfGrid;i++){
            gridData.push({
                index: i,
                rowNum: rowNo,
                colNum: colNo,
                xMin: x,
                xMax: x+gridStats.gridSquareSize,
                xCenter: (2*x + gridStats.gridSquareSize)/2,
                yMin: y,
                yMax: y+gridStats.gridSquareSize,
                yCenter: (2*y + gridStats.gridSquareSize)/2
            })
            colNo += 1;
            x += gridStats.gridSquareSize;
            if((i+1)%gridStats.gridRowNum==0){
                colNo = 0;
                x = 0;
                rowNo += 1;
                y += gridStats.gridSquareSize;
            }
        }
    };
    function returnCenterFromIndex(index,gridD = gridData){
        let xCenter = -1;
        let yCenter = -1;
        let xMin = -1;
        let xMax = -1;
        let yMin = -1;
        let yMax = -1;
        let velX = 0;
        let velY = 0;
        gridD.forEach((grid)=>{
            if(grid.index==index){
                xCenter = grid.xCenter;
                yCenter = grid.yCenter;
                xMin = grid.xMin;
                xMax = grid.xMax;
                yMin = grid.yMin;
                yMax = grid.yMax;
                velX = grid.velX;
                velY = grid.velY;
            }
        })
        return {x:xCenter,y:yCenter,xMin:xMin,xMax:xMax,yMin:yMin,yMax:yMax,velX:velX,velY:velY};
    }
    function returnSign(number){
        if(number < 0){
            return -1;
        }
        if(number > 0){
            return 1;
        }
        if(number == 0){
            return 0;
        }
    }
    function dragAcc(particle,dragAcc,maxAcc){
        if(Math.abs(particle.acc.x)>maxAcc){
            const sign = returnSign(particle.acc.x);
            particle.acc.x = sign*maxAcc;
        }
        if(Math.abs(particle.acc.y)>maxAcc){
            const sign = returnSign(particle.acc.y);
            particle.acc.y = sign*maxAcc;
        }
        if(Math.abs(particle.acc.x)>0){
            particle.acc.x *= dragAcc;
        }
        if(Math.abs(particle.acc.y)>0){
            particle.acc.y *= dragAcc;
        }
    }
    function dragVel(particle,dragVel,maxVel,minVel){
        if(Math.abs(particle.vel.x)>maxVel){
            const sign = returnSign(particle.vel.x);
            particle.vel.x = sign*maxVel;
        }
        if(Math.abs(particle.vel.y)>maxVel){
            const sign = returnSign(particle.vel.y);
            particle.vel.y = sign*maxVel;
        }
        if(Math.abs(particle.vel.x)>0){
            particle.vel.x *= dragVel;
        }
        if(Math.abs(particle.vel.y)>0){
            particle.acc.y *= dragVel;
        }
        if(Math.abs(particle.vel.x)<minVel){
            const sign = returnSign(particle.vel.x);
            particle.vel.x = sign*minVel;
        }
        if(Math.abs(particle.vel.y)<minVel){
            const sign = returnSign(particle.vel.y);
            particle.vel.y = sign*minVel;
        }
        if(particle.vel.x == 0 && particle.vel.y ==0){
            particle.vel.x = minVel;
            particle.vel.y = minVel;
        }
    }
    function updateVelCollision(particle,particlesD=particlesData){
        particle.vel.x += particle.acc.x;
        particle.vel.y += particle.acc.y;
        particlesD.forEach((otherParticle)=>{
            if(otherParticle!==particle){
                if(particle.index==otherParticle.index){
                    if(otherParticle.type=='walls'){
                        const opData = returnCenterFromIndex(otherParticle.index);
                        if(particle.coordinates.x>opData.xMin && particle.coordinates.x<opData.xMax){
                            particle.vel.x *= 1;
                            particle.vel.y *= -1;
                        }else if(particle.coordinates.y>opData.yMin && particle.coordinates.y<opData.yMax){
                            particle.vel.x *= -1;
                            particle.vel.y *= 1;
                        }else{
                            particle.vel.x *= -1;
                            particle.vel.y *= -1;
                        }
                    }else if(otherParticle.type=='particle'){
                        const dirX = returnSign(particle.vel.x)!=0?returnSign(particle.vel.x):-1;
                        const dirY = returnSign(particle.vel.y)!=0?returnSign(particle.vel.y):-1;
                        const dirXother = returnSign(otherParticle.vel.x)!=0?returnSign(otherParticle.vel.x):-1;
                        const dirYother = returnSign(otherParticle.vel.y)!=0?returnSign(otherParticle.vel.y):-1;
                        let newVelX = (Math.abs(particle.vel.x)+Math.abs(otherParticle.vel.x))/2
                        let newVelY = (Math.abs(particle.vel.y)+Math.abs(otherParticle.vel.y))/2
                        particle.vel.x = dirXother*newVelX;
                        particle.vel.x = dirYother*newVelX;
                        otherParticle.vel.x = dirX*newVelX;
                        otherParticle.vel.x = dirY*newVelX;
                    }
                }
            }
        })
    }
    function removeEscapedParticles(particles,gridStats){
        let result = particles.filter((particle)=>{
            let condition = !(particle.coordinates.x < gridStats.gridSquareSize ||
                            particle.coordinates.x > (gridStats.gridSquareSize*(gridStats.gridRowNum-1)) ||
                            particle.coordinates.y < gridStats.gridSquareSize ||
                            particle.coordinates.y > (gridStats.gridSquareSize*(gridStats.gridRowNum-1)));
            return condition;
        })
        return result;
    }
    class particles{
        constructor(index,type,gridD = gridData){
            this.type = type
            this.index = index;
            this.coordinates = {x:returnCenterFromIndex(index).x,y:returnCenterFromIndex(index).y};
            this.vel = {x:getRndInteger(0,100)/100,y:getRndInteger(-100,100)/100};
            this.acc = {x:0,y:0};
            this.updateParticle = ()=>{
                dragAcc(this,0,0);
                dragVel(this,1,1,0.01);
                updateVelCollision(this);
                this.coordinates.x += this.vel.x;
                this.coordinates.y += this.vel.y;
                this.index = gridIndexOnMouseHover(gridD,this.coordinates.x,this.coordinates.y)       
            }
        }
    }
    let inlets = [];
    function addInlet(gridD = gridData,gS=gridStats){
        let colNo = [3,4,5,6,7];
        let rowNo = (gS.gridRowNum - 2);
        colNo.forEach((value)=>{
            inlets.push(value-1 + rowNo*(gS.gridRowNum-1));
        })
        gridD.forEach((grid)=>{
            inlets.forEach((index)=>{
                if(grid.index == index){
                    let particleExists = false;
                    particlesData.forEach((particle)=>{
                        if(particle.index==grid.index){
                            particleExists = true;
                        };
                    })
                    if(!particleExists){
                        particlesData.push(new particles(grid.index,'inlet'));
                    }
                }
            })
        });
    }
    addInlet();
    let outlets = [];
    function addOutlet(gridD = gridData,gS=gridStats){
        let colNo = [35,36,37,38,39];
        let rowNo = 3;
        colNo.forEach((value)=>{
            outlets.push(value-1 + rowNo*(gS.gridRowNum-1));
        })
        gridD.forEach((grid)=>{
            outlets.forEach((index)=>{
                if(grid.index == index){
                    let particleExists = false;
                    particlesData.forEach((particle)=>{
                        if(particle.index==grid.index){
                            particleExists = true;
                        };
                    })
                    if(!particleExists){
                        particlesData.push(new particles(grid.index,'outlet'));
                    }
                }
            })
        });
    }
    addOutlet();
    function addParticlesThroughInlet(gridD = gridData){
        inlets.forEach((index)=>{
            if(getRndInteger(1,10)==1){
                gridD.forEach((grid)=>{
                    if(grid.index == index){
                            particlesData.push(new particles(grid.index,'particle'));
                        }
                })
            }
        })
    }
    function returnParticlesTouchingOutlet(gridD = gridData){
        let count = -5;
        outlets.forEach((index)=>{
            particlesData.forEach((particle)=>{
                if (particle.index == index){
                    count++
                }
            })
        })
        return count;
    }
    toolState = 'walls';
    canvas.addEventListener("mousemove",(event)=>{
        mouseX = event.clientX;
        mouseY = event.clientY;
        mouseHeld(held,event);
    });
    canvas.addEventListener("dblclick",(event)=>{
        toolState = 'particle';
    })
    canvas.addEventListener('click',(event)=>{
        mouseHeld(true,event);
    });
    let held = false;
    canvas.addEventListener("mousedown",(event)=>{
        held = true;
    });
    canvas.addEventListener("mouseup",(event)=>{
        held = false;
    });
    function mouseHeld(held,event,gridD=gridData){
        if(held){
            mouseX = event.clientX;
            mouseY = event.clientY;
            gridD.forEach((grid)=>{
                if(grid.index == gridIndexOnMouseHover(gridD,mouseX,mouseY)){
                    let particleExists = false;
                    particlesData.forEach((particle)=>{
                        if(particle.index==grid.index){
                            particleExists = true;
                        };
                    })
                    if(!particleExists){
                        particlesData.push(new particles(grid.index,toolState));
                    }
                }
            });
        }
    }
    function addWalls(arrIndex,gridD = gridData){
        arrIndex.forEach((index)=>{
            gridD.forEach((grid)=>{
                if(grid.index == index){
                        particlesData.push(new particles(index,'walls'));
                    }
            });
        }) 
    }
    let maxFlow = 0;
    let maxSustainedFlow = 0;
    let sustainedFlow = 0;
    let sustainedIterationStart = 0;
    let sustainedIterationEnd = 100;
    function animate(){
        c.clearRect(0, 0, canvas.width, canvas.height);
        drawGrids(gridData,c);
        staticWallsIndex.forEach((index)=>{
            drawOnIndex(gridData,c,index);
        })
        addParticlesThroughInlet();
        particlesOnOutlet = returnParticlesTouchingOutlet();
        if(maxFlow<particlesOnOutlet){
            maxFlow = particlesOnOutlet;
            console.log(`Max Flow: ${maxFlow}`);
        }
        if(sustainedIterationStart<sustainedIterationEnd){
            sustainedFlow += particlesOnOutlet
            sustainedIterationStart++
        }
        else{
            sustainedIterationStart = 0;
            if(maxSustainedFlow<sustainedFlow){
                maxSustainedFlow = sustainedFlow;
                console.log(`Max Sustained Flow: ${maxSustainedFlow}`);
            }
            console.log(`Sustained Flow: ${sustainedFlow}`)
        }
        particlesData.forEach((particle)=>{
            if(particle.type == 'particle'){
                drawOnIndex(gridData,c,particle.index,'red');
                particle.updateParticle(particlesData);
            }
            else if(particle.type == 'inlet'){
                drawOnIndex(gridData,c,particle.index,'yellow');
            }else if(particle.type == 'outlet'){
                drawOnIndex(gridData,c,particle.index,'orange');
            }else if(particle.type == 'walls'){
                drawOnIndex(gridData,c,particle.index,'black');
            }
        }
        )
        drawOnIndex(gridData,c,gridIndexOnMouseHover(gridData,mouseX,mouseY));
        particlesData = removeEscapedParticles(particlesData,gridStats);
        // console.log(particlesData.length);
    };
    let bestArr = [];
    let bestMaxSustainedFlow = 0;
    machineLearning(true);
    setInterval(animate,1);
    function machineLearning(firstcall){
        if (firstcall){
            randomWalls = [];
            let sparsity = 100;
            for(let i=gridStats.gridRowNum;i<=(gridStats.gridRowNum)*(gridStats.gridRowNum-1);i++){
                if(getRndInteger(1,sparsity)==1){
                    randomWalls.push(i);
                }
            }
        }
        if(!firstcall){
            {let moveExistingWalls = 2;let addIntensity = 1;let deleteIntensity = 10000;
                for(let i=gridStats.gridRowNum;i<=(gridStats.gridRowNum)*(gridStats.gridRowNum-1);i++){
                    randomWalls.forEach((existing)=>{
                        if(existing==i){
                            if(getRndInteger(1,deleteIntensity)==1){
                                randomWalls = randomWalls.filter((value)=>{return (value !== existing)});
                            }else{   
                                if(getRndInteger(1,moveExistingWalls)==1){
                                    if(getRndInteger(1,addIntensity)!==1){
                                        randomWalls = randomWalls.filter((value)=>{return (value !== existing)});
                                    }
                                    let randInt = getRndInteger(1,8);
                                    switch (randInt){
                                        case 1:
                                            randomWalls.push(existing+1);
                                            break;
                                        case 2:
                                            randomWalls.push(existing-1);
                                            break;
                                        case 3:
                                            randomWalls.push(existing+(gridStats.gridRowNum-1));
                                            break;
                                        case 4:
                                            randomWalls.push(existing-gridStats.gridRowNum);
                                            break;
                                        case 5:
                                            randomWalls.push(existing-gridStats.gridRowNum+1);
                                            break;
                                        case 6:
                                            randomWalls.push(existing-gridStats.gridRowNum-1);
                                            break;
                                        case 7:
                                            randomWalls.push(existing+gridStats.gridRowNum+1);
                                            break;
                                        case 8:
                                            randomWalls.push(existing-gridStats.gridRowNum-1);
                                            break;
                                        }
                                    }
                                }
                            }
                        })
                }
            }
        }
        outlets.forEach((index)=>{
            randomWalls = randomWalls.filter((wallValue)=>{return wallValue!=index})
        })
        inlets.forEach((index)=>{
            randomWalls = randomWalls.filter((wallValue)=>{return wallValue!=index})
        })
        if(bestMaxSustainedFlow < maxSustainedFlow){
            bestMaxSustainedFlow = maxSustainedFlow
            bestArr = [...randomWalls]
        }
        particlesData = [];
        inlets = [];
        outlets = [];
        addInlet();
        addOutlet();
        maxFlow = 0;
        maxSustainedFlow = 0;
        sustainedFlow = 0;
        sustainedIterationStart = 0;
        sustainedIterationEnd = 100;
        addWalls(randomWalls);
        if(bestArr.length != 0){
            randomWalls = bestArr;
        }
    }
    setInterval(machineLearning,30000)
}
function gridIndexOnMouseHover(gridData,mouseX,mouseY){
    let indexData = -1;
    gridData.some((grid)=>{
            const checkIntersection = mouseX>=grid.xMin && mouseX<=grid.xMax && mouseY>=grid.yMin && mouseY<=grid.yMax;   
            if(checkIntersection){
                indexData = grid.index;
            }else{
                indexData = -1;
            }
            return checkIntersection;
        })
        return indexData;
}
function drawGrids(gridData,canvasContext){
    gridData.forEach((grid)=>{
        canvasContext.beginPath();
        canvasContext.lineWidth = 1;
        canvasContext.strokeStyle = 'blue'
        canvasContext.rect(grid.xMin,grid.yMin,grid.xMax-grid.xMin,grid.yMax-grid.yMin)
        canvasContext.stroke();
        // canvasContext.drawImage(
        //     myImg, // Specifies the image, canvas, or video element to use
        //     0, //	Optional. The x coordinate where to start clipping
        //     0, //	Optional. The y coordinate where to start clipping
        //     32, //	Optional. The width of the clipped image
        //     32, //	Optional. The height of the clipped image
        //     x, //	The x coordinate where to place the image on the canvas
        //     y, //	The y coordinate where to place the image on the canvas
        //     size, // Optional. The width of the image to use (stretch or reduce the image)
        //     size  //	Optional. The height of the image to use (stretch or reduce the image)
        //     );
    })
}
function drawOnIndex(gridData,canvasContext,index,color = 'black'){
    // console.log(gridData,index);
    gridData.forEach((grid)=>{
        if(grid.index == index){
            canvasContext.fillStyle = color;
            canvasContext.fillRect(grid.xMin,grid.yMin,grid.xMax-grid.xMin,grid.yMax-grid.yMin)
            // canvasContext.drawImage(
            //     myImg, // Specifies the image, canvas, or video element to use
            //     0, //	Optional. The x coordinate where to start clipping
            //     0, //	Optional. The y coordinate where to start clipping
            //     32, //	Optional. The width of the clipped image
            //     32, //	Optional. The height of the clipped image
            //     x, //	The x coordinate where to place the image on the canvas
            //     y, //	The y coordinate where to place the image on the canvas
            //     size, // Optional. The width of the image to use (stretch or reduce the image)
            //     size  //	Optional. The height of the image to use (stretch or reduce the image)
            //     );
        }
    })
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}







