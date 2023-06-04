#!/usr/bin/env node
//@DNetL
const cpath = './config.txt';
const fs = require('fs');
const net=require('net');
const https = require('https');
const {WebSocket, createWebSocketStream}=require('ws');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);
const opts={}, cache={};

const CIDR4=['173.245.48.0/20','103.21.244.0/22','103.22.200.0/22','103.31.4.0/22','141.101.64.0/18','108.162.192.0/18','190.93.240.0/20',
'188.114.96.0/20','197.234.240.0/22','198.41.128.0/17','162.158.0.0/15','104.16.0.0/13','104.24.0.0/14','172.64.0.0/13', '131.0.72.0/22'];
const CIDR6=['2400:cb00::/32','2606:4700::/32','2803:f800::/32','2405:b500::/32','2405:8100::/32','2a06:98c0::/29','2c0f:f248::/32'];

const ADDR4=CIDR4.map(cidr=>{
	const [addr, mask]=cidr.split('/');
	return {
		m: (0xffffffff<<32-Number(mask))>>>0,
		a: addr.split('.').map(Number).reduce((s,b,i)=>s+=(b<<24-8*i),0)
	}
});
const ADDR6=CIDR6.map(cidr=>{
	const [addr, mask]=cidr.split('/');
	return {m: mask, s: addr.split(':').map(p=>parseInt(p,16).toString(2).padStart(16,'0')).join('').slice(0,mask)}
});
const ipInCidr=ip=>{
	if(ip.indexOf(':')==-1){
		const ipa=ip.split('.').map(Number);
		return ADDR4.some(({a,m})=>(ipa.reduce((s,b,i)=>s+=(b<<24-8*i),0)&m)===(a&m));
	}else {
		const ips=ip.split(':').map(p=>parseInt(p,16).toString(2).padStart(16,'0')).join('');
		return ADDR6.some(({s,m})=>ips.slice(0, m)===s);
	}
}

const dns= host=>new Promise((res, rej)=>{
	const o=Object.assign({method:'GET', headers:{'Accept':'application/dns-json'}}, opts);
	const request=https.request(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`,o, r=>{
		let data='';
		r.on('data', chunk=>data += chunk).on('end', ()=>{
			const d=JSON.parse(data);
			if(d.Status===0 && d.Answer && d.Answer.length>0) res(d.Answer.map(a=>a.data));
			else rej(new Error('no ipv4 addr'));
		});
	}).on('error',error=>rej(error)).end();
});
const isCFIP= (host,ATYP)=>new Promise((res,rej)=>{
	if(cache[host]==undefined){
		if(ATYP==0x01||ATYP==0x04) res(cache[host]=ipInCidr(host));
		else if(ATYP==0x03)	dns(host).then(ips=>res(cache[host]=ips.some(ip=>ipInCidr(ip)))).catch(e=>res(cache[host]=false));
	}else res(cache[host]);
});

const socks= async({domain,psw,sport=1080,sbind='127.0.0.1',wkip,byip})=>{
	if(wkip) Object.assign(opts,{lookup:(host,opts,cb)=>cb(null,wkip,wkip.indexOf(':')==-1?4:6)});
	const url='wss://'+domain;	
	net.createServer(socks=>socks.once('data', data=>{
		const [VERSION]=data;//VERSION NMETHODS METHODS
		if (VERSION!=0x05) socks.end();
		else if(data.slice(2).some(method=>method==0x00)){//0x00,0x02
			socks.write(Buffer.from([0x05, 0x00]));//select
			socks.once('data', head=>{
				const [VERSION,CMD,RSV,ATYP]=head;
				if(VERSION!=0x05 || CMD!=0x01) return;//connect
				const host= ATYP==0x01? head.slice(4,-2).map(b=>parseInt(b,10)).join('.')://IPV4
					(ATYP==0x04? head.slice(4,-2).reduce((s,b,i,a)=>(i%2?s.concat(a.slice(i-1,i+1)):s), []).map(b=>b.readUInt16BE(0).toString(16)).join(':')://IPV6
					(ATYP==0x03? head.slice(5,-2).toString('utf8'):''));//DOMAIN
				const port= head.slice(-2).readUInt16BE(0);

				isCFIP(host,ATYP).then(cf=>{
					new Promise((res,rej)=>{
						if(cf && !byip) net.connect(port, wkip?wkip:host, function(){res(this);}).on('error',rej);
						else new WebSocket(url, opts).on('open', function(e){
							this.send(JSON.stringify({hostname:cf?byip:host, port, psw}));
							res(createWebSocketStream(this));
						}).on('error',e=>rej);
					}).then(s=>{
						socks.write((head[1]=0x00,head));
						logcb('conn: ')(host,port);
						socks.pipe(s).on('error',e=>errcb('E1:')(e.message)).pipe(socks).on('error', e=>errcb('E2:')(e.message));
					}).catch(e=>{
						errcb('connect-catch:')(e.message);
						socks.end((head[1]=0x03,head));
					});
				});

			});
		} else socks.write(Buffer.from([0x05, 0xff]));//reject
		}).on('error', e=>errcb('socks-err:')(e.message))
	).listen(sport,sbind,logcb(`server start on: ${sbind}:${sport}`)).on('error',e=>errcb('socks5-err')(e.message));
}
fs.exists(cpath, e=>{
	if(e) socks(JSON.parse(fs.readFileSync(cpath)));
	else console.error('当前程序的目录没有config.txt文件!');
});
