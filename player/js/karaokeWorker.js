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
        if (e.data === 'Main Close' || e.data === 'SecondScreen Close') {
            const index = e.ports.findIndex(p => p === port);
            portPool.splice(index, 1);
        }else{
            if (e.data === 'Main Load') {
                IsMain = true;
            }
            portPool.forEach(ports => {
                if(ports !== port){
                    ports.postMessage(e.data);
                }
            })
        }
    };
}