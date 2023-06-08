let portPool = [];

onconnect = function(e) {
	const port = e.ports[0];
	portPool.push(port);
    let IsMain = false;
    port.onmessage = (e) => {
        if(typeof e.data == "object"){
            switch (e.data.code) {
                case 1:
                break;
                default:
                    console.log(e.data);
                break;
            }
        }else{
            console.log(e.data);
        }
        portPool.forEach(ports => {
            if(ports !== port){
                ports.postMessage(e.data);
            }
        })
    };
}