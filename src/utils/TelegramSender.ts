import https from 'https';

export async function sendToUser(token:string,userId:number,text:string):Promise<void>{
    
    const body = JSON.stringify({chat_id:userId,text,parse_mode:'HTML'});
    const urlObj = new URL(`https://api.telegram.org/bot${token}/sendMessage`);
    
    await new Promise<void>((resolve)=>{
        
        const req = https.request({
            
            hostname:urlObj.hostname,port:443,path:urlObj.pathname,
            method:'POST',
            headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}
            
        },()=>resolve());
        
        req.setTimeout(8_000,()=>{req.destroy();resolve();});
        req.on('error',()=>resolve());
        req.write(body);
        req.end();
        
    });
    
}

export async function sendToLogChannel(token:string,channelLogId:number,text:string):Promise<void>{
    
    const body   = JSON.stringify({ chat_id: channelLogId, text, parse_mode: 'HTML' });
	const urlObj = new URL(`https://api.telegram.org/bot${token}/sendMessage`);
 
	await new Promise<void>((resolve) => {
		const req = https.request({
			hostname: urlObj.hostname, port: 443, path: urlObj.pathname,
			method:   'POST',
			headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
		}, () => resolve());
		req.setTimeout(5_000, () => { req.destroy(); resolve(); });
		req.on('error', () => resolve());
		req.write(body);
		req.end();
	});
    
}
