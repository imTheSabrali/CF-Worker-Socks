import { connect } from 'cloudflare:sockets';
const passwd='passwd value';
export default{async fetch(request){
  const upgradeHeader=request.headers.get("Upgrade");
  if(upgradeHeader!=="websocket") return new Response(null, {status:404});
  const [client, server]=Object.values(new WebSocketPair());
  server.accept();
  server.addEventListener('message',({data})=>{
    try{
      const {hostname,port,psw}=JSON.parse(data);
      if(passwd!=psw) throw 'Illegal-User';
      const socket=connect({hostname,port});
      new ReadableStream({
        start(controller){
          server.onmessage= ({data})=>controller.enqueue(data);
          server.onerror=e=>controller.error(e);
          server.onclose=e=>controller.close(e);
        },
        cancel(reason){server.close();}
      }).pipeTo(socket.writable);
      socket.readable.pipeTo(new WritableStream({
        start(controller){server.onerror=e=>controller.error(e);},
        write(chunk){server.send(chunk);}
      }));
    }catch(error){ server.close(); }
  },{once:true});
  return new Response(null, {status:101, webSocket:client});
}}